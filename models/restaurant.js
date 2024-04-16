const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  address: {
    building: String,
    coord: {
      type: { type: String, default: "Point" },
      coordinates: [Number], // GeoJSON coordinates [longitude, latitude]
    },
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

const Restaurant = mongoose.model("Restaurant", restaurantSchema, "restaurants");

const addNewRestaurant = async (data) => {
  try {
    // Parse the coordinates string into an array of numbers
    const coordinates = data.address.coord.split(',').map(coord => parseFloat(coord.trim()));

    // Update the coord field with the correct object format
    data.address.coord = {
      type: "Point",
      coordinates: coordinates
    };
    const restaurant = new Restaurant(data);
    const newRestaurant = await restaurant.save();
    return newRestaurant;
  } catch (error) {
    console.error("Error creating restaurant:", error);
    throw error; // Rethrowing the error to be handled by the caller
  }
};


async function getAllRestaurants(page, perPage, borough) {
  try {
      // Calculate skip value based on pagination parameters
      const skip = (page - 1) * perPage;

      // Query restaurants based on borough and pagination parameters
      const restaurants = await Restaurant.find(borough ? { borough } : {})
                                          .skip(skip)
                                          .limit(perPage);

      // Calculate total count of restaurants
      const totalCount = await Restaurant.countDocuments(borough ? { borough } : {});

      // Determine total number of pages
      const totalPages = Math.ceil(totalCount / perPage);

      // Determine if first and last page links should be enabled
      const firstPage = 1;
      const lastPage = totalPages;

      return {
          restaurants,
          totalPages,
          firstPage,
          lastPage
      };
  } catch (error) {
      throw new Error("Error getting restaurants: " + error.message);
  }
}


const getRestaurantById = async (id) => {
  try {
    const restaurant = await Restaurant.findById(id);
    return restaurant;
  } catch (error) {
    throw error; 
  }
};

const updateRestaurantById = async (id, data) => {
  try {
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true // This ensures that Mongoose validators are run during the update
    }).exec();
    return updatedRestaurant;
  } catch (error) {
    console.error("Error updating restaurant:", error);
    throw error;
  }
};

// Delete restaurant by ID
const deleteRestaurantById = async (id) => {
  try {
    const deletedRestaurant = await Restaurant.findByIdAndDelete(id).exec();
    return deletedRestaurant;
  } catch (error) {
    console.error("Error deleting restaurant:", error);
    throw error;
  }
};

 const searchRestaurantById= async (searchQuery) =>{
  try {
    // Perform the search query by _id
    const restaurant = await Restaurant.findById(searchQuery);
    return restaurant;
  } catch (error) {
    throw error;
  }
}
module.exports = {
  addNewRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurantById,
  deleteRestaurantById,
  searchRestaurantById,
};