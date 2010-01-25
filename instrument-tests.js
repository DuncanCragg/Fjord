
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
                     '  "price": "/null/fix(2, $hibid * 1.10 )/" }');

askrl1=new WebObject('{ "tags": [ "equity", "ask" ],'+
                     '  "on": { "tags": [ "equity", "instrument" ],'+
                     '          "bid-ask-spread": { "low-ask": "/$loask;number/" } },'+
                     '  "price": "/null/fix(2, $loask * 0.90 )/" }');

insrl1=new WebObject('{ "%owid": "/$this/",'+
                     '  "%refs": { "%owid": "/$bid/",'+
                     '             "tags": [ "equity", "bid" ],'+
                     '             "on": "/$this/" },'+
                     '  "tags": [ "equity", "instrument" ],'+
                     '  "buyers": "/array/has($bid)/" }');

insrl2=new WebObject('{ "%owid": "/$this/",'+
                     '  "%refs": { "%owid": "/$ask/",'+
                     '             "tags": [ "equity", "ask" ],'+
                     '             "on": "/$this/" },'+
                     '  "tags": [ "equity", "instrument" ],'+
                     '  "sellers": "/array/has($ask)/" }');

insrl3=new WebObject('{ "tags": [ "equity", "instrument" ],'+
                     '  "buyers":  { "price": "/$bids;number/" },'+
                     '  "sellers": { "price": "/$asks;number/" },'+
                     '  "bid-ask-spread": { "high-bid": "/number/max($bids)/",'+
                     '                      "low-ask":  "/number/min($asks)/" } }');

insrl4=new WebObject('{ "%owid": "/$this/",'+
                     '  "%refs": { "tags": [ "equity", "bid" ],'+
                     '             "on": "/$this/",'+
                     '             "price": "/$bids;number/" },'+
                     '  "tags": [ "equity", "instrument" ],'+
                     '  "bid-ask-spread": { "high-bid": "/number/max($bids)/" } }');

insrl5=new WebObject('{ "%owid": "/$this/",'+
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

bidone=new WebObject('{ "tags": [ "equity", "bid" ], "on": "'+instru.owid+'", "price": "" }');
askone=new WebObject('{ "tags": [ "equity", "ask" ], "on": "'+instru.owid+'", "price": "" }');

// ---------------

bidrl1.applyTo(bidone);
askrl1.applyTo(askone);

test.objectsEqual("First Bid rule works on first bid", bidone, 
           new WebObject('{ "tags": [ "equity", "bid" ], "on": "'+instru.owid+'", "price": "11" }'));

test.objectsEqual("First Ask rule works on first ask", askone, 
           new WebObject('{ "tags": [ "equity", "ask" ], "on": "'+instru.owid+'", "price": "18" }'));

// ---------------

insrl1.applyTo(instru);
insrl2.applyTo(instru);

expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "buyers":  [ "'+bidone.owid+'" ],'+
                         '  "sellers": [ "'+askone.owid+'" ],'+
                         '  "bid-ask-spread": { "high-bid": "10.0", "low-ask":  "20.0" } }');

test.objectsEqual("First and Second Instrument rules work on first bid/ask", instru, expected);

// ---------------

insrl3.applyTo(instru);

expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "buyers":  [ "'+bidone.owid+'" ],'+
                         '  "sellers": [ "'+askone.owid+'" ],'+
                         '  "bid-ask-spread": { "high-bid": "11", "low-ask":  "18" } }');

test.objectsEqual("Third Instrument rule works on first bid/ask", instru, expected);

// ---------------

bidtwo=new WebObject('{ "tags": [ "equity", "bid" ], "on": "'+instru.owid+'", "price": "" }');
asktwo=new WebObject('{ "tags": [ "equity", "ask" ], "on": "'+instru.owid+'", "price": "" }');

bidrl1.applyTo(bidtwo);
askrl1.applyTo(asktwo);

test.objectsEqual("First Bid rule works on second bid", bidtwo, 
           new WebObject('{ "tags": [ "equity", "bid" ], "on": "'+instru.owid+'", "price": "12.1" }'));

test.objectsEqual("First Ask rule works on second ask", asktwo, 
           new WebObject('{ "tags": [ "equity", "ask" ], "on": "'+instru.owid+'", "price": "16.2" }'));

// ---------------

insrl1.applyTo(instru);
insrl2.applyTo(instru);

expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "buyers":  [ "'+bidone.owid+'", "'+bidtwo.owid+'" ],'+
                         '  "sellers": [ "'+askone.owid+'", "'+asktwo.owid+'" ],'+
                         '  "bid-ask-spread": { "high-bid": "11", "low-ask":  "18" } }')

test.objectsEqual("First and Second Instrument rules work on second bid/ask", instru, expected);

// ---------------

insrl3.applyTo(instru);

expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "buyers":  [ "'+bidone.owid+'", "'+bidtwo.owid+'" ],'+
                         '  "sellers": [ "'+askone.owid+'", "'+asktwo.owid+'" ],'+
                         '  "bid-ask-spread": { "high-bid": "12.1", "low-ask":  "16.2" } }')

test.objectsEqual("Third Instrument rule works on second bid/ask", instru, expected);

// -------------------------------------------------------------------

instru.apply(new WebObject('{ "bid-ask-spread": { "high-bid": "/number/0/" } }'));
instru.apply(new WebObject('{ "bid-ask-spread": { "low-ask":  "/number/0/" } }'));

expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "buyers":  [ "'+bidone.owid+'", "'+bidtwo.owid+'" ],'+
                         '  "sellers": [ "'+askone.owid+'", "'+asktwo.owid+'" ],'+
                         '  "bid-ask-spread": { "high-bid": "0", "low-ask":  "0" } }')

test.objectsEqual("Spread reset to zero", instru, expected);

insrl4.applyTo(instru);
insrl5.applyTo(instru);

expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "buyers":  [ "'+bidone.owid+'", "'+bidtwo.owid+'" ],'+
                         '  "sellers": [ "'+askone.owid+'", "'+asktwo.owid+'" ],'+
                         '  "bid-ask-spread": { "high-bid": "12.1", "low-ask":  "16.2" } }')

test.objectsEqual("Fourth/Fifth Instrument rules work - alternative approach", instru, expected);

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

test.summary();

// -------------------------------------------------------------------




