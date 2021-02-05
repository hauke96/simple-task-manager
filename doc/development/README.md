**Note:** Before you start coding, take a look at the [CONTRIBUTING.md](../../CONTRIBUTING.md) to learn on how to contribute.

This file guides you through the setup process of the project. 
After this your development environment is setup and ready to go. 

# Components

There are two main components the SimpleTaskManager consists of:

* The **client** (or "frontend") is an Angular based web application and can be found in the `client/` folder with an according [README.md](../../client/README.md).
* The **server** (or "backend") is written in go (aka golang) and can be found in the `server/` folder with an according [README.md](../../server/README.md) as well.

Go through the "Getting started" section in order to setup your dev environment etc.

# Getting started

1. Make sure the tools `git`, `node`, `npm`, `go`, `psql`, `createdb`, `docker` and `docker-compose` are installed/available plus an IDE of your choice for the development with Typescript/Angular and golang.
The tools `psql` and `createdb` are both PostgreSQL tools.
2. Clone this repo
3. Client: See [/client/README.md](../../client/README.md)
    1. Read through the section "Setup environment"
    2. If not already done: Take a look at the sections "Run Client" and "Run Tests"
4. Server: See [/server/README.md](../../server/README.md)
    1. Read through the section "Setup environment"
    2. If not already done: Take a look at the sections "Run Server" and "Run Tests"
5. Read sections "Code conventions" and "Git workflow and conventions" of this document

# Code conventions

## General

Use variable and function names that are **as describing as possible**. It's okay if they consist of several words, for example: `AssignmentInProjectNeeded`.
Try not to abbreviate names, for example use `result` instead or `res` or `r`.

For **counter variables** in for-loops use simple letters like `i`.
For other counter variable, use a describing name.

It's okay to use one letter variables names in **for-each loops or lambda expressions**, but it's nicer to use real names.
Example: `for (const feature of features) {...` is better than `for (const f of features) {...`.

Try to **keep lines short**, so that they also fit onto smaller screens.
Everything up until 100 characters per line is totally fine.
Don't abbreviate names or use strange words just to fit into these 100 chars, better use nice names and have a longer line.

## Server

The formatting is always correct because the compiler will fail if there are formatting, import or minor code issues.

For **errors** use `err`.

For **receivers** use simple letters like `s` in `func (s *storePg) delete(...`.

## Client

You can check the technical formatting by running `npm run lint`.

## Markdown

Just make sure every new sentence is in a new line.
This keeps the document clean and makes git diffs more readable.

# Git workflow and conventions

Development takes place on the `dev` branch (small things) or on separate feature branches (whole features, not all commit have to work on these branches until merging with `dev`).

The `master` branch only contains released versions as separate commit which are also tagged.
Don't start features from the `master` branch, it doesn't contain the latest code changes.

A `release/...` branch is started to prepare a release.
This branch will then me merged into `master` and `dev`.

All of this is heavily inspired by the branching model *git flow* (never heard of it? You should [take a look at this](https://nvie.com/posts/a-successful-git-branching-model/)).

## Git conventions

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
Because the container build the whole project from scratch, starting everything probably takes a few minutes.

During **development** I recommend to not use docker but manually start the client and server (see according `README.md` files in [client](../../client/README.md) and [server](../../server/README.md) folders) and just use the docker container for the database.
