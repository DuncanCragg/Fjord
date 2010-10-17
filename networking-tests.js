#!/usr/bin/env node

var sys = require('sys');
var http = require('http');
var assert = require('assert');

var test = require('./simple-test');

var fjord = require('./fjord');
var log       = fjord.log;
var WebObject = fjord.WebObject;
var Cache     = fjord.Cache;


fjord.init({ "thisPort": 24590, "logNetworking": true });

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

var client = http.createClient(24589, "localhost");

var headers = { "Host": "localhost:24589" };

// -------------------------------------------------------------------

var r=client.request("GET", "/a/b/c/owid-ca0b-0a35-9289-9f8a.json", headers);

r.addListener("response", function(response){

var statusCode = response.statusCode;
test.isEqual("Status is 200", statusCode, 200);

var owid = response.headers["content-location"].match(/(owid-[-0-9a-z]+)\.json$/)[1];
test.isEqual("OWID is correct in Content-Location", owid, "owid-ca0b-0a35-9289-9f8a");

var etag = parseInt(response.headers["etag"].substring(1));
test.isEqual("ETag is 1", etag, 1);

var cacheNotify = response.headers["cache-notify"];
test.isEqual("Cache-Notify is http://localhost:24589/fjord/cache-notify", cacheNotify, "http://localhost:24589/fjord/cache-notify");

var contentType = response.headers["content-type"];
test.isEqual("Content-Type is application/json", contentType, "application/json");

var body = "";
response.setBodyEncoding("utf8");
response.addListener("data", function(chunk){ body+=chunk; });
response.addListener("end", function(){

test.isEqual("Test Server returned correct o1 rule on direct fetch", JSON.parse(body),
     {"tags":"one","%refs":{"tags":"two","state":"/number;$n/"},"state":"/number/fix(1,number($n)+0.1)/"}
);

// -------------------------------------------------------------------

var r=client.request("GET", "/u/owid-ca0b-0a35-9289-9f8a.js?x=1341234", headers);

r.addListener("response", function(response){

var contentType = response.headers["content-type"];
test.isEqual("Content-Type is application/javascript", contentType, "application/javascript");

var body = "";
response.setBodyEncoding("utf8");
response.addListener("data", function(chunk){ body+=chunk; });
response.addListener("end", function(){

test.isEqual("Test Server returned expected Javascript content",
 body,
"O(\n{\"owid\":\"owid-ca0b-0a35-9289-9f8a\",\"refs\":{},\"outlinks\":{},\"etag\":1,\"content\":{\"tags\":\"one\",\"%refs\":{\"tags\":\"two\",\"state\":\"/number;$n/\"},\"state\":\"/number/fix(1,number($n)+0.1)/\"}}\n);\n"
);

// -------------------------------------------------------------------

headers["If-None-Match"] = '"1"';

var r=client.request("GET", "/a/b/c/owid-ca0b-0a35-9289-9f8a.json", headers);
r.addListener("response", function(response){

var statusCode = response.statusCode;
test.isEqual("Status is 304", statusCode, 304);

var etag = parseInt(response.headers["etag"].substring(1));
test.isEqual("ETag is 1", etag, 1);

response.addListener("end", function(){

// -------------------------------------------------------------------

rules4 = [
  WebObject.create('{ "tags": "fou", "o1": { "tags": "one", "state": "/number;$n/" }, "state": "/number/fix(1,number($n)+0.1)/" }'),
];

o4 = WebObject.create('{ "tags": "fou", "state": "0", "o1": "'+o1+'" }', rules4);

expectedRefs[o4]=true;

test.isEqual("Refs of shell are o2, o3 and o4", Cache[o1].refs, expectedRefs);
test.isEqual("Outlinks of o4 are just o1", Cache[o2].outlinks, expectedOutlinks);

// -------------------------------------------------------------------

}); }); r.end();
}); }); r.end();
}); }); r.end();

// -------------------------------------------------------------------

process.addListener("exit", function () {

    // ---------------------------------------------------------------

    test.jsonEqual("Full o1 is now in place", Cache[o1],
                   {"owid":o1,
                    "refs": expectedRefs,
                    "url":"http://localhost:24589/fjord/"+o1+".json",
                    "cachenotify":"http://localhost:24589/fjord/cache-notify",
                    "etag":52,
                    "content":{"tags":"one","state":"done"},
                   });

    test.jsonEqual("Now o2 has new state and ref from o1", Cache[o2],
                   {"owid":o2,
                    "rules": rules2,
                    "refs": expectedOutlinks,
                    "outlinks":expectedOutlinks,
                    "etag":52,
                    "content":{ "tags": "two", "state": "done", "o1": o1 },
                   });

    test.jsonEqual("Now o3 has new state and ref from o1", Cache[o3],
                   {"owid":o3,
                    "rules": rules3,
                    "refs": expectedOutlinks,
                    "outlinks":expectedOutlinks,
                    "etag":52,
                    "content":{ "tags": "thr", "state": "10.1", "o1": o1 },
                   });

    test.jsonEqual("Now o4 has new state and ref from o1", Cache[o4],
                   {"owid":o4,
                    "rules": rules4,
                    "refs": expectedOutlinks,
                    "outlinks":expectedOutlinks,
                    "etag":52,
                    "content":{ "tags": "fou", "state": "10.1", "o1": o1 },
                   });

    test.isEqual("CacheNotify URL for o1 is o1's server", Cache[o1].cachenotify, "http://localhost:24589/fjord/cache-notify");

    // ---------------------------------------------------------------

    test.summary();
});

// -------------------------------------------------------------------

setTimeout(fjord.close, 1600);

// -------------------------------------------------------------------


