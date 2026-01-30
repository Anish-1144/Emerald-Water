const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Import routes
const userRoutes = require('./routes/User.route');
const designRoutes = require('./routes/design.route');
const orderRoutes = require('./routes/order.route');
const adminRoutes = require('./routes/admin.route');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection check middleware (optional - can be added to specific routes if needed)
// const { checkDBConnection } = require('./middleware/db.middleware');

// Routes
app.use('/api/users', userRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

module.exports = app;

