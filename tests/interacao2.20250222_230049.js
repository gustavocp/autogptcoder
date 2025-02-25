{
  "server": {
    "port": 3000,
    "module": "__",
    "mpd": null
  },
  "pathPrefix": "/api/v1",
  "lib": {
    "express": "express",
    "cors": "cors",
    "node-socket.io": "node-socket.io",
    "node-socket.io/types": "node-socket.io/types"
  },
  "app": {
    "module": "__",
    "server": "Express.Server",
    "app": "ExpressApp"
  },
  "middleware": [
    "cors",
    "(req, res) => res.set(405).ok().json({})".format({
      "error": "Method not supported"
    })
  ],
  "routes": {
    "/ping": {
      "get": "(req, res) => res.json('pong')",
      "methods": ["GET"]
    },
    "/notify": {
      "socket": "(req, res) => {",
        "onmessage": "(msg) => res.emit('pong', msg)",
        "options": {
          "handshaking": true
        }
      }
    }
  }
}