const db = require('../config/db');

/**
 * Upload study material for a course (Teacher or Admin)
 */
async function uploadMaterial(req, res) {
  try {
    const { course_id, title, description } = req.body;

    if (!course_id || !title) {
      return res.status(400).json({ success: false, message: 'course_id and title are required.' });
    }

    let fileUrl = '';
    let fileSize = 0;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileSize = req.file.size;
    } else if (req.body.file_url) {
      fileUrl = req.body.file_url;
    } else {
      fileUrl = '/uploads/sample_material.pdf';
    }

    const [result] = await db.query(
      'INSERT INTO materials (course_id, title, description, file_url, file_size) VALUES (?, ?, ?, ?, ?)',
      [course_id, title, description || '', fileUrl, fileSize]
    );

    return res.status(201).json({
      success: true,
      message: 'Study material uploaded successfully.',
      materialId: result.insertId,
      file_url: fileUrl
    });
  } catch (err) {
    console.error('Upload material error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload material.' });
  }
}

/**
 * Get materials for a course
 */
async function getCourseMaterials(req, res) {
  try {
    const courseId = req.params.courseId;

    const [materials] = await db.query(
      'SELECT * FROM materials WHERE course_id = ? ORDER BY uploaded_date DESC',
      [courseId]
    );

    return res.json({ success: true, materials: materials || [] });
  } catch (err) {
    console.error('Get materials error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve materials.' });
  }
}

/**
 * Delete a study material
 */
async function deleteMaterial(req, res) {
  try {
    const materialId = req.params.id;
    await db.query('DELETE FROM materials WHERE id = ?', [materialId]);
    return res.json({ success: true, message: 'Material deleted successfully.' });
  } catch (err) {
    console.error('Delete material error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete material.' });
  }
}

module.exports = {
  uploadMaterial,
  getCourseMaterials,
  deleteMaterial
};
