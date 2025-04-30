const express = require('express');
const serverless = require('serverless-http');
require('dotenv').config();

const app = express();
app.use(express.json());

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'ADP Automation API is running'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Export the serverless function
module.exports.handler = serverless(app);
