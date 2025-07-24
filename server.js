const express = require('express');
const app = express();
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

require('./db'); // DB connection & tables create

app.use(express.json());

// Static folder to serve uploaded images publicly
app.use('/uploads', express.static('uploads'));

// Simple GET route for health check or welcome message
app.get('/', (req, res) => {
  res.send('🚀 Server is up and running! Welcome to Booking API.');
});

// API routes
app.use('/users', userRoutes);
app.use('/category', categoryRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
