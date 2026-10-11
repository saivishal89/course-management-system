/**
 * EduSphere CMS - Teacher Portal Controller
 */

const TeacherView = {
  myCourses: [],
  allAssignments: [],

  async init() {
    const user = API.getUser();
    const titleEl = document.getElementById('teacherWelcomeTitle');
    if (titleEl && user) {
      titleEl.innerText = `Faculty Workspace — ${user.name}`;
    }
    await TeacherView.loadTeacherCourses();
  },

  /**
   * Load courses taught by this teacher
   */
  async loadTeacherCourses() {
    const grid = document.getElementById('teacherCoursesGrid');
    const badge = document.getElementById('teacherCourseCountBadge');
    if (!grid) return;
    grid.innerHTML = '<div class="text-muted">Loading courses...</div>';

    try {
      const user = API.getUser();
      const res = await API.getCourses(user ? user.id : null);
      TeacherView.myCourses = res.courses || [];

      if (badge) {
        badge.innerText = `${TeacherView.myCourses.length} Courses`;
      }

      if (TeacherView.myCourses.length === 0) {
        grid.innerHTML = '<div class="text-muted" style="grid-column: 1 / -1; padding: 20px;">No courses assigned to your profile yet. Click "+ Create Course" above.</div>';
        return;
      }

      grid.innerHTML = TeacherView.myCourses.map(course => `
        <div class="course-card">
          <div>
            <span class="course-code-badge">${escapeHtml(course.course_code)}</span>
            <h4 class="course-title">${escapeHtml(course.course_name)}</h4>
            <p class="course-desc">${escapeHtml(course.description || 'No description provided.')}</p>
          </div>
          <div>
            <div class="course-meta">
              <div class="course-meta-item">
                <span>Duration:</span>
                <span>${escapeHtml(course.duration)}</span>
              </div>
              <div class="course-meta-item">
                <span>Enrolled Students:</span>
                <strong>${course.enrolled_count || 0} students</strong>
              </div>
            </div>
            <div class="course-card-actions">
              <button class="btn-outline" onclick="StudentView.openCourseModal(${course.id})">
                Course Materials & Tasks
              </button>
            </div>
          </div>
        </div>
      `).join('');

      // Populate assignment select dropdown for grading
      await TeacherView.populateAssignmentSelector();
    } catch (err) {
      grid.innerHTML = `<div class="text-muted">Error loading courses: ${err.message}</div>`;
    }
  },

  /**
   * Populate assignments across teacher's courses into the grading selector
   */
  async populateAssignmentSelector() {
    const select = document.getElementById('teacherAssignmentSelect');
    if (!select) return;

    select.innerHTML = '<option value="">Select an assignment to view submissions...</option>';
    TeacherView.allAssignments = [];

    for (const course of TeacherView.myCourses) {
      try {
        const details = await API.getCourseById(course.id);
        const assigns = (details.course && details.course.assignments) || [];
        assigns.forEach(a => {
          TeacherView.allAssignments.push(a);
          const opt = document.createElement('option');
          opt.value = a.id;
          opt.innerText = `${course.course_code}: ${a.title}`;
          select.appendChild(opt);
        });
      } catch (e) {
        // Continue
      }
    }

    // Auto-select first assignment if available
    if (TeacherView.allAssignments.length > 0) {
      select.value = TeacherView.allAssignments[0].id;
      await TeacherView.loadSubmissions(TeacherView.allAssignments[0].id);
    }
  },

  /**
   * Load student submissions for selected assignment
   */
  async loadSubmissions(assignmentId) {
    const tbody = document.getElementById('teacherSubmissionsTableBody');
    if (!tbody) return;

    if (!assignmentId) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Select an assignment above.</td></tr>';
      return;
    }

    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Loading submissions...</td></tr>';

    try {
      const res = await API.getAssignmentSubmissions(assignmentId);
      const subs = res.submissions || [];

      if (subs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No student submissions recorded yet for this assignment.</td></tr>';
        return;
      }

      tbody.innerHTML = subs.map(sub => {
        const fileLink = sub.file_url 
          ? `<a href="${sub.file_url}" target="_blank" class="btn-action btn-sm">Download Work</a>` 
          : `<span class="text-muted">No file</span>`;

        const notes = sub.submission_text ? `<div class="text-dim" style="font-size:0.8rem; margin-top:4px;">"${escapeHtml(sub.submission_text)}"</div>` : '';

        const marksText = sub.marks !== null ? `<strong>${sub.marks}</strong> / ${sub.max_marks}` : '<span class="text-muted">Not graded</span>';

        const statusBadge = sub.status === 'GRADED'
          ? `<span class="badge graded">Graded</span>`
          : `<span class="badge submitted">Pending Review</span>`;

        return `
          <tr>
            <td><strong>${escapeHtml(sub.student_name)}</strong></td>
            <td>${escapeHtml(sub.student_email)}</td>
            <td>${new Date(sub.submitted_date).toLocaleString()}</td>
            <td>${fileLink} ${notes}</td>
            <td>${marksText}</td>
            <td>${statusBadge}</td>
            <td>
              <button class="btn-primary btn-sm" onclick="openGradeModal(${sub.id}, '${escapeHtml(sub.student_name)}', ${sub.marks || 0}, '${escapeHtml(sub.feedback || '')}')">
                Grade / Feedback
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Error: ${err.message}</td></tr>`;
    }
  }
};

/**
 * Dropdown change trigger
 */
function loadAssignmentSubmissions(assignmentId) {
  TeacherView.loadSubmissions(assignmentId);
}

/**
 * Open Grade Modal
 */
function openGradeModal(submissionId, studentName, marks, feedback) {
  document.getElementById('gradeSubmissionId').value = submissionId;
  document.getElementById('gradeStudentName').innerText = studentName;
  document.getElementById('gradeMarks').value = marks || '';
  document.getElementById('gradeFeedback').value = feedback || '';
  openModal('gradeSubmissionModal');
}

/**
 * Submit grade and feedback
 */
async function handleGradeSubmit(e) {
  e.preventDefault();
  const submissionId = document.getElementById('gradeSubmissionId').value;
  const marks = document.getElementById('gradeMarks').value;
  const feedback = document.getElementById('gradeFeedback').value;

  try {
    const res = await API.gradeSubmission(submissionId, marks, feedback);
    showToast(res.message || 'Submission graded successfully!', 'success');
    closeModal('gradeSubmissionModal');

    // Reload submissions table
    const currentAssignId = document.getElementById('teacherAssignmentSelect').value;
    if (currentAssignId) {
      await TeacherView.loadSubmissions(currentAssignId);
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * Open Upload Material Modal and populate course select
 */
function openUploadMaterialModal() {
  const select = document.getElementById('materialCourseSelect');
  if (select) {
    select.innerHTML = TeacherView.myCourses.map(c => `
      <option value="${c.id}">${c.course_code}: ${c.course_name}</option>
    `).join('');
  }
  document.getElementById('uploadMaterialForm').reset();
  openModal('uploadMaterialModal');
}

/**
 * Handle upload material form submission
 */
async function handleUploadMaterialSubmit(e) {
  e.preventDefault();
  const courseId = document.getElementById('materialCourseSelect').value;
  const title = document.getElementById('materialTitle').value;
  const desc = document.getElementById('materialDesc').value;
  const fileInput = document.getElementById('materialFile');

  const formData = new FormData();
  formData.append('course_id', courseId);
  formData.append('title', title);
  formData.append('description', desc);

  if (fileInput.files.length > 0) {
    formData.append('file', fileInput.files[0]);
  }

  try {
    const res = await API.uploadMaterial(formData);
    showToast(res.message || 'Study material uploaded successfully!', 'success');
    closeModal('uploadMaterialModal');
    await TeacherView.loadTeacherCourses();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * Open Create Assignment Modal and populate course select
 */
function openCreateAssignmentModal() {
  const select = document.getElementById('assignCourseSelect');
  if (select) {
    select.innerHTML = TeacherView.myCourses.map(c => `
      <option value="${c.id}">${c.course_code}: ${c.course_name}</option>
    `).join('');
  }
  document.getElementById('createAssignmentForm').reset();
  
  // Default due date: 7 days from now
  const now = new Date();
  now.setDate(now.getDate() + 7);
  const isoStr = now.toISOString().slice(0, 16);
  const dueInput = document.getElementById('assignDueDate');
  if (dueInput) dueInput.value = isoStr;

  openModal('createAssignmentModal');
}

/**
 * Handle create assignment form submission
 */
async function handleCreateAssignmentSubmit(e) {
  e.preventDefault();
  const course_id = document.getElementById('assignCourseSelect').value;
  const title = document.getElementById('assignTitle').value;
  const due_date = document.getElementById('assignDueDate').value;
  const max_marks = document.getElementById('assignMaxMarks').value;
  const description = document.getElementById('assignDesc').value;

  try {
    const res = await API.createAssignment({
      course_id,
      title,
      due_date,
      max_marks,
      description
    });
    showToast(res.message || 'Assignment created successfully!', 'success');
    closeModal('createAssignmentModal');
    await TeacherView.loadTeacherCourses();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
