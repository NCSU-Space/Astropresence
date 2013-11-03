var express = require('express');
var ws = require('ws');
var readline = require('readline');
var http = require('http');
var repl = require('repl');

//////////////////////////////
// HTTP server for web page //
//////////////////////////////

FILE_PORT = 8080;
var app = express();
var httpServer = http.createServer(app);

// Simple static page server
app.use(express.compress());
app.use(express.static('./http'));
httpServer.listen(FILE_PORT);

console.log((new Date()) + ': Static file server listening at http://[all hosts]:' + FILE_PORT + '/');

///////////////////////////
// Repeater for controls //
///////////////////////////

// These link to rover side
var controlSocketToThePI = new (ws.Server)({server: httpServer, path: '/controlDrone/'});
var connectionToPi;

controlSocketToThePI.on('connection', function(connection) {
  connectionToPi = connection;
  console.log('Received connection from Pi');
});

// And these link to client(s)
var controlSocketServer = new (ws.Server)({server: httpServer, path: '/controlClient/'});

controlSocketServer.on('connection', function(connection) {
  connection.on('message', function(message) {
    console.log('received this: ' + message);
    
    try {
      connectionToPi.send(message);
    }
    catch(error) {
      console.log(error);
    }
  });
});

////////////////////////////////////
// Video part from those iOS devs //
////////////////////////////////////

var STREAM_PORT = 8082,
    STREAM_SECRET = 's3cret', // CHANGE THIS!
    WEBSOCKET_PORT = 8080,
    STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes

var clients = {};
var width = 320,
    height = 240;

// Websocket Server
var socketServer = new (ws.Server)({server: httpServer, path: '/videoClient/'});
var _uniqueClientId = 1;

var socketError = function() { /* ignore */ };
socketServer.on('connection', function(socket) {
  // Send magic bytes and video size to the newly connected socket
  // struct {char magic[4]; unsigned short width, height;}
  var streamHeader = new Buffer(8);
  streamHeader.write(STREAM_MAGIC_BYTES);
  streamHeader.writeUInt16BE(width, 4);
  streamHeader.writeUInt16BE(height, 6);
  socket.send(streamHeader, {binary:true}, socketError);
  
  // Remember client in 'clients' object
  var clientId = _uniqueClientId++;
  clients[clientId] = socket;
  console.log('WebSocket Connect: client #' + clientId + ' ('+Object.keys(clients).length+' total)');
  
  // Delete on close
  socket.on('close', function(code, message) {
    delete clients[clientId];
    console.log('WebSocket Disconnect: client #' + clientId + ' ('+Object.keys(clients).length+' total)');
  });
});


// HTTP Server to accept incomming MPEG Stream
var streamServer = require('http').createServer( function(request, response) {
  var params = request.url.substr(1).split('/');
  width = (params[1] || 320)|0;
  height = (params[2] || 240)|0;
  
  if( params[0] == STREAM_SECRET ) {
    console.log('Stream Connected: ' + request.socket.remoteAddress + ':' + request.socket.remotePort + ' size: ' + width + 'x' + height);
    request.on('data', function(data) {
      for( c in clients ) {
        clients[c].send(data, {binary:true}, socketError);
      }
    });
  }
  else {
    console.log('Failed Stream Connection: '+ request.socket.remoteAddress + request.socket.remotePort + ' - wrong secret.');
    response.end();
  }
}).listen(STREAM_PORT);

console.log('Listening for MPEG Stream on http://127.0.0.1:' + STREAM_PORT + '/<secret>/<width>/<height>');
console.log('Awaiting WebSocket connections on ws://127.0.0.1:' + WEBSOCKET_PORT + '/');

/////////
// CLI //
/////////

var cli = repl.start({});
cli.context.app = app;
cli.context.httpServer = httpServer;
cli.context.controlSocketToThePI = controlSocketToThePI;
cli.context.connectionToPi = connectionToPi;
cli.context.controlSocketServer = controlSocketServer;
cli.context.clients = clients;
cli.context.socketServer = socketServer;
