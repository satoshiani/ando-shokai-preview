/* 株式会社 安東商会 — 共通スクリプト
   ハンバーガーメニュー / FAQアコーディオン / ページトップボタン */
(function () {
  'use strict';

  /* --- グローバルナビ（モバイル開閉） --- */
  var toggle = document.querySelector('.p-navtoggle');
  var gnav = document.getElementById('gnav');

  if (toggle && gnav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      gnav.classList.toggle('is-open', !open);
    });

    // メニュー内リンクを押したら閉じる
    gnav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        gnav.classList.remove('is-open');
      }
    });

    // Esc で閉じる
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && gnav.classList.contains('is-open')) {
        toggle.setAttribute('aria-expanded', 'false');
        gnav.classList.remove('is-open');
        toggle.focus();
      }
    });

    // PC幅に戻したら状態をリセット
    var mq = window.matchMedia('(min-width: 900px)');
    var reset = function () {
      if (mq.matches) {
        toggle.setAttribute('aria-expanded', 'false');
        gnav.classList.remove('is-open');
      }
    };
    mq.addEventListener ? mq.addEventListener('change', reset) : mq.addListener(reset);
  }

  /* --- よくある質問アコーディオン --- */
  document.querySelectorAll('.p-faq__q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', String(!open));
      if (panel) panel.hidden = open;
    });
  });

  /* --- ページトップボタン --- */
  var gotop = document.querySelector('.p-gotop');
  if (gotop) {
    var onScroll = function () {
      gotop.classList.toggle('is-visible', window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
