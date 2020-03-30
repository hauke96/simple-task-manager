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
* [x] Create project
  * [x] Draw area on map
  * [x] Divide this area into squares of use defined size (-> so called tasks)
  * [x] Define how many "process points" are needed to complete a task

### Stage 3

Stage 3 creates the server to persist everything.

* [ ] Server
  * [x] Authentication (send OAuth token to server with each request, server checks token)
  * [x] Get project with tasks for a user
  * [x] Store project when created
  * [x] Assign user to task
  * [ ] Unassign user to task
  * [ ] Set points on task
  * [ ] Request user information from server
  * [ ] Store list of projects per user<sup>*</sup>

<sup>*</sup>Store project-IDs in the user material because we know exactly what projects we have (and can check that) but we don't know what users exist (or at least it's more complicated to check and maintain).

### Stage 4

Stage 4 finally adds support for multiple users.
This will enable you to invite other to tasks.

* [ ] Invite user
  * [ ] Control to enter username and to invite user
  * [ ] Store information on server so that the invited user can see the project in the list
  * [ ] Make sure that only one user at a time can be assigned to and can modify a task

## Stage 5

Stage 5 finalizes things and adds the needed details to finish the prototype.

* [ ] Use real database (probably `postgresql`)

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
* [ ] Internal development
  * [ ] Use go modules? (may or may not be useful)
  * [ ] Create Docker container for client and server

## Client

The client is an angular based web application and can be found in the `client` folder.
The readme in this folder gives you further instruction on the setup, running, building, etc.

### Run

1. Go into the package.json and change the settings as you need them (URLs, OAuth keys, etc.)
2. Go into the `client` folder
3. Execute `npm run dev` which uses the `environment.ts` file as config

### Build

Same as above but with `npm run build`.

## Server

The server is written in go (aka *golang*) so you need to install go and setup your development environment (paths, IDE, etc.)

### Setup
This project uses some frameworks/libraries to make the development easier:

* [https://github.com/gorilla/mux](gorilla/mux) to easily create REST endpoints
* [https://github.com/kurrik/oauth1a](kurrik/oauth1a) for the OAuth1a authentication
* [https://github.com/hauke96/sigolo](hauke96/sigolo) for logging
* [https://github.com/hauke96/kingpin](hauke96/kingpin) for CLI parameter and flag parsing

You need to install these using `go get github.com/gorilla/mux` and so on.

### Run

Just go into the `server` folder and execute `go run .`.

### Build

Just go into the `server` folder and execute `go build .`.