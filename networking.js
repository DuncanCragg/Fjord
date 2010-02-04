
var sys = require('sys');
var http = require('http');

var Cache = null;

exports.Networking = { 

init: function(cache, config){
    Cache = cache;
    this.thisPort  = (config && config.thisPort ) || 8080;
    this.nexusHost = (config && config.nexusHost) || "localhost";
    this.nexusPort = (config && config.nexusPort) || 8080;
    if(this.nexusPort>0) this.nexusClient = http.createClient(this.nexusPort, this.nexusHost);
    if(this.thisPort >0){this.thisServer  = http.createServer(this.newRequest); this.thisServer.listen(this.thisPort);}
    if(this.nexusPort>0) sys.puts("Nexus at "+this.nexusHost+":"+this.nexusPort);
    if(this.thisPort >0) sys.puts("Listening on "+this.thisPort);
},

// ------------------------------------------------------------------

close: function(){ this.thisServer.close(); },

// ------------------------------------------------------------------

newRequest: function(req, res){

  ; sys.puts("----------------------------------------");
  ; sys.puts("path="+JSON.stringify(req.url));
  ; sys.puts("headers="+JSON.stringify(req.headers));
  ; sys.puts("----------------------------------------");

    var owid = extractOWID(req.url);
    var refid = extractOWID(req.headers.referer);
    var o = Cache.pull(owid, refid);
    var os = JSON.stringify(o.content);
    var headers = { "Content-Type": "application/json",
                    "Content-Location": insertOWID(owid),
                    "Etag": '"'+o.etag+'"' 
    };
    res.sendHeader(200, headers);
    res.sendBody(os+"\n");
    res.finish();
  ; sys.puts("200 OK; "+os.length);
  ; sys.puts("----------------------------------------");
},

// ------------------------------------------------------------------

get: function(owid, refid){
    if(!this.nexusClient) return;
    var url = "/a/b/c/"+owid+".json";
    var headers = {
        "Host": this.nexusHost+":"+this.nexusPort,
        "User-Agent": "Fjord",  
        "Referer": insertOWID(refid)
    };
    var request = this.nexusClient.request("GET", url, headers);
    request.finish(this.headersIn);
},

headersIn: function(response){

  ; sys.puts("----------------------------------------");
  ; sys.puts(response.statusCode + ": " + JSON.stringify(response.headers));

    var owid = extractOWID(response.headers["content-location"]);
    var etag = parseInt(response.headers["etag"].substring(1));
    var body = "";
    response.setBodyEncoding("utf8");
    response.addListener("body", function(chunk){ body+=chunk; });
    response.addListener("complete", function(){
        var content = JSON.parse(body);  
        Cache.push(owid, etag, content);
  ;     sys.puts("----------------------------------------");
    });
}

// ------------------------------------------------------------------

};

// ------------------------------------------------------------------

function extractOWID(url){
    if(!url) return null;
    var a = url.match(/(owid-[-0-9a-z]+)\.json$/);
    return (a && a[1])? a[1]: null;
}

function insertOWID(owid){
    if(!owid) return null;
    return "http://localhost:8080/a/b/c/d/"+owid+".json";
}

// ------------------------------------------------------------------

