/*
 * Copyright 2012 VirtuOz Inc.  All rights reserved.
 */

/**
 *
 * @author ccauchois
 * @created 2012-10-29
 */
 
require('jsclass');
JS.require('JS.Class');
var Actor = require('../../lib').Actor;

var Service = new JS.Class(Actor, {
  initialize: function (server, endpoint, id, connectionParams) {
    this.callSuper(server, endpoint, id, connectionParams);
  },
  connect: function () {
    var self = this;
    this.callSuper(this.localsetup);
    self.socket.on('talk', function (data) {
      self.log(data.ids.ui + ' said ' + data.payload.text);
      self.UI = data.ids.ui;
      self.talk('hello from human');
    });
    self.socket.on('sessionrequest', function (data) {
      self.agent = data.ids.agent;
      self.UI = data.ids.ui;
      self.log('service session requested from ' + data.ids.agent + ' for ' + data.ids.ui);
      self.talk('you are connected to service');
    });
  },
  talk: function (text) {
    this.log('saying ' + text);
    this.socket.emit('talkback', { ids: { ui: this.UI, agent: this.agent, service: this.endpoint }, 
      metadata: { service: true }, payload: { text: text }});
  }
});

module.exports.Service = Service;
