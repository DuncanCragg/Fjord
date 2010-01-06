
var sys   = require('sys');
var assert = require('assert');

var fjord = require('./fjord');
var WebObject = fjord.WebObject;

// -----------------------------------------------------------------------

function assertTrue(message, condition){
    sys.puts(message);
    assert.ok(condition, message);
    sys.puts("OK");
}

function assertFalse(message, condition){
    sys.puts(message);
    assert.ok(!condition, message);
    sys.puts("OK");
}

function assertDeepEqual(message, o1, o2){
    sys.puts(message);
    assert.deepEqual(o1, o2, message);
    sys.puts("OK");
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

assertTrue("Disjoint lists don't match - or list order matters",
            new WebObject('{ "a": "b", "c": [ "d", "dd" ] }')
            .match(
            new WebObject('{ "a": "b", "c": [ "e", "dd", "f", "d", "g" ] }')
            )==null
);

sys.puts('------------------ Tests Done ---------------------');


