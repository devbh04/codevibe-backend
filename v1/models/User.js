// models/User.js
const mongoose = require('mongoose');

const contestEntrySchema = new mongoose.Schema({
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest' },
  submittedAt: { type: Date, default: Date.now },
  code: String,
  language: String,
  successful: String,
});

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiscussionPost',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const discussionSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiscussionPost',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  postCreated: { type: Number, default: 0 },
  contestCreated: { type: Number, default: 0 },
  commentCreated: { type: Number, default: 0 },
  contests: [contestEntrySchema],
  discussions: [discussionSchema],
  comments: [commentSchema]
});

module.exports = mongoose.model('User', userSchema);