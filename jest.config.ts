import type { JestConfigWithTsJest } from 'ts-jest'

const conf: JestConfigWithTsJest = {
  verbose: true,
  // testMatch: ['<rootDir>/**/*.spec.ts'],

  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/packages/**/src/**'],
  detectOpenHandles: true,
  detectLeaks: false,
  forceExit: true,
  projects: [
    {
      preset: 'ts-jest/presets/default-esm',
      displayName: 'secure-communication-kit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/packages/secure-communication-kit/**/*.(spec|test).ts?(x)']
      // other configuration options specific to the package
    },

    {
      preset: 'ts-jest',
      displayName: 'securepeerjs',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/packages/securepeerjs/**/*.(spec|test).ts?(x)']

    //   // other configuration options specific to the package
    },

    {
      preset: 'ts-jest',
      displayName: 'securepeerserver',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/packages/securepeerserver/**/**.(spec|test).ts?(x)'],
      detectLeaks: false,
      detectOpenHandles: true

      // other configuration options specific to the package
    },

    {
      preset: 'ts-jest',
      displayName: 'securepeerkey-bip',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/packages/securepeerkey-bip/**/*.(spec|test).ts?(x)']
      // other configuration options specific to the package
    },
    {
      preset: 'ts-jest',
      displayName: 'securepushserver',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/packages/securepushserver/**/*.(spec|test).ts?(x)'],
      // other configuration options specific to the package
      detectLeaks: false,
      detectOpenHandles: true
    },
    {
      preset: 'ts-jest',
      displayName: 'securepushjs',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/packages/securepushjs/**/*.(spec|test).ts?(x)']
      // other configuration options specific to the package
    }
  ]

}

export default conf
