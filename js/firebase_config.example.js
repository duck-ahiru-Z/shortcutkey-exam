// js/firebase_config.example.js
// Firebase 連携用設定ファイルのテンプレート
// このファイルを「firebase_config.js」にコピーし、ご自身の Firebase 接続キーを記入してください。

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Firebase 設定が完了しているか（プレースホルダーのままではないか）の判定フラグ
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

let db = null;

if (isFirebaseConfigured) {
  try {
    // Firebase App & Firestore の初期化 (Compat API)
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log("Firebase/Firestore 連携が正常に初期化されました。");
  } catch (err) {
    console.error("Firebase の初期化中にエラーが発生しました:", err);
  }
} else {
  console.log("Firebase APIキーが未設定のため、デモ/ローカルモックモードで動作します。");
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
