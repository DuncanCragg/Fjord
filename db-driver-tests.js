#!/usr/bin/env node

var sys   = require('sys');
var assert = require('assert');

var test = require('./simple-test');

var fjord = require('./fjord');
var log       = fjord.log;
var WebObject = fjord.WebObject;
var Cache     = fjord.Cache;


sys.puts('------------------ Fjord DB Driver Tests ---------------------');

WebObject.logUpdates=false;

// -------------------------------------------------------------------

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

test.isTrue("Referring to evicted object reloads it into the cache from disk", Cache[o1]!==undefined);

test.objectsEqual("Double Observer ping-pong finished on o1",
      Cache[o1], new WebObject('{ "tags": "one", "state":"done" }'));

test.objectsEqual("Double Observer ping-pong finished on o2",
      Cache[o2], new WebObject('{ "tags": "two", "state":"done", "o1":"'+o1+'" }'));

// -------------------------------------------------------------------

test.summary();

// -------------------------------------------------------------------


