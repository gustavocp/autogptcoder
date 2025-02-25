const express = require('express');
const app = express();
const io = require('socket.io')(app);
app.get('/ping', function(req, res) {
    res.send('pong');
});
app.listen(3000);