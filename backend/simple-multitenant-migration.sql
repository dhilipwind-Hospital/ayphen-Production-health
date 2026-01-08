-- Simple Multi-Tenant Migration
-- This script adds multi-tenant support to your existing database

\echo '🚀 Starting multi-tenant migration...'
\echo ''

-- 1. Insert default organization
\echo '📝 Step 1: Creating default organization...'
INSERT INTO organizations (id, name, subdomain, description, is_active, settings)
VALUES (
    'default-org-00000000-0000-0000-0000-000000000001',
    'Default Hospital',
    'default',
    'Default organization for existing data',
    true,
    '{"subscription": {"plan": "enterprise", "status": "active"}}'::jsonb
)
ON CONFLICT (subdomain) DO NOTHING;

\echo '✅ Default organization created'
\echo ''

-- 2. Add organization_id to users (if not exists)
\echo '📝 Step 2: Adding organization_id to users...'
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='organization_id') THEN
        ALTER TABLE users ADD COLUMN organization_id UUID;
        UPDATE users SET organization_id = 'default-org-00000000-0000-0000-0000-000000000001';
        ALTER TABLE users ALTER COLUMN organization_id SET NOT NULL;
        ALTER TABLE users ADD CONSTRAINT FK_users_organization 
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IDX_users_organization_id ON users(organization_id);
        RAISE NOTICE '✅ Added organization_id to users';
    ELSE
        RAISE NOTICE '⏭️  Users already has organization_id';
    END IF;
END $$;

\echo ''
\echo '🎉 Multi-tenant migration completed!'
\echo ''
\echo '📊 Summary:'
SELECT 'Organizations created' AS metric, COUNT(*) AS count FROM organizations
UNION ALL
SELECT 'Users with organization' AS metric, COUNT(*) AS count FROM users WHERE organization_id IS NOT NULL;
