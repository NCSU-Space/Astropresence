var ws    = require('ws');
var repl  = require('repl');
var fs    = require('fs');
var stdio = require('stdio');

process.title = 'tele_client_on_drone';

var optionsAllowed = {
  'ip'    : {key: 'i', args: 1, mandatory: true, description: 'IP adress or hostname of server'},
  'port'  : {key: 'p', args: 1, mandatory: true, description: 'TCP port number for control websocket (usually 8080)'},
  'pipe'  : {key: 'e', args: 1, mandatory: true, description: 'Name of pipe for communicating with microcontroller'},
  'silent': {key: 's', description: 'Silence stdout'},
};

var options = stdio.getopt(optionsAllowed);

var log = options.silent ? function(){} : console.log;

var mapping = {
  1: 1,
  2: 4,
  3: 6,
  4: 8,
  5: 3,
  6: 7,
  7: 2,
  8: 5,
}

// Doesn't seem to actually catch errors...maybe there is an option to place an event handler with the contructor?
try {
  controlSocket = new ws('ws://' + options.ip + ':' + options.port + '/controlDrone');
}
catch(e) {
  log('Error opening control socket: ' + e);
  process.exit(1);
}

try {
  var stream = fs.createWriteStream(options.pipe);
}
catch(e) {
  log('Error opening pipe for microcontroller: ' + e);
  process.exit(1);
}

controlSocket.on('open', function() {
  log('Opened control socket connection');
});

// Listen for state changes for the rover
controlSocket.on('message', function(message) {
  log('Received from control socket: ' + message);
  
  var mObject = JSON.parse(message);
  
  switch(mObject.command) {
    case 'motors':
      var motors = mObject.motors;
      for(var i = 1, endi = 9; i < endi; ++i) {
        stream.write(new Buffer([mapping[i], motors[i] > 0 ? 1 : 2, Math.floor(Math.abs(motors[i]), 255)]));
      }
      break;
  }
});

/////////
// CLI //
/////////

if(!options.silent) {
  var cli = repl.start({});
  cli.context.controlSocket = controlSocket;
  cli.context.stream = stream;
}
