This file contains some useful commands to observe the `journald` logs via `journalctl`.

These examples use the `stm-server` container but everything works for the `stm-db` and `stm-client` as well.

# Structure of log entries

A log entry printed by `journalctl` looks like this:

`Dec 18 15:32:17 myhostname fac0db6e3d61[3775856]: 2020-12-18 14:32:17.111 [INFO]  api_util.go:123      | #8bef | Call from 'hauke-stieler' (9627921) to GET /v2.5/projects/53/tasks`

But the relevant part for us is only the second half:

`...: 2020-12-18 14:32:17.111 [INFO]  api_util.go:123      | #8bef | Call from 'foo-bar' (123456789) to GET /v2.5/projects/53/tasks`

So we have the following parts from left to right:

* Date and time in UTC
* Log level (here: `[INFO]`)
* Code file and line where this was printed (here: `api_util.go` in line 123)
* Then we have an request ID. This is just an increasing hex number (here: `#8bef` which is request no. 35823 since the server started)
* Finally the actual log entry saying what happened. The example shows the information that the user "foo-bar" with user ID 123456789 made a `GET` request to the shown URL. But it could also be something like this: "Successfully got tasks of project 1234"

# Basics

## Show last `n` entries

By number of lines:

`journalctl CONTAINER_NAME=stm-server -n 100`

By date:

`journalctl CONTAINER_NAME=stm-server --since "2020-12-01"`

Use the `--until` parameter to specify an until-date that's not now.

## Update logs in realtime (follow-mode)

To always see latest log entries, use the follow-mode with `-f`:

`journalctl CONTAINER_NAME=stm-server -f`

This usually works fine together with further filtering, so filtered results are also updated when new entries are added to the log.

# Filtering

## Filter by keyword

Simply use the power of `grep`:

`journalctl CONTAINER_NAME=stm-server | grep "\[ERROR\]" | grep -i "your keyword with spaces"`

Grep will be case **i**nsensitive with the `-i` option.

## Multiple keywords

This will filter entries that contain `foo` *or* `bar`:

`journalctl CONTAINER_NAME=stm-server | grep "\[ERROR\]" | grep -i "foo\|bar"`

## Errors without `broken pipe`, `Token expired` and other non relevant error messages

`journalctl CONTAINER_NAME=stm-server | grep "\[ERROR\]" | grep -v "No valid auth\|broken pipe\|Token expired\|SELECT\|TLS\|Secret not valid"`

# Analytics

## Who used STM?

To simply get all requests with a valid token. This is logged for every request, so not just once every login:

`journalctl CONTAINER_NAME=stm-server | grep "has valid token"`

Prints a sorted list with unique user names of those who used STM:

`journalctl CONTAINER_NAME=stm-server | grep "has valid token" | sed "s/.*'\(.*\)'.*/\1/g" | sort | uniq`

## Get all requests from user "Foo"

`journalctl CONTAINER_NAME=stm-server | grep "Call from 'Foo'"`

## Get all logs from specific request

`journalctl CONTAINER_NAME=stm-server | grep "| #7b9c"`

