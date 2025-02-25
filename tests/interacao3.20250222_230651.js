const express = require('express');
const app = express();

const io = require('socket.io');

module.exports = {
  getPing() {
    return new Response({ pong: 'pong' });
  },

  postNotify(req, res) {
    const data = req.body;
    
    res.status(200);
    res.json({
      success: true,
      data: { ping: 'pong' }
    });

    io.emit('ping', {
      eventData: {
        id: Date.now(),
        data: data
      }
    });
  }
};

app.listen(3000, () => console.log('Server running on port 3000'));