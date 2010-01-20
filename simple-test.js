
var sys = require('sys');
var assert = require('assert');

var oks  =0;
var fails=0;
var faildescriptions = [];

function isTrue(message, condition){
    sys.puts("-------------------\n"+message);
    try{
        assert.ok(condition, message);
        sys.puts("..OK");
        oks++;
    } catch(e) {
        sys.puts("**FAIL: "+condition); 
        fails++;
        faildescriptions.push(message);
    }
    if(fails) sys.puts("FAILs: "+fails);
}

function isFalse(message, condition){
    sys.puts("-------------------\n"+message);
    try{
        assert.ok(!condition, message);
        sys.puts("..OK");
        oks++;
    } catch(e) {
        sys.puts("**FAIL: "+condition); 
        fails++;
        faildescriptions.push(message);
    }
    if(fails) sys.puts("FAILs: "+fails);
}

function objectsEqual(message, actual, expected){
    sys.puts("-------------------\n"+message);
    try{
        assert.ok(actual.equals(expected), message);
        sys.puts("Result: "+actual); 
        sys.puts("..OK");
        oks++;
    } catch(e) {
        sys.puts("**FAIL, expected:\n"+expected+"\n--- got:\n"+actual); 
        fails++;
        faildescriptions.push(message);
    }
    if(fails) sys.puts("FAILs: "+fails);
}

function summary(){
    sys.puts('------------------ Tests Done ---------------------');
    sys.puts("Pass: "+oks+", Fail: "+fails);
    sys.puts('---------------------------------------------------');
    if(faildescriptions.length){
    sys.puts('Failed tests:');
    for(i in faildescriptions){
    sys.puts(" - "+faildescriptions[i]);
    }
    sys.puts('---------------------------------------------------');
    }
}

exports.isTrue = isTrue;
exports.isFalse = isFalse;
exports.objectsEqual = objectsEqual;
exports.summary = summary;


