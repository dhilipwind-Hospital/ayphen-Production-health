#!/bin/bash
# Ayphen Hospital - Production Database Setup Script
# Run this script to initialize the database on Supabase

echo "==================================="
echo "Ayphen Hospital - Database Setup"
echo "==================================="
echo ""

# Check if required environment variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_PASSWORD" ]; then
    echo "Please set the following environment variables:"
    echo "  DB_HOST     - Supabase database host (e.g., db.xxxxx.supabase.co)"
    echo "  DB_USER     - Database user (usually 'postgres')"
    echo "  DB_PASSWORD - Database password"
    echo "  DB_NAME     - Database name (usually 'postgres' for Supabase)"
    echo ""
    echo "Example:"
    echo "  export DB_HOST=db.xxxxx.supabase.co"
    echo "  export DB_USER=postgres"
    echo "  export DB_PASSWORD=your-password"
    echo "  export DB_NAME=postgres"
    exit 1
fi

DB_PORT=${DB_PORT:-5432}

echo "Connecting to database..."
echo "Host: $DB_HOST"
echo "Database: $DB_NAME"
echo ""

# Run TypeORM schema sync
echo "Running database synchronization..."
cd "$(dirname "$0")"
NODE_ENV=production DB_SYNC=true npm run build && node -e "
require('dotenv').config();
const { AppDataSource } = require('./dist/config/database');
AppDataSource.initialize()
  .then(() => {
    console.log('Database synchronized successfully!');
    return AppDataSource.synchronize(false);
  })
  .then(() => {
    console.log('Schema sync complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database sync failed:', error);
    process.exit(1);
  });
"

echo ""
echo "==================================="
echo "Database setup complete!"
echo "==================================="
