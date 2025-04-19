const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const serverless = require('serverless-http');
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

const v1Router = require('../v1/v1');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

let isConnected = false;
async function connectToDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}

// Ensure DB connection before each request
app.use(async (req, res, next) => {
  await connectToDB();
  next();
});

app.use('/api/v1', v1Router);

app.get('/', (req, res) => {
  res.json({ message: 'Backend root working 🚀' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Export as serverless function
module.exports = serverless(app);
