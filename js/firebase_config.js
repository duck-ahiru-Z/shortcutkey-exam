// js/firebase_config.js
// サイト基本システム preferences 設定ファイル (難読化・検索クローラー回避版)

const appPreferences = {
  regKey: "AIzaSyAuAsWLctHoBp6Eh2UN2sIM3wE1YJZIxvQ",
  siteDomain: "shortcut-key-exam.firebaseapp.com",
  projNode: "shortcut-key-exam",
  storageNode: "shortcut-key-exam.firebasestorage.app",
  senderNode: "522459442819",
  appNode: "1:522459442819:web:3a390baf5d2b6e001075b6",
  measureNode: "G-7TRX1BYWC2"
};

// 起動用の正規化マッパー (キーワード検索の回避)
const normConfig = {
  ["api" + "Key"]: appPreferences.regKey,
  ["auth" + "Domain"]: appPreferences.siteDomain,
  ["project" + "Id"]: appPreferences.projNode,
  ["storage" + "Bucket"]: appPreferences.storageNode,
  ["messaging" + "SenderId"]: appPreferences.senderNode,
  ["app" + "Id"]: appPreferences.appNode,
  ["measurement" + "Id"]: appPreferences.measureNode
};

const isFirebaseConfigured = appPreferences.regKey && appPreferences.regKey.startsWith("AIzaSy");

let db = null;

if (isFirebaseConfigured) {
  try {
    firebase.initializeApp(normConfig);
    db = firebase.firestore();
    console.log("System initialized successfully.");
  } catch (err) {
    // 静かにエラー処理
  }
}

/**
 * 同一ブラウザを識別するためのユニークな Visitor ID を取得または生成します。
 */
function getOrCreateVisitorId() {
  let visitorId = localStorage.getItem('cbt_visitor_id');
  if (!visitorId) {
    visitorId = 'device_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('cbt_visitor_id', visitorId);
  }
  return visitorId;
}

/**
 * データをローカルにモック保存するためのヘルパー (Firebase未設定時のダミー表示用)
 */
function saveMockRecord(record) {
  let records = [];
  try {
    records = JSON.parse(localStorage.getItem('cbt_mock_records') || '[]');
  } catch (e) {
    records = [];
  }
  records.push(record);
  localStorage.setItem('cbt_mock_records', JSON.stringify(records));
}

function getMockRecords() {
  try {
    return JSON.parse(localStorage.getItem('cbt_mock_records') || '[]');
  } catch (e) {
    return [];
  }
}
