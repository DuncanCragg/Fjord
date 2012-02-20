
var util = require('util');
var http = require('http');

var Cache = null;

var logNetworking = false;

exports.Networking = Networking = {

init: function(cache, config){
    Cache = cache;
    logNetworking  = (config && config.logNetworking);
    this.nexusHost = (config && config.nexusHost) || "localhost";
    this.nexusPort = (config && config.nexusPort) || 24589;
    this.thisHost  = (config && config.thisHost)  || "localhost";
    this.thisPort  = (config && config.thisPort ) || 24589;
    if(this.nexusPort >0){
        this.nexusClient = http.createClient(this.nexusPort, this.nexusHost);
        util.puts("Nexus at "+this.nexusHost+":"+this.nexusPort);
    }
    if(this.thisPort >0){
        this.thisServer  = http.createServer(this.newRequest);
        this.thisServer.listen(this.thisPort);
        util.puts("Listening on "+this.thisPort);
    }
},

// ------------------------------------------------------------------

close: function(){ this.thisServer.close(); },

// ------------------------------------------------------------------

newRequest: function(request, response){

    if(logNetworking) util.puts("----> Request --------------------------");
    if(logNetworking) util.puts("method="+request.method);
    if(logNetworking) util.puts("path="+JSON.stringify(request.url));
    if(logNetworking) util.puts("headers="+JSON.stringify(request.headers));
    if(logNetworking) util.puts("----------------------------------------");

    if(request.method=="GET") Networking.doGET(request, response);
    else
    if(request.method=="POST"){
        if(request.headers["content-type"]=="application/x-www-form-urlencoded")
             Networking.doFormPOST(request, response);
        else Networking.doPOST(request, response);
    }
},

doGET: function(request, response){

    var json = /\.json$/.test(request.url);
    var owid = this.extractOWID(request.url);
    var inms = request.headers["if-none-match"];
    var inmi = inms? parseInt(inms.substring(1)): 0;
    var refs = request.headers.referer;
    var cano = request.headers["cache-notify"];
    var refslist = [];
    if(refs){
        var irefslist = refs.split(", ");
        for(var i=0; i< irefslist.length; i++){
            var refurl = irefslist[i];
            refowid=this.extractOWID(refurl);
            refslist[i] = refowid;
            Cache.refShell(refowid, refurl, cano);
        }
    }
    if(!owid){
        response.writeHead(400, {});
        if(logNetworking) util.puts("400 Bad Request");
        response.end();
        return;
    }

    var o = Cache.pull(owid, refslist);

    var headers = { "Content-Type": json? "application/json": "application/javascript",
                    "Content-Location": this.insertOWID(owid),
                    "Etag": '"'+o.etag+'"',
                    "Cache-Notify": this.getCacheNotifyURL(),
    };
    if(o.etag!=inmi){
        var os;
        if(json){
            os = JSON.stringify(o.content);
        } else {
            os = "O(\n"+JSON.stringify(o)+"\n);";
            headers = { "Content-Type": "application/javascript" };
        }
        response.writeHead(200, headers);
        response.write(os+"\n");
        if(logNetworking) util.puts("200 OK; "+os.length+"\n"+JSON.stringify(headers)+'\n'+os);
    }
    else{
        response.writeHead(304, headers);
        if(logNetworking) util.puts("304 Not Modified");
    }
    response.end();

    if(logNetworking) util.puts("<---------------------------------------");
},

doPOST: function(request, response){
    var colo = request.headers["content-location"];
    var cano = request.headers["cache-notify"];
    var owid = this.extractOWID(colo);
    var etag = request.headers.etag? parseInt(request.headers.etag.substring(1)): 0;
    var body = "";
    request.setEncoding("utf8");
    request.on("data", function (chunk) { body += chunk; });
    request.on("end", function () {
        if(logNetworking) util.puts(body);
        response.writeHead(200, {});
        response.end();
        var content; 
        try{ content = JSON.parse(body); }catch(e){ util.puts("Parse error on incoming object notification: "+e); return; }
        Cache.push(owid, etag, colo, cano, content);
        if(logNetworking) util.puts("----------------------------------------");
    });
},

doFormPOST: function(request, response){
    var body = "";
    request.setEncoding("utf8");
    request.on("data", function (chunk) { body += chunk; });
    request.on("end", function () {
        if(logNetworking) util.puts(body);
        response.writeHead(200, {});
        response.end();
        var body2=Networking.unpackObjectFromForm(body);
        var o; 
        try{ o = JSON.parse(body2); }catch(e){ util.puts("Parse error on incoming object notification: "+e); return; }
        if(logNetworking) util.puts(JSON.stringify(o));
        Cache.push(o.owid, o.etag, null, null, o.content);
        if(logNetworking) util.puts("----------------------------------------");
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
        if(hpp){
            host=hpp.host;
            port=hpp.port;
            path=hpp.path;
            client=http.createClient(port, host);
        }
    }
    if(!client){ util.puts("No client for "+url); return; }
    var refs;
    if(refslist){
        var irefslist = [];
        for(var i=0; i< refslist.length; i++) irefslist[i] = this.insertOWID(refslist[i]);
        refs = irefslist.join(', ');
    }
    var headers = {
        "Host": host+":"+port,
        "User-Agent": "Fjord v0.0.1",
        "Cache-Notify": this.getCacheNotifyURL(),
    };
    if(etag) headers["If-None-Match"] = '"'+etag+'"';
    if(refs) headers["Referer"] = refs;

    if(logNetworking) util.puts("<---- Request --------------------------");
    if(logNetworking) util.puts(url+" "+util.inspect(headers));
    if(logNetworking) util.puts("----------------------------------------");

    var request = client.request("GET", path, headers);
    request.on("response", this.getHeadersIn);
    request.end();
},

getHeadersIn: function(response){

    if(logNetworking) util.puts("----> Response -------------------------");
    if(logNetworking) util.puts(response.statusCode + ": " + JSON.stringify(response.headers));

    var colo = response.headers["content-location"];
    var cano = response.headers["cache-notify"];
    var owid = Networking.extractOWID(colo);
    var etag = response.headers.etag? parseInt(response.headers.etag.substring(1)): 0;
    var body = "";
    response.setEncoding("utf8");
    if(response.statusCode==200){
        response.on("data", function(chunk){ body+=chunk; });
        response.on("end", function(){
            var content;
            try{ content = JSON.parse(body); }catch(e){ util.puts("GET returned non-JSON content: "+e+"\n"+body); return; }
            if(logNetworking) util.puts(body);
            Cache.push(owid, etag, colo, cano, content);
            if(logNetworking) util.puts("----------------------------------------");
        });
    }
    else
    if(response.statusCode==304){
        Cache.push(owid, etag, colo, cano);
        if(logNetworking) util.puts("----------------------------------------");
    }
},

// ------------------------------------------------------------------

push: function(o, canol){
    for(var i=0; i< canol.length; i++){
        var url = canol[i];
        var hpp = this.extractHostPortAndPath(url);
        var host, port, path;
        if(hpp){
            host=hpp.host;
            port=hpp.port;
            path=hpp.path;
        }
        else return;
        var headers = {
            "Host": host+":"+port,
            "User-Agent": "Fjord v0.0.1",
            "Cache-Notify": this.getCacheNotifyURL(),
            "Content-Location": this.insertOWID(o.owid),
            "Etag": '"'+o.etag+'"',
        };
        if(logNetworking) util.puts("<---- Request POST ---------------------");
        if(logNetworking) util.puts(url+" "+util.inspect(headers)+o);
        if(logNetworking) util.puts("----------------------------------------");

        var client=http.createClient(port, host);
        var request = client.request("POST", path, headers);
        request.write(o.toString());
        request.on("response", this.postHeadersIn);
        request.end();
    }
},

postHeadersIn: function(response){
    if(logNetworking) util.puts("----> POST Response -------------------------");
    if(logNetworking) util.puts(response.statusCode + ": " + JSON.stringify(response.headers));
    var body = "";
    response.setEncoding("utf8");
    response.on("data", function(chunk){ body+=chunk; });
    response.on("end", function(){
        if(logNetworking) util.puts(body);
        if(logNetworking) util.puts("----------------------------------------");
    });
},

// ------------------------------------------------------------------

getCacheNotifyURL: function(){
    return "http://"+this.thisHost+":"+this.thisPort+"/fjord/cache-notify";
},

extractOWID: function(url){
    if(!url) return null;
    var a = url.match(/(owid-[-0-9a-z]+)\.js(on)?/);
    return (a && a[1])? a[1]: null;
},

insertOWID: function(owid){
    return "http://"+this.thisHost+":"+this.thisPort+"/fjord/"+owid+".json";
},

extractHostPortAndPath: function(url){
    var a = url.match(/http:\/\/(.+):([0-9]+)(\/.*)/);
    if(!a || !(a[1] && a[2] && a[3])){ util.puts("Invalid URL: "+url); return null; }
    return { "host": a[1], "port": a[2], "path": a[3] };
},

unpackObjectFromForm: function(form){
    return decodeURIComponent(form.replace(/\+/g, " ")).substring(2);
},

};

// ------------------------------------------------------------------

