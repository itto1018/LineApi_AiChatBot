# LINE AI ChatBot

OpenAI GPT-4を活用したLINE用のAIチャットボットです。

## 機能

- LINEグループ内でのメンション(@ボット名)に応答
- GPT-4o miniを使用した自然な会話

## 技術スタック

- Node.js
- Vercel (サーバーレスデプロイ)
- LINE Messaging API
- OpenAI API (GPT-4 mini)

## セットアップ

1. 必要な環境変数を設定（Vercelで設定）:
   ```
   LINE_CHANNEL_ACCESS_TOKEN=
   LINE_CHANNEL_SECRET=
   OPENAI_API_KEY=
   LINE_BOT_NAME=
   ```

2. 依存関係のインストール:
   ```bash
   npm install
   ```

3. ローカル開発の開始:
   ```bash
   npm run dev
   ```

## 使用方法

1. LINEグループにボットを追加
2. "@ボット名 質問内容" の形式でメッセージを送信
3. ボットが自然な日本語で応答

## API エンドポイント

- `/api/webhook`: LINE Messaging APIからのWebhookを処理
