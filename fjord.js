
var sys = require('sys');
var assert = require('assert');

// -----------------------------------------------------------------------

var Cache = { "notifyqueue": [] };

Cache.notify = function(o){
    addIfNotIn(this.notifyqueue, o);
}

Cache.runRulesOnNotifiedObjects = function(){
    while(this.notifyqueue.length){
        var nq = this.notifyqueue;
        this.notifyqueue=[];
        for(var i in nq) nq[i].runRules();
    }
}

exports.Cache = Cache;

// -----------------------------------------------------------------------

function WebObject(json, rules){
    this.rules = rules;
    this.uid = uid();
    this.refs = [];
    if(!json) this.json = {};
    else
    if(json.constructor===String){
        this.json = JSON.parse(json);
    }
    else
    if(json.constructor===Object){
        this.json = json;
    }
    else this.json = {};
    Cache[this.uid]=this;
}

WebObject.create = function(json, rules){
    var o = new WebObject(json, rules);
    if(rules){
        Cache.notify(o);
        Cache.runRulesOnNotifiedObjects();
    }
    return o.uid;
}

exports.WebObject = WebObject;

// -----------------------------------------------------------------------

WebObject.prototype.equals = function(that){ 
    return deepEqual(this.json, that.json);
}

WebObject.prototype.applyTo = function(that){
    that.modified=false;
    that.json["%uid"]=that.uid;
    that.json["%refs"]=that.refs;
    var applyjson= applyTo(this.json, that.json, { "%uid": that.uid });
    if(applyjson!=null && applyjson!==that.json){ that.json = applyjson; that.modified=true; }
    delete that.json["%refs"];
    delete that.json["%uid"];
    return that;
}

WebObject.prototype.apply = function(rule){ return rule.applyTo(this); }

WebObject.prototype.runRules = function(){
    if(!this.rules) return;
    for(var i in this.rules) Cache[this.rules[i]].applyTo(this);
    if(this.modified){
        this.notifyRefs();
    }
}

WebObject.prototype.notifyRefs = function(){
    for(var i in this.refs) Cache.notify(Cache[this.refs[i]]);
}

// -----------------------------------------------------------------------

WebObject.prototype.toString = function(){ return JSON.stringify(this.json); }

// -----------------------------------------------------------------------

function cacheGET(uid, referer){
    var o=Cache[uid];
    if(!o) return null;
    if(addIfNotIn(o.refs, referer)) Cache.notify(o);
    j=o.json;
    j["%uid"]=uid;
    return j;
}

// -----------------------------------------------------------------------

function deepEqual(o1, o2){
    var ok = false;
    try{ assert.deepEqual(o1, o2); ok = true; }catch(e){}
    return ok;
}

function applyTo(j1, j2, bindings){
    var a2=null;
    var t1=j1? j1.constructor: null;
    var t2=j2? j2.constructor: null;
    if(t1===String && j1[0]=='/') { var r = slashApply(j1, j2, bindings); if(r!=null) return r; }
    if(t1!==Array && t2===Array){ j1=[ j1 ]; t1=Array; }
    if(t1===Object && t2===String && j2.substring(0,5)=='owid-'){
        a2=cacheGET(j2, bindings["%uid"]);
        t2=Object;
    }
    if(t1!==t2) return null;
    if(t1===Array)  return applyToArray(j1, j2, a2, bindings);
    if(t1===Object) return applyToObject(j1, j2, a2, bindings);
    return j1==j2? j2: null;
}

function applyToArray(j1, j2, a2, bindings){
    var j3=null;
    var k1=0;
    var onepass=false;
    var it=0;
    var previt=bindings.iteration;
    var ourbind = deeperObjectCopy(bindings);
    for(var k2=0; k2<j2.length; k2++){
        ourbind.iteration=it;
        var v1 = j1[k1];
        var v2 = j2[k2];
        var v3=applyTo(v1, v2, ourbind);
        if(v3==null) continue;
        k1++;
        if(k1==j1.length){
            onepass=true;
            k1=0;
            it++;
        }
        if(v3.modified || v3!=v2){
            delete v3.modified;
            if(j3==null) j3=shallowArrayCopy(j2);
            j3[k2]=v3;
        }
    }
    mergeBindings(bindings, ourbind);
    bindings.iteration=previt;
    if(!onepass) return null;
    return j3? j3: j2;
}

function applyToObject(j1, j2, a2, bindings){
    var j3=null;
    var y2=a2? a2: j2;
    var ourbind = deeperObjectCopy(bindings);
    for(var k in j1){
        var v1 = j1[k];
        var v2 = y2[k]; if(v2===null) v2="";
        var v3=applyTo(v1, v2, ourbind);
        if(v3==null){ if(a2) delete a2["%uid"]; return null; }
        if(a2) continue;
        if(v3.modified || v3!=v2){
            delete v3.modified;
            if(j3==null) j3=shallowObjectCopy(j2);
            j3[k]=v3;
        }
    }
    mergeBindings(bindings, ourbind);
    if(a2) delete a2["%uid"];
    return j3? j3: j2;
}

function shallowObjectCopy(obj){
    var r = {};
    for(var k in obj) r[k] = obj[k];
    return r;
}

function shallowArrayCopy(arr){
    var r = [];
    for(var k in arr) r[k] = arr[k];
    return r;
}

function deeperObjectCopy(obj){
    var r = {};
    for(var k in obj){
        if(obj[k] && obj[k].constructor===Array) r[k] = shallowArrayCopy(obj[k]);
        else r[k] = obj[k];
    }
    return r;
}

function mergeBindings(o1, o2){
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

function slashApply(slashpattern, lhs, bindings){
    slashRE.lastIndex=0;
    var ra = slashRE.exec(slashpattern);
    if(!ra) return null;
    lhm = ra[1];
    rhs = ra[3];
    var ands = lhm.split(';');
    for(var i in ands){
        var and = ands[i];
        if(and==''){
            continue;
        }
        if(and[0]=='$'){
            if(!handleBindings(and, lhs, bindings)) return null;
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
        if(!(lhs.constructor===String && lhs.match(and))) return null;
    }
    return rhs? resolve(lhs, rhs, bindings): lhs;
}

function handleBindings(and, lhs, bindings){
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

function resolve(lhs, rhs, bindings){
    rhs=resolveBindings(rhs, bindings);
    if(rhs.match(/^has\(/)) return resolveHas(lhs, rhs);
    rhs = evaluate(rhs);
    rhs.modified=true;
    return rhs;
}

function resolveBindings(rhs, bindings){
    var re=/\$[A-Za-z0-9]+/g;
    var matches;
    while((matches = re.exec(rhs))!=null){
        var variable = matches[0].substring(1);
        var val = bindings[variable];
        if(!val){ sys.puts("** No binding for $"+variable); continue; }
        if(val.constructor===Array && val.length==1) val=val[0];
        if(val.constructor!==String) val=JSON.stringify(val);
        rhs=rhs.replace("$"+variable, val, "g");
    }
    return rhs;
}

function resolveHas(lhs, rhs){
    var arg=rhs.substring(4,rhs.length-1);
    arg = evaluate(arg);
    if(lhs.constructor!==Array) return lhs;
    if(arg.constructor!==Array) arg = [ arg ];
    for(var i in arg){
        if(!addIfNotIn(lhs, arg[i])) continue;
        lhs.modified=true;
    }
    return lhs;
}

function evaluate(expression){
    try{
        var evaled=eval(expression);
        if(evaled.constructor===Array || evaled.constructor===Object){
            expression=evaled;
        }
        else expression=""+evaled;
    }catch(e){}
    return expression;
}

function isin(arr, item){
    for(var i in arr) if(arr[i]==item) return true;
    return false;
}

function addIfNotIn(arr, item){
    if(!isin(arr, item)){ arr.push(item); return true; }
    return false;
}

// -----------------------------------------------------------------------

function uid() {
   return ("owid-"+fourHex()+"-"+fourHex()+"-"+fourHex()+"-"+fourHex());
}

function fourHex() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

// -----------------------------------------------------------------------

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

// -----------------------------------------------------------------------

function log(message, value){
    sys.puts(message+JSON.stringify(value));
}

exports.log = log;

// -----------------------------------------------------------------------

