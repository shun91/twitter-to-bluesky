# twitter-to-bluesky

IFTTT 経由で X（旧 Twitter） から Bluesky へ自動投稿する Cloud Functons です。

X にポストすると IFTTT のトリガーによって Google Cloud Functions にデプロイした API が呼び出され、Bluesky へのポストを実行します。

## 使用方法

### Bluesky の App Password の発行

以下から発行します。詳しい方法はググれば出てきます。

https://bsky.app/settings/app-passwords

### Google Cloud Functions へのデプロイ

このリポジトリでは GitHub Actions を使用して Google Cloud Functions へのデプロイを自動化しています。具体的な設定は`.github/workflows/deploy.yml`を参照してください。

デプロイを実施するには以下の準備が必要です。

- Google Cloud のアカウントとプロジェクトが必要です。これは Google Cloud Functions へのデプロイに使用されます。
- 適切な権限を持つサービスアカウントが必要です。このサービスアカウントの認証情報（`GCP_WORKLOAD_IDENTITY_PROVIDER`、`GCP_SERVICE_ACCOUNT`）を GitHub Secrets に設定する必要があります。
  - 参考：[GitHub Actions から Google Cloud Functions にデプロイ | blog.shgnkn.io](https://blog.shgnkn.io/github-actions-deploy-google-cloud-functions/)
- Bluesky API を利用するために以下も GitHub Secrets に設定する必要があります。
  - `BSKY_EMAIL`: Bluesky のアカウントに登録しているメールアドレス
  - `BSKY_APP_PASS`: 発行した Bluesky の App Password
- また、デプロイした API が他人に利用されることがないように `ACCESS_TOKEN` も GitHub Secrets に設定する必要があります。値は任意の文字列で構いません。このトークンは、IFTTT から Cloud Functions へのリクエストを認証するために使用されます。

初回デプロイ後は Google Cloud Functions 側で認証がかかっています。認証を外すには以下を参考に設定してください。

[Firebase functions で 403 error "Your client does not have permission to get URL /\*\* from this server" となった場合の解決策 - Qiita](https://qiita.com/toshiaki_takase/items/ce65cd5582a80917b52f)

この認証を外したとしても、 `ACCESS_TOKEN` を知らない場合は API を叩けないので問題ありません。

### IFTTT の設定

前提として、X（旧 Twitter）と連携するため、Pro 以上の IFTTT アカウントが必要です（有料）。

IFTTT で Webhook を設定するには、新しいアプレットを作成し、そのトリガーとして Webhook を選択します。その後、トリガーが発生した際に送信される Webhook の URL を、Google Cloud Functions の URL に設定します。この URL は、Google Cloud Functions をデプロイした後に得られます。  
また、Additional Headers に `ACCESS_TOKEN` を設定します。これは GitHub Secrets にした `ACCESS_TOKEN` です。

詳細な設定内容は以下のキャプチャを参照してください。

![image](https://github.com/shun91/twitter-to-bluesky/assets/8047437/b0bbab9f-5f0a-470e-9507-6d31ab83630f)

![image](https://github.com/shun91/twitter-to-bluesky/assets/8047437/15a6fc6d-97ad-41af-ad3b-aaee47b6e173)

これで設定は完了です。  
IFTTT で指定したアカウントで X にポストすると、その内容が Bluesky にもポストされます。

## 開発方法

### ビルド

```sh
yarn build
```

### ローカル実行

環境変数に`BSKY_EMAIL`, `BSKY_APP_PASS`, `ACCESS_TOKEN` を設定して、下記コマンドを実行します。

```sh
yarn dev
```

Web サーバーが立ち上がります。curl コマンドなどを使用して動作確認できます。

```sh
curl -i -X POST \
   -H "Authorization:Bearer <ACCESS_TOKEN>" \
   -H "Content-Type:application/json" \
   -d '{"tweet": "ツイートの本文です。"}' \
 'http://localhost:8080'
```
