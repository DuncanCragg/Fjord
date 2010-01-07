
var sys = require('sys');
var assert = require('assert');

// -----------------------------------------------------------------------

function WebObject(json){
    this.json = JSON.parse(json);
}

exports.WebObject = WebObject;

// -----------------------------------------------------------------------

WebObject.prototype.equals = function(that){ 
    return deepEqual(this.json, that.json);
}

WebObject.prototype.match = function(that){
    return matchTerms(this.json, that.json)===that.json? that: null;
}

// -----------------------------------------------------------------------

WebObject.prototype.toString = function(){ return JSON.stringify(this.json); }

// -----------------------------------------------------------------------

function deepEqual(o1, o2){
    var ok = false;
    try{ assert.deepEqual(o1, o2); ok = true; }catch(e){}
    return ok;
}

function matchTerms(j1, j2){
    var t1=j1? j1.constructor: null;
    var t2=j2? j2.constructor: null;
    if(t1===String && j1[0]=='/') return slashMatch(j1, j2);
    if(t1!=t2) return null;
    if(t1===Array){
        var k1=0, k2=0;
        for(; k1<j1.length; k1++){
            for(; k2<j2.length; k2++){
                if(matchTerms(j1[k1], j2[k2])) break;
            }
            if(k2==j2.length) return null;
            k2++;
        }
        return j2;
    }
    if(t1===Object){
        for(var k in j1){
            var v1 = j1[k];
            var v2 = j2[k];
            if(matchTerms(v1, v2)==null) return null;
        }
        return j2;
    }
    return j1==j2? j2: null;
}

function slashMatch(j1, j2){
    j1=j1.substr(1,j1.length-2);
    if(j1=='null'){
        if(j2==null || j2.length==0) return "";
        return null;
    }
    if(j1=='number'){
        if(/[0-9]*\.[0-9]*/.test(j2)) return j2;
        else return null;
    }
    if(j1=='array'){
        if(j2.constructor===Array) return j2;
        else return null;
    }
    if(j1=='object'){
        if(j2.constructor===Object) return j2;
        else return null;
    }
}

// -----------------------------------------------------------------------

