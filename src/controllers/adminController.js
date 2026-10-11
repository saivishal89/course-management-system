const bcrypt = require('bcryptjs');
const db = require('../config/db');

/**
 * Get institutional statistics for the Admin Dashboard
 */
async function getStats(req, res) {
  try {
    const [[studentsRow]] = await db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'STUDENT'");
    const [[teachersRow]] = await db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'TEACHER'");
    const [[coursesRow]] = await db.query("SELECT COUNT(*) AS count FROM courses");
    const [[enrollmentsRow]] = await db.query("SELECT COUNT(*) AS count FROM enrollments WHERE status = 'ACTIVE'");
    const [[submissionsRow]] = await db.query("SELECT COUNT(*) AS count FROM submissions");

    return res.json({
      success: true,
      stats: {
        students: studentsRow ? studentsRow.count : 0,
        teachers: teachersRow ? teachersRow.count : 0,
        courses: coursesRow ? coursesRow.count : 0,
        enrollments: enrollmentsRow ? enrollmentsRow.count : 0,
        submissions: submissionsRow ? submissionsRow.count : 0
      }
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve system statistics.' });
  }
}

/**
 * Get list of all users
 */
async function getAllUsers(req, res) {
  try {
    const { role } = req.query;
    let sql = 'SELECT id, name, email, role, created_at FROM users';
    const params = [];

    if (role) {
      sql += ' WHERE role = ?';
      params.push(role.toUpperCase());
    }

    sql += ' ORDER BY id DESC';

    const [users] = await db.query(sql, params);
    return res.json({ success: true, users: users || [] });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
}

/**
 * Admin creates a user (Teacher, Student, or Admin)
 */
async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role.toUpperCase()]
    );

    return res.status(201).json({
      success: true,
      message: `User created with role ${role.toUpperCase()}.`,
      userId: result.insertId
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
}

/**
 * Delete a user
 */
async function deleteUser(req, res) {
  try {
    const userId = req.params.id;

    // Prevent deleting oneself
    if (req.user.id === parseInt(userId, 10)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
}

module.exports = {
  getStats,
  getAllUsers,
  createUser,
  deleteUser
};
