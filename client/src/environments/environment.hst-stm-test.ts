const baseUrl = "http://osm.hauke-stieler.de/stm-test";

export const environment = {
  production: true,
  oauth_landing: document.location.origin + '/oauth-landing',

  url_projects: baseUrl + "/projects",
  url_tasks: baseUrl + "/tasks",
  url_task_assignedUser: baseUrl + "/task/assignedUser",
  url_task_processPoints: baseUrl + "/task/processPoints"
};

