
var sys   = require('sys');
var assert = require('assert');

var test = require('./simple-test');

var fjord = require('./fjord');
var log       = fjord.log;
var WebObject = fjord.WebObject;
var Cache     = fjord.Cache;


sys.puts('------------------ Fjord Tests ---------------------');

// -------------------------------------------------------------------

var r11 = WebObject.create('{ "tags": "one", "state": "/11/12/", "%refs": { "tags": "two", "state": "22" } }');
var r12 = WebObject.create('{ "tags": "one", "state": "/12/13/", "%refs": { "tags": "two", "state": "23" } }');

var r21 = WebObject.create('{ "tags": "two", "state": "/21/22/", "o1": { "state": "11" } }');
var r22 = WebObject.create('{ "tags": "two", "state": "/22/23/", "o1": { "state": "12" } }');


var o1  = WebObject.create('{ "tags": "one", "state": "11" }',                 [ r11, r12 ] );
var o2  = WebObject.create('{ "tags": "two", "state": "21", "o1": "'+o1+'" }', [ r21, r22 ] );


test.objectsEqual("Double Observer ping-pong worked on o1",
      Cache[o1], new WebObject('{ "tags": "one", "state":"13" }'));

test.objectsEqual("Double Observer ping-pong worked on o2",
      Cache[o2], new WebObject('{ "tags": "two", "state":"23", "o1":"'+o1+'" }'));

test.isTrue("Etag of o1 now 2", Cache[o1].etag===2);
test.isTrue("Etag of o2 now 2", Cache[o2].etag===2);

// -------------------------------------------------------------------

r1 = WebObject.create('{ "%etag": "/0;$e/", "a": "/array/has($e)/" }');
r2 = WebObject.create('{ "%etag": "/1;$e/", "a": "/array/has($e)/" }');
r3 = WebObject.create('{ "%etag": "/2;$e/", "a": "/array/has(1)/"  }');
r4 = WebObject.create('{ "%etag": "/2;$e/", "a": "/array/has($e)/" }');

obj = WebObject.create('{ "a": [ ] }', [ r1, r2, r3, r4 ]);
Cache[obj].runRules();
Cache[obj].runRules();
Cache[obj].runRules();

test.objectsEqual("Etag starts at 0, increments only on change", 
                   Cache[obj], 
                   new WebObject('{ "a": [ "0", "1", "2" ] }'));

log("obj=", Cache[obj]);

// -------------------------------------------------------------------

test.summary();

// -------------------------------------------------------------------


