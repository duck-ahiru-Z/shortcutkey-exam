// build.js
// Vercel ビルド時に環境変数を埋め込んで静的ファイルを dist/ フォルダにビルドするスクリプト

const fs = require('fs');
const path = require('path');

// 1. dist ディレクトリの作成
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  // 古いdistディレクトリをクリーンアップ
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

// 2. 静的ファイルのコピー用再帰関数
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// コピー対象
const itemsToCopy = [
  'index.html',
  'portal.html',
  'exam.html',
  'dashboard.html',
  'questions',
  'assets',
  'js'
];

// ルートにあるフォールバック用のファイルもコピー
if (fs.existsSync('stamp-v4-vector-S5.svg')) itemsToCopy.push('stamp-v4-vector-S5.svg');
const fallbackQuestions = ['questions_1kyu.json', 'questions_2kyu.json', 'questions_3kyu.json', 'questions_4kyu.json', 'questions_5kyu.json'];
fallbackQuestions.forEach(q => {
  if (fs.existsSync(q)) itemsToCopy.push(q);
});

itemsToCopy.forEach(item => {
  if (fs.existsSync(item)) {
    copyRecursiveSync(item, path.join(distDir, item));
  }
});

// 3. firebase_config.js の環境変数置換と生成
const configExamplePath = path.join(__dirname, 'js', 'firebase_config.example.js');
if (!fs.existsSync(configExamplePath)) {
  console.error("Error: firebase_config.example.js not found!");
  process.exit(1);
}

let configText = fs.readFileSync(configExamplePath, 'utf8');

// 環境変数を埋め込む
const envs = {
  "YOUR_API_KEY": process.env.FIREBASE_API_KEY || "",
  "YOUR_PROJECT_ID.firebaseapp.com": process.env.FIREBASE_AUTH_DOMAIN || "",
  "YOUR_PROJECT_ID": process.env.FIREBASE_PROJECT_ID || "",
  "YOUR_PROJECT_ID.firebasestorage.app": process.env.FIREBASE_STORAGE_BUCKET || "",
  "YOUR_SENDER_ID": process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  "YOUR_APP_ID": process.env.FIREBASE_APP_ID || "",
  "YOUR_MEASUREMENT_ID": process.env.FIREBASE_MEASUREMENT_ID || ""
};

Object.keys(envs).forEach(placeholder => {
  // 置換処理
  configText = configText.split(placeholder).join(envs[placeholder]);
});

// dist/js/firebase_config.js として出力 (上書き)
const targetJsDir = path.join(distDir, 'js');
if (!fs.existsSync(targetJsDir)) {
  fs.mkdirSync(targetJsDir);
}
fs.writeFileSync(path.join(targetJsDir, 'firebase_config.js'), configText, 'utf8');

console.log('✔ firebase_config.js dynamically generated in dist/js/ from environment variables.');
console.log('✔ All files compiled into dist/ directory.');
console.log('Build completed successfully!');
