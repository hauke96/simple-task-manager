# Client

This is the web application of the simple task manager.
It's based on [Angular](https://angular.io) and uses `npm` as a package manager.

## Setup environment

1. Download/clone this repo and go into this client folder.
2. I assume you have `npm` installed (if not: install it using your package manager)
3. You need to globally install the Angular CLI (in order to use the `ng` command line tool) and install the needed packages

```bash
npm install -g @angular/cli
npm install
```

## Run locally

Run `npm run dev` to start a development server.
Then open `http://localhost:4200/` in your browser.
The app will automatically recompile and reload if you change any of the source files.

## Run tests

This can be done using `npm run test`.
This script uses Firefox as default browser where the tests run in.

You can also use Chrome with `ng test --browsers=ChromeHeadless`.

## Build

Same as above but with `npm run build`.
The output will be in `client/dist/simple-taskmanager/`.

## Configuration

Currently the client is not very mich configurable.
This has a reason: Currently the code is very simple and the authentication with the OSM servers is done by the server (s. below).

Encryption (HTTPS) and HTTP-Server configs depend on the used Server (Apache-HTTP, nginx, ...), so take a look at their documentation or at the `./client/nginx.conf` for my nginx config.
