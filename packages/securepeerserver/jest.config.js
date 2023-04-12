'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const conf = {
  testMatch: ['**/test/**.spec.ts'],
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['**/src/**'],
  forceExit: true,
  detectLeaks: false,
  detectOpenHandles: true
}
exports.default = conf
