/*
 * Copyright 2012 VirtuOz Inc. All rights reserved.
 */

var assert = require('chai').assert;

var logger = require('../util/logger');

var smartrouter = require('../lib/smartrouter.js').instance;
var config = require('../config').local;
var Actor = require('../lib/actor');
var Agent = require('./mockactors/wbh').Agent;
var UI = require('./mockactors/ui').UI;
var LiveChat = require('./mockactors/livechat').LiveChat;


/* We instantiate the clients with the following params to be able to
 * properly shutdown the smart-router between tests.
 */
var clientsParams = { reconnect: false, 'force new connection': true };

// /!\ Those tests need to have a local RabbitMQ running
describe('Smartrouter tests.', function()
{
  beforeEach(function(done)
         {
           smartrouter.once('started', function () {
             smartrouter.io.set('log level', 1);
             smartrouter.io.set('close timeout', .2);
             smartrouter.io.set('client store expiration', .2);
             logger.info('SmartRouter started');
             done();
           });

           smartrouter.start(config);
         });
  afterEach(function(done)
        {
          smartrouter.stop();
          smartrouter.once('stopped', function()
          {
            logger.info('Smartrouter stopped');
            done();
          });
        });


  it('will create a raw Actor, connect it to the smartrouter and make an echo', function(done)
  {
    logger.debug('************************************************************');
    logger.debug('STARTING TEST "connect an Actor to the smartrouter and ECHO"');
    logger.debug('************************************************************');
    var actor = new Actor('localhost:8080', 'agent/456', 'rawActor', clientsParams);
    actor.connect();

    actor.socket.once('hello', function()
    {
      actor.echo();
    });
    actor.socket.once('echo', function()
    {
      // Echo received back
      done();
    });
  });

  it('should connect an agent to the smartrouter', function(done)
  {
    logger.debug('***************************************************');
    logger.debug('STARTING TEST "connect an agent to the smartrouter"');
    logger.debug('***************************************************');
    var mockedAgent = new Agent('localhost:8080', 'agent/456', 'agent456', clientsParams);
    mockedAgent.connect();
    // If we receive the hello callback, it means that we have correctly handshaked
    // and that the smartrouter has accepted us
    mockedAgent.socket.once('hello', function()
    {
      done();
    });
  });

  it('should connect an ui to the smartrouter', function(done)
  {
    logger.debug('************************************************');
    logger.debug('STARTING TEST "connect an UI to the smartrouter"');
    logger.debug('************************************************');
    var mockedUI = new UI('localhost:8080', 'ui/456', 'ui456', clientsParams);
    mockedUI.connect();
    // If we receive the hello callback, it means that we have correctly handshaked
    // and that the smartrouter has accepted us
    mockedUI.socket.once('hello', function()
    {
      done();
    });
  });

  it('sould connect a livechat to the smartrouter', function(done)
  {
    logger.debug('*****************************************************');
    logger.debug('STARTING TEST "connect a Livechat to the smartrouter"');
    logger.debug('*****************************************************');
    var mockedLiveChat = new LiveChat('localhost:8080', 'livechat/456', 'livechat456', clientsParams);
    mockedLiveChat.connect();
    // If we receive the hello callback, it means that we have correctly handshaked
    // and that the smartrouter has accepted us
    mockedLiveChat.socket.once('hello', function()
    {
      done();
    });
  });

  it('should send a message from the ui to the agent, which will reply', function(done)
  {
    logger.debug('***********************************');
    logger.debug('STARTING TEST "UI talk to an agent"');
    logger.debug('***********************************');
    var mockedAgent = new Agent('localhost:8080', 'agent/456', 'agent456', clientsParams);
    var mockedUI = new UI('localhost:8080', 'ui/456', 'ui456', clientsParams);
    mockedAgent.connect();
    mockedUI.connect();

    mockedAgent.socket.once('talk', function(data)
    {
      // Message has correctly been routed by the smartrouter!
      assert.equal('Hey is there someone?', data.payload.text);
    });
    // Mocked Agent is set to send back a 'hello from agent' message. Wait for it to finish the test
    mockedUI.socket.once('talkback', function(data)
    {
      assert.equal('hello from agent', data.payload.text);
      done();
    });

    // UI will talk after being handshaked by the smartrouter
    mockedUI.socket.once('hello', function()
    {
      mockedUI.talk('Hey is there someone?');
    });
  });

  it('should send a message from the agent to the UI', function(done)
  {
    logger.debug('************************************');
    logger.debug('STARTING TEST "Agent talk to the UI"');
    logger.debug('************************************');
    var mockedAgent;
    var mockedUI = new UI('localhost:8080', 'ui/456', 'ui456', clientsParams);
    mockedUI.connect();

    mockedUI.socket.once('talkback', function(data)
    {
      // Received the response from the agent!
      assert.equal('Hello, I am your agent', data.payload.text);
      done();
    });

    mockedUI.socket.once('hello', function()
    {
      mockedAgent = new Agent('localhost:8080', 'agent/456', 'agent456', clientsParams);
      mockedAgent.connect();
      mockedAgent.socket.once('hello', function()
      {
        // Normally, UI has sent a message containing its id that the Agent has stored
        mockedAgent.UI = mockedUI.actorid;
        mockedAgent.talk('Hello, I am your agent');
      });
    });
  });

  it('should make a session request to the livechat', function(done)
  {
    logger.debug('*******************************************');
    logger.debug('STARTING TEST "Requesting livechat session"');
    logger.debug('*******************************************');
    var mockedAgent = new Agent('localhost:8080', 'agent/456', 'agent456', clientsParams);
    var mockedLiveChat = new LiveChat('localhost:8080', 'livechat/456', 'livechat456', clientsParams);
    var mockedUI = new UI('localhost:8080', 'ui/456', 'ui456', clientsParams);
    mockedAgent.connect();
    mockedLiveChat.connect();
    mockedUI.connect();

    mockedLiveChat.socket.once('sessionrequest', function()
    {
      done();
    });

    // MockedAgent is configured to send a 'sessionrequest' to the livechat when the UI says "livechat"
    mockedUI.socket.once('hello', function()
    {
      mockedUI.talk('livechat');
    });
  });

  it('Livechat will send a message to the ui', function(done) {
    logger.debug('********************************************');
    logger.debug('STARTING TEST "Livechat will talk to the UI"');
    logger.debug('********************************************');
    var mockedLiveChat;
    var mockedUI = new UI('localhost:8080', 'ui/456', 'ui456', clientsParams);
    mockedUI.connect();

    mockedUI.socket.once('talkback', function(data)
    {
      // Received the response from the agent!
      assert.equal('Hello, how can I help you?', data.payload.text);
      done();
    });

    mockedUI.socket.once('hello', function()
    {
      mockedLiveChat = new LiveChat('localhost:8080', 'livechat/456', 'livechat456', clientsParams);
      mockedLiveChat.connect();
      mockedLiveChat.socket.once('hello', function()
      {
        // Normally, Agent has previously sent a message containing the UI's id that the LiveChat has stored
        mockedLiveChat.UI = mockedUI.actorid;
        mockedLiveChat.talk('Hello, how can I help you?');
      });
    });
  });

  // UI will publish a message to the agent queue, which is not connected yet.
  // Then the targeted agent connects. It should receive the message.
  it('should keep the message in the Queue until the actor connect and get it', function(done)
  {
    logger.debug('*****************************************************************************************');
    logger.debug('STARTING TEST "SmartRouter keep message in memory if the targeted actor is not connected"');
    logger.debug('*****************************************************************************************');
    var mockedAgent = new Agent('localhost:8080', 'agent/456', 'agent456', clientsParams);
    var mockedUI = new UI('localhost:8080', 'ui/456', 'ui456', clientsParams);
    mockedUI.connect();
    mockedUI.socket.once('hello', function()
    {
      mockedUI.talk('This message will not be delivered immediately');
    });

    setTimeout(function()
               {
                 mockedAgent.connect();
                 mockedAgent.socket.once('talk', function(data)
                 {
                   // Message has been kept waiting for agent to connect
                   assert.equal('This message will not be delivered immediately', data.payload.text);
                   done();
                 });
               }, 1000);
  });

  // UI will publish a message to the agent queue, which is not connected yet.
  // We shutdown the smart-router, and restart it
  // We connect the targeted agent, and we check that the message survived the shutdown
  it('should keep the message in RabbitMQ during a smart-router shutdown', function(done)
  {
    logger.debug('**********************************************************');
    logger.debug('STARTING TEST "Messages survive the smart-router shutdown"');
    logger.debug('**********************************************************');
    var mockedAgent = new Agent('localhost:8080', 'agent/456', 'agent456', clientsParams);
    var mockedUI = new UI('localhost:8080', 'ui/456', 'ui456', clientsParams);
    mockedUI.connect();
    mockedUI.socket.once('hello', function()
    {
      mockedUI.talk('This message will survive a shutdown');
    });

    setTimeout(function()
               {
                 smartrouter.stop();
                 smartrouter.once('stopped', function()
                 {
                   logger.info('Smartrouter stopped. We hope no message will be lost. Restarting...');
                   smartrouter.start(config);
                 });
               }, 1000);

    smartrouter.once('started', function () {
      smartrouter.io.set('log level', 1);
      smartrouter.io.set('close timeout', .2);
      smartrouter.io.set('client store expiration', .2);
      logger.info('SmartRouter restarted. Connecting the agent to it');
      mockedAgent.connect();
      // We should receive the message sent by the UI before the shutdown
      mockedAgent.socket.once('talk', function(data)
      {
        // Message has been kept in RabbitMQ!
        assert.equal('This message will survive a shutdown', data.payload.text);
        done();
      });
    });
  });
});