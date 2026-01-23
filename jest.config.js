export default {
  roots: ["<rootDir>/src/resources"],
  testMatch: ["**/?(*.)+(spec|test).js"],
  transform: {},
  moduleFileExtensions: ["js", "json"],
  collectCoverage: true,
  collectCoverageFrom: ["src/resources/**/*.js"],
  coverageDirectory: "coverage",
  testEnvironment: "node",
  coveragePathIgnorePatterns: [
    String.raw`/routes/index\.js$`
  ]
};
