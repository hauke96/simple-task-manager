# SimpleTaskManager

<img align="right" width="100px" src="https://raw.githubusercontent.com/hauke96/simple-task-manager/master/client/src/assets/icon.png">

Prototype of a simple mapping tasking manager for e.g. [OpenStreetMap (OSM)](https://openstreetmap.org).

Take a look at the latest version at [https://stm.hauke-stieler.de/](https://stm.hauke-stieler.de/).

The idea behind this project is to create a simple and general purpose tasking manager for mapping in OSM.
A tasking manager is an application which helps multiple mappers to work in the same region without interfering with each other.
Usually such region is divided into squares and only one mapper at a time works on one square.

<img align="center" style="width: 100%; max-width: 1128px;" src="https://raw.githubusercontent.com/hauke96/simple-task-manager/dev/screenshot.png">

# Usage workflow

A user can create a *project* with consists of a large region on the map (e.g. a city district).
This region is divided into smaller areas (e.g. 1x1km large squares) the so called *tasks*.
One user at a time can now work on such task and this user is able to update the process of the task by setting the *process points*.
Once the region is fully mapped, the user finishes it by setting all process points and maybe starts working on the next task.

In the end of this prototype, a user should also be able to invite others to a project.
When one user works on a task, no other user should be able to also update the process of that task.
This should prevent conflicts in mapping as every user has a distinct task to work on.

# Stages of the prototype

## Stage 1

Stage 1 consists of the basic functionality to only see things.
No creation or fancy "wow-effect-features" involved here.

* [x] Authentication (login, logout, redirects, guards, etc.)
* [x] Overview of all projects (list and click to see details)
* [x] Overview of tasks (list of all tasks, click to see details and map etc.)
* [x] Manage tasks
  * [x] Set "process points" (e.g. setting it to 230/500)
  * [x] Automatically mark/highlight task as "finished" when all points are reached

## Stage 2

Stage 2 consists of the more interactive features like assigning yourself to a task or create new tasks.

* [x] Manage tasks
  * [x] Assign yourself to a task (even though you're currently alone, no others should then be able to change anything on that task e.g. setting points)
  * [x] Un-assign from task
* [x] Create project
  * [x] Draw area on map
  * [x] Divide this area into squares of use defined size (-> so called tasks)
  * [x] Define how many "process points" are needed to complete a task

## Stage 3

Stage 3 creates the server to handle and distribute everything.

* [x] Server
  * [x] Authentication (send OAuth token to server with each request, server checks token)
  * [x] Get project with tasks for a user
  * [x] Store project when created
  * [x] Assign user to task
  * [x] Unassign user to task
  * [x] Set points on task
  * [x] Request user information from server
  * [x] Store users per project (any only return project where user is part of)

## Stage 4

Stage 4 finally adds support for multiple users.
This will enable you to invite other to tasks.

* [x] Define creator of project (aka "owner")
* [x] Mark own projects
* [x] Invite user (only possible by owner)
  * [x] Enter username and to invite user
  * [x] Users should also see projects they've invited to

## Stage 5

Stage 5 finalizes things and adds the needed details to finish the prototype.

* [x] Abstract storage
* [x] Use real database (probably `postgresql`) and keep current in-memory storage (maybe useful for development)
* [x] Put Database into own docker container

### Post Stage 5
Things to do after finishing this stage (which will probably be version 1.0.0)

* [ ] Hosted version
  * [ ] Update everything
  * [ ] Automatic update of SSL certificates (#10)

## Beyond the prototype

Things that would be nice but are not necessary for a prototype.

* [ ] Better shape handling when creating a project (e.g. remove drawn shapes)
* [ ] Confirm invitation
* [ ] Remove user from project
* [ ] Add tasks to running project
* [ ] Leave comments on a task
* [ ] WebSocket connections for live updates
* [ ] Chat in the project
* [ ] Validation of tasks
  * [ ] Choose between optional validations (uses can mark a task as valid but that doesn't change anything) and mandatory validations (at least *x* validations are needed to finish a task)
* [ ] Load regions
  * [ ] From `.osm` and/or `.gpx` file
  * [ ] From overpass-query / -result
* [ ] Internal development
  * [ ] Use go modules? (may or may not be useful)
  * [x] Create Docker container for client and server

# Development

## Client

The client is an Angular based web application and can be found in the `client/` folder.
The `README.md` in this folder gives you further instruction on the setup, running, building, etc.

## Server

The server is written in go (aka golang) and can be found in the `server/` folder.
The `README.md` there also gives you instructions on setup, running, building, etc.

# Deployment

The `docker-compose.yml` creates three docker container for the client, server and the database.
Because the container build and test themselves, starting everything probably takes a few minutes.

During development I recommend to manually start the client and server (see according `README.md` files) and just use the docker container for the database.