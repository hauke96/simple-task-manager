const baseUrl = document.location.protocol + '//' + document.location.hostname + ':8080';
const usedApi = 'v2.7';

export const environment = {
  production: false,
  test_mode: false,
  oauth_landing: document.location.origin + '/oauth-landing',
  osm_api_url: 'http://localhost:9000/api/0.6',

  base_url: baseUrl,
  url_auth: baseUrl + '/oauth_login',
  url_config: baseUrl + '/' + usedApi + '/config',
  url_projects: baseUrl + '/' + usedApi + '/projects',
  url_projects_by_id: baseUrl + '/' + usedApi + '/projects/{id}',
  url_projects_users: baseUrl + '/' + usedApi + '/projects/{id}/users',
  url_projects_name: baseUrl + '/' + usedApi + '/projects/{id}/name',
  url_projects_description: baseUrl + '/' + usedApi + '/projects/{id}/description',
  url_projects_export: baseUrl + '/' + usedApi + '/projects/{id}/export',
  url_projects_import: baseUrl + '/' + usedApi + '/projects/import',
  url_tasks: baseUrl + '/' + usedApi + '/tasks',
  url_task_assignedUser: baseUrl + '/' + usedApi + '/tasks/{id}/assignedUser',
  url_task_processPoints: baseUrl + '/' + usedApi + '/tasks/{id}/processPoints',
  url_updates: 'ws://' + document.location.hostname + ':8080' + '/' + usedApi + '/updates'
};
