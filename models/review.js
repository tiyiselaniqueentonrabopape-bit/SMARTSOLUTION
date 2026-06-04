const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  text: {
    type: String,
    required: [true, 'Review text is required'],
    minlength: [5, 'Review must be at least 5 characters']
  },
  date: {
    type: Date,
    default: Date.now
  }
},{ timestamps: true });
module.exports = mongoose.model('review', reviewSchema);