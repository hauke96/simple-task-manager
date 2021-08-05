This file describes roughly the setup process of a new server instance:

# 0. Prerequisites

I assume some things:

* You have root-access via an initial root-login provided by the hoster (or someone else)
* You run an Ubuntu 20.04 (or something compatible, I think 18.04 or latest debian should be fine as well). Of course
  other distributions will also do the job, I only tried Ubuntu so far.
* You use a different domain than `stm.hauke-stieler.de`, however I use that domain here because I use it a lot ;)

First steps before we start:

* Login with SSH
* Change root password: `passwd`

# 1 Install all tools

* `apt update`
* Install all stm-related tools: `apt install npm go postgresql-client-12 git docker docker-compose`
* Install stuff for letsencrypt:
    * `apt install software-properties-common`
    * `apt update`
    * `apt install certbot`

# 2 Create user `stm`

* Create new user and add to groups
    * Add new user: `useradd stm`
    * Add to group `docker`: `usermod -aG docker stm`
    * Add to group `systemd-journal` to use journalctl: `usermod -aG systemd-journal stm`
    * Set password (also used to login via SSH): `passwd stm`
    * Change the shell of `stm` in the `/etc/passwd` to `/bin/bash`
* Setup home folder
    * `mkdir /home/stm`
    * Copy/create `.bashrc`, `.vimrc`, etc.
    * `chown -R stm:stm /home/stm`

# 3 SSH setup

The plan is to use public-key-authentication and to change some `sshd` configs.

* Edit the `sshd` config file: `vim /etc/ssh/sshd_config`
    * Change the line `#Port 22` into e.g. `Port 4242`
        * Important: Remember that number for the firewall config below
    * Disable SSH root-login. Change the `PermitRootLogin` line to `PermitRootLogin no`
        * Disable SSH password-login. Change the `PasswordAuthentication` line to `PasswordAuthentication no`
* Copy your public SSH key. This requires a working SSH-setup on your private machine, so make sure you have
  a `~/.ssh/id_rsa.pub` file (or any other pubkey file you can use).
    * use `ssh-copy-id` or manually copy content of the `.pub` file to your servers `~/.ssh/authorized_keys` and make
      sure the permissions are on 600 (if not, execute `chmod 600 ~/.ssh/authorized_keys`)

Test the setup using `ssh -p 4242 foo@bar.com`. A succeeded login without entering a password means that the SSH-setup
is completed.

# 4 LetsEncrypt

Basically follow the tutorial but the steps are very simple:

* `apt install software-properties-common`
* `add-apt-repository universe`
* `apt update`
* `apt install certbot`
* `certbot certonly --standalone`
* Adjust the timer and service files for systemd according to [ssl-cert.md](./ssl-cert.md)

# 5 Firewall

I'm not a firewall and networking expert at all but this gives us some kind of basic protection:

* Install tool to persist firewall configs: `apt install iptables-persistent`
    * Set setup will ask to store current iptable configs, just select "No"
* Add the following rules:
    * `iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT`
        * Allows responses to come back to the server e.g. when `stm-server` makes requests to the OSM-Servers.
    * `iptables -A INPUT -i lo -j ACCEPT`
        * Allows local traffic (`-i lo` says "interface localhost")
    * `iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT`
        * Optional: Allows ping-requests. Not necessary but nice to check whether server is online or what latency there
          is.
    * `iptables -A INPUT -p tcp --dport <your ssh port> -j ACCEPT`
    * `iptables -A INPUT -p tcp --dport 8080 -j ACCEPT`
    * `iptables -A INPUT -p tcp --dport 443 -j ACCEPT`
    * `iptables -A INPUT -p tcp --dport 80 -j ACCEPT`
    * `iptables -P INPUT DROP`
* Store to file: `iptables-save > /etc/iptables/rules.v4`

There's also the possibility to specify what kind of local traffic (between stm-server, stm-db and localhost) is
allowed, etc. etc. However, this should block the most basic things: SSH on 22.

# 6 Automatic backups

This step is optional but recommended!

* Copy the service and timer files from this directory to `/lib/systemd/system/`
* Enable both with `systemctl enable stm-backup.service` and `.timer` accordingly
* Start the timer with `systemctl start stm-backup.timer`

You can test the setup manually:

* Start the service with `systemctl start stm-backup.service`
* Take a look into the logs with `journalctl -u stm-backup.service` and watch for errors

See the [automatic-backups.md](automatic-backups.md) for details on how this all works.

# 7 Get STM

## Via docker hub (recommended)

Usually the deployments (at least since 1.4.2) works via the [docker hub](https://hub.docker.com/u/simpletaskmanager) and the pre-build docker images from there.

* Log into your server and go into the folder where all your stuff should be later on
* Download the `docker-compose.yml` file from
  the [STM github repo](https://github.com/hauke96/simple-task-manager/blob/master/docker-compose.yml)

Basically you're done with the preparations. The next step is the configuration.

## Manual build

Alternatively you can build STM from scratch manually. You might want to take a look at the docker files in the `server`
and `client` folders to maybe customize your build process.

The `docker-compose.yml` can easily be modified such that the servers and clients docker files are used instead of
docker hub.

Of course you can ignore docker and just build everything manually. Just take a look at
the [server README](../../server/README.md) and the [client README](../../client/README.md) on how to build the
projetcs.

# 8 Configuration

The configuration is done via different config files:

* `.env`: A file for docker containing environment variables and paths to the following config files:
* `*.json`: A json file for the server configuration (configured in the `.env` file)
* `*.conf`: A conf file for the nginx server (configured in the `.env` file)

## Server configuration

The server knows two places for configuration:
A config file (see the files in the `./config/` folder of the repo) and environment variables. When using docker,
environment variables can also be set via the `.env` file.

There's no overlap between the config file and environment variables, so they both configure totally different things.

*What can be configured using environment variables?*<br>
Only OAuth and database credentials.

*What can be configured using the config file?*<br>
Different things to slightly modify the servers behavior. See the below for a full list.

*Why are there two sources of configurations?*<br>
To separate sensitive data (credentials) from non-sensitive data that can also be uploaded to a git repo.

### Config file

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

* ```STM_OAUTH_CONSUMER_KEY```: The OAuth 1a consumer key provided by osm.org (no default value → this must be set)
* ```STM_OAUTH_SECRET```: The OAuth 1a consumer secret provided by osm.org (no default value → this must be set)
* ```STM_DB_USERNAME```: The username for the database (default: `stm`)
* ```STM_DB_PASSWORD```: The password for the database (default: `secret`)

It's not possible to override entries from the config file using environment variables and vise versa.

Simply set the variables via `export STM_DB_USERNAME=mydbuser STM_DB_PASSWORD=supersecurepassword123`. To make the
export permanent, move that command into your `.bachrc` (or similar file).

When using docker, you can use the `.env` file to store the variables there instead of using the `.bashrc` file.

**Important:** Use this opportunity to set a secure password for your database!

## The `.env` file

The default deployment process uses docker-compose so that you can set environment variables of a container via a `.env`
file. This is just a simple file next to the `docker-compose.yml` containing the following information (or some of
them):

```
STM_OAUTH_CONSUMER_KEY=abc123
STM_OAUTH_SECRET=def234
STM_DB_USERNAME=mydbuser
STM_DB_PASSWORD=supersecurepassword123
STM_SERVER_CONFIG=/path/to/config.json
STM_NGINX_CONFIG=/path/to/nginx.conf
```

The `STM_DB_...` entries just override the default ones whereas the `STM_OAUTH_` entries don't have default configs and
must be set in order to make authentication work.

The `STM_SERVER_CONFIG` and `STM_NGINX_CONFIG` have to be set, neither the server nor the client will start without
them.

# 9 Deployment

*This section only describes the docker based deployment!*

The default deployment process downloads pre-build docker images from [docker hub](https://hub.docker.com/u/simpletaskmanager) and starts them with the configurations
as describes above. You should have your `docker-compose.yml` ready as describes above in section 7 and your configuration set up as described in section 8.

Now let us deploy everything:

* docker-compose up -d

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

