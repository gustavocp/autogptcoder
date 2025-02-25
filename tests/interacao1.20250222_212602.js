const express = require('express');
const app = express();
app.get('/ping', function(req, res) {
    res.send('pong');
});
app.listen(3000, () => console.log('Server running on port 3000'));