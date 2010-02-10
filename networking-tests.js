#!/usr/bin/env node

var sys = require('sys');
var http = require('http');
var assert = require('assert');

var test = require('./simple-test');

var fjord = require('./fjord');
var log       = fjord.log;
var WebObject = fjord.WebObject;
var Cache     = fjord.Cache;


fjord.init({ "thisPort": 8081 });

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

// -------------------------------------------------------------------

rules3 = [
  WebObject.create('{ "tags": "thr", "o1": { "tags": "one", "state": "/number;$n/" }, "state": "/number/fix(1,number($n)+0.1)/" }'),
];

o3 = WebObject.create('{ "tags": "thr", "state": "0", "o1": "'+o1+'" }', rules3);

expectedRefs[o3]=true;

test.isEqual("Refs of shell are o2 and o3", Cache[o1].refs, expectedRefs);
test.isEqual("Outlinks of o3 are just o1", Cache[o2].outlinks, expectedOutlinks);

// -------------------------------------------------------------------

var client = http.createClient(8080, "localhost");

var headers = { "Host": "localhost:8080" };
client.request("GET", "/a/b/c/owid-ca0b-0a35-9289-9f8a.json", headers).finish(function(response){

var statusCode = response.statusCode;
test.isEqual("Status is 200", 200, statusCode);

var owid = response.headers["content-location"].match(/(owid-[-0-9a-z]+)\.json$/)[1];
test.isEqual("OWID is correct in Content-Location", "owid-ca0b-0a35-9289-9f8a", owid);

var etag = parseInt(response.headers["etag"].substring(1));
test.isEqual("ETag is 1", 1, etag);

var body = "";
response.setBodyEncoding("utf8");
response.addListener("body", function(chunk){ body+=chunk; });
response.addListener("complete", function(){
test.isEqual("Test Server returned correct o1 rule on direct fetch", JSON.parse(body),
     {"tags":"one","%refs":{"tags":"two","state":"/number;$n/"},"state":"/number/fix(1,number($n)+0.1)/"}
);

headers["If-None-Match"] = '"1"';
client.request("GET", "/a/b/c/owid-ca0b-0a35-9289-9f8a.json", headers).finish(function(response){

var statusCode = response.statusCode;
test.isEqual("Status is 304", 304, statusCode);

var etag = parseInt(response.headers["etag"].substring(1));
test.isEqual("ETag is 1", 1, etag);

response.addListener("complete", function(){

// -------------------------------------------------------------------

rules4 = [
  WebObject.create('{ "tags": "fou", "o1": { "tags": "one", "state": "/number;$n/" }, "state": "/number/fix(1,number($n)+0.1)/" }'),
];

o4 = WebObject.create('{ "tags": "fou", "state": "0", "o1": "'+o1+'" }', rules4);

expectedRefs[o4]=true;

test.isEqual("Refs of shell are o2, o3 and o4", Cache[o1].refs, expectedRefs);
test.isEqual("Outlinks of o4 are just o1", Cache[o2].outlinks, expectedOutlinks);

// -------------------------------------------------------------------

}); }); }); });

// -------------------------------------------------------------------

process.addListener("exit", function () {

    // ---------------------------------------------------------------

    test.jsonEqual("Full o1 is now in place", Cache[o1],
                   {"owid":o1,
                    "etag":2,
                    "refs": expectedRefs,
                    "outlinks": {},
                    "content":{"tags":"one","state":"0.2"},
                   });

    test.jsonEqual("Now o2 has new state and ref from o1", Cache[o2],
                   {"owid":o2,
                    "etag":3,
                    "rules": rules2,
                    "refs": expectedOutlinks,
                    "outlinks":expectedOutlinks,
                    "content":{ "tags": "two", "state": "0.3", "o1": o1 },
                   });

    test.jsonEqual("Now o3 has new state and ref from o1", Cache[o3],
                   {"owid":o3,
                    "etag":3,
                    "rules": rules3,
                    "refs": expectedOutlinks,
                    "outlinks":expectedOutlinks,
                    "content":{ "tags": "thr", "state": "0.3", "o1": o1 },
                   });

    test.jsonEqual("Now o4 has new state and ref from o1", Cache[o4],
                   {"owid":o4,
                    "etag":3,
                    "rules": rules4,
                    "refs": expectedOutlinks,
                    "outlinks":expectedOutlinks,
                    "content":{ "tags": "fou", "state": "0.3", "o1": o1 },
                   });

    // ---------------------------------------------------------------

    test.summary();
});

// -------------------------------------------------------------------

setTimeout(fjord.close, 500);

// -------------------------------------------------------------------


