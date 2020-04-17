const baseUrl = document.location.protocol + '//' + document.location.hostname + ':8080';
const usedApi = 'v1.1';

export const environment = {
  production: false,
  oauth_landing: document.location.origin + '/oauth-landing',

  url_auth: baseUrl + '/oauth_login',
  url_projects: baseUrl + '/' + usedApi + '/projects',
  url_projects_users: baseUrl + '/' + usedApi + '/projects/{id}/users',
  url_tasks: baseUrl + '/' + usedApi + '/tasks',
  url_task_assignedUser: baseUrl + '/' + usedApi + '/tasks/{id}/assignedUser',
  url_task_processPoints: baseUrl + '/' + usedApi + '/tasks/{id}/processPoints'
};
