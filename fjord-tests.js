
var sys   = require('sys');
var assert = require('assert');

var fjord = require('./fjord');
var WebObject = fjord.WebObject;

// -----------------------------------------------------------------------

var fails=0;
function assertTrue(message, condition){
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

function assertFalse(message, condition){
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

function assertObjectsEqual(message, actual, expected){
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

sys.puts('------------------ Fjord Tests ---------------------');

// -------------------------------------------------------------------

assertObjectsEqual("WebObjects should be deepEqual even if hash reordered",
                new WebObject('{ "a": "b", "c": [ "d" ] }'),
                new WebObject('{ "c": [ "d" ], "a": "b" }')
);

assertTrue("WebObjects should be equal even if hash reordered",
            new WebObject('{ "a": "b", "c": [ "d" ] }')
            .equals(
            new WebObject('{ "c": [ "d" ], "a": "b" }')
            )
);

assertFalse("WebObjects that aren't equal should not come up equal",
             new WebObject('{ "a": "b", "c": [ "D" ] }')
             .equals(
             new WebObject('{ "c": [ "d" ], "a": "b" }')
             )
);

// -----------------------------------------------------------------------

assertObjectsEqual("WebObject with less should match one with more",
            new WebObject('{ "a": "b", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "c": [ "d" ], "a": "b", "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "d" ], "test": "RHS" }')
);

assertObjectsEqual("WebObject with mismatch should not match",
            new WebObject('{ "a": "B", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "c": [ "d" ], "a": "b", "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "d" ], "test": "LHS" }')
);

assertObjectsEqual("WebObject with more should not match one with less",
            new WebObject('{ "a": "b", "c": [ "d" ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "test": "LHS" }')
);

assertObjectsEqual("Array equality checked when hashes differ",
            new WebObject('{ "a": "b", "c": [ "e", "d" ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "c": [ "e", "d" ], "f": "g", "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "e", "d" ], "f": "g", "test": "RHS" }')
);

assertObjectsEqual("WebObject with less in array should match one with more",
            new WebObject('{ "a": "b", "c": [ "d", "dd" ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", "dd", "g" ], "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", "dd", "g" ], "test": "RHS" }')
);

assertObjectsEqual("WebObject with more in array should not match one with less",
            new WebObject('{ "a": "b", "c": [ "d", "f", "dd" ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "c": [ "d", "dd" ], "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "d", "dd" ], "test": "LHS" }')
);

assertObjectsEqual("Array elements can be complex",
            new WebObject('{ "a": "b", "c": [ "d", { "dd": "ee" } ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", { "dd": "ee" }, "g" ], "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", { "dd": "ee" }, "g" ], "test": "RHS" }')
);

assertObjectsEqual("Disjoint arrays don't match - or array order matters",
            new WebObject('{ "a": "b", "c": [ "d", "dd" ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "c": [ "e", "dd", "f", "d", "g" ], "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "e", "dd", "f", "d", "g" ], "test": "LHS" }')
);

// -----------------------------------------------------------------------

assertObjectsEqual("Empty matches slash-null-slash",
            new WebObject('{ "price": "/null/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "price": "", "test": "LHS" }')
            ),
            new WebObject('{ "price": "", "test": "RHS" }')
);

assertObjectsEqual("Number matches slash-number-slash",
            new WebObject('{ "high-bid": "/number/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "high-bid": "10.00", "test": "LHS" }')
            ),
            new WebObject('{ "high-bid": "10.00", "test": "RHS" }')
);

assertObjectsEqual("Array matches slash-array-slash",
            new WebObject('{ "tags": "/array/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "tags": [ "equity", "bid" ], "test": "LHS" }')
            ),
            new WebObject('{ "tags": [ "equity", "bid" ], "test": "RHS" }')
);

assertObjectsEqual("Object matches slash-object-slash",
            new WebObject('{ "on": "/object/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "on": { "tags": [ "bid" ] }, "test": "LHS" }')
            ),
            new WebObject('{ "on": { "tags": [ "bid" ] }, "test": "RHS" }')
);

assertObjectsEqual("Reserved word 'null' doesn't match literally",
            new WebObject('{ "price": "/null/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "price": "null", "test": "LHS" }')
            ),
            new WebObject('{ "price": "null", "test": "LHS" }')
);

// -----------------------------------------------------------------------

assertObjectsEqual("Rewrites null to a string",
            new WebObject('{ "a": "/null/b/" }')
            .applyTo(
            new WebObject('{ "x": "y", "a": "" }')
            ),
            new WebObject('{ "x": "y", "a": "b" }')
);

assertObjectsEqual("Rewrites on a sub-object item",
            new WebObject('{ "a": { "b": "/c/d/" } }')
            .applyTo(
            new WebObject('{ "a": { "b": "c", "x": "y" } }')
            ),
            new WebObject('{ "a": { "b": "d", "x": "y" } }')
);

assertObjectsEqual("Rewrites number inside object",
            new WebObject('{ "a": { "b": "/number/12.0/" } }')
            .applyTo(
            new WebObject('{ "a": { "b": "11.0", "x": "y" } }')
            ),
            new WebObject('{ "a": { "b": "12", "x": "y" } }')
);

// -------------------------------------------------------------------

assertObjectsEqual("Rewrites null to a string in an array",
            new WebObject('{ "a": [ "/null/d/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "x", "", "y" ] }')
            ),
            new WebObject('{ "a": [ "x", "d", "y" ] }')
);

assertObjectsEqual("Rewrites on a sub-array item",
            new WebObject('{ "a": [ "/c/d/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "x", "c", "y" ] }')
            ),
            new WebObject('{ "a": [ "x", "d", "y" ] }')
);

assertObjectsEqual("Rewrites number inside sub-array item",
            new WebObject('{ "a": [ "/number/12.0/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "x", "11.0", "y" ] }')
            ),
            new WebObject('{ "a": [ "x", "12", "y" ] }')
);

assertObjectsEqual("Rewrites on many array items with one element match",
            new WebObject('{ "a": "/c/d/" }')
            .applyTo(
            new WebObject('{ "a": [ "c", "c", "c" ] }')
            ),
            new WebObject('{ "a": [ "d", "d", "d" ] }')
);

assertObjectsEqual("Rewrites on an array item with two and a half matches in rotation",
            new WebObject('{ "a": [ "/c/d/", "/number/5.0/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "e", "x", "c", "y", "1.0", "z", "c", "y", "2.0", "z", "c", "z" ] }')
            ),
            new WebObject('{ "a": [ "e", "x", "d", "y", "5", "z", "d", "y", "5", "z", "d", "z" ] }')
);

assertObjectsEqual("Single item matches its existence in array",
            new WebObject('{ "buyers":   { "price": "/number/" }, "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "buyers": [ { "price": "" }, { "price": "11.0" } ], "test": "LHS" }')
            ),
            new WebObject('{ "buyers": [ { "price": "" }, { "price": "11.0" } ], "test": "RHS" }')
);

assertObjectsEqual("Single item matches in array and rewrites it each time",
            new WebObject('{ "buyers":   { "price": "/number/12.0/" }, "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "buyers": [ { "price": "10.0" }, { "price": "none" }, { "price": "11.0" } ], "test": "LHS" }')
            ),
            new WebObject('{ "buyers": [ { "price": "12" }, { "price": "none" }, { "price": "12" } ], "test": "RHS" }')
);

// -------------------------------------------------------------------

var rule     = new WebObject('{ "from": "/array;$x/", "copy": "/null/$x/" }');
var before   = new WebObject('{ "from": [ "a", "b" ], "copy": ""          }');

var after = rule.applyTo(before);

var expected = new WebObject('{ "from": [ "a", "b" ], "copy": [ "a", "b" ] }');

assertObjectsEqual("Binding array to rhs makes a copy", after, expected);

assertTrue("Original array left intact after rule applied", after.json.from===before.json.from);
assertTrue("Using binding of array on rhs copies array",    after.json.copy!==before.json.from);

// -------------------------------------------------------------------

rule = new WebObject('{ "hello": "/bye/world/" }');
before  = new WebObject('{ "hello": "" }');

after=rule.applyTo(before)

assertTrue("If rule isn't applied, result === target", after===before);

rule = new WebObject('{ "hello": "/null/world/" }');

after=rule.applyTo(before);

assertTrue("If rule is applied, result == target",  after.equals(new WebObject('{ "hello": "world" }')));
assertTrue("If rule is applied, result !== target", after!==before);
assertTrue("If rule is applied uid same",           after.uid==before.uid);

rule = new WebObject('{ "hello": "/world/world/" }');

after2 = rule.applyTo(after);

assertTrue("If rule is applied but result unchanged, result === target", after2===after);
assertTrue("If rule is applied uid same",                                after2.uid==after.uid);

// -------------------------------------------------------------------

assertObjectsEqual("Matches lt and gt - less or greater than",
            new WebObject('{ "a": [ "/gt(3.0)/3+/", "/lt(1.0)/1-/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "3.1", "0.9", "3.0", "1.0" ] }')
            ),
            new WebObject('{ "a": [ "3+",  "1-",  "3.0", "1.0" ] }')
);

assertObjectsEqual("Matches semicolon list as 'and'",
            new WebObject('{ "a": [ "/number;gt(1.0);lt(3.0)/1..3/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "3.0", "2.0", "1.0" ] }')
            ),
            new WebObject('{ "a": [ "3.0", "1..3", "1.0" ] }')
);

assertObjectsEqual("Within match iteration, variables bound and must agree",
            new WebObject('{ "a": [ "/$x/", "/$x/end/" ], "b": "/null/$x/" }')
            .applyTo(
            new WebObject('{ "a": [ "3.0", "3.0", "4.0", "5.0", "4.0", "6.0" ], "b": "" }')
            ),
            new WebObject('{ "a": [ "3.0", "end", "4.0", "5.0", "end", "6.0" ], "b": [ "3.0", "4.0", "6.0" ] }')
);

assertObjectsEqual("More match iteration complexity",
            new WebObject('{ "a": [ "/number;$x/", "/$x/end/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "xxx", "3.0", "xxx", "3.0", "xxx", "4.0", "xxx", "3.0", "xxx", "4.0" ] }')
            ),
            new WebObject('{ "a": [ "xxx", "3.0", "xxx", "end", "xxx", "4.0", "xxx", "3.0", "xxx", "end" ] }')
);

assertObjectsEqual("Binds to variable above and matches greater than it",
            new WebObject('{ "a": [ "/number;$x/", "/gt($x)/greater/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "3.0", [ "3.0", "3.1",     "0.0", "4.0",     "2.9" ] ] }')
            ),
            new WebObject('{ "a": [ "3.0", [ "3.0", "greater", "0.0", "greater", "2.9" ] ] }')
);

assertObjectsEqual("Uses variable in rewrite",
            new WebObject('{ "a": [ "/number;$x/", "/gt($x);$y/$y greater than $x/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "2.0", "1.0", "3.1" ] }')
            ),
            new WebObject('{ "a": [ "2.0", "1.0", "3.1 greater than 2.0" ] }')
);

// -------------------------------------------------------------------

var there = new WebObject('{ "there": "1.0" }');
var thereUID = there.uid;
assertTrue("WebObject has a UID", thereUID);

assertObjectsEqual("Jumps @link and matches in another object",
            new WebObject('{ "here": { "there": "/number/" }, "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "here": "@'+thereUID+'", "test": "LHS" }')
            ),
            new WebObject('{ "here": "@'+thereUID+'", "test": "RHS" }')
);

assertObjectsEqual("Won't rewrite in @linked object",
            new WebObject('{ "here": { "there": "/number/xxx/" }, "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "here": "@'+thereUID+'", "test": "LHS" }')
            ),
            new WebObject('{ "here": "@'+thereUID+'", "test": "RHS" }')
);

// -------------------------------------------------------------------

assertObjectsEqual("Creates match set when binding inside array",
            new WebObject('{ "a": { "b": "/number;$matchset/" }, "test": "/null/$matchset/" }')
            .applyTo(
            new WebObject('{ "a": [ { "b": "1.5" }, { "b": "2.5" } ], "test": "" }')
            ),
            new WebObject('{ "a": [ { "b": "1.5" }, { "b": "2.5" } ], "test": [ "1.5", "2.5" ] }')
);

assertObjectsEqual("Can get min and max of a match set",
            new WebObject('{ "a": "/number;$matchset/", "min": "/null/min($matchset)/", "max": "/null/max($matchset)/" }')
            .applyTo(
            new WebObject('{ "a": [ "1.5", "1.0", "2.5", "2.0" ], "min": "", "max": "" }')
            ),
            new WebObject('{ "a": [ "1.5", "1.0", "2.5", "2.0" ], "min": "1.0", "max": "2.5" }')
);

assertObjectsEqual("Match set with one element reduces to that element",
            new WebObject('{ "a": "/$matchset/", "matchset": "/null/$matchset/" }')
            .applyTo(
            new WebObject('{ "a": [ "1.5" ], "matchset": "" }')
            ),
            new WebObject('{ "a": [ "1.5" ], "matchset": "1.5" }')
);

// -------------------------------------------------------------------

var rule     = new WebObject('{ "a": [ "/$x/", "/array/has($x)/" ] }')
var before   = new WebObject('{ "a": [ "k", [ "j" ] ] }')
var expected = new WebObject('{ "a": [ "k", [ "j", "k" ] ] }')
var after    = rule.applyTo(before);

assertObjectsEqual("Adds to array if not there with has()", after, expected);

assertTrue("Web object different even though only changed inside an array", before!==after);
assertTrue("Web object uid same though", before.uid===after.uid);

assertObjectsEqual("Won't add again with has() if already there",
            new WebObject('{ "a": [ "/$x/", "/array/has($x)/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "k", [ "j", "k" ] ] }')
            ),
            new WebObject('{ "a": [ "k", [ "j", "k" ] ] }')
);

// -------------------------------------------------------------------

var rule  =new WebObject('{ "%uid": "/$uid/", "hasuid": "/array/has($uid)/" }');
var before=new WebObject('{ "hasuid": [ "foo" ], "test": "LHS" }');
var uid   =before.uid;

var after = rule.applyTo(before);

var expected=new WebObject('{ "hasuid": [ "foo", "@'+uid+'" ], "test": "LHS"  }');

assertObjectsEqual("Can get object uid and put it into an array", after, expected);

var rule2 = new WebObject('{ "hasuid": { "hasuid": { "hasuid": { "hasuid": "foo" } } }, "test": "/LHS/RHS/" }');

var after2 = rule2.applyTo(after);

var expected2=new WebObject('{ "hasuid": [ "foo", "@'+uid+'" ], "test": "RHS"  }');

assertObjectsEqual("Can match self circularly now", after2, expected2);

var rule3  =new WebObject('{ "%uid": "/$uid/", "hasuid": "/$uid/", "test": "/RHS/rhs/" }');

var expected3=new WebObject('{ "hasuid": [ "foo", "@'+uid+'" ], "test": "rhs"  }');

var after3 = rule3.applyTo(after2);

assertObjectsEqual("Can match own uid inside the array", after3, expected3);

// -------------------------------------------------------------------
// -------------------------------------------------------------------
// -------------------------------------------------------------------

var bidrl1=new WebObject('{ "tags": [ "equity", "bid" ], "on": { "tags": [ "equity", "instrument" ], "bid-ask-spread": { "high-bid": "/$hibid;number/" } }, "price": "/null/( $hibid * 1.10 )/" }');

var insrl1=new WebObject('{ "%uid": "/$bid/", "tags": [ "equity", "bid" ], "on": { "%uid": "/this/", "tags": [ "equity", "instrument" ], "buyers": "/array/has($bid)/" } }');

var insrl2=new WebObject('{ "tags": [ "equity", "instrument" ], "buyers":  { "price": "/$bids;number/" }, "sellers": { "price": "/$asks;number/" }, "bid-ask-spread": { "high-bid": "/number/max($bids)/", "low-ask":  "/number/min($asks)/" } }');

// ---------------

var bidone=new WebObject('{ "tags": [ "equity", "bid" ], "on": "@000-000", "price": "10.00" }');
var askone=new WebObject('{ "tags": [ "equity", "ask" ], "on": "@000-000", "price": "15.00" }');
var asktwo=new WebObject('{ "tags": [ "equity", "ask" ], "on": "@000-000", "price": "14.00" }');

var instru=new WebObject('{ "tags": [ "equity", "instrument" ], "long-name": "Acme Co., Inc", "buyers": [ "@'+bidone.uid+'" ], "sellers": [ "@'+askone.uid+'", "@'+asktwo.uid+'" ], "bid-ask-spread": { "high-bid": "1.0", "low-ask":  "1.0" } }');

var instru=insrl2.applyTo(instru);

assertObjectsEqual("Second Instrument rule works", instru, new WebObject('{ "tags": [ "equity", "instrument" ], "long-name": "Acme Co., Inc", "buyers": [ "@'+bidone.uid+'" ], "sellers": [ "@'+askone.uid+'", "@'+asktwo.uid+'" ], "bid-ask-spread": { "high-bid": "10", "low-ask":  "14.00" } }'));

// ---------------

var bidnew=new WebObject('{ "tags": [ "equity", "bid" ], "on": "@'+instru.uid+'", "price": "" }');

var bidnew=bidrl1.applyTo(bidnew);

assertObjectsEqual("First Bid rule works", bidnew, 
           new WebObject('{ "tags": [ "equity", "bid" ], "on": "@'+instru.uid+'", "price": "11" }'));

// ---------------

//var instru=insrl1.applyTo(instru);
//var instru=insrl2.applyTo(instru);

// -------------------------------------------------------------------
// -------------------------------------------------------------------
// -------------------------------------------------------------------

sys.puts('------------------ Tests Done ---------------------');
sys.puts("Total test fails: "+fails);


