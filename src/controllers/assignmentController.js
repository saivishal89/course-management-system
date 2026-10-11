const db = require('../config/db');

/**
 * Create a new assignment (Teacher or Admin)
 */
async function createAssignment(req, res) {
  try {
    const { course_id, title, description, due_date, max_marks } = req.body;

    if (!course_id || !title || !due_date) {
      return res.status(400).json({ success: false, message: 'course_id, title, and due_date are required.' });
    }

    const [result] = await db.query(
      'INSERT INTO assignments (course_id, title, description, due_date, max_marks) VALUES (?, ?, ?, ?, ?)',
      [course_id, title, description || '', due_date, parseInt(max_marks, 10) || 100]
    );

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully.',
      assignmentId: result.insertId
    });
  } catch (err) {
    console.error('Create assignment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create assignment.' });
  }
}

/**
 * Get assignments for a course
 */
async function getCourseAssignments(req, res) {
  try {
    const courseId = req.params.courseId;

    const [assignments] = await db.query(
      'SELECT * FROM assignments WHERE course_id = ? ORDER BY due_date ASC',
      [courseId]
    );

    let list = assignments || [];

    // If student, attach submission status
    if (req.user && req.user.role === 'STUDENT') {
      const [submissions] = await db.query(
        'SELECT * FROM submissions WHERE student_id = ?',
        [req.user.id]
      );
      const subMap = new Map((submissions || []).map(s => [s.assignment_id, s]));
      list = list.map(a => {
        const sub = subMap.get(a.id);
        return {
          ...a,
          submitted: !!sub,
          submission: sub || null
        };
      });
    }

    return res.json({ success: true, assignments: list });
  } catch (err) {
    console.error('Get assignments error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve assignments.' });
  }
}

/**
 * Student submits an assignment (File upload and/or text note)
 */
async function submitAssignment(req, res) {
  try {
    const studentId = req.user.id;
    const assignmentId = req.params.id;
    const { submission_text } = req.body;

    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.file_url) {
      fileUrl = req.body.file_url;
    }

    // Check if assignment exists
    const [assignments] = await db.query('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
    if (!assignments || assignments.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const assignment = assignments[0];
    const isLate = new Date() > new Date(assignment.due_date);
    const status = isLate ? 'LATE' : 'SUBMITTED';

    // Check if already submitted
    const [existing] = await db.query(
      'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?',
      [assignmentId, studentId]
    );

    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, message: 'You have already submitted this assignment.' });
    }

    await db.query(
      'INSERT INTO submissions (assignment_id, student_id, file_url, submission_text, status) VALUES (?, ?, ?, ?, ?)',
      [assignmentId, studentId, fileUrl, submission_text || '', status]
    );

    return res.status(201).json({
      success: true,
      message: isLate ? 'Assignment submitted (Late).' : 'Assignment submitted successfully.'
    });
  } catch (err) {
    console.error('Submit assignment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit assignment.' });
  }
}

/**
 * Get all student submissions for an assignment (Teacher or Admin)
 */
async function getAssignmentSubmissions(req, res) {
  try {
    const assignmentId = req.params.id;

    const [submissions] = await db.query(`
      SELECT 
        s.*,
        u.name AS student_name, u.email AS student_email,
        a.title AS assignment_title, a.max_marks,
        c.course_name
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE s.assignment_id = ?
      ORDER BY s.submitted_date DESC
    `, [assignmentId]);

    return res.json({ success: true, submissions: submissions || [] });
  } catch (err) {
    console.error('Get submissions error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve submissions.' });
  }
}

/**
 * Grade a student submission (Teacher or Admin)
 */
async function gradeSubmission(req, res) {
  try {
    const submissionId = req.params.submissionId;
    const { marks, feedback } = req.body;

    if (marks === undefined || marks === null) {
      return res.status(400).json({ success: false, message: 'Marks are required.' });
    }

    await db.query(
      'UPDATE submissions SET marks = ?, feedback = ?, status = "GRADED" WHERE id = ?',
      [parseInt(marks, 10), feedback || '', 'GRADED', submissionId]
    );

    return res.json({ success: true, message: 'Submission graded successfully.' });
  } catch (err) {
    console.error('Grade submission error:', err);
    return res.status(500).json({ success: false, message: 'Failed to grade submission.' });
  }
}

/**
 * Get all submissions & grades for logged in student
 */
async function getMyGrades(req, res) {
  try {
    const studentId = req.user.id;

    const [rows] = await db.query(`
      SELECT 
        s.*,
        a.title AS assignment_title, a.max_marks, a.due_date,
        c.id AS course_id, c.course_name, c.course_code
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE s.student_id = ?
      ORDER BY s.submitted_date DESC
    `, [studentId]);

    return res.json({ success: true, grades: rows || [] });
  } catch (err) {
    console.error('Get my grades error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve grades.' });
  }
}

module.exports = {
  createAssignment,
  getCourseAssignments,
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  getMyGrades
};
