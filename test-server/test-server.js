#!/usr/bin/env node

var sys = require('sys');
var assert = require('assert');

var test = require('../simple-test');

var fjord = require('../fjord');
var log       = fjord.log;
var WebObject = fjord.WebObject;
var Cache     = fjord.Cache;

fjord.init();



