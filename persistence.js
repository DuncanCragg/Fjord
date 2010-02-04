
var sys = require('sys');

var Dirty = require('./dirty').Dirty;

var Persistence = { };

Persistence.init = function(config){
    this.dbFileName = (config && config.dbFileName) || "./fjord.db";
    this.db = new Dirty(this.dbFileName, { flushInterval: 10 });
    this.db.load().addCallback(Persistence.dbload);
    sys.puts("DB file is "+this.dbFileName);
}

Persistence.dbload = function(){
}

Persistence.save = function(o){
    if(this.db) this.db.set(o.owid, o);
}

Persistence.get = function(owid){
    return this.db? this.db.get(owid): null;
}

Persistence.close = function(){}

exports.Persistence = Persistence;

