/**
 * EduSphere CMS - API Client & Utility Functions
 */

const API = {
  baseUrl: '',

  getToken() {
    return localStorage.getItem('cms_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('cms_token', token);
    } else {
      localStorage.removeItem('cms_token');
    }
  },

  getUser() {
    const raw = localStorage.getItem('cms_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('cms_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cms_user');
    }
  },

  async request(endpoint, options = {}) {
    const headers = options.headers || {};
    const token = API.getToken();

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(`${API.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      throw err;
    }
  },

  // Auth endpoints
  async login(email, password) {
    return API.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async register(name, email, password, role) {
    return API.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
  },

  async getMe() {
    return API.request('/api/auth/me');
  },

  // Course endpoints
  async getCourses(teacherId = null) {
    const query = teacherId ? `?teacher_id=${teacherId}` : '';
    return API.request(`/api/courses${query}`);
  },

  async getCourseById(courseId) {
    return API.request(`/api/courses/${courseId}`);
  },

  async createCourse(courseData) {
    return API.request('/api/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
  },

  async deleteCourse(courseId) {
    return API.request(`/api/courses/${courseId}`, {
      method: 'DELETE'
    });
  },

  // Enrollment endpoints
  async enroll(courseId) {
    return API.request('/api/enrollments', {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId })
    });
  },

  async unenroll(courseId) {
    return API.request(`/api/enrollments/${courseId}`, {
      method: 'DELETE'
    });
  },

  async getMyCourses() {
    return API.request('/api/enrollments/my-courses');
  },

  async getCourseStudents(courseId) {
    return API.request(`/api/enrollments/course/${courseId}/students`);
  },

  // Materials
  async uploadMaterial(formData) {
    return API.request('/api/materials', {
      method: 'POST',
      body: formData
    });
  },

  async deleteMaterial(materialId) {
    return API.request(`/api/materials/${materialId}`, {
      method: 'DELETE'
    });
  },

  // Assignments & Grading
  async createAssignment(assignmentData) {
    return API.request('/api/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData)
    });
  },

  async submitAssignment(assignmentId, formData) {
    return API.request(`/api/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: formData
    });
  },

  async getAssignmentSubmissions(assignmentId) {
    return API.request(`/api/assignments/${assignmentId}/submissions`);
  },

  async gradeSubmission(submissionId, marks, feedback) {
    return API.request(`/api/assignments/submissions/${submissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify({ marks, feedback })
    });
  },

  async getMyGrades() {
    return API.request('/api/assignments/my-grades');
  },

  // Admin
  async getAdminStats() {
    return API.request('/api/admin/stats');
  },

  async getAdminUsers(role = '') {
    const q = role && role !== 'ALL' ? `?role=${role}` : '';
    return API.request(`/api/admin/users${q}`);
  },

  async createAdminUser(userData) {
    return API.request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async deleteAdminUser(userId) {
    return API.request(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    });
  }
};

/**
 * Toast Notification System
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Modal utilities
 */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// Close modal when clicked on overlay
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});
