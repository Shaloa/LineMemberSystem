require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const { Client } = require('@line/bot-sdk');

// Expressアプリケーションの作成
const app = express();
const port = 5000;

// CORS設定
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true,
}));

// ファイルアップロード用設定
const upload = multer({ dest: 'uploads/' });

// LINE APIの設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const lineClient = new Client(config);

// リクエストボディをJSON形式で受け取るために設定
app.use(bodyParser.json());

// Google Sheets API 認証
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// スプレッドシートID
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// Webhookエンドポイント（LINE Bot用）
app.post('/callback', (req, res) => {
  const events = req.body.events;

  Promise.all(events.map(event => {
    if (event.type === 'message' && event.message.type === 'text') {
      return lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: `あなたが送ったメッセージは: ${event.message.text}`,
      });
    }
  }))
    .then(() => res.status(200).send('OK'))
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error');
    });
});

// 登録・更新エンドポイント
app.post('/api/register', upload.single('idImage'), async (req, res) => {
  const data = req.body;
  const file = req.file;

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

    // 現在のシートデータを取得
    const getRows = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'シート1!A:K',
    });

    const rows = getRows.data.values || [];
    const userIdList = rows.map(row => row[0]);
    const findRowIndex = userIdList.indexOf(data.userId);

    if (findRowIndex !== -1) {
      // 更新処理
      const updateRange = `シート1!A${findRowIndex + 1}:K${findRowIndex + 1}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: updateRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            data.userId,
            rows[findRowIndex][1], // 登録日時はそのまま
            now,                   // 更新日時だけ更新
            data.name,
            data.furigana,
            data.birth,
            data.gender,
            data.address,
            data.email,
            file ? file.filename : '',
            data.agreed,
          ]]
        }
      });
      console.log('既存データを更新しました');
    } else {
      // 新規登録
      const insertValues = [[
        data.userId,
        now,
        now,
        data.name,
        data.furigana,
        data.birth,
        data.gender,
        data.address,
        data.email,
        file ? file.filename : '',
        data.agreed,
      ]];
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'シート1!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: insertValues,
        },
      });
      console.log('新しいデータを追加しました');
    }

    res.json({ success: true, message: '登録完了！' });
  } catch (err) {
    console.error('スプレッドシート書き込みエラー:', err);
    res.status(500).json({ success: false, message: '登録に失敗しました。' });
  }
});

// ユーザー情報取得API
app.get('/api/userinfo', async (req, res) => {
  const userId = req.query.userId; // クエリパラメータからuserIdを受け取る

  if (!userId) {
    return res.status(400).json({ success: false, message: 'userIdが指定されていません' });
  }

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // スプレッドシート全体を取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'シート1!A1:Z', // データ範囲（必要に応じて広げる）
    });

    const rows = response.data.values || [];

    // 1行目はヘッダー想定なので飛ばす
    const dataRows = rows.slice(1);

    // userId列（A列にuserIdがある想定）の一致を探す
    const userRow = dataRows.find(row => row[0] === userId);

    if (!userRow) {
      return res.status(404).json({ success: false, message: 'ユーザーが見つかりませんでした' });
    }

    // スプレッドシートのカラム順に合わせてオブジェクト作成
    const userData = {
      userId: userRow[0],
      createdAt: userRow[1],
      updatedAt: userRow[2],
      name: userRow[3],
      furigana: userRow[4],
      birth: userRow[5],
      gender: userRow[6],
      address: userRow[7],
      email: userRow[8],
      // agreed はサーバーでは不要なので省略してもOK
    };

    res.json({ success: true, data: userData });
  } catch (err) {
    console.error('ユーザー情報取得エラー:', err);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
});


// サーバー起動
app.listen(port, () => {
  console.log(`サーバーが http://localhost:${port} で起動しました`);
});
