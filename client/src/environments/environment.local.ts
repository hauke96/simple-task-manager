const baseUrl = document.location.protocol + '//' + document.location.hostname + ':8080';
const usedApi = 'v2.9';

export const environment = {
  production: false,
  oauth_landing: document.location.origin + '/oauth-landing',

  base_url: baseUrl,
  url_auth: baseUrl + '/oauth2/login',
  url_config: baseUrl + '/' + usedApi + '/config',
  url_projects: baseUrl + '/' + usedApi + '/projects',
  url_projects_by_id: baseUrl + '/' + usedApi + '/projects/{id}',
  url_projects_users: baseUrl + '/' + usedApi + '/projects/{id}/users',
  url_projects_name: baseUrl + '/' + usedApi + '/projects/{id}/name',
  url_projects_description: baseUrl + '/' + usedApi + '/projects/{id}/description',
  url_projects_export: baseUrl + '/' + usedApi + '/projects/{id}/export',
  url_projects_import: baseUrl + '/' + usedApi + '/projects/import',
  url_tasks: baseUrl + '/' + usedApi + '/tasks',
  url_task: baseUrl + '/' + usedApi + '/tasks/{id}',
  url_task_assignedUser: baseUrl + '/' + usedApi + '/tasks/{id}/assignedUser',
  url_task_processPoints: baseUrl + '/' + usedApi + '/tasks/{id}/processPoints',
  url_task_comments: baseUrl + '/' + usedApi + '/tasks/{id}/comments',
  url_updates: 'ws://' + document.location.hostname + ':8080' + '/' + usedApi + '/updates'
};
