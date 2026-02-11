export default {
  roots: ["<rootDir>/src/resources"],
  testMatch: ["**/?(*.)+(spec|test).js"],
  testPathIgnorePatterns: [String.raw`\.e2e\.spec\.js$`],
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  testEnvironment: "node",
  collectCoverage: true,
  collectCoverageFrom: ["src/resources/**/*.js"],
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: [
    "/routes/",
    String.raw`\.e2e\.spec\.js$`
  ]
};
