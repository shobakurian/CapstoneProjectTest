const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const router = express.Router();

// Register User
router.post('/register', async (req, res) => {
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

// Login User// Login User
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
  
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = user; // Save user information in session
      res.cookie('user_id', user._id.toString(), { maxAge: 3600000 }); // Save user ID in a cookie (expires in 1 hour)
      res.redirect('/restaurants'); // Redirect to the main page after login
    } else {
      res.redirect('/login'); // Redirect back to login page if authentication fails
    }
  });
  
router.get('/login', (req, res) => {
    // Render a view using "main.hbs" as the layout
    res.render('login', { layout: 'main' });
  });
  router.get('/', (req, res) => {
    // Render a view using "main.hbs" as the layout
    res.render('home', { layout: 'main' });
  });
// Logout User
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;
