
var sys   = require('sys');
var assert = require('assert');

var fjord = require('./fjord');
var WebObject = fjord.WebObject;

// -----------------------------------------------------------------------

var fails=0;
function assertTrue(message, condition){
    sys.puts(message);
    try{
        assert.ok(condition, message);
        sys.puts("..OK");
    } catch(e) {
        sys.puts("..FAIL: "+condition); 
        fails++;
    }
    if(fails) sys.puts("FAILs: "+fails);
}

function assertFalse(message, condition){
    sys.puts(message);
    try{
        assert.ok(!condition, message);
        sys.puts("..OK");
    } catch(e) {
        sys.puts("..FAIL: "+condition); 
        fails++;
    }
    if(fails) sys.puts("FAILs: "+fails);
}

function assertObjectsEqual(message, o1, o2){
    sys.puts(message);
    try{
        assert.ok(o1.equals(o2), message);
        sys.puts("..OK");
    } catch(e) {
        sys.puts("..FAIL:\n"+o1+"\n---\n"+o2); 
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
            new WebObject('{ "a": { "b": "12.0", "x": "y" } }')
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
            new WebObject('{ "a": [ "x", "12.0", "y" ] }')
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
            new WebObject('{ "a": [ "e", "x", "d", "y", "5.0", "z", "d", "y", "5.0", "z", "d", "z" ] }')
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
            new WebObject('{ "buyers": [ { "price": "12.0" }, { "price": "none" }, { "price": "12.0" } ], "test": "RHS" }')
);

// -------------------------------------------------------------------

rule = new WebObject('{ "hello": "/bye/world/" }');
obj  = new WebObject('{ "hello": "" }');

assertTrue("If rule isn't applied, result === target",
            rule.applyTo(obj)===obj
);


rule = new WebObject('{ "hello": "/null/world/" }');
obj  = new WebObject('{ "hello": "" }');

assertTrue("If rule is applied, result !== target",
            rule.applyTo(obj)!==obj
);


rule = new WebObject('{ "hello": "/world/world/" }');
obj  = new WebObject('{ "hello": "world" }');

assertTrue("If rule is applied but result unchanged, result === target",
            rule.applyTo(obj)===obj
);

// -------------------------------------------------------------------

assertObjectsEqual("Matches lt and gt - less or greater than",
            new WebObject('{ "a": [ "/gt(3.0)/3+/", "/lt(1.0)/1-/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "3.1", "0.9", "3.0", "1.0" ] }')
            ),
            new WebObject('{ "a": [ "3+",  "1-",  "3.0", "1.0" ] }')
);

assertObjectsEqual("Matches semicolon list as 'and'",
            new WebObject('{ "a": [ "/number;gt(1.0);lt(3.0)/1-3/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "3.0", "2.0", "1.0" ] }')
            ),
            new WebObject('{ "a": [ "3.0", "1-3", "1.0" ] }')
);

assertObjectsEqual("Binds to variable and matches further down in list",
            new WebObject('{ "a": [ "/number;$x/", "/$x/here!/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "xxx", "3.0", "xxx", "3.0",   "xxx", "4.0", "xxx", "3.0", "xxx", "3.0" ] }')
            ),
            new WebObject('{ "a": [ "xxx", "3.0", "xxx", "here!", "xxx", "4.0", "xxx", "3.0", "xxx", "here!" ] }')
);

assertObjectsEqual("Binds to variable above and matches greater than it",
            new WebObject('{ "a": [ "/number;$x/", "/gt($x)/greater/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "3.0", [ "3.0", "3.1",     "0.0", "4.0",     "2.9" ] ] }')
            ),
            new WebObject('{ "a": [ "3.0", [ "3.0", "greater", "0.0", "greater", "2.9" ] ] }')
);

assertObjectsEqual("Uses variable in rewrite",
            new WebObject('{ "a": [ "/number;$x/", "/gt($x);$y/$y > $x/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "2.0", "3.1"       ] }')
            ),
            new WebObject('{ "a": [ "2.0", "3.1 > 2.0" ] }')
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

assertObjectsEqual("Instrument price rewrite rule works",
            new WebObject('{ "tags": [ "bid" ], "on": { "tags": [ "instrument" ], "bid-ask-spread": { "high-bid": "/$hibid;number/" } }, "price": "/null/( $hibid * 1.10 )/" } ')
            .applyTo(
            new WebObject('{ "tags": [ "equity", "bid" ], "on": { "tags": [ "equity", "instrument" ], "bid-ask-spread": { "high-bid": "10.00", "low-ask":  "14.00" } }, "price": "" } ')
            ),
            new WebObject('{ "tags": [ "equity", "bid" ], "on": { "tags": [ "equity", "instrument" ], "bid-ask-spread": { "high-bid": "10.00", "low-ask":  "14.00" } }, "price": "11.00" } ')
);

// -------------------------------------------------------------------

sys.puts('------------------ Tests Done ---------------------');


