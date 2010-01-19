
var sys = require('sys');
var assert = require('assert');

var fails=0;
function isTrue(message, condition){
    sys.puts("-------------------\n"+message);
    try{
        assert.ok(condition, message);
        sys.puts("..OK");
    } catch(e) {
        sys.puts("**FAIL: "+condition); 
        fails++;
    }
    if(fails) sys.puts("FAILs: "+fails);
}

function isFalse(message, condition){
    sys.puts("-------------------\n"+message);
    try{
        assert.ok(!condition, message);
        sys.puts("..OK");
    } catch(e) {
        sys.puts("**FAIL: "+condition); 
        fails++;
    }
    if(fails) sys.puts("FAILs: "+fails);
}

function objectsEqual(message, actual, expected){
    sys.puts("-------------------\n"+message);
    try{
        assert.ok(actual.equals(expected), message);
        sys.puts("Result: "+actual); 
        sys.puts("..OK");
    } catch(e) {
        sys.puts("**FAIL, expected:\n"+expected+"\n--- got:\n"+actual); 
        fails++;
    }
    if(fails) sys.puts("FAILs: "+fails);
}

exports.isTrue = isTrue;
exports.isFalse = isFalse;
exports.objectsEqual = objectsEqual;


