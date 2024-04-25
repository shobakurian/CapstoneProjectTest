
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { engine } = require("express-handlebars");
const path = require("path");
const { initialize } = require("./config/database");
const session = require("express-session");
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("express-flash");
const bcrypt = require("bcrypt");
const { validationResult } = require('express-validator');
const User = require("./models/user");


const app = express();

const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');


app.engine(
  "hbs",
  engine({
    defaultLayout: "main", 
    extname: ".hbs", // Set the file extension for Handlebars files
    layoutsDir: path.join(__dirname, "views/layouts"), // Specify the path to layouts
    partialsDir: path.join(__dirname, "views/partials"),
    handlebars: allowInsecurePrototypeAccess(require('handlebars')) // Specify the path to partials
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

const PORT = process.env.PORT || 3000;
// Regular expression for email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 3600000,
    },
  })
);
app.use(flash());
const paginate = require('express-paginate');

// Use the pagination middleware
app.use(paginate.middleware(10, 50));
// Passport configuration
app.use(passport.initialize());
app.use(passport.session());
// Define Handlebars helper functions
const handlebars = require('handlebars');
//passport encryption
passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
    },
    async (username, password, done) => {
      try {
        const user = await User.findOne({ username });
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (e) {
        return done(e);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next(); // User is logged in, proceed to the next function in the middleware stack
  }
  // User is not logged in
  req.flash("error", "You must be logged in to view that page.");
  res.redirect("/login"); // Redirect them to the login page
}



app.get("/", (req, res) => {
  res.render("mainPage"); 
});

// User Authentication Routes

app.get('/register', (req, res) => {
    res.render('register');
});

// Handle the registration form submission
app.post("/register", async (req, res) => {
  try {
    const { username,email, password, confirmPassword } = req.body;

    // Check if the passwords match
    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match");
      return res.redirect("/register");
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
        req.flash("error", "Username or email already exists");
        return res.redirect("/register");
    }
   // Check if the email is valid
   if (!emailRegex.test(email)) {
    req.flash("error", "Invalid email address");
    return res.redirect("/register");
}
    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user and save to the database
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });
    await user.save();

    // Redirect to login or another appropriate page
    req.flash("success", "Registration successful, please log in.");
    res.redirect("/login");
  } catch (error) {
    console.error("Error during registration:", error);
    req.flash("error", "Failed to register");
    res.redirect("/register");
  }
});



app.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/restaurants"); 
  } else {
    res.render("login", { message: req.flash("error") }); 
  }
});


app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
    failureFlash: "Invalid username or password."
  })
);  
app.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.user = req.user; // Make user object available in all views
  next();
});  




app.get("/home", ensureAuthenticated, async (req, res) => {
    try {
      
        res.render("home" );
    } catch (error) {
        console.error("Error getting restaurants:", error);
        res.status(500).render("error", { error: "Server error" });
    }
});



// Initialize the database and start the server
initialize(process.env.MONGODB_URI)
  .then(() => {
    console.log("Database connected successfully");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  });
