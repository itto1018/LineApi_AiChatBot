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


// トークン使用量を取得する関数
async function getTokenUsage() {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    
    const usage = await openai.billing.usage.list({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });

    return {
      total_tokens: usage.total_usage,
      total_cost: usage.total_usage / 100
    };
  } catch (error) {
    console.error('Error fetching token usage:', error);
    throw error;
  }
}

// トークン使用量をLINEに通知する関数を追加
export async function notifyTokenUsage() {
  try {
    const usage = await getTokenUsage();
    const startDate = new Date();
    startDate.setDate(1);
    const endDate = new Date();

    const usageMessage = [
      "🤖 【定期実行】OpenAI APIの月間使用状況レポート",
      `📅 集計期間: ${startDate.getMonth() + 1}月${startDate.getDate()}日～${endDate.getMonth() + 1}月${endDate.getDate()}日`,
      `🔢 使用トークン数: ${usage.total_tokens?.toLocaleString() || 0}`,
      `💰 概算費用: $${usage.total_cost?.toFixed(2) || 0}`,
      "\n※費用は概算です。実際の請求額は異なる場合があります。"
    ].join('\n');

    // 開発者のユーザーIDまたはグループIDを環境変数から取得
    const NOTIFY_TO = process.env.LINE_NOTIFY_TO;

    if (!NOTIFY_TO) {
      throw new Error('LINE_NOTIFY_TO is not set');
    }

    await client.pushMessage({
      to: NOTIFY_TO,
      messages: [{
        type: 'text',
        text: usageMessage
      }]
    });

    return { success: true, message: 'Usage notification sent' };
  } catch (error) {
    console.error('Error sending usage notification:', error);
    throw error;
  }
}