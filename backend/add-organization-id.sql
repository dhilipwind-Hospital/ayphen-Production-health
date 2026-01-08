-- Add organization_id to all remaining tables for multi-tenant support
-- Run this with: docker exec hospital-website-postgres-1 psql -U postgres -d hospital_db -f /app/add-organization-id.sql

\echo 'Starting multi-tenant migration...'
\echo ''

-- Function to safely add organization_id column
CREATE OR REPLACE FUNCTION add_org_id_to_table(table_name TEXT) RETURNS void AS $$
BEGIN
    -- Add column if it doesn't exist
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS organization_id UUID', table_name);

    -- Add foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = format('fk_%s_organization', table_name)
        AND table_name = $1
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT fk_%I_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE', table_name, table_name);
    END IF;

    -- Create index if it doesn't exist
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_organization_id ON %I(organization_id)', table_name, table_name);

    RAISE NOTICE '✅ Added organization_id to %', table_name;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Error with %: %', table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

\echo 'Adding organization_id to Patient-Related tables...'
SELECT add_org_id_to_table('medical_records');
SELECT add_org_id_to_table('allergies');
SELECT add_org_id_to_table('vital_signs');
SELECT add_org_id_to_table('consultation_notes');
SELECT add_org_id_to_table('diagnosis');

\echo ''
\echo 'Adding organization_id to Billing & Finance tables...'
SELECT add_org_id_to_table('bills');
SELECT add_org_id_to_table('claims');
SELECT add_org_id_to_table('policies');

\echo ''
\echo 'Adding organization_id to Lab Services tables...'
SELECT add_org_id_to_table('lab_orders');
SELECT add_org_id_to_table('lab_order_items');
SELECT add_org_id_to_table('lab_results');
SELECT add_org_id_to_table('lab_samples');
SELECT add_org_id_to_table('lab_tests');

\echo ''
\echo 'Adding organization_id to Inpatient tables...'
SELECT add_org_id_to_table('wards');
SELECT add_org_id_to_table('rooms');
SELECT add_org_id_to_table('beds');
SELECT add_org_id_to_table('admissions');
SELECT add_org_id_to_table('nursing_notes');
SELECT add_org_id_to_table('vital_sign');
SELECT add_org_id_to_table('medication_administration');
SELECT add_org_id_to_table('doctor_notes');
SELECT add_org_id_to_table('discharge_summaries');

\echo ''
\echo 'Adding organization_id to Pharmacy tables...'
SELECT add_org_id_to_table('medicines');
SELECT add_org_id_to_table('prescriptions');
SELECT add_org_id_to_table('prescription_items');
SELECT add_org_id_to_table('medicine_transactions');
SELECT add_org_id_to_table('stock_movements');
SELECT add_org_id_to_table('stock_alerts');

\echo ''
\echo 'Adding organization_id to Communication tables...'
SELECT add_org_id_to_table('messages');
SELECT add_org_id_to_table('notifications');
SELECT add_org_id_to_table('reminders');
SELECT add_org_id_to_table('feedback');
SELECT add_org_id_to_table('health_articles');

\echo ''
\echo 'Adding organization_id to Request & Support tables...'
SELECT add_org_id_to_table('emergency_requests');
SELECT add_org_id_to_table('callback_requests');

\echo ''
\echo 'Adding organization_id to Procurement tables...'
SELECT add_org_id_to_table('suppliers');
SELECT add_org_id_to_table('purchase_orders');

\echo ''
\echo 'Adding organization_id to Appointment & Availability tables...'
SELECT add_org_id_to_table('availability_slots');
SELECT add_org_id_to_table('appointment_history');

\echo ''
\echo 'Adding organization_id to Consultation tables...'
SELECT add_org_id_to_table('triage');
SELECT add_org_id_to_table('telemedicine_sessions');

\echo ''
\echo 'Adding organization_id to Other tables...'
SELECT add_org_id_to_table('reports');

\echo ''
\echo '✅ Migration completed!'
\echo ''
\echo 'Verifying tables with organization_id:'
SELECT COUNT(DISTINCT table_name) as total_tables
FROM information_schema.columns
WHERE column_name = 'organization_id' AND table_schema = 'public';

\echo ''
\echo 'Tables with organization_id:'
SELECT table_name
FROM information_schema.columns
WHERE column_name = 'organization_id' AND table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- Cleanup
DROP FUNCTION IF EXISTS add_org_id_to_table(TEXT);
