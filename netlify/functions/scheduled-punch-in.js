const { punchIn } = require('./src/punch-in');

exports.handler = async function(event, context) {
  console.log('Scheduled punch-in function triggered');
  
  try {
    const result = await punchIn();
    console.log('Punch-in result:', result);
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error during scheduled punch-in:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
