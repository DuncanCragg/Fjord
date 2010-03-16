
var sys = require('sys');
var http = require('http');

var Cache = null;

var logNetworking = false;

exports.Networking = Networking = {

init: function(cache, config){
    Cache = cache;

    this.nexusHost = (config && config.nexusHost) || "localhost";
    this.nexusPort = (config && config.nexusPort) || 8080;
    this.thisHost  = (config && config.thisHost)  || "localhost";
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

newRequest: function(request, response){

    if(logNetworking) sys.puts("----> Request --------------------------");
    if(logNetworking) sys.puts("method="+request.method);
    if(logNetworking) sys.puts("path="+JSON.stringify(request.url));
    if(logNetworking) sys.puts("headers="+JSON.stringify(request.headers));
    if(logNetworking) sys.puts("----------------------------------------");

    if(request.method=="GET") Networking.doGET(request, response);
    else
    if(request.method=="POST") Networking.doPOST(request, response);
},

doGET: function(request, response){

    var owid = this.extractOWID(request.url);
    var inms = request.headers["if-none-match"];
    var inmi = inms? parseInt(inms.substring(1)): 0;
    var refs = request.headers.referer;
    var cano = request.headers["cache-notify"];
    var refslist = [];
    if(refs){
        var irefslist = refs.split(", ");
        for(var i in irefslist){
            var refurl = irefslist[i];
            refowid=this.extractOWID(refurl);
            refslist[i] = refowid;
            Cache.refShell(refowid, refurl, cano);
        }
    }
    var o = Cache.pull(owid, refslist);

    var headers = { "Content-Type": "application/json",
                    "Content-Location": this.insertOWID(owid),
                    "Etag": '"'+o.etag+'"',
                    "Cache-Notify": this.getCacheNotifyURL(),
    };
    if(o.etag!=inmi){
        var os = JSON.stringify(o.content);
        response.sendHeader(200, headers);
        response.write(os+"\n");
        if(logNetworking) sys.puts("200 OK; "+os.length+JSON.stringify(headers)+'\n'+os);
    }
    else{
        response.sendHeader(304, headers);
        if(logNetworking) sys.puts("304 Not Modified");
    }
    response.close();

    if(logNetworking) sys.puts("<---------------------------------------");
},

doPOST: function(request, response){
    var colo = request.headers["content-location"];
    var cano = request.headers["cache-notify"];
    var owid = this.extractOWID(colo);
    var etag = request.headers.etag? parseInt(request.headers.etag.substring(1)): 0;
    var body = "";
    request.setBodyEncoding("utf8");
    request.addListener("data", function (chunk) { body += chunk; });
    request.addListener("end", function () {
        response.sendHeader(200, {});
        response.close();
        var content = JSON.parse(body);
        if(logNetworking) sys.puts(body);
        Cache.push(owid, etag, colo, cano, content);
        if(logNetworking) sys.puts("----------------------------------------");
    });
},

// ------------------------------------------------------------------

get: function(url, etag, refslist){
    var host, port, path, client;
    var owid = (url.substring(0,5)=="owid-")? url: null;
    if(owid){
        host=this.nexusHost;
        port=this.nexusPort;
        path = "/fjord/"+owid+".json";
        client=this.nexusClient;
    }
    else{
        var hpp = this.extractHostPortAndPath(url);
        host=hpp.host;
        port=hpp.port;
        path=hpp.path;
        client=http.createClient(port, host);
    }
    var refs;
    if(refslist){
        var irefslist = [];
        for(var i in refslist) irefslist[i] = this.insertOWID(refslist[i]);
        refs = irefslist.join(', ');
    }
    var headers = {
        "Host": host+":"+port,
        "User-Agent": "Fjord v0.0.1",
        "Cache-Notify": this.getCacheNotifyURL(),
    };
    if(etag) headers["If-None-Match"] = '"'+etag+'"';
    if(refs) headers["Referer"] = refs;

    if(logNetworking) sys.puts("<---- Request --------------------------");
    if(logNetworking) sys.puts(url+" "+sys.inspect(headers));
    if(logNetworking) sys.puts("----------------------------------------");

    var request = client.request("GET", path, headers);
    request.addListener("response", this.getHeadersIn);
    request.close();
},

getHeadersIn: function(response){

    if(logNetworking) sys.puts("----> Response -------------------------");
    if(logNetworking) sys.puts(response.statusCode + ": " + JSON.stringify(response.headers));

    var colo = response.headers["content-location"];
    var cano = response.headers["cache-notify"];
    var owid = Networking.extractOWID(colo);
    var etag = response.headers.etag? parseInt(response.headers.etag.substring(1)): 0;
    var body = "";
    response.setBodyEncoding("utf8");
    if(response.statusCode==200){
        response.addListener("data", function(chunk){ body+=chunk; });
        response.addListener("end", function(){
            var content = JSON.parse(body);
            if(logNetworking) sys.puts(body);
            Cache.push(owid, etag, colo, cano, content);
            if(logNetworking) sys.puts("----------------------------------------");
        });
    }
    else
    if(response.statusCode==304){
        Cache.push(owid, etag, colo, cano);
        if(logNetworking) sys.puts("----------------------------------------");
    }
},

// ------------------------------------------------------------------

push: function(o, canol){
    for(var i in canol){
        var url = canol[i];
        var hpp = this.extractHostPortAndPath(url);
        var host=hpp.host;
        var port=hpp.port;
        var path=hpp.path;
        var headers = {
            "Host": host+":"+port,
            "User-Agent": "Fjord v0.0.1",
            "Cache-Notify": this.getCacheNotifyURL(),
            "Content-Location": this.insertOWID(o.owid),
            "Etag": '"'+o.etag+'"',
        };
        if(logNetworking) sys.puts("<---- Request POST ---------------------");
        if(logNetworking) sys.puts(url+" "+sys.inspect(headers)+o);
        if(logNetworking) sys.puts("----------------------------------------");

        var client=http.createClient(port, host);
        var request = client.request("POST", path, headers);
        request.write(o.toString());
        request.addListener("response", this.postHeadersIn);
        request.close();
    }
},

postHeadersIn: function(response){
    if(logNetworking) sys.puts("----> POST Response -------------------------");
    if(logNetworking) sys.puts(response.statusCode + ": " + JSON.stringify(response.headers));
    var body = "";
    response.setBodyEncoding("utf8");
    response.addListener("data", function(chunk){ body+=chunk; });
    response.addListener("end", function(){
        if(logNetworking) sys.puts(body);
        if(logNetworking) sys.puts("----------------------------------------");
    });
},

// ------------------------------------------------------------------

getCacheNotifyURL: function(){
    return "http://"+this.thisHost+":"+this.thisPort+"/fjord/cache-notify";
},

extractOWID: function(url){
    if(!url) return null;
    var a = url.match(/(owid-[-0-9a-z]+)\.json$/);
    return (a && a[1])? a[1]: null;
},

insertOWID: function(owid){
    return "http://"+this.thisHost+":"+this.thisPort+"/fjord/"+owid+".json";
},

extractHostPortAndPath: function(url){
    var a = url.match(/http:\/\/(.+):([0-9]+)(\/.*)/);
    if(!a && a[1] && a[2] && a[3]){ sys.puts("Invalid URL: "+url); return null; }
    return { "host": a[1], "port": a[2], "path": a[3] };
},

};

// ------------------------------------------------------------------

