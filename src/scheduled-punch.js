const { punchIn } = require('./punch-in');
const serverless = require('serverless-http');
const express = require('express');
require('dotenv').config();

const app = express();

app.get('/.netlify/functions/scheduled-punch', async (req, res) => {
  // Add a simple authentication check using a secret key
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.API_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  try {
    const result = await punchIn();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle manual trigger endpoint
app.get('/trigger-punch-in', async (req, res) => {
  try {
    const result = await punchIn();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'ADP Punch-in Automation Service' });
});

// Export the serverless function
exports.handler = serverless(app);
