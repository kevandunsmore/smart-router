/*
 * Copyright 2012 VirtuOz Inc.  All rights reserved.
 */

/**
 *
 * @author ccauchois
 * @created 2012-10-24
 */

require('jsclass');
JS.require('JS.Class');
var EventEmitter = require('events').EventEmitter;
var Io = require('socket.io');
var Amqp = require('amqp');

var SmartRouter = new JS.Class(EventEmitter, {
  initialize: function () {
    EventEmitter.call(this);
    this.io = {};
    this.amqp = {};
    this.config = {};
  },

  /**
   * start method: starts the SmartRouter 
   * 
   */
  start: function (config) {
    console.log('starting...');
    this.config = config;
    this.io = Io.listen(config.port);
    this.amqp = Amqp.createConnection(config.amqp);
    this.amqp.on('error', function (err) {
      console.log('error connecting to RabbitMQ: ' + err);
    });
    
    this.registerEndpoints();
    
    this.emit('started');
  },
   
  /**
   * registerEndpoints: register bindings for the endpoints.
   * 
   */
  registerEndpoints: function () {
    var self = this;
    self.config.endpoints.forEach(function (endpoint) {
      console.log('registering endpoint ' + endpoint.name);
      if (endpoint.ids.length === 0) {
        var socket = self.io.of('/' + endpoint.name);
        self.registerRoutes(endpoint.name, '', socket);
      } else {
        endpoint.ids.forEach(function (id) {
          var socket = self.io.of('/' + endpoint.name + '/' + id);
          self.registerRoutes(endpoint.name, id, socket);
        });
      }    
    });
  },
  
  /**
   * registerRoutes
   */
  registerRoutes: function (name, id, socket) {
    var self = this;
    socket.on('connection', function (sock) {
      self.amqp.queue(sock.clientid, function (q) {
        q.bind(name + id, socket.clientid);
        q.subscribe(unction (message, headers, deliveryInfo) { 
          socket.emit(deliveryInfo.appId, message.data); 
        });
      });
    });
    self.config.routes.forEach( function (route) {
      if (route.name === name) {
        socket.on(route.message, route.action);
      }
    }):
  }
});

exports.instance = new SmartRouter();