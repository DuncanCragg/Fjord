#!/usr/bin/env node

var sys   = require('sys');
var assert = require('assert');

var test = require('./simple-test');

var fjord = require('./fjord');
var log       = fjord.log;
var WebObject = fjord.WebObject;
var Cache     = fjord.Cache;

// -----------------------------------------------------------------------

WebObject.logUpdates=false;

fjord.init({ "thisPort": 8081 });

sys.puts('------------------ Instrument Tests ---------------------');

// -------------------------------------------------------------------

instrule1=WebObject.create('{ "tags": [ "equity", "instrument" ],'+
                           '  "%owid": "/$this/",'+
                           '  "%refs": { "tags": [ "equity", "bid" ],'+
                           '             "%owid": "/$bid/",'+
                           '             "on": "/$this/" },'+
                           '  "buyers": "/array/has($bid)/" }');

instrule2=WebObject.create('{ "tags": [ "equity", "instrument" ],'+
                           '  "%owid": "/$this/",'+
                           '  "%refs": { "tags": [ "equity", "ask" ],'+
                           '             "%owid": "/$ask/",'+
                           '             "on": "/$this/" },'+
                           '  "sellers": "/array/has($ask)/" }');

instrule3=WebObject.create('{ "tags": [ "equity", "instrument" ],'+
                           '  "buyers":  { "price": "/$bids;number/" },'+
                           '  "bid-ask-spread": { "high-bid": "/number/max($bids)/" } }');

instrule4=WebObject.create('{ "tags": [ "equity", "instrument" ],'+
                           '  "sellers": { "price": "/$asks;number/" },'+
                           '  "bid-ask-spread": { "low-ask":  "/number/min($asks)/" } }');

// ---------------

instrument=WebObject.create('{ "tags": [ "equity", "instrument" ],'+
                            '  "long-name": "Acme Co., Inc",'+
                            '  "buyers": [ ],'+
                            '  "sellers": [ ],'+
                            '  "bid-ask-spread": { "high-bid": "10.0", "low-ask":  "20.0" } }',
                            [ instrule1, instrule2, instrule3, instrule4 ] );

// ---------------

bidrule=WebObject.create('{ "tags": [ "equity", "bid" ],'+
                         '  "on": { "tags": [ "equity", "instrument" ],'+
                         '          "bid-ask-spread": { "high-bid": "/$hibid;number/" } },'+
                         '  "price": "/null/fix(2, $hibid * 1.10 )/" }');

askrule=WebObject.create('{ "tags": [ "equity", "ask" ],'+
                         '  "on": { "tags": [ "equity", "instrument" ],'+
                         '          "bid-ask-spread": { "low-ask": "/$loask;number/" } },'+
                         '  "price": "/null/fix(2, $loask * 0.90 )/" }');

// ---------------

bid1=WebObject.create('{ "tags": [ "equity", "bid" ], "on": "'+instrument+'", "price": "" }', [ bidrule ]);
bid2=WebObject.create('{ "tags": [ "equity", "bid" ], "on": "'+instrument+'", "price": "" }', [ bidrule ]);
ask1=WebObject.create('{ "tags": [ "equity", "ask" ], "on": "'+instrument+'", "price": "" }', [ askrule ]);
ask2=WebObject.create('{ "tags": [ "equity", "ask" ], "on": "'+instrument+'", "price": "" }', [ askrule ]);

// ---------------

expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "buyers":  [ "'+bid1+'", "'+bid2+'" ],'+
                         '  "sellers": [ "'+ask1+'", "'+ask2+'" ],'+
                         '  "bid-ask-spread": { "high-bid": "12.1", "low-ask":  "16.2" } }')

test.objectsEqual("Observer works", Cache[instrument], expected);

// -------------------------------------------------------------------

instrule1=WebObject.create('{ "%owid": "/$this/",'+
                           '  "%refs": { "tags": [ "equity", "bid" ],'+
                           '             "price": "/$bids;number/" },'+
                           '  "tags": [ "equity", "instrument" ],'+
                           '  "bid-ask-spread": { "high-bid": "/number/max($bids)/" } }');

instrule2=WebObject.create('{ "%owid": "/$this/",'+
                           '  "%refs": { "tags": [ "equity", "ask" ],'+
                           '             "price": "/$asks;number/" },'+
                           '  "tags": [ "equity", "instrument" ],'+
                           '  "bid-ask-spread": { "low-ask": "/number/min($asks)/" } }');

askrule2=WebObject.create('{ "tags": [ "equity", "ask" ],'+
                          '  "on": { "tags": [ "equity", "instrument" ],'+
                          '          "bid-ask-spread": { "low-ask": "/$price;number/" } },'+
                          '  "price": "/$price/15/" }');

askrule3=WebObject.create('{ "tags": [ "equity", "ask" ],'+
                          '  "on": "/owid/reference dropped/",'+
                          '  "price": "/15/" }');

// ---------------

instrument=WebObject.create('{ "tags": [ "equity", "instrument" ],'+
                            '  "long-name": "Acme Co., Inc",'+
                            '  "bid-ask-spread": { "high-bid": "10.0", "low-ask":  "20.0" } }',
                            [ instrule1, instrule2 ] );

// ---------------

bid1=WebObject.create('{ "tags": [ "equity", "bid" ], "on": "'+instrument+'", "price": "" }', [ bidrule ]);
bid2=WebObject.create('{ "tags": [ "equity", "bid" ], "on": "'+instrument+'", "price": "" }', [ bidrule ]);
ask1=WebObject.create('{ "tags": [ "equity", "ask" ], "on": "'+instrument+'", "price": "" }', [ askrule ]);
ask2=WebObject.create('{ "tags": [ "equity", "ask" ], "on": "'+instrument+'", "price": "" }', [ askrule ]);
ask3=WebObject.create('{ "tags": [ "equity", "ask" ], "on": "'+instrument+'", "price": "" }', [ askrule, askrule2, askrule3 ]);

// ---------------

expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "bid-ask-spread": { "high-bid": "12.1", "low-ask":  "16.2" } }')

test.objectsEqual("When reference dropped, refs drop referrer", Cache[instrument], expected);

// -------------------------------------------------------------------

perinst="owid-f33d-d433-90e7-4608";

var perbid1, perbid2, perask1, perask2;

perbid1=WebObject.create('{ "tags": [ "equity", "bid" ], "on": "'+perinst+'", "price": "" }', [ bidrule ]);

setTimeout(function(){

perbid2=WebObject.create('{ "tags": [ "equity", "bid" ], "on": "'+perinst+'", "price": "" }', [ bidrule ]);

setTimeout(function(){

perask1=WebObject.create('{ "tags": [ "equity", "ask" ], "on": "'+perinst+'", "price": "" }', [ askrule ]);

setTimeout(function(){

perask2=WebObject.create('{ "tags": [ "equity", "ask" ], "on": "'+perinst+'", "price": "" }', [ askrule ]);

setTimeout(function(){

Cache.pollObject(perinst);

}, 200);
}, 200);
}, 200);
}, 200);

// ---------------

process.addListener("exit", function () {

expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "buyers":  [ "'+perbid1+'", "'+perbid2+'" ],'+
                         '  "sellers": [ "'+perask1+'", "'+perask2+'" ],'+
                         '  "bid-ask-spread": { "high-bid": "12.1", "low-ask":  "16.2" } }')

test.objectsEqual("Persistent, Networked Instrument worked", Cache[perinst], expected);

// -------------------------------------------------------------------

test.summary();

});

setTimeout(fjord.close, 1000);

// -------------------------------------------------------------------




