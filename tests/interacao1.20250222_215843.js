const express = require('express');
const app = express();

app.get('/ping', (req, res) => {
  res.status(200).json({ pong: 'pong' });
});

app.use(express.json());
app.use(express.urlencoded());
app.use(express.error);

console.log('Express server started on http://localhost:3000');