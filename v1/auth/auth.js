const express = require('express');
const authRouter = express.Router();
const User = require('../models/User'); // We'll create this model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Login route
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email)
    console.log(password)

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      'JWT_SECRET',
      { expiresIn: '1h' }
    );

    // Return user data (excluding password) and token
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      postsCreated: user.postsCreated,
      problemsSolved: user.problemsSolved,
      commentsCreated: user.commentsCreated
    };

    res.status(200).json({ token, user: userData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Signup route
authRouter.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log(name)
    console.log(email)
    console.log(password)

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      postsCreated: [],
      problemsSolved: [],
      commentsCreated: []
    });

    await newUser.save();

    // Create JWT token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      'JWT_SECRET',
      { expiresIn: '1h' }
    );

    // Return user data (excluding password) and token
    const userData = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      postsCreated: newUser.postsCreated,
      problemsSolved: newUser.problemsSolved,
      commentsCreated: newUser.commentsCreated
    };

    res.status(201).json({ token, user: userData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = authRouter;