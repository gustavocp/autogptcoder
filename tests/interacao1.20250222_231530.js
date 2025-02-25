const express = require('express');
const axios = require('axios');
const socket.io = require('socket.io');

const app = express();

app.get('/ping', (req, res) => {
  res.status(200).json({ pong: 'pong' });
});

app.get('/gateway', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:8080/api/v1/teste');
    if (response.ok) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ error: 'Error: Failed to reach gateway' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(400).json({ error: 'Failed to get response from gateway' });
  }
});

app.get('/teste', async (req, res) => {
  const channel = req.query?.channel || 'test-channel';
  try {
    socket.io.emit(channel, { message: { test: { data: { value: 'Test Value' } } } }, { allowReplay: false });
  } catch (error) {
    console.error('Error:', error);
    res.status(400).json({ error: 'Error emitting event from test endpoint' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});