
var sys   = require('sys');
var assert = require('assert');

var test = require('./simple-test');

var fjord = require('./fjord');
var log       = fjord.log;
var WebObject = fjord.WebObject;


sys.puts('------------------ Fjord Tests ---------------------');

// -------------------------------------------------------------------

test.objectsEqual("WebObjects should be deepEqual even if hash reordered",
                new WebObject('{ "a": "b", "c": [ "d" ] }'),
                new WebObject('{ "c": [ "d" ], "a": "b" }')
);

test.isTrue("WebObjects should be equal even if hash reordered",
            new WebObject('{ "a": "b", "c": [ "d" ] }')
            .equals(
            new WebObject('{ "c": [ "d" ], "a": "b" }')
            )
);

test.isFalse("WebObjects that aren't equal should not come up equal",
             new WebObject('{ "a": "b", "c": [ "D" ] }')
             .equals(
             new WebObject('{ "c": [ "d" ], "a": "b" }')
             )
);

// -----------------------------------------------------------------------

test.objectsEqual("WebObject with less should match one with more",
            new WebObject('{ "a": "b", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "c": [ "d" ], "a": "b", "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "d" ], "test": "RHS" }')
);

test.objectsEqual("WebObject with mismatch should not match",
            new WebObject('{ "a": "B", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "c": [ "d" ], "a": "b", "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "d" ], "test": "LHS" }')
);

test.objectsEqual("WebObject with more should not match one with less",
            new WebObject('{ "a": "b", "c": [ "d" ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "test": "LHS" }')
);

test.objectsEqual("Array equality checked when hashes differ",
            new WebObject('{ "a": "b", "c": [ "e", "d" ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "c": [ "e", "d" ], "f": "g", "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "e", "d" ], "f": "g", "test": "RHS" }')
);

test.objectsEqual("WebObject with less in array should match one with more",
            new WebObject('{ "a": "b", "c": [ "d", "dd" ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", "dd", "g" ], "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", "dd", "g" ], "test": "RHS" }')
);

test.objectsEqual("WebObject with more in array should not match one with less",
            new WebObject('{ "a": "b", "c": [ "d", "f", "dd" ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "c": [ "d", "dd" ], "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "d", "dd" ], "test": "LHS" }')
);

test.objectsEqual("Array elements can be complex",
            new WebObject('{ "a": "b", "c": [ "d", { "dd": "ee" } ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", { "dd": "ee" }, "g" ], "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "e", "d", "f", { "dd": "ee" }, "g" ], "test": "RHS" }')
);

test.objectsEqual("Disjoint arrays don't match - or array order matters",
            new WebObject('{ "a": "b", "c": [ "d", "dd" ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": "b", "c": [ "e", "dd", "f", "d", "g" ], "test": "LHS" }')
            ),
            new WebObject('{ "a": "b", "c": [ "e", "dd", "f", "d", "g" ], "test": "LHS" }')
);

// -----------------------------------------------------------------------

test.objectsEqual("Empty matches slash-null-slash",
            new WebObject('{ "price": "/null/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "price": "", "test": "LHS" }')
            ),
            new WebObject('{ "price": "", "test": "RHS" }')
);

test.objectsEqual("Number matches slash-number-slash",
            new WebObject('{ "high-bid": "/number/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "high-bid": "10.00", "test": "LHS" }')
            ),
            new WebObject('{ "high-bid": "10.00", "test": "RHS" }')
);

test.objectsEqual("Number inside string doesn't match slash-number-slash",
            new WebObject('{ "high-bid": "/number/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "high-bid": "xx10.00xx", "test": "LHS" }')
            ),
            new WebObject('{ "high-bid": "xx10.00xx", "test": "LHS" }')
);

test.objectsEqual("Array matches slash-array-slash",
            new WebObject('{ "tags": "/array/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "tags": [ "equity", "bid" ], "test": "LHS" }')
            ),
            new WebObject('{ "tags": [ "equity", "bid" ], "test": "RHS" }')
);

test.objectsEqual("String matches slash-string-slash",
            new WebObject('{ "on": "/string/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "on": "rope", "test": "LHS" }')
            ),
            new WebObject('{ "on": "rope", "test": "RHS" }')
);

test.objectsEqual("OWID matches slash-owid-slash",
            new WebObject('{ "on": "/owid/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "on": "owid-94ff-ec0b-a354-c299", "test": "LHS" }')
            ),
            new WebObject('{ "on": "owid-94ff-ec0b-a354-c299", "test": "RHS" }')
);

test.objectsEqual("Object matches slash-object-slash",
            new WebObject('{ "on": "/object/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "on": { "tags": [ "bid" ] }, "test": "LHS" }')
            ),
            new WebObject('{ "on": { "tags": [ "bid" ] }, "test": "RHS" }')
);

test.objectsEqual("Reserved word 'null' doesn't match literally",
            new WebObject('{ "price": "/null/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "price": "null", "test": "LHS" }')
            ),
            new WebObject('{ "price": "null", "test": "LHS" }')
);

test.objectsEqual("Empty match matches anything",
            new WebObject('{ "price": "/;;/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "price": "anything", "test": "LHS" }')
            ),
            new WebObject('{ "price": "anything", "test": "RHS" }')
);

test.objectsEqual("Can use JS regular expressions to match",
            new WebObject('{ "price": "/any[th]*ing/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "price": "anything", "test": "LHS" }')
            ),
            new WebObject('{ "price": "anything", "test": "RHS" }')
);

test.objectsEqual("Can use JS regular expressions to match numbers",
            new WebObject('{ "price": "/^[0-9]+[\.]*[0-9]*$/", "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "price": "123.123", "test": "LHS" }')
            ),
            new WebObject('{ "price": "123.123", "test": "RHS" }')
);

// -----------------------------------------------------------------------

test.objectsEqual("Can fix decimals of float",
            new WebObject('{ "a": { "b": "//fix(3,1/3)/" } }')
            .applyTo(
            new WebObject('{ "a": { "b": "" } }')
            ),
            new WebObject('{ "a": { "b": "0.333" } }')
);

// -----------------------------------------------------------------------

test.objectsEqual("Rewrites null to a string",
            new WebObject('{ "a": "/null/b/" }')
            .applyTo(
            new WebObject('{ "x": "y", "a": "" }')
            ),
            new WebObject('{ "x": "y", "a": "b" }')
);

test.objectsEqual("Rewrites on a sub-object item",
            new WebObject('{ "a": { "b": "/c/d/" } }')
            .applyTo(
            new WebObject('{ "a": { "b": "c", "x": "y" } }')
            ),
            new WebObject('{ "a": { "b": "d", "x": "y" } }')
);

test.objectsEqual("Rewrites number inside object",
            new WebObject('{ "a": { "b": "/number/12.0/" } }')
            .applyTo(
            new WebObject('{ "a": { "b": "11.0", "x": "y" } }')
            ),
            new WebObject('{ "a": { "b": "12", "x": "y" } }')
);

// -------------------------------------------------------------------

test.objectsEqual("Rewrites null to a string in an array",
            new WebObject('{ "a": [ "/null/d/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "x", "", "y" ] }')
            ),
            new WebObject('{ "a": [ "x", "d", "y" ] }')
);

test.objectsEqual("Rewrites on a sub-array item",
            new WebObject('{ "a": [ "/c/d/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "x", "c", "y" ] }')
            ),
            new WebObject('{ "a": [ "x", "d", "y" ] }')
);

test.objectsEqual("Rewrites number inside sub-array item",
            new WebObject('{ "a": [ "/number/12.0/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "x", "11.0", "y" ] }')
            ),
            new WebObject('{ "a": [ "x", "12", "y" ] }')
);

test.objectsEqual("Rewrites on many array items with one element match",
            new WebObject('{ "a": "/c/d/" }')
            .applyTo(
            new WebObject('{ "a": [ "c", "c", "c" ] }')
            ),
            new WebObject('{ "a": [ "d", "d", "d" ] }')
);

test.objectsEqual("Rewrites on an array item with two and a half matches in rotation",
            new WebObject('{ "a": [ "/c/d/", "/number/5.0/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "e", "x", "c", "y", "1.0", "z", "c", "y", "2.0", "z", "c", "z" ] }')
            ),
            new WebObject('{ "a": [ "e", "x", "d", "y", "5", "z", "d", "y", "5", "z", "d", "z" ] }')
);

test.objectsEqual("Single item matches its existence in array",
            new WebObject('{ "buyers":   { "price": "/number/" }, "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "buyers": [ { "price": "" }, { "price": "11.0" } ], "test": "LHS" }')
            ),
            new WebObject('{ "buyers": [ { "price": "" }, { "price": "11.0" } ], "test": "RHS" }')
);

test.objectsEqual("Single item matches in array and rewrites it each time",
            new WebObject('{ "buyers":   { "price": "/number/12.0/" }, "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "buyers": [ { "price": "10.0" }, { "price": "none" }, { "price": "11.0" } ], "test": "LHS" }')
            ),
            new WebObject('{ "buyers": [ { "price": "12" }, { "price": "none" }, { "price": "12" } ], "test": "RHS" }')
);

// -------------------------------------------------------------------

var rule = new WebObject('{ "from": "/array;$x/", "copy": "/null/$x/" }');
var obj  = new WebObject('{ "from": [ "a", "b" ], "copy": ""          }');

rule.applyTo(obj);

var expected = new WebObject('{ "from": [ "a", "b" ], "copy": [ "a", "b" ] }');

test.objectsEqual("Binding array to rhs makes a copy", obj, expected);

test.isTrue("Using binding of array on rhs copies array", obj.json.copy!==obj.json.from);

// -------------------------------------------------------------------

obj  = new WebObject('{ "hello": "" }');

rule = new WebObject('{ "hello": "/bye/world/" }');

obj.modified=false;
rule.applyTo(obj)

test.isTrue("If rule isn't applied, result modified flag not set", !obj.modified);

rule = new WebObject('{ "hello": "/null/world/" }');

obj.modified=false;
rule.applyTo(obj);

test.isTrue("If rule is applied, result modified flag set", obj.modified);
test.isTrue("If rule is applied, result == target",  obj.equals(new WebObject('{ "hello": "world" }')));

rule = new WebObject('{ "hello": "/world/world/" }');

obj.modified=false;
rule.applyTo(obj);

test.isTrue("If rule is applied but result unchanged, result modified flag not set", !obj.modified);

// -------------------------------------------------------------------

test.objectsEqual("Matches lt and gt - less or greater than",
            new WebObject('{ "a": [ "/gt(3.0)/3+/", "/lt(1.0)/1-/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "3.1", "0.9", "3.0", "1.0" ] }')
            ),
            new WebObject('{ "a": [ "3+",  "1-",  "3.0", "1.0" ] }')
);

test.objectsEqual("Matches semicolon list as 'and'",
            new WebObject('{ "a": [ "/number;gt(1.0);lt(3.0)/1..3/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "3.0", "2.0", "1.0" ] }')
            ),
            new WebObject('{ "a": [ "3.0", "1..3", "1.0" ] }')
);

test.objectsEqual("Within match iteration, variables bound and must agree",
            new WebObject('{ "a": [ "/$x/", "/$x/end/" ], "b": "/null/$x/" }')
            .applyTo(
            new WebObject('{ "a": [ "3.0", "3.0", "4.0", "5.0", "4.0", "6.0" ], "b": "" }')
            ),
            new WebObject('{ "a": [ "3.0", "end", "4.0", "5.0", "end", "6.0" ], "b": [ "3.0", "4.0", "6.0" ] }')
);

test.objectsEqual("More match iteration complexity",
            new WebObject('{ "a": [ "/number;$x/", "/$x/end/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "xxx", "3.0", "xxx", "3.0", "xxx", "4.0", "xxx", "3.0", "xxx", "4.0" ] }')
            ),
            new WebObject('{ "a": [ "xxx", "3.0", "xxx", "end", "xxx", "4.0", "xxx", "3.0", "xxx", "end" ] }')
);

test.objectsEqual("Binds to variable above and matches greater than it",
            new WebObject('{ "a": [ "/number;$x/", "/gt($x)/greater/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "3.0", [ "3.0", "3.1",     "0.0", "4.0",     "2.9" ] ] }')
            ),
            new WebObject('{ "a": [ "3.0", [ "3.0", "greater", "0.0", "greater", "2.9" ] ] }')
);

test.objectsEqual("Uses variable in rewrite",
            new WebObject('{ "a": [ "/number;$x/", "/gt($x);$y/$y greater than $x/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "2.0", "1.0", "3.1" ] }')
            ),
            new WebObject('{ "a": [ "2.0", "1.0", "3.1 greater than 2.0" ] }')
);

test.objectsEqual("Correctly fails to match when tag differs but val is empty",
            new WebObject('{ "here": { "nowhere": "" }, "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "here": { "there": "1.0" }, "test": "LHS" }')
            ),
            new WebObject('{ "here": { "there": "1.0" }, "test": "LHS" }')
);

// -------------------------------------------------------------------

var there = new WebObject('{ "there": "1.0" }');
var thereOWID = there.owid;
test.isTrue("WebObject has a OWID", thereOWID);

test.objectsEqual("Jumps link and matches in another object",
            new WebObject('{ "here": { "there": "/number/" }, "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "here": "'+thereOWID+'", "test": "LHS" }')
            ),
            new WebObject('{ "here": "'+thereOWID+'", "test": "RHS" }')
);

test.objectsEqual("Jumps link and correctly fails to match in another object",
            new WebObject('{ "here": { "there": "/1.1/" }, "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "here": "'+thereOWID+'", "test": "LHS" }')
            ),
            new WebObject('{ "here": "'+thereOWID+'", "test": "LHS" }')
);

test.objectsEqual("Won't rewrite in linked object",
            new WebObject('{ "here": { "there": "/number/xxx/" }, "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "here": "'+thereOWID+'", "test": "LHS" }')
            ),
            new WebObject('{ "here": "'+thereOWID+'", "test": "RHS" }')
);

test.objectsEqual("Can see sub-object owid",
            new WebObject('{ "here": "/$owid/", "test": "/LHS/$owid/" }')
            .applyTo(
            new WebObject('{ "here": "'+thereOWID+'", "test": "LHS" }')
            ),
            new WebObject('{ "here": "'+thereOWID+'", "test": "'+thereOWID+'" }')
);

test.objectsEqual("Can see sub-object owid by %owid",
            new WebObject('{ "here": { "%owid": "/$owid/" }, "test": "/LHS/$owid/" }')
            .applyTo(
            new WebObject('{ "here": "'+thereOWID+'", "test": "LHS" }')
            ),
            new WebObject('{ "here": "'+thereOWID+'", "test": "'+thereOWID+'" }')
);

// -------------------------------------------------------------------

test.objectsEqual("Creates match set when binding inside array",
            new WebObject('{ "a": { "b": "/number;$matchset/" }, "test": "/null/$matchset/" }')
            .applyTo(
            new WebObject('{ "a": [ { "b": "1.5" }, { "b": "2.5" } ], "test": "" }')
            ),
            new WebObject('{ "a": [ { "b": "1.5" }, { "b": "2.5" } ], "test": [ "1.5", "2.5" ] }')
);

test.objectsEqual("Creates match set when binding inside array with match failures",
            new WebObject('{ "a": { "b": "/number;$matchset/" }, "test": "/null/$matchset/" }')
            .applyTo(
            new WebObject('{ "a": [ { "b": "1.5" }, { "b": "hi" }, { "b": "2.5" } ], "test": "" }')
            ),
            new WebObject('{ "a": [ { "b": "1.5" }, { "b": "hi" }, { "b": "2.5" } ], "test": [ "1.5", "2.5" ] }')
);

test.objectsEqual("Creates match set when binding inside array with match failures and bind before fail",
            new WebObject('{ "a": { "b": "/$matchset;number/" }, "test": "/null/$matchset/" }')
            .applyTo(
            new WebObject('{ "a": [ { "b": "1.5" }, { "b": "hi" }, { "b": "2.5" } ], "test": "" }')
            ),
            new WebObject('{ "a": [ { "b": "1.5" }, { "b": "hi" }, { "b": "2.5" } ], "test": [ "1.5", "2.5" ] }')
);
/*
test.objectsEqual("Creates match set when binding inside array with match failures and bind before fail in array",
            new WebObject('{ "a": [ "/$matchset/", "/number/" ], "test": "/null/$matchset/" }')
            .applyTo(
            new WebObject('{ "a": [ [ "in1", "1.5" ], [ "out", "hi" ], [ "in2", "2.5" ] ], "test": "" }')
            ),
            new WebObject('{ "a": [ [ "in1", "1.5" ], [ "out", "hi" ], [ "in2", "2.5" ] ], "test": [ "in1", "in2" ] }')
);
*/
/*
test.objectsEqual("Match set binding matches a single value with nested arrays",
            new WebObject('{ "a": [ [ "/$x/" ], "/$x/" ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": [ [ "b", "c", "d" ], "c" ], "test": "LHS" }')
            ),
            new WebObject('{ "a": [ [ "b", "c", "d" ], "c" ], "test": "RHS" }')
);
*/
test.objectsEqual("Can get min and max of a match set",
            new WebObject('{ "a": "/number;$matchset/", "min": "/null/min($matchset)/", "max": "/null/max($matchset)/" }')
            .applyTo(
            new WebObject('{ "a": [ "1.5", "1.0", "2.5", "2.0" ], "min": "", "max": "" }')
            ),
            new WebObject('{ "a": [ "1.5", "1.0", "2.5", "2.0" ], "min": "1.0", "max": "2.5" }')
);

test.objectsEqual("Match set with one element reduces to that element",
            new WebObject('{ "a": "/$matchset/", "matchset": "/null/$matchset/" }')
            .applyTo(
            new WebObject('{ "a": [ "1.5" ], "matchset": "" }')
            ),
            new WebObject('{ "a": [ "1.5" ], "matchset": "1.5" }')
);

test.objectsEqual("Single binding matches a match set",
            new WebObject('{ "a": [ "/$x/", "/$x/" ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": [ "c", [ "b", "c", "d" ] ], "test": "LHS" }')
            ),
            new WebObject('{ "a": [ "c", [ "b", "c", "d" ] ], "test": "RHS" }')
);

test.objectsEqual("Single binding matches a match set",
            new WebObject('{ "a": [ "/$x/", [ "/$x/" ] ], "test": "/LHS/RHS/" }')
            .applyTo(
            new WebObject('{ "a": [ "c", [ "b", "c", "d" ] ], "test": "LHS" }')
            ),
            new WebObject('{ "a": [ "c", [ "b", "c", "d" ] ], "test": "RHS" }')
);

// -------------------------------------------------------------------

r1=new WebObject('{ "r": { "n": "/$x/", "tags": [ "x" ] },'+
                 '  "xs": "/array/has($x)/" }');

r2=new WebObject('{ "r": { "n": "/$y/", "tags": [ "y" ] },'+
                 '  "ys": "/array/has($y)/" }');

ob=new WebObject('{ "r": [ { "n": "111", "tags": [ "x" ] },'+
                 '         { "n": "222", "tags": [ "y" ] },'+
                 '         { "n": "333", "tags": [ "x" ] },'+
                 '         { "n": "444", "tags": [ "y" ] } ],'+
                 '  "xs": [ ],'+
                 '  "ys": [ ] }');

r1.applyTo(ob);
r2.applyTo(ob);

expected = new WebObject('{ "r": [ { "n": "111", "tags": [ "x" ] },'+
                         '         { "n": "222", "tags": [ "y" ] },'+
                         '         { "n": "333", "tags": [ "x" ] },'+
                         '         { "n": "444", "tags": [ "y" ] } ],'+
                         '  "xs": [ "111", "333" ],'+
                         '  "ys": [ "222", "444" ] }');

test.objectsEqual("Can bind to filtered match set with bind before filter", ob, expected);

// -------------------------------------------------------------------

r1=new WebObject('{ "r": { "tags": [ "x" ], "n": "/$x/" },'+
                 '  "xs": "/array/has($x)/" }');

r2=new WebObject('{ "r": { "tags": [ "y" ], "n": "/$y/" },'+
                 '  "ys": "/array/has($y)/" }');

ob=new WebObject('{ "r": [ { "n": "111", "tags": [ "x" ] },'+
                 '         { "n": "222", "tags": [ "y" ] },'+
                 '         { "n": "333", "tags": [ "x" ] },'+
                 '         { "n": "444", "tags": [ "y" ] } ],'+
                 '  "xs": [ ],'+
                 '  "ys": [ ] }');

r1.applyTo(ob);
r2.applyTo(ob);

expected = new WebObject('{ "r": [ { "n": "111", "tags": [ "x" ] },'+
                         '         { "n": "222", "tags": [ "y" ] },'+
                         '         { "n": "333", "tags": [ "x" ] },'+
                         '         { "n": "444", "tags": [ "y" ] } ],'+
                         '  "xs": [ "111", "333" ],'+
                         '  "ys": [ "222", "444" ] }');
                     
test.objectsEqual("Can bind to filtered match set with filter before bind", ob, expected);

// -------------------------------------------------------------------

test.objectsEqual("Can filter list by greater-than and bindings before failure",
            new WebObject('{ "people": { "tags": "/$tags;string/", "age": "/$ages;gt(21)/" }, "ages": "/null/$ages/", "tags": "/null/$tags/" }')
            .applyTo(
            new WebObject('{ "people": [ { "tags": "me20", "age": "20" }, { "tags": "me21", "age": "21" }, { "tags": "me22", "age": "22" }, { "tags": "me23", "age": "23" } ], "ages": "", "tags": "" }')
            ),
            new WebObject('{ "people": [ { "tags": "me20", "age": "20" }, { "tags": "me21", "age": "21" }, { "tags": "me22", "age": "22" }, { "tags": "me23", "age": "23" } ], "ages": [ "22", "23" ], "tags": [ "me22", "me23" ] }')
);

// -------------------------------------------------------------------

var p1 = new WebObject('{ "tags": "person", "age": "21" }');
var p2 = new WebObject('{ "tags": "person", "age": "22" }');
var p3 = new WebObject('{ "tags": "person", "age": "15" }');
var p4 = new WebObject('{ "tags": "person", "age": "35" }');
var p5 = new WebObject('{ "tags": "person", "age": "-35" }');
var p6 = new WebObject('{ "tags": "person", "age": "25" }');

test.objectsEqual("Can get owids and ages of adults from person list",
            new WebObject('{ "people": { "%owid": "/$owids/", "tags": "person", "age": "/gt(21);$ages/" }, "adults": "/null/$owids/", "ages": "/null/$ages/" }')
            .applyTo(
            new WebObject('{ "people": [ "'+p1.owid+'", "'+p2.owid+'", "'+p3.owid+'", "'+p4.owid+'", "'+p5.owid+'", "'+p6.owid+'" ], "ages": "", "adults": "" }')
            ),
            new WebObject('{ "people": [ "'+p1.owid+'", "'+p2.owid+'", "'+p3.owid+'", "'+p4.owid+'", "'+p5.owid+'", "'+p6.owid+'" ], "adults": [ "'+p2.owid+'", "'+p4.owid+'", "'+p6.owid+'" ], "ages": [ "22", "35", "25" ] }')
);

// -------------------------------------------------------------------

var rule     = new WebObject('{ "a": [ "/$x/", "/array/has($x)/" ] }')
var obj      = new WebObject('{ "a": [ "k", [ "j" ] ] }')
var expected = new WebObject('{ "a": [ "k", [ "j", "k" ] ] }')

rule.applyTo(obj);

test.objectsEqual("Adds to array if not there with has()", obj, expected);

test.isTrue("Web object different even though only changed inside an array", obj.modified);

test.objectsEqual("Won't add again with has() if already there",
            new WebObject('{ "a": [ "/$x/", "/array/has($x)/" ] }')
            .applyTo(
            new WebObject('{ "a": [ "k", [ "j", "k" ] ] }')
            ),
            new WebObject('{ "a": [ "k", [ "j", "k" ] ] }')
);

// -------------------------------------------------------------------

var obj=new WebObject('{ "hasowid": [ "foo" ], "test": "LHS" }');
var owid   =obj.owid;


var rule1 = new WebObject('{ "%owid": "/$owid/", "hasowid": "/array/has($owid)/" }');

rule1.applyTo(obj);

var expected=new WebObject('{ "hasowid": [ "foo", "'+owid+'" ], "test": "LHS"  }');

test.objectsEqual("Can get object owid and put it into an array", obj, expected);


var rule2 = new WebObject('{ "hasowid": { "hasowid": { "hasowid": { "hasowid": "foo" } } }, "test": "/LHS/RHS/" }');

rule2.applyTo(obj);

var expected2=new WebObject('{ "hasowid": [ "foo", "'+owid+'" ], "test": "RHS"  }');

test.objectsEqual("Can match self circularly now", obj, expected2);


var rule3  =new WebObject('{ "hasowid": "/$owid/", "%owid": "/$owid/", "test": "/RHS/rhs/" }');

var expected3=new WebObject('{ "hasowid": [ "foo", "'+owid+'" ], "test": "rhs"  }');

rule3.applyTo(obj);

test.objectsEqual("Can match own owid inside the array", obj, expected3);


var rule4  =new WebObject('{ "%owid": { "%owid": { "hasowid": "'+owid+'" } }, "test": "/rhs/RHS/" }');

var expected4=new WebObject('{ "hasowid": [ "foo", "'+owid+'" ], "test": "RHS"  }');

rule4.applyTo(obj);

test.objectsEqual("Can delve into %owid to see self", obj, expected4);

// -------------------------------------------------------------------

test.summary();

// -------------------------------------------------------------------


