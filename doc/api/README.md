This file describes the REST-like API provided by the Server.

# Unversioned API Methods

No Authentication needed here.

##### GET `/info`

Generates a simple, text-based info page.

##### GET `/oauth_login?redirect={url}`

Gets OSM login token and therefore redirects to the OSM Login page with `redirect` and `config` query parameters set.
The `{url}` query parameter is the URL of the Simple-Task-Manager landing page, which is called after successful authentication.

##### GET `/oauth_callback?config={cfg}&redirect={url}`

Performs the OAuth authentication by getting an OSM access token.
The `{cfg}` parameter value is the key to the user configuration which was set from `/oauth_login` when redirecting.
The `{url}` parameter value is the URL of the Simple-Task-Manager landing page, where this call redirects to after successful authentication.
When redirecting to `{url}`, the `token={token}` query parameter is set so that the client can get the token from within the URL.

# v2.3

**New in v2.3**
* Websockets under `/v2.3/updates`

Everything else is the same as in v2.2.

### Authentication

**All** API methods have to be authenticated: The `Authorization` header must contain a valid base64 encoded token (without leading "Bearer" or something):

```
Authorization: eyJ2...In0=
```

### Updates via websockets

Connect to `/v2.3/updates` and receive updates for the requesting user.

#### Authentication

This endpoint, like all other endpoints below as well, needs a valid token.
The token must be set in the `Sec-WebSocket-Protocol` header (not the `Authorization` header like in normal REST calls).

#### Data protocol

Every update is packed into a message of the following format:
```json
{
  "type": <type>,
  "data": <data>
}
```

* `<type>` is either `project_added`, `project_updated` or `project_deleted` as specified by the `MessageType_...` variables from the `websocket/websocket.go` file
* `<data>` is the payload data sent to the client
  * For `project_added` and `project_updated` its a whole project without tasks
  * For `project_deleted` it's just the project ID of the deleted project

### Projects

##### GET  `/v2.3/projects`

Gets all projects for the requesting user.

##### POST  `/v2.3/projects`

Adds the project as given in the body:

```json
{
  "id":"",
  "name":"foo",
  "description":"Lorem ipsum ...",
  "taskIds":["25"],
  "users":["1234"],
  "owner":"1234",
  "needsAssignment":true
}
```

The `id` field must stay empty, it's filled by the server.

The `needsAssignment` flag enables/disables the need for users to assign to a task in order to set process points on a task.
When set to `false` users can modify a task without being assigned to it.

##### GET  `/v2.3/projects/{id}`

Returns the project with the given ID. The requesting user (specified by the token) must be **member** of the project.

##### DELETE  `/v2.3/projects/{id}`

Deletes the project with the given ID. The requesting user (specified by the token) must be **owner** of the project.

##### PUT `/v2.3/project/{id}/name`

Updates the name of the given project. The name must be in the request body. The requesting user (specified by the token) must be **owner** of the project.

##### PUT`/v2.3/project/{id}/description`
         
Updates the description of the given project. The description must be in the request body. The requesting user (specified by the token) must be **owner** of the project.

##### POST `/v2.3/projects/{id}/users?uid={uid}`

Adds the user with id `{uid}` to the project. The requesting user (specified by the token) must be **owner** of the project.

##### DELETE `/v2.3/projects/{id}/users`

Removes the requesting user (specified by the token) from the project. The requesting user (specified by the token) must be **member** of the project.

##### DELETE `/v2.3/projects/{id}/users/{uid}`

Removes the user with the id `{uid}` from the project. The requesting user (specified by the token) must either be the **owner** of the project or must be removing himself.

### Tasks

##### GET  `/v2.3/projects/{id}/tasks`

Gets the tasks of project `{id}`. The requesting user (specified by the token) must be **member** of the project.

##### POST `/v2.3/tasks/{id}/assignedUser`

Assigns the requesting user (specified by the token) to the task with id `{id}`. The requesting user (specified by the token) must be **member** of the project.

##### DELETE `/v2.3/tasks/{id}/assignedUser`

Unassigns the requesting user (specified by the token) from the task with id `{id}`. When `needsAssignment=true`: Only the **assigned** user can unassign himself, you cannot unassign other users.

##### POST `/v2.3/tasks/{id}/processPoints?process_points={points}`

Sets the amount of process points of the task with id `{id}` to `{points}` which must be an integer. When `needsAssignment=true`:  Only the currently **assigned** user can do this.

##### POST `/v2.3/tasks`

Adds the task specified by the body.

```json
[
  {
    "id":"",
    "processPoints":0,
    "maxProcessPoints":100,
    "geometry": "{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[9.9,53.5],[9.92,53.55],[9.94,53.55]]]},\"properties\":{\"name\":\"Atlantis\"}}}"
  }
]
```

The `id` field must stay empty, it's filled by the server.

The `geometry` must be a valid GeoJSON string.
The `name` value in the `properties` is optional but will be displayed the clients task list.
It's okay to not specify the `properties` field, to set it to `null` or `{}`.
Only Polygons are supported, there's no guarantee that anything else will work at all.

# Developer information

## Requirements to the API

An API should offer all functionality needed to run a version of the SimpleTaskManager.
Not all versions but at least one version (which could also be an upcoming release).

If no version can (or will) use an API version, than this version can bre removed.
This for example applies to very old, insecure, unstable or testing versions.

## Code structure

All API information is within the `api` package of the server.

**`api.go`:**<br>
This file contains the creation of the routing and some logging.
It calls the `Init_v...()` function on the separate `api_v...go` files.

**`api_v...go`:**<br>
These files contain the actual mapping from path and method to go function.
This file **must not be changed** after an API has been released.
Only bug-fixes are allowed, which do not change the API.

An API version is considered as "released", when a software version had a productive release.
Example: Application version 1.3 introduced API v4, then this API version is considered "released" when application version 1.3 has been released.

## Versioning

The version has the format `vX.Y`.

* `X`: Major version
* `Y`: Minor version

A **major version** is increased when the compatibility to the previous API breaks.

A **minor version** is increased when the functionality is basically the same but some minor changes took place (e.g. adding an optional parameter, etc.) which do not break the compatibility.

## Compatibility

Upgrading to a higher **minor version** to a following one (e.g. from v2.0 to v2.3) should always be possible.

There's no guarantee that an upgrade to a higher **major version** (e.g. from v3.1 to v4) will work as well. 