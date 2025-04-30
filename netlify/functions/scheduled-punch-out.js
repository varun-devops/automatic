const { punchOut, generateAndUploadReport } = require('./src/punch-in');

exports.handler = async function(event, context) {
  console.log('Scheduled punch-out function triggered');
  
  try {
    const punchOutResult = await punchOut();
    console.log('Punch-out result:', punchOutResult);
    
    // Only generate report if punch-out was successful
    if (punchOutResult.success) {
      console.log('Generating daily summary report...');
      const dailyReportResult = await generateAndUploadReport('daily');
      console.log('Daily report result:', dailyReportResult);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(punchOutResult)
    };
  } catch (error) {
    console.error('Error during scheduled punch-out:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
