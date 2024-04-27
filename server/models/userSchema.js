const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerk_id: {
    type: String,
    required: true,
    alias: 'clerkUserId'
  },
  access_token: {
    type: Array,
    default: []
  },
  items: {
    type: Array,
    default: []
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;