# Server

The server is written in go (aka golang) so you need to install go and set up your development environment (paths, IDE, etc.)

# Setup development environment

## 1. Requirements

* Installed and working go compiler (1.12 or newer to have module support)
* For the database do **one** of the following: 
    * Install and setup docker daemon (for the PostgreSQL database; setup is described later)
    * Directly install and setup PostgreSQL server (9.6 and newer should work)
* And of course an working IDE setup of your choice (I can recommend *GoLand* as fancy-pants, *LiteIDE* as pure open-source and of course *vim* as hard-core IDE)

## 2. Dependencies

**tl;dr:**
* If you use go version < 1.12 : the whole go module stuff doesn't work for you, so make sure the packages listed below are installed
* If you use go version >= 1.12 : nothing to do here

This project uses the **go module** infrastructure, so e.g. `go build` installs all dependencies for you.
The frameworks/libraries this project uses are there in order to make the development easier:

* [gorilla/mux](https://github.com/gorilla/mux) to easily create simple rest endpoints
* [gorilla/websocket](https://github.com/gorilla/websocket) for server → client communication
* [x/oauth2](https://pkg.go.dev/golang.org/x/oauth2) for the OAuth2 authentication
* [lib/pq](https://github.com/lib/pq) for a postgres database driver
* [pkg/errors](https://github.com/pkg/errors) better error handling and enables us to show stack traces
* [hauke96/sigolo](https://github.com/hauke96/sigolo) for logging
* [alecthomas/kong](https://github.com/alecthomas/kong) for cli parameter and flag parsing

## 3. Setup the Database

The server requires a database called `stm` with the required tables as described below.
This description assumes that you use docker instead of an direct installation of PostgreSQL.

### Set Database user/password as environment variable

**tl;dr:**
* `export STM_DB_USERNAME=stm STM_DB_PASSWORD=secret STM_DB_HOST=localhost`
* **or** Set the database entries in a custom JSON-config and use that file with the `-c`/`--config` parameter. 

You can override the default DB username, password (`stm` and `secret`) and host by setting environment variables.
To make this permanent, you probably want to add this to the `.bachrc` or similar files.

### Start as docker container

**tl;dr:**
* `docker-compose up --build stm-db`

The `docker-compose.yml` defines such container, just execute `docker-compose up --build stm-db` to start it.
**Notice: ** This just starts the database server, the database tables are created in the next step.

### Initialize database 

**tl;dr:**
* Make sure `psql` is installed
* start database (if not already running)
* `cd server/database/`
* `./init-db.sh`

The folder `server/database/` contains the script `init-db.sh`.
Start your database and call this script (from within that folder).

You need the tools `createdb` and `psql`. Both are - for ubuntu users - available in the package `postgresql-client`.

### Reset database

**tl;dr:**
* `psql -h localhost -U postgres -c 'DROP DATABASE stm;'`
* `cd server/database`
* `./init-db.sh`

This is just needed if you want to get rid of the current data (e.g. after testing).

## 4. Setup the Login

There are two approaches:

1. OSM dev-API with a real account
2. Local fake-Server emulating the OSM API

### With OSM dev-API

The default config of the server uses the [development API of OSM](https://master.apis.dev.openstreetmap.org).
So you need to have an account there and also need to register your local application the to get the OAuth credentials.

#### OSM OAuth credentials

To perform a login (even a login of your locally running application), you'll need OAuth credentials (so the OAuth2 client-ID and -secret).
You can set these with environment variables:

* `export STM_OAUTH2_CLIENT_ID="Eln7...rY66"`
* `export STM_OAUTH2_SECRET="fgg1...kl09"`

You can export these variables each time you start a new terminal or just put it into a file of your choice (e.g. `.bashrc`) to load then e.g. after your system booted.

You can also create your own JSON-config file and set everything there.

## 5. Setup finished :)

Now you can start database, server (s. below) and the client (s. [README](../../client) in the `client` folder) and access the STM application under `localhost:4200`.
Everything should work now and if not, don't hesitate to raise an issue :)

# Run server

After these variables are visible, start the server:

* `cd server`
* `go run .`

The server starts under port `8080` and has an info page to check if it's running: [localhost:8080/info](http://localhost:8080/info)

# Run Tests

**tl;dr:**
* `cd server`
* `./run-tests.sh`

Use the `server/run-tests.sh` script to run tests and provide the database with dummy data (required for the tests).
This script will set up the database `stm_test` in the docker container `stm-db`, fill the database with dummy data and execute the tests.

# Build & Run

## Run the server

**tl;dr:**
* `cd server`
* `go run . -c path/to/your/config.json`

I suggest to use the `config/default.json` file together with the two environment variables `STM_OAUTH2_CLIENT_ID` and `STM_OAUTH2_SECRET` set.
See [Configuration](#configuration) below for more details.

## Build the server

**tl;dr:**
* `cd server`
* `go build .`

However, I don't use this during development but only during deployment and only within the `Dockerfile`.

# Development

## Error handling

Whenever an error from a library/framework (e.g. in a database store) is returned, wrap it using `errors.Wrap(err)` (from the `github.com/pkg/errors` package) and return that.
This will later result in a nice stack trace when the HTTP response is created.
All other places just return the error because it's already wrapped (and therefore will already produce a stack trace).

New errors should also be created using `errors.New(...)`.

Whenever catching, creating or wrapping an error, feel free to print additional information using `sigolo.Error(...)`. 

## Code conventions

See the [development README](../doc/development/README.md) for details.

# Configuration

There are configuration files in the folder `./server/config/`.
For local development, you don't need to change anything there.
If you still want to change things, just take a look at the properties, they are quite simple and straight forward.

You still need to specify your OAuth2 values (client-ID and secret) and it's recommended to do that via environment variables, e.g. in your IDE setup.
Peek into the [deployment README](../doc/operation/stm.md) for further details.

# HTTPS

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