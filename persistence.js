
// --------------------------------------------------------------------------
// Based on Felix Geisendörfer's http://github.com/felixge/node-dirty

var sys = require('sys');
var fs = require('fs');

var Cache = null;

exports.Persistence = {

init: function(cache, config){
    Cache = cache;

    this.dbFileName = (config && config.dbFileName) || "./fjord.db";

    this.objects = [];
    this.length = 0;
    this.index = {};

    this.flushInterval = (config && config.flushInterval) || 1;
    this.flushLimit =    (config && config.flushLimit)    || 5;
    this.flushOWIDs = [];
    this.flushLength = 0;
    this.flushQueueLength = 0;
    this.flushCallbacks = [];

    this.load(config && config.dbLoaded);

    sys.puts("DB file is "+this.dbFileName);
},

load: function(cb){
    var self = this;
    var buffer = '';
    var offset = 0;
    this.rfile = fs.createReadStream(this.dbFileName, { flags: 'r+', encoding: 'utf8', bufferSize: 16*1024 });
    this.rfile.addListener("data", function(chunk) {
        buffer += chunk;
        while((offset = buffer.indexOf("\n")) !== -1) {
            var o = Cache.createWebObject(buffer.substr(0, offset));
            if(o){
                if(!(o.owid in self.index)) self.length++;
                self.index[o.owid] = (self.objects.push(o)-1);
            }
            buffer = buffer.substr(offset+1);
        }
    });
    this.rfile.addListener("error", function(e) {
        sys.puts("could not read from persistence file '"+self.dbFileName+"'");
    });
    this.rfile.addListener("end", function() {
        if(cb) cb();
    });
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
        this.flush();
    } else if(cb) {
        this.flushCallbacks.push(function() { cb(o); });
    }
    if(!this.flushTimer && this.flushInterval && this.flushLength !== this.flushLimit){
        var self = this;
        this.flushTimer = setTimeout(function() { self.flush(); }, this.flushInterval);
    }
},

flush: function() {
    if(this.flushLength === 0) {
        // ok;
    }
    var self = this;
    var chunk = '';
    var length = this.flushOWIDs.length;
    var writePromises = 0;
    var done = {};
    this.flushQueueLength += length;

    this.wfile = fs.createWriteStream(this.dbFileName, { flags: 'a+', encoding: 'utf8', bufferSize: 16*1024 });
    this.wfile.addListener("drain", function() {
        writePromises--;
        if(writePromises === 0) {
            self.flushQueueLength -= length;
            self.flushCallbacks.forEach(function(cb) { cb(); });
            self.flushCallbacks = [];
            // ok;
        }
        if(self.flushQueueLength === 0 && self.flushLength === 0) {
            clearTimeout(self.flushTimer);
            self.flushTimer = null;
        }
    });
    this.wfile.addListener("error", function(e) {
        sys.puts("could not write to "+this.dbFileName);
    });
    this.flushOWIDs.forEach(function(owid, i) {
        if(!(owid in done)) {
            chunk += JSON.stringify(self.objects[self.index[owid]])+"\n";
        }
        done[owid] = true;
        if(chunk.length < 16*1024 && i < (length-1)) return;
        writePromises++;
        self.wfile.write(chunk);
        chunk = '';
    });
    this.flushOWIDs = [];
    this.flushLength = 0;
},

close: function() {
    clearTimeout(this.flushTimer);
    if(this.rfile) this.rfile.destroy();
    if(this.wfile) this.wfile.end();
}

};

