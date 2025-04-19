const app = require('../server');  // Import your main Express app
const serverless = require('serverless-http');  // Import serverless-http

module.exports.handler = serverless(app);  // Export the handler for Vercel to invoke
