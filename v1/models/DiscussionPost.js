const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    ref: 'DiscussionPost'
  },
  name: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const discussionPostSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  comments: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }]
});

// Create models
const DiscussionPost = mongoose.model('DiscussionPost', discussionPostSchema);
const Comment = mongoose.model('Comment', commentSchema);

// Export both models
module.exports = {
  DiscussionPost,
  Comment
};