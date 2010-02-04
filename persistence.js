
var Dirty = require('./dirty').Dirty;

var Persistence = { };

Persistence.init = function(config){
    this.dbFileName = (config && config.dbFileName) || "./fjord.db";
    this.db = new Dirty(this.dbFileName, { flushInterval: 10 });
    this.db.load().addCallback(Persistence.dbload);
}

Persistence.dbload = function(){
}

Persistence.save = function(o){
    if(this.db) this.db.set(o.owid, o);
}

Persistence.get = function(owid){
    return this.db? this.db.get(owid): null;
}

exports.Persistence = Persistence;

