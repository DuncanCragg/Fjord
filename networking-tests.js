#!/usr/bin/env node

var sys = require('sys');
var assert = require('assert');

var test = require('./simple-test');

var fjord = require('./fjord');
var log       = fjord.log;
var WebObject = fjord.WebObject;
var Cache     = fjord.Cache;


sys.puts('------------------ Fjord Network Tests ---------------------');

WebObject.logUpdates=false;

// -------------------------------------------------------------------

rules2 = [
  WebObject.create('{ "tags": "two", "o1":    { "tags": "one", "state": "/number;$n/" }, "state": "/number/fix(1,number($n)+0.1)/" }'),
  WebObject.create('{ "tags": "two", "state": "/gt(10)/done/" }')
];

o1 = "owid-73c2-4046-fe02-7312";
o2 = WebObject.create('{ "tags": "two", "state": "0", "o1": "'+o1+'" }', rules2);

test.isTrue("Referring to remote object creates shell", Cache[o1]);

test.isEqual("OWID of shell is o1", Cache[o1].owid, o1);
test.isEqual("JSON of shell is empty", Cache[o1].json, {});

var expectedRefs = {}; expectedRefs[o2]=true;

test.isEqual("Refs of shell are just o2", Cache[o1].refs, expectedRefs);

rules3 = [
  WebObject.create('{ "tags": "thr", "o1": { "tags": "one", "state": "/number;$n/" }, "state": "/number/fix(1,number($n)+0.1)/" }'),
];

o3 = WebObject.create('{ "tags": "thr", "state": "0", "o1": "'+o1+'" }', rules3);

expectedRefs[o3]=true;

test.isEqual("Refs of shell are o2 and o3", Cache[o1].refs, expectedRefs);

// -------------------------------------------------------------------

test.summary();

// -------------------------------------------------------------------


