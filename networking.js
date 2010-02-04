
var sys = require('sys');
var http = require('http');

exports.Networking = { 

init: function(config){
    this.thisPort  = (config && config.thisPort ) || 8080;
    this.nexusHost = (config && config.nexusHost) || "localhost";
    this.nexusPort = (config && config.nexusPort) || 8080;
    if(this.nexusPort>0) this.nexusClient = http.createClient(this.nexusPort, this.nexusHost);
    if(this.thisPort >0) this.thisServer  = http.createServer(this.newRequest).listen(this.thisPort);
    if(this.nexusPort>0) sys.puts("Nexus at "+this.nexusHost+":"+this.nexusPort);
    if(this.thisPort >0) sys.puts("Listening on "+this.thisPort);
},

newRequest: function(req, res){

  ; sys.puts("----------------------------------------");
  ; sys.puts("http="+JSON.stringify(req.httpVersion));
  ; sys.puts("method="+JSON.stringify(req.method));
  ; sys.puts("url="+JSON.stringify(req.url));
  ; sys.puts("headers="+JSON.stringify(req.headers));
  ; sys.puts("----------------------------------------");

    res.sendHeader(200, { 'Content-Type': 'application/json' });
    var o = { "owid":"owid-73c2-4046-fe02-7312",
              "etag": 0,
              "json":{"tags":"one","state":"0"},
              "rules":["owid-ca0b-0a35-9289-9f8a","owid-f2aa-1220-18d4-9a03"],
              "outlinks":{},
              "refs":{},
              "_id":"owid-73c2-4046-fe02-7312"
    };
    res.sendBody(JSON.stringify(o)+"\n");
    res.finish();
},

get: function(owid){
    var url = "/123.js";
    var headers = {
        "Host": this.nexusHost+":"+this.nexusPort,
        "User-Agent": "Fjord",  
    };
    var request = this.nexusClient.request("GET", url, headers);
    request.finish(this.headersIn);
},

headersIn: function(response){

  ; sys.puts("----------------------------------------");
  ; sys.puts("status: " + response.statusCode);
  ; sys.puts("headers: " + JSON.stringify(response.headers));
  ; sys.puts("----------------------------------------");

    var body = "";
    response.setBodyEncoding("utf8");
    response.addListener("body", function(chunk){ body+=chunk; });
    response.addListener("complete", function(){

  ;     sys.puts("----------------------------------------");
  ;     sys.puts("complete: \n"+body);
        var o = JSON.parse(body);  
  ;     sys.puts(JSON.stringify(o));
  ;     if(o.error) sys.puts("Error: " + o.error);  
  ;     sys.puts("----------------------------------------");

    });
}

};


