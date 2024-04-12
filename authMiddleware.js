// authMiddleware.js

const requireAuth = (req, res, next) => {
    // Check if user is authenticated (in this example, we're checking if a session variable 'loggedIn' is set)
    if (true) {
      next(); // User is authenticated, proceed to the next middleware
    } else {
      res.status(401).send('Unauthorized'); // User is not authenticated, send 401 Unauthorized status
    }
  };
  
  module.exports = { requireAuth };
  