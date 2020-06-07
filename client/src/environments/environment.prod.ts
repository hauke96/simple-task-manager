const baseUrl = document.location.protocol + '//' + document.location.hostname + ':8080';
const usedApi = 'v2.3';

export const environment = {
  production: true,
  oauth_landing: document.location.origin + '/oauth-landing',
  osm_api_url: 'https://api.openstreetmap.org/api/0.6',

  url_auth: baseUrl + '/oauth_login',
  url_projects: baseUrl + '/' + usedApi + '/projects',
  url_projects_by_id: baseUrl + '/' + usedApi + '/projects/{id}',
  url_projects_users: baseUrl + '/' + usedApi + '/projects/{id}/users',
  url_tasks: baseUrl + '/' + usedApi + '/tasks',
  url_task_assignedUser: baseUrl + '/' + usedApi + '/tasks/{id}/assignedUser',
  url_task_processPoints: baseUrl + '/' + usedApi + '/tasks/{id}/processPoints'
};
