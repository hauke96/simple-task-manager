# Client

This is the web application of the simple task manager.
It's based on [Angular](https://angular.io) and uses `npm` as a package manager.

# Setup environment

1. Install `npm` and `node` as well
2. Go into this client folder (just `cd client`)
3. You need to globally install the Angular CLI (in order to use the `ng` command line tool)
    ```bash
    npm install -g @angular/cli
    ```
4. Install all dependencies
    ```bash
    npm install
    ```

## Run Client

Run `npm run dev` to start a development server.
Then open `http://localhost:4200/` in your browser.
The app will automatically recompile and reload if you change any of the source files.

## Run tests

This can be done using `npm run test`.
This script uses Firefox as default browser where the tests run in.

You can also use Chrome with `ng test --browsers=ChromeHeadless`.

# Build

**tl;dr:**
* npm run build

This creates a bunch of `.js` and `.css` files as well as the `index.html`.
All together can be copied to a normal HTTP server.

Similar to running the app, but with `npm run build`.
The output will be in `client/dist/simple-taskmanager/`.

**Beware:** This may take some time (up to several minutes), depending on your machine.

# Configuration

Currently the client has a very simple dev- and prod-configuration in `client/src/environments`.

Encryption (HTTPS) and HTTP-Server configs depend on the used HTTP-Server (Apache-HTTP, nginx, ...), so take a look at their documentation or at the `./client/nginx.conf` for my nginx config used in the `stm-client` docker container.
