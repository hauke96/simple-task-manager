# Client

This is the web application of the SimpleTaskManager.
It's mainly based on [Angular](https://angular.io), [OpenLayers](https://openlayers.org/) and uses `npm` as a package manager.

# Setup environment

1. Install `npm` and `node` as well
2. Go into this client folder (just `cd client`)
3. You need to globally install the Angular CLI (in order to use the `ng` command line tool)
    ```bash
    npm install -g @angular/cli
    ```
4. Install all dependencies. This is just a local installation into the `node_modules` folder.
    ```bash
    npm install
    ```

Now you are ready to go.
Test your setup by starting the client (see below).
Building and starting the client works without the server, but of course the client won't work without server).

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

This creates a bunch of files in `client/dist/simple-taskmanager`.
They can simply be copied to a normal HTTP server.

# Code conventions

See the [development README](../doc/development/README.md) for details.

# Configuration

The client has a dev-, local- and prod-configuration in `client/src/environments`.
The dev-environment is the default one, the local-environment uses a locally hosted authentication server and the prod-environment is used for deployment on a server. 

Encryption (HTTPS) and HTTP-Server configs depend on the used HTTP-Server (Apache-HTTP, nginx, ...), so take a look at their documentation or at the `./client/nginx.conf` for my nginx config used in the `stm-client` docker container.

# Internationalization

This project uses ` ngx-translate` as library for i18n (internationalization).
This means that `src/assets/i18n` contains a JSON file for each supported language and an HTML file for the changelog on the front page.
Next to them two TypeScript files are important too.

## Add new language

Let's assume you want to translate STM into french, which has the language code `fr`.

1. Copy the `en-US.json` file (this contains "the truth") in the `src/assets/i18n` folder to `fr.json`.
2. Go into `src/app/app.component.ts` and add your new language to the list `translate.addLangs([....., 'fr']);`.
3. Go into `src/app/common/services/selected-language.service.ts` and also add your language to the list returned in the `getKnownLanguages()` method.
4. Translate your `fr.json`, so that e.g. the line `"properties": "Properties:",` turns into `"properties": "Paramètres:",`.

## Update language file

Basically just go through your JSON file and translate all entries.

If some/a few entries are missing in the translation file, you probably want to add and translate them manually. 
If a lot of entries are missing, you probably should delete the existing file and add the language from scratch (s. above).
