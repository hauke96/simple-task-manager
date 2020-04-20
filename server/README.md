# Server

The server is written in go (aka golang) so you need to install go and setup your development environment (paths, IDE, etc.)

## Setup
This project uses some frameworks/libraries to make the development easier:

* [gorilla/mux](https://github.com/gorilla/mux) to easily create REST endpoints
* [kurrik/oauth1a](https://github.com/kurrik/oauth1a) for the OAuth1a authentication
* [lib/pq](https://github.com/lib/pq) for a Postgres database driver
* [hauke96/sigolo](https://github.com/hauke96/sigolo) for logging
* [hauke96/kingpin](https://github.com/hauke96/kingpin) for CLI parameter and flag parsing

This project uses the go module infrastructure, so e.g. `go build` installs all dependencies for you.

## Database

The server requires a database called `stm` with the needed tables (e.g. `tasks` and `projects`).

### Start as docker container

*See the end of this file for instruction regarding docker*

I recommend to use a container for the database.
The `docker-compose.yml` defines such container, just execute `docker-compose up --build stm-db` to start it.

**tl;dr:**
* `docker-compose up --build stm-db`

### Initialize database 

The folder `server/database/` contains the script `init-db.sh`.
Start your database and call this script (from within that folder).

You need the tools `createdb` and `psql`. Both are -- for ubuntu users -- available in the package `postgresql-client`.

**tl;dr:**
* Make sure `createdb` and `psql` are installed
* start database (if not already running)
* `cd server/database/`
* `./init-db.sh`

## Run

* `cd server`
* `go run .`

## Test

There are unit tests (files ending with `_test.go`).
Run the tests from within the `server/` folder with `go test -v ./...`.

All the tests using a real database are skipped.
To use the database tests as well, go into `server/test/` and run the `run.sh` file.
This will start the docker container for the database and runs the tests. 

**tl;dr:**
* `cd server`
* `go test -v ./...`

### Using a real database

Use the `server/test/run.sh` script to also (additionally to the normal in-memory tests) run tests based on the database.
This script will setup the database in a docker container, fill the database with dummy data and executes the tests.

**Warning:**
This script will remove your `postgres-data` folder created by the `stm-db` docker container.

**tl;dr:**
* `cd server/test`
* `./run.sh`

## Build

* `cd server`
* `go build .`

## Configuration

There are already some configuration files in the folder `./server/config/`.
Until there's further documentation, just take a look, the properties are quite simple and straight forward.

## HTTPS

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

# Docker

Client and Server can easily be started/deployed as docker containers.
Both containers do not clone any repo but copy the source files into the container.

The according configuration and definition of the build process are in the `./server/Dockerfile` and `./client/Dockerfile` files.
To make things easier there's also the `./docker-compose.yml` file combining the two docker files and adding port forwarding, mounts etc..
The database container is also defined in the `docker-compose.yml`.

The default docker configuration uses the production configurations for the `stm.hauke-stieler.de` server, you probably want to change that.
Just take a look above (configuration section) or take a look at the `server/config/prod.json` file.

The `stm.hauke-stieler.de` uses Ubuntu so here's a workflow for Ubuntu:

```bash
# 1. install docker, docker-compose and git
apt install docker docker-compose git

# 2. Setup letsencrypt
# It's best to look at their guidelines and tutorials

# 3. clone repo
git clone https://github.com/hauke96/simple-task-manager.git

# 4. Go into the repo
cd simple-task-manager

# 5. Change configs to your needs

# 6. Start the whole thing
docker-compose up --build
```

There are several more CLI options, just take a look at `docker` and `docker-compose` guides/tutorials/documentation.