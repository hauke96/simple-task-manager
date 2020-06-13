<img align="right" width="64px" src="https://raw.githubusercontent.com/hauke96/simple-task-manager/master/client/src/assets/icon.png">

# SimpleTaskManager

This is a simple structured task manager for e.g. [OpenStreetMap (OSM)](https://openstreetmap.org).
Take a look at the latest version on [https://stm.hauke-stieler.de/](https://stm.hauke-stieler.de/).

The idea behind this project is to create a simple and general purpose tasking manager for all kind of geo-related things (e.g. mapping in OSM, photography of old buildings, etc.).

A tasking manager is an application which helps multiple people to work in the same region without interfering with each other.
Usually such region is divided into squares and only one mapper at a time works on one square.

<img align="center" style="width: 100%; max-width: 1128px;" src="https://raw.githubusercontent.com/hauke96/simple-task-manager/dev/screenshot.png">

# How does it work?

A user can create a **project** with consists of a large region on the map (e.g. a city district).
This region is divided into smaller areas (e.g. 1x1km large squares) the so called **tasks**.
It is also possible to create tasks by **importing geometries** from a file (e.g. a GeoJSON file).

One user at a time can now work on such task and this user is able to update the **process** of the task by setting the **process points**.
Once the region is fully mapped, the user finishes it by setting the process points to the maximum value and maybe starts working on the next task.

The owner of a project is also able to invite others to a project.
When one user works on a task, no other user is able to also update the process of that task.

# Yet another tasking manager?
*(aka: What's wrong with the HOT Tasking Manager?)*

I personally don't like the HOT Tasking Manager that much for several reasons (not that intuitive UI, iD integration, automatically getting unassigned from a task after some time, etc.).

Alternatives are e.g. the MapCraft tasking manager, which is very old and doesn't even compile anymore when you clone the repo.
Setting up MapCraft is therefore not possible anymore (if you don't want to spend hours and hours on old PHP code with broken dependencies).

So yes, basically this is another tasking manager, however, this is not a clone of an existing one.

# Documentation

Development information can be found in the `client` and `server` folder.

Additional technical documentation (deployment, api, security, architecture, etc.) can be found in the `doc` folder.

# Contribute

Currently there are no real guidelines. Feel free to create an **issue** or **pull request**.

**Wanna start coding?** Take a look at `doc/development/README.md` on how to get started.