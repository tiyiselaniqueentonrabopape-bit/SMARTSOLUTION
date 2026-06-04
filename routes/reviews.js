const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Review = require('../models/Review');

// @route   GET /api/reviews
// @desc    Get all reviews
// @access  Public
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ date: -1 });
    
    // Calculate average rating
    const total = reviews.length;
    const avg = total > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : '0.0';
    
    // Calculate rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (distribution[r.rating] !== undefined) distribution[r.rating]++;
    });
    
    res.json({
      success: true,
      count: total,
      average: parseFloat(avg),
      distribution,
      reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { rating, text } = req.body;
    
    if (!rating || !text) {
      return res.status(400).json({ success: false, message: 'Rating and text are required' });
    }
    
    const review = await Review.create({
      userId: req.user._id,
      username: req.user.username,
      rating: parseInt(rating),
      text
    });
    
    res.status(201).json({ success: true, message: 'Review added', review });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review (admin only)
// @access  Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;