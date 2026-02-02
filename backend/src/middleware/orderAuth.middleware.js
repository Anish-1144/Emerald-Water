const jwt = require('jsonwebtoken');

const orderAuth = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Please authenticate first.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is for order access
    if (decoded.type !== 'order_access') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    // Attach email to request
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired. Please authenticate again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Please authenticate again.' });
    }
    return res.status(500).json({ message: 'Authentication error' });
  }
};

module.exports = orderAuth;

