const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Request = require('../models/Request');

// @route   POST /api/requests
// @desc    Create a service request
// @access  Public (but auth if logged in)
router.post('/', async (req, res) => {
  try {
    console.log("BODY:", req.body); // 👈 debug

    const { name, email, phone, service, notes, userId, username } = req.body;

    if (!service) {
      return res.status(400).json({
        success: false,
        message: "Service is required"
      });
    }

    const newRequest = await Request.create({
      userId: userId || null,
      username: username || name || 'Guest',
      name: name || '',
      email: email || '',
      phone: phone || '',
      service,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Request created',
      request: newRequest
    });

  } catch (error) {
    console.error("🔥 ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/requests
// @desc    Get all requests (admin only)
// @access  Admin
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const requests = await Request.find().sort({ date: -1 });
    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/requests/my
// @desc    Get current user's requests
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const requests = await Request.find({ userId: req.user._id }).sort({ date: -1 });
    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/requests/:id/status
// @desc    Update request status (admin only)
// @access  Admin
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    res.json({ success: true, message: 'Status updated', request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/requests/:id
// @desc    Delete a request (admin only)
// @access  Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    await request.deleteOne();
    res.json({ success: true, message: 'Request deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;




const User = require('../models/User');
const Review = require('../models/Review');
const Message = require('../models/Message');

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalReviews = await Review.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalRequests = await Request.countDocuments();
    
    const pendingRequests = await Request.countDocuments({ status: 'pending' });
    const completedRequests = await Request.countDocuments({ status: 'completed' });
    
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/admin/seed
// @desc    Seed initial data (admin, sample reviews, etc.)
// @access  Public (run once)
router.post('/seed', async (req, res) => {
  try {
    // Check if admin exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.json({ success: false, message: 'Data already seeded' });
    }

    
    // Create sample users
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
    
    // Create sample reviews
    await Review.create([
      {
        userId: user1._id,
        username: 'johndoe',
        rating: 5,
        text: 'Excellent service! Tumelo and his team installed our solar system professionally. Highly recommended!'
      },
      {
        userId: user2._id,
        username: 'sarahsmith',
        rating: 5,
        text: 'Very professional electrical work. They rewired our entire house and the quality is outstanding.'
      },
      {
        userId: user1._id,
        username: 'johndoe',
        rating: 4,
        text: 'Good service, quick response time. Fixed our fault finding issue within hours.'
      },
      {
        userId: user2._id,
        username: 'sarahsmith',
        rating: 5,
        text: 'Best electricians in town! Fair pricing and excellent workmanship on our PLC panel.'
      }
    ]);
    
    // Create sample messages
    await Message.create([
      {
        name: 'Peter Clark',
        email: 'peter@example.com',
        phone: '+27 84 111 2222',
        service: 'Solar & Inverter Systems',
        message: 'I need a quote for a 5kW solar system for my home in Pretoria.'
      },
      {
        name: 'Amanda Foster',
        email: 'amanda@example.com',
        phone: '+27 85 333 4444',
        service: 'House Wiring',
        message: 'Looking to rewire my 4-bedroom house. Please contact me for a site visit.'
      }
    ]);
    
    // Create sample requests
    await Request.create([
      {
        userId: user1._id,
        username: 'johndoe',
        service: 'Solar & Inverter Systems',
        status: 'completed',
        notes: '5kW solar installation completed'
      },
      {
        userId: user2._id,
        username: 'sarahsmith',
        service: 'House Wiring',
        status: 'approved',
        notes: 'Full house rewiring scheduled'
      }
    ]);
    
    res.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ success: false, message: 'Error seeding database' });
  }
});

module.exports = router;
