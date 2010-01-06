
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
    if(deepEqual(j1,j2)) return j2;
    if(typeof j1 != typeof j2) return null;
    if(typeof j1=='object'){
        if(j1.constructor != j2.constructor) return null;
        if(j1.constructor === Array){
            var k1=0, k2=0;
            for(; k1<j1.length; k1++){
                for(; k2<j2.length; k2++){
                    if(j1[k1]==j2[k2]) break;
                }
                if(k2==j2.length) return null;
            }
            return j2;
        }
        else{
            for(var k in j1){
                var v1 = j1[k];
                var v2 = j2[k];
                if(matchTerms(v1, v2)==null) return null;
            }
            return j2;
        }
    }
    return null;
}

// -----------------------------------------------------------------------

