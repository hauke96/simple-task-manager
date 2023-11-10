# サーバー

サーバはgo(別名golang)で記述されているため、goをインストールして開発環境(パス、IDEなど)を設定する必要があります。

# 環境の設定

## 1. 必要なもの

* (モジュールをサポートする1.12以降の)インストールされ動作しているgoコンパイラ
* 次の**いずれか**のデータベースを実行すること:
   * dockerデーモンのインストールと設定(PostgreSQLデータベース用。設定については後述)
   * PostgreSQLサーバを直接インストールして設定する(9.6以降であれば動作します)
* そしてもちろん、あなたが選択したIDE環境(*GoLand*をファンシーパンツとして、*LiteIDE*を純粋なオープンソースとして、そしてもちろん*vim*をハードコアIDEとしてお勧めできます)

## 2. 依存関係

**一言でいうと**
* go バージョンが1.12以前 の場合: goモジュール全体が動作しない場合は、以下のパッケージがインストールされていることを確認してください。
* go バージョン1.12以降を使用している場合: ここでは何もしません

このプロジェクトは**goモジュール**インフラストラクチャを使用しているため、例えば`go build`はすべての依存関係をインストールします。
このプロジェクトが使用するフレームワーク/ライブラリは、開発を容易にするために存在します。

* [gorilla/mux](https://github.com/gorilla/mux)簡単に簡単なレストエンドポイントを作成できます
* [gorilla/websocket](https://github.com/gorilla/websocket) サーバー→クライアント通信用
* [x/oauth2](https://pkg.go.dev/golang.org/x/oauth2) OAuth2 認証用
* [lib/pq](https://github.com/lib/pq) PostgreSQL databaseドライバ
* [pkg/errors](https://github.com/pkg/errors)エラー処理が改善され、スタックトレースを表示できる
* [hauke96/sigolo](https://github.com/hauke96/sigolo) ロギング
* [hauke96/kingpin](https://github.com/hauke96/kingpin) CLIパラメータやフラグのパース

## 3. データベースを設定する

サーバには、`stm`という名前のデータベースと、次に説明する必要なテーブルが必要です。
この説明は、PostgreSQLを直接インストールするのではなく、Dockerを使用することを想定しています。

### データベースのユーザー/パスワードを環境変数として設定する

**一言でいうと**
* `export STM_DB_USERNAME=stm STM_DB_PASSWORD=secret STM_DB_HOST=localhost`

以下に示すテストを実行する場合、ユーザーとパスワードは上記と同じでなければなりません。

パブリックサイトとして実行する場合は、独自の**ユニークで安全な**パスワードに変更する必要があります。

### Dockerコンテナとして起動する

**一言でいうと**
* `docker-compose up --build stm-db`
* 以上

 `docker-compose.yml` には、必要なコンテナを定義してあるので、 `docker-compose up --build stm-db` することで開始できます。

### データベースを初期化する

**一言でいうと**
* `psql`がインストールされていることを確認してください
* データベースを起動する(まだ実行していない場合)
* `cd server/database/`
* `./init-db.sh`
* 以上

`server/database/`フォルダには、`init-db.sh`スクリプトが含まれています。
データベースを起動し、このスクリプトを(そのフォルダ内から)呼び出します。

`createdb`と`psql`のツールが必要です。どちらも-ubuntuユーザー向け-`postgresql-client`パッケージで利用可能です。

### データベースのリセット

**一言でいうと**
* `psql -h localhost -U stm -c 'DROP DATABASE stm;'`
* `cd server/database`
* `./init-db.sh`
* 以上

これは、現在のデータを削除する場合(テスト後など)に必要です。

## 4. ログインの設定

2つのアプローチがあります。

1. 実アカウントのOSM dev-API
2. OS M APIをエミュレートするローカルのフェイクサーバ

### OSM dev-APIを使用する

サーバのデフォルト設定は、](https://master.apis.dev.openstreetmap.org)OSMの開発API[を使用します。
したがって、OAuth認証を取得するには、そこにアカウントを持ち、ローカルアプリケーションを登録する必要があります。

#### OSM OAuth証明書

ログインを実行するには(ローカルで実行しているアプリケーションのログインであっても)、環境変数内にOAuth証明書(つまりOAuthコンシューマキーと秘密鍵)が必要です。

* `export STM_OAUTH2_CLIENT_ID="Eln7...rY66"`
* `export STM_OAUTH2_SECRET="fgg1...kl09"`

これらの変数は、新しい端末を起動するたびにエクスポートすることも、任意のファイル(`.bashrc`など)に格納してロードすることもできます。

## 5. セットアップが完了しました:)

これで、データベース、サーバ(下記参照)、クライアント([`client`フォルダのREADME](../../client)参照)を起動できました。`localhost:4200`のSTMアプリケーションにアクセスします。
すべてがすぐに動作するはずです。動作しない場合は、問題を提起してください。)

# サーバの実行

次の変数が表示されたら、サーバを起動します。

* `cd server`
* `go run .`

サーバはポート`8080`で起動し、動作しているかどうかをチェックする情報ページがあります:[localhost:8080/info](http://localhost:8080/info)

# テストの実行

`server/test/run.sh`スクリプトを使用してテストを実行し、ダミーデータ(テストに必要)をデータベースに提供します。
このスクリプトは、Dockerコンテナにデータベースを設定し、データベースにダミーデータを追加してテストを実行します。

**警告:**
このスクリプトは、`stm-db`dockerコンテナによって作成された`postgres-data`フォルダを削除します。

**一言でいうと**
* `cd server/test`
* `./run.sh`
* 以上

# ビルド

**一言でいうと**
* `cd server`
* `go build .`
* 以上

しかし、サーバーの`Dockerfile`が`go run`を使用してサーバーをビルドして直接起動するため、実際にはこれを使用しません。

# 設定

`./server/config/`フォルダに設定ファイルがあります。
詳細なドキュメントが整備されるまで、ファイルを直接参照してください。プロパティは非常に単純なものばかりです。
ローカル開発では、何も変更する必要はありません。

# HTTPS

 *let's encrypt* の証明書のみ実績があります。
少なくとも、設定で次のプロパティを設定する必要があります(もちろん、他のプロパティと一緒に)。

```json
{
	"server-url": "https://your.domain.com",
	"ssl-cert-file": "/etc/letsencrypt/live/your.domain.com/fullchain.pem",
	"ssl-key-file": "/etc/letsencrypt/live/your.domain.com/privkey.pem",
	...
}
```

**重要:**HTTPSを有効にするには、`server-url`プロパティが`https`で始まる必要があります。

**詳細情報**については、`doc/operation/ssl-cert.md`ファイルを参照してください。

# 開発

## エラー処理

ライブラリ/フレームワーク(例:データベースストア)からエラーが返された場合は、(`github.com/pkg/errors`パッケージから)`error.Wrap(err)`を使用し、返します。
これにより、後でHTTPレスポンスが作成されたときにスタックトレースが良好になります。
他のすべての場所は、すでにラップされている(したがってスタックトレースを生成する)ため、エラーを返します。

新しいエラーは、 `errors.New(...)`を使用して生成されす。

エラーをキャッチ、作成、またはラップする場合は、いつでも `sigolo.Error(...)`を使用して、追加情報を表示できるようにできます。