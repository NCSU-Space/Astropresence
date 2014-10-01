process.title = 'tele_server';

var http    = require('http');
var repl    = require('repl');
var fs      = require('fs');
var express = require('express');
var ws      = require('ws');
var stdio   = require('stdio');
var iz      = require('iz');

/////////////////
// Get options //
/////////////////

var optionsAllowed = {
  'ip'    : {key: 'i', args: 1, description: 'IP address for both HTTP and WS servers. Defaults to OpenShift if available, or if not then 0.0.0.0'},
  'port'  : {key: 'p', args: 1, description: 'TCP port for both HTTP and WS servers. Defaults to OpenShift if available, or if not then 8080'},
  'config': {key: 'c', args: 1, description: 'Load settings from configurations file. Defaults to ./config.json'},
  'nofile': {          args: 0, description: 'Run without a config file. "ip" and "port" options must be specified'}
};

var optionsCLI = stdio.getopt(optionsAllowed);

var optionsFile = {};

if(!optionsCLI.nofile) {
  try {
    var optionsFile = JSON.parse(fs.readFileSync(optionsCLI.config || 'config.json'));
  }
  catch(error) {
    console.error('Warning: Unable to read config file "' + (optionsCLI.config || 'config.json') + '". (' + error + ')');
  }
}

// Condense options sources into one options object, applying priority
var options = {};

for(var i in optionsAllowed) {
  options[i] = optionsCLI[i] || optionsFile[i];
}

if(!iz(options.ip).required().ip().valid) {
  if(iz(process.env[options.ip]).required().ip().valid) {
    options.ip = process.env[options.ip];
  }
  else {
    console.error('Error: IP must be a valid IP address or local url. Run with -i 0.0.0.0 to use all available IPs');
    process.exit(1);
  }
}

if(!iz(options.port).required().int().between(1, 65535).valid) {
  if(iz(process.env[options.port]).required().int().between(1, 65535).valid) {
    options.port = process.env[options.port];
  }
  else {
    console.error('Error: TCP port must be an integer between 1 and 65535. Run with -p 8080 to listen on port 8080');
    process.exit(1);
  }
}

if(iz(options.port).int().between(1, 1024).valid) {
  console.warn('Warning: TCP ports between 1 and 1024 may require root permission');
}

/////////////////
// HTTP server //
/////////////////

var app = express();
var httpServer = http.createServer(app);
httpServer.listen(options.port, options.ip);

// Simple static page server
app.use('/', express.static('./http'));
app.use(express.compress());
console.log(new Date().toUTCString() + ': Static file server listening at http://' + options.ip + ':' + options.port + '/');

///////////////////////////
// Repeater for controls //
///////////////////////////

// These link to rover side
var controlSocketToThePI = new ws.Server({server: httpServer, path: '/controlDrone'});
console.log(new Date().toUTCString() + ': WS control server listening for drone at http://' + options.ip + ':' + options.port + '/controlDrone');

controlSocketToThePI.on('connection', function(connection) {
  console.log('Received connection from Pi');
  
  connection.on('close', function() {
    console.log(new Date().toUTCString() + ': Closed connection from Pi');
  });
});

// And these link to client(s)
var controlSocketServer = new ws.Server({server: httpServer, path: '/controlClient'});
console.log(new Date().toUTCString() + ': WS control server listening for clients at http://' + options.ip + ':' + options.port + '/controlClient');

controlSocketServer.on('connection', function(connection) {
  console.log(new Date().toUTCString() + ': Received WebSocket at :' + options.port + '/controlClient');
  
  connection.on('message', function(message) {
    try {
      controlSocketToThePI.clients[0].send(message);
    }
    catch(error) {
      console.log(error);
    }
  });
  
  connection.on('close', function() {
    console.log(new Date().toUTCString() + ': Closed WebSocket at :' + options.port + '/controlClient');
  });
});

////////////////////////////////////
// Video part from those iOS devs //
////////////////////////////////////

var STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes

var clients = {};
var width = 640,
    height = 480;

// Websocket Server
var socketServer = new (ws.Server)({server: httpServer, path: '/videoClient'});
console.log(new Date().toUTCString() + ': WS video server listening at http://' + options.ip + ':' + options.port + '/videoClient');

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
  width = (params[0] || 640)|0;
  height = (params[1] || 480)|0;
  
  console.log('Stream Connected: ' + request.socket.remoteAddress + ':' + request.socket.remotePort + ' size: ' + width + 'x' + height);
  request.on('data', function(data) {
    for( c in clients ) {
      clients[c].send(data, {binary:true}, socketError);
    }
  });
}

app.use('/videoDrone', receiveMPEG);

console.log(new Date().toUTCString() + ': Listening for MPEG Stream on http://' + options.ip + ':' + options.port + '/videoDrone/<width>/<height>');

/////////
// CLI //
/////////

if(repl != null) { // REPL may not be available on some cloud hosts
  var cli = repl.start({});
  cli.context.http           = http;
  cli.context.repl           = repl;
  cli.context.fs             = fs;
  cli.context.express        = express;
  cli.context.ws             = ws;
  cli.context.stdio          = stdio;
  cli.context.iz             = iz;
  cli.context.optionsCLI     = optionsCLI;
  cli.context.optionsFile    = optionsFile;
  cli.context.options        = options;
  cli.context.app            = app;
  cli.context.httpServer     = httpServer;
  cli.context.controlSocketToThePI = controlSocketToThePI;
  cli.context.controlSocketServer = controlSocketServer;
}
