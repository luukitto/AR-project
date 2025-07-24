const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const db = require('./database/connection');
const menuRoutes = require('./routes/menu');
const tableRoutes = require('./routes/tables');
const orderRoutes = require('./routes/orders');
const { router: authRoutes } = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://192.168.1.215:5174"], // Vite dev server
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://192.168.1.215:5174"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Connect to database
db.connect().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO for real-time table sharing
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a table session room
  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} joined session ${sessionId}`);
    
    // Notify others in the session
    socket.to(sessionId).emit('user-joined', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Leave a table session room
  socket.on('leave-session', (sessionId) => {
    socket.leave(sessionId);
    console.log(`Socket ${socket.id} left session ${sessionId}`);
    
    // Notify others in the session
    socket.to(sessionId).emit('user-left', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Handle new orders (broadcast to session)
  socket.on('new-order', (data) => {
    const { sessionId, order } = data;
    
    // Broadcast to all users in the session
    io.to(sessionId).emit('order-placed', {
      order,
      timestamp: new Date().toISOString()
    });
  });

  // Handle order status updates
  socket.on('order-status-update', (data) => {
    const { sessionId, orderId, status } = data;
    
    // Broadcast to all users in the session
    io.to(sessionId).emit('order-status-changed', {
      orderId,
      status,
      timestamp: new Date().toISOString()
    });
  });

  // Handle cart sharing
  socket.on('share-cart', (data) => {
    const { sessionId, customerName, cartItems } = data;
    
    // Broadcast cart to other users in the session
    socket.to(sessionId).emit('cart-shared', {
      customerName,
      cartItems,
      timestamp: new Date().toISOString()
    });
  });

  // Handle customer joining session
  socket.on('customer-joined', (data) => {
    const { sessionId, customerName } = data;
    
    // Broadcast to all users in the session
    io.to(sessionId).emit('new-customer', {
      customerName,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  try {
    await db.close();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Georgian AR Menu API server running on port ${PORT}`);
  console.log(`📱 Socket.IO enabled for real-time table sharing`);
  console.log(`🍽️  Database: SQLite`);
});
