const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

// Simulando um banco de dados em memória (poderia ser um arquivo JSON)
let users = [];

// Função para gerar um JWT com um id do usuário
function generateToken(userId) {
    return jwt.sign({ userId }, 'your_secret_key', { expiresIn: '1h' });
}

// Rota para registrar um novo usuário
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Verificar se o username já existe
    if (users.some(user => user.username === username)) {
        return res.status(400).json({ message: 'Username already exists' });
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cadastrar o novo usuário
    users.push({ username, password: hashedPassword });

    res.status(201).json({ message: 'User registered successfully', token: generateToken(users.length - 1) });
});

// Rota para login de um usuário
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Verificar se o usuário existe
    const user = users.find(user => user.username === username);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verificar a senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', token: generateToken(user.id) });
});

// Rota protegida que exige autenticação JWT
app.get('/protected', verifyToken, (req, res) => {
    res.json({ message: 'Access granted to protected route', user: req.user.username });
});

// Middleware para verificar o JWT no cabeçalho da requisição
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, 'your_secret_key', (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = { id: decoded.userId };
        next();
    });
}

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));