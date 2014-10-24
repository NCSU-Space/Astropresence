# Astropresence #

Telepresence bot, but in space (eventually)!

## Setup ##

Current design involves a central server, a computer on the bot which connects to the server, and a webapp for serving to users.

### Server ###

First, you need the code:

~~~
git clone https://github.com/NCSU-Space/Astropresence.git
~~~

Next, you need nodejs.  On Fedora, run as root:

~~~
yum install nodejs
~~~

Most major distros will have nodejs in their repos. npm may somtimes be packaged separately.

Use node's specialized package manager to install dependencies:

~~~
cd ./Astropresence
npm install
~~~

Finally, you can start the server:

By default, the server listens on port 8080 on all available IPs (0.0.0.0), and will need TCP port 8080 opened in your firewall. This bahavior can be adjusted with command line option or the config.json file.

~~~
# To run with defaults:
node server.js # Listens on 0.0.0.0:8080, make sure TCP port 8080 is open

# Or with custom options:
node server.js -i 192.168.0.100 -p 1234 # Listens on 192.168.0.100:1234, make sure TCP port 1234 is open
~~~

Note that the command is 'nodejs' instead of 'node' on some distros.

### Rover ###

This setup used to use the Raspberry Pi, but is now being moved to standard linux (as in no built-in GPIO) paired with an arduino or similar. The microcontroller part is still in development.

You'll need nodejs, this repo, npm dependencies, and ffmpeg:

~~~
git clone https://github.com/NCSU-Space/Astropresence.git
sudo apt-get install nodejs
sudo apt-get install npm
cd ./Astropresence
npm install
sudo apt-get install ffmpeg # I forget if ffmpeg required any other setup
~~~

Rover.js need a pipe for sending data to the microcontroller, as well as the server's ip and port:

~~~
mkfifo [your pipe's name]
nodejs rover.js -i [Your server's IP] -p [Your server's port] -e [your pipe] -s
~~~

Finally, start ffmpeg to send video from the bot:

~~~
ffmpeg -s 640x480 -f video4linux2 -i /dev/video0 -f mpeg1video -b 800k -r 20 http://[your server address]:8080/videoDrone/640/480
# Replace /dev/video0 with you camera differs. For some reason, the resolution has to be specified in two places in that line, so be careful when changing it
~~~

To set autoconnecting on the bot, place the commands to start nodejs and ffmpeg in your crontab:

~~~
crontab -e
# Use your chosen text editor to add the lines:
@reboot nodejs rover.js [Your server's IP]:[Your server's port]
@reboot ffmpeg -s 640x480 -f video4linux2 -i /dev/video0 -f mpeg1video -b 800k -r 20 http://[your server address]:8080/videoDrone/640/480
~~~

### Client ###

Navigate a web browser to http://[Your server's IP]:[Your server's port]/

## Network Layout ##

~~~
-----------------------------------------------------------------------------------------------------------------
|  Drone computer                   |  Server                                |  Client                          |
|  Single-board linux computer      |                                        |  Modern browser with no plugins  |
|                                   |                                        |                                  |
|                                   |  HTTP:8080/                           <-> Browser requests page           |
|                                   |  WS:8080/controlClient/               <-> JS app sends commands           |
|  Node script receives commands   <-> WS:8080/controlDrone/                 |                                  |
|  ffmpeg sends video              <-> HTTP:8080/videoDrone/[width]/[height]/|                                  |
|                                   |  WS:8080/videoClient/                 <-> JS app receives video           |
-----------------------------------------------------------------------------------------------------------------
~~~

## License ##

LGPLv3
