#!/usr/bin/env node

var sys = require('sys');
var http = require('http');
var assert = require('assert');

var test = require('./simple-test');

var fjord = require('./fjord');
var log       = fjord.log;
var WebObject = fjord.WebObject;
var Cache     = fjord.Cache;


fjord.init({ "thisPort": -1 });

sys.puts('------------------ Fjord Networking Tests ---------------------');

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
test.isEqual("JSON of shell is empty", Cache[o1].content, {});

var expectedRefs = {}; expectedRefs[o2]=true;
var expectedOutlinks = {}; expectedOutlinks[o1]=true;

test.isEqual("Refs of shell are just o2", Cache[o1].refs, expectedRefs);
test.isEqual("Outlinks of o2 are just o1", Cache[o2].outlinks, expectedOutlinks);

rules3 = [
  WebObject.create('{ "tags": "thr", "o1": { "tags": "one", "state": "/number;$n/" }, "state": "/number/fix(1,number($n)+0.1)/" }'),
];

o3 = WebObject.create('{ "tags": "thr", "state": "0", "o1": "'+o1+'" }', rules3);

expectedRefs[o3]=true;

test.isEqual("Refs of shell are o2 and o3", Cache[o1].refs, expectedRefs);

// -------------------------------------------------------------------

var o1rule1=null;
var o1obj=null;

http.createClient(8080, "localhost")
    .request("GET", "/a/b/c/owid-ca0b-0a35-9289-9f8a.json", { "Host": "localhost:8080" })
    .finish(function(response){
        var owid = response.headers["content-location"];
        var etag = parseInt(response.headers["etag"].substring(1));
        var body = "";
        response.setBodyEncoding("utf8");
        response.addListener("body", function(chunk){ body+=chunk; });
        response.addListener("complete", function(){ o1rule1 = { "owid": owid, "etag": etag, "content": JSON.parse(body) }; });
    });

http.createClient(8080, "localhost")
    .request("GET", "/x/y/z/owid-73c2-4046-fe02-7312.json", { "Host": "localhost:8080" })
    .finish(function(response){
        var owid = response.headers["content-location"];
        var etag = parseInt(response.headers["etag"].substring(1));
        var body = "";
        response.setBodyEncoding("utf8");
        response.addListener("body", function(chunk){ body+=chunk; });
        response.addListener("complete", function(){ o1obj = { "owid": owid, "etag": etag, "content": JSON.parse(body) }; });
    });

// -------------------------------------------------------------------

process.addListener("exit", function () {

    test.isEqual("Test Server returned correct o1 rule on direct fetch", o1rule1,
                 {"owid":"owid-ca0b-0a35-9289-9f8a",
                  "etag":1,
                  "content":{"tags":"one","%refs":{"tags":"two","state":"/number;$n/"},"state":"/number/fix(1,number($n)+0.1)/"}
                 });

    test.isEqual("Test Server returned correct o1 on direct fetch", o1obj,
                 {"owid":"owid-73c2-4046-fe02-7312",
                  "etag":3,
                  "content":{"tags":"one","state":"0"}
                 });

    test.jsonEqual("Full o1 is now in place", Cache[o1],
                   {"owid":o1,
                    "etag":3,
                    "content":{"tags":"one","state":"0"},
                    "outlinks":{},
                    "refs": expectedRefs
                   });

    test.jsonEqual("Now o2 has new state", Cache[o2],
                   {"owid":o2,
                    "etag":1,
                    "content":{ "tags": "two", "state": "0.1", "o1": o1 },
                    "rules": rules2,
                    "outlinks":expectedOutlinks,
                    "refs": {},
                    "_id":o2,
                    "modified": true
                   });

    // ---------------------------------------------------------------

    test.summary();
});

// -------------------------------------------------------------------


