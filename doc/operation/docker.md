This project uses a lot of the docker feature, including docker-compose.

I assume you're familiar with docker, so just take a look at the `docker-compose.yml` to get an idea of what container this project uses.

# Structure

We have the overall `docker-compose.yml` which contains four service definitions:

* `stm-client`: The webclient
* `stm-server`: The go-server application without the database
* `stm-db`: The database

See [stm.md](./stm.md) for a minimal example of a compose file when hosting STM yourself.

## Image versions

The container use a specific version of an image (e.g. `postgres:17`) instead of general tags like `:latest`.
This ensures that a specific version of the SimpleTaskManager still builds and runs in months or even years.

# Docker hub

To make deployment easy for everyone, pre-build images are uploaded to [docker hub](https://hub.docker.com/u/simpletaskmanager) which can be used to deploy your own instance of STM without the whole development setup on your server.

The exact deployment process is described in the [linux.md](./linux.md) file.

# Logging

The containers are using the `journald` driver for logging.
So accessing the logs is also possible via e.g. `journalctl CONTAINER_NAME=stm-db` and the logs are appended to the journal after restarting/rebuilding the container.
For more logging commands see the [logging documentation file](./logging.md).