const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');

app.use(express.json());

function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token || !token.startsWith('Bearer ')) {
        return res.sendStatus(401);
    }
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
}

app.get('/ping', authenticateToken, (req, res) => {
    res.send('pong');
});

app.listen(3000, () => console.log('Server is running on port 3000'));