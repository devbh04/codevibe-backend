const express = require('express');
const discussionRouter = express.Router();
const { DiscussionPost, Comment } = require('../models/DiscussionPost');

// Get all discussion posts
discussionRouter.get('/', async (req, res) => {
  try {
    const posts = await DiscussionPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch posts', 
      error: error.message 
    });
  }
});

// Create a new discussion post
discussionRouter.post('/', async (req, res) => {
  try {
    const { name, title, description } = req.body;
    const newPost = new DiscussionPost({ name, title, description });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create post', 
      error: error.message 
    });
  }
});

// Get comments for a specific post
discussionRouter.get('/:postId/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch comments',
      error: error.message 
    });
  }
});

// Add a comment to a post
discussionRouter.post('/:postId/comments', async (req, res) => {
  try {
    const { name, text } = req.body;
    const postId = req.params.postId;

    // Verify post exists
    const postExists = await DiscussionPost.findById(postId);
    if (!postExists) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Create and save comment
    const newComment = new Comment({ postId, name, text });
    const savedComment = await newComment.save();

    // Update post's comments array
    await DiscussionPost.findByIdAndUpdate(
      postId,
      { $push: { comments: savedComment._id } }
    );

    res.status(201).json(savedComment);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to add comment',
      error: error.message 
    });
  }
});

module.exports = discussionRouter;