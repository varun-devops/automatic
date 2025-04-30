const express = require('express');
const cron = require('node-cron');
const { punchIn, punchOut, generateAndUploadReport } = require('./src/punch-in');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Status endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ADP Punch-in/Punch-out Automation Service is running',
    nextPunchInTime: getPunchInScheduledTime(),
    nextPunchOutTime: getPunchOutScheduledTime()
  });
});

// Manual trigger endpoints
app.get('/trigger-punch-in', async (req, res) => {
  try {
    const result = await punchIn();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/trigger-punch-out', async (req, res) => {
  try {
    const result = await punchOut();
    const reportResult = await generateAndUploadReport();
    res.json({ punchOutResult: result, reportResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/generate-report', async (req, res) => {
  try {
    const result = await generateAndUploadReport();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule the punch-in task to run at 10:05 AM Monday-Friday
const punchInSchedule = process.env.PUNCH_IN_TIME || '0 5 10 * * 1-5';
cron.schedule(punchInSchedule, async () => {
  console.log(`Scheduled punch-in triggered at ${new Date().toLocaleString()}`);
  try {
    const punchInResult = await punchIn();
    console.log('Punch in result:', punchInResult);
    
    // No need to generate a report here as it's now included in the punchIn function
  } catch (error) {
    console.error('Error during scheduled punch-in:', error);
  }
});

// Schedule the punch-out task to run at 11:58 PM Monday-Friday
const punchOutSchedule = process.env.PUNCH_OUT_TIME || '0 58 23 * * 1-5';
cron.schedule(punchOutSchedule, async () => {
  console.log(`Scheduled punch-out triggered at ${new Date().toLocaleString()}`);
  try {
    const punchOutResult = await punchOut();
    console.log('Punch out result:', punchOutResult);
    
    // No need to generate a report here as it's now included in the punchOut function
    
    // After punch out is done, generate a daily summary report as well
    if (punchOutResult.success) {
      console.log('Generating daily summary report...');
      const dailyReportResult = await generateAndUploadReport('daily');
      console.log('Daily report generation result:', dailyReportResult);
    }
  } catch (error) {
    console.error('Error during scheduled punch-out or report generation:', error);
  }
});

// Function to calculate next scheduled punch in
function getPunchInScheduledTime() {
  const cronTime = process.env.PUNCH_IN_TIME || '0 5 10 * * 1-5';
  return `Scheduled to run at 10:05 AM on weekdays (Monday-Friday)`;
}

// Function to calculate next scheduled punch out
function getPunchOutScheduledTime() {
  const cronTime = process.env.PUNCH_OUT_TIME || '0 59 23 * * 1-5';
  return `Scheduled to run at 11:58 PM on weekdays (Monday-Friday)`;
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Punch-in scheduled for: ${getPunchInScheduledTime()}`);
  console.log(`Punch-out scheduled for: ${getPunchOutScheduledTime()}`);
  console.log('==============================================');
  console.log('🟢 Automation service is now active');
  console.log('📊 Status dashboard available at http://localhost:' + PORT);
  console.log('==============================================');
});
