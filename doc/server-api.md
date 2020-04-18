This file describes the REST-like API provided by the Server.

# Unversioned API Methods

##### GET `/info`

* Authenticated? no
* Query parameters:
* Body (`POST` only):
* Description: Generates a simple, text-based info page
* Response: Info page as text

##### GET `/oauth_login`

* Authenticated? no
* Query parameters:
    * `redirect`: The URL of the landing page, which is called after successful authentication.
* Body (`POST` only):
* Description: Performs the OAuth authentication.
* Response: Redirect to OSM Login page with `redirect` and `config` query parameters set.

##### GET `/oauth_callback`

* Authenticated? no
* Query parameters:
    * `config`: The key to the user configuration which was set from `/oauth_login` when redirecting.
    * `redirect`: The URL of the landing page, which is called after successful authentication.
* Body (`POST` only):
* Description: Performs the OAuth authentication
* Response: Redirect to OSM Login page.

# v1.1

Used by application releases:

* 0.6.0

##### Authentication
For all the following API routes, the `Authentication` header must contain a valid base64 encoded token (without leading "Bearer" or something).

### Projects

##### DELETE `/v1.1/projects/{id}`

Deletes a specific project with id `{id}`. The requesting user (specified by the token) must be the owner of the project.

##### GET `/v1.1/projects/{id}/tasks`

Gets all tasks of a specific project with id `{id}`. The requesting user (specified by the token) must be part of the project.

##### DELETE `/v1.1/projects/{id}/users`

The requesting user (specified by the token) leaves the project with the id `{id}`. 

##### POST `/v1.1/projects/{id}/users?user={user}`

The user `{user}` will be added to the project with the id `{id}`. Only the owner of the project can make this request.

##### GET `/v1.1/projects`
(as in v1)

##### POST `/v1.1/projects`
(as in v1)

### Tasks

##### POST `/v1.1/tasks/{id}/assignedUser`

Assigns the requesting user (specified by the token) to the task with id `{id}`. The requesting user has to be part of the project this task belongs to.

##### DELETE `/v1.1/tasks/{id}/assignedUser`

Unassigns the requesting user (specified by the token) from the task with id `{id}`. Only the assigned user can unassign itself, you cannot unassign another user.

##### POST `/v1.1/tasks/{id}/processPoints?process_points={points}`

Sets the amount of process points of the task with id `{id}` to `{points}`. Only the currently assigned user can do this request.

##### POST `/v1.1/tasks`
(as in v1)

# v1

Used by application releases:

* 0.5.0
* 0.5.1
* 0.5.2

### Projects

##### GET `/v1/projects`

* Authenticated<sup>*</sup>? yes
* Query parameters: -
* Body (`POST` only): -
* Description: Gets all projects for the user making the request.
* Response: List of projects as JSON.

##### POST `/v1/projects`
 
* Authenticated<sup>*</sup>? yes
* Query parameters: -
* Body (`POST` only): Project as JSON. This is a draft, the fields `id` and `user` are not evaluated and used, they are set by the server
* Description: Adds a new project.
* Response: The new project as JSON.

##### POST `/v1/projects/users`

* Authenticated<sup>*</sup>? yes
* Query parameters: 
    * `user`: The user to add to the project.
    * `project`: The project ID.
* Body (`POST` only): -
* Description: Add the given user to the project.
* Response: The updated Project as JSON.

### Tasks

##### GET `/v1/tasks`

* Authenticated<sup>*</sup>? yes
* Query parameters:
    * `task_ids`: A comma separated list of task IDs.
* Body (`POST` only): -
* Description: Reads the wanted tasks. A user can only request tasks of projects where the user is invited to.
* Response: The tasks as JSON.

##### POST `/v1/tasks`

* Authenticated<sup>*</sup>? yes
* Query parameters: -
* Body (`POST` only): Task as JSON. This is a draft, the `id` field is not evaluated.
* Description: Adds a new task.
* Response: The new task as JSON.

##### POST `/task/assignedUser`

* Authenticated<sup>*</sup>? yes
* Query parameters:
    * `id`: The ID of the task the user should be assigned to.
* Body (`POST` only): -
* Description: Assigns the user making the request to the task. It'g not possible to assign someone else to a task.
* Response: The updated task as JSON.

##### DELETE `/task/assignedUser`

* Authenticated<sup>*</sup>? yes
* Query parameters:
    * `id`: The ID of the task the user should be unassigned from.
* Body (`POST` only): -
* Description: Unassigns the user making the request from the task. It'g not possible to unassign someone else from a task.
* Response: The updated task as JSON.

##### POST `/task/processPoints`

* Authenticated<sup>*</sup>? yes
* Query parameters:
    * `id`: The ID of the task the process points should be set on.
    * `process_points`: The new amount of process points. Must be within the range of 0 to the maximum amount of process points.
* Body (`POST` only): -
* Description: Sets the amount of process points.
* Response: The updated task as JSON.

<small><sup>*</sup>The `Authentication` Header must contain a valid base64 encoded token (without leading "Bearer" or something).</small>

# Before v1

No versioning was used here. Used by all versions until 0.6.0 and since 0.3.0 (where this server was introduced):

* 0.3.0
* 0.3.1
* 0.4.0
* 0.5.0

Versions 0.1.0 and 0.2.0 had no server.

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

A **minor version** is increased when the functionality is basically the same but some minor changes took place (e.g. adding an optional parameter, etc.) which to not break the compatibility.

## Compatibility

Upgrading to a higher **minor version** to a following one (e.g. from v2.0 to v2.3) should always be possible.

There's no guarantee that an upgrade to a higher **major version** (e.g. from v3.1 to v4) will work as well. 