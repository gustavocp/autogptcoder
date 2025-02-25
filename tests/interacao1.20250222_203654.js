const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();
let users = [];

function generateToken(userId) {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = users.find(user => user.username === username);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    return jwt.sign({ userId }, 'your_secret_key', { expiresIn: '1h' });
}

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, 'your_secret_key', (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }

        req.decoded = decoded;
        next();
    });
}

app.use(express.json());
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { username, password: hashedPassword };
    users.push(user);

    res.status(201).json({ message: 'User created successfully' });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid password' });
    }

    const token = generateToken(user.id);
    res.json({ token });
});

app.get('/protected', verifyToken, (req, res) => {
    res.json({ message: 'Welcome to the protected route!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});