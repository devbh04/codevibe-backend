const express = require('express');
const serverless = require('serverless-http');

const app = express();

// Define a basic route
app.get('/', (req, res) => {
  res.send('Express on Vercel');
});

// Export the handler as default
module.exports = serverless(app);
