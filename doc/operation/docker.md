This project uses a lot of the docker feature, including docker-compose.

I assume you're familiar with docker, so just take a look at the `docker-compose.yml` to get an idea of what container this project uses.

# Structure

We have the overall `docker-compose.yml` which contains four service definitions:

* `stm-base-image`: An own image to speed up client build time (s. below)
* `stm-client`: The webclient
* `stm-server`: The go-server application without the database
* `stm-db`: The database

## Image versions

The container use a specific version of an image (e.g. `postgres:12.3`) instead of general tags like `:latest`.
This ensures that a specific version of the simple task manager still builds and runs in months or even years.

# Registry (Docker Hub)

There's a `simpletaskmanager` user on the [docker hub](https://hub.docker.com/u/simpletaskmanager).
This user provides the [`stm-client-base`](https://hub.docker.com/r/simpletaskmanager/stm-client-base) image used by the client to increase the build time.

The base image contains `node`, the `package.json` and installed packaged in the `node_modules` folder required by the according version (the base image is tagged) and google chrome for testing.

Unfortunately this image is huge (~700MB), so future will tell, whether this approach is really successful.
However, the build time decreased by a few minutes.

## Building and uploading

There's a script `build-base-image.sh` in the client folder, which takes the version as only parameter:

```bash
./build-base-image.sh 0.8.0-dev
```

# Logging

The containers are using the `journald` driver for logging.
So accessing the logs is also possible via e.g. `journalctl CONTAINER_NAME=stm-db` and the logs are appended to the journal after restarting/rebuilding the container.
For more logging commands see the [logging documentation file](./logging.md).