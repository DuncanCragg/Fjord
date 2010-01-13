
var sys = require('sys');
var assert = require('assert');

// -----------------------------------------------------------------------

function WebObject(json){
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
}

exports.WebObject = WebObject;

// -----------------------------------------------------------------------

WebObject.prototype.equals = function(that){ 
    return deepEqual(this.json, that.json);
}

WebObject.prototype.applyTo = function(that){
    var jr = applyTo(this.json, that.json);
    return jr==null || jr===that.json? that: new WebObject(jr);
}

// -----------------------------------------------------------------------

WebObject.prototype.toString = function(){ return JSON.stringify(this.json); }

// -----------------------------------------------------------------------

function deepEqual(o1, o2){
    var ok = false;
    try{ assert.deepEqual(o1, o2); ok = true; }catch(e){}
    return ok;
}

function applyTo(j1, j2){
    var t1=j1? j1.constructor: null;
    var t2=j2? j2.constructor: null;
    if(t1===String && j1[0]=='/') { var r = slashApply(j1, j2); if(r!=null) return r; }
    if(t1!==Array && t2===Array){ j1=[ j1 ]; t1=Array; }
    if(t1!==t2) return null;
    if(t1===Array){
        var j3=null;
        var k1=0;
        var onepass=false;
        for(var k2=0; k2<j2.length; k2++){
            var v1 = j1[k1];
            var v2 = j2[k2];
            var v3=applyTo(v1, v2);
            if(v3==null) continue;
            k1++;
            if(k1==j1.length){
                onepass=true;
                k1=0;
            }
            if(v3==v2) continue;
            if(j3==null) j3=shallowArrayCopy(j2);
            j3[k2]=v3;
        }
        if(!onepass) return null;
        return j3? j3: j2;
    }
    if(t1===Object){
        var j3=null;
        for(var k in j1){
            var v1 = j1[k];
            var v2 = j2[k]; if(v2==null) v2="";
            var v3=applyTo(v1, v2)
            if(v3==null) return null;
            if(v3==v2) continue;
            if(j3==null) j3=shallowObjectCopy(j2);
            j3[k]=v3;
        }
        return j3? j3: j2;
    }
    return j1==j2? j2: null;
}

function shallowObjectCopy(obj){
    r = {};
    for(var k in obj) r[k] = obj[k];
    return r;
}

function shallowArrayCopy(arr){
    r = [];
    for(var k in arr) r[k] = arr[k];
    return r;
}

function slashApply(s1, j2){
    var m  =           s1.indexOf('/',1);
    var e  =(m != -1)? s1.indexOf('/',m+1): -1;
    var lhs=(m != -1)? s1.substring(1,m): s1.substring(1);
    var rhs=(e != -1)? s1.substring(m+1,e): null; 
    if(lhs=='null'){
        if(j2.length==0) return rhs? rhs: j2;
        return null;
    }
    if(lhs=='number'){
        if(/[0-9]*\.[0-9]*/.test(j2)) return rhs? rhs: j2;
        return null;
    }
    if(lhs=='array'){
        if(j2.constructor===Array) return j2;
        return null;
    }
    if(lhs=='object'){
        if(j2.constructor===Object) return j2;
        return null;
    }
    if(j2.constructor===String && lhs==j2) return rhs? rhs: j2;
    return null;
}

// -----------------------------------------------------------------------

