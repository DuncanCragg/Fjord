
// --------------------------------------------------------------------------
// Based on Felix Geisendörfer's http://github.com/felixge/node-dirty

var sys = require('sys');
var File = require('file').File;

var Persistence = { };

Persistence.init = function(config){
    this.dbFileName = (config && config.dbFileName) || "./fjord.db";
    this.db = new PersistenceO(this.dbFileName, { flushInterval: 10 });
    this.db.load().addCallback(Persistence.dbload);
    sys.puts("DB file is "+this.dbFileName);
}

Persistence.dbload = function(){
}

Persistence.save = function(o){
    if(this.db) this.db.set(o);
}

Persistence.get = function(owid){
    return this.db? this.db.get(owid): null;
}

Persistence.close = function(){}

var PersistenceO = function(file, options) {

  process.EventEmitter.call(this);

  options = process.mixin({
    flushInterval: 10,
    flushLimit: 1000,
  }, options);

  this.file = new File(file, 'a+', {encoding: 'utf8'});
  this.objects = [];
  this.owids = {};
  this.memoryIds = [];
  this.flushInterval = options.flushInterval;
  this.flushCallbacks = [];
  this.flushLimit = options.flushLimit;
  this.memoryQueueLength = 0;
  this.flushQueueLength = 0;
  this.length = 0;
};

process.inherits(PersistenceO, process.EventEmitter);

PersistenceO.prototype.load = function() {
  var self = this;
  var promise = new process.Promise();
  var buffer = '';
  var offset = 0;
  var read = function() {
      self.file.read(16*1024).addCallback(function(chunk) {
        if(!chunk) {
          return promise.emitSuccess();
        }

        buffer += chunk;
        while((offset = buffer.indexOf("\n")) !== -1) {
          var o = JSON.parse(buffer.substr(0, offset));
          if(!(o.owid in self.owids) && !o.deleted) {
            self.length++;
          }
          if(o.deleted) {
            if(o.owid in self.owids) {
              self.objects.splice(self.owids[o.owid], 1);
              delete self.owids[o.owid];
            }
          } else {
            self.owids[o.owid] = (self.objects.push(o)-1);
          }
          buffer = buffer.substr(offset+1);
        }
        read();
      })
      .addErrback(function() {
        promise.emitError(new Error('could not read from '+self.file.filename));
      });
    }
  read();
  return promise;
};

PersistenceO.prototype.close = function() {
  clearTimeout(this.flushTimer);
  return this.file.close();
};

PersistenceO.prototype.set = function(o, cb) {

  var owid = o.owid;
  if(this.owids[owid] === undefined && !o.deleted) {
    this.length++;
  }
  this.owids[owid] = (this.objects.push(o)-1);
  if(!this.file) {
    process.nextTick(function() { cb(o); });
    return;
  }

  this.memoryIds.push(owid);
  this.memoryQueueLength++;

  if(this.memoryQueueLength === this.flushLimit) {
    this.flush().addCallback(function() { if(cb) cb(o); });
  } else if(cb) {
    this.flushCallbacks.push(function() { cb(o); });
  }

  if(!this.flushTimer && this.flushInterval && this.memoryQueueLength !== this.flushLimit){
    var self = this;
    this.flushTimer = setTimeout(function() { self.flush(); }, this.flushInterval);
  }
};

PersistenceO.prototype.empty = function() {
  this.owids = {};
  this.objects = [];
};

PersistenceO.prototype.flush = function() {
  var promise = new process.Promise();
  if(this.memoryQueueLength === 0 || !this.file) {
    promise.emitSuccess();
    return promise;
  }

  var
    self = this,
    chunk = '',
    length = this.memoryIds.length,
    writePromises = 0,
    done = {};

  this.flushQueueLength += length;

  this.memoryIds.forEach(function(owid, i) {
    if(!(owid in done)) {
      chunk += JSON.stringify(self.objects[self.owids[owid]])+"\n";
    }
    done[owid] = true;

    if(chunk.length < 16*1024 && i < (length-1))  return;

    writePromises++;
    self.file.write(chunk).addCallback(function() {
      writePromises--;
      if(writePromises === 0) {
        self.flushQueueLength -= length;
        self.flushCallbacks.forEach(function(cb) { cb(); });
        self.flushCallbacks = [];
        promise.emitSuccess();
      }

      if(self.flushQueueLength === 0 && self.memoryQueueLength === 0) {
        clearTimeout(self.flushTimer);
        self.flushTimer = null;
        self.emit('flush');
      }
    });

    chunk = '';
  });
  this.memoryIds = [];
  this.memoryQueueLength = 0;

  return promise;
};

PersistenceO.prototype.get = function(owid) {
  var o = this.objects[this.owids[owid]];
  return (o && o.deleted)? undefined: o;
};

PersistenceO.prototype.remove = function(owid, cb) {
  var self = this;

  delete this.objects[this.owids[owid]];

  this.length--;
  this.set({ owid: owid, deleted: true}, function() {
    delete self.objects[self.owids[owid]];
    delete(self.owids[owid]);
    if(cb) cb();
  });
};

exports.Persistence = Persistence;

