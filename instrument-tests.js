
var sys   = require('sys');
var assert = require('assert');

var test = require('./simple-test');

var fjord = require('./fjord');
var WebObject = fjord.WebObject;

// -----------------------------------------------------------------------

sys.puts('------------------ Instrument Tests ---------------------');

var bidrl1=new WebObject('{ "tags": [ "equity", "bid" ],'+
                         '  "on": { "tags": [ "equity", "instrument" ],'+
                         '          "bid-ask-spread": { "high-bid": "/$hibid;number/" } },'+
                         '  "price": "/null/( $hibid * 1.10 )/" }');

var insrl1=new WebObject('{ "%uid": "/$this/",'+
                         '  "%refs": { "%uid": "/$bid/",'+
                         '             "tags": [ "equity", "bid" ],'+
                         '             "on": "/$this/" },'+
                         '  "tags": [ "equity", "instrument" ],'+
                         '  "buyers": "/array/has($bid)/" }');

var insrl2=new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "buyers":  { "price": "/$bids;number/" },'+
                         '  "sellers": { "price": "/$asks;number/" },'+
                         '  "bid-ask-spread": { "high-bid": "/number/max($bids)/",'+
                         '                      "low-ask":  "/number/min($asks)/" } }');

// ---------------

var bidone=new WebObject('{ "tags": [ "equity", "bid" ], "on": "@000-000", "price": "10.00" }');
var askone=new WebObject('{ "tags": [ "equity", "ask" ], "on": "@000-000", "price": "15.00" }');
var asktwo=new WebObject('{ "tags": [ "equity", "ask" ], "on": "@000-000", "price": "14.00" }');

var instru=new WebObject('{ "tags": [ "equity", "instrument" ],'+
                         '  "long-name": "Acme Co., Inc",'+
                         '  "buyers": [ "@'+bidone.uid+'" ],'+
                         '  "sellers": [ "@'+askone.uid+'", "@'+asktwo.uid+'" ],'+
                         '  "bid-ask-spread": { "high-bid": "1.0", "low-ask":  "1.0" } }');

// ---------------

var instru=insrl2.applyTo(instru);

var expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                             '  "long-name": "Acme Co., Inc",'+
                             '  "buyers":  [ "@'+bidone.uid+'" ],'+
                             '  "sellers": [ "@'+askone.uid+'", "@'+asktwo.uid+'" ],'+
                             '  "bid-ask-spread": { "high-bid": "10", "low-ask":  "14.00" } }')

test.objectsEqual("Second Instrument rule works", instru, expected);

// ---------------

var bidnew=new WebObject('{ "tags": [ "equity", "bid" ], "on": "@'+instru.uid+'", "price": "" }');

var bidnew=bidrl1.applyTo(bidnew);

test.objectsEqual("First Bid rule works", bidnew, 
           new WebObject('{ "tags": [ "equity", "bid" ], "on": "@'+instru.uid+'", "price": "11" }'));

// ---------------

var instru=insrl1.applyTo(instru);

var expected = new WebObject('{ "tags": [ "equity", "instrument" ],'+
                             '  "long-name": "Acme Co., Inc",'+
                             '  "buyers":  [ "@'+bidone.uid+'", "@'+bidnew.uid+'" ],'+
                             '  "sellers": [ "@'+askone.uid+'", "@'+asktwo.uid+'" ],'+
                             '  "bid-ask-spread": { "high-bid": "10", "low-ask":  "14.00" } }')

test.objectsEqual("First Instrument rule works", instru, expected);

// -------------------------------------------------------------------

test.summary();

// -------------------------------------------------------------------




