var ws = require('ws');
var fs = require('fs');
var repl = require('repl');

process.title = 'tele_client_on_drone';

if(process.argv[2] === undefined) {
  console.log('Usage: node rover.js [Server IP]:[WebSocket port]');
  console.log('If you don\'t know which port the server is using, it\'s probably 8080');
}

// Open connection to server - how to not hard-code this?
controlSocket = new ws('ws://' + process.argv[2] + '/controlDrone');

controlSocket.on('open', function() {
  console.log('Opened control socket connection');
});

var stream = fs.createWriteStream('communication_file');

// Listen for state changes for the rover
controlSocket.on('message', function(message) {
  console.log('Received from control socket: ' + message);
  
  var rover = JSON.parse(message);
  
  if(rover.motorRight === 0) stream.write(new Buffer([1, 0, 0]));
  if(rover.motorRight > 0) stream.write(new Buffer([1, 1, 128]));
  if(rover.motorRight < 0) stream.write('def');
  
  if(rover.motorLeft === 0) stream.write(new Buffer([1, 0, 0]));
  if(rover.motorLeft > 0) stream.write(new Buffer([1, 1, Math.round(rover.motorLeft)*255]));
  if(rover.motorLeft < 0) stream.write(new Buffer([1, 2, Math.round(rover.motorLeft)*-255]));
});

/////////
// CLI //
/////////

var cli = repl.start({});
cli.context.controlSocket = controlSocket;
