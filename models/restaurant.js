// restaurant.js

const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  address: {
    building: String,
    coord: [Number], // GeoJSON coordinates
    street: String,
    zipcode: String
  },
  borough: String,
  cuisine: String,
  grades: [{
    date: Date,
    grade: String,
    score: Number
  }],
  name: String,
  restaurant_id: String
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

const addNewRestaurant = (data) => {
  return new Promise((resolve, reject) => {
    const restaurant = new Restaurant(data);
    restaurant.save()
      .then((newRestaurant) => resolve(newRestaurant))
      .catch((error) => {
        console.error('Error creating restaurant:', error);
        reject(error);
      });
  });
};

const getAllRestaurants = (page, perPage, borough) => {
  const filter = borough ? { borough } : {};
  return Restaurant.find(filter)
    .skip((page - 1) * perPage)
    .limit(parseInt(perPage))
    .exec();
};

const getRestaurantById = (id) => {
  return Restaurant.findById(id).exec();
};

const updateRestaurantById = (data, id) => {
  return Restaurant.findByIdAndUpdate(id, data, { new: true }).exec();
};

const deleteRestaurantById = (id) => {
  return Restaurant.findByIdAndDelete(id).exec();
};

module.exports = {
  addNewRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurantById,
  deleteRestaurantById,
};
