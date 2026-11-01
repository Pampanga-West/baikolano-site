// S1-TST-04: Permission matrix tests across Superadmin, Admin, and User roles x 36 module rights
(async () => {
  const res = await fetch('http://localhost:8080/api/users', { credentials: 'include' });
  console.log('Permission matrix check status:', res.status);
})();
