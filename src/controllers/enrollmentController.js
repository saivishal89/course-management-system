const db = require('../config/db');

/**
 * Enroll student into a course
 */
async function enrollCourse(req, res) {
  try {
    const studentId = req.user.id;
    const { course_id } = req.body;

    if (!course_id) {
      return res.status(400).json({ success: false, message: 'course_id is required.' });
    }

    // Verify course exists
    const [courses] = await db.query('SELECT id, course_name FROM courses WHERE id = ?', [course_id]);
    if (!courses || courses.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Check if already enrolled
    const [existing] = await db.query(
      'SELECT id, status FROM enrollments WHERE student_id = ? AND course_id = ?',
      [studentId, course_id]
    );

    if (existing && existing.length > 0) {
      if (existing[0].status === 'ACTIVE') {
        return res.status(409).json({ success: false, message: 'You are already enrolled in this course.' });
      } else {
        // Re-activate
        await db.query(
          'UPDATE enrollments SET status = "ACTIVE", enrolled_date = NOW() WHERE student_id = ? AND course_id = ?',
          [studentId, course_id]
        );
        return res.json({ success: true, message: `Re-enrolled in ${courses[0].course_name} successfully.` });
      }
    }

    await db.query(
      'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [studentId, course_id]
    );

    return res.status(201).json({
      success: true,
      message: `Enrolled in ${courses[0].course_name} successfully.`
    });
  } catch (err) {
    console.error('Enrollment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to enroll in course.' });
  }
}

/**
 * Unenroll student from a course
 */
async function unenrollCourse(req, res) {
  try {
    const studentId = req.user.id;
    const courseId = req.params.courseId;

    await db.query(
      'DELETE FROM enrollments WHERE student_id = ? AND course_id = ?',
      [studentId, courseId]
    );

    return res.json({ success: true, message: 'Unenrolled from course successfully.' });
  } catch (err) {
    console.error('Unenroll error:', err);
    return res.status(500).json({ success: false, message: 'Failed to unenroll.' });
  }
}

/**
 * Get courses enrolled by the logged in student
 */
async function getMyCourses(req, res) {
  try {
    const studentId = req.user.id;

    const [rows] = await db.query(`
      SELECT 
        e.id AS enrollment_id, e.enrolled_date, e.status,
        c.id AS course_id, c.course_name, c.course_code, c.description, c.duration,
        u.name AS teacher_name, u.email AS teacher_email,
        (SELECT COUNT(*) FROM materials WHERE course_id = c.id) AS materials_count,
        (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) AS assignments_count
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE e.student_id = ? AND e.status = 'ACTIVE'
      ORDER BY e.enrolled_date DESC
    `, [studentId]);

    return res.json({ success: true, enrollments: rows || [] });
  } catch (err) {
    console.error('Get my courses error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve enrolled courses.' });
  }
}

/**
 * Get enrolled students for a specific course (Teacher or Admin)
 */
async function getCourseStudents(req, res) {
  try {
    const courseId = req.params.courseId;

    const [rows] = await db.query(`
      SELECT 
        e.id AS enrollment_id, e.enrolled_date, e.status,
        u.id AS student_id, u.name AS student_name, u.email AS student_email
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.course_id = ?
      ORDER BY u.name ASC
    `, [courseId]);

    return res.json({ success: true, students: rows || [] });
  } catch (err) {
    console.error('Get course students error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve enrolled students.' });
  }
}

module.exports = {
  enrollCourse,
  unenrollCourse,
  getMyCourses,
  getCourseStudents
};
