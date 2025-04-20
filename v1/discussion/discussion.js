const express = require('express');
const discussionRouter = express.Router();
const { DiscussionPost, Comment } = require('../models/DiscussionPost');
const User = require('../models/User');

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
    const { name, title, description, userId } = req.body;

    // Validate required fields
    if (!name || !title || !description || !userId) {
      return res.status(400).json({ 
        message: 'Missing required fields (name, title, description, userId)' 
      });
    }

    // Verify user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new post
    const newPost = new DiscussionPost({
      name,
      title,
      description,
      userId
    });

    const savedPost = await newPost.save();

    // Update user's discussions
    await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          discussions: {
            postId: savedPost._id,
            title: savedPost.title,
            createdAt: savedPost.createdAt
          }
        },
        $inc: { postCreated: 1 }
      },
      { new: true }
    );

    res.status(201).json(savedPost);
  } catch (error) {
    console.error('Error creating discussion post:', error);
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
    const { name, text, userId, postTitle } = req.body;
    const postId = req.params.postId;

    // Verify post exists
    const postExists = await DiscussionPost.findById(postId);
    if (!postExists) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create and save comment
    const newComment = new Comment({ postId, name, text, postTitle });
    const savedComment = await newComment.save();

    // Update post's comments array
    await DiscussionPost.findByIdAndUpdate(
      postId,
      { $push: { comments: savedComment._id } }
    );

    // Update user's comments array
    await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          comments: {
            postId,
            text,
            postTitle,
            createdAt: savedComment.createdAt
          }
        },
        $inc: { commentCreated: 1 }
      }
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