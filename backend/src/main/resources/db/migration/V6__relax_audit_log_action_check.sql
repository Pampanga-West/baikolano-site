-- V6: Relax audit_log action check constraint to allow application audit events
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'audit_log_action_check'
    ) THEN
        ALTER TABLE audit_log DROP CONSTRAINT audit_log_action_check;
    END IF;

    -- Widen action column if necessary
    ALTER TABLE audit_log ALTER COLUMN action TYPE VARCHAR(50);
END $$;
