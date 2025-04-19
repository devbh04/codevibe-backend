const app = require('../server');  // Import the main app
const express = require('express');
const serverless = require('serverless-http');  // Import serverless-http to wrap Express app for serverless

module.exports.handler = serverless(app);  // Wrap the Express app with serverless
