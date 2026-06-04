const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Message = require('../models/Message');

// @route   POST /api/messages
// @desc    Create a contact message
// @access  Public
router.post('/', async (req, res) => {
  try {
    console.log("📩 BODY:", req.body); // 🔍 DEBUG

    const { name, email, phone, service, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and message are required'
      });
    }

    // 🔥 IMPORTANT FIX (supports both message OR notes in schema)
    const newMessage = await Message.create({
      name,
      email,
      phone: phone || '',
      service: service || '',
      message: message,   // if your schema uses "message"
      notes: message      // if your schema uses "notes"
    });
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });

  } catch (error) {
    console.error("❌ MESSAGE ERROR:", error); // 🔥 NOW YOU WILL SEE REAL ERROR
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// @route   GET /api/messages (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    console.error("❌ FETCH ERROR:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// @route   DELETE /api/messages/:id (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.deleteOne();

    res.json({
      success: true,
      message: 'Message deleted'
    });

  } catch (error) {
    console.error("❌ DELETE ERROR:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;