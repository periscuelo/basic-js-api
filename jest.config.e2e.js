export default {
  roots: ["<rootDir>/src/resources"],
  testMatch: ["**/*.e2e.spec.js"],
  testEnvironment: "node",
  transform: {
    "^.+\\.js$": ["babel-jest", { configFile: "./babel.config.js" }],
  },
  collectCoverage: false,
  testTimeout: 30000
};
