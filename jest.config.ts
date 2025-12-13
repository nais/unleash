import type { Config } from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  // Run setup file for test timeout configuration
  setupFilesAfterEnv: ['<rootDir>/packages/shared/src/jest-setup.ts'],
};
export default config;
