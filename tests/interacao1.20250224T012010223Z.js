const express = require('express');
const server = express();
server.get('/', function (req, res) {
  res.send("pong");
});

server.listen(3000);