
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


var o1  = WebObject.create('{ "tags": "one", "state": "11" }',                  [ r11, r12 ] );
var o2  = WebObject.create('{ "tags": "two", "state": "21", "o1": "@'+o1+'" }', [ r21, r22 ] );


test.objectsEqual("Double Observer ping-pong worked on o1",
      Cache[o1], new WebObject('{ "tags": "one", "state":"13" }'));

test.objectsEqual("Double Observer ping-pong worked on o2",
      Cache[o2], new WebObject('{ "tags": "two", "state":"23", "o1":"@'+o1+'" }'));

// -------------------------------------------------------------------

test.summary();

// -------------------------------------------------------------------


