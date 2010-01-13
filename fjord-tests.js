
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
        sys.puts("..FAIL: "+o1+"/"+o2); 
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

assertTrue("WebObject with less should match one with more",
            new WebObject('{ "a": "b" }')
            .match(
            new WebObject('{ "c": [ "d" ], "a": "b" }')
            ).equals(
            new WebObject('{ "a": "b", "c": [ "d" ] }')
            )
);

assertTrue("WebObject with mismatch should not match",
            new WebObject('{ "a": "B" }')
            .match(
            new WebObject('{ "c": [ "d" ], "a": "b" }')
            )==null
);

assertTrue("WebObject with more should not match one with less",
            new WebObject('{ "a": "b", "c": [ "d" ] }')
            .match(
            new WebObject('{ "a": "b" }')
            )==null
);

assertDeepEqual("Array equality checked when hashes differ",
            new WebObject('{ "a": "b", "c": [ "e", "d" ] }')
            .match(
            new WebObject('{ "a": "b", "c": [ "e", "d" ], "f": "g" }')
            ),
            new WebObject('{ "a": "b", "c": [ "e", "d" ], "f": "g" }')
);

assertDeepEqual("WebObject with less in array should match one with more",
            new WebObject('{ "a": "b", "c": [ "d", "dd" ] }')
            .match(
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", "dd", "g" ] }')
            ),
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", "dd", "g" ] }')
);

assertTrue("Array elements can be complex",
            new WebObject('{ "a": "b", "c": [ "d", { "dd": "ee" } ] }')
            .match(
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", { "dd": "ee" }, "g" ] }')
            )
);

assertTrue("Disjoint arrays don't match - or array order matters",
            new WebObject('{ "a": "b", "c": [ "d", "dd" ] }')
            .match(
            new WebObject('{ "a": "b", "c": [ "e", "dd", "f", "d", "g" ] }')
            )==null
);

assertTrue("Empty matches slash-null-slash",
            new WebObject('{ "price": "/null/" }')
            .match(
            new WebObject('{ "price": "" }')
            )
);

assertTrue("Number matches slash-number-slash",
            new WebObject('{ "high-bid": "/number/" }')
            .match(
            new WebObject('{ "high-bid": "10.00" }')
            )
);

assertTrue("Array matches slash-array-slash",
            new WebObject('{ "tags": "/array/" }')
            .match(
            new WebObject('{ "tags": [ "equity", "bid" ] }')
            )
);

assertTrue("Object matches slash-object-slash",
            new WebObject('{ "on": "/object/" }')
            .match(
            new WebObject('{ "on": { "tags": [ "bid" ] } }')
            )
);

assertTrue("Simple instrument example matches",
            new WebObject('{ "tags": [ "bid" ], "on": { "tags": [ "instrument" ], "bid-ask-spread": { "high-bid": "/number/" } }, "price": "/null/" } ')
            .match(
            new WebObject('{ "tags": [ "equity", "bid" ], "on": { "tags": [ "equity", "instrument" ], "long-name": "Acme Co., Inc", "buyers": [ "@http://a-bank.com/fjord/equity-bid-9ac0d1-88ce1.json" ], "sellers": [ "@http://c-bank.com/fjord/equity-ask-510efb-cca62.json", "@http://d-bank.com/fjord/equity-ask-8560ae-33eff.json" ], "bid-ask-spread": { "high-bid": "10.00", "low-ask":  "14.00" } } , "price": "" } ')
            )
);

assertTrue("Single item matches its existence in list",
            new WebObject('{ "buyers":   { "price": "/number/" } }')
            .match(
            new WebObject('{ "buyers": [ { "price": "" }, { "price": "11.0" } ] }')
            )
);

assertDeepEqual("Simple rule rewrites null to a string - Fjord's first Hello World Rule!",
            new WebObject('{ "hello": "/mmm/world/" }')
            .applyTo(
            new WebObject('{ "hello": "mmm" }')),
            new WebObject('{ "hello": "world" }')
);


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

/*
assertDeepEqual("Instrument price rewrite rule works",
            new WebObject('{ "tags": [ "bid" ], "on": { "tags": [ "instrument" ], "bid-ask-spread": { "high-bid": "/$hibid;number/" } }, "price": "/null/( $hibid * 1.10 )/" } ')
            .applyTo(
            new WebObject('{ "tags": [ "equity", "bid" ], "on": { "tags": [ "equity", "instrument" ], "bid-ask-spread": { "high-bid": "10.00", "low-ask":  "14.00" } }, "price": "" } ')),
            new WebObject('{ "tags": [ "equity", "bid" ], "on": { "tags": [ "equity", "instrument" ], "bid-ask-spread": { "high-bid": "10.00", "low-ask":  "14.00" } }, "price": "11.00" } ')
);
*/

sys.puts('------------------ Tests Done ---------------------');


