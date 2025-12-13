module.exports = {
  testEnvironment: 'node',
  rootDir: '..',
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.js',
    '<rootDir>/tests/contracts/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/setup.js'],
  testTimeout: 30000, // 30 seconds for API calls
  verbose: true,
  collectCoverage: false, // Integration tests don't need coverage
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Kiaan WMS Integration Test Report',
      outputPath: '<rootDir>/tests/test-results/integration-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true
    }],
    ['jest-junit', {
      outputDirectory: '<rootDir>/tests/test-results',
      outputName: 'integration-results.xml'
    }]
  ],
  // Don't transform node_modules
  transformIgnorePatterns: ['/node_modules/'],
  // Global variables available in tests
  globals: {
    TEST_TIMEOUT: 30000
  }
};
