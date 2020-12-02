# クライアント

これは単純なタスクマネージャのWebアプリケーションです。
主に[Angular](https://angular.io),[OpenLayers](https://openlayers.org/)に基づいており、パッケージマネージャとして`npm`を使用します。

# 環境の設定

1. `npm`と`node`もインストールします。
2. このclientフォルダに移動(`cd client`)します。
3. (`ng`コマンドラインツールを使用するには) Angular CLIをグローバルにインストールする必要があります
   ```bash
   npm install -g @angular/cli
   ```
4. すべての依存関係をインストールします。これは、`node_modules`フォルダへのローカルインストールです。
   ```bash
   npm install
   ```

これで準備ができました。
クライアントを起動してセットアップをテストします(以下を参照)。
クライアントの構築と起動はサーバなしで動作しますが、もちろんクライアントはサーバなしでは動作しません)。

## クライアントの実行

`npm run dev`を実行して、開発サーバーを起動します。
次に、ブラウザで`http://localhost:4200/`を開きます。
ソースファイルを変更すると、アプリケーションは自動的に再コンパイルと再読み込みを行います。

## テストを実行する

これは、`npm run test`を使用して実行できます。
このスクリプトは、テストが実行されるデフォルトブラウザとしてFirefoxを使用します。

`ng test--browsers=ChromeHeadless`でChromeを使用することもできます。

# ビルド

**一言でいうと**
* npm run build

これにより、`.js`と`.css`のファイルと、`index.html`が作成されます。
すべてを通常のHTTPサーバーにコピーできます。

アプリケーションの実行に似ていますが、`npm run build`があります。
`client/dist/simple-taskmanager/<lang>`に出力されます。ここで<lang>については、英語は`en-US`、日本語は`ja`、ドイツ語は`de`です。

**注意:**これには、マシンによっては時間がかかる場合があります(最大数分)。

# 設定

現在、クライアントは`client/src/environments`で非常に単純な dev-configuration と prod-configurationを使用しています。

暗号化(HTTPS)とHTTP-Serverの設定は使用されているHTTP-Server(Apache-HTTP,nginx, etc)に依存します。そのため、それぞれのプロダクトのドキュメントや、`stm-client`Dockerコンテナで使用されているnginx設定の`./client/nginx.conf`を参照してください。

# 国際化対応

## メッセージカタログを更新する

**一言でいうと**
* `cd client`
* `ng xi18n --output-path src/locale`
* 新しい/変更エントリを特定の翻訳ファイルにコピーする(例:`messages.xlf`を`messages.ja.xlf`にコピー)

## 翻訳

STMを翻訳するには、*OmegaT*や*Poedit*などの適切なXLF/XLIFFエディタを使用することをお勧めします。

### Poedit

1. 翻訳したい`.xlf`ファイルを開く
2. エントリを翻訳する
3. 保存をクリックするか、CTRL+Sを押す

### Omega-T

Poeditの代わりに、[Omega-T](https://omegat.org/)を[Okapiフィルタプラグイン](https://okapiframework.org/wiki/index.php?title=Okapi_Filters_Plugin_for_OmegaT)とともに翻訳につかうことができます。

1. Omega-Tを起動し、zh_CNなどのお気に入りのターゲット言語で新しいプロジェクトディレクトリに新しいプロジェクトを作成します。
2. Omega-Tを設定してOkapiプラグインXLIFFフィルタを有効にし、内部XLIFFフィルタを無効にします。
3. `client/src/locale/messages.xlf`を`<omegat_project>/source/messages.<langID>.xlf`にコピーします。(たとえば`messages.zh_CN.xlf`)
4. Omega-Tで`ファイル`-`再読み込み`をクリックします。
5. メッセージを翻訳
6. `ファイル`-`Omega-T上で`ターゲットファイルを生成する`をクリックします
7. `<omegat>/target/messages.<langID>.xlf`を`client/locale/messages.<langID>.xlf`にコピーします。

UIが更新され、source messages.xlfが変更されたら、ステップ3 - 6を繰り返してください。

### ローカル化設定を追加する

`<langID>`で示される新しい言語を、Angularコンパイラに通知するには、`client/angular.json`に次の3つの部分を追加します。

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
