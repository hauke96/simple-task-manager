# SimpleTaskManager

Prototype of a simple mapping tasking manager for e.g. [https://openstreetmap.org](OpenStreetMap (OSM)).

Take a look at the latest version at [https://stm.hauke-stieler.de/](https://stm.hauke-stieler.de/).

The idea behind this project is to create a simple and general purpose tasking manager for mapping in OSM.
A tasking manager is an application which helps multiple mappers to work in the same region without interfering with each other.
Usually such region is divided into squares and only one mapper at a time works on one square.

# Usage workflow

A user can create a *project* with constists of a large region on the map (e.g. a city district).
This region is devided into smaller areas (e.g. 1x1km large squares) the so called *tasks*.
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

* [ ] Abstract storage
* [ ] Use real database (probably `postgresql`) and keep current in-memory storage (maybe useful for development)
* [ ] Put Database into own docker container

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
  * [ ] Choose between optional validations (uses can mark a task as valid but that doesn't change anything) and mandatory validations (at leaxt *x* validations are needed to finish a task)
* [ ] Load regions
  * [ ] From `.osm` and/or `.gpx` file
  * [ ] From overpass-query / -result
* [ ] Internal development
  * [ ] Use go modules? (may or may not be useful)
  * [x] Create Docker container for client and server

# Development

## Client

The client is an angular based web application and can be found in the `client` folder.
The readme in this folder gives you further instruction on the setup, running, building, etc.

### Run

1. Go into the package.json and change the settings as you need them (URLs, OAuth keys, etc.)
2. Go into the `client` folder
3. Execute `npm run dev` which uses the `environment.ts` file as config

### Build

Same as above but with `npm run build`.

### Configuration

Currently the client is not very mich configurable.
This has a reason: Currently the code is very simple and the authentication with the OSM servers is done by the server (s. below).

Encryption (HTTPS) and HTTP-Server configs depend on the used Server (Apache-HTTP, nginx, ...), so take a look at their documentation or at the `./client/nginx.conf` for my nginx config.

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

*You need to go throuth the "Setup" section first ;)*

Just go into the `server` folder and execute `go run .`.

### Build

*You need to go throuth the "Setup" section first ;)*

Just go into the `server` folder and execute `go build .`.

### Configuration

There are already some configuration files in the folder `./server/config/`.
Until there's further documentation, just take a look, the properties are quite simple and straight forward.

### HTTPS

I only tried it with letsencrypt certificates.
At least for them, you only need to set the following properties in your configuration (next to the others of course):

```json
{
	"server-url": "https://your.domain.com",
	"ssl-cert-file": "/etc/letsencrypt/live/your.domain.com/fullchain.pem",
	"ssl-key-file": "/etc/letsencrypt/live/your.domain.com/privkey.pem",
	...
}
```

**Important:** The `server-url` property has to begin with `https` in order to activate HTTPS.

## Docker

Client and Server can easily be started/deployed as docker containers.
Both cotainers do not clone any repo but copy the source files into the container.

The according configuration and definition of the build process are in the `./server/Dockerfile` and `./client/Dockerfile` files.
To make things easier there's also the `./docker-compose.yml` file combining the two docker files and adding port forwarding, mounts etc..

The default docker configuration uses the production configurations for the `stm.hauke-stieler.de` server, you probably want to change that.

The `stm.hauke-stieler.de` uses Ubuntu so here's a workflow for Ubuntu:

```bash
# 1. install docker, docker-compose and git
apt install docker docker-compose git

# 2. Setup letsencrypt
#    It's best to look at their guidelines and tutorials

# 3. clone repo
git clone https://github.com/hauke96/simple-task-manager.git

# 4. Go into the repo
cd simple-task-manager

# 5. Change configs to your needs

# 6. Start the whole thing
docker-compose up --build
```

There are several more CLI options, just take a look at `docker` and `docker-compose` guides/tutorials/documentation.