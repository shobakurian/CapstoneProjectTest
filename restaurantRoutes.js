const express = require("express");
const app = express.Router();
const {
  addNewRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurantById,
  deleteRestaurantById,
} = require("./models/restaurant");

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
  app.post('/restaurants', (req, res) => {
    // Render a view using "main.hbs" as the layout
    res.render('home', { layout: 'main' });
  });
  
  // Display all restaurants (for browsing)
  app.get("/restaurants", async (req, res) => {
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
  
module.exports = app;