const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Contest = require('../models/ContestDB');
const authRouter = express.Router();
require('dotenv').config({ path: '../../.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'JWT_SECRET'; // Set securely in .env
console.log(JWT_SECRET)

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        postCreated: user.postCreated,
        contestCreated: user.contestCreated,
        commentCreated: user.commentCreated,
        contests: user.contests || [],
        discussions: user.discussions || [] // Include discussions
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

authRouter.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword,
      contests: [],
      discussions: [] // Initialize discussions array
    });
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        postCreated: user.postCreated,
        contestCreated: user.contestCreated,
        commentCreated: user.commentCreated,
        contests: user.contests,
        discussions: user.discussions // Include discussions
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

authRouter.get('/contests', async (req, res) => {
  try {
    const userId = req.user.userId; // From JWT middleware
    
    const user = await User.findById(userId).select('contests');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get contest details for each submission
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

    res.json({
      contests: contestsWithDetails.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    });
  } catch (error) {
    console.error('Error fetching user contests:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

authRouter.get('/discussions', async (req, res) => {
  try {
    const userId = req.user.userId; // From JWT middleware
    
    const user = await User.findById(userId)
      .select('discussions comments')
      .populate({
        path: 'discussions.postId',
        select: 'title description'
      });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Format discussions
    const formattedDiscussions = user.discussions.map(d => ({
      postId: d.postId._id,
      title: d.postId.title,
      description: d.postId.description,
      createdAt: d.createdAt
    }));

    // Format comments
    const formattedComments = user.comments.map(c => ({
      _id: c._id,
      text: c.text,
      postId: c.postId,
      createdAt: c.createdAt,
      postTitle: 'Discussion Post' // Can be enhanced with actual post title
    }));

    res.json({
      discussions: formattedDiscussions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      comments: formattedComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (error) {
    console.error('Error fetching user discussions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});




module.exports = authRouter;
