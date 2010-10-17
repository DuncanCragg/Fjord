#!/usr/bin/env node

var sys = require('sys');

var fjord = require('./fjord');

var persistenceReady = function(){
    sys.puts("ready");
}

fjord.init({ "dbFileName": "./fjord-test.db",
             "dbLoaded": persistenceReady,
             "nexusPort": -1, "logNetworking": true,
});




