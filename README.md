# LINE AI ChatBot

OpenAI GPT-4を活用したLINE用のAIチャットボットです。

## 機能

- LINEグループ内でのメンション(@ボット名)に応答
- GPT-4を使用した自然な会話
- 毎月のトークン使用量の自動チェック

## 技術スタック

- Node.js
- Vercel (サーバーレスデプロイ)
- LINE Messaging API
- OpenAI API (GPT-4)

## セットアップ

1. 必要な環境変数を設定（Vercelで設定）:
   ```
   LINE_CHANNEL_ACCESS_TOKEN=
   LINE_CHANNEL_SECRET=
   OPENAI_API_KEY=
   LINE_BOT_NAME=
   ```

   GitHubActionsの設定（トークン消費量）
   ```
   OPENAI_API_KEY=
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

## 自動化機能

- GitHub Actionsによる毎月末のOpenAIトークン使用量チェック
- 使用量レポートの自動生成

## API エンドポイント

- `/api/webhook`: LINE Messaging APIからのWebhookを処理
- `/api/usage`: OpenAIのトークン使用量を取得

## ライセンス

ISC

## 作者

[itto1018](https://github.com/itto1018)