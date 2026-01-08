import 'reflect-metadata';

function envOr(defaultVal: string, ...keys: string[]) {
  for (const k of keys) {
    const v = process.env[k];
    if (v) return v;
  }
  return defaultVal;
}

module.exports = async () => {
  // Ensure test env
  process.env.NODE_ENV = 'test';

  // Map TEST_DB_* to DB_* so the existing AppDataSource picks them up
  process.env.DB_HOST = envOr('localhost', 'TEST_DB_HOST', 'DB_HOST');
  process.env.DB_PORT = envOr('5433', 'TEST_DB_PORT', 'DB_PORT');
  process.env.DB_USER = envOr('postgres', 'TEST_DB_USER', 'DB_USER');
  process.env.DB_PASSWORD = envOr('postgres', 'TEST_DB_PASSWORD', 'DB_PASSWORD');
  process.env.DB_NAME = envOr('hospital_db_test', 'TEST_DB_NAME', 'DB_NAME');

  // JWT secret for tests
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

  // Debug: print DB env for diagnostics
  // eslint-disable-next-line no-console
  console.log('[globalSetup] DB_HOST=%s DB_PORT=%s DB_USER=%s DB_NAME=%s', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_USER, process.env.DB_NAME);

  // Initialize the data source and drop schema to start clean
  const { AppDataSource } = await import('../../config/database');
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  // Drop and re-sync schema for a clean test database
  await AppDataSource.synchronize(true);
};
