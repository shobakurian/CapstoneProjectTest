const express = require("express");
const {
  addNewRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurantById,
  deleteRestaurantById,
} = require("../models/restaurant"); // Adjust the path as necessary

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const restaurant = await addNewRestaurant(req.body);
    res.status(201).json(restaurant);
  } catch (error) {
    console.error("Error creating restaurant:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { page = 1, perPage = 10, borough } = req.query;
    const restaurants = await getAllRestaurants(page, perPage, borough);
    res.render("home", { restaurants: restaurants });
  } catch (error) {
    console.error("Error getting restaurants:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const restaurant = await getRestaurantById(req.params.id);
    if (!restaurant) {
      res.status(404).json({ error: "Restaurant not found" });
      return;
    }
    res.json(restaurant);
  } catch (error) {
    console.error("Error getting restaurant by ID:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const restaurant = await updateRestaurantById(req.body, req.params.id);
    if (!restaurant) {
      res.status(404).json({ error: "Restaurant not found" });
      return;
    }
    res.json(restaurant);
  } catch (error) {
    console.error("Error updating restaurant:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const restaurant = await deleteRestaurantById(req.params.id);
    if (!restaurant) {
      res.status(404).json({ error: "Restaurant not found" });
      return;
    }
    res.json({ message: "Restaurant deleted successfully" });
  } catch (error) {
    console.error("Error deleting restaurant:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
