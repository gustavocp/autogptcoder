const express = require('express');
const app = express();
const mongoose = require('mongoose');
app.use(express.json());

// Define a schema for User and Company models
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  companies: [mongoose.Schema.Types.ObjectId]
});

const companySchema = new mongoose.Schema({
  name: String,
  address: String,
  employees: [mongoose.Schema.Types.ObjectId]
});

// Define the User and Company models
const User = mongoose.model('User', userSchema);
const Company = mongoose.model('Company', companySchema);

// CRUD methods for Users
app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = new User({ name, email });
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.find().populate('companies');
    res.send(users);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('companies');
    if (!user) return res.status(404).send({ message: 'User not found' });
    res.send(user);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { name, email });
    if (!user) return res.status(404).send({ message: 'User not found' });
    res.send(user);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).send({ message: 'User not found' });
    res.send({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// CRUD methods for Companies
app.post('/companies', async (req, res) => {
  try {
    const { name, address } = req.body;
    const company = new Company({ name, address });
    await company.save();
    res.status(201).send(company);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/companies', async (req, res) => {
  try {
    const companies = await Company.find().populate('employees');
    res.send(companies);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/companies/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate('employees');
    if (!company) return res.status(404).send({ message: 'Company not found' });
    res.send(company);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.put('/companies/:id', async (req, res) => {
  try {
    const { name, address } = req.body;
    const company = await Company.findByIdAndUpdate(req.params.id, { name, address });
    if (!company) return res.status(404).send({ message: 'Company not found' });
    res.send(company);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.delete('/companies/:id', async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) return res.status(404).send({ message: 'Company not found' });
    res.send({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mydb', { useNewUrlParser: true, useUnifiedTopology: true });

app.listen(3000, () => {
  console.log('Server started on port 3000');
});