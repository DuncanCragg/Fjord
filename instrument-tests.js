
var sys   = require('sys');
var assert = require('assert');

var test = require('./simple-test');

var fjord = require('./fjord');
var log       = fjord.log;
var WebObject = fjord.WebObject;
var Cache     = fjord.Cache;

// -----------------------------------------------------------------------

WebObject.logUpdates=true;

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

test.objectsEqual("Observer version works", Cache[instrument], expected);

// -------------------------------------------------------------------

instrule5=WebObject.create('{ "%owid": "/$this/",'+
                           '  "%refs": { "tags": [ "equity", "bid" ],'+
                           '             "on": "/$this/",'+
                           '             "price": "/$bids;number/" },'+
                           '  "tags": [ "equity", "instrument" ],'+
                           '  "bid-ask-spread": { "high-bid": "/number/max($bids)/" } }');

instrule6=WebObject.create('{ "%owid": "/$this/",'+
                           '  "%refs": { "tags": [ "equity", "ask" ],'+
                           '             "on": "/$this/",'+
                           '             "price": "/$asks;number/" },'+
                           '  "tags": [ "equity", "instrument" ],'+
                           '  "bid-ask-spread": { "low-ask": "/number/min($asks)/" } }');

// -------------------------------------------------------------------

test.summary();

// -------------------------------------------------------------------




