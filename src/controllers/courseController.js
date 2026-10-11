const db = require('../config/db');

/**
 * Get all courses with teacher details and student enrollment count
 */
async function getAllCourses(req, res) {
  try {
    const { teacher_id } = req.query;
    let sql = `
      SELECT 
        c.id, c.course_name, c.course_code, c.description, c.duration, c.teacher_id, c.created_at,
        u.name AS teacher_name, u.email AS teacher_email,
        COUNT(DISTINCT e.id) AS enrolled_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'ACTIVE'
    `;
    const params = [];

    if (teacher_id) {
      sql += ' WHERE c.teacher_id = ?';
      params.push(teacher_id);
    }

    sql += ' GROUP BY c.id ORDER BY c.id DESC';

    const [courses] = await db.query(sql, params);

    // If user is a student, attach enrollment status
    if (req.user && req.user.role === 'STUDENT') {
      const [myEnrollments] = await db.query(
        'SELECT course_id FROM enrollments WHERE student_id = ? AND status = "ACTIVE"',
        [req.user.id]
      );
      const enrolledSet = new Set((myEnrollments || []).map(e => e.course_id));
      const augmented = (courses || []).map(c => ({
        ...c,
        is_enrolled: enrolledSet.has(c.id)
      }));
      return res.json({ success: true, courses: augmented });
    }

    return res.json({ success: true, courses: courses || [] });
  } catch (err) {
    console.error('Error fetching courses:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve courses.' });
  }
}

/**
 * Get single course by ID with materials, assignments, and enrollment details
 */
async function getCourseById(req, res) {
  try {
    const courseId = req.params.id;

    const [courseRows] = await db.query(
      `SELECT c.*, u.name AS teacher_name, u.email AS teacher_email
       FROM courses c
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE c.id = ?`,
      [courseId]
    );

    if (!courseRows || courseRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const course = courseRows[0];

    // Fetch materials
    const [materials] = await db.query(
      'SELECT * FROM materials WHERE course_id = ? ORDER BY id DESC',
      [courseId]
    );

    // Fetch assignments
    const [assignments] = await db.query(
      'SELECT * FROM assignments WHERE course_id = ? ORDER BY id DESC',
      [courseId]
    );

    // If student, attach submission status for each assignment
    let assignmentsWithStatus = assignments || [];
    if (req.user && req.user.role === 'STUDENT') {
      const [submissions] = await db.query(
        'SELECT assignment_id, marks, status, file_url, submitted_date FROM submissions WHERE student_id = ?',
        [req.user.id]
      );
      const subMap = new Map((submissions || []).map(s => [s.assignment_id, s]));
      assignmentsWithStatus = assignmentsWithStatus.map(a => {
        const sub = subMap.get(a.id);
        return {
          ...a,
          submitted: !!sub,
          submission: sub || null
        };
      });
    }

    return res.json({
      success: true,
      course: {
        ...course,
        materials: materials || [],
        assignments: assignmentsWithStatus
      }
    });
  } catch (err) {
    console.error('Error fetching course details:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve course details.' });
  }
}

/**
 * Create a new course (Admin or Teacher)
 */
async function createCourse(req, res) {
  try {
    const { course_name, course_code, description, duration, teacher_id } = req.body;

    if (!course_name || !course_code) {
      return res.status(400).json({ success: false, message: 'Course name and code are required.' });
    }

    // Determine teacher ID (if user is teacher, default to them)
    let assignedTeacherId = teacher_id || null;
    if (req.user.role === 'TEACHER') {
      assignedTeacherId = req.user.id;
    }

    const [result] = await db.query(
      'INSERT INTO courses (course_name, course_code, description, duration, teacher_id) VALUES (?, ?, ?, ?, ?)',
      [course_name, course_code, description || '', duration || '12 Weeks', assignedTeacherId]
    );

    return res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      courseId: result.insertId
    });
  } catch (err) {
    console.error('Error creating course:', err);
    return res.status(500).json({ success: false, message: 'Failed to create course. Code might already exist.' });
  }
}

/**
 * Update course details
 */
async function updateCourse(req, res) {
  try {
    const courseId = req.params.id;
    const { course_name, description, duration, teacher_id } = req.body;

    // Check if authorized
    const [existing] = await db.query('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (req.user.role === 'TEACHER' && existing[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only edit courses assigned to you.' });
    }

    const assignedTeacher = req.user.role === 'ADMIN' ? (teacher_id || existing[0].teacher_id) : existing[0].teacher_id;

    await db.query(
      'UPDATE courses SET course_name = ?, description = ?, duration = ?, teacher_id = ? WHERE id = ?',
      [course_name || existing[0].course_name, description || existing[0].description, duration || existing[0].duration, assignedTeacher, courseId]
    );

    return res.json({ success: true, message: 'Course updated successfully.' });
  } catch (err) {
    console.error('Error updating course:', err);
    return res.status(500).json({ success: false, message: 'Failed to update course.' });
  }
}

/**
 * Delete a course (Admin only)
 */
async function deleteCourse(req, res) {
  try {
    const courseId = req.params.id;
    await db.query('DELETE FROM courses WHERE id = ?', [courseId]);
    return res.json({ success: true, message: 'Course deleted successfully.' });
  } catch (err) {
    console.error('Error deleting course:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete course.' });
  }
}

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};
