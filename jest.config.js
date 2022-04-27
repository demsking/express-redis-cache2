module.exports = {
  setupFilesAfterEnv: ['./jest.setup.redis-mock.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.js',
    '!jest.config.js',
    '!test/**',
    '!example/**',
    '!express/**',
    '!coverage/**',
    '!**/node_modules/**',
  ],
  expand: true,
  moduleFileExtensions: [
    'js',
    'json',
  ],
  testMatch: ['<rootDir>/test/*.js'],
};
