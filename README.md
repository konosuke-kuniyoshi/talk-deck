# Talk Deck

リアルタイムで遊べるオンラインカードゲームアプリです。Next.js、Socket.io、Prismaを用いて、複数人でのターン制カードゲームを実現しています。

## 主な機能
- ルーム作成・参加（URL共有で招待）
- 参加者名・人数管理（定員制御、オーナー判定）
- ゲーム開始・ターン制進行
- カードの配布・プレイ
- リアルタイム同期（Socket.io）
- ゲーム終了判定（ターン数上限など）
- 参加者の切断・再接続対応

## 技術スタック
- Next.js (App Router, TypeScript)
- React, Tailwind CSS
- Socket.io（リアルタイム通信）
- Prisma（DB管理, SQLite/PostgreSQL対応）
- Node.js サーバー

## セットアップ手順

1. 依存パッケージのインストール
	```sh
	npm install
	```
2. DBマイグレーション・初期化
	```sh
	npx prisma migrate deploy
	npx prisma db seed
	```
3. サーバー起動
	```sh
	npm run dev
	# または
	node server.js
	```
	- Next.js: http://localhost:3000/
	- Socket.ioサーバー: http://localhost:4000/

## ディレクトリ構成

- `app/` ... Next.jsアプリ本体
  - `components/` ... UIコンポーネント（GameBoard, WaitingRoom, GameSetup等）
  - `api/` ... APIルート
  - `room/` ... ルームごとのページ
  - `lib/` ... Prisma/Socket等のライブラリ
- `server.js` ... Socket.ioサーバー
- `prisma/` ... Prismaスキーマ・マイグレーション
- `public/` ... 静的ファイル

## 開発Tips
- 主要な状態管理は`app/components/`配下のReactコンポーネントで行います。
- サーバー側のルーム・参加者管理は`server.js`で実装。
- DB操作は`prisma/`と`app/lib/prisma.ts`。
- WebSocketイベントは`lib/socket.ts`と`server.js`で定義。

## デプロイ
- `Procfile`/`aws-elastic-beanstalk-cli-setup/`を利用し、AWS Elastic Beanstalk等でのデプロイに対応。
- 環境変数やDB接続設定は適宜`.env`で管理してください。

## ライセンス
MIT
