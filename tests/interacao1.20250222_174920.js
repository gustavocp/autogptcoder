const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

let users = [];
let companies = [];

function sendMessage(message) {
  // Implementação de envio de mensagem no telegram
  console.log(`Sending message: ${message}`);
}

// API /ping
app.get('/ping', (req, res) => {
  res.send('pong');
});

// CRUD Users
app.post('/users', (req, res) => {
  const newUser = req.body;
  users.push(newUser);
  res.status(201).send(newUser);
});

app.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).send('User not found');
  res.send(user);
});

app.put('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return res.status(404).send('User not found');
  const updatedUser = { ...users[userIndex], ...req.body };
  users[userIndex] = updatedUser;
  res.send(updatedUser);
});

app.delete('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return res.status(404).send('User not found');
  users.splice(userIndex, 1);
  res.send({ message: 'User deleted' });
});

// CRUD Companies
app.post('/companies', (req, res) => {
  const newCompany = req.body;
  companies.push(newCompany);
  res.status(201).send(newCompany);
});

app.get('/companies/:id', (req, res) => {
  const companyId = parseInt(req.params.id, 10);
  const company = companies.find(c => c.id === companyId);
  if (!company) return res.status(404).send('Company not found');
  res.send(company);
});

app.put('/companies/:id', (req, res) => {
  const companyId = parseInt(req.params.id, 10);
  const companyIndex = companies.findIndex(c => c.id === companyId);
  if (companyIndex === -1) return res.status(404).send('Company not found');
  const updatedCompany = { ...companies[companyIndex], ...req.body };
  companies[companyIndex] = updatedCompany;
  res.send(updatedCompany);
});

app.delete('/companies/:id', (req, res) => {
  const companyId = parseInt(req.params.id, 10);
  const companyIndex = companies.findIndex(c => c.id === companyId);
  if (companyIndex === -1) return res.status(404).send('Company not found');
  companies.splice(companyIndex, 1);
  res.send({ message: 'Company deleted' });
});

// Alert
app.get('/alert', (req, res) => {
  const message = req.query.message;
  if (!message) return res.status(400).send('Message is required');
  sendMessage(message);
  res.send({ message: 'Alert sent' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});