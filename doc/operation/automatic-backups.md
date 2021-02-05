This file describes the automatic creation of database backups.

# Setup

See the main [server.md](server.md) file (section about automatic backup) on how to set up automatic backups.

# How it works

## The timer
There are the `stm-backup.service` and `stm-backup.timer` files in this folder for a systemd-timer creating backups.
The timer runs every day at midnight.

## The backup creation script
The actual backup creation is done by the `create-backup.sh` script in the projects root folder.

The resulting file is GZIP compressed and is named like this: `stm-db-backup_[DATE].sql.gz`
The `[DATE]` placeholder is the date of *yesterday*.
Why? Because the timer runs at midnight, or probably a few seconds after midnight.
So we actually create a backup of yesterdays database.

## The service file
This script needs the `STM_DB_USERNAME` variable set, which may be done by the `.bashrc` of the `stm` user.
However service files of systemd don't source the bashrc, so we set the database username manually in the service file.

Adjust the service and timer file according to your needs.

# Restore backup

The SQL script contains all data including the database creation.
Therefore I assume that the `stm` database does **not** exist (you should rename it before applying the backup ;) ).

* Decompress backup: `gzip -k -d stm-db-backup_2020-12-24.sql.gz`
* Apply SQL script: `psql -h localhost -U $STM_DB_USERNAME -f stm-db-backup_2020-12-24.sql`