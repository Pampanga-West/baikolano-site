# Sprint 1 Bug Reports & Fix Verification

- **BUG-01:** Role badge displaying default User before session refresh -> Verified fixed via `normalizeRole()` and `/api/auth/me`.
- **BUG-02:** Profile personal info save independent from password change -> Verified fixed with separate form handlers in `ProfilePage.tsx`.
- **BUG-03:** `audit_log` check constraint on profile updates -> Verified fixed via `V6__relax_audit_log_action_check.sql`.
