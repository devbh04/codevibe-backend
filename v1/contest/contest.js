const express = require('express');
const contestRouter = express.Router();
const Contest = require('../models/ContestDB');
const User = require('../models/User');

// Create a new contest
contestRouter.post('/', async (req, res) => {
  try {
    const {
      title,
      company,
      reward,
      shortDescription,
      problemExplanation,
      difficulty,
      contestDate,
      testCases,
      examples,
      key
    } = req.body;

    const contest = new Contest({
      title,
      company,
      reward,
      shortDescription,
      problemExplanation,
      difficulty,
      contestDate: new Date(contestDate),
      testCases,
      examples,
      key,
      createdBy:'anonymous' // Add proper auth later
    });

    const createdContest = await contest.save();
    res.status(201).json(createdContest);
  } catch (error) {
    res.status(400).json({
      message: 'Failed to create contest',
      error: error.message
    });
  }
});

// Get all contests
contestRouter.get('/', async (req, res) => {
  try {
    const contests = await Contest.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email'); // Populate user details if needed
    
    res.json(contests);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch contests',
      error: error.message
    });
  }
});

// Get single contest by ID
contestRouter.get('/:id', async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id);
        if (!contest) {
        return res.status(404).json({ message: 'Contest not found' });
        }
        res.json({
        _id: contest._id,
        title: contest.title,
        company: contest.company,
        reward: contest.reward,
        shortDescription: contest.shortDescription,
        problemExplanation: contest.problemExplanation,
        difficulty: contest.difficulty,
        contestDate: contest.contestDate,
        testCases: contest.testCases,
        examples: contest.examples,
        key: contest.key,
        createdAt: contest.createdAt
        });
    } catch (error) {
        res.status(500).json({
        message: 'Failed to fetch contest',
        error: error.message
        });
    }
});

contestRouter.post('/submit', async (req, res) => {
  try {
    const { contestId, code, language, successful, userId } = req.body;
    
    // Verify contest exists
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const submissionData = {
      code,
      language,
      successful: successful === 'yes',
      submittedAt: new Date()
    };

    // Check if user already has a submission for this contest
    const existingSubmissionIndex = user.contests.findIndex(
      sub => sub.contestId.toString() === contestId
    );

    let update;
    if (existingSubmissionIndex >= 0) {
      // Update existing submission
      update = {
        $set: {
          [`contests.${existingSubmissionIndex}`]: {
            contestId,
            ...submissionData
          }
        }
      };
    } else {
      // Add new submission
      update = {
        $push: {
          contests: {
            contestId,
            ...submissionData
          }
        }
      };
    }

    // Update user's contests
    await User.findByIdAndUpdate(
      userId,
      update,
      { new: true }
    );

    res.json({
      message: 'Contest submitted successfully',
      contest: {
        title: contest.title,
        company: contest.company,
        successful: submissionData.successful,
        submittedAt: submissionData.submittedAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: 'Server error',
      details: err.message 
    });
  }
});


module.exports = contestRouter;