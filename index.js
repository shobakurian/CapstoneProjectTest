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
const {
    addNewRestaurant,
    getAllRestaurants,
    getRestaurantById,
    updateRestaurantById,
    deleteRestaurantById,
} = require("./models/restaurant");
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
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log("User:", username);
    console.log("Password:", password);

    try {
        // Find the user by username
        const user = await User.findOne({ username });
        console.log("Stored Password:", user.password);

        // Check if the user exists
        if (!user) {
            console.log("User not found");
            return res.status(401).redirect('/login'); // Username not found
        }

        // Compare passwords
        const isValidPassword = await bcrypt.compare(password, user.password);
        // isValidPassword =true;
        // console.log("isValidPassword:", isValidPassword);

        // if (!isValidPassword) {
        //     console.log("Invalid password");
        //     return res.status(401).redirect('/login'); // Invalid password
        // }

        // Passwords match, proceed with login
        console.log("Password matches");
        req.session.user = user; // Save user information in session
        res.cookie('user_id', user._id.toString(), { maxAge: 3600000 }); // Save user ID in a cookie (expires in 1 hour)
        res.redirect('/restaurants'); // Redirect to the main page after login
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).redirect('/login'); // Internal server error
    }
});




// Display form to add a new restaurant
app.get("/restaurants/new", (req, res) => {
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

// API Route to get all restaurants
app.get("/api/restaurants", async (req, res) => {
    try {
        const { page = 1, perPage = 10, borough } = req.query;
        const restaurants = await getAllRestaurants(page, perPage, borough);
        res.json(restaurants);
    } catch (error) {
        console.error("Error getting restaurants:", error);
        res.status(500).json({ error: "Server error" });
    }
});


app.get("/restaurants", async (req, res) => {
    console.log("Inside /rest");
    try {
        const { page = 1, perPage = 10, borough } = req.query;
        const restaurants = await getAllRestaurants(page, perPage, borough);
        const plainRestaurantsData = restaurants.map((restaurant) =>
            restaurant.toObject()
        );
        res.render("home", { restaurants: plainRestaurantsData });
    } catch (error) {
        console.error("Error getting restaurants:", error);
        res.status(500).render("error", { error: "Server error" });
    }
});

// Display restaurant details
app.get("/restaurants/:id", async (req, res) => {
    try {
        const restaurant = await getRestaurantById(req.params.id);
        if (!restaurant) {
            res.status(404).render("error", { error: "Restaurant not found" });
            return;
        }

        // Convert the restaurant document to a plain object and format dates
        const restaurantData = restaurant.toObject({
            getters: true,
            virtuals: false,
        });
        restaurantData.grades = restaurantData.grades.map((grade) => ({
            ...grade,
            date: grade.date.toDateString(), // Format the date
            _id: grade._id.toString(), // Convert ObjectId to string if necessary
        }));
        restaurantData._id = restaurantData._id.toString(); // Convert ObjectId to string

        res.render("restaurantDetail", { restaurant: restaurantData });
    } catch (error) {
        console.error("Error getting restaurant by ID:", error);
        res.status(500).render("error", { error: "Server error" });
    }
});

app.get("/api/restaurants/edit/:id", async (req, res) => {
    try {
        const restaurantDoc = await getRestaurantById(req.params.id);
        if (!restaurantDoc) {
            return res.status(404).render("error", { error: "Restaurant not found" });
        }
        const restaurant = restaurantDoc.toObject();
        res.render("editRestaurant", { restaurant });
    } catch (error) {
        console.error("Error showing edit form:", error);
        res.status(500).render("error", { error: "Server error" });
    }
});

app.post("/api/restaurants/edit/:id", async (req, res) => {
    try {
        const updatedData = req.body;
        await updateRestaurantById(req.params.id, updatedData);
        // Redirect to the restaurant details page or elsewhere after successful update
        res.redirect(`/api/restaurants/${req.params.id}`);
    } catch (error) {
        console.error("Error updating restaurant:", error);
        res.status(500).render("error", { error: "Server error" });
    }
});

app.post("/api/restaurants/update/:id", async (req, res) => {
    console.log("Updating restaurant ID:", req.params.id);
    console.log("Data received:", req.body);
    try {
        const updatedData = req.body;
        await updateRestaurantById(req.params.id, updatedData);
        console.log("Update successful for ID:", req.params.id);
        res.redirect(`/restaurants/${req.params.id}`);
    } catch (error) {
        console.error("Error updating restaurant:", error);
        res.status(500).render("error", { error: "Server error" });
    }
});

app.delete("/api/restaurants/delete/:id", async (req, res) => {
    try {
        await deleteRestaurantById(req.params.id);
        // Redirect to the list of restaurants or home page after deletion
        res.redirect("/restaurants");
    } catch (error) {
        console.error("Error deleting restaurant:", error);
        res.status(500).render("error", { error: "Server error" });
    }
});
// User routes (login route)
app.use('/', userRoutes);

// Middleware to protect routes
app.use(requireAuth);
// Restaurant routes
app.use('/restaurants', restaurantRoutes);


module.exports = app;
