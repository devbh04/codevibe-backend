const express = require('express');
const userRouter = express.Router();
const User = require('../models/User');
const Contest = require('../models/ContestDB');
const DiscussionPost = require('../models/DiscussionPost');
const { default: mongoose } = require('mongoose');

// Get all user activity by user ID
// Get all user activity by user ID
userRouter.get('/:userId/activity', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Find user with all activity
    const user = await User.findById(userId)
      .select('contests discussions comments')
      .populate({
        path: 'discussions.postId',
        select: 'title description'
      })
      .populate({
        path: 'comments.postId',  // Populate the post reference in comments
        select: 'title'          // Only get the title
      });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get contest details
    const contestsWithDetails = await Promise.all(
      user.contests.map(async (submission) => {
        const contest = await Contest.findById(submission.contestId)
          .select('title company reward shortDescription difficulty');
        return {
          ...submission.toObject(),
          title: contest?.title,
          company: contest?.company,
          reward: contest?.reward,
          shortDescription: contest?.shortDescription,
          difficulty: contest?.difficulty
        };
      })
    );

    // Format discussions
    const formattedDiscussions = user.discussions.map(d => ({
      postId: d.postId?._id || d.postId,
      title: d.postId?.title || 'Deleted Post',
      description: d.postId?.description || '',
      createdAt: d.createdAt
    }));

    // Format comments - now with actual post titles
    const formattedComments = user.comments.map(c => ({
      _id: c._id,
      text: c.text,
      postId: c.postId,
      createdAt: c.createdAt,
      postTitle: c.postId?.title || c.postTitle || 'Discussion Post' // Use actual title if available
    }));

    res.json({
      contests: contestsWithDetails.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
      discussions: formattedDiscussions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      comments: formattedComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
});

module.exports = userRouter;