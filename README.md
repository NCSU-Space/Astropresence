# Astropresence #

Telepresence drone, but in space!

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
