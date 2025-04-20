const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  postCreated: { type: Number, default: 0 },
  contestCreated: { type: Number, default: 0 },
  commentCreated: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);
