/**
 * EduSphere CMS - Core Application State & View Orchestrator
 */

document.addEventListener('DOMContentLoaded', async () => {
  await initApp();
});

async function initApp() {
  const token = API.getToken();
  const user = API.getUser();

  if (token && user) {
    try {
      // Validate session with backend
      const res = await API.getMe();
      if (res.user) {
        API.setUser(res.user);
        renderUserSession(res.user);
        return;
      }
    } catch (e) {
      console.warn('Session expired or invalid, displaying login view.');
      API.setToken(null);
      API.setUser(null);
    }
  }

  // Not logged in -> Show Auth View
  renderLoggedOutState();
}

/**
 * Render logged-in view based on user role
 */
function renderUserSession(user) {
  // Update header badges
  const profileBadge = document.getElementById('userProfileBadge');
  const logoutBtn = document.getElementById('logoutBtn');
  const navUserName = document.getElementById('navUserName');
  const navUserRole = document.getElementById('navUserRole');
  const navUserAvatar = document.getElementById('navUserAvatar');

  if (profileBadge) profileBadge.classList.remove('hidden');
  if (logoutBtn) logoutBtn.classList.remove('hidden');
  if (navUserName) navUserName.innerText = user.name;
  if (navUserRole) navUserRole.innerText = user.role;
  if (navUserAvatar) navUserAvatar.innerText = user.name.charAt(0).toUpperCase();

  // Hide auth section
  document.getElementById('authSection').classList.add('hidden');

  // Hide all portal sections first
  document.getElementById('studentSection').classList.add('hidden');
  document.getElementById('teacherSection').classList.add('hidden');
  document.getElementById('adminSection').classList.add('hidden');

  // Update demo bar button highlights
  document.querySelectorAll('.btn-demo').forEach(btn => btn.classList.remove('active'));
  if (user.role === 'ADMIN') document.getElementById('demoAdminBtn')?.classList.add('active');
  if (user.role === 'TEACHER') document.getElementById('demoTeacherBtn')?.classList.add('active');
  if (user.role === 'STUDENT') document.getElementById('demoStudentBtn')?.classList.add('active');

  // Activate portal corresponding to role
  if (user.role === 'STUDENT') {
    document.getElementById('studentSection').classList.remove('hidden');
    StudentView.init();
  } else if (user.role === 'TEACHER') {
    document.getElementById('teacherSection').classList.remove('hidden');
    TeacherView.init();
  } else if (user.role === 'ADMIN') {
    document.getElementById('adminSection').classList.remove('hidden');
    AdminView.init();
  }
}

/**
 * Render logged-out view
 */
function renderLoggedOutState() {
  document.getElementById('userProfileBadge')?.classList.add('hidden');
  document.getElementById('logoutBtn')?.classList.add('hidden');
  document.querySelectorAll('.btn-demo').forEach(btn => btn.classList.remove('active'));

  document.getElementById('authSection').classList.remove('hidden');
  document.getElementById('studentSection').classList.add('hidden');
  document.getElementById('teacherSection').classList.add('hidden');
  document.getElementById('adminSection').classList.add('hidden');
}

/**
 * Switch Auth Tab (Login vs Register)
 */
function switchAuthTab(tab) {
  const loginTab = document.getElementById('loginTabBtn');
  const regTab = document.getElementById('registerTabBtn');
  const loginForm = document.getElementById('loginForm');
  const regForm = document.getElementById('registerForm');

  if (tab === 'login') {
    loginTab.classList.add('active');
    regTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
  } else {
    regTab.classList.add('active');
    loginTab.classList.remove('active');
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

/**
 * Handle Login Form Submit
 */
async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await API.login(email, password);
    API.setToken(res.token);
    API.setUser(res.user);
    showToast(`Welcome back, ${res.user.name}!`, 'success');
    renderUserSession(res.user);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * Handle Register Form Submit
 */
async function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;

  try {
    const res = await API.register(name, email, password, role);
    API.setToken(res.token);
    API.setUser(res.user);
    showToast(`Account created successfully! Welcome, ${res.user.name}.`, 'success');
    renderUserSession(res.user);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * Handle 1-Click Demo Persona Switch
 */
async function switchDemoUser(email) {
  try {
    showToast(`Switching persona to ${email}...`, 'info');
    const res = await API.login(email, 'password123');
    API.setToken(res.token);
    API.setUser(res.user);
    renderUserSession(res.user);
    showToast(`Active Persona: ${res.user.name} (${res.user.role})`, 'success');
  } catch (err) {
    showToast(`Failed to switch demo user: ${err.message}`, 'error');
  }
}

/**
 * Handle Logout
 */
function handleLogout() {
  API.setToken(null);
  API.setUser(null);
  showToast('You have been signed out.', 'info');
  renderLoggedOutState();
}

function navigateHome() {
  const user = API.getUser();
  if (user) {
    renderUserSession(user);
  } else {
    renderLoggedOutState();
  }
}

/**
 * Student Tab Switching
 */
function switchStudentTab(tab) {
  document.querySelectorAll('#studentSection .portal-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#studentSection .tab-pane').forEach(p => p.classList.add('hidden'));

  if (tab === 'browse') {
    document.getElementById('tabBrowseBtn')?.classList.add('active');
    document.getElementById('studentBrowsePane')?.classList.remove('hidden');
    StudentView.loadBrowseCourses();
  } else if (tab === 'my-courses') {
    document.getElementById('tabMyCoursesBtn')?.classList.add('active');
    document.getElementById('studentMyCoursesPane')?.classList.remove('hidden');
    StudentView.loadMyCourses();
  } else if (tab === 'grades') {
    document.getElementById('tabGradesBtn')?.classList.add('active');
    document.getElementById('studentGradesPane')?.classList.remove('hidden');
    StudentView.loadMyGrades();
  }
}

/**
 * Admin Tab Switching
 */
function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tabs .portal-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('adminUsersPane')?.classList.add('hidden');
  document.getElementById('adminCoursesPane')?.classList.add('hidden');

  if (tab === 'users') {
    document.getElementById('tabAdminUsersBtn')?.classList.add('active');
    document.getElementById('adminUsersPane')?.classList.remove('hidden');
    AdminView.loadUsers(AdminView.currentRoleFilter);
  } else if (tab === 'courses') {
    document.getElementById('tabAdminCoursesBtn')?.classList.add('active');
    document.getElementById('adminCoursesPane')?.classList.remove('hidden');
    AdminView.loadCourses();
  }
}

/**
 * Open Create Course Modal (Teacher or Admin)
 */
async function openCreateCourseModal() {
  document.getElementById('createCourseForm').reset();
  const user = API.getUser();
  const teacherGroup = document.getElementById('courseTeacherSelectGroup');

  if (user && user.role === 'ADMIN') {
    if (teacherGroup) teacherGroup.style.display = 'flex';
    const select = document.getElementById('newCourseTeacher');
    if (select) {
      try {
        const res = await API.getAdminUsers('TEACHER');
        select.innerHTML = (res.users || []).map(t => `<option value="${t.id}">${t.name} (${t.email})</option>`).join('');
      } catch (e) {
        select.innerHTML = '<option value="">No teachers available</option>';
      }
    }
  } else {
    if (teacherGroup) teacherGroup.style.display = 'none';
  }

  openModal('createCourseModal');
}

/**
 * Handle Create Course form submission
 */
async function handleCreateCourseSubmit(e) {
  e.preventDefault();
  const user = API.getUser();
  const course_name = document.getElementById('newCourseName').value;
  const course_code = document.getElementById('newCourseCode').value;
  const duration = document.getElementById('newCourseDuration').value;
  const description = document.getElementById('newCourseDesc').value;
  const teacherSelect = document.getElementById('newCourseTeacher');
  const teacher_id = (user.role === 'ADMIN' && teacherSelect) ? teacherSelect.value : null;

  try {
    const res = await API.createCourse({
      course_name,
      course_code,
      duration,
      description,
      teacher_id
    });
    showToast(res.message || 'Course created successfully!', 'success');
    closeModal('createCourseModal');

    if (user.role === 'TEACHER') {
      await TeacherView.loadTeacherCourses();
    } else if (user.role === 'ADMIN') {
      await AdminView.loadCourses();
      await AdminView.loadStats();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}
