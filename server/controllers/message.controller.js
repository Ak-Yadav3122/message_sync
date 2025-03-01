
const { query } = require('../config/database');


exports.getMessages = async (req, res) => {
  try {
    const messages = await query(
      'SELECT m.*, u.name as sender_name FROM messages m ' +
      'JOIN users u ON m.sender_id = u.id ' +
      'WHERE m.receiver_id = ? ' +
      'ORDER BY m.created_at DESC',
      [req.user.id]
    );

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.sendMessage = async (req, res) => {
  try {
    const { receiver_id, content } = req.body;

    // Check if receiver exists
    const users = await query('SELECT * FROM users WHERE id = ?', [receiver_id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Create message
    const result = await query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [req.user.id, receiver_id, content]
    );

    // Get the created message with sender info
    const messages = await query(
      'SELECT m.*, u.name as sender_name FROM messages m ' +
      'JOIN users u ON m.sender_id = u.id ' +
      'WHERE m.id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Message sent successfully',
      data: messages[0]
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getConversation = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if user exists
    const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get messages between users
    const messages = await query(
      'SELECT m.*, sender.name as sender_name, receiver.name as receiver_name ' +
      'FROM messages m ' +
      'JOIN users sender ON m.sender_id = sender.id ' +
      'JOIN users receiver ON m.receiver_id = receiver.id ' +
      'WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?) ' +
      'ORDER BY m.created_at ASC',
      [req.user.id, userId, userId, req.user.id]
    );

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
