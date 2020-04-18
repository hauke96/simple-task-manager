<img align="right" width="64px" src="https://raw.githubusercontent.com/hauke96/simple-task-manager/master/client/src/assets/icon.png">

# SimpleTaskManager

This is a simple structured task manager for e.g. [OpenStreetMap (OSM)](https://openstreetmap.org).
Take a look at the latest version on [https://stm.hauke-stieler.de/](https://stm.hauke-stieler.de/).

The idea behind this project is to create a simple and general purpose tasking manager for all kind of geo-related things (e.g. mapping in OSM, photography of old buildings, etc.).

A tasking manager is an application which helps multiple mappers to work in the same region without interfering with each other.
Usually such region is divided into squares and only one mapper at a time works on one square.

<img align="center" style="width: 100%; max-width: 1128px;" src="https://raw.githubusercontent.com/hauke96/simple-task-manager/dev/screenshot.png">

# Usage workflow

A user can create a *project* with consists of a large region on the map (e.g. a city district).
This region is divided into smaller areas (e.g. 1x1km large squares) the so called *tasks*.
One user at a time can now work on such task and this user is able to update the process of the task by setting the *process points*.
Once the region is fully mapped, the user finishes it by setting all process points and maybe starts working on the next task.

The owner of a project is also able to invite others to a project.
When one user works on a task, no other user is able to also update the process of that task.
This prevents conflicts in mapping as every user has a distinct task to work on.

# Development

Development takes place on the `dev` branch or on separate feature branches.
The `master` branch only contains released versions.

## Client

The client is an Angular based web application and can be found in the `client/` folder.
The `README.md` in this folder gives you further instruction on the setup, running, building, etc.

## Server

The server is written in go (aka golang) and can be found in the `server/` folder.
The `README.md` there also gives you instructions on setup, running, building, etc.

## Deployment

The `docker-compose.yml` creates three docker container for the client, server and the database.
Because the container build and test themselves, starting everything probably takes a few minutes.

During development I recommend to manually start the client and server (see according `README.md` files) and just use the docker container for the database.

# Contribute

Currently there are no guidelines. Feel free to create issues or a pull request.

**Keep in mind:** Development takes place on the `dev` branch or on separate feature branches.

# Feature ideas for future releases

*(See also the issue and project pages)*

* [ ] Better shape handling when creating a project (e.g. delete or move drawn shapes)
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