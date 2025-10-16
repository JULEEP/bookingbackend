import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import turnamentRoutes from './routes/turnamentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import connectDB from './config/db.js'; // MongoDB connection function
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { Server } from "socket.io";
import http from "http";

// Setup __dirname with ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Create express app
const app = express();

// ✅ Serve static files from /uploads
app.use(cors({
    origin: ['http://localhost:3000', 'http://31.97.206.144:8026'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Connect to MongoDB
connectDB();

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/', (req, res) => {
  res.send('🚀 Server is up and running! Welcome to Booking API.');
});

// API routes
app.use('/users', userRoutes);
app.use('/category', categoryRoutes);
app.use('/turnament', turnamentRoutes);
app.use('/admin', adminRoutes);

// ✅ Create HTTP server for Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Listen for "join-match" event to join a specific match room
  socket.on('join-match', (matchId) => {
    socket.join(matchId);
    console.log(`Socket ${socket.id} joined match room: ${matchId}`);
  });

  // Listen for the "live-match-update" event sent by the server
  socket.on('live-match-update', (data) => {
    console.log('Live match update received:', data); // Log the live match update data
    // You can handle any other logic you want with the data here
  });

  // Log when the user disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});


// ✅ IMPORTANT: Use server.listen instead of app.listen
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.io is ready for real-time updates`);
});

// ✅ Export io for use in controllers
export { io };
