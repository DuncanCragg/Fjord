
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

function assertDeepEqual(message, o1, o2){
    sys.puts(message);
    try{
        assert.deepEqual(o1, o2, message);
        sys.puts("..OK");
    } catch(e) {
        sys.puts("..FAIL:\n"+o1+"\n---\n"+o2); 
        fails++;
    }
    if(fails) sys.puts("FAILs: "+fails);
}

sys.puts('------------------ Fjord Tests ---------------------');

assertDeepEqual("WebObjects should be deepEqual even if hash reordered",
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

assertDeepEqual("WebObject with less should match one with more",
            new WebObject('{ "a": "b", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "c": [ "d" ], "a": "b", "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "d" ], "test": "RHS" }')
);

assertDeepEqual("WebObject with mismatch should not match",
            new WebObject('{ "a": "B", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "c": [ "d" ], "a": "b", "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "d" ], "test": "LHS" }')
);

assertDeepEqual("WebObject with more should not match one with less",
            new WebObject('{ "a": "b", "c": [ "d" ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "test": "LHS" }')
);

assertDeepEqual("Array equality checked when hashes differ",
            new WebObject('{ "a": "b", "c": [ "e", "d" ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "c": [ "e", "d" ], "f": "g", "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "e", "d" ], "f": "g", "test": "RHS" }')
);

assertDeepEqual("WebObject with less in array should match one with more",
            new WebObject('{ "a": "b", "c": [ "d", "dd" ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", "dd", "g" ], "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", "dd", "g" ], "test": "RHS" }')
);

assertDeepEqual("Array elements can be complex",
            new WebObject('{ "a": "b", "c": [ "d", { "dd": "ee" } ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", { "dd": "ee" }, "g" ], "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", { "dd": "ee" }, "g" ], "test": "RHS" }')
);

assertDeepEqual("Disjoint arrays don't match - or array order matters",
            new WebObject('{ "a": "b", "c": [ "d", "dd" ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "c": [ "e", "dd", "f", "d", "g" ], "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "e", "dd", "f", "d", "g" ], "test": "LHS" }')
);

// -----------------------------------------------------------------------

assertDeepEqual("Empty matches slash-null-slash",
            new WebObject('{ "price": "/null/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "price": "", "test": "LHS" }')
            ),
            new WebObject('{ "price": "", "test": "RHS" }')
);

assertDeepEqual("Number matches slash-number-slash",
            new WebObject('{ "high-bid": "/number/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "high-bid": "10.00", "test": "LHS" }')
            ),
            new WebObject('{ "high-bid": "10.00", "test": "RHS" }')
);

assertDeepEqual("Array matches slash-array-slash",
            new WebObject('{ "tags": "/array/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "tags": [ "equity", "bid" ], "test": "LHS" }')
            ),
            new WebObject('{ "tags": [ "equity", "bid" ], "test": "RHS" }')
);

assertDeepEqual("Object matches slash-object-slash",
            new WebObject('{ "on": "/object/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "on": { "tags": [ "bid" ] }, "test": "LHS" }')
            ),
            new WebObject('{ "on": { "tags": [ "bid" ] }, "test": "RHS" }')
);

assertDeepEqual("Reserved word 'null' doesn't match literally",
            new WebObject('{ "price": "/null/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "price": "null", "test": "LHS" }')
            ),
            new WebObject('{ "price": "null", "test": "LHS" }')
);

// -----------------------------------------------------------------------

assertDeepEqual("Rewrites null to a string",
            new WebObject('{ "a": "/null/b/" }')
            .applyTo(
            new WebObject('{ "x": "y", "a": "" }')),
            new WebObject('{ "x": "y", "a": "b" }')
);

assertDeepEqual("Rewrites on a sub-object item",
            new WebObject('{ "a": { "b": "/c/d/" } }')
            .applyTo(
            new WebObject('{ "a": { "b": "c", "x": "y" } }')
            ),
            new WebObject('{ "a": { "b": "d", "x": "y" } }')
);

assertDeepEqual("Rewrites number inside object",
            new WebObject('{ "a": { "b": "/number/12.0/" } }')
            .applyTo(
            new WebObject('{ "a": { "b": "11.0", "x": "y" } }')
            ),
            new WebObject('{ "a": { "b": "12.0", "x": "y" } }')
);

// -------------------------------------------------------------------

assertDeepEqual("Rewrites null to a string in an array",
            new WebObject('{ "a": [ "/null/d/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "x", "", "y" ] }')
            ),
            new WebObject('{ "a": [ "x", "d", "y" ] }')
);

assertDeepEqual("Rewrites on a sub-array item",
            new WebObject('{ "a": [ "/c/d/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "x", "c", "y" ] }')
            ),
            new WebObject('{ "a": [ "x", "d", "y" ] }')
);

assertDeepEqual("Rewrites number inside sub-array item",
            new WebObject('{ "a": [ "/number/12.0/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "x", "11.0", "y" ] }')
            ),
            new WebObject('{ "a": [ "x", "12.0", "y" ] }')
);

assertDeepEqual("Rewrites on many array items with one element match",
            new WebObject('{ "a": "/c/d/" }')
            .applyTo(
            new WebObject('{ "a": [ "c", "c", "c" ] }')
            ),
            new WebObject('{ "a": [ "d", "d", "d" ] }')
);

assertDeepEqual("Rewrites on an array item with two and a half matches in rotation",
            new WebObject('{ "a": [ "/c/d/", "/number/5.0/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "e", "x", "c", "y", "1.0", "z", "c", "y", "2.0", "z", "c", "z" ] }')
            ),
            new WebObject('{ "a": [ "e", "x", "d", "y", "5.0", "z", "d", "y", "5.0", "z", "d", "z" ] }')
);

assertDeepEqual("Single item matches its existence in array",
            new WebObject('{ "buyers":   { "price": "/number/" }, "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "buyers": [ { "price": "" }, { "price": "11.0" } ], "test": "LHS" }')
            ),
            new WebObject('{ "buyers": [ { "price": "" }, { "price": "11.0" } ], "test": "RHS" }')
);

assertDeepEqual("Single item matches in array and rewrites it each time",
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

assertDeepEqual("Simple instrument example matches",
            new WebObject('{ "tags": [ "bid" ], "on": { "tags": [ "instrument" ], "bid-ask-spread": { "high-bid": "/number/" } }, "price": "/null/11.00/" } ')
            .applyTo(
            new WebObject('{ "tags": [ "equity", "bid" ], "on": { "tags": [ "equity", "instrument" ], "long-name": "Acme Co., Inc", "buyers": [ "@http://a-bank.com/fjord/equity-bid-9ac0d1-88ce1.json" ], "sellers": [ "@http://c-bank.com/fjord/equity-ask-510efb-cca62.json", "@http://d-bank.com/fjord/equity-ask-8560ae-33eff.json" ], "bid-ask-spread": { "high-bid": "10.00", "low-ask":  "14.00" } } , "price": "" } ')
            ),
            new WebObject('{ "tags": [ "equity", "bid" ], "on": { "tags": [ "equity", "instrument" ], "long-name": "Acme Co., Inc", "buyers": [ "@http://a-bank.com/fjord/equity-bid-9ac0d1-88ce1.json" ], "sellers": [ "@http://c-bank.com/fjord/equity-ask-510efb-cca62.json", "@http://d-bank.com/fjord/equity-ask-8560ae-33eff.json" ], "bid-ask-spread": { "high-bid": "10.00", "low-ask":  "14.00" } } , "price": "11.00" } ')
);

/*
assertDeepEqual("Instrument price rewrite rule works",
            new WebObject('{ "tags": [ "bid" ], "on": { "tags": [ "instrument" ], "bid-ask-spread": { "high-bid": "/$hibid;number/" } }, "price": "/null/( $hibid * 1.10 )/" } ')
            .applyTo(
            new WebObject('{ "tags": [ "equity", "bid" ], "on": { "tags": [ "equity", "instrument" ], "bid-ask-spread": { "high-bid": "10.00", "low-ask":  "14.00" } }, "price": "" } ')),
            new WebObject('{ "tags": [ "equity", "bid" ], "on": { "tags": [ "equity", "instrument" ], "bid-ask-spread": { "high-bid": "10.00", "low-ask":  "14.00" } }, "price": "11.00" } ')
);
*/

sys.puts('------------------ Tests Done ---------------------');


