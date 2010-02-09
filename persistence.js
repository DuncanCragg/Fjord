
// --------------------------------------------------------------------------
// Based on Felix Geisendörfer's http://github.com/felixge/node-dirty

var sys = require('sys');
var File = require('file').File;

var Persistence = { };

Persistence.init = function(config, cb){
    this.dbFileName = (config && config.dbFileName) || "./fjord.db";
    this.file = new File(this.dbFileName, 'a+', {encoding: 'utf8'});
    this.objects = [];
    this.owids = {};
    this.memoryIds = [];
    this.flushInterval = (config && config.flushInterval) || 10;
    this.flushCallbacks = [];
    this.flushLimit = (config && config.flushLimit) || 1000;
    this.memoryQueueLength = 0;
    this.flushQueueLength = 0;
    this.length = 0;

    this.load().addCallback(cb);

    sys.puts("DB file is "+this.dbFileName);
}

Persistence.load = function() {
    var self = this;
    var promise = new process.Promise();
    var buffer = '';
    var offset = 0;
    var read = function(){
        self.file.read(16*1024)
        .addCallback(function(chunk) {
            if(!chunk)  return promise.emitSuccess();
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

Persistence.get = function(owid){
    if(!this.dbFileName) return null;
    var o = this.objects[this.owids[owid]];
    return (o && o.deleted)? undefined: o;
}

Persistence.sync = function(o, cb) {

    if(!this.dbFileName) return;

    var owid = o.owid;
    if(this.owids[owid] === undefined && !o.deleted) {
        this.length++;
    }
    this.owids[owid] = (this.objects.push(o)-1);

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

Persistence.flush = function() {
    var promise = new process.Promise();
    if(this.memoryQueueLength === 0) {
        promise.emitSuccess();
        return promise;
    }
    var self = this;
    var chunk = '';
    var length = this.memoryIds.length;
    var writePromises = 0;
    var done = {};

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
            }
        });

        chunk = '';
    });
    this.memoryIds = [];
    this.memoryQueueLength = 0;

    return promise;
};

Persistence.remove = function(owid, cb) {
    var self = this;
    delete this.objects[this.owids[owid]];
    this.length--;
    this.sync({ owid: owid, deleted: true}, function() {
        delete self.objects[self.owids[owid]];
        delete(self.owids[owid]);
        if(cb) cb();
    });
};

Persistence.empty = function() {
    this.owids = {};
    this.objects = [];
};

Persistence.close = function() {
    clearTimeout(this.flushTimer);
    return this.file.close();
};

exports.Persistence = Persistence;

