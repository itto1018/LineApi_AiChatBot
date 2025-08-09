import { messagingApi } from '@line/bot-sdk';
import OpenAI from 'openai';

// API向け環境変数の取得
const line_config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = new messagingApi.MessagingApiClient(line_config);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const events = req.body.events;
    
    // イベントが存在しない場合は200を返す
    if (!events || events.length === 0) {
      return res.status(200).json({ message: 'No events' });
    }
    
    // 各イベントを処理
    await Promise.all(events.map(handleEvent));
    
    res.status(200).json({ message: 'OK' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Botの名前を環境変数から取得
const LINE_BOT_NAME = process.env.LINE_BOT_NAME || '';

async function handleEvent(event) {
  // メッセージイベント以外は無視
  if (event.type !== 'message' || event.message.type !== 'text') {
    return;
  }

  const message = event.message.text;

  try {
    // Botがメンションされているかチェック
    const isMentioned = message.toLowerCase().includes(`@${LINE_BOT_NAME.toLowerCase()}`);
    if (!isMentioned) {
      return;
    }

    // メンション部分を削除してクリーンな質問を取得
    const cleanMessage = message.replace(/@\w+\s*/, '').replace(/^!\s*/, '').trim();
    if (!cleanMessage) {
      return;
    }

    // OpenAI APIに問い合わせ
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `
            あなたはLINEグループのLINE Botです。以下の条件で回答してください：
            - 日本語で回答する
            - 200文字以内で簡潔に答える
            - 必要に応じて「詳しくは○○で検索してみてください」と付け加える
            - 高校生にも理解できるように説明する
            - 専門用語は避けて分かりやすく説明
            - ネットミームや流行語を使用する
            - ユーモアを交えて、親しみやすい口調で答える
            - ただし、LINEの利用規約に違反しない内容である
            `
        },
        {
          role: 'user',
          content: cleanMessage
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    // LINEに返信
    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [{
        type: 'text',
        text: aiResponse
      }]
    });
  } catch (error) {
    console.error('Error handling message:', error);
    
    // エラー時の返信
    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [{
        type: 'text',
        text: '申し訳ありません。エラーが発生しました。少し時間をおいてから再度お試しください。'
      }]
    });
  }
}
