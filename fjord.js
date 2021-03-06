
var util = require('util');
var assert = require('assert');

if(typeof(Persistence)=='undefined'){
var persistence = require('./persistence');
var Persistence = persistence.Persistence;
}

if(typeof(Networking)=='undefined'){
var networking = require('./networking');
var Networking = networking.Networking;
}

// -----------------------------------------------------------------------

var Cache = { "runRulesQueue": [] };

Cache.notifyRefsChanged = function(o){
    if(!o.url) this.notifyLocal(o);
    else
    if(o.etag) this.notifyRefsRemote(o);
}

Cache.notifyStateChanged = function(o){
    var canos = {};
    for(var owid in o.notify){
        var or = this[owid];
        if(!or.cachenotify) this.notifyLocal(or);
        else canos[or.cachenotify]=true;
    }
    for(var owid in o.refs){
        var or = this[owid];
        if(!or.cachenotify) this.notifyLocal(or);
        else canos[or.cachenotify]=true;
    }
    var canol = getTagsFromHash(canos);
    if(canol.length) this.notifyStateRemote(o, canol);
}

Cache.notifyLocal = function(o){
    addIfNotIn(this.runRulesQueue, o.owid);
}

Cache.notifyStateRemote = function(o, canol){
    Networking.push(o, canol);
}

Cache.runRulesOnNotifiedObjects = function(){
    while(this.runRulesQueue.length){
        var nq = this.runRulesQueue;
        this.runRulesQueue=[];
        for(var i=0; i< nq.length; i++) this[nq[i]].runRules();
    }
}

Cache.put = function(o){
    this[o.owid]=o;
    Persistence.sync(o);
}

Cache.get = function(owid, localonly){
    var o = this[owid];
    if(o && o.url && !o.etag && !localonly) Networking.get(o.url);
    if(!o){
        o = Persistence.get(owid);
        if(o) this[owid] = o;
        else if(!localonly){
            o = WebObject.createShell(owid);
            Networking.get(owid);
        }
    }
    return o;
}

Cache.notifyRefsRemote = function(o){
    this.pollAndRefer(o);
}

Cache.pollObject = function(owid){
    var o = this[owid];
    Networking.get(o.url, o.etag);
}

Cache.pollAndRefer = function(o){
    Networking.get(o.url, o.etag, getTagsFromHash(o.refs));
}

Cache.refShell = function(owid, url, cano){
    var o=this[owid];
    if(!o) o=WebObject.createShell(owid);
    o.url=url;
    o.cachenotify=cano;
}

Cache.pull = function(owid, refs){
    var o = this.get(owid);
    if(refs){
        o.ensureRefs(refs);
        this.notifyRefsChanged(o);
        this.runRulesOnNotifiedObjects();
    }
    return o;
}

Cache.push = function(owid, etag, url, cano, content){
    var o = Cache.get(owid, "localonly");
    if(!o){ log("Cache.push on non-local object: "+owid+":\n",content); return; }
    if(o.etag < etag){
        var isShell = !o.etag;
        if(url)  o.url = url;
        if(cano) o.cachenotify=cano;
        o.etag = etag;
        o.content = content;
        Persistence.sync(o);
        this.notifyStateChanged(o);
        this.runRulesOnNotifiedObjects();
        if(isShell) this.notifyRefsRemote(o);
    }
}

Cache.evict = function(owid){
    delete this[owid];
}

Cache.createWebObject = function(data){
    if(!data) return null;
    var od;
    try{ od = JSON.parse(data); } catch(e) { util.puts("Ooops! corrupt db data: \n"+e+"\n"+data); return null; }
    var o = new WebObject(od.content, od.rules);
    o.owid = od.owid;
    o.etag = od.etag;
    return o;
}

exports.Cache = Cache;

// -----------------------------------------------------------------------

WebObject.create = function(content, rules){
    var o = new WebObject(content, rules);
    Cache.put(o);
    if(rules){
        Cache.notifyLocal(o);
        Cache.runRulesOnNotifiedObjects();
    }
    return o.owid;
}

WebObject.createShell = function(owid){
    var o = new WebObject();
    o.owid = owid;
    Cache.put(o);
    return o;
}

function WebObject(content, rules){
    this.owid = owid();
    if(rules) this.rules = rules;
    this.refs = {};
    this.notify = {};
    var isShell = !content;
    if(isShell){
        this.url=null;
        this.cachenotify=null;
        this.etag = 0;
        this.content = {};
    }
    else
    if(content.constructor===String){
        this.outlinks = {};
        this.etag = 1;
        this.content = JSON.parse(content);
    }
    else
    if(content.constructor===Object){
        this.outlinks = {};
        this.etag = 1;
        this.content = content;
    }
    else this.content = {};
}

WebObject.prototype.runRules = function(){

    if(!this.rules) return;

    this.newlinks={};

    for(var i=0; i< this.rules.length; i++) Cache.get(this.rules[i]).applyTo(this);

    for(var owid in this.outlinks){
        if(this.newlinks[owid]===undefined){
            var o=Cache[owid];
            delete o.refs[this.owid];
            Cache.notifyRefsChanged(o);
        }
    }
    for(var owid in this.newlinks){
        if(this.outlinks[owid]===undefined){
            var o=Cache[owid];
            o.refs[this.owid]=true;
            Cache.notifyRefsChanged(o);
        }
    }
    this.outlinks=this.newlinks;
    delete this.newlinks;

    if(this.modified){
        delete this.modified;
        this.etag++;
        Persistence.sync(this);
        Cache.notifyStateChanged(this);
        if(WebObject.logUpdates) util.puts("------------------\n"+JSON.stringify(this));
    }
}

WebObject.prototype.ensureRefs = function(refs){
    for(var i in refs) this.refs[refs[i]]=true;
}

WebObject.prototype.applyTo = function(that){

    that.content["%owid"]=that.owid;
    that.content["%etag"]=that.etag+"";
    that.content["%refs"]=getTagsFromHash(that.refs);
    that.content["%notify"]=getTagsFromHash(that.notify);

    var applyjson=new Applier(this.content, that.content, { "%owid": that.owid }, that.newlinks).apply();
    if(applyjson!=null && applyjson!==that.content){ that.content = applyjson; that.modified=true; }

    that.notify=getHashFromTags(that.content["%notify"]);
    delete that.content["%notify"];
    delete that.content["%refs"];
    delete that.content["%etag"];
    delete that.content["%owid"];

    return that;
}

WebObject.prototype.apply = function(rule){ return rule.applyTo(this); }

WebObject.prototype.toString = function(){ return JSON.stringify(this.content); }

WebObject.prototype.equals = function(that){ return deepEqual(this.content, that.content); }

exports.WebObject = WebObject;

// -----------------------------------------------------------------------

function Applier(json1, json2, bindings, newlinks){
    this.json1=json1;
    this.json2=json2;
    this.bindings=bindings;
    this.newlinks=newlinks;
}

Applier.prototype.apply = function(){ return this.applyJSON(this.json1, this.json2, this.bindings); }

Applier.prototype.cacheGET = function(owid){
    var o=Cache.get(owid);
    if(!o) return null;
    if(this.newlinks) this.newlinks[owid]=true;
    j=o.content;
    j["%owid"]=owid;
    return j;
}

Applier.prototype.applyJSON = function(j1, j2, bindings){
    if(j2===undefined) return null;
    var a2=null;
    var t1=j1? j1.constructor: null;
    var t2=j2? j2.constructor: null;
    if(t1===String && j1[0]=='/') { var r = this.slashApply(j1, j2, bindings); if(r!=null) return r; }
    if(t1!==Array && t2===Array){ j1=[ j1 ]; t1=Array; }
    if(t1===Object && t2===String && j2.substring(0,5)=='owid-'){
        a2=this.cacheGET(j2);
        t2=Object;
    }
    if(t1!==t2) return null;
    if(t1===Array)  return this.applyToArray(j1, j2, a2, bindings);
    if(t1===Object) return this.applyToObject(j1, j2, a2, bindings);
    return j1==j2? j2: null;
}

Applier.prototype.applyToArray = function(j1, j2, a2, bindings){
    var j3=null;
    var k1=0;
    var onepass=false;
    var it=0;
    var previt=bindings.iteration;
    var ourbind = this.deeperObjectCopy(bindings);
    for(var k2=0; k2<j2.length; k2++){
        ourbind.iteration=it;
        var v1 = j1[k1];
        var v2 = j2[k2];
        var v3=this.applyJSON(v1, v2, ourbind);
        if(v3==null) continue;
        k1++;
        if(k1==j1.length){
            onepass=true;
            k1=0;
            it++;
        }
        if(v3.modified || v3!=v2){
            delete v3.modified;
            if(j3==null) j3=this.shallowArrayCopy(j2);
            j3[k2]=v3;
        }
    }
    this.mergeBindings(bindings, ourbind);
    bindings.iteration=previt;
    if(!onepass) return null;
    return j3? j3: j2;
}

Applier.prototype.applyToObject = function(j1, j2, a2, bindings){
    var j3=null;
    var y2=a2? a2: j2;
    var ourbind = this.deeperObjectCopy(bindings);
    for(var k in j1){
        var v1 = j1[k];
        var v2 = y2[k]; if(v2===null) v2="";
        var v3=this.applyJSON(v1, v2, ourbind);
        if(v3==null){ if(a2) delete a2["%owid"]; return null; }
        if(a2) continue;
        if(v3.modified || v3!=v2){
            delete v3.modified;
            if(j3==null) j3=this.shallowObjectCopy(j2);
            j3[k]=v3;
        }
    }
    this.mergeBindings(bindings, ourbind);
    if(a2) delete a2["%owid"];
    return j3? j3: j2;
}

Applier.prototype.shallowObjectCopy = function(obj){
    var r = {};
    for(var k in obj) r[k] = obj[k];
    return r;
}

Applier.prototype.shallowArrayCopy = function(arr){
    var r = [];
    for(var k=0; k< arr.length; k++) r[k] = arr[k];
    return r;
}

Applier.prototype.deeperObjectCopy = function(obj){
    var r = {};
    for(var k in obj){
        if(obj[k] && obj[k].constructor===Array) r[k] = this.shallowArrayCopy(obj[k]);
        else r[k] = obj[k];
    }
    return r;
}

Applier.prototype.mergeBindings = function(o1, o2){
    for(var k in o2){
        if(k=='iteration') continue;
        if(o1[k] && o1[k].constructor===Array){
            if(o2[k].constructor===Array){
                for(var l in o2[k]) addIfNotIn(o1[k], o2[k][l]);
            }
            else addIfNotIn(o1[k], o2[k]);
        }
        else o1[k] = o2[k];
    }
}

var slashRE = new RegExp("^/([^/]*)/((.*)/)?$", "g");

Applier.prototype.slashApply = function(slashpattern, lhs, bindings){
    slashRE.lastIndex=0;
    var ra = slashRE.exec(slashpattern);
    if(!ra) return null;
    lhm = ra[1];
    rhs = ra[3];
    var ands = lhm.split(';');
    for(var i=0; i< ands.length; i++){
        var and = ands[i];
        if(and==''){
            continue;
        }
        if(and[0]=='$'){
            if(!this.handleBindings(and, lhs, bindings)) return null;
            continue;
        }
        if(and=='null'){
            if(lhs.length!=0) return null;
            continue;
        }
        if(and=='number'){
            if(!/^[0-9]+[\.]*[0-9]*$/.test(lhs)) return null;
            continue;
        }
        if(and=='array'){
            if(lhs.constructor!==Array) return null;
            continue;
        }
        if(and=='object'){
            if(lhs.constructor!==Object) return null;
            continue;
        }
        if(and=='string'){
            if(lhs.constructor!==String) return null;
            continue;
        }
        if(and=='owid'){
            if(lhs.constructor!==String) return null;
            if(!/^owid-[-0-9a-f]+$/.test(lhs)) return null;
            continue;
        }
        var lt = and.indexOf('lt(')==0;
        var gt = and.indexOf('gt(')==0;
        if(lt || gt){
            if(lhs.constructor!==String) return null;
            var close = and.indexOf(')'); if(close == -1) return null;
            var arg = and.substring(3, close);
            if(arg[0]=='$') arg = bindings[arg.substring(1)];
            if(!arg) return null;
            if(gt && parseFloat(lhs) <= parseFloat(arg)) return null;
            if(lt && parseFloat(lhs) >= parseFloat(arg)) return null;
            continue;
        }
        if(!(lhs.constructor===String && lhs.match('^'+and+'$'))) return null;
    }
    return rhs? this.resolve(lhs, rhs, bindings): lhs;
}

Applier.prototype.handleBindings = function(and, lhs, bindings){
    var variable = and.substring(1);
    if(variable=='iteration') variable='_iteration';
    var val = bindings[variable];
    var it=bindings.iteration;
    if(it==undefined || it==null ){
        if(!val){ bindings[variable] = lhs; val=bindings[variable]; }
        else
        if(val.constructor===Array && lhs.constructor!==Array){
            if(!isin(val, lhs)) return false;
        }
        else if(val!=lhs) return false;
    }
    else{
        if(!val){ bindings[variable] = [ ]; val=bindings[variable]; }
        if(val.constructor===Array){
            if(!val[it]){ val[it] = lhs; }
            else if(val[it]!=lhs) return false;
        }
        else if(val!=lhs) return false;
    }
    return true;
}

Applier.prototype.resolve = function(lhs, rhs, bindings){
    rhs=this.resolveBindings(rhs, bindings);
    if(/^has\(/.test(rhs))  return this.resolveHas(lhs, rhs);
    if(/^add!\(/.test(rhs)) return this.resolveAdd(lhs, rhs);
    rhs = evaluate(rhs);
    rhs.modified=true;
    return rhs;
}

Applier.prototype.resolveBindings = function(rhs, bindings){
    var re=/\$[A-Za-z0-9]+/g;
    var matches;
    while((matches = re.exec(rhs))!=null){
        var variable = matches[0].substring(1);
        var val = bindings[variable];
        if(!val){ util.puts("** No binding for $"+variable); continue; }
        if(val.constructor===Array && val.length==1) val=val[0];
        rhs=rhs.replace("$"+variable, JSON.stringify(val), "g");
    }
    return rhs;
}

Applier.prototype.resolveHas = function(lhs, rhs){
    var arg=rhs.substring(4,rhs.length-1);
    arg = evaluate(arg);
    if(lhs.constructor!==Array) return lhs;
    if(arg.constructor!==Array) arg = [ arg ];
    for(var i=0; i< arg.length; i++){
        if(!addIfNotIn(lhs, arg[i])) continue;
        lhs.modified=true;
    }
    return lhs;
}

Applier.prototype.resolveAdd = function(lhs, rhs){
    var arg=rhs.substring(5,rhs.length-1);
    arg = evaluate(arg);
    if(lhs.constructor!==Array) return lhs;
    if(arg.constructor!==Array) arg = [ arg ];
    lhs = lhs.concat(arg);
    lhs.modified=true;
    return lhs;
}

// -----------------------------------------------------------------------

exports.init = function(config){
    Persistence.init(Cache, config);
    Networking.init(Cache, config);
}

exports.close = function(){
    Networking.close();
    Persistence.close();
    process.exit();
}

// -----------------------------------------------------------------------

function evaluate(expression){
    try{
        var evaled=eval('('+expression+')'); // evalcx
        if(evaled.constructor===Array || evaled.constructor===Object){
            expression=evaled;
        }
        else expression=""+evaled;
    }catch(e){}
    return expression;
}

function isin(arr, item){
    for(var i=0; i< arr.length; i++) if(arr[i]==item) return true;
    return false;
}

function addIfNotIn(arr, item){
    if(!isin(arr, item)){ arr.push(item); return true; }
    return false;
}

function removeFrom(arr, item){
    for(var i=0; i<arr.length; i++) { 
        if(arr[i]==item) arr.splice(i,1);
    } 
}

function getTagsFromHash(o){
    var r=[];
    for(var i in o) if(i.constructor===String) r.push(i);
    return r;
}

function getHashFromTags(l){
    var r={};
    for(var i=0; i<l.length; i++) r[l[i]]=true;
    return r;
}

function deepEqual(o1, o2){
    var ok = false;
    try{ assert.deepEqual(o1, o2); ok = true; }catch(e){}
    return ok;
}

function log(message, value){
    util.puts("------------------\n"+message+" "+(value!=null? JSON.stringify(value): ""));
}

exports.log = log;

// -----------------------------------------------------------------------

// Math.uuidFast
function owid() {
   return ("owid-"+fourHex()+"-"+fourHex()+"-"+fourHex()+"-"+fourHex());
}

function fourHex() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

// -----------------------------------------------------------------------
// Functions useful in rules

function max(v){
    if(v.constructor!==Array) return v;
    var max=v[0];
    for(var i=1; i<v.length; i++) if(v[i]>max) max=v[i];
    return max;
}

function min(v){
    if(v.constructor!==Array) return v;
    var min=v[0];
    for(var i=1; i<v.length; i++) if(v[i]<min) min=v[i];
    return min;
}

function fix(n,x){
    return Math.round(x*Math.pow(10,n))/Math.pow(10,n);
}

function number(n){
    return n.constructor===String? parseFloat(n): n;
}

// -----------------------------------------------------------------------

