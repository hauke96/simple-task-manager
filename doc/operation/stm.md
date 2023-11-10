This file described the setup of the STM application server.
For a potential setup of a linux-machine, see [linux.md](./linux.md).

# Assumptions

This guide assumes some basic things:

* You have (SSH) access to a linux machine
* Your machine has access to at least docker.com and osm.org.
* Your machine is able to start docker container

Optional but recommended:

* Your machine is able to run systemd-services and -timer (for automatic backups and certificate renewal)

# 1 Recommended file structure

I recommend the following structure and I assume your users home folder is `/home/stm`:

* Create `/home/stm/simple-task-manager/` with following sub-folders:
  * `backups`: for (automated) backups (s. section below)
  * `configs`: contains nginx and stm-server configs
  * `postgres-data`: contains the database files
  * `repo`: contains the actual code repo. This is needed so get the latest `docker-compose.yml`

# 2 Get STM

## Via docker hub (recommended)

The deployments (since 1.4.2) work via [docker hub](https://hub.docker.com/u/simpletaskmanager) and the pre-built docker images from there.

* Log into your server and go into the folder where all your stuff should be (e.g. `/home/stm/simple-task-manager/` as described above)
* Get the required compose file using **one** of the following ways:
  * Clone the git repo into the `repo` folder and create the symlink `docker-compose.yml` -> `repo/docker-compose.yml`
  * Or: Download the `docker-compose.yml` file from the [STM github repo](https://github.com/hauke96/simple-task-manager/blob/master/docker-compose.yml)

I recommend to clone the git repo in order to easily get new versions of the compose file.

Basically you're done with the preparations. The next step is the configuration.

## Manual build

Alternatively you can build STM from scratch manually. You might want to take a look at the docker files in the `server`
and `client` folders to maybe customize your build process.

Server and client can be built independent of the later server IP/domain.
The client for example uses `document.location.protocol` to make requests to the same domain it's hosted on.

The `docker-compose.yml` can easily be modified such that the servers and clients docker files are used instead of
docker hub.

Of course you can ignore docker and just build everything manually. Just take a look at
the [server README](../../server/README.md) and the [client README](../../client/README.md) on how to build the
projetcs.

# 3 Configuration

The configuration is done via different config files:

* `.env`: A file (s. below for doc and example) for docker containing environment variables and paths to the following config files:
* `*.json`: A json file for the server configuration. Configured in the `.env` file with `STM_SERVER_CONFIG=./path/to/server.json`.
* `*.conf`: A conf file for the nginx server. Configured in the `.env` file with `STM_NGINX_CONFIG=./path/to/nginx.conf`.

As describes above, I recommend to create a config folder on your server (e.g. `/home/stm/simple-task-manager/configs/`) and put all your configs into that folder.
Even better would be a separate git repo to manage your configs, but that's up to you.

## Server configuration

The server knows two places for configuration:
A config file (see the files in the `./config/` folder of the repo) and environment variables. When using docker,
environment variables should be set via the `.env` file (just for convenience).

There's no overlap between the config file and environment variables, so they both configure totally different things.

*What can be configured using environment variables?*<br>
Only OAuth and database credentials.

*What can be configured using the config file?*<br>
Different things to slightly modify the servers behavior. See the below for a full list.

*Why are there two sources of configurations?*<br>
To separate sensitive data (credentials) from non-sensitive data that can also be uploaded to a git repo.

### Config file for stm-server

Default file is the `./config/default.json` but can be specified using the `--config`/`-c` parameter when starting the
server. When using docker for deployment, the config file will be overwritten via volumes instead of this CLI parameter,
but later more about that.

Take a look at the config folder in the git repository for e.g. the production configuration.

The following things can be configured:

* ```server-url```: The URL of the server. Is used for SSL, authentication and the info page (
  e.g. `https://stm.hauke-stieler.de`).
* ```port```: The port that should be used by the server (e.g. `8080`).
* ```ssl-cert-file```: Absolute path to the SSL certificate file (e.g. `/etc/letencrypt/.../fullchain.pem`).
* ```ssl-key-file```: Absolute path to the SSL key file (e.g. `/etc/letencrypt/.../privkey.pem`).
* ```osm-base-url```: URL to the OSM server (e.g. `https://www.openstreetmap.org`).
* ```debug-logging```: Set to `true` for more detailed logging (caution: expect tons of log entries!).
* ```token-validity```: Duration of a token until it's not valid anymore (e.g. `24h` or other valid duration strings
  according to golang `time.ParseDuration` function).
* ```source-repo-url```: URL to the GitHub/GitLab/Gitea/... repo. Just used for the info-page.
* ```max-task-per-project```: Maximum amount of tasks that are allowed per project.
* ```test-env```: Set to `true` to inform clients that this is a test instance. This will e.g. show the test-banner in
  the STM-client.

### Environment variables

These environment variables are used by the server:

* ```STM_OAUTH2_CLIENT_ID```: The OAuth2 client ID provided by osm.org (no default value → this must be set)
* ```STM_OAUTH2_SECRET```: The OAuth2 consumer secret provided by osm.org (no default value → this must be set)
* ```STM_DB_USERNAME```: The username for the database (default: `stm`)
* ```STM_DB_PASSWORD```: The password for the database (default: `secret`)
* ```STM_DB_HOST```: The host of the database (default: `localhost`)

It's not possible to override entries from the config file using environment variables and vise versa.

Simply set the variables via `export STM_DB_USERNAME=mydbuser STM_DB_PASSWORD=supersecurepassword123 STM_DB_HOST=some-host-name`. To make the
export permanent, move that command into your `.bachrc` (or similar file).

When using docker, you can use the `.env` file to store the variables there instead of using the `.bashrc` file.

**Important:** Use this opportunity to set a secure password for your database!

## The nginx configuration

The `docker-compose.yml` uses the `$STM_NGINX_CONFIG` environment variable which references a `.conf` file with all nginx related stuff in it.
See the client folder of this repo for two examples.

## The `.env` file

The default deployment process uses docker-compose so that you can set environment variables of a container via a `.env`
file. This is just a simple file next to the `docker-compose.yml` containing the following information (or some of
them):

```
STM_OAUTH2_CLIENT_ID=abc123
STM_OAUTH2_SECRET=def234
STM_DB_USERNAME=mydbuser
STM_DB_PASSWORD=supersecurepassword123
STM_DB_HOST=some-host-name
STM_SERVER_CONFIG=/path/to/config.json
STM_NGINX_CONFIG=/path/to/nginx.conf
``` 

The `STM_OAUTH2_...` entries don't have default values and _must_ be set in order to make authentication work.

The `STM_SERVER_CONFIG` and `STM_NGINX_CONFIG` _must_ be set, neither the server nor the client will start without
them.

### Precedence of configurations

The `STM_DB_...` entries have default values.
Values from the `config.json` override these default values.
Values via environment variables override default values as well as values from the `config.json`.

## Frontend configuration

All the frontend configuration is within the `environment.ts` files and therefore packed into the bundled artifact.
Therefore, configuration only takes place via the nginx config (s. above) or the docker-compose file.

### Show notice to users

As admin you can show arbitrary notices to the user in the login page.
To do so, create `notice.<lang-code>.html` files in some folder and edit your `docker-compose.yml`.
In there, mount the notice files to the client like this: `- ./path/to/notice.<lang-code>.html:/usr/share/nginx/html/assets/notice.<lang-code>.html`.
The `<lang-code>` must be replaced by the language code used for the changelog-files as well (so e.g. `de` for German or `en-US` for english).

# 4 Automatic backups

This step is optional but recommended and described in the [automatic-backups.md](automatic-backups.md) file.

# 5 Deployment

_This section only describes the docker hub based deployment!_

The default deployment process downloads pre-built docker images from [docker hub](https://hub.docker.com/u/simpletaskmanager) and starts them with the configurations
as describes above.
You should have your `docker-compose.yml` ready as describes above in section 7 and your configuration set up as described in section 8.

Now let us deploy everything:

* Go to `/home/stm/simple-task-manager/` (the folder described in section 6)
* Make sure a symlink to your `docker-compose.yml` exists
* `docker-compose up -d`

That's it. Now everything should run properly.

# Verify setup

We should not do some checks to see if the setup was really a success. To do that, we'll go through the logs
using `journalctl` and so some manual checks.

Check logs and firewall:

* `iptables -S`: Should show the rules describes above.
  * If not: Restart the machine. The `iptables-persistent` package should reload the firewall config after the reboot.
* `journalctl -f CONTAINER_NAME=stm-server -n 1000`: Shows the last 1000 log messages for the `stm-server` container.
  Also works for `stm-db` and `stm-client`. This shouldn't display any errors (except token and authentication errors if
  you or someone else tried to login).

Manual checks (of course use your own domain/ip):

* `ping stm.hauke-stieler.de`: Should work. Checks whether firewall accepts ping-requests and if server is on.
* `ssh root@stm.hauke-stieler.de`: Should not work. Login with `stm` should not require password but valid SSH key.
* `psql -h stm.hauke-stieler.de`: Should not work. If you get asked for a password, then the firewall isn't blocking
  incoming traffic in ports other than ssh, `8080` and `433`.
* Open `https://stm.hauke-stieler.de:8080/info`: Should work, so the firewall accepts port 8080 requests.
* Open `https://stm.hauke-stieler.de`: Should work, this is the normal front page.
  * Login should work. This would mean that the firewall allows traffic *from* the server *to* the internet and also
    that the server-communication works.

