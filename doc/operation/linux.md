This file describes roughly the setup process of a new Linux-server instance.
The setup of the actual STM application is described in [stm.md](./stm.md).

Not all of this might apply to you and some things might work different for you.
This file focuses on ubuntu-based systems. 

# 0. Prerequisites

I assume some things:

* You have root-access via an initial root-login provided by the hoster (or someone else)
* You run an up-to-date Ubuntu/debian. Of course other distributions will also do the job, I only tried Ubuntu so far.
* You use a different domain than `stm.hauke-stieler.de`, just replace it where ever you see it ;)

First steps before we start:

* Login with SSH
* Change root password: `passwd`

# 1 Install all tools

* `apt update`
* Install all stm-related tools: `apt install git docker docker-compose`
* Optional tools:
    * `postgresql-client-12` (to look into the database)
* Install stuff for letsencrypt:
    * `apt install software-properties-common`
    * `apt update`
    * `apt install certbot`

# 2 Create user `stm`

_Optional step as any non-root user will work just fine._

The `stm` user is just the linux user under which everything runs.
Choose a different user name is wanted.

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

_Optional step as any SSH connection will work just fine._

The plan is to use public-key-authentication and to change some `sshd` configs.

* Edit the `sshd` config file on the server: `vim /etc/ssh/sshd_config`
    * Change the line `#Port 22` into e.g. `Port 4242`
        * Important: Remember that number for the firewall config below
    * Disable SSH root-login. Change the `PermitRootLogin` line to `PermitRootLogin no`
    * Disable SSH password-login. Change the `PasswordAuthentication` line to `PasswordAuthentication no`
* Copy your personal public SSH key from your home computer:
    * Make sure you have an SSH key (we need a `~/.ssh/id_rsa.pub` file). If not create one using `ssh-keygen`.
    * Use `ssh-copy-id` or manually copy content of the `.pub` file to your servers `~/.ssh/authorized_keys`.
	* Make sure the permissions are on 600 (if not, execute `chmod 600 ~/.ssh/authorized_keys`)

Test the setup using `ssh -p 4242 foo@bar.com`. A succeeded login without entering a password means that the SSH-setup
is completed.

# 4 LetsEncrypt

Follow the steps in [ssl-cert.md](./ssl-cert.md) so set up letsencrypt.

**Note:** No other CA and certificate formats have been used and tested so far.

# 5 Firewall

_**Notice 1:** Maybe optional, because your server provider might do that for you. Check if this is necessary for you!_

_**Notice 2:** Since the hosted version of STM uses ufw, this configuration is probably outdated._

Not that some systems use `ufw` and not `iptables` by default.
I'm not a firewall and networking expert at all but this `iptables` configuration should give you some basic protection:

* Install tool to persist firewall configs: `apt install iptables-persistent`
    * Set setup will ask to store current iptable configs, just select "No"
* Add the following rules (when using `iptables`):
    * `iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT`
        * Allows responses to come back to the server e.g. when `stm-server` makes requests to the OSM-Servers.
    * `iptables -A INPUT -i lo -j ACCEPT`
        * Allows local traffic (`-i lo` says "interface localhost")
    * `iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT`
        * Optional: Allows ping-requests. Not necessary but nice to check whether server is online or what latency there
          is.
    * `iptables -A INPUT -p tcp --dport <your ssh port> -j ACCEPT`
    * `iptables -A INPUT -p tcp --dport 443 -j ACCEPT`
    * `iptables -A INPUT -p tcp --dport 80 -j ACCEPT`
    * `iptables -P INPUT DROP`
* Store to file: `iptables-save > /etc/iptables/rules.v4`

There's also the possibility to specify what kind of local traffic (between stm-server, stm-db and localhost) is
allowed, etc. etc. However, this should block the most basic things: SSH on 22.
