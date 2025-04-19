require('dotenv').config({ path: './.env' });
const express = require('express');

const app = express();

// A simple test route
app.get('/', (req, res) => {
  res.send('Hello, Vercel!');
});

module.exports = app;
