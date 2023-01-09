# LaserCanvas - Web

## Running locally

Run a web server from the local directory with
```
$ python3 -m http.server
```
and navigate to http://localhost:8000. The JavaScript files are loaded
individually by _LaserCanvasLoader.js_.

To run the distribution version, launch a web server from the _dist/_ directory:
```
$ cd dist
$ python3 -m http.server 8001
```
and navigate to http://localhost:8001.

## Deployment

To build the bundle, run from the command line
```
$ python3 build.py
```
This will build the file _dist/lasercanvas-web.js_ bundle.
