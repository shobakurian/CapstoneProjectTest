// restaurantRoutes.js
const express = require('express');
const router = express.Router();
const { getAllRestaurants,
   getRestaurantById,
    updateRestaurantById,
     deleteRestaurantById,
      addNewRestaurant } 
= require('../models/restaurant');



router.get('/', async (req, res) => {
  try {
    const { page = 1, perPage = 10, borough } = req.query;
    const restaurants = await getAllRestaurants(page, perPage, borough);
    res.render('home', { restaurants });
    res.json(restaurants);
    console.log("My restaurantsData: ", restaurants);
  } catch (error) {
    console.error('Error getting restaurants:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// GET /api/restaurants/:id
router.get('/:id', async (req, res) => {
    try {
        const restaurant = await getRestaurantById(req.params.id);
        if (!restaurant) {
            res.status(404).json({ error: 'Restaurant not found' });
            return;
        }
        res.render('home', { restaurant });
   ///     res.json(restaurant);
    } catch (error) {
        console.error('Error getting restaurant by ID:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/restaurants
router.post('/', async (req, res) => {
    try {
        const newRestaurant = await addNewRestaurant(req.body);
        res.status(201).json(newRestaurant);
    } catch (error) {
        console.error('Error creating restaurant:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/restaurants/:id
router.put('/:id', async (req, res) => {
    try {
        const restaurant = await updateRestaurantById(req.body, req.params.id);
        if (!restaurant) {
            res.status(404).json({ error: 'Restaurant not found' });
            return;
        }
       res.json(restaurant);
       
    } catch (error) {
        console.error('Error updating restaurant:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/restaurants/:id
router.delete('/:id', async (req, res) => {
    try {
        const restaurant = await deleteRestaurantById(req.params.id);
        if (!restaurant) {
            res.status(404).json({ error: 'Restaurant not found' });
            return;
        }
        res.json({ message: 'Restaurant deleted successfully' });
    } catch (error) {
        console.error('Error deleting restaurant:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
