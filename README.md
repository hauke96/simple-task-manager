# simple-task-manager

Prototype of a simple OpenStreetMap tasking manager.
Take a look at the latest version at [http://osm.hauke-stieler.de/stm-test](http://osm.hauke-stieler.de/stm-test).

The idea behind this is to create a simple and general purpose tasking manager.
A tasking manager is an application which helps multiple mappers to work in the same region without interfering with each other.
Usually such region is divided into squares and only one mapper at a time works on one square.

## The idea

A user can create a *project* with constists of a large region on the map.
This region is devided into smaller parts the so called *tasks*.
One user at a time can now work on such task and this user is able to update the process of the task.
Once the task is done, the user finishes it and maybe starts working on the next task.

In the end of this prototype, a user should be able to invite others to a project.
When one user works on a task, no other user should be able to also update the process of that task.
This should prevent conflicts in mapping as every user has a distinct task to work on.

## Stages of the prototype

### Stage 1

Stage 1 consists of the basic functionality to only see things.
No creation or fancy "wow-effect-features" involved here.

* [x] Authentication (login, logout, redirects, guards, etc.)
* [x] Overview of all projects (list and click to see details)
* [x] Overview of tasks (list of all tasks, click to see details and map etc.)
* [x] Manage tasks
  * [x] Set "process points" (e.g. setting it to 230/500)
  * [x] Automatically mark/highlight task as "finished" when all points are reached

### Stage 2

Stage 2 consists of the more interactive features like assigning yourself to a task or create new tasks.

* [x] Manage tasks
  * [x] Assign yourself to a task (even though you're currently alone, no others should then be able to change anything on that task e.g. setting points)
  * [x] Un-assign from task
* [ ] Create project
  * [x] Draw area on map
  * [ ] Divide this area into squares of use defined size (-> so called tasks)
  * [ ] Define how many "process points" are needed to complete a task

### Stage 3

Stage 3 creates the server to persist everything.

* [ ] Server
  * [ ] Authentication (send OAuth token to server with each request, server checks token)
  * [ ] Get project with tasks for a user
  * [ ] Store project when created
  * [ ] Assign user to task
  * [ ] Set points on task

### Stage 4

Stage 4 finally adds support for multiple users.
This will enable you to invite other to tasks.

* [ ] Invite user
  * [ ] Control to enter username and to invite user
  * [ ] Store information on server so that the invited user can see the project in the list
  * [ ] Make sure that only one user at a time can be assigned to and can modify a task

### Beyond the prototype

Things that would be nice but are not necessary for a prototype.

* [ ] Confirm invitation
* [ ] Remove user from project
* [ ] Add tasks to running project
* [ ] Leave comments on a task
* [ ] Chat in the project
* [ ] Validation of tasks
  * [ ] Choose between optional validations (uses can mark a task as valid but that doesn't change anything) and mandatory validations (at leaxt *x* validations are needed to finish a task)
* [ ] Load regions
  * [ ] From `.osm` and/or `.gpx` file
  * [ ] From overpass-query / -result

## Client

The client is an angular based web application and can be found in the `client` folder.
The readme in this folder gives you further instruction on the setup, running, building, etc.

## Server

*Currently no server exists. This will be something for the later development.*
