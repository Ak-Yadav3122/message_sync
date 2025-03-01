
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

// Message routes
router.get('/', protect, messageController.getMessages);
router.post('/', protect, messageController.sendMessage);
router.get('/:userId', protect, messageController.getConversation);

module.exports = router;
