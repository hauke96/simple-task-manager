# Client

This is the web application of the simple task manager.
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

This creates a bunch of `.js` and `.css` files as well as the `index.html`.
All together can be copied to a normal HTTP server.

Similar to running the app, but with `npm run build`.
The output will be in `client/dist/simple-taskmanager/<lang>`, where `en-US` for English,
`ja` for Japanese and `de` for Deutsch.

**Beware:** This may take some time (up to several minutes), depending on your machine.

# Code conventions

See the [development README](../doc/development/README.md) for details.

# Configuration

Currently the client has a very simple dev- and prod-configuration in `client/src/environments`.

Encryption (HTTPS) and HTTP-Server configs depend on the used HTTP-Server (Apache-HTTP, nginx, ...), so take a look at their documentation or at the `./client/nginx.conf` for my nginx config used in the `stm-client` docker container.

# Internationalization

## Update message catalog

**tl;dr:**
* `cd client`
* `ng xi18n --output-path src/locale`
* Copy new/changes entries to specific translation files (e.g. from the `messages.xlf` to `messages.ja.xlf`)

## Translation

In order to translate STM, it's recommended to use a proper XLF/XLIFF editor like *Omega-T* or *Poedit*.

### Poedit

1. Open the `.xlf` file you want to translate
2. Translate the entries
3. Click save or hit CTRL+S

### Omega-T

Alternatively you can use [Omega-T](https://omegat.org/) with the 
[Okapi filters plugin](https://okapiframework.org/wiki/index.php?title=Okapi_Filters_Plugin_for_OmegaT) for translation.

1. Start Omega-T and create new project at new project directory with your favorit target language such as zh_CN.
2. Configure Omega-T enable Okapi Plugins XLIFF filter and disable internal XLIFF filter.
3. Copy `client/src/locale/messages.xlf` to `<omegat_project>/source/messages.<langID>.xlf` such as `messages.zh_CN.xlf`
4. Click `File`-`Reload` on Omega-T.
5. Translate messages.
6. Click `File`-`Generate target file` on Omega-T
7. Copy `<omegat>/target/messages.<langID>.xlf` to `client/locale/messages.<langID>.xlf`

When UI is updated and source messages.xlf changed, please repeat step 3 - 6.

### Add localize configuration

To tell the Angular-compiler about the new language, add the following three parts into the `client/angular.json` for `<langID>`:

```json
  "projects": {
    "simple-task-manager": {
      "i18n": {
        "sourceLocale": "en-US",
        "locales": {
          "ja": "src/locale/messages.ja.xlf",
          "de": "src/locale/messages.de.xlf",
          "<langID>": "src/locale/messages.<langID>.xlf"
        }
      },
      "architect": {
```

```json
      "architect": {
        "build": {
          "configurations": {
            "ja": {
              "localize": ["ja"]
            },
            "de": {
              "localize": ["de"]
            },
            "<langID>": {
              "localize": ["<langID>"]
            },
```

```json
        "serve": {
          "configurations": {
            "production": {
              "browserTarget": "simple-task-manager:build:production"
            },
            "ja": {
              "browserTarget": "simple-task-manager:build:ja"
            },
            "de": {
              "browserTarget": "simple-task-manager:build:de"
            },
            "<langID>": {
              "browserTarget": "simple-task-manager:build:<langID>"
            }
```
