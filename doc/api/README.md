This file describes the REST-like API provided by the Server.

# API information

## v2.6

**Changes in v2.6**
* The `ProjectDto` now contains the tasks
* Each task now contains the `Name` attribute

Everything else is the same as in v2.5.

## Authentication

**All** API methods (except the authentication themselves) have to be authenticated: The `Authorization` header must contain a valid base64 encoded token (without leading "Bearer" or something):

```
Authorization: eyJ2...In0=
```

## Updates via websockets

Connect to `/{version}/updates` and receive updates for the requesting user.

### Authentication

This endpoint, like all other endpoints below as well, needs a valid token.
The token must be set in the `Sec-WebSocket-Protocol` header (not the `Authorization` header like in normal REST calls).

### Data protocol

Every update is packed into a message of the following format:
```json
{
  "type": <type>,
  "data": <data>
}
```

* `<type>` is either `project_added`, `project_updated` or `project_deleted` as specified by the `MessageType_...` variables from the `websocket/websocket.go` file
* `<id>` is the id of the project that has been added/changed/removed.
  * For `project_added` and `project_updated` its a whole project without tasks
  * For `project_deleted` it's just the project ID of the deleted project

# Developer information

## Requirements to the API

An API should offer all functionality needed to run a version of the SimpleTaskManager.
Not all versions but at least one version (which could also be an upcoming release).

If no version can (or will) use an API version, than this version can be removed.
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