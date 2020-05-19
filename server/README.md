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
* Make sure `psql` is installed
* start database (if not already running)
* `cd server/database/`
* `./init-db.sh`

## During development

### Run

#### OSM OAuth credentials

To perform a login (even a login of your locally running application), you'll need OAuth credentials (so the OAuth consumer-key and -secret) within environment variables:

* `export OAUTH_CONSUMER_KEY="Eln7...rY66"`
* `export OAUTH_SECRET="fgg1...kl09"`

You can export these variables each time you start a new terminal or just put it into a file of your choice to load then e.g. after your system booted.

#### Start the server

After these variables are visible, start the server:

* `cd server`
* `go run .`

### Test

Use the `server/test/run.sh` script to run tests and provide the database with dummy data (required for the tests).
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

I only tried it with *let's encrypt* certificates.
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

For **further information**, take a look at the `doc/operation/ssl-cert.md` file.

# Docker

Client and Server can easily be started/deployed as docker containers.
Both containers do not clone any repo but copy the source files into the container.

The according configuration and definition of the build process are in the `./server/Dockerfile` and `./client/Dockerfile` files.
To make things easier there's also the `./docker-compose.yml` file combining the two docker files and adding port forwarding, mounts etc..
The database container is also defined in the `docker-compose.yml`.

The default docker configuration uses the production configurations for the `stm.hauke-stieler.de` server, you probably want to change that.
Just take a look above (configuration section) or take a look at the `server/config/prod.json` file.

Also don't forget to set the **OAuth environment variables** as describes above.

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

# 5. Change configs to your needs and define environment variables

# 6. Start every container ...
docker-compose up --build
# ... or just start one
docker-compose up --build stm-server
```

There are several more CLI options, just take a look at `docker` and `docker-compose` guides/tutorials/documentation.