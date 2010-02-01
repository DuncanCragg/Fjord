
var Dirty = require('./dirty').Dirty;

var Persistence = { };

Persistence.init = function(){
    this.db = new Dirty('./fjord.db', { flushInterval: 10 });
    this.db.load().addCallback(Persistence.dbload);
}

Persistence.dbload = function(){
}

Persistence.save = function(o){
    this.db.set(o.owid, o);
}

Persistence.get = function(owid){
    return this.db.get(owid);
}

exports.Persistence = Persistence;

