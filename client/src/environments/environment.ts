const baseUrl = document.location.protocol + "://" + document.location.hostname + ":8080";

export const environment = {
  production: false,
  oauth_landing: document.location.origin + '/oauth-landing',

  url_projects: baseUrl + "/projects",
  url_tasks: baseUrl + "/tasks",
  url_task_assignedUser: baseUrl + "/task/assignedUser",
  url_task_processPoints: baseUrl + "/task/processPoints"
};
