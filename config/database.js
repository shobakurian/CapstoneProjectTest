const mongoose = require('mongoose');

const initialize = (connectionString) => {
  return new Promise((resolve, reject) => {
    if (!connectionString) {
      const error = new Error('Connection string is undefined or null');
      reject(error);
      return;
    }

    mongoose.connect(connectionString)
      .then(() => {
        console.log('Connected to MongoDB');
        resolve();
      })
      .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
        reject(error);
      });
  });
};

module.exports = {
  initialize,
};
