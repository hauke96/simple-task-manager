This file described the setup of the STM application server.
For a potential setup of a linux-machine, see [linux.md](./linux.md).

# Assumptions

This guide assumes some basic things:

* You have (SSH) access to a linux machine
* Your machine has access to at least docker.com and osm.org.
* Your machine is able to start docker containers

Optional but recommended:

* Your machine is able to run systemd-services and -timer (for automatic backups and certificate renewal)

# 1 Possible file structure

The following structure (I assume your users home folder is `/home/stm`) is easy to maintain and keeps everything together:

* Create `/home/stm/simple-task-manager/` with following sub-folders:
    * `backups`: for (automated) backups (s. section below)
    * `configs`: contains nginx and stm-server configs
    * `postgres-data`: contains the database files
    * `repo`: contains the actual code repo. This is needed so get the latest `docker-compose.yml`

# 2 Get STM

## Via docker hub (recommended)

The deployments (since 1.4.2) work via [docker hub](https://hub.docker.com/u/simpletaskmanager) and the pre-built docker
images from there.

* Log into your server and go into the folder where all your stuff should be (e.g. `/home/stm/simple-task-manager/` as
  described above)
* Get the required compose file using **one** of the following ways:
    * Clone the git repo into the `repo` folder and create the symlink `docker-compose.yml` -> `repo/docker-compose.yml`
    * Or: Download the `docker-compose.yml` file from
      the [STM github repo](https://github.com/hauke96/simple-task-manager/blob/master/docker-compose.yml)

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

The configuration of the whole system is done via different config files:

* `.env`: A file (s. below for doc and examples) for environment variables of docker containers.
* `*.json`: A json file for the server configuration. Configured in the `.env` file
  with `STM_SERVER_CONFIG=./path/to/server.json`.
* `*.conf`: A conf file for the nginx server. Configured in the `.env` file
  with `STM_NGINX_CONFIG=./path/to/nginx.conf`.

As describes above, I recommend to create a config folder on your server (e.g. `/home/stm/simple-task-manager/configs/`)
and put all your configs into that folder.
Even better would be a separate git repo to manage your configs, but that's up to you.

## Server configuration

The server knows two places for configuration:
A config file (see the files in the `server/config/` folder of this repo) and environment variables.
When using docker, environment variables should be set via the `.env` file and registered in the `docker-compose.yml` so
that they are passed to the docker container.

You can configure the entire application with environment variables or the config file or a combination of both.
Environment variable values take precedence over config entries, which means they override the config entries.

### Config file for stm-server

Default config file is the `./config/default.json` but can be specified using the `--config`/`-c` parameter when
starting the server or via the `STM_SERVER_CONFIG` environment variable in the setup of this repo (which mounts the
given config file into the container).
When using docker for deployment, the config file will be overwritten via volumes instead of this CLI parameter, but
later more about that.

**Recommendation:** Use environment variables to override sensitive information like passwords and the OAuth secret.

Take a look at the `docker-compose.yml` and the config folder in the git repository for e.g. the production
configuration.

The following things can be configured:

| Config entry               | Environment variable           | Default                                            | Mandatory | Must be given manually | Description                                                                                                                                      |
|----------------------------|--------------------------------|----------------------------------------------------|-----------|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| `server-url`               | `STM_SERVER_URL`               | -                                                  | Yes       | Yes                    | The external URL of the server, e.g. "https://my-domain.com/api". May contain a port and a path under which this server can be accessed.         |
| `port`                     | `STM_PORT`                     | `8080`                                             | Yes       |                        | The port that should be used by the server (e.g. `8080`).                                                                                        |
| `client-auth-redirect-url` | `STM_CLIENT_AUTH_REDIRECT_URL` | -                                                  | Yes       | Yes                    | The URL to the STM client which is called after OAuth authorization.                                                                             |
| `osm-base-url`             | `STM_OSM_BASE_URL`             | `"https://www.openstreetmap.org"`                  | Yes       |                        | URL to the OSM server (e.g. `https://www.openstreetmap.org`) as used by the end-user, which is used for login.                                   |
| `osm-api-url`              | `STM_OSM_API_URL`              | `"https://api.openstreetmap.org/api/0.6"`          | Yes       |                        | URL to the API path of the OSM server (e.g. `https://api.openstreetmap.org/api/0.6`).                                                            |
| `token-validity`           | `STM_TOKEN_VALIDITY_DURATION`  | `"168h"`                                           |           |                        | Duration of a token until it's not valid anymore (e.g. `24h` or other valid duration strings according to golang `time.ParseDuration` function). |
| `source-repo-url`          | `STM_SOURCE_REPO_URL`          | `"https://github.com/hauke96/simple-task-manager"` |           |                        | URL to the GitHub/GitLab/Gitea/... repo. Just used for the info-page.                                                                            |
| `max-task-per-project`     | `STM_MAX_TASKS_PER_PROJECT`    | 1000                                               |           |                        | Maximum amount of tasks that are allowed per project.                                                                                            |
| `max-description-length`   | `STM_MAX_DESCRIPTION_LENGTH`   | 1000                                               |           |                        | Maximum length of project descriptions.                                                                                                          |
| `ssl-cert-file`            | `STM_SSL_CERT_FILE`            | -                                                  |           |                        | Absolute path to the SSL certificate file (e.g. `/etc/letencrypt/.../fullchain.pem`).                                                            |
| `ssl-key-file`             | `STM_SSL_KEY_FILE`             | -                                                  |           |                        | Absolute path to the SSL key file (e.g. `/etc/letencrypt/.../privkey.pem`).                                                                      |
| `db-username`              | `STM_DB_USERNAME`              | `stm`                                              | Yes       |                        | Username of the database.                                                                                                                        |
| `db-password`              | `STM_DB_PASSWORD`              | `secret`                                           | Yes       |                        | Password for the database user.                                                                                                                  |
| `db-host`                  | `STM_DB_HOST`                  | `localhost`                                        | Yes       |                        | Host of the database.                                                                                                                            |
| `db-database`              | `STM_DB_DATABASE`              | `stm`                                              | Yes       |                        | Name of the database to use.                                                                                                                     |
| `oauth2-client-id`         | `STM_OAUTH2_CLIENT_ID`         | -                                                  | Yes       | Yes                    | OAuth2 client-ID.                                                                                                                                |
| `oauth2-secret`            | `STM_OAUTH2_SECRET`            | -                                                  | Yes       | Yes                    | OAuth2 client-secret.                                                                                                                            |
| `debug-logging`            | `STM_DEBUG_LOGGING`            | `false`                                            |           |                        | Set to `true` for more detailed logging (caution: expect tons of log entries!).                                                                  |
| `test-env`                 | `STM_TEST_ENVIRONMENT`         | `false`                                            |           |                        | Set to `true` to inform clients that this is a test instance. This will e.g. show the test-banner in the STM-client.                             |

Only the few values in the "Must be given manually" columns _must_ be specified by you.
All other value _can_ be overridden but have working default values.

## The nginx configuration

The `docker-compose.yml` uses the `$STM_NGINX_CONFIG` environment variable which references a `.conf` file with all
nginx related stuff in it.
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
STM_...
STM_SERVER_CONFIG=/path/to/config.json
STM_NGINX_CONFIG=/path/to/nginx.conf
```

The `STM_...` entry stands for all kinds of configurations for the server.
Make sure you register these variables in the `docker-compose.yml` so that they are passed on to the server container.

The `STM_SERVER_CONFIG` and `STM_NGINX_CONFIG` _must_ be set, neither the server nor the client will start without
them because these two environment variables are used in the `docker-compose.yml` to mount these config files.

## Frontend configuration

All the frontend configuration is within the `environment.ts` files and therefore packed into the bundled artifact.
Therefore, configuration only takes place via the nginx config (s. above) or the docker-compose file.

### Show notice to users

As admin you can show arbitrary notices to the user in the login page.
To do so, create `notice.<lang-code>.html` files in some folder and edit your `docker-compose.yml`.
In there, mount the notice files to the client like
this: `- ./path/to/notice.<lang-code>.html:/usr/share/nginx/html/assets/i18n/notice.<lang-code>.html`.
The `<lang-code>` must be replaced by the language code used for the changelog-files as well (so e.g. `de` for German
or `en-US` for english).

# 4 Reverse proxy

Currently the client and backend containers are running but not accessible through port 80/443 of your machine.
You have to create a reverse proxy (e.g. a simple nginx container) that handles HTTPS and directs traffic to your containers.

## Example configurations

These are excerpts of the configurations for the stm-test server.

### Reverse proxy (nginx)

Requires open ports 80 and 443. If no redirect from HTTP to HTTPS is wantes, then the port 80 configuration can be removed.
This expects the backend server to be available unter the path `/api/` and also enables support for websockets.

```json
server {
	listen 80;
	listen [::]:80;
	server_name stm-test.hauke-stieler.de;

	return 301 https://$host$request_uri;
}
server {
	listen 443 ssl;
	server_name stm-test.hauke-stieler.de;

	ssl_certificate /etc/letsencrypt/live/stm-test.hauke-stieler.de/cert.pem;
	ssl_certificate_key /etc/letsencrypt/live/stm-test.hauke-stieler.de/privkey.pem;

	location /api/ {
		rewrite /api/(.*) /$1  break;
		proxy_pass http://stm-test-server:8080;

		# WebSocket support
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
	}

	location / {
		proxy_pass http://stm-test-client;
	}
}
```

### Frontend config (nginx)

This serves the frontend under port 80.
HTTPS is handles by the reverse proxy.

```json
server {
	listen 80 default_server;
	listen [::]:80 default_server;

	location / {
		root   /usr/share/nginx/html;
		index  index.html;
		try_files $uri $uri/ /index.html;
	}
}

```

### Docker

The `docker-compose.yml` looks like this and simply passes the SSL certificates to the reverse proxy and opens its ports.
This is a super-minimal example (likely not working).
Additional settings and passing environment variables might be needed depending on your setup.
Also see the `docker-compose.yml` in the repository and the documentation above.

```yaml
services:
  reverse-proxy:
    image: nginx:1.27-alpine
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt
      - ./path/to/reverse-proxy.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "80:80"
      - "443:443"

  stm-test-server:
    image: simpletaskmanager/stm-server:1.7.0
    volumes:
      - ./path/to/server.conf:/stm-server/config.json

  stm-test-client:
    image: simpletaskmanager/stm-client:1.7.0
    volumes:
      - ./path/to/frontend.conf:/etc/nginx/conf.d/default.conf

  stm-test-db:
    ...
```

All containers are in the same network, can therefore communicate with each other, and only the reverse proxy actually publishes its ports to the host system.

### Server config

Because the reverse proxy must distinguish between HTTP requests to the frontent and requests to the backend, the backend hast to be available under a unique path such as `/api/`.
Only one entry is needed to configure this for the backend, because the actual routing and path rewriting is handles by the reverse proxy.

```json
{
  "server-url": "https://stm-test.hauke-stieler.de/api/",
  ...
}


```

# 5 Automatic backups

This step is optional but recommended and described in the [automatic-backups.md](automatic-backups.md) file.

# 6 Deployment

_This section only describes the docker hub based deployment!_

The default deployment process downloads pre-built docker images
from [docker hub](https://hub.docker.com/u/simpletaskmanager) and starts them with the configurations
as describes above.
You should have your `docker-compose.yml` ready as describes above in section 7 and your configuration set up as
described in section 8.

Now let us deploy everything:

* Go to `/home/stm/simple-task-manager/` (the folder described in section 2)
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
  incoming traffic in ports other than your ssh port and `433`.
* Open `https://stm.hauke-stieler.de`: Should work, this is the normal front page.
    * Login should work. This would mean that the firewall allows traffic *from* the server *to* the internet and also
      that the server-communication works.

