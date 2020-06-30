Everything you need to know in order to contribute to the code base.

# Components

Next to a database, there are two main components the simple task manager consists of:

* The **client** (or "frontend") is an Angular based web application and can be found in the `client/` folder with an according [README.md](../../client/README.md)
* The **server** (or "backend") is written in go (aka golang) and can be found in the `server/` folder with an according [README.md](../../server/README.md) as well

Go through the "Getting started" section in order to setup your dev environment etc.

# Getting started

1. Make sure the tools `git`, `node`, `npm`, `go`, `psql`, `createdb` and `docker` are installed/available plus an IDE of your choice for the development with Typescript/Angular and golang.
The tools `psql` and `createdb` are PostgreSQL tools.
2. Clone this repo
3. Client: See [/client/README.md](../../client/README.md)
    1. Go through the section "Setup environment"
    2. If not already done: Take a look at the sections "Run Client" and "Run Tests"
4. Server: See [/server/README.md](../../server/README.md)
    1. Go through the section "Setup environment"
    2. If not already done: Take a look at the sections "Run Server" and "Run Tests"
5. Read section "Git workflow and conventions" of this document

# Git workflow and conventions

Development takes place on the `dev` branch (small things) or on separate feature branches (whole features, not all commit have to work on these branches until merging with `dev`).
The `master` branch only contains released versions as separate commit which are also tagged.

All of this is heavily inspired by the branching model *git flow* (never heard of it? You should [take a look at this](https://nvie.com/posts/a-successful-git-branching-model/)).

## Conventions

* **no rebase**, only merges
* small commits
* short but precise commit messages (avoid one-word messages like 'fix', 'rename', 'refactoring', 'done', 'stuff', 'wtf' and so on)
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

# Deployment

The `docker-compose.yml` creates three docker container for the client, server and the database.
Because the container build and test themselves, starting everything probably takes a few minutes.

To increase build time, there's an own [base image for the client](https://hub.docker.com/r/simpletaskmanager/stm-client-base).

During development I recommend to manually start the client and server (see according `README.md` files in [client](../../client/README.md) and [server](../../server/README.md) folders) and just use the docker container for the database.
