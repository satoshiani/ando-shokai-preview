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
    function spawn(m, strong) {
      puffs.push({
        x: m.x + (Math.random() - 0.5) * 8, y: m.y + (Math.random() - 0.5) * 6,
        vx: -(30 + Math.random() * 50) * m.s * (strong ? 1.15 : 0.8),
        vy: -(6 + Math.random() * 26) * m.s,
        r0: (3 + Math.random() * 6) * m.s, r1: (28 + Math.random() * 62) * m.s,
        life: 3.2 + Math.random() * 2.2, age: 0, ph: Math.random() * 6.28,
        a: 0.10 + Math.random() * 0.14, st: 1.3 + Math.random() * 0.7
      });
    }
    function frame(ts) {
      requestAnimationFrame(frame);
      if (!visible) { last = ts; return; }
      var dt = Math.min((ts - (last || ts)) / 1000, 0.05); last = ts; clock += dt;
      var m = mouth();
      // 約4.6秒に1回、ふーっと息を吐く（1.7秒間）
      var cyc = clock % 4.6;
      if (cyc > 0.6 && cyc < 2.3) {
        acc += dt;
        while (acc > 0.022) { acc -= 0.022; spawn(m, cyc < 1.6); }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (var i = puffs.length - 1; i >= 0; i--) {
        var p = puffs[i]; p.age += dt;
        var t = p.age / p.life;
        if (t >= 1) { puffs.splice(i, 1); continue; }
        p.x += (p.vx * (1 - t * 0.6)) * dt;
        p.y += (p.vy - 6 * t) * dt + Math.sin(clock * 1.7 + p.ph) * 0.18;
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

  function labelTexture(T) {
    var W = 1792, H = 1024, c = document.createElement('canvas');
    c.width = W; c.height = H;
    var x = c.getContext('2d');
    var neck = H * 0.075;
    var gm = x.createLinearGradient(0, 0, 0, H);
    gm.addColorStop(0, '#d8d8d8'); gm.addColorStop(1, '#b9b9b9');
    x.fillStyle = gm; x.fillRect(0, 0, W, H);
    var gl = x.createLinearGradient(0, neck, 0, H - neck);
    gl.addColorStop(0, '#7a3410'); gl.addColorStop(0.5, '#5a230a'); gl.addColorStop(1, '#3f1805');
    x.fillStyle = gl; x.fillRect(0, neck, W, H - neck * 2);
    x.fillStyle = '#FF8C42';
    x.fillRect(0, neck, W, 22); x.fillRect(0, H - neck - 22, W, 22);
    function design(cx) {
      x.save(); x.translate(cx, H / 2);
      x.beginPath(); x.arc(0, -70, 210, 0, Math.PI * 2);
      x.fillStyle = '#FFF3E2'; x.fill();
      x.lineWidth = 14; x.strokeStyle = '#FFB347'; x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = '#6a2a09';
      x.font = '700 230px "Hiragino Mincho ProN","Yu Mincho",serif';
      x.fillText('珈琲', 0, -62);
      x.fillStyle = '#FFE2B8';
      x.font = '700 120px Georgia,"Times New Roman",serif';
      x.fillText('C O F F E E', 0, 250);
      x.fillStyle = '#FFC87A';
      x.font = '700 64px "Hiragino Kaku Gothic ProN",sans-serif';
      x.fillText('安 東 商 会', 0, 340);
      x.restore();
    }
    design(W / 2); design(0); design(W);
    var tex = new T.CanvasTexture(c);
    tex.wrapS = T.RepeatWrapping; tex.offset.x = 0.5;
    tex.anisotropy = 8;
    return tex;
  }

  function init3D() {
    var T = window.THREE;
    var cv = document.createElement('canvas');
    var R = 3, w = 200, h = 340, renderer;
    try { renderer = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: true }); }
    catch (e) { return; }
    renderer.setPixelRatio(R); renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(30, w / h, 0.1, 50);
    cam.position.set(0, 0, 7.6);
    scene.add(new T.AmbientLight(0xffffff, 0.75));
    var key = new T.DirectionalLight(0xfff1dc, 0.9); key.position.set(-3, 4, 5); scene.add(key);
    var rim = new T.DirectionalLight(0xffb070, 0.6); rim.position.set(4, 1, -3); scene.add(rim);
    var pt = new T.PointLight(0xffffff, 0.5, 20); pt.position.set(2, -1, 5); scene.add(pt);

    var rad = 0.95, hh = 3.4;
    var side = new T.MeshPhongMaterial({ map: labelTexture(T), shininess: 70, specular: 0x777777 });
    var cap = new T.MeshPhongMaterial({ color: 0xcfcfcf, shininess: 120, specular: 0xffffff });
    var can3 = new T.Group();
    can3.add(new T.Mesh(new T.CylinderGeometry(rad, rad, hh, 64, 1), [side, cap, cap]));
    [1, -1].forEach(function (d) {
      var ring = new T.Mesh(new T.TorusGeometry(rad - 0.02, 0.07, 16, 64), cap);
      ring.rotation.x = Math.PI / 2; ring.position.y = d * hh / 2; can3.add(ring);
    });
    var lid = new T.Mesh(new T.CylinderGeometry(rad - 0.14, rad - 0.14, 0.04, 64),
      new T.MeshPhongMaterial({ color: 0xe4e4e4, shininess: 150, specular: 0xffffff }));
    lid.position.y = hh / 2 + 0.01; can3.add(lid);
    var tab = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.03, 32), cap);
    tab.scale.set(1.3, 1, 0.9); tab.position.set(0.1, hh / 2 + 0.04, 0.1); can3.add(tab);
    scene.add(can3);

    g3 = {
      render: function (ry, t) {
        can3.rotation.set(0.18 + pointer.y * 0.08, ry, 0);
        can3.position.y = Math.sin(t * 1.6) * 0.06;
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
    var hs = Math.min(vh * (big ? 0.62 : 0.46) / 340, big ? 1.7 : 1.4) * lerp(0.55, 1, smooth(enter));

    var dx, dy, ds;
    if (wide) {
      var gw = (vw - 1000) / 2, right = vw - gw / 2, left = gw / 2;
      var fl = Math.floor(f), g = fl + smooth(clamp((f - fl - 0.82) / 0.18, 0, 1));
      dx = lerp(right, left, 0.5 - 0.5 * Math.cos(Math.PI * g));
      dy = vh * 0.5 + Math.sin(f * 2.1) * vh * 0.12;
      ds = Math.min(0.5, (gw - 14) / 200);
    } else {
      dx = vw - 46; dy = vh - 150 + Math.sin(f * 2.1) * 10; ds = 0.34;
    }
    var spin = Math.PI * 2.5;                       // ステージで回る量
    var stageRy = prog * spin + pointer.x * 0.35;
    var dockRy = spin + f * Math.PI * 1.2;
    tar.x = lerp(hx, dx, e); tar.y = lerp(hy, dy, e);
    tar.s = lerp(hs, ds, e);
    tar.r = reduce ? 0 : lerp(0, Math.sin(f * Math.PI * 2) * 18, e);
    tar.ry = reduce ? 0 : lerp(stageRy, dockRy, e);
    tar.a = clamp(enter * 1.8 - 0.1, 0, 1);
    idx = sec.k;
    if (first) { cur.x = tar.x; cur.y = tar.y; cur.s = tar.s; cur.r = tar.r; cur.ry = tar.ry; first = false; }

    // ステージの文字を、回転の進み具合に合わせて切り替える
    var ci = prog < 0.04 ? -1 : Math.min(caps.length - 1, Math.floor((prog - 0.04) / 0.32));
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
    can.style.transform = 'translate(' + (cur.x - 100).toFixed(1) + 'px,' + (cur.y - 170).toFixed(1) +
      'px) rotate(' + cur.r.toFixed(2) + 'deg) scale(' + Math.max(cur.s, 0.01).toFixed(3) + ')';
    requestAnimationFrame(frame);
  }
  frame();
})();
