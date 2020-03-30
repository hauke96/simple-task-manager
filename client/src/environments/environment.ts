// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

const baseUrl = "http://localhost:8080";

export const environment = {
  production: false,
  oauth_consumer_key: 'TWaSD2RpZbtxuV5reVZ7jOQNDGmPjDux2BGK3zUy',
  oauth_secret: 'a8K9wAU4Z8v8G7ayxnOpjnsLknkW72Txh62Nsu1C',
  oauth_landing: '/oauth-landing',
  osm_auth_url: 'https://master.apis.dev.openstreetmap.org',

  url_projects: baseUrl + "/projects",
  url_tasks: baseUrl + "/tasks",
  url_task_assign: baseUrl + "/task/assign"
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
