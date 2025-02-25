// Importações necessárias (caso haja)
const express = require('express');
const bodyParser = require('body-parser');

// Inicialização do Express
const app = express();
app.use(bodyParser.json());

// Dados de exemplo (para fins de teste)
let users = [
  { id: 1, name: 'John Doe', companies: [2] },
];

let companies = [
  { id: 2, name: 'Tech Inc' },
];

// CRUD para Usuários
app.get('/users', (req, res) => {
  res.json(users);
});

app.post('/users', (req, res) => {
  const newUser = req.body;
  users.push(newUser);
  res.status(201).json(newUser);
});

app.put('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(user => user.id === userId);

  if (userIndex !== -1) {
    const updatedUser = req.body;
    users[userIndex] = { ...updatedUser, id: userId };
    res.json(updatedUser);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.delete('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(user => user.id === userId);

  if (userIndex !== -1) {
    users.splice(userIndex, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// CRUD para Empresas
app.get('/companies', (req, res) => {
  res.json(companies);
});

app.post('/companies', (req, res) => {
  const newCompany = req.body;
  companies.push(newCompany);
  res.status(201).json(newCompany);
});

app.put('/companies/:id', (req, res) => {
  const companyId = parseInt(req.params.id);
  const companyIndex = companies.findIndex(company => company.id === companyId);

  if (companyIndex !== -1) {
    const updatedCompany = req.body;
    companies[companyIndex] = { ...updatedCompany, id: companyId };
    res.json(updatedCompany);
  } else {
    res.status(404).json({ error: 'Company not found' });
  }
});

app.delete('/companies/:id', (req, res) => {
  const companyId = parseInt(req.params.id);
  const companyIndex = companies.findIndex(company => company.id === companyId);

  if (companyIndex !== -1) {
    companies.splice(companyIndex, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Company not found' });
  }
});

// Inicialização da porta do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});