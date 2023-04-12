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
      preset: 'ts-jest',
      displayName: 'securepeerjs',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/packages/securepeerjs/**/*.(spec|test).ts?(x)']

    //   // other configuration options specific to the package
    },

    {
      preset: 'ts-jest/presets/default-esm',
      displayName: 'securepeer',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/packages/securepeerserver/**/**.(spec|test).ts?(x)'],
      detectLeaks: false,
      detectOpenHandles: true

      // other configuration options specific to the package
    },
    {
      preset: 'ts-jest/presets/default-esm',
      displayName: 'securepeerkey',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/packages/securepeerkey/**/*.(spec|test).ts?(x)']
      // other configuration options specific to the package
    },
    {
      preset: 'ts-jest/presets/default-esm',
      displayName: 'securepeerkey-bip',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/packages/securepeerkey-bip/**/*.(spec|test).ts?(x)']
      // other configuration options specific to the package
    }
  ]

}

export default conf
