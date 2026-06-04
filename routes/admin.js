const express = require('express');
const router = express.Router();

const { protect, adminOnly } = require('../middleware/auth');

const User = require('../models/User');
const Review = require('../models/Review');
const Message = require('../models/Message');
const Request = require('../models/Request');


// ======================================================
// TEST ROUTE
// ======================================================
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Admin API working'
  });
});


// ======================================================
// ADMIN STATS
// ======================================================
// TEMPORARILY REMOVED protect + adminOnly
// so dashboard can work while testing
// ======================================================

router.get('/stats', async (req, res) => {
  try {

    const totalUsers = await User.countDocuments({ role: 'user' });

    const totalReviews = await Review.countDocuments();

    const totalMessages = await Message.countDocuments();

    const totalRequests = await Request.countDocuments();

    const pendingRequests = await Request.countDocuments({
      status: 'pending'
    });

    const completedRequests = await Request.countDocuments({
      status: 'completed'
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalReviews,
        totalMessages,
        totalRequests,
        pendingRequests,
        completedRequests
      }
    });

  } catch (error) {

    console.error('ADMIN STATS ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Server error loading admin stats'
    });

  }
});


// ======================================================
// GET ALL USERS
// ======================================================
router.get('/users', async (req, res) => {
  try {

    const users = await User.find().select('-password');

    res.json({
      success: true,
      users
    });

  } catch (error) {

    console.error('USERS ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to load users'
    });

  }
});


// ======================================================
// GET ALL REQUESTS
// ======================================================
router.get('/requests', async (req, res) => {
  try {

    const requests = await Request.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      requests
    });

  } catch (error) {

    console.error('REQUESTS ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to load requests'
    });

  }
});


// ======================================================
// GET ALL REVIEWS
// ======================================================
router.get('/reviews', async (req, res) => {
  try {

    const reviews = await Review.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews
    });

  } catch (error) {

    console.error('REVIEWS ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to load reviews'
    });

  }
});


// ======================================================
// GET ALL MESSAGES
// ======================================================
router.get('/messages', async (req, res) => {
  try {

    const messages = await Message.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      messages
    });

  } catch (error) {

    console.error('MESSAGES ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to load messages'
    });

  }
});


// ======================================================
// SEED DATABASE
// ======================================================
router.post('/seed', async (req, res) => {
  try {

    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      return res.json({
        success: false,
        message: 'Database already seeded'
      });
    }

    // SAMPLE USERS
    const user1 = await User.create({
      username: 'johndoe',
      email: 'john@example.com',
      phone: '+27 82 123 4567',
      password: 'password123',
      role: 'user'
    });

    const user2 = await User.create({
      username: 'sarahsmith',
      email: 'sarah@example.com',
      phone: '+27 83 987 6543',
      password: 'password123',
      role: 'user'
    });

    // SAMPLE REVIEWS
    await Review.create([
      {
        userId: user1._id,
        username: 'johndoe',
        rating: 5,
        text: 'Excellent service!'
      },
      {
        userId: user2._id,
        username: 'sarahsmith',
        rating: 5,
        text: 'Very professional electrical work.'
      }
    ]);

    // SAMPLE MESSAGES
    await Message.create([
      {
        name: 'Peter Clark',
        email: 'peter@example.com',
        phone: '+27 84 111 2222',
        service: 'Solar Systems',
        message: 'Need a quote for solar installation.'
      }
    ]);

    // SAMPLE REQUESTS
    await Request.create([
      {
        userId: user1._id,
        username: 'johndoe',
        service: 'Solar Installation',
        status: 'completed',
        notes: 'Completed successfully'
      }
    ]);

    res.json({
      success: true,
      message: 'Database seeded successfully'
    });

  } catch (error) {

    console.error('SEED ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Error seeding database'
    });

  }
});


module.exports = router;