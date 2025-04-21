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

    // Update user's comments array - now including the comment ID
    await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          comments: {
            _id: savedComment._id, // Store the comment's own ID
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
// Add these new routes to your discussionRouter

// Delete a discussion post
discussionRouter.delete('/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;

    // 1. First find the post to get its comments
    const post = await DiscussionPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // 2. Get all comment IDs from this post
    const commentIds = post.comments || [];

    // 3. Delete the post
    await DiscussionPost.findByIdAndDelete(postId);

    // 4. Delete all comments associated with this post
    await Comment.deleteMany({ _id: { $in: commentIds } });

    // 5. Remove comments from users' comments arrays
    await User.updateMany(
      { 'comments.postId': postId },
      { $pull: { comments: { postId } } }
    );

    // 6. Remove from user's discussions
    await User.updateMany(
      { 'discussions.postId': postId },
      { $pull: { discussions: { postId } } }
    );

    res.json({ message: 'Discussion and associated comments deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete discussion',
      error: error.message
    });
  }
});

// Update the comment deletion endpoint
discussionRouter.delete('/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    // 1. First find the comment to get its postId
    const comment = await Comment.findById(commentId);
    if (!comment) {
      // Check if comment exists in any user's comments (in case post was deleted but comment reference remains)
      const userWithComment = await User.findOne({ 'comments._id': commentId });
      if (userWithComment) {
        // Clean up the orphaned comment reference
        await User.updateOne(
          { 'comments._id': commentId },
          { $pull: { comments: { _id: commentId } } }
        );
      }
      return res.status(404).json({ 
        success: false,
        message: 'Comment not found' 
      });
    }

    // 2. Delete the comment
    await Comment.findByIdAndDelete(commentId);

    // 3. Remove from DiscussionPost's comments array if post still exists
    await DiscussionPost.findByIdAndUpdate(
      comment.postId,
      { $pull: { comments: commentId } },
      { new: true }
    );

    // 4. Remove from User's comments array
    await User.updateMany(
      { 'comments._id': commentId },
      { $pull: { comments: { _id: commentId } } }
    );

    res.json({ 
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = discussionRouter;