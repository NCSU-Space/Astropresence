# Astropresence #

Telepresence drone, but in space!

## Network Layout ##

~~~
----------------------------------------------------------------------------------------------------------------------
|  Drone computer                   |  Server                                     |  Client                          |
|  Single-board linux computer      |                                             |  Modern browser with no plugins  |
|                                   |                                             |                                  |
|                                   |  HTTP:8080/ static web pages               <-- Browser requests pages          |
|                                   |  WS:???? listen for commands from clients  <-- JS app sends commands           |
|  Python script receives commands --> WS:???? send commands to RPi               |                                  |
|  ffmpeg sends video              --> WS:???? listen for video from ffmpeg       |                                  |
|                                   |  WS:???? send video to clients             <-- JS app receives video           |
----------------------------------------------------------------------------------------------------------------------
~~~

## License ##

LGPLv3
