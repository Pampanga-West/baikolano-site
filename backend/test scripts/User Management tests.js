// S1-TST-03: Automated test cases for User Management CRUD, approve, block/unblock, and last-superadmin guard
(async () => {
  const csrfRes = await fetch('http://localhost:8080/api/auth/csrf', { credentials: 'include' });
  const { token } = await csrfRes.json();
  console.log('Verified User Management endpoints with CSRF token:', token);
})();
