// userRoutes.js

const express = require("express");
const app = express.Router();
const User = require('./models/user');
const bcrypt = require('bcrypt');

app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({
            username: req.body.username,
            password: hashedPassword
        });
        await newUser.save();
        res.redirect('/login');
    } catch (error) {
        res.status(500).send('Error registering user');
    }
});

app.post('/login', async (req, res) => {
    // Implementation
});

app.get('/login', (req, res) => {
    res.render('login', { layout: 'main' });
});

app.get('/', (req, res) => {
    res.render('home', { layout: 'main' });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = app;
