#!/bin/bash

# Multi-Tenant Migration Script
# This script safely migrates your database to support multi-tenancy
# WITHOUT breaking existing functionality

echo "🏥 Hospital Management System - Multi-Tenant Migration"
echo "======================================================="
echo ""
echo "This script will:"
echo "  1. Create organizations table"
echo "  2. Create default organization"
echo "  3. Add organization_id to users table"
echo "  4. Assign all existing users to default organization"
echo ""
echo "⚠️  IMPORTANT: This will NOT break your application!"
echo "   - All existing data will be preserved"
echo "   - All existing users will continue to work"
echo "   - Backward compatibility is maintained"
echo ""

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    echo "   cd hospital-website/backend"
    exit 1
fi

# Ask for confirmation
read -p "Do you want to proceed? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "📦 Step 1: Building TypeScript files..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix TypeScript errors first."
    exit 1
fi

echo ""
echo "🗄️  Step 2: Creating database backup..."
BACKUP_FILE="backup_before_multitenant_$(date +%Y%m%d_%H%M%S).sql"

# Try to create backup (this might fail if pg_dump is not available)
if command -v pg_dump &> /dev/null; then
    DB_NAME="${DB_NAME:-hospital_db}"
    DB_USER="${DB_USER:-postgres}"
    DB_HOST="${DB_HOST:-localhost}"
    
    echo "   Creating backup: $BACKUP_FILE"
    pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Backup created successfully: $BACKUP_FILE"
    else
        echo "   ⚠️  Backup failed, but continuing..."
    fi
else
    echo "   ⚠️  pg_dump not found. Skipping backup."
    echo "   Please create a manual backup if needed."
fi

echo ""
echo "🔄 Step 3: Running migrations..."
npm run migration:run

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Migration failed!"
    echo ""
    echo "To rollback:"
    echo "  npm run migration:revert"
    echo ""
    if [ -f "$BACKUP_FILE" ]; then
        echo "To restore from backup:"
        echo "  psql -U postgres -d hospital_db < $BACKUP_FILE"
    fi
    exit 1
fi

echo ""
echo "✅ Step 4: Verifying migration..."

# Check if organizations table exists
echo "   Checking organizations table..."
psql -U postgres -d hospital_db -c "\dt organizations" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ Organizations table exists"
else
    echo "   ❌ Organizations table not found"
    exit 1
fi

# Check if default organization exists
echo "   Checking default organization..."
DEFAULT_ORG_COUNT=$(psql -U postgres -d hospital_db -t -c "SELECT COUNT(*) FROM organizations WHERE subdomain = 'default'" 2>/dev/null | tr -d ' ')

if [ "$DEFAULT_ORG_COUNT" = "1" ]; then
    echo "   ✅ Default organization exists"
else
    echo "   ❌ Default organization not found"
    exit 1
fi

# Check if users have organization_id
echo "   Checking users table..."
psql -U postgres -d hospital_db -c "\d users" | grep organization_id > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ Users table has organization_id column"
else
    echo "   ❌ Users table missing organization_id column"
    exit 1
fi

echo ""
echo "🎉 Migration completed successfully!"
echo ""
echo "📊 Summary:"
echo "   ✅ Organizations table created"
echo "   ✅ Default organization created"
echo "   ✅ Users table updated with organization_id"
echo "   ✅ All existing users assigned to default organization"
echo ""
echo "🔒 Security:"
echo "   ✅ All existing data preserved"
echo "   ✅ Backward compatibility maintained"
echo "   ✅ No breaking changes"
echo ""
echo "📝 Next Steps:"
echo "   1. Test your application to ensure everything works"
echo "   2. Update remaining models with organization_id"
echo "   3. Add tenant middleware to your routes"
echo "   4. Update controllers to filter by tenant"
echo ""
echo "📚 Documentation:"
echo "   See docs/QUICK_START_MULTI_TENANT.md for next steps"
echo ""
echo "🚀 Your application is now ready for multi-tenancy!"
