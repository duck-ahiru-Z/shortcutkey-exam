import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptRootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = process.env.VALIDATE_ROOT
  ? path.resolve(process.env.VALIDATE_ROOT)
  : scriptRootDir;
const failures = [];
const checks = [];

function pass(message) {
  checks.push(message);
}

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function validateQuestionFile(relativePath, { requireEnoughQuestions = false } = {}) {
  let data;
  try {
    data = JSON.parse(read(relativePath));
  } catch (error) {
    fail(`${relativePath}: JSONを解析できません (${error.message})`);
    return;
  }

  assert(typeof data.id === 'string' && data.id.length > 0, `${relativePath}: idが必要です`);
  assert(Number.isInteger(data.questionsCount) && data.questionsCount > 0, `${relativePath}: questionsCountは正の整数である必要があります`);
  assert(Number.isInteger(data.duration) && data.duration > 0, `${relativePath}: durationは正の整数である必要があります`);
  assert(typeof data.passingRate === 'number' && data.passingRate > 0 && data.passingRate <= 1, `${relativePath}: passingRateは0より大きく1以下である必要があります`);
  assert(Array.isArray(data.pool), `${relativePath}: poolは配列である必要があります`);
  if (!Array.isArray(data.pool)) return;

  if (requireEnoughQuestions) {
    assert(data.pool.length >= data.questionsCount, `${relativePath}: 公開級の問題数が不足しています (${data.pool.length}/${data.questionsCount})`);
  }

  const ids = new Set();
  data.pool.forEach((question, index) => {
    const label = `${relativePath}: pool[${index}]`;
    assert(question && typeof question === 'object', `${label}はオブジェクトである必要があります`);
    if (!question || typeof question !== 'object') return;

    assert(Number.isInteger(question.id), `${label}.idは整数である必要があります`);
    if (Number.isInteger(question.id)) {
      assert(!ids.has(question.id), `${relativePath}: 問題ID ${question.id} が重複しています`);
      ids.add(question.id);
    }
    assert(typeof question.question === 'string' && question.question.trim().length > 0, `${label}.questionが空です`);
    assert(Array.isArray(question.choices) && question.choices.length === 4, `${label}.choicesは4件必要です`);
    if (Array.isArray(question.choices)) {
      assert(question.choices.every(choice => typeof choice === 'string' && choice.length > 0), `${label}.choicesには空でない文字列だけを指定してください`);
      assert(new Set(question.choices).size === question.choices.length, `${label}.choicesに重複があります`);
      assert(question.choices.includes(question.answer), `${label}.answerがchoicesに含まれていません`);
    }
  });

  pass(`${relativePath} の問題データ`);
}

function extractAvailableGrades(relativePath) {
  const source = read(relativePath);
  const match = source.match(/const\s+availableGrades\s*=\s*\[([^\]]*)\]/);
  if (!match) {
    fail(`${relativePath}: availableGradesを取得できません`);
    return [];
  }
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map(item => item[1]);
}

function validatePublishedGrades() {
  const portalGrades = extractAvailableGrades('portal.html');
  const examGrades = extractAvailableGrades('exam.html');
  assert(portalGrades.length > 0, '公開級が1件以上必要です');
  assert(JSON.stringify(portalGrades) === JSON.stringify(examGrades), 'portal.htmlとexam.htmlの公開級が一致していません');

  for (const grade of portalGrades) {
    const relativePath = `questions/questions_${grade}.json`;
    assert(fs.existsSync(path.join(rootDir, relativePath)), `${grade}: 問題ファイル ${relativePath} が存在しません`);
    if (fs.existsSync(path.join(rootDir, relativePath))) {
      validateQuestionFile(relativePath, { requireEnoughQuestions: true });
    }
  }
  pass('公開級と問題ファイルの対応');
}

function validateAllQuestionJson() {
  const questionDir = path.join(rootDir, 'questions');
  for (const filename of fs.readdirSync(questionDir).filter(name => name.endsWith('.json')).sort()) {
    const relativePath = `questions/${filename}`;
    if (/^questions_\dkyu\.json$/.test(filename)) continue;
    try {
      JSON.parse(read(relativePath));
      pass(`${relativePath} のJSON構文`);
    } catch (error) {
      fail(`${relativePath}: JSONを解析できません (${error.message})`);
    }
  }

  for (const filename of fs.readdirSync(questionDir).filter(name => /^questions_\dkyu\.json$/.test(name)).sort()) {
    const grade = filename.match(/^questions_(\dkyu)\.json$/)[1];
    const isPublished = extractAvailableGrades('portal.html').includes(grade);
    if (!isPublished) validateQuestionFile(`questions/${filename}`);
  }
}

function validateInlineScripts() {
  const htmlFiles = fs.readdirSync(rootDir).filter(name => name.endsWith('.html')).sort();
  for (const filename of htmlFiles) {
    const html = read(filename);
    const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let match;
    let inlineIndex = 0;
    while ((match = scriptPattern.exec(html)) !== null) {
      if (/\bsrc\s*=/.test(match[1])) continue;
      if (!match[2].trim()) continue;
      inlineIndex += 1;
      try {
        new vm.Script(match[2], { filename: `${filename}#inline-${inlineIndex}` });
      } catch (error) {
        fail(`${filename}: インラインJavaScriptに構文エラーがあります (${error.message})`);
      }
    }
    pass(`${filename} のインラインJavaScript構文`);
  }
}

function validateRelativeAssets() {
  const htmlFiles = fs.readdirSync(rootDir).filter(name => name.endsWith('.html')).sort();
  for (const filename of htmlFiles) {
    const html = read(filename);
    for (const match of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
      const reference = match[1];
      if (/^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(reference)) continue;
      const cleanReference = reference.split(/[?#]/, 1)[0];
      if (!cleanReference || cleanReference.includes('${')) continue;
      const target = path.resolve(rootDir, path.dirname(filename), cleanReference);
      assert(target.startsWith(rootDir + path.sep), `${filename}: repo外を参照しています (${reference})`);
      assert(fs.existsSync(target), `${filename}: 参照先が存在しません (${reference})`);
    }
  }
  pass('HTMLの相対参照先');
}

function validateQuestionSelectionContract() {
  const examSource = read('exam.html');
  assert(
    /this\.shuffle\(config\.pool\)\.slice\(0,\s*config\.questionsCount\)/.test(examSource),
    'exam.html: 全問題をシャッフルしてquestionsCount件取得する処理が見つかりません',
  );

  const publishedGrades = extractAvailableGrades('exam.html');
  for (const grade of publishedGrades) {
    const data = JSON.parse(read(`questions/questions_${grade}.json`));
    const selectedIds = data.pool.slice(0, data.questionsCount).map(question => question.id);
    assert(selectedIds.length === data.questionsCount, `${grade}: 抽出結果がquestionsCountと一致しません`);
    assert(new Set(selectedIds).size === selectedIds.length, `${grade}: 抽出結果に重複があります`);
  }
  pass('問題抽出の件数・重複防止契約');
}

validatePublishedGrades();
validateAllQuestionJson();
validateInlineScripts();
validateRelativeAssets();
validateQuestionSelectionContract();

if (failures.length > 0) {
  console.error(`検証失敗: ${failures.length}件`);
  failures.forEach(message => console.error(`- ${message}`));
  process.exitCode = 1;
} else {
  console.log(`検証成功: ${checks.length}項目`);
  checks.forEach(message => console.log(`- ${message}`));
}
