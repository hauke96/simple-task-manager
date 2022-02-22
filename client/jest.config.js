module.exports = {
  preset: "jest-preset-angular",
  setupFilesAfterEnv: [
    "<rootDir>/jest/setup-jest.ts"
  ],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/dist/",
    "<rootDir>/jest/",
  ],
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!ol|@angular|@ngx-translate|geotiff|observable-fns).+\.js$"
  ],
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
      stringifyContentPathRegex: "\\.html$"
    }
  },
  modulePaths: [
    "<rootDir>"
  ],
  collectCoverage: true,
  coverageReporters: ["html", "text"],
  cacheDirectory: "./jestCache"
};
