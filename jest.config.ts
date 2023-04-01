import type { JestConfigWithTsJest } from 'ts-jest'

const conf: JestConfigWithTsJest = {

  verbose: true,
  testMatch: ['*/**/*.spec.ts'],
  preset: 'ts-jest'
}

export default conf
