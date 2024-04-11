// index.js

const express = require("express");
const cors = require("cors");
const { engine } = require("express-handlebars");
const path = require("path");
const { initialize } = require("./config/database");
const { requireAuth } = require('./authMiddleware');
const session = require('express-session');
const bodyParser = require('body-parser');
const userRoutes = require('./userRoutes'); // Import user routes
const restaurantRoutes = require('./restaurantRoutes');
const User = require('./models/user'); // Import User model
const bcrypt = require('bcrypt');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const methodOverride = require("method-override");
app.use(express.urlencoded({ extended: true })) ;
// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.engine(
  ".hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views/layouts"),
    partialsDir: path.join(__dirname, "views/partials"),
  })
);
app.set("view engine", ".hbs");
app.set("views", path.join(__dirname, "views"));

// Initialize MongoDB
initialize(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
    // Handle error appropriately (e.g., exit the application)
    process.exit(1);
  });

// Login endpoint
// Login endpoint
app.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    console.log("User  " +username);
    try {
      const user = await User.findOne({ username });
        console.log("User  " +user);
      if (!user) {
        console.log(user);
        return res.status(401).redirect('/login'); // Username not found
      }
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).redirect('/login'); // Invalid password
      }
      console.log(isValidPassword);
      req.session.user = user; // Save user information in session
      res.cookie('user_id', user._id.toString(), { maxAge: 3600000 }); // Save user ID in a cookie (expires in 1 hour)
      res.redirect('/restaurants'); // Redirect to the main page after login
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).redirect('/login'); // Internal server error
    }
  });

// User routes (login route)
app.use('/', userRoutes);

// Middleware to protect routes
app.use(requireAuth);

// Restaurant routes
app.use('/restaurants', restaurantRoutes);

module.exports = app;
