
var sys = require('sys');
var http = require('http');

var Cache = null;

exports.Networking = { 

init: function(cache, config){
    Cache = cache;
    this.nexusHost = (config && config.nexusHost) || "localhost";
    this.nexusPort = (config && config.nexusPort) || 8080;
    this.thisPort  = (config && config.thisPort ) || 8080;
    if(this.nexusPort >0){
        this.nexusClient = http.createClient(this.nexusPort, this.nexusHost);
        sys.puts("Nexus at "+this.nexusHost+":"+this.nexusPort);
    }
    if(this.thisPort >0){
        this.thisServer  = http.createServer(this.newRequest);
        this.thisServer.listen(this.thisPort);
        sys.puts("Listening on "+this.thisPort);
    }
},

// ------------------------------------------------------------------

close: function(){ this.thisServer.close(); },

// ------------------------------------------------------------------

newRequest: function(req, res){

  ; sys.puts("----- Request --------------------------");
  ; sys.puts("path="+JSON.stringify(req.url));
  ; sys.puts("headers="+JSON.stringify(req.headers));
  ; sys.puts("----------------------------------------");

    var owid = extractOWID(req.url);
    var inms = req.headers["if-none-match"];
    var inmi = inms? parseInt(inms.substring(1)): 0;
    var refs = req.headers.referer;
    var refslist = [];
    if(refs){
        var irefslist = refs.split(", ");
        for(var i in irefslist) refslist[i] = extractOWID(irefslist[i]);
    }
    var o = Cache.pull(owid, refslist);
    var headers = { "Content-Type": "application/json",
                    "Content-Location": insertOWID(owid),
                    "Etag": '"'+o.etag+'"' 
    };
    if(o.etag!=inmi){
        var os = JSON.stringify(o.content);
        res.sendHeader(200, headers);
        res.sendBody(os+"\n");
  ;     sys.puts("200 OK; "+os.length);
    }
    else{
        res.sendHeader(304, headers);
  ;     sys.puts("304 Not Modified");
    }
    res.finish();

  ; sys.puts("----------------------------------------");
},

// ------------------------------------------------------------------

get: function(owid, etag, refslist){
    if(!this.nexusClient) return;
    var url = "/a/b/c/"+owid+".json";
    var refs;
    if(refslist){
        var irefslist = [];
        for(var i in refslist) irefslist[i] = insertOWID(refslist[i]);
        refs = irefslist.join(', ');
    }
    var headers = {
        "Host": this.nexusHost+":"+this.nexusPort,
        "User-Agent": "Fjord v0.0.1"
    };
    if(etag) headers["If-None-Match"] = '"'+etag+'"';
    if(refs) headers.Referer = refs;

  ; sys.puts("Outgoing Request: "+url+" "+sys.inspect(headers));
    var request = this.nexusClient.request("GET", url, headers);
    request.finish(this.headersIn);
},

headersIn: function(response){

  ; sys.puts("----- Response -------------------------");
  ; sys.puts(response.statusCode + ": " + JSON.stringify(response.headers));

    var owid = extractOWID(response.headers["content-location"]);
    var etag = parseInt(response.headers.etag.substring(1));
    var body = "";
    response.setBodyEncoding("utf8");
    if(response.statusCode==200){
        response.addListener("body", function(chunk){ body+=chunk; });
        response.addListener("complete", function(){
            var content = JSON.parse(body);  
            Cache.push(owid, etag, content);
  ;         sys.puts("----------------------------------------");
        });
    }
    else
    if(response.statusCode==304){
        Cache.push(owid, etag, null);
  ;     sys.puts("----------------------------------------");
    }
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

