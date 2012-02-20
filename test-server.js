#!/usr/bin/env node

var util = require('util');

var fjord = require('./fjord');

var persistenceReady = function(){
    util.puts("ready");
}

fjord.init({ "dbFileName": "./fjord-test.db",
             "dbLoaded": persistenceReady,
             "nexusPort": -1, "logNetworking": true,
});




