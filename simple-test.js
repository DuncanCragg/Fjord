
var sys = require('sys');
var assert = require('assert');

var oks  =0;
var fails=0;
var faildescriptions = [];

function isTrue(message, condition){
    log("-------------------\n"+message);
    try{
        assert.ok(condition);
        log("..OK");
        oks++;
    } catch(e) {
        log("** FAIL: "+condition); 
        fails++;
        faildescriptions.push(message);
    }
    if(fails) log("FAILs: "+fails);
}

function isFalse(message, condition){
    log("-------------------\n"+message);
    try{
        assert.ok(!condition);
        log("..OK");
        oks++;
    } catch(e) {
        log("** FAIL: "+condition); 
        fails++;
        faildescriptions.push(message);
    }
    if(fails) log("FAILs: "+fails);
}

function isEqual(message, actual, expected){
    log("-------------------\n"+message);
    try{
        assert.deepEqual(actual, expected);
        log("Result: "+JSON.stringify(actual)); 
        log("..OK");
        oks++;
    } catch(e) {
        log("** FAIL, expected:"); 
        log(JSON.stringify(expected)); 
        log("--- got:\n"+JSON.stringify(actual)); 
        fails++;
        faildescriptions.push(message);
    }
    if(fails) log("FAILs: "+fails);
}

function jsonEqual(message, actual, expected){
    log("-------------------\n"+message);
    try{
        assert.ok(JSON.stringify(actual)==JSON.stringify(expected));
        log("Result: "+JSON.stringify(actual)); 
        log("..OK");
        oks++;
    } catch(e) {
        log("** FAIL, expected:"); 
        log(JSON.stringify(expected)); 
        log("--- got:\n"+JSON.stringify(actual)); 
        fails++;
        faildescriptions.push(message);
    }
    if(fails) log("FAILs: "+fails);
}

function objectsEqual(message, actual, expected){
    log("-------------------\n"+message);
    try{
        assert.ok(actual.equals(expected));
        log("Result: "+actual); 
        log("..OK");
        oks++;
    } catch(e) {
        log("** FAIL, expected:"); 
        log(expected); 
        log("--- got:\n"+actual); 
        fails++;
        faildescriptions.push(message);
    }
    if(fails) log("FAILs: "+fails);
}

function summary(){
    log('------------------ Tests Done ---------------------');
    log("Pass: "+oks+", Fail: "+fails);
    log('---------------------------------------------------');
    if(faildescriptions.length){
    for(var i in faildescriptions){
    log("** FAIL: "+faildescriptions[i]);
    }
    log('---------------------------------------------------');
    }
}

function log(o){
    sys.puts((""+o).substring(0,1800));
}

exports.isTrue = isTrue;
exports.isFalse = isFalse;
exports.isEqual = isEqual;
exports.jsonEqual = jsonEqual;
exports.objectsEqual = objectsEqual;
exports.summary = summary;


