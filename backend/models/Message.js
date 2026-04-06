const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  senderId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    maxlength: 50,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isDeletedForEveryone: {
    type: Boolean,
    default: false,
  },
  deletedFor: {
    type: [String],
    default: [],
  },
  isPinned: {
    type: Boolean,
    default: false,
  }
});

module.exports = mongoose.model('Message', messageSchema);
