const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(bodyParser.json());

// Autenticação JWT - Configurando o segredo da chave secreta
const secretKey = 'sua_chave_secreta';

// Simulando uma base de dados fictícia com usuários (em memória)
let users = [];

// Função para criar um novo usuário
async function registerUser(username, password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  users.push({ username, password: hashedPassword });
}

// Função para gerar um token JWT de autenticação
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    secretKey,
    { expiresIn: '1h' }
  );
}

// Middleware para verificar o token JWT na rota protegida
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Rotas
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    await registerUser(username, password);
    res.status(201).send('Usuário registrado com sucesso.');
  } catch (error) {
    res.status(500).send('Erro ao registrar usuário.');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).send('Usuário ou senha inválidos.');
  }

  const token = generateToken(user);
  res.json({ token });
});

app.get('/protected', authenticateToken, (req, res) => {
  res.send(`Olá, ${req.user.username}! Esta é uma rota protegida.`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));