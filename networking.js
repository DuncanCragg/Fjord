
var sys = require('sys');
var http = require('http');

exports.Networking = { 

init: function(config){
    this.thisPort  = (config && config.thisPort ) || 8080;
    this.nexusHost = (config && config.nexusHost) || "localhost";
    this.nexusPort = (config && config.nexusPort) || 8080;
    this.nexusClient = http.createClient(this.nexusPort, this.nexusHost);
    this.thisServer  = http.createServer(this.newRequest).listen(this.thisPort);
},

newRequest: function(req, res){
  ; sys.puts("req="+JSON.stringify(req.httpVersion));
  ; sys.puts("req="+JSON.stringify(req.method));
  ; sys.puts("req="+JSON.stringify(req.url));
  ; sys.puts("req="+JSON.stringify(req.headers));
    res.sendHeader(200, { 'Content-Type': 'application/json' });
    res.sendBody("{ 'a': 'b' }\n");  
    res.finish();
},

get: function(owid){
    var url = "/123.js";
    var headers = {
        "Host": this.nexusHost,
        "User-Agent": "Fjord",  
    };
    var request = this.nexusClient.request("GET", url, headers);
    request.finish(this.headersIn);
},

headersIn: function(response){
  ; sys.puts("** status: " + response.statusCode);
  ; sys.puts("** headers: " + JSON.stringify(response.headers));
    var body = "";
    response.setBodyEncoding("utf8");
    response.addListener("body", function(chunk){ body+=chunk; });
    response.addListener("complete", function(){
  ;     sys.puts("** complete: \n"+body);
        var o = JSON.parse(body);  
  ;     sys.puts(JSON.stringify(o));
  ;     if(o.error) sys.puts("Error: " + o.error);  
    });
}

};


