/*
 * Copyright 2012 VirtuOz Inc. All rights reserved.
 */

var Agent = require('../mockactors/wbh.js').Agent;

var wbh2 = new Agent('127.0.0.1:8080', 'agent/456', 'wbh2_id');
wbh2.setup();

//setInterval(function () {
//  wbh2.echo();
//  }, 40000);