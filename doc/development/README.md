Development takes place on the `dev` branch (small, independent things) or on separate feature branches (whole features, not all commit have to run).
The `master` branch only contains released versions as separate commit that are tagged.

# Getting started

0. Install `git`, `node`, `npm`, `go` and `docker` plus IDE of your choice for the development with Typescript/Angular and golang.
1. Clone this repo
2. Client: See `/client/README.md`
    1. Go through the section "Setup environment"
    2. Take a look at the sections "Run Client" and "Run Tests"
3. Server: See `/server/README.md`
    1. Go through the section "Setup environment"
    2. Take a look at the sections "Run Server" and "Run Tests"
4. Read section "Git workflow and conventions" of this document

# Git workflow and conventions

All of this is heavily inspired by the branching model *git flow*.

## Conventions

* **no rebase**, only merges
* small commits
* short but precise commit messages (avoid messages like 'fix', 'rename', 'refactoring', 'done', 'wtf')
* branch names in small-caps and with dashes. No underscore, camel case, etc. Example: `feature/my-super-duper-feature`

## Feature workflow

### Start a feature

Just do it on a `feature/...` branch (so by e.g. using `git checkout -b feature/foo-bar-blubb`).

### Update from other branches

Use merges to update your branch. Updating from `dev` would look like this:

```bash
git fetch origin dev:dev
git merge --no-ff dev
```

Using `--no-ff` (creates a single, separate merge commit) is not required.

### Finish a feature

Go to the `dev` branch and merge it there:

```bash
# first update your branch
git fetch origin dev:dev
git merge --no-ff dev

# now move your changes into 'dev'
git checkout dev
git merge --no-ff feature/your-branch
```

Using `--no-ff` (creates a single, separate merge commit) is not required.

# Components

## Client

The client is an Angular based web application and can be found in the `client/` folder.
The `README.md` in this folder gives you further instruction on the setup, running, building, etc.

## Server

The server is written in go (aka golang) and can be found in the `server/` folder.
The `README.md` there also gives you instructions on setup, running, building, etc.

# Deployment

The `docker-compose.yml` creates three docker container for the client, server and the database.
Because the container build and test themselves, starting everything probably takes a few minutes.

To increase build time, there's an own [base image for the client](https://hub.docker.com/r/simpletaskmanager/stm-client-base).

During development I recommend to manually start the client and server (see according `README.md` files) and just use the docker container for the database.

## Server: Error handling

Whenever an error from a library/framework (e.g. in a database store) is returned, wrap it using `errors.Wrap(err)` (from the `github.com/pkg/errors` package) and return that.
This will later result in a nice stack trace when the HTTP response is created.
All other places just return the error because it's already wrapped (and therefore will already produce a stack trace).

New errors should also be created using `errors.New(...)`.

Whenever catching, creating or wrapping an error, feel free to print additional information using `sigolo.Error(...)`. 