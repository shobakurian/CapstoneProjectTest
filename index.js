/****************************************************************************** * 
 * ITE5315 – Project * I declare that this assignment is my own work in accordance with
 *  Humber Academic Policy. * No part of this assignment has been copied manually or electronically
 *  from any other source * (including web sites) or distributed to other students. 
 * * * Group member Name: Abin Mathew & Shoba Merin Kurian
 *  Student IDs: n01579677 and N01511573  Date: 16-04-2024
 *  ******************************************************************************/
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

const {
  addNewRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurantById,
  deleteRestaurantById,
  searchRestaurantById,
} = require("./models/restaurant");


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
      secure: app.get("env") === "production",
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
  res.render("mainPage"); // Assuming "mainPage.hbs" is the name of your Handlebars view file
});

// User Authentication Routes

app.get('/register', (req, res) => {
    res.render('register');
});

// Handle the registration form submission
app.post("/register", async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    // Check if the passwords match
    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match");
      return res.redirect("/register");
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      req.flash("error", "Username already exists");
      return res.redirect("/register");
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user and save to the database
    const user = new User({
      username,
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
    successRedirect: "/restaurants",
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


// Display form to add a new restaurant
app.get("/restaurants/new",ensureAuthenticated, (req, res) => {
    res.render("addRestaurant");
});


// API Route to add a new restaurant
app.post("/api/restaurants", async (req, res) => {
    try {
        const restaurant = await addNewRestaurant(req.body);
        res.status(201).redirect("/restaurants");
    } catch (error) {
        console.error("Error creating restaurant:", error);
        res.status(500).render("error", { error: "Server error" });
    }
});


app.get("/restaurants", ensureAuthenticated, async (req, res) => {
    try {
        // Extract query parameters
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10;
        const borough = req.query.borough;

        // Get restaurants for the current page
        const { restaurants, totalPages, firstPage, lastPage } = await getAllRestaurants(page, perPage, borough);

        // Determine if there's a next page
        const hasNextPage = page < totalPages;

        // Determine if there's a previous page
        const hasPrevPage = page > 1;

        // Render the home template with restaurants and pagination information
        res.render("home", {
            restaurants: restaurants.map(restaurant => restaurant.toObject()),
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null,
            firstPage,
            lastPage,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error("Error getting restaurants:", error);
        res.status(500).render("error", { error: "Server error" });
    }
});

// Display restaurant details//used for edit
app.get("/restaurants/:id",ensureAuthenticated, async (req, res) => {
    try {
        const restaurant = await getRestaurantById(req.params.id);
        if (!restaurant) {
            res.status(404).render("error", { error: "Restaurant not found" });
            return;
        }
        res.render("restaurantDetail", { restaurant: restaurant.toObject() });
    } catch (error) {
        console.error("Error getting restaurant by ID:", error);
        res.status(500).render("error", { error: "Server error" });
    }
});

// Display edit form for a restaurant
app.get("/api/restaurants/edit/:id",ensureAuthenticated, async (req, res) => {
    try {
        const restaurant = await getRestaurantById(req.params.id);
        if (!restaurant) {
            res.status(404).render("error", { error: "Restaurant not found" });
            return;
        }
        res.render("editRestaurant", { restaurant: restaurant.toObject() });
    } catch (error) {
        console.error("Error showing edit form:", error);
        res.status(500).render("error", { error: "Server error" });
    }
});


// Handle restaurant update
app.post("/api/restaurants/edit/:id", async (req, res) => {
  try {
      const { name, borough, cuisine, address } = req.body;
      const updatedData = { name, borough, cuisine, address };
      await updateRestaurantById(req.params.id, updatedData);
      res.redirect('/restaurants'); // Redirect to the home page where all restaurants are listed
  } catch (error) {
      console.error("Error updating restaurant:", error);
      res.status(500).render("error", { error: "Server error" });
  }
});

// Search route
app.get("/search/", async (req, res) => {
  const id = req.query.id; // Access search query parameter
  try {
      const restaurant = await getRestaurantById(id);
      
      // Check if the restaurant exists
      if (!restaurant) {
          // If restaurant not found, render error page
          res.status(404).render("error", { error: "Restaurant not found" });
          return;
      }
      
      // Render the searchResults template with the found restaurant
      res.render("searchResults", { restaurant: restaurant.toObject(), searchId: id }); // Pass searchId to template
  } catch (error) {
      // Handle server error
      console.error("Error getting restaurant by ID:", error);
      res.status(500).render("error", { error: "Server error" });
  }
});

// DELETE route to delete a restaurant by ID
app.delete('/restaurants/:id', async (req, res) => {
  try {
      // Delete the restaurant
      await deleteRestaurantById(req.params.id);

      // Redirect back to the restaurants page
      res.redirect('/restaurants');
  } catch (error) {
      console.error('Error deleting restaurant:', error);
      res.status(500).send('Server error');
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
