const express = require('express');
const serverless = require('serverless-http');

const app = express();

// Define routes
app.get('/', (req, res) => {
  res.send('Express on Vercel');
});

// Serverless handler for Vercel
module.exports.handler = serverless(app);
