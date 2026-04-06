require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

// Security Middlewares
app.use(helmet());

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 150, // Limit each IP to 150 requests per windowMs
  message: 'Too many requests from this IP, please try again after a minute',
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10kb' })); // Body parser explicitly limiting size

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Pass io to routes if we want to emit events from REST
app.set('io', io);

// Basic Route for health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Import and use routes
const messagesRoutes = require('./routes/messages');
app.use('/api/messages', messagesRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
