const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET: Fetch recent messages (excluding those deleted for everyone, or deleted for the requester)
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query; // Client passes its unique userId
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const messages = await Message.find({
      isDeletedForEveryone: false,
      deletedFor: { $ne: userId }
    })
    .sort({ timestamp: 1 }) // oldest first to render chat
    .limit(150); // Hard constraint avoiding massive queries

    // Normalize response for frontend
    const cleanedMessages = messages.map(msg => ({
      ...msg.toObject(),
      // Redact text if it's somehow missing or just a safety measure
      text: msg.text
    }));

    res.json(cleanedMessages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST: Create a new message
router.post('/', async (req, res) => {
  try {
    const { text, senderId, username } = req.body;
    
    // Strict Input Validation
    if (!text || !senderId || !username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Sanitize string content
    const sanitizedText = text.trim();
    const sanitizedUsername = username.trim();

    if (sanitizedText.length === 0 || sanitizedText.length > 2000) {
      return res.status(400).json({ error: 'Invalid text length' });
    }
    if (sanitizedUsername.length === 0 || sanitizedUsername.length > 50) {
      return res.status(400).json({ error: 'Invalid username length' });
    }

    const newMessage = new Message({
      text: sanitizedText,
      senderId,
      username: sanitizedUsername
    });

    const savedMessage = await newMessage.save();

    // Broadcast via Socket.IO
    const io = req.app.get('io');
    io.emit('newMessage', savedMessage);

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH: Toggle pin status of a message
router.patch('/:id/pin', async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    // Broadcast via Socket.IO
    req.app.get('io').emit('messageUpdated', message);

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE: Handle Delete for Me / Delete for Everyone
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { target, userId } = req.query; // target = 'me' | 'everyone'

    if (!['me', 'everyone'].includes(target) || !userId) {
      return res.status(400).json({ error: 'Invalid query parameters' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (target === 'everyone') {
      // Must verify sender is the one deleting? The prompt specifies "Delete for Everyone"
      // Assuming authorization here requires senderId === userId unless it's an admin (no admin in reqs).
      if (message.senderId !== userId) {
        return res.status(403).json({ error: 'Cannot delete for everyone if you are not the sender.' });
      }
      
      message.isDeletedForEveryone = true;
      // We could also overwrite the text string to just "[Deleted message]" in the database to be safe.
      message.text = "This message was deleted.";
      await message.save();
      
      req.app.get('io').emit('messageDeleted', { id, target: 'everyone' });

    } else if (target === 'me') {
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
        await message.save();
      }
      // No server-wide broadcast needed for 'me', maybe just acknowledge success
    }

    res.json({ success: true, message: 'Message updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
