var ws = require('ws');
var gpio = require('pi-gpio');
var repl = require('repl');

process.title = 'tele_client_on_drone';

// Open connection to server - how to not hard-code this?
controlSocket = new ws('ws://192.168.0.101/controlDrone/');

controlSocket.on('open', function() {
  console.log('Opened control socket connection');
});

// All pins used so far are boolean outputs
function openPin(pinNumber) {
  gpio.open(pinNumber, 'output', function(error) {
    if(error) {
      console.log('Error while trying to open pin ' + pinNumber + ': ' + error);
      console.log('Trying again in 10s...');
      setTimeout(openPin, 10000, pinNumber);
    }
    else {console.log('Pin ' + pinNumber + ' opened with no errors')}
  });
}
openPin( 7);
openPin(11);
openPin(12);
openPin(13);
openPin(15);

// Listen for state changes for the rover
controlSocket.on('message', function(message) {
  console.log('Received from control socket: ' + message);
  
  var rover = JSON.parse(message);
  
  if(rover.lamp !== undefined) gpio.write(12, Boolean(rover.lamp));
  if(rover.motorRight !== undefined) {
    gpio.write( 7, rover.motorRight < 0);
    gpio.write(11, rover.motorRight > 0);
  }
  if(rover.motorLeft !== undefined) {
    gpio.write(13, rover.motorLeft < 0);
    gpio.write(15, rover.motorLeft > 0);
  }
});

/////////
// CLI //
/////////

var cli = repl.start({});
cli.context.controlSocket = controlSocket;
