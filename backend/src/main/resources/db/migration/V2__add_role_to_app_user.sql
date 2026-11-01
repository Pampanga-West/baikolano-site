ALTER TABLE app_user
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'User';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_app_user_role'
    ) THEN
        ALTER TABLE app_user
            ADD CONSTRAINT chk_app_user_role
                CHECK (role IN ('Superadmin', 'Admin', 'User'));
    END IF;
END $$;
