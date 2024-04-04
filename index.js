/****************************************************************************** * 
 * ITE5315 – Project * I declare that this assignment is my own work in accordance with 
 * Humber Academic Policy. * No part of this assignment has been copied manually or electronically
 *  from any other source * (including web sites) or distributed to other students.
 *  * * Group member Name: Abin Mathew , Shoba Merin Kurian
 * _ Student IDs: N01579677 , N01511573 Date: 04-04-2024_ 
 * 
 * ******************************************************************************/
// Import required modules
const express = require('express');
const cors = require('cors');
const { initialize } = require('./config/database');
const {
  addNewRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurantById,
  deleteRestaurantById
} = require('./models/restaurant');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
initialize(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start listening to requests
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Routes
app.post('/api/restaurants', async (req, res) => {
  try {
    const restaurant = await addNewRestaurant(req.body);
    res.status(201).json(restaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/restaurants', async (req, res) => {
  try {
    const { page = 1, perPage = 10, borough } = req.query;
    const restaurants = await getAllRestaurants(page, perPage, borough);
    res.json(restaurants);
  } catch (error) {
    console.error('Error getting restaurants:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/restaurants/:id', async (req, res) => {
  try {
    const restaurant = await getRestaurantById(req.params.id);
    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }
    res.json(restaurant);
  } catch (error) {
    console.error('Error getting restaurant by ID:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/restaurants/:id', async (req, res) => {
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

app.delete('/api/restaurants/:id', async (req, res) => {
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

module.exports = app;
