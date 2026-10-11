const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config();

const { initDatabase, getIsConnected } = require('./src/config/db');

// Import Route Handlers
const authRoutes = require('./src/routes/authRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const enrollmentRoutes = require('./src/routes/enrollmentRoutes');
const materialRoutes = require('./src/routes/materialRoutes');
const assignmentRoutes = require('./src/routes/assignmentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists safely (uses /tmp on serverless like Vercel)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadsDir = isServerless
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, 'uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('[Server] Could not create uploads directory:', e.message);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auto-initialize DB on cold start in serverless environments
let serverlessDbInitialized = false;
let serverlessDbPromise = null;
app.use(async (req, res, next) => {
  if (!serverlessDbInitialized) {
    if (!serverlessDbPromise) {
      serverlessDbPromise = initDatabase()
        .then(() => { serverlessDbInitialized = true; })
        .catch(err => {
          console.warn('[Serverless DB] Init notice:', err.message);
          serverlessDbInitialized = true;
        });
    }
    await serverlessDbPromise;
  }
  next();
});

// Serve Static Frontend and Uploaded Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// System Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mysql_connected: getIsConnected(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/admin', adminRoutes);

// Fallback route for SPA - serves public/index.html
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ message: 'Course Management System API is running.' });
  }
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.'
  });
});

// Start Server and Initialize Database
async function startServer() {
  await initDatabase();
  serverlessDbInitialized = true;
  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` Course Management System (CMS) Server Running`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(` Health:    http://localhost:${PORT}/api/health`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

// Export app directly for Vercel/Serverless while keeping .app and .startServer for tests
app.app = app;
app.startServer = startServer;
module.exports = app;
