/**
 * EduSphere CMS - Student Portal Controller
 */

const StudentView = {
  currentCourseDetails: null,

  async init() {
    const user = API.getUser();
    const titleEl = document.getElementById('studentWelcomeTitle');
    if (titleEl && user) {
      titleEl.innerText = `Welcome Back, ${user.name}`;
    }
    await StudentView.loadBrowseCourses();
  },

  /**
   * Load courses catalog for browsing & enrollment
   */
  async loadBrowseCourses() {
    const grid = document.getElementById('studentBrowseGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="text-muted">Loading courses...</div>';

    try {
      const res = await API.getCourses();
      const courses = res.courses || [];

      if (courses.length === 0) {
        grid.innerHTML = '<div class="text-muted">No courses currently available.</div>';
        return;
      }

      grid.innerHTML = courses.map(course => {
        const isEnrolled = course.is_enrolled;
        const enrollBtn = isEnrolled
          ? `<span class="btn-enrolled">✓ Enrolled</span>`
          : `<button class="btn-enroll" onclick="StudentView.handleEnroll(${course.id}, '${escapeHtml(course.course_name)}')">Enroll Now</button>`;

        return `
          <div class="course-card">
            <div>
              <span class="course-code-badge">${escapeHtml(course.course_code)}</span>
              <h4 class="course-title">${escapeHtml(course.course_name)}</h4>
              <p class="course-desc">${escapeHtml(course.description || 'No description provided.')}</p>
            </div>
            <div>
              <div class="course-meta">
                <div class="course-meta-item">
                  <span>Instructor:</span>
                  <strong>${escapeHtml(course.teacher_name || 'Unassigned')}</strong>
                </div>
                <div class="course-meta-item">
                  <span>Duration:</span>
                  <span>${escapeHtml(course.duration)}</span>
                </div>
                <div class="course-meta-item">
                  <span>Students Enrolled:</span>
                  <span>${course.enrolled_count || 0} students</span>
                </div>
              </div>
              <div class="course-card-actions">
                <button class="btn-outline" onclick="StudentView.openCourseModal(${course.id})">View Syllabus</button>
                ${enrollBtn}
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      grid.innerHTML = `<div class="text-muted">Error loading courses: ${err.message}</div>`;
    }
  },

  /**
   * Handle enrollment action
   */
  async handleEnroll(courseId, courseName) {
    try {
      const res = await API.enroll(courseId);
      showToast(res.message || `Enrolled in ${courseName}!`, 'success');
      await StudentView.loadBrowseCourses();
      await StudentView.loadMyCourses();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  /**
   * Load courses enrolled by the student
   */
  async loadMyCourses() {
    const grid = document.getElementById('studentMyCoursesGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="text-muted">Loading your enrolled courses...</div>';

    try {
      const res = await API.getMyCourses();
      const enrollments = res.enrollments || [];

      if (enrollments.length === 0) {
        grid.innerHTML = `
          <div class="text-muted" style="grid-column: 1 / -1; padding: 30px; text-align: center;">
            You have not enrolled in any courses yet.<br><br>
            <button class="btn-primary" onclick="switchStudentTab('browse')">Explore Course Catalog</button>
          </div>
        `;
        return;
      }

      grid.innerHTML = enrollments.map(item => `
        <div class="course-card">
          <div>
            <span class="course-code-badge">${escapeHtml(item.course_code)}</span>
            <h4 class="course-title">${escapeHtml(item.course_name)}</h4>
            <p class="course-desc">${escapeHtml(item.description || 'No description provided.')}</p>
          </div>
          <div>
            <div class="course-meta">
              <div class="course-meta-item">
                <span>Instructor:</span>
                <strong>${escapeHtml(item.teacher_name || 'Unassigned')}</strong>
              </div>
              <div class="course-meta-item">
                <span>Materials Available:</span>
                <span>${item.materials_count || 0} files</span>
              </div>
              <div class="course-meta-item">
                <span>Assignments:</span>
                <span>${item.assignments_count || 0} tasks</span>
              </div>
            </div>
            <div class="course-card-actions">
              <button class="btn-primary w-full" onclick="StudentView.openCourseModal(${item.course_id})">
                Access Course Portal
              </button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      grid.innerHTML = `<div class="text-muted">Error loading enrolled courses: ${err.message}</div>`;
    }
  },

  /**
   * Load and display student grades & marks
   */
  async loadMyGrades() {
    const tbody = document.getElementById('studentGradesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Loading grades...</td></tr>';

    try {
      const res = await API.getMyGrades();
      const grades = res.grades || [];

      if (grades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No assignment submissions recorded yet.</td></tr>';
        return;
      }

      tbody.innerHTML = grades.map(row => {
        const statusBadge = row.status === 'GRADED'
          ? `<span class="badge graded">Graded</span>`
          : row.status === 'LATE'
          ? `<span class="badge late">Late</span>`
          : `<span class="badge submitted">Submitted</span>`;

        const scoreDisplay = row.marks !== null && row.marks !== undefined
          ? `<strong>${row.marks}</strong> / ${row.max_marks || 100}`
          : `<span class="text-muted">Pending Evaluation</span>`;

        const formattedDate = row.submitted_date ? new Date(row.submitted_date).toLocaleDateString() : '-';
        const dueDate = row.due_date ? new Date(row.due_date).toLocaleDateString() : '-';

        return `
          <tr>
            <td><strong>${escapeHtml(row.course_code)}:</strong> ${escapeHtml(row.course_name)}</td>
            <td>${escapeHtml(row.assignment_title)}</td>
            <td>${dueDate}</td>
            <td>${formattedDate}</td>
            <td>${scoreDisplay}</td>
            <td>${statusBadge}</td>
            <td>${row.feedback ? escapeHtml(row.feedback) : '<span class="text-muted">No remarks yet</span>'}</td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Error: ${err.message}</td></tr>`;
    }
  },

  /**
   * Open Course Details Modal with Materials and Assignments
   */
  async openCourseModal(courseId) {
    try {
      const res = await API.getCourseById(courseId);
      const course = res.course;
      StudentView.currentCourseDetails = course;

      document.getElementById('modalCourseCode').innerText = course.course_code;
      document.getElementById('modalCourseTitle').innerText = course.course_name;
      document.getElementById('modalCourseDescription').innerText = course.description || 'No description available.';
      document.getElementById('modalCourseTeacher').innerText = `Instructor: ${course.teacher_name || 'Unassigned'}`;
      document.getElementById('modalCourseDuration').innerText = `Duration: ${course.duration}`;

      // Materials list
      const matContainer = document.getElementById('modalMaterialsList');
      if (course.materials && course.materials.length > 0) {
        matContainer.innerHTML = course.materials.map(m => `
          <div class="material-item">
            <div class="material-info">
              <span class="item-title">📄 ${escapeHtml(m.title)}</span>
              <span class="item-sub">${escapeHtml(m.description || '')}</span>
            </div>
            <a href="${m.file_url}" target="_blank" download class="btn-action btn-sm">Download</a>
          </div>
        `).join('');
      } else {
        matContainer.innerHTML = '<div class="text-muted">No study materials uploaded for this course yet.</div>';
      }

      // Assignments list
      const assignContainer = document.getElementById('modalAssignmentsList');
      if (course.assignments && course.assignments.length > 0) {
        assignContainer.innerHTML = course.assignments.map(a => {
          const user = API.getUser();
          let actionBtn = '';

          if (user && user.role === 'STUDENT') {
            if (a.submitted) {
              const mark = a.submission && a.submission.marks !== null ? `(${a.submission.marks} marks)` : '';
              actionBtn = `<span class="badge graded">✓ Submitted ${mark}</span>`;
            } else {
              actionBtn = `<button class="btn-primary btn-sm" onclick="StudentView.openSubmitModal(${a.id}, '${escapeHtml(a.title)}')">Submit Work</button>`;
            }
          }

          const due = new Date(a.due_date).toLocaleDateString();

          return `
            <div class="assignment-item">
              <div class="assignment-info">
                <span class="item-title">📝 ${escapeHtml(a.title)}</span>
                <span class="item-sub">Due: ${due} | Max Marks: ${a.max_marks || 100}</span>
                <span class="item-sub text-muted" style="margin-top: 4px;">${escapeHtml(a.description || '')}</span>
              </div>
              <div>${actionBtn}</div>
            </div>
          `;
        }).join('');
      } else {
        assignContainer.innerHTML = '<div class="text-muted">No active assignments for this course.</div>';
      }

      openModal('courseDetailsModal');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  /**
   * Open modal for student to submit homework/assignment
   */
  openSubmitModal(assignmentId, title) {
    document.getElementById('submitAssignmentId').value = assignmentId;
    document.getElementById('submitModalTitle').innerText = `Submit: ${title}`;
    document.getElementById('submitAssignmentForm').reset();
    openModal('submitAssignmentModal');
  }
};

/**
 * Handle student assignment submission form
 */
async function handleAssignmentSubmitForm(e) {
  e.preventDefault();
  const assignmentId = document.getElementById('submitAssignmentId').value;
  const fileInput = document.getElementById('submitFile');
  const textInput = document.getElementById('submitText');

  const formData = new FormData();
  if (fileInput.files.length > 0) {
    formData.append('file', fileInput.files[0]);
  }
  if (textInput.value.trim()) {
    formData.append('submission_text', textInput.value.trim());
  }

  try {
    const res = await API.submitAssignment(assignmentId, formData);
    showToast(res.message || 'Assignment submitted successfully!', 'success');
    closeModal('submitAssignmentModal');

    // Refresh modal details and student grades
    if (StudentView.currentCourseDetails) {
      await StudentView.openCourseModal(StudentView.currentCourseDetails.id);
    }
    await StudentView.loadMyGrades();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
