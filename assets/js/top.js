/* 安東商会 トップページ — モーション
   ・ヒーロー：口元から出る冬の白い息
   ・ステージ：3Dコーヒー缶がスクロールで回り、そのあとページを案内
   ・ふわっと表示／数字カウントアップ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { return t * t * (3 - 2 * t); }

  var pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', function (e) {
    pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ---------- スクロールでふわっと表示 ---------- */
  var sel = '.c-sectiontitle, .p-service, .p-reasons li, .p-topmerits li, .p-area > *, .p-topflow li, .p-topfaq li, .p-catalog li, .p-cta, .p-news__list li, .p-hero--poem .p-hero__body > *, .p-hero--poem .p-hero__machine, .p-stats__list li';
  var targets = [].slice.call(document.querySelectorAll(sel));
  targets.forEach(function (el) {
    el.classList.add('js-reveal');
    if (el.matches('.p-topmerits li')) {
      el.classList.add([].indexOf.call(el.parentNode.children, el) % 2 ? 'from-right' : 'from-left');
    }
    var sib = el.parentNode ? [].indexOf.call(el.parentNode.children, el) : 0;
    el.style.transitionDelay = (Math.min(sib, 5) * 0.09) + 's';
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in'); io.unobserve(e.target);
        var n = e.target.querySelector('[data-count]');
        if (n) countUp(n);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  }

  function countUp(n) {
    var to = +n.getAttribute('data-count');
    if (reduce || !to) { n.textContent = to; return; }
    var t0 = null;
    requestAnimationFrame(function step(ts) {
      if (!t0) t0 = ts;
      var p = clamp((ts - t0) / 1600, 0, 1);
      n.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    });
  }
  [].forEach.call(document.querySelectorAll('[data-count]'), function (n) { if (!reduce) n.textContent = '0'; });

  /* ---------- ヒーロー：口元から出る冬の白い息 ---------- */
  (function breath() {
    var top = document.querySelector('.p-top');
    var cv = document.querySelector('.p-top__breath');
    var img = document.querySelector('.p-top__img');
    if (!top || !cv || !img) return;
    var ctx = cv.getContext('2d');
    var IW = 1672, IH = 941;          // 元画像の大きさ
    var MX = 0.706, MY = 0.408;       // 画像上の口元の位置（割合）
    var W = 0, H = 0, dpr = 1, puffs = [], visible = true, last = 0, acc = 0, clock = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = top.clientWidth; H = top.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
    }
    // object-fit: cover の表示位置から、口元の画面座標を求める
    function mouth() {
      var r = img.getBoundingClientRect(), tr = top.getBoundingClientRect();
      var bw = r.width, bh = r.height, sc = Math.max(bw / IW, bh / IH);
      var dw = IW * sc, dh = IH * sc;
      var cs = getComputedStyle(img).objectPosition.split(' ');
      var px = parseFloat(cs[0]) / 100, py = parseFloat(cs[1]) / 100;
      var ox = (bw - dw) * px, oy = (bh - dh) * py;
      return { x: r.left - tr.left + ox + dw * MX, y: r.top - tr.top + oy + dh * MY, s: sc };
    }
    function spawn(m) {
      puffs.push({
        x: m.x + (Math.random() - 0.5) * 4, y: m.y + (Math.random() - 0.5) * 3,
        vx: -(10 + Math.random() * 16) * m.s, vy: -(14 + Math.random() * 16) * m.s,
        r0: (4 + Math.random() * 3) * m.s, r1: (26 + Math.random() * 34) * m.s,
        life: 4.2 + Math.random() * 2.2, age: 0, ph: Math.random() * 6.28,
        a: 0.08 + Math.random() * 0.07, st: 1.1 + Math.random() * 0.5
      });
    }
    function frame(ts) {
      requestAnimationFrame(frame);
      if (!visible) { last = ts; return; }
      var dt = Math.min((ts - (last || ts)) / 1000, 0.05); last = ts; clock += dt;
      var m = mouth();
      // 約6.5秒に1回、そっと息を吐く（1.4秒間）
      var cyc = clock % 6.5;
      if (cyc > 0.8 && cyc < 2.2) {
        acc += dt;
        var amp = Math.sin(Math.PI * (cyc - 0.8) / 1.4);   // 吐き始めと終わりはそっと
        while (acc > 0.05) { acc -= 0.05; if (Math.random() < amp) spawn(m); }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (var i = puffs.length - 1; i >= 0; i--) {
        var p = puffs[i]; p.age += dt;
        var t = p.age / p.life;
        if (t >= 1) { puffs.splice(i, 1); continue; }
        p.x += (p.vx * (1 - t * 0.7)) * dt + Math.sin(clock * 0.9 + p.ph) * 0.12;
        p.y += (p.vy * (1 - t * 0.5)) * dt;
        var r = lerp(p.r0, p.r1, 1 - Math.pow(1 - t, 2));
        var a = p.a * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 1.3);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(p.st + t * 0.5, 1);          // 風に流されて横に伸びる
        var g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, 'rgba(255,255,255,' + a.toFixed(3) + ')');
        g.addColorStop(0.45, 'rgba(238,244,255,' + (a * 0.5).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(238,244,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill();
        ctx.restore();
      }
    }
    resize();
    window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(top);
    }
    if (reduce) { // 動きを減らす設定：静止した息だけ描く
      var m0 = mouth(), g0 = ctx.createRadialGradient(m0.x - 80, m0.y - 40, 0, m0.x - 80, m0.y - 40, 90 * m0.s);
      g0.addColorStop(0, 'rgba(255,255,255,.35)'); g0.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.scale(dpr, dpr); ctx.fillStyle = g0; ctx.fillRect(0, 0, W, H);
      return;
    }
    requestAnimationFrame(frame);
  })();

  /* ---------- 3Dコーヒー缶 ---------- */
  var can = document.querySelector('.p-can');
  var stage = document.querySelector('.p-stage');
  var slot = document.querySelector('.p-stage__slot');
  var guide = document.querySelector('.p-guide');
  if (!can || !stage || !slot) return;
  var caps = [].slice.call(stage.querySelectorAll('.p-stage__cap'));
  var g3 = null;

  var CW = 260, CH = 460;      // 缶を描く領域（上下に余白をとり、切れないようにする）

  function init3D() {
    var T = window.THREE;
    var cv = document.createElement('canvas');
    var R = 3, renderer;
    try { renderer = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: true }); }
    catch (e) { return; }
    renderer.setPixelRatio(R); renderer.setSize(CW, CH, false);
    renderer.setClearColor(0x000000, 0);
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(30, CW / CH, 0.1, 50);
    cam.position.set(0, 0, 8.9);
    // 写真に光の陰影が写り込んでいるので、ライトは控えめにして色をそのまま見せる
    scene.add(new T.AmbientLight(0xffffff, 0.74));
    var key = new T.DirectionalLight(0xfff4e6, 0.28); key.position.set(-3, 4, 5); scene.add(key);
    var rim = new T.DirectionalLight(0xffc890, 0.14); rim.position.set(4, 1, -3); scene.add(rim);

    var rad = 0.95, hh = 3.7;
    var tex = new T.TextureLoader().load('assets/img/hero/can-dydo-blend.jpg');
    tex.wrapS = T.RepeatWrapping; tex.offset.x = 0.5;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 8;
    var side = new T.MeshPhongMaterial({ map: tex, shininess: 38, specular: 0x333333 });
    var cap = new T.MeshPhongMaterial({ color: 0xd2d2d2, shininess: 110, specular: 0x999999 });
    var can3 = new T.Group();
    can3.add(new T.Mesh(new T.CylinderGeometry(rad, rad, hh, 64, 1), [side, cap, cap]));
    [1, -1].forEach(function (d) {
      var ring = new T.Mesh(new T.TorusGeometry(rad - 0.02, 0.05, 16, 64), cap);
      ring.rotation.x = Math.PI / 2; ring.position.y = d * hh / 2; can3.add(ring);
    });
    var lid = new T.Mesh(new T.CylinderGeometry(rad - 0.12, rad - 0.12, 0.04, 64),
      new T.MeshPhongMaterial({ color: 0xe0e0e0, shininess: 120, specular: 0xaaaaaa }));
    lid.position.y = hh / 2 + 0.01; can3.add(lid);
    var tab = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.03, 32), cap);
    tab.scale.set(1.3, 1, 0.9); tab.position.set(0.1, hh / 2 + 0.04, 0.1); can3.add(tab);
    scene.add(can3);

    g3 = {
      render: function (ry, t) {
        can3.rotation.set(0.14 + pointer.y * 0.06, ry, 0);
        can3.position.y = Math.sin(t * 1.6) * 0.05;
        renderer.render(scene, cam);
      }
    };
    cv.className = 'p-can__3d';
    can.appendChild(cv);
    can.classList.add('is-3d');
  }
  (function load3D() {
    var sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    sc.onload = function () { if (window.THREE) init3D(); };
    document.head.appendChild(sc);
  })();

  /* ---------- 缶の動き：ステージで大きく回る → 左右の余白で案内 ---------- */
  var secs = [].slice.call(document.querySelectorAll('.l-main section[aria-labelledby]'))
    .filter(function (s) { return !s.classList.contains('p-related'); });
  var names = secs.map(function (s) { var h = s.querySelector('h2'); return h ? h.textContent.trim() : ''; });

  var cur = { x: 0, y: 0, s: 1, r: 0, ry: 0, a: 0 }, tar = { x: 0, y: 0, s: 1, r: 0, ry: 0, a: 0 };
  var first = true, idx = -1, eNow = 0;

  function section() {
    var vh = window.innerHeight, line = vh * 0.45, k = -1, f = 0;
    for (var i = 0; i < secs.length; i++) {
      if (secs[i].getBoundingClientRect().top <= line) k = i;
    }
    if (k >= 0) {
      var r = secs[k].getBoundingClientRect();
      f = k + 1 + clamp((line - r.top) / Math.max(r.height, 1), 0, 0.999);
    }
    return { k: k, f: f };
  }

  function stageCap(prog) { return prog < 0.04 ? -1 : Math.min(caps.length - 1, Math.floor((prog - 0.04) / 0.32)); }

  function compute() {
    var vw = window.innerWidth, vh = window.innerHeight, y = window.scrollY;
    var wide = vw >= 1200, big = vw >= 1100;
    var sr = stage.getBoundingClientRect(), lr = slot.getBoundingClientRect();
    var prog = clamp(-sr.top / Math.max(sr.height - vh, 1), 0, 1);
    var enter = clamp((vh - sr.top) / (vh * 0.7), 0, 1);
    var e = smooth(clamp((vh - sr.bottom) / (vh * 0.9), 0, 1));
    var sec = section(), f = sec.f;
    eNow = e;

    var hx = lr.left + lr.width / 2, hy = lr.top + lr.height / 2;
    var hs = Math.min(vh * (big ? 0.58 : 0.44) / 368, big ? 1.5 : 1.15) * lerp(0.55, 1, smooth(enter));

    var dx, dy, ds;
    if (wide) {
      var gw = (vw - 1000) / 2, right = vw - gw / 2, left = gw / 2;
      var fl = Math.floor(f), g = fl + smooth(clamp((f - fl - 0.82) / 0.18, 0, 1));
      dx = lerp(right, left, 0.5 - 0.5 * Math.cos(Math.PI * g));
      dy = vh * 0.5 + Math.sin(f * 2.1) * vh * 0.12;
      ds = Math.min(0.46, (gw - 14) / 190);
    } else {
      dx = vw - 44; dy = vh - 160 + Math.sin(f * 2.1) * 10; ds = 0.3;
    }
    var spin = Math.PI * 2.5;                       // ステージで回る量
    var stageRy = prog * spin + pointer.x * 0.35;
    var dockRy = spin + f * Math.PI * 1.2;
    var ci0 = stageCap(prog);
    var off = big ? (ci0 === 1 ? -1 : (ci0 >= 0 ? 1 : 0)) * vw * 0.2 : 0;
    tar.x = lerp(hx + off, dx, e); tar.y = lerp(hy, dy, e);
    tar.s = lerp(hs, ds, e);
    tar.r = reduce ? 0 : lerp(0, Math.sin(f * Math.PI * 2) * 18, e);
    tar.ry = reduce ? 0 : lerp(stageRy, dockRy, e);
    tar.a = clamp(enter * 1.8 - 0.1, 0, 1);
    idx = sec.k;
    if (first) { cur.x = tar.x; cur.y = tar.y; cur.s = tar.s; cur.r = tar.r; cur.ry = tar.ry; first = false; }

    // ステージの文字を、回転の進み具合に合わせて切り替える
    var ci = ci0;
    if (e > 0.02) ci = -1;
    caps.forEach(function (c, i) { c.classList.toggle('is-on', i === ci); });

    root.style.setProperty('--sy', y);
    updateGuide(y, vh);
  }

  function updateGuide(y, vh) {
    if (!guide) return;
    var total = document.documentElement.scrollHeight - vh;
    guide.style.setProperty('--prog', clamp(y / Math.max(total, 1), 0, 1).toFixed(3));
    var label, next = idx + 1;
    if (idx < 0) label = '次は「' + (names[0] || '') + '」へ <span class="p-guide__arrow">▼</span>';
    else if (next < secs.length) label = '今は <b>' + names[idx] + '</b>　次は「' + names[next] + '」へ <span class="p-guide__arrow">▼</span>';
    else label = '<b>' + names[idx] + '</b>　上に戻る <span class="p-guide__arrow">▲</span>';
    if (guide.dataset.label !== label) {
      guide.innerHTML = '<span class="p-guide__txt">' + label + '</span><span class="p-guide__bar"></span>';
      guide.dataset.label = label;
    }
    guide.classList.toggle('is-show', eNow > 0.35);
  }

  function go() {
    if (eNow < 0.35) { // ステージ中は、次の画面へ送る
      var ni = document.querySelector('.p-stats');
      if (ni) ni.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    var t = idx + 1 < secs.length ? secs[idx + 1] : null;
    if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }
  can.addEventListener('click', go);
  if (guide) guide.addEventListener('click', function (ev) { ev.preventDefault(); go(); });

  function frame() {
    compute();
    var d = reduce ? 1 : 0.14;
    cur.x = lerp(cur.x, tar.x, d); cur.y = lerp(cur.y, tar.y, d);
    cur.s = lerp(cur.s, tar.s, d); cur.r = lerp(cur.r, tar.r, d); cur.ry = lerp(cur.ry, tar.ry, d);
    cur.a = lerp(cur.a, tar.a, 0.2);
    if (g3) {
      var tt = performance.now() / 1000;
      var idle = reduce ? 0 : lerp(Math.sin(tt * 0.9) * 0.25, tt * 0.55, eNow);
      g3.render(cur.ry + idle, tt);
    }
    can.style.opacity = cur.a.toFixed(3);
    can.classList.toggle('is-live', cur.a > 0.5);
    can.style.transform = 'translate(' + (cur.x - CW / 2).toFixed(1) + 'px,' + (cur.y - CH / 2).toFixed(1) +
      'px) rotate(' + cur.r.toFixed(2) + 'deg) scale(' + Math.max(cur.s, 0.01).toFixed(3) + ')';
    requestAnimationFrame(frame);
  }
  frame();
})();
