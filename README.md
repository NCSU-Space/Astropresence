# Astropresence #

Telepresence drone, but in space (eventually)!

## Setup ##

Current design involves a central server, a Rapberry Pi based rover which connects to the server, and a webapp for serving to users.

### Server ###

First, you need the code:

~~~
git clone https://github.com/NCSU-Space/Astropresence.git
~~~

Next, you need nodejs.  On Fedora, run as root:

~~~
yum install nodejs
~~~

Most major distros will have nodejs in their repos.  npm may be packaged separately.

Use node's specialized package manager to install dependencies:

~~~
cd ./Astropresence
npm install
~~~

The server needs to receive connections on ports 8080 and 8082, so make sure these are open on your firewall.  The client wepabb also contains references to the server's ip address.  For now, you'll need to adjust these manually.  All references are in Astropresence/http/index.html and can be found by search for references to port 8080.

Finally, you can start the server:

~~~
node server.js
~~~

Note that the command is 'nodejs' instead of 'node' on some distros.

### Rover ###

This setup uses the Raspberry Pi for now.  It includes a fork of pi-gpio in Astropresence/node_modules modified to work with the revision 2 boards.  Rev. 1 users will need to replace with the original or follow my comments in pi-gpio.js to put it back.  The left motor is wired to GPIO pins 13 and 15, the right motor to 7 and 11, and an LED to 12.

A separate program called gpio-admin is required by the gpio library (details at https://github.com/quick2wire/quick2wire-gpio-admin):

~~~
git clone https://github.com/quick2wire/quick2wire-gpio-admin.git
cd ./quick2wire-gpio-admin
make
sudo make install
sudo adduser $USER gpio
~~~

For some scripting, such as auto-starting on the pi, you will also need to link the gpio-admin binary to /bin.  On my setup this command worked, though you may need to check the location of the original binary using gpio-admin's Makefile.

~~~
ln /usr/local/bin/gpio-admin /bin/gpio-admin
~~~

For some reason, gpio-admin also requires a reboot/relog:

~~~
sudo shutdown -r now
~~~

You'll also need nodejs, this repo, and npm dependencies on the Pi:

~~~
git clone https://github.com/NCSU-Space/Astropresence.git
sudo apt-get install nodejs
sudo apt-get install npm
cd ./Astropresence
npm install
~~~

Now look through rover.js until you find an IP address, and replace it with the one for you server.  Then you can start the node-based control receiver:

~~~
nodejs rover.js
~~~

Finally, start ffmpeg to send video from the Pi (replace the IP with your server's):

~~~
ffmpeg -s 160x120 -f video4linux2 -i /dev/video0 -f mpeg1video -b 800k -r 20 http://192.168.0.101:8082/s3cret/160/120/
~~~

To set autoconnecting on the Pi, place the commands to start nodejs and ffmpeg in /etc/rc.local.  Last I checked, autoconnecting to wifi was done through /etc/network/interfaces.  The interfaces file I use is in this repo for use as a guide.

## Network Layout ##

~~~
-----------------------------------------------------------------------------------------------------------------
|  Drone computer                   |  Server                                |  Client                          |
|  Single-board linux computer      |                                        |  Modern browser with no plugins  |
|                                   |                                        |                                  |
|                                   |  HTTP:8080/                           <-> Browser requests page           |
|                                   |  WS:8080/controlClient/               <-> JS app sends commands           |
|  Python script receives commands <-> WS:8080/controlDrone/                 |                                  |
|  ffmpeg sends video              <-> HTTP:8082/[secret]/[width]/[height]/  |                                  |
|                                   |  WS:8080/videoClient/                 <-> JS app receives video           |
-----------------------------------------------------------------------------------------------------------------
~~~

## License ##

LGPLv3
