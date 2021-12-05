// Karma configuration
// Generated on Fri Oct 01 2021 23:14:14 GMT+0200 (Mitteleuropäische Sommerzeit)

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    files: [
      './**/*.spec.ts'
    ],
    exclude: [ ],
    preprocessors: { },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/simple-task-dashboard'),
      reporters: [
        { type: 'html', subdir: 'report-html' },
        { type: 'lcov', subdir: 'report-lcov' },
        { type: 'text-summary', subdir: '.', file: 'text-summary.txt' },
      ]
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['HeadlessFirefox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      },
      HeadlessFirefox: {
        base: 'FirefoxHeadless',
        flags: [
          '-headless',
        ],
      }
    },
    singleRun: false,
    restartOnFileChange: true,
    browserNoActivityTimeout: 900 * 1000, // 15 min.
    concurrency: Infinity,
  })
}
