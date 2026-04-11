module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs', esModuleInterop: true } }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageReporters: ['lcov', 'text'],
  coverageDirectory: 'coverage',
  testMatch: ['**/__tests__/**/*.test.ts'],
  passWithNoTests: true,
};
