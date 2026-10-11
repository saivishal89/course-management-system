/**
 * EduSphere CMS - Admin Portal Controller
 */

const AdminView = {
  currentRoleFilter: 'ALL',

  async init() {
    await AdminView.loadStats();
    await AdminView.loadUsers('ALL');
    await AdminView.loadCourses();
  },

  /**
   * Load system-wide statistics for KPI cards
   */
  async loadStats() {
    try {
      const res = await API.getAdminStats();
      const stats = res.stats || {};

      document.getElementById('statStudents').innerText = stats.students || 0;
      document.getElementById('statTeachers').innerText = stats.teachers || 0;
      document.getElementById('statCourses').innerText = stats.courses || 0;
      document.getElementById('statEnrollments').innerText = stats.enrollments || 0;
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  },

  /**
   * Load all registered users with role filter
   */
  async loadUsers(role = 'ALL') {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Loading users...</td></tr>';

    try {
      const res = await API.getAdminUsers(role);
      const users = res.users || [];

      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No users found for this filter.</td></tr>';
        return;
      }

      const currentUser = API.getUser();

      tbody.innerHTML = users.map(u => {
        const roleBadge = u.role === 'ADMIN'
          ? '<span class="badge role-admin">Admin</span>'
          : u.role === 'TEACHER'
          ? '<span class="badge role-teacher">Teacher</span>'
          : '<span class="badge role-student">Student</span>';

        const deleteBtn = (currentUser && currentUser.id === u.id)
          ? '<span class="text-muted" style="font-size:0.8rem;">(Current Account)</span>'
          : `<button class="btn-logout" style="padding:4px 8px; font-size:0.75rem;" onclick="AdminView.handleDeleteUser(${u.id}, '${escapeHtml(u.name)}')">Delete</button>`;

        const regDate = u.created_at ? new Date(u.created_at).toLocaleDateString() : '-';

        return `
          <tr>
            <td>#${u.id}</td>
            <td><strong>${escapeHtml(u.name)}</strong></td>
            <td>${escapeHtml(u.email)}</td>
            <td>${roleBadge}</td>
            <td>${regDate}</td>
            <td>${deleteBtn}</td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Error loading users: ${err.message}</td></tr>`;
    }
  },

  /**
   * Delete a user
   */
  async handleDeleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to remove user "${userName}"? This will permanently delete associated enrollments and records.`)) {
      return;
    }

    try {
      const res = await API.deleteAdminUser(userId);
      showToast(res.message || 'User deleted successfully.', 'success');
      await AdminView.loadUsers(AdminView.currentRoleFilter);
      await AdminView.loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  /**
   * Load courses for Admin view with delete actions
   */
  async loadCourses() {
    const grid = document.getElementById('adminCoursesGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="text-muted">Loading courses...</div>';

    try {
      const res = await API.getCourses();
      const courses = res.courses || [];

      if (courses.length === 0) {
        grid.innerHTML = '<div class="text-muted">No courses found.</div>';
        return;
      }

      grid.innerHTML = courses.map(course => `
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
                <span>Active Enrollments:</span>
                <span>${course.enrolled_count || 0} students</span>
              </div>
            </div>
            <div class="course-card-actions">
              <button class="btn-outline" onclick="StudentView.openCourseModal(${course.id})">Inspect</button>
              <button class="btn-logout" style="padding:10px 14px;" onclick="AdminView.handleDeleteCourse(${course.id}, '${escapeHtml(course.course_name)}')">
                Delete
              </button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      grid.innerHTML = `<div class="text-muted">Error loading courses: ${err.message}</div>`;
    }
  },

  /**
   * Delete course
   */
  async handleDeleteCourse(courseId, courseName) {
    if (!confirm(`Are you sure you want to delete course "${courseName}"?`)) {
      return;
    }

    try {
      const res = await API.deleteCourse(courseId);
      showToast(res.message || 'Course deleted successfully.', 'success');
      await AdminView.loadCourses();
      await AdminView.loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

/**
 * Filter users by role pill
 */
function filterAdminUsers(role, btnElement) {
  AdminView.currentRoleFilter = role;
  document.querySelectorAll('.filter-pill').forEach(el => el.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  AdminView.loadUsers(role);
}

/**
 * Open Create User Modal
 */
function openCreateUserModal() {
  document.getElementById('createUserForm').reset();
  openModal('createUserModal');
}

/**
 * Handle Create User form submission
 */
async function handleCreateUserSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('adminNewUserName').value;
  const email = document.getElementById('adminNewUserEmail').value;
  const password = document.getElementById('adminNewUserPassword').value;
  const role = document.getElementById('adminNewUserRole').value;

  try {
    const res = await API.createAdminUser({ name, email, password, role });
    showToast(res.message || 'User added successfully!', 'success');
    closeModal('createUserModal');
    await AdminView.loadUsers(AdminView.currentRoleFilter);
    await AdminView.loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
