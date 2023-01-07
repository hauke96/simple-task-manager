This file describes how the automatic creation of database backups works.

There are different ways for automatic background jobs and this approach is just one of many.
Here we use **systemd timers** to periodically start a script to create a backup.

# Setup

* Create symlinks of the service and timer files (s. below) in `/lib/systemd/system/`
* Create a symlink of the `create-backup.sh` script (from the server folder in this git repo) to the path to which `ExecStart` in your `.service` file points to
* Make sure you have an `.env` file with all needed environment variables at the location the `EnvironmentFile` property of your `.service` file points to
  * You might not have an `.env` file yet. Take a look at the [server.md](./server.md), there's a whole section about that file
  * The important environment variables for the backup script are: `$STM_DB_HOST` and `$STM_DB_USERNAME`
* Enable both with `systemctl enable stm-backup.service` and `.timer` accordingly
* Start the timer with `systemctl start stm-backup.timer`

You can test the setup manually:

* Start the service with `systemctl start stm-backup.service`
* Take a look into the logs with `journalctl -u stm-backup.service` and watch for errors

# How it works

There are three parts here:

1. The timer (`stm-backup.timer`): Defines when the backup jobs should run
3. The service (`stm-backup.service`) file: Is called by systemd (according to the intervall defined in the timer file) and calls the backup script
2. The backup script (`create-backup.sh` in the project root folder): Creates the backup, compresses it and stores it in a certain folder

## The timer
The `stm-backup.timer` file only defines *when* the backup job should run.
Per default this is daily at midnight.

## The service file
The `stm-backup.service` service file defines what script to call.
It needs the `.env` file you may know from the [docker deployment](server.md) (s. section about the configuration) because the `create-backup.sh` needs certain environment variables.

Adjust the service and timer file according to your needs (especially the paths).

## The backup creation script
The actual backup creation is done by the `create-backup.sh` script in the projects root folder.

The resulting file is GZIP compressed and is named like this: `stm-db-backup_[DATE].sql.gz`
The `[DATE]` placeholder is the date of *yesterday*.
Why? Because the timer runs at midnight, or probably a few seconds after midnight, so we actually create a backup of yesterdays database.

# Restore backup

The SQL script contains all data including the database creation.
Therefore, I assume that the `stm` database does **not** exist (you should rename it before applying the backup ;) ).

* Decompress backup: `gzip -k -d stm-db-backup_2020-12-24.sql.gz`
* Apply SQL script: `psql -h localhost -U $STM_DB_USERNAME -f stm-db-backup_2020-12-24.sql`
