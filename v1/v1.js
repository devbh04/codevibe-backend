const express = require('express');
const discussionRouter = require('./discussion/discussion');
const contestRouter = require('./contest/contest');
const geminiRouter = require('./gemini/gemini');
const authRouter = require('./auth/auth');
const userRouter = require('./users/users');

const v1Router = express.Router();

// Middleware specific to v1
v1Router.use((req, res, next) => {
  console.log('API Version 1 request');
  next();
});

// Routes for v1
v1Router.use('/discussion', discussionRouter);
v1Router.use('/contests', contestRouter); // Add contest routes
v1Router.use('/gemini', geminiRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/users', userRouter);

// Health check endpoint
v1Router.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: 'v1' });
});

module.exports = v1Router;