require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');
const app = require('./app');

// Establish database connection
connectDB();

const server = http.createServer(app);
const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'];

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] }
});
// Override the mock io object with the real socket.io instance
app.set('io', io);

// Socket Handler
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
