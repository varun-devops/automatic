const serverless = require('serverless-http');
const express = require('express');
const { punchIn, punchOut, generateAndUploadReport } = require('./src/punch-in');
require('dotenv').config();

const app = express();

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ADP Punch-in/Punch-out Automation Service is running',
    nextPunchInTime: process.env.PUNCH_IN_TIME || '0 5 10 * * 1-5',
    nextPunchOutTime: process.env.PUNCH_OUT_TIME || '0 58 23 * * 1-5'
  });
});

// Manual trigger endpoints
app.get('/api/punch-in', async (req, res) => {
  try {
    const result = await punchIn();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/punch-out', async (req, res) => {
  try {
    const result = await punchOut();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/generate-report', async (req, res) => {
  try {
    const result = await generateAndUploadReport('daily');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports.handler = serverless(app);
