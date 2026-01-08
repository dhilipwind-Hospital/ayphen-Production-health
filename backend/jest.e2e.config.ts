import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/tests/e2e/**/*.e2e.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  roots: ['<rootDir>'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/e2e/jest.setup.ts'],
  globalSetup: '<rootDir>/src/tests/e2e/globalSetup.ts',
  globalTeardown: '<rootDir>/src/tests/e2e/globalTeardown.ts',
  verbose: true,
  testTimeout: 30000,
};

export default config;
