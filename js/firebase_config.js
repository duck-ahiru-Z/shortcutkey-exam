// js/firebase_config.js
// Firebase 連携用設定ファイル (ローカル専用・Git追跡除外済み)

const firebaseConfig = {
  apiKey: "AIzaSyAuAsWLctHoBp6Eh2UN2sIM3wE1YJZIxvQ",
  authDomain: "shortcut-key-exam.firebaseapp.com",
  projectId: "shortcut-key-exam",
  storageBucket: "shortcut-key-exam.firebasestorage.app",
  messagingSenderId: "522459442819",
  appId: "1:522459442819:web:3a390baf5d2b6e001075b6",
  measurementId: "G-7TRX1BYWC2"
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
