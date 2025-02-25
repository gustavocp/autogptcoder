const express = require('express');
const axios = require('axios');

const app = express();

// Define o endpoint para ping
app.get('/ping', (req, res) => {
    res.status(200).json({ message: 'pong' });
});

// Define o endpoint para gateway com chamada GET usando Axios
app.get('/gateway', (req, res) => {
    try {
        const response = axios.get('https://example.com/another-api');
        if (response.ok) {
            res.status(200).json({ data: response.data });
        } else {
            res.status(500).json({ error: 'API call failed' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});