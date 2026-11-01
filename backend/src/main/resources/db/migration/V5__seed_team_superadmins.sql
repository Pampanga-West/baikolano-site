-- S1-DBA-05: Seed team superadmin accounts
-- Team Members:
-- 1. Joe Andre Roja (Scrum Master)
-- 2. Redge Rainier Sarmiento (Tester)
-- 3. Eures Nivrem Tinoco (Developer)
-- 4. Phil Emmanuel Hitalia (UI/UX)
-- 5. Marc Miguel Ramirez (DB Admin)
-- Initial shared password: "bikolano123"

INSERT INTO app_user (email, password_hash, role, approval_status, blocked, first_name, last_name)
VALUES
    ('joe.roja@example.com', '$2a$12$8JQm9CsXxy.1zPRUEBbHJevw3qi2q3q8klIqutF2khdwmCRVYklbK', 'Superadmin', 'APPROVED', FALSE, 'Joe Andre', 'Roja'),
    ('redge.sarmiento@example.com', '$2a$12$8JQm9CsXxy.1zPRUEBbHJevw3qi2q3q8klIqutF2khdwmCRVYklbK', 'Superadmin', 'APPROVED', FALSE, 'Redge Rainier', 'Sarmiento'),
    ('eures.tinoco@example.com', '$2a$12$8JQm9CsXxy.1zPRUEBbHJevw3qi2q3q8klIqutF2khdwmCRVYklbK', 'Superadmin', 'APPROVED', FALSE, 'Eures Nivrem', 'Tinoco'),
    ('phil.hitalia@example.com', '$2a$12$8JQm9CsXxy.1zPRUEBbHJevw3qi2q3q8klIqutF2khdwmCRVYklbK', 'Superadmin', 'APPROVED', FALSE, 'Phil Emmanuel', 'Hitalia'),
    ('marc.ramirez@example.com', '$2a$12$8JQm9CsXxy.1zPRUEBbHJevw3qi2q3q8klIqutF2khdwmCRVYklbK', 'Superadmin', 'APPROVED', FALSE, 'Marc Miguel', 'Ramirez')
ON CONFLICT (email) DO UPDATE SET
    role = 'Superadmin',
    approval_status = 'APPROVED',
    blocked = FALSE,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;

DELETE FROM app_user WHERE email = 'temp_hash@example.com';
