-- Multi-Tenant Migration Script
-- Run this to add multi-tenant support to existing database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE,
    subdomain VARCHAR NOT NULL UNIQUE,
    custom_domain VARCHAR,
    description TEXT,
    address TEXT,
    phone VARCHAR,
    email VARCHAR,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- 2. Create default organization
INSERT INTO organizations (id, name, subdomain, description, is_active, settings)
VALUES (
    'default-org-00000000-0000-0000-0000-000000000001',
    'Default Hospital',
    'default',
    'Default organization for existing data - created during multi-tenant migration',
    true,
    '{"subscription": {"plan": "enterprise", "status": "active"}}'::jsonb
)
ON CONFLICT (subdomain) DO NOTHING;

-- 3. Add organization_id to users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='organization_id') THEN
        ALTER TABLE users ADD COLUMN organization_id UUID;
        
        -- Set default organization for existing users
        UPDATE users SET organization_id = 'default-org-00000000-0000-0000-0000-000000000001'
        WHERE organization_id IS NULL;
        
        -- Make it NOT NULL
        ALTER TABLE users ALTER COLUMN organization_id SET NOT NULL;
        
        -- Add foreign key
        ALTER TABLE users ADD CONSTRAINT FK_users_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
        
        -- Add index
        CREATE INDEX IDX_users_organization_id ON users(organization_id);
        
        -- Update email constraint to be unique per organization
        ALTER TABLE users DROP CONSTRAINT IF EXISTS "UQ_users_email";
        ALTER TABLE users DROP CONSTRAINT IF EXISTS "users_email_key";
        ALTER TABLE users ADD CONSTRAINT "UQ_users_email_organization" UNIQUE (email, organization_id);
    END IF;
END $$;

-- 4. Function to add organization_id to a table
CREATE OR REPLACE FUNCTION add_organization_to_table(table_name TEXT) RETURNS void AS $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if column already exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = add_organization_to_table.table_name 
        AND column_name = 'organization_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        -- Add column
        EXECUTE format('ALTER TABLE %I ADD COLUMN organization_id UUID', table_name);
        
        -- Set default organization
        EXECUTE format('UPDATE %I SET organization_id = %L WHERE organization_id IS NULL', 
                      table_name, 'default-org-00000000-0000-0000-0000-000000000001');
        
        -- Make NOT NULL
        EXECUTE format('ALTER TABLE %I ALTER COLUMN organization_id SET NOT NULL', table_name);
        
        -- Add foreign key
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT FK_%I_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE', 
                      table_name, table_name);
        
        -- Add index
        EXECUTE format('CREATE INDEX IDX_%I_organization_id ON %I(organization_id)', table_name, table_name);
        
        RAISE NOTICE 'Added organization_id to %', table_name;
    ELSE
        RAISE NOTICE 'Skipped % (organization_id already exists)', table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Add organization_id to all tables
SELECT add_organization_to_table('departments');
SELECT add_organization_to_table('services');
SELECT add_organization_to_table('appointments');
SELECT add_organization_to_table('refresh_tokens');
SELECT add_organization_to_table('medical_records');
SELECT add_organization_to_table('bills');
SELECT add_organization_to_table('availability_slots');
SELECT add_organization_to_table('referrals');
SELECT add_organization_to_table('reports');
SELECT add_organization_to_table('emergency_requests');
SELECT add_organization_to_table('callback_requests');
SELECT add_organization_to_table('plans');
SELECT add_organization_to_table('policies');
SELECT add_organization_to_table('claims');
SELECT add_organization_to_table('appointment_history');
SELECT add_organization_to_table('medicines');
SELECT add_organization_to_table('prescriptions');
SELECT add_organization_to_table('prescription_items');
SELECT add_organization_to_table('medicine_transactions');
SELECT add_organization_to_table('lab_tests');
SELECT add_organization_to_table('lab_orders');
SELECT add_organization_to_table('lab_order_items');
SELECT add_organization_to_table('lab_samples');
SELECT add_organization_to_table('lab_results');
SELECT add_organization_to_table('consultation_notes');
SELECT add_organization_to_table('wards');
SELECT add_organization_to_table('rooms');
SELECT add_organization_to_table('beds');
SELECT add_organization_to_table('admissions');
SELECT add_organization_to_table('nursing_notes');
SELECT add_organization_to_table('vital_signs');
SELECT add_organization_to_table('medication_administrations');
SELECT add_organization_to_table('doctor_notes');
SELECT add_organization_to_table('discharge_summaries');

-- 6. Cleanup
DROP FUNCTION IF EXISTS add_organization_to_table(TEXT);

-- Done!
SELECT 'Multi-tenant migration completed successfully!' AS status;
SELECT COUNT(*) AS total_tables_updated FROM information_schema.columns 
WHERE table_schema = 'public' AND column_name = 'organization_id';
