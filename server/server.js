
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const morgan = require('morgan');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});


const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'messagepulse',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// JWT middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    req.user = decoded;
    
    // Check if user exists
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;
    
   
    if (!name || !email || !phone || !role || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if user already exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, role, password) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, role, hashedPassword]
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.insertId,
        name,
        email,
        phone,
        role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check if user exists
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Update user status to online
    await pool.query('UPDATE users SET status = "online", last_seen = NOW() WHERE id = ?', [user.id]);
    
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: 'online'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User Routes
app.get('/api/users', authenticate, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, phone, role, status, last_seen FROM users WHERE id != ?',
      [req.user.id]
    );
    
    res.status(200).json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/search', authenticate, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const [users] = await pool.query(
      'SELECT id, name, email, phone, role, status, last_seen FROM users WHERE ' +
      '(name LIKE ? OR email LIKE ?) AND id != ?',
      [`%${query}%`, `%${query}%`, req.user.id]
    );
    
    res.status(200).json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/users/me', authenticate, async (req, res) => {
  try {
    // Delete user
    await pool.query('DELETE FROM users WHERE id = ?', [req.user.id]);
    
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Friend Request Routes
app.post('/api/friend-requests', authenticate, async (req, res) => {
  try {
    const { receiverId } = req.body;
    
    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }
    
    // Check if request already exists
    const [existingRequests] = await pool.query(
      'SELECT * FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
      [req.user.id, receiverId, receiverId, req.user.id]
    );
    
    if (existingRequests.length > 0) {
      return res.status(400).json({ message: 'Friend request already exists' });
    }
    
    // Create friend request
    await pool.query(
      'INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)',
      [req.user.id, receiverId]
    );
    
    res.status(201).json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/friend-requests', authenticate, async (req, res) => {
  try {
    // Get received friend requests
    const [receivedRequests] = await pool.query(
      'SELECT fr.*, u.name, u.email, u.role, u.status FROM friend_requests fr ' +
      'JOIN users u ON fr.sender_id = u.id ' +
      'WHERE fr.receiver_id = ? AND fr.status = "pending"',
      [req.user.id]
    );
    
    // Get sent friend requests
    const [sentRequests] = await pool.query(
      'SELECT fr.*, u.name, u.email, u.role, u.status FROM friend_requests fr ' +
      'JOIN users u ON fr.receiver_id = u.id ' +
      'WHERE fr.sender_id = ? AND fr.status = "pending"',
      [req.user.id]
    );
    
    res.status(200).json({
      receivedRequests,
      sentRequests
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/friend-requests/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (accepted/rejected) is required' });
    }
    
 
    const [requests] = await pool.query(
      'SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ?',
      [id, req.user.id]
    );
    
    if (requests.length === 0) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Update request status
    await pool.query(
      'UPDATE friend_requests SET status = ? WHERE id = ?',
      [status, id]
    );
    
    res.status(200).json({ message: `Friend request ${status}` });
  } catch (error) {
    console.error('Update friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/friends', authenticate, async (req, res) => {
  try {
    const [friends] = await pool.query(
      'SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.last_seen FROM users u ' +
      'JOIN friend_requests fr ON (fr.receiver_id = u.id OR fr.sender_id = u.id) ' +
      'WHERE fr.status = "accepted" AND ' +
      '((fr.sender_id = ? AND fr.receiver_id = u.id) OR (fr.receiver_id = ? AND fr.sender_id = u.id))',
      [req.user.id, req.user.id]
    );
    
    res.status(200).json({ friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Message Routes
app.post('/api/messages', authenticate, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    
    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver ID and content are required' });
    }
    
    // Check if users are friends
    const [friendships] = await pool.query(
      'SELECT * FROM friend_requests WHERE ' +
      '((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) ' +
      'AND status = "accepted"',
      [req.user.id, receiverId, receiverId, req.user.id]
    );
    
    if (friendships.length === 0) {
      return res.status(403).json({ message: 'You can only send messages to friends' });
    }
    
    // Create message
    const [result] = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [req.user.id, receiverId, content]
    );
    
    const message = {
      id: result.insertId,
      sender_id: req.user.id,
      receiver_id: receiverId,
      content,
      is_read: false,
      created_at: new Date()
    };
    
    
    io.to(`user_${receiverId}`).emit('new_message', {
      ...message,
      sender_name: req.user.name
    });
    
    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/messages/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
   
    const [messages] = await pool.query(
      'SELECT * FROM messages ' +
      'WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ' +
      'ORDER BY created_at ASC',
      [req.user.id, userId, userId, req.user.id]
    );
    
  
    await pool.query(
      'UPDATE messages SET is_read = true WHERE sender_id = ? AND receiver_id = ? AND is_read = false',
      [userId, req.user.id]
    );
    
    res.status(200).json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Socket.IO
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('user_connected', async (userId) => {
    if (!userId) return;


    activeUsers.set(userId, socket.id);
    socket.join(`user_${userId}`);
    

    try {
      await pool.query('UPDATE users SET status = "online", last_seen = NOW() WHERE id = ?', [userId]);
  
      const [friends] = await pool.query(
        'SELECT DISTINCT ' +
        'CASE WHEN fr.sender_id = ? THEN fr.receiver_id ELSE fr.sender_id END AS friend_id ' +
        'FROM friend_requests fr ' +
        'WHERE (fr.sender_id = ? OR fr.receiver_id = ?) AND fr.status = "accepted"',
        [userId, userId, userId]
      );
      
      friends.forEach(friend => {
        io.to(`user_${friend.friend_id}`).emit('user_status_change', {
          userId,
          status: 'online'
        });
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
    
    console.log(`User ${userId} connected`);
  });
  
  socket.on('disconnect', async () => {
    console.log('Client disconnected');
    
 
    let disconnectedUserId = null;
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }
    
    if (disconnectedUserId) {
   
      activeUsers.delete(disconnectedUserId);
      
   
      try {
        await pool.query('UPDATE users SET status = "offline", last_seen = NOW() WHERE id = ?', [disconnectedUserId]);
    
        const [friends] = await pool.query(
          'SELECT DISTINCT ' +
          'CASE WHEN fr.sender_id = ? THEN fr.receiver_id ELSE fr.sender_id END AS friend_id ' +
          'FROM friend_requests fr ' +
          'WHERE (fr.sender_id = ? OR fr.receiver_id = ?) AND fr.status = "accepted"',
          [disconnectedUserId, disconnectedUserId, disconnectedUserId]
        );
        
        friends.forEach(friend => {
          io.to(`user_${friend.friend_id}`).emit('user_status_change', {
            userId: disconnectedUserId,
            status: 'offline'
          });
        });
      } catch (error) {
        console.error('Error updating user status:', error);
      }
      
      console.log(`User ${disconnectedUserId} disconnected`);
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
