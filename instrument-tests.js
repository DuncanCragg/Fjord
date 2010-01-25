
var sys   = require('sys');
var assert = require('assert');

var test = require('./simple-test');

var fjord = require('./fjord');
var log       = fjord.log;
var WebObject = fjord.WebObject;
var Cache     = fjord.Cache;

// -----------------------------------------------------------------------

sys.puts('------------------ Instrument Tests ---------------------');

bidrl1=new WebObject('{ "tags": [ "equity", "bid" ],'+
                     '  "on": { "tags": [ "equity", "instrument" ],'+
                     '          "bid-ask-spread": { "high-bid": "/$hibid;number/" } },'+
                     '  "price": "/null/( $hibid * 1.10 )/" }');

askrl1=new WebObject('{ "tags": [ "equity", "ask" ],'+
                     '  "on": { "tags": [ "equity", "instrument" ],'+
                     '          "bid-ask-spread": { "low-ask": "/$loask;number/" } },'+
                     '  "price": "/null/( $loask * 0.90 )/" }');

insrl1=new WebObject('{ "%uid": "/$this/",'+
                     '  "%refs": { "%uid": "/$bid/",'+
                     '             "tags": [ "equity", "bid" ],'+
                     '             "on": "/$this/" },'+
                     '  "tags": [ "equity", "instrument" ],'+
                     '  "buyers": "/array/has($bid)/" }');

insrl2=new WebObject('{ "%uid": "/$this/",'+
                     '  "%refs": { "%uid": "/$ask/",'+
                     '             "tags": [ "equity", "ask" ],'+
                     '             "on": "/$this/" },'+
                     '  "tags": [ "equity", "instrument" ],'+
                     '  "sellers": "/array/has($ask)/" }');

insrl3=new WebObject('{ "tags": [ "equity", "instrument" ],'+
                     '  "buyers":  { "price": "/$bids;number/" },'+
                     '  "sellers": { "price": "/$asks;number/" },'+
                     '  "bid-ask-spread": { "high-bid": "/number/max($bids)/",'+
                     '                      "low-ask":  "/number/min($asks)/" } }');

insrl4=new WebObject('{ "%uid": "/$this/",'+
                     '  "%refs": { "tags": [ "equity", "bid" ],'+
                     '             "on": "/$this/",'+
                     '             "price": "/$bids;number/" },'+
                     '  "tags": [ "equity", "instrument" ],'+
                     '  "bid-ask-spread": { "high-bid": "/number/max($bids)/" } }');

insrl5=new WebObject('{ "%uid": "/$this/",'+
                     '  "%refs": { "tags": [ "equity", "ask" ],'+
                     '             "on": "/$this/",'+
                     '             "price": "/$asks;number/" },'+
                     '  "tags": [ "equity", "instrument" ],'+
                     '  "bid-ask-spread": { "low-ask": "/number/min($asks)/" } }');

// ---------------

instru=new WebObject('{ "tags": [ "equity", "instrument" ],'+
                     '  "long-name": "Acme Co., Inc",'+
                     '  "buyers": [ ],'+
                     '  "sellers": [ ],'+
                     '  "bid-ask-spread": { "high-bid": "10.0", "low-ask":  "20.0" } }');

bidone=new WebObject('{ "tags": [ "equity", "bid" ], "on": "@'+instru.uid+'", "price": "" }');
askone=new WebObject('{ "tags": [ "equity", "ask" ], "on": "@'+instru.uid+'", "price": "" }');

// ---------------

bidone=bidrl1.applyTo(bidone);
askone=askrl1.applyTo(askone);

test.objectsEqual("First Bid rule works on first bid", bidone, 
           new WebObject('{ "tags": [ "equity", "bid" ], "on": "@'+instru.uid+'", "price": "11" }'));

test.objectsEqual("First Ask rule works on first ask", askone, 
           new WebObject('{ "tags": [ "equity", "ask" ], "on": "@'+instru.uid+'", "price": "18" }'));

// ---------------

instru=insrl1.applyTo(instru);
instru=insrl2.applyTo(instru);

expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "buyers":  [ "@'+bidone.uid+'" ],'+
                         '  "sellers": [ "@'+askone.uid+'" ],'+
                         '  "bid-ask-spread": { "high-bid": "10.0", "low-ask":  "20.0" } }');

test.objectsEqual("First and Second Instrument rules work on first bid/ask", instru, expected);

// ---------------

instru=insrl3.applyTo(instru);

expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "buyers":  [ "@'+bidone.uid+'" ],'+
                         '  "sellers": [ "@'+askone.uid+'" ],'+
                         '  "bid-ask-spread": { "high-bid": "11", "low-ask":  "18" } }');

test.objectsEqual("Third Instrument rule works on first bid/ask", instru, expected);

// ---------------

bidtwo=new WebObject('{ "tags": [ "equity", "bid" ], "on": "@'+instru.uid+'", "price": "" }');
asktwo=new WebObject('{ "tags": [ "equity", "ask" ], "on": "@'+instru.uid+'", "price": "" }');

bidtwo=bidrl1.applyTo(bidtwo);
asktwo=askrl1.applyTo(asktwo);

test.objectsEqual("First Bid rule works on second bid", bidtwo, 
           new WebObject('{ "tags": [ "equity", "bid" ], "on": "@'+instru.uid+'", "price": "12.100000000000001" }'));

test.objectsEqual("First Ask rule works on second ask", asktwo, 
           new WebObject('{ "tags": [ "equity", "ask" ], "on": "@'+instru.uid+'", "price": "16.2" }'));

// ---------------

instru=insrl1.applyTo(instru);
instru=insrl2.applyTo(instru);

expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "buyers":  [ "@'+bidone.uid+'", "@'+bidtwo.uid+'" ],'+
                         '  "sellers": [ "@'+askone.uid+'", "@'+asktwo.uid+'" ],'+
                         '  "bid-ask-spread": { "high-bid": "11", "low-ask":  "18" } }')

test.objectsEqual("First and Second Instrument rules work on second bid/ask", instru, expected);

// ---------------

instru=insrl3.applyTo(instru);

expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "buyers":  [ "@'+bidone.uid+'", "@'+bidtwo.uid+'" ],'+
                         '  "sellers": [ "@'+askone.uid+'", "@'+asktwo.uid+'" ],'+
                         '  "bid-ask-spread": { "high-bid": "12.100000000000001", "low-ask":  "16.2" } }')

test.objectsEqual("Third Instrument rule works on second bid/ask", instru, expected);

// -------------------------------------------------------------------

instru=instru.apply(new WebObject('{ "bid-ask-spread": { "high-bid": "/number/0/" } }'));
instru=instru.apply(new WebObject('{ "bid-ask-spread": { "low-ask":  "/number/0/" } }'));

expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "buyers":  [ "@'+bidone.uid+'", "@'+bidtwo.uid+'" ],'+
                         '  "sellers": [ "@'+askone.uid+'", "@'+asktwo.uid+'" ],'+
                         '  "bid-ask-spread": { "high-bid": "0", "low-ask":  "0" } }')

test.objectsEqual("Spread reset to zero", instru, expected);

instru=insrl4.applyTo(instru);
instru=insrl5.applyTo(instru);

expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "buyers":  [ "@'+bidone.uid+'", "@'+bidtwo.uid+'" ],'+
                         '  "sellers": [ "@'+askone.uid+'", "@'+asktwo.uid+'" ],'+
                         '  "bid-ask-spread": { "high-bid": "12.100000000000001", "low-ask":  "16.2" } }')

test.objectsEqual("Fourth/Fifth Instrument rules work - alternative approach", instru, expected);

// -------------------------------------------------------------------

Cache.notifyqueue = [];

// -------------------------------------------------------------------

instrule1=WebObject.create('{ "tags": [ "equity", "instrument" ],'+
                           '  "%uid": "/$this/",'+
                           '  "%refs": { "tags": [ "equity", "bid" ],'+
                           '             "%uid": "/$bid/",'+
                           '             "on": "/$this/" },'+
                           '  "buyers": "/array/has($bid)/" }');

instrule2=WebObject.create('{ "tags": [ "equity", "instrument" ],'+
                           '  "%uid": "/$this/",'+
                           '  "%refs": { "tags": [ "equity", "ask" ],'+
                           '             "%uid": "/$ask/",'+
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
                         '  "price": "/null/( $hibid * 1.10 )/" }');

askrule=WebObject.create('{ "tags": [ "equity", "ask" ],'+
                         '  "on": { "tags": [ "equity", "instrument" ],'+
                         '          "bid-ask-spread": { "low-ask": "/$loask;number/" } },'+
                         '  "price": "/null/( $loask * 0.90 )/" }');

// ---------------

bid1=WebObject.create('{ "tags": [ "equity", "bid" ], "on": "@'+instrument+'", "price": "" }', [ bidrule ]);
bid2=WebObject.create('{ "tags": [ "equity", "bid" ], "on": "@'+instrument+'", "price": "" }', [ bidrule ]);
ask1=WebObject.create('{ "tags": [ "equity", "ask" ], "on": "@'+instrument+'", "price": "" }', [ askrule ]);
ask2=WebObject.create('{ "tags": [ "equity", "ask" ], "on": "@'+instrument+'", "price": "" }', [ askrule ]);

// ---------------

expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "buyers":  [ "@'+bid1+'", "@'+bid2+'" ],'+
                         '  "sellers": [ "@'+ask1+'", "@'+ask2+'" ],'+
                         '  "bid-ask-spread": { "high-bid": "12.100000000000001", "low-ask":  "16.2" } }')

test.objectsEqual("Observer version works", Cache[instrument], expected);

// -------------------------------------------------------------------

test.summary();

// -------------------------------------------------------------------




