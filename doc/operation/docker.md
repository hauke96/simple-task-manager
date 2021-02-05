This project uses a lot of the docker feature, including docker-compose.

I assume you're familiar with docker, so just take a look at the `docker-compose.yml` to get an idea of what container this project uses.

# Structure

We have the overall `docker-compose.yml` which contains four service definitions:

* `stm-client`: The webclient
* `stm-server`: The go-server application without the database
* `stm-db`: The database

## Image versions

The container use a specific version of an image (e.g. `postgres:12.3`) instead of general tags like `:latest`.
This ensures that a specific version of the simple task manager still builds and runs in months or even years.

# Logging

The containers are using the `journald` driver for logging.
So accessing the logs is also possible via e.g. `journalctl CONTAINER_NAME=stm-db` and the logs are appended to the journal after restarting/rebuilding the container.
For more logging commands see the [logging documentation file](./logging.md).