
var util = require('util');
var assert = require('assert');

var test = require('./simple-test');

var fjord = require('./fjord');
var log       = fjord.log;
var WebObject = fjord.WebObject;
var Cache     = fjord.Cache;

WebObject.logUpdates=true;


util.puts('------------------ Fjord Observer Tests ---------------------');

// -------------------------------------------------------------------
/*
r21 = WebObject.create('{ "tags": "two", "state": "/21/22/", "o1": { "%owid": "/$o1/", "state": "11" }, "%notify": "//has($o1)/" }');
r22 = WebObject.create('{ "tags": "two", "state": "/22/23/", "o1": {                   "state": "12" } }');

r11 = WebObject.create('{ "tags": "one", "state": "/11/12/", "%notified": { "tags": "two", "state": "22" } }');
r12 = WebObject.create('{ "tags": "one", "state": "/12/13/", "%notified": { "tags": "two", "state": "23" } }');

o1  = WebObject.create('{ "tags": "one", "state": "11" }',                 [ r11, r12 ] );
o2  = WebObject.create('{ "tags": "two", "state": "21", "o1": "'+o1+'" }', [ r21, r22 ] );


test.objectsEqual("Double Observer ping-pong worked on o1",
      Cache[o1], new WebObject('{ "tags": "one", "state":"13" }'));

test.objectsEqual("Double Observer ping-pong worked on o2",
      Cache[o2], new WebObject('{ "tags": "two", "state":"23", "o1":"'+o1+'" }'));

test.isTrue("Etag of o1 now 3", Cache[o1].etag===3);
test.isTrue("Etag of o2 now 3", Cache[o2].etag===3);
*/
// -------------------------------------------------------------------

r11 = WebObject.create('{ "tags": "one", "state": "/11/12/", "%refs": { "tags": "two", "state": "22" } }');
r12 = WebObject.create('{ "tags": "one", "state": "/12/13/", "%refs": { "tags": "two", "state": "23" } }');

r21 = WebObject.create('{ "tags": "two", "state": "/21/22/", "o1": { "state": "11" } }');
r22 = WebObject.create('{ "tags": "two", "state": "/22/23/", "o1": { "state": "12" } }');


o1  = WebObject.create('{ "tags": "one", "state": "11" }',                 [ r11, r12 ] );
o2  = WebObject.create('{ "tags": "two", "state": "21", "o1": "'+o1+'" }', [ r21, r22 ] );


test.objectsEqual("Double Observer ping-pong worked on o1",
      Cache[o1], new WebObject('{ "tags": "one", "state":"13" }'));

test.objectsEqual("Double Observer ping-pong worked on o2",
      Cache[o2], new WebObject('{ "tags": "two", "state":"23", "o1":"'+o1+'" }'));

test.isTrue("Etag of o1 now 2", Cache[o1].etag===3);
test.isTrue("Etag of o2 now 2", Cache[o2].etag===3);

// -------------------------------------------------------------------

r1 = WebObject.create('{ "%etag": "/1;$e/", "a": "/array/has($e)/" }');
r2 = WebObject.create('{ "%etag": "/2;$e/", "a": "/array/has($e)/" }');
r3 = WebObject.create('{ "%etag": "/3;$e/", "a": "/array/has(2)/"  }');
r4 = WebObject.create('{ "%etag": "/3;$e/", "a": "/array/has($e)/" }');

obj = WebObject.create('{ "a": [ ] }', [ r1, r2, r3, r4 ]);
Cache[obj].runRules();
Cache[obj].runRules();
Cache[obj].runRules();

test.objectsEqual("Etag starts at 1, increments only on change", 
                   Cache[obj], 
                   new WebObject('{ "a": [ "1", "2", "3" ] }'));

// -------------------------------------------------------------------

r11 = WebObject.create('{ "tags": "one", "state": "/11/12/", "%refs": [ { "state": "22" }, { "state": "32" } ] }');
r12 = WebObject.create('{ "tags": "one", "state": "/12/13/", "%refs": [ { "state": "23" }, { "state": "33" } ] }');
r13 = WebObject.create('{ "tags": "one", "state": "/13/14/", "%refs": [ { "state": "24" }, { "state": "34" } ] }');

r21 = WebObject.create('{ "tags": "two", "state": "/21/22/", "o1": { "state": "11" } }');
r22 = WebObject.create('{ "tags": "two", "state": "/22/23/", "o1": { "state": "12" } }');
r23 = WebObject.create('{ "tags": "two", "state": "/23/24/", "o1": { "state": "13" } }');

r31 = WebObject.create('{ "tags": "thr", "state": "/31/32/", "o1": { "state": "11" } }');
r32 = WebObject.create('{ "tags": "thr", "state": "/32/33/", "o1": { "state": "12" } }');
r33 = WebObject.create('{ "tags": "thr", "state": "/33/34/", "o1": { "state": "13" } }');


o1  = WebObject.create('{ "tags": "one", "state": "11" }',                 [ r11, r12, r13 ] );
o2  = WebObject.create('{ "tags": "two", "state": "21", "o1": "'+o1+'" }', [ r21, r22, r23 ] );
o3  = WebObject.create('{ "tags": "thr", "state": "31", "o1": "'+o1+'" }', [ r31, r32, r33 ] );


test.objectsEqual("Triple Observer ping-pong worked on o1",
                   Cache[o1], new WebObject('{ "tags": "one", "state":"14" }'));

test.objectsEqual("Triple Observer ping-pong worked on o2",
                   Cache[o2], new WebObject('{ "tags": "two", "state":"24", "o1":"'+o1+'" }'));

test.objectsEqual("Triple Observer ping-pong worked on o3",
                   Cache[o3], new WebObject('{ "tags": "thr", "state":"34", "o1":"'+o1+'" }'));

test.isTrue("Etag of o1 now 3", Cache[o1].etag===4);
test.isTrue("Etag of o2 now 3", Cache[o2].etag===4);
test.isTrue("Etag of o3 now 3", Cache[o3].etag===4);

// -------------------------------------------------------------------

r11 = WebObject.create('{ "tags": "one", "state": "/11/12/", "%refs": [ { "state": "22" }, { "state": "32" } ] }');
r12 = WebObject.create('{ "tags": "one", "state": "/12/13/", "%refs": [ { "state": "23" }, { "state": "33" } ] }');
r13 = WebObject.create('{ "tags": "one", "state": "/13/14/", "%refs": [ { "state": "24" }, { "state": "33" } ] }');

r21 = WebObject.create('{ "tags": "two", "state": "/21/22/", "o1": { "state": "11" } }');
r22 = WebObject.create('{ "tags": "two", "state": "/22/23/", "o1": { "state": "12" } }');
r23 = WebObject.create('{ "tags": "two", "state": "/23/24/", "o1": { "state": "13" } }');

r31 = WebObject.create('{ "tags": "thr", "state": "/31/32/", "o1": { "state": "11" } }');
r32 = WebObject.create('{ "tags": "thr", "state": "/32/30/", "o1": { "state": "12" } }');
r33 = WebObject.create('{ "tags": "thr", "state": "/30/33/", "o1": "/owid/ /"        }');


o1  = WebObject.create('{ "tags": "one", "state": "11" }',                 [ r11, r12, r13 ] );
o2  = WebObject.create('{ "tags": "two", "state": "21", "o1": "'+o1+'" }', [ r21, r22, r23 ] );
o3  = WebObject.create('{ "tags": "thr", "state": "31", "o1": "'+o1+'" }', [ r31, r32, r33 ] );


test.objectsEqual("State of o1 doesn't reach 14 since it isn't referred to/observed by o3 any more",
                   Cache[o1], new WebObject('{ "tags": "one", "state":"13" }'));

test.objectsEqual("State of o2 gets to 24",
                   Cache[o2], new WebObject('{ "tags": "two", "state":"24", "o1":"'+o1+'" }'));

test.objectsEqual("State of o3 gets to 33",
                   Cache[o3], new WebObject('{ "tags": "thr", "state":"33", "o1":" " }'));

// -------------------------------------------------------------------

r11 = WebObject.create('{ "tags": "one", "state": "/11/12/", "%refs": [ { "state": "22" }, { "state": "32" } ] }');
r12 = WebObject.create('{ "tags": "one", "state": "/12/13/", "%refs": [ { "state": "23" } ] }');
r13 = WebObject.create('{ "tags": "one", "state": "/13/14/", "%refs": [ { "state": "24" } ] }');
r14 = WebObject.create('{ "tags": "one", "state": "12",      "%refs": "/$refs/", "refs": "/array/add!([$refs])/" }');

r21 = WebObject.create('{ "tags": "two", "state": "/21/22/", "o1": { "state": "11" } }');
r22 = WebObject.create('{ "tags": "two", "state": "/22/23/", "o1": { "state": "12" } }');
r23 = WebObject.create('{ "tags": "two", "state": "/23/24/", "o1": { "state": "13" } }');

r31 = WebObject.create('{ "tags": "thr", "state": "/31/32/", "o2": { "state": "22" }, "o1": { "state": "//" } }');
r32 = WebObject.create('{ "tags": "thr", "state": "/32/33/", "o2": { "state": "23" }, "o1": { "state": "//" } }');
r33 = WebObject.create('{ "tags": "thr", "state": "/33/34/", "o2": { "state": "24" }, "o1": { "state": "//" } }');


o1  = WebObject.create('{ "tags": "one", "state": "11", "refs": [] }',                     [ r11, r12, r13, r14 ] );
o2  = WebObject.create('{ "tags": "two", "state": "21", "o1": "'+o1+'" }',                 [ r21, r22, r23 ] );
o3  = WebObject.create('{ "tags": "thr", "state": "31", "o2": "'+o2+'", "o1": "'+o1+'" }', [ r31, r32, r33 ] );

test.isTrue(      "o1 got to 14",
                   Cache[o1].content.state==14);

test.objectsEqual("o2 got to 24",
                   Cache[o2], new WebObject('{ "tags": "two", "state":"24", "o1":"'+o1+'" }'));

test.objectsEqual("o3 got to 34",
                   Cache[o3], new WebObject('{ "tags": "thr", "state":"34", "o2": "'+o2+'", "o1":"'+o1+'" }'));

// -------------------------------------------------------------------

test.summary();

// -------------------------------------------------------------------


