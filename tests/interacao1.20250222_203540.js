const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();
let users = [];
function generateToken(userId) {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);
    const isPasswordValid = await bcrypt.compare(password, user.password);
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
const PORT = process.env.PORT || 3000;