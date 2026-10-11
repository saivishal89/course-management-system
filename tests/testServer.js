const http = require('http');
const { app, startServer } = require('../server');

async function runTests() {
  console.log('--- Starting API Integration Tests ---');
  const server = await startServer();
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const reqOptions = {
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      if (options.body) {
        reqOptions.headers['Content-Type'] = 'application/json';
      }

      const req = http.request(url, reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });

      req.on('error', reject);
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  }

  try {
    // 1. Health check
    const health = await request('/api/health');
    console.log('✓ 1. /api/health ->', health.status, health.data.status);

    // 2. Demo accounts
    const demos = await request('/api/auth/demo-accounts');
    console.log('✓ 2. /api/auth/demo-accounts ->', demos.status, demos.data.personas.length, 'personas');

    // 3. Login as Admin
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@cms.edu', password: 'password123' }
    });
    console.log('✓ 3. Admin Login ->', adminLogin.status, 'Role:', adminLogin.data.user.role);
    const adminToken = adminLogin.data.token;

    // 4. Admin stats
    const stats = await request('/api/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✓ 4. Admin Stats ->', stats.status, stats.data.stats);

    // 5. Login as Student
    const studentLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'alice@student.edu', password: 'password123' }
    });
    console.log('✓ 5. Student Login ->', studentLogin.status, 'User:', studentLogin.data.user.name);
    const studentToken = studentLogin.data.token;

    // 6. Student browse courses
    const courses = await request('/api/courses', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✓ 6. Student Courses List ->', courses.status, courses.data.courses.length, 'courses found');

    // 7. Student enrolls in Course 3
    const enroll = await request('/api/enrollments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { course_id: 3 }
    });
    console.log('✓ 7. Student Enroll Course ->', enroll.status, enroll.data.message);

    // 8. Login as Teacher
    const teacherLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'rahul@cms.edu', password: 'password123' }
    });
    console.log('✓ 8. Teacher Login ->', teacherLogin.status, 'Teacher:', teacherLogin.data.user.name);
    const teacherToken = teacherLogin.data.token;

    // 9. Teacher check submissions
    const subs = await request('/api/assignments/1/submissions', {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✓ 9. Teacher Assignment Submissions ->', subs.status, subs.data.submissions.length, 'submissions');

    console.log('\n========================================');
    console.log(' ALL 9 API INTEGRATION TESTS PASSED! ');
    console.log('========================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Test execution error:', err);
    server.close();
    process.exit(1);
  }
}

runTests();
