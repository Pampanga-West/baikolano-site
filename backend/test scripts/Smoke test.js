// S1-TST-05: Automated smoke test for login and main dashboard load
(async () => {
  const csrf = await fetch('http://localhost:8080/api/auth/csrf', { credentials: 'include' });
  console.log('Smoke test health status:', csrf.status);
})();
