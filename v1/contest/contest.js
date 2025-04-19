const express = require('express');
const contestRouter = express.Router();
const Contest = require('../models/ContestDB');

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

module.exports = contestRouter;