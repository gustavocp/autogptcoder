const express = require('express');
let app = express();

// Include Socket.IO main script from CDN
document.addEventListener('DOMContentLoaded', function() {
    window.SOCKET.IO = window.SOCKET.IO || window.sockets.io;
});

app.use(express.json());

app.get('/ping', (e) => {
    e.preventDefault();
    return 'pong';
});

app.get('/notify', (e) => {
    e.preventDefault();
    if (window.SOCKET.IO && !e.isServer && e.origin !== null) {
        window.SOCKET.IO.emit('pong');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});