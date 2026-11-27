(() => {
  'use strict';
  if (window.__ahiruAnalyticsLoaded) return;
  window.__ahiruAnalyticsLoaded = true;
  const source = document.currentScript;
  if (!source) return;
  const id = 'G-RQ7XD43X2Q';
  const site = source.dataset.site;
  const pages = JSON.parse(source.dataset.pages || '{}');
  const base = '/' + site + '/';
  const relative = window.location.pathname.slice(base.length);
  if (window.location.hostname !== 'duck-ahiru-z.github.io' ||
      !window.location.pathname.startsWith(base) ||
      !Object.prototype.hasOwnProperty.call(pages, relative)) return;
  const key = 'ahiru-tools-analytics-disabled';
  let optedOut = false;
  try { optedOut = localStorage.getItem(key) === 'true'; } catch (_) {}
  const browserOptOut = navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  window['ga-disable-' + id] = optedOut || browserOptOut;
  if (!window['ga-disable-' + id]) {
    const canonical = window.location.origin + base + (relative === 'index.html' ? '' : relative);
    let referrer = '';
    try { referrer = new URL(document.referrer).origin + '/'; } catch (_) {}
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', id, {
      page_location: canonical, page_referrer: referrer, page_title: pages[relative],
      allow_google_signals: false, allow_ad_personalization_signals: false,
      cookie_expires: 7776000, cookie_flags: 'SameSite=Lax;Secure'
    });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(tag);
  }
  function controls() {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = [
      '<style>:host{all:initial}button,a{font:inherit}',
      '.open{position:fixed;right:8px;bottom:8px;z-index:2147483000;font:11px/1.5 system-ui,sans-serif;color:#333;background:#fff;border:1px solid #aaa;border-radius:0;padding:3px 7px;cursor:pointer}',
      'dialog{box-sizing:border-box;width:min(440px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;color:#222;background:#fff;border:1px solid #555;border-radius:0;padding:24px;font:14px/1.7 system-ui,sans-serif}',
      'dialog::backdrop{background:#0008}h2{font-size:18px;margin:0 0 12px}a{color:#1749a0}button{cursor:pointer;padding:6px 12px}#status{font-weight:bold}.actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}</style>',
      '<button class="open" type="button" aria-haspopup="dialog">アクセス解析</button>',
      '<dialog aria-labelledby="privacy-title"><h2 id="privacy-title">アクセス解析について</h2>',
      '<p>利用状況の把握と改善のため、Google アナリティクス（GA4）でページ閲覧数、参照元のサイト、端末情報などを計測しています。Cookieを利用し、Googleへ計測データを送信します。</p>',
      '<p>この解析設定から、入力した文章、氏名、点数、画像、生成したパスワードや番号は送信しません。URLのクエリとフラグメントも計測対象から除外しています。広告向けの計測は無効です。</p>',
      '<p>設定は、このブラウザの同じドメイン上にあるAhiru Toolsの対応サイトで共通です。</p><p id="status" role="status"></p>',
      '<p><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Googleのプライバシーポリシー</a></p>',
      '<div class="actions"><button id="toggle" type="button"></button><button id="close" type="button">閉じる</button></div></dialog>'
    ].join('');
    document.body.appendChild(host);
    const dialog = shadow.querySelector('dialog');
    const toggle = shadow.querySelector('#toggle');
    const status = shadow.querySelector('#status');
    function update() {
      status.textContent = browserOptOut ? 'ブラウザの追跡拒否設定により計測は無効です。' :
        optedOut ? 'アクセス解析は無効です。' : 'アクセス解析は有効です。';
      toggle.textContent = optedOut ? 'アクセス解析を有効にする' : 'アクセス解析を無効にする';
      toggle.disabled = browserOptOut;
    }
    shadow.querySelector('.open').addEventListener('click', () => { update(); dialog.showModal(); });
    shadow.querySelector('#close').addEventListener('click', () => dialog.close());
    toggle.addEventListener('click', () => {
      const next = !optedOut;
      try { localStorage.setItem(key, String(next)); }
      catch (_) { status.textContent = '設定を保存できませんでした。ブラウザの追跡拒否設定をご利用ください。'; return; }
      optedOut = next;
      window['ga-disable-' + id] = next || browserOptOut;
      update();
      if (!next) window.location.reload();
    });
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', controls, { once: true });
  else controls();
})();
