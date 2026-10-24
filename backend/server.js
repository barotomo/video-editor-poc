const express = require('express');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// ディレクトリの準備
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'outputs');
const THUMB_DIR = path.join(__dirname, 'thumbnails');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR);

// 静的ファイルの配信設定
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
}, express.static(UPLOAD_DIR));

app.use('/outputs', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
}, express.static(OUTPUT_DIR));

app.use('/thumbnails', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
}, express.static(THUMB_DIR));

// 1. タイムライン用 サムネイル画像一括生成 API
app.post('/api/thumbnails', (req, res) => {
  const { fileName } = req.body;
  const inputPath = path.join(UPLOAD_DIR, fileName);
  const baseName = path.parse(fileName).name;
  const videoThumbDir = path.join(THUMB_DIR, baseName);

  if (!fs.existsSync(videoThumbDir)) {
    fs.mkdirSync(videoThumbDir, { recursive: true });
  }

  // 既に生成済みの場合はその画像を返す
  const existingFiles = fs.readdirSync(videoThumbDir).filter(f => f.endsWith('.jpg'));
  if (existingFiles.length > 0) {
    console.log('既存のサムネイルを返却します:', existingFiles.length, '枚');
    const imageUrls = existingFiles.sort().map(file => `/thumbnails/${baseName}/${file}`);
    return res.json({ success: true, thumbnails: imageUrls });
  }

  console.log('サムネイル生成を開始します:', inputPath);

  // 2秒ごとに1枚のフレーム画像を抽出して保存
  ffmpeg(inputPath)
    .outputOptions([
      '-vf', 'fps=1/2,scale=160:90'
    ])
    .output(path.join(videoThumbDir, 'thumb-%03d.jpg'))
    .on('end', () => {
      const files = fs.readdirSync(videoThumbDir).filter(f => f.endsWith('.jpg'));
      console.log('サムネイル生成完了:', files.length, '枚完了');
      const imageUrls = files.sort().map(file => `/thumbnails/${baseName}/${file}`);
      res.json({ success: true, thumbnails: imageUrls });
    })
    .on('error', (err) => {
      console.error('Thumbnail Error:', err);
      res.status(500).json({ error: 'サムネイル生成失敗' });
    })
    .run();
});

// 2. 動画カット（トリム）API
app.post('/api/trim', (req, res) => {
  const { fileName, startTime, duration } = req.body;
  const inputPath = path.join(UPLOAD_DIR, fileName);
  const outputFileName = `trimmed_${Date.now()}_${fileName}`;
  const outputPath = path.join(OUTPUT_DIR, outputFileName);

  ffmpeg(inputPath)
    .setStartTime(startTime)
    .setDuration(duration)
    .output(outputPath)
    .on('end', () => {
      res.json({
        success: true,
        downloadUrl: `/outputs/${outputFileName}`
      });
    })
    .on('error', (err) => {
      console.error('FFmpeg Error:', err);
      res.status(500).json({ error: '動画処理に失敗しました。' });
    })
    .run();
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});