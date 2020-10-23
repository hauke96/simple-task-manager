This file describes roughly the setup process of a new server instance:


# 0. Prerequisites

I assume some things:

* You have root-access via an initial root-login provided by the hoster (or someone else)
* You run an Ubuntu 20.04 (or something compatible, I think 18.04 or latest debian should be fine as well). Of course other distributions will also do the job, I only tried Ubuntu so far.
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
* Copy your public SSH key. This requires a working SSH-setup on your private machine, so make sure you have a `~/.ssh/id_rsa.pub` file (or any other pubkey file you can use).
    * use `ssh-copy-id` or manually copy content of the `.pub` file to your servers `~/.ssh/authorized_keys` and make sure the permissions are on 600 (if not, execute `chmod 600 ~/.ssh/authorized_keys`)

Test the setup using `ssh -p 4242 foo@bar.com`. A succeeded login without entering a password means that the SSH-setup is completed. 

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
        * Optional: Allows ping-requests. Not necessary but nice to check whether server is online or what latency there is.
    * `iptables -A INPUT -p tcp --dport <your ssh port> -j ACCEPT`
    * `iptables -A INPUT -p tcp --dport 8080 -j ACCEPT`
    * `iptables -A INPUT -p tcp --dport 443 -j ACCEPT`
    * `iptables -A INPUT -p tcp --dport 80 -j ACCEPT`
    * `iptables -P INPUT DROP`
* Store to file: `iptables-save > /etc/iptables/rules.v4`

There's also the possibility to specify what kind of local traffic (between stm-server, stm-db and localhost) is allowed, etc. etc.
However, this should block the most basic things: SSH on 22, 

# 6 Deployment

* Login as `stm` (either via SSH or `su - stm`)
* `git clone https://github.com/hauke96/simple-task-manager.git`
    * Optional: Switch to the branch/tag/commit you want to deploy
* `./deploy.sh`
    * Important: Per default, this uses the production configs (`/client/src/environments/environment.prod.ts` and `/server/configs/prod.json`) so make sure they contain the right values. 
    * Per default this expects an docker-compose `.env` file next to the script. Specifying `-e` makes the script ask you for all the needed values instead of using the env-file.
    * If no database exists, it will set up the database from scratch! Amazing right? :D

That's it. Now everything should run properly.

## The `.env` file

This is just a simple file next to the deployment script (so in the projects root folder) containing the following information:

```
OAUTH_CONSUMER_KEY=abc123
OAUTH_SECRET=def234
STM_DB_USERNAME=postgres
STM_DB_PASSWORD=supersecurepassword123
```

# Verify setup

We should not do some checks to see if the setup was really a success.
To do that, we'll go through the logs using `journalctl` and so some manual checks.

Check logs and firewall:

* `iptables -S`: Should show the rules describes above.
    * If not: Restart the machine. The `iptables-persistent` package should reload the firewall config after the reboot.
* `journalctl -f CONTAINER_NAME=stm-server -n 1000`: Shows the last 1000 log messages for the `stm-server` container. Also works for `stm-db` and `stm-client`. This shouldn't display any errors (except token and authentication errors if you or someone else tried to login).

Manual checks:

* `ping stm.hauke-stieler.de`: Should work. Checks whether firewall accepts ping-requests and if server is on.
* `ssh root@stm.hauke-stieler.de`: Should not work. Login with `stm` should not require password but valid SSH key.
* `psql -h stm.hauke-stieler.de`: Should not work. If you get asked for a password, then the firewall isn't blocking incoming traffic in ports other than ssh, `8080` and `433`.
* Open `https://stm.hauke-stieler.de:8080/info`: Should work, so the firewall accepts port 8080 requests.
* Open `https://stm.hauke-stieler.de`: Should work, this is the normal front page.
    * Login should work. This would mean that the firewall allows traffic *from* the server *to* the internet and also that the server-communication works.

