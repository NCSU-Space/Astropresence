var express = require('express');
var ws = require('ws');
var readline = require('readline');
var http = require('http');
var repl = require('repl');

process.title = 'tele_server';

//////////////////////////////
// HTTP server for web page //
//////////////////////////////

var FILE_PORT = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var IP = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
var app = express();
var httpForStatics = http.createServer(app);
//var httpForWS = http.createServer();
//httpForWS.listen(8000, IP);


// Simple static page server
app.use('/http', express.static('./http'));
app.use(express.compress());
httpForStatics.listen(FILE_PORT, IP);

console.log((new Date()) + ': Static file server listening at http://' + IP + ':' + FILE_PORT + '/');

///////////////////////////
// Repeater for controls //
///////////////////////////

// These link to rover side
var controlSocketToThePI = new (ws.Server)({server: httpForStatics, path: '/controlDrone'});

controlSocketToThePI.on('connection', function(connection) {
  console.log('Received connection from Pi');
});

// And these link to client(s)
var controlSocketServer = new (ws.Server)({server: httpForStatics, path: '/controlClient'});

controlSocketServer.on('connection', function(connection) {
  console.log((new Date()) + ': Received WebSocket at :8000/controlClient');
  
  connection.on('message', function(message) {
    try {
      controlSocketToThePI.clients[0].send(message);
    }
    catch(error) {
      console.log(error);
    }
  });
  
  connection.on('close', function() {
    console.log((new Date()) + ': Closed WebSocket at :8000/controlClient');
  });
});

////////////////////////////////////
// Video part from those iOS devs //
////////////////////////////////////

var STREAM_PORT = 8082,
    STREAM_SECRET = '/videoDrone', // CHANGE THIS!
    WEBSOCKET_PORT = 8080,
    STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes

var clients = {};
var width = 320,
    height = 240;

// Websocket Server
var socketServer = new (ws.Server)({server: httpForStatics, path: '/videoClient'});
var _uniqueClientId = 1;

var socketError = function() {};
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
function receiveMPEG(request, response) {
  var params = request.url.substr(1).split('/');
  width = (params[0] || 160)|0;
  height = (params[1] || 120)|0;
  
  console.log('Stream Connected: ' + request.socket.remoteAddress + ':' + request.socket.remotePort + ' size: ' + width + 'x' + height);
  request.on('data', function(data) {
    for( c in clients ) {
      clients[c].send(data, {binary:true}, socketError);
    }
  });
}

app.use(STREAM_SECRET, receiveMPEG);
//).listen(8082, IP);

console.log('Listening for MPEG Stream on http://' + IP + ':' + FILE_PORT + '/<secret>/<width>/<height>');

/////////
// CLI //
/////////



var cli = repl.start({});
cli.context.app = app;
cli.context.httpForStatics = httpForStatics;
cli.context.controlSocketToThePI = controlSocketToThePI;
cli.context.controlSocketServer = controlSocketServer;
//cli.context.clients = clients;
//cli.context.socketServer = socketServer;
