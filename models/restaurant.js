const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  address: {
    building: String,
    coord: [Number], // GeoJSON coordinates
    street: String,
    zipcode: String,
  },
  borough: String,
  cuisine: String,
  grades: [
    {
      date: Date,
      grade: String,
      score: Number,
    },
  ],
  name: String,
  restaurant_id: String, // Ensure this is unique if used as an identifier
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

const addNewRestaurant = async (data) => {
  try {
    const restaurant = new Restaurant(data);
    const newRestaurant = await restaurant.save();
    return newRestaurant;
  } catch (error) {
    console.error("Error creating restaurant:", error);
    throw error; // Rethrowing the error to be handled by the caller
  }
};

const getAllRestaurants = async (page, perPage, borough) => {
  try {
    const filter = borough ? { borough } : {};
    const restaurants = await Restaurant.find(filter)
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage, 10))
      .exec();
    return restaurants;
  } catch (error) {
    console.error("Error getting restaurants:", error);
    throw error;
  }
};

const getRestaurantById = async (id) => {
  try {
    const restaurant = await Restaurant.findById(id).exec();
    return restaurant;
  } catch (error) {
    console.error("Error getting restaurant by ID:", error);
    throw error;
  }
};

const updateRestaurantById = async (data, id) => {
  try {
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(id, data, {
      new: true,
    }).exec();
    return updatedRestaurant;
  } catch (error) {
    console.error("Error updating restaurant:", error);
    throw error;
  }
};

const deleteRestaurantById = async (id) => {
  try {
    const deletedRestaurant = await Restaurant.findByIdAndDelete(id).exec();
    return deletedRestaurant;
  } catch (error) {
    console.error("Error deleting restaurant:", error);
    throw error;
  }
};

module.exports = {
  addNewRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurantById,
  deleteRestaurantById,
};
