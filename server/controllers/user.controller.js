
const { query } = require('../config/database');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await query(
      'SELECT id, name, email, phone, role, status, last_seen FROM users WHERE id != ?',
      [req.user.id]
    );

    res.status(200).json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const users = await query(
      'SELECT id, name, email, phone, role, status, last_seen FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: ' The user is not found' });
    }

    res.status(200).json({ user: users[0] });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    // Check if trying to update another user
    if (req.params.id != req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    // Check if user exists
    const users = await query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user
    await query(
      'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
      [name, email, phone, req.params.id]
    );

    res.status(200).json({ message: 'User details updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Check if user exists
    const users = await query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user
    await query('DELETE FROM users WHERE id = ?', [req.params.id]);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
