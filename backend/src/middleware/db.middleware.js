const mongoose = require('mongoose');

// Middleware to check database connection
const checkDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      message: 'Database connection not available. Please try again later.',
      error: 'Service Unavailable'
    });
  }
  next();
};

module.exports = { checkDBConnection };

