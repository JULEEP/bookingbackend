const express = require('express');
const app = express();
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
require('./db'); // 👈 DB connect & table create

app.use(express.json());

// Simple GET route for health check or welcome message
app.get('/', (req, res) => {
  res.send('🚀 Server is up and running! Welcome to Booking API.');
});

app.use('/users', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
