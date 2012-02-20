#!/usr/bin/env node

var util = require('util');
var assert = require('assert');

var test = require('./simple-test');

var fjord = require('./fjord');
var log       = fjord.log;
var WebObject = fjord.WebObject;
var Cache     = fjord.Cache;


WebObject.logUpdates=false;

// -------------------------------------------------------------------

var persistenceReady = function(){

util.puts('------------------ Fjord Persistence Tests ---------------------');

rules1 = [ 
  WebObject.create('{ "tags": "one", "%refs": { "tags": "two", "state": "/number;$n/" }, "state": "/number/fix(1,number($n)+0.1)/" }'),
  WebObject.create('{ "tags": "one", "%refs": { "tags": "two", "state": "done" },        "state": "/number/done/" }')
];

rules2 = [
  WebObject.create('{ "tags": "two", "o1":    { "tags": "one", "state": "/number;$n/" }, "state": "/number/fix(1,number($n)+0.1)/" }'),
  WebObject.create('{ "tags": "two", "state": "/gt(10)/done/" }')
];

o1 = WebObject.create('{ "tags": "one", "state": "0" }', rules1);

Cache.evict(o1);

test.isTrue("Cache.evict removes object from the cache", Cache[o1]===undefined);

o2 = WebObject.create('{ "tags": "two", "state": "0", "o1": "'+o1+'" }', rules2);

test.isTrue("Referring to evicted object reloads it into the cache", Cache[o1]!==undefined);

test.objectsEqual("Double Observer ping-pong finished on o1",
      Cache[o1], new WebObject('{ "tags": "one", "state":"done" }'));

test.objectsEqual("Double Observer ping-pong finished on o2",
      Cache[o2], new WebObject('{ "tags": "two", "state":"done", "o1":"'+o1+'" }'));

// -------------------------------------------------------------------

p1 = "owid-2688-1726-63ea-3871";
rules3 = ["owid-d8c3-abbc-aa60-6311","owid-227f-cdfa-2eff-2aca"];

test.isTrue("Persisted object not pulled in to cache immediately", Cache[p1]===undefined);

o3 = WebObject.create('{ "tags": "two", "state": "0", "o1": "'+p1+'" }', rules3);

test.isTrue("Referring to persisted object reloads it into the cache from disk", Cache[p1]!==undefined);

test.objectsEqual("Double Observer ping-pong finished on persisted o1",
      Cache[p1], new WebObject('{ "tags": "one", "state":"done" }'));

test.objectsEqual("Double Observer ping-pong finished on o3",
      Cache[o3], new WebObject('{ "tags": "two", "state":"done", "o1":"'+p1+'" }'));


// -------------------------------------------------------------------

test.summary();

// -------------------------------------------------------------------

}

fjord.init({ "dbLoaded": persistenceReady, "thisPort": -1 });

