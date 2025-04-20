const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  postsCreated: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Post',
    default: []
  },
  problemsSolved: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Problem',
    default: []
  },
  commentsCreated: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Comment',
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);