require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/artwork', require('./routes/artwork'));
app.use('/api/social', require('./routes/social'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/community', require('./routes/community'));
app.use('/api/groups', require('./routes/groupChat'));
app.use('/api/competition', require('./routes/competition'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/reports', require('./routes/report'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/comics', require('./routes/comics'));
app.use('/api/arthistory', require('./routes/artHistory'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => res.json({ message: '🎨 Artory API Running' }));

// Socket
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
