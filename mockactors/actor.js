/*
 * Copyright 2012 VirtuOz Inc.  All rights reserved.
 */

/**
 *
 * @author ccauchois
 * @created 2012-10-25
 */
 require('jsclass');
JS.require('JS.Class');

var io = require('socket.io-client');
 
module.exports = new JS.Class({
  initialize: function (server, endpoint, id) {
    this.socket = io.connect('http://' + server + '/' + endpoint);
    this.actorid = endpoint + '/' + id;
  },
  setup: function () {
    var self = this;
    self.socket.on('connect', function () {
      self.log('connected');
      self.socket.on('hello', function () {
        self.log('handshaked');
      });
      self.socket.on('whoareyou', function (data) {
        self.log('got whoareyou');
        self.socket.emit('iam', self.actorid);
        if (data) {
          self.socket.emit(data.type, data.message);
        }
      });
      self.socket.on('echo', function (data) {
        self.log('got echo: ' + JSON.stringify(data));
      });
    });
    self.socket.on('connection_failed', function (err) {
      self.log('connection failed '+ err);
    });
    self.socket.on('error', function (err) {
      self.log('error '+ err);
    });
  },
  log: function (msg) {
    console.log(this.actorid + ': ' + msg);
  },
  echo: function () {
    this.socket.emit('echo', { from: this.actorid, payload: 'quack!!' });
  }
});
