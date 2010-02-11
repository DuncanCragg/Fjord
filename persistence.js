
// --------------------------------------------------------------------------
// Based on Felix Geisendörfer's http://github.com/felixge/node-dirty

var sys = require('sys');
var File = require('file').File;

var Cache = null;

exports.Persistence = {

init: function(cache, config){
    Cache = cache;

    this.dbFileName = (config && config.dbFileName) || "./fjord.db";
    this.file = new File(this.dbFileName, 'a+', {encoding: 'utf8'});

    this.objects = [];
    this.length = 0;
    this.index = {};

    this.flushInterval = (config && config.flushInterval) || 1;
    this.flushLimit =    (config && config.flushLimit)    || 5;
    this.flushOWIDs = [];
    this.flushLength = 0;
    this.flushQueueLength = 0;
    this.flushCallbacks = [];

    var p = this.load();
    if(config && config.dbLoaded){
        p.addCallback(config.dbLoaded);
    }

    sys.puts("DB file is "+this.dbFileName);
},

load: function() {
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
                var o = Cache.createWebObject(buffer.substr(0, offset));
                if(!(o.owid in self.index)) self.length++;
                self.index[o.owid] = (self.objects.push(o)-1);
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
},

get: function(owid){
    if(!this.dbFileName) return null;
    return this.objects[this.index[owid]];
},

sync: function(o, cb) {
    if(!this.dbFileName) return;
    var owid = o.owid;
    if(this.index[owid] === undefined) this.length++;
    this.index[owid] = (this.objects.push(o)-1);
    this.flushOWIDs.push(owid);
    this.flushLength++;
    if(this.flushLength === this.flushLimit) {
        this.flush().addCallback(function() { if(cb) cb(o); });
    } else if(cb) {
        this.flushCallbacks.push(function() { cb(o); });
    }
    if(!this.flushTimer && this.flushInterval && this.flushLength !== this.flushLimit){
        var self = this;
        this.flushTimer = setTimeout(function() { self.flush(); }, this.flushInterval);
    }
},

flush: function() {
    var promise = new process.Promise();
    if(this.flushLength === 0) {
        promise.emitSuccess();
        return promise;
    }
    var self = this;
    var chunk = '';
    var length = this.flushOWIDs.length;
    var writePromises = 0;
    var done = {};
    this.flushQueueLength += length;

    this.flushOWIDs.forEach(function(owid, i) {
        if(!(owid in done)) {
            chunk += JSON.stringify(self.objects[self.index[owid]])+"\n";
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
            if(self.flushQueueLength === 0 && self.flushLength === 0) {
                clearTimeout(self.flushTimer);
                self.flushTimer = null;
            }
        });
        chunk = '';
    });
    this.flushOWIDs = [];
    this.flushLength = 0;

    return promise;
},

close: function() {
    clearTimeout(this.flushTimer);
    return this.file.close();
}

};

