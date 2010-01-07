
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
        sys.puts("OK");
    } catch(e) {
        sys.puts("FAIL: "+condition); 
        fails++;
    }
    if(fails) sys.puts("FAILs: "+fails);
}

function assertFalse(message, condition){
    sys.puts(message);
    try{
        assert.ok(!condition, message);
        sys.puts("OK");
    } catch(e) {
        sys.puts("FAIL: "+condition); 
        fails++;
    }
    if(fails) sys.puts("FAILs: "+fails);
}

function assertDeepEqual(message, o1, o2){
    sys.puts(message);
    try{
        assert.deepEqual(o1, o2, message);
        sys.puts("OK");
    } catch(e) {
        sys.puts("FAIL: "+o1+"/"+o2); 
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

assertDeepEqual("List equality checked when hashes differ",
            new WebObject('{ "a": "b", "c": [ "e", "d" ] }')
            .match(
            new WebObject('{ "a": "b", "c": [ "e", "d" ], "f": "g" }')
            ),
            new WebObject('{ "a": "b", "c": [ "e", "d" ], "f": "g" }')
);

assertDeepEqual("WebObject with less in list should match one with more",
            new WebObject('{ "a": "b", "c": [ "d", "dd" ] }')
            .match(
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", "dd", "g" ] }')
            ),
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", "dd", "g" ] }')
);

assertTrue("list elements can be complex",
            new WebObject('{ "a": "b", "c": [ "d", { "dd": "ee" } ] }')
            .match(
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", { "dd": "ee" }, "g" ] }')
            )
);

assertTrue("Disjoint lists don't match - or list order matters",
            new WebObject('{ "a": "b", "c": [ "d", "dd" ] }')
            .match(
            new WebObject('{ "a": "b", "c": [ "e", "dd", "f", "d", "g" ] }')
            )==null
);

assertTrue("empty matches slash-null-slash",
            new WebObject('{ "price": "/null/" }')
            .match(
            new WebObject('{ "price": "" }')
            )
);

assertTrue("decimal matches slash-decimal-slash",
            new WebObject('{ "high-bid": "/decimal/" }')
            .match(
            new WebObject('{ "high-bid": "10.00" }')
            )
);

assertTrue("Simple instrument example matches",
            new WebObject('{ "tags": [ "bid" ], "on": { "tags": [ "instrument" ], "bid-ask-spread": { "high-bid": "/decimal/" } }, "price": "/null/" } ')
            .match(
            new WebObject('{ "tags": [ "equity", "bid" ], "on": { "tags": [ "equity", "instrument" ], "long-name": "Acme Co., Inc", "buyers": [ "@http://a-bank.com/fjord/equity-bid-9ac0d1-88ce1.json" ], "sellers": [ "@http://c-bank.com/fjord/equity-ask-510efb-cca62.json", "@http://d-bank.com/fjord/equity-ask-8560ae-33eff.json" ], "bid-ask-spread": { "high-bid": "10.00", "low-ask":  "14.00" } } , "price": "" } ')
            )
);

/*
            new WebObject('{ "tags": [ "bid" ], "on": { "tags": [ "instrument" ], "bid-ask-spread": { "high-bid": "/$hibid;decimal/" } }, "price": "/null/( $hibid * 1.10 )/" } ')
*/

sys.puts('------------------ Tests Done ---------------------');


