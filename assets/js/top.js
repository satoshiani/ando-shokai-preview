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
    el.style.transitionDelay = (Math.min(sib, 4) * 0.05) + 's';
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in'); io.unobserve(e.target);
        var n = e.target.querySelector('[data-count]');
        if (n) countUp(n);
      });
    }, { threshold: 0.01, rootMargin: '0px 0px 8% 0px' });   // 画面に入る少し手前で表示を始める
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

  /* ---------- ヒーロー：冬の吐息 ----------
     口から前へ勢いよく出て、少し先で白く見え始め、ふくらみながら上へ流れて消える。
     ぼかした円ではなく、ゆらぎ模様の「湯気の粒」を重ねて、息らしい薄さとムラを出す。 */
  (function breath() {
    var top = document.querySelector('.p-top');
    var cv = document.querySelector('.p-top__breath');
    var img = document.querySelector('.p-top__img');
    if (!top || !cv || !img || reduce) return;
    var ctx = cv.getContext('2d');
    var IW = 1672, IH = 941;          // 元画像の大きさ
    var LX = 0.700, LY = 0.398;       // 口元（画像上の割合）
    var DX = -0.85, DY = -0.47;       // 息の向き（顔の向き＝左上）
    var SC = 0.5;                     // 描画解像度。やわらかい表現なので半分で足りる
    var W = 0, H = 0, parts = [], visible = true, last = 0, acc = 0, clock = 0, geo = null, dirty = false;

    // 湯気の粒（ゆらぎ模様の白いかたまり）を数種類、最初に一度だけ作る
    function sprite(seed) {
      var S = 96, c = document.createElement('canvas'); c.width = c.height = S;
      var x = c.getContext('2d'), id = x.createImageData(S, S), d = id.data;
      function hash(i, j) { var h = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453; return h - Math.floor(h); }
      function vn(px, py) {
        var i = Math.floor(px), j = Math.floor(py), fx = px - i, fy = py - j;
        var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
        var a = hash(i, j), b = hash(i + 1, j), c2 = hash(i, j + 1), e = hash(i + 1, j + 1);
        return a + (b - a) * ux + (c2 - a) * uy + (a - b - c2 + e) * ux * uy;
      }
      for (var yy = 0; yy < S; yy++) for (var xx = 0; xx < S; xx++) {
        var n = 0, amp = 0.5, f = 1;
        for (var o = 0; o < 4; o++) { n += amp * vn(xx / S * 3.2 * f + seed, yy / S * 3.2 * f); f *= 2; amp *= 0.5; }
        var dx = (xx - S / 2) / (S / 2), dy = (yy - S / 2) / (S / 2), r = Math.sqrt(dx * dx + dy * dy);
        var fall = clamp(1 - r, 0, 1); fall = fall * fall * (3 - 2 * fall);
        var v = clamp((n - 0.28) / 0.6, 0, 1);
        var k = (yy * S + xx) * 4;
        d[k] = 248; d[k + 1] = 251; d[k + 2] = 255; d[k + 3] = Math.round(255 * fall * Math.pow(v, 1.15));
      }
      x.putImageData(id, 0, 0);
      return c;
    }
    var sprites = [sprite(1), sprite(2), sprite(3), sprite(4)];

    function resize() {
      W = top.clientWidth; H = top.clientHeight;
      cv.width = Math.round(W * SC); cv.height = Math.round(H * SC);
      geo = null;
    }
    // object-fit: cover の表示位置から、口元の座標を求める（変わるのは画面サイズが変わったときだけ）
    function origin() {
      if (geo) return geo;
      // スマホでは画像が下側だけに置かれるので、画像の実際の位置と大きさから求める
      var bw = img.offsetWidth, bh = img.offsetHeight, bx = img.offsetLeft, by = img.offsetTop;
      var sc = Math.max(bw / IW, bh / IH), dw = IW * sc, dh = IH * sc;
      var cs = getComputedStyle(img).objectPosition.split(' ');
      var px = parseFloat(cs[0]) / 100, py = parseFloat(cs[1]) / 100;
      geo = { x: bx + (bw - dw) * px + dw * LX, y: by + (bh - dh) * py + dh * LY, s: sc };
      return geo;
    }
    function spawn(m, power) {
      if (parts.length > 120) return;
      var ang = Math.atan2(DY, DX) + (Math.random() - 0.5) * 0.36;
      var sp = (200 + Math.random() * 100) * m.s * (0.5 + 0.5 * power);
      parts.push({
        x: m.x + (Math.random() - 0.5) * 4 * m.s, y: m.y + (Math.random() - 0.5) * 3 * m.s,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, dist: 0,
        r: (4 + Math.random() * 3) * m.s, gr: (30 + Math.random() * 20) * m.s,
        age: 0, life: 1.4 + Math.random() * 0.8,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.9,
        a: 0.32 + Math.random() * 0.18, img: sprites[(Math.random() * 4) | 0],
        fade: (14 + Math.random() * 10) * m.s,      // 口元から少し進んだところで白く見え始める
        far: (70 + Math.random() * 30) * m.s        // ここから先は薄れて消えていく
      });
    }
    function frame(ts) {
      requestAnimationFrame(frame);
      if (!visible) { last = ts; return; }
      var dt = Math.min((ts - (last || ts)) / 1000, 0.05); last = ts; clock += dt;
      var m = origin();
      // 約5.5秒に1回、ふーっと吐く（すっと強まり、ゆっくり弱まる）
      var cyc = (clock + 4.6) % 5.5;
      if (cyc < 1.8) {
        var power = cyc < 0.25 ? cyc / 0.25 : 1 - Math.pow((cyc - 0.25) / 1.55, 1.5);
        acc += dt;
        while (acc > 0.014) { acc -= 0.014; if (Math.random() < 0.35 + 0.65 * power) spawn(m, power); }
      }
      if (!parts.length) { if (dirty) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); dirty = false; } return; }
      dirty = true;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      var drag = Math.exp(-2.2 * dt), rise = 14 * m.s * dt;
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.age += dt;
        var t = p.age / p.life;
        if (t >= 1) { parts.splice(i, 1); continue; }
        p.vx *= drag; p.vy = p.vy * drag - rise;                       // 勢いが落ちて、ゆっくり昇る
        p.vx += Math.sin(clock * 1.3 + p.rot * 3) * 4 * m.s * dt;      // 空気のゆらぎ
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.dist += Math.sqrt(p.vx * p.vx + p.vy * p.vy) * dt;
        p.rot += p.vr * dt;
        var r = p.r + p.gr * p.age;
        var spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        var appear = clamp(p.dist / p.fade, 0, 1); appear = appear * appear * (3 - 2 * appear);
        var gone = clamp((p.dist - p.far) / (p.far * 1.4), 0, 1); gone = gone * gone * (3 - 2 * gone);
        var a = p.a * appear * (1 - gone) * Math.pow(1 - t, 1.3);
        if (a < 0.004) continue;
        ctx.globalAlpha = a;
        // 進む向きに細長く伸ばす（勢いがあるほど細長く、遅くなると丸く広がる）
        var ang = Math.atan2(p.vy, p.vx) + p.rot * 0.15;
        var st = 1 + Math.min(spd / (200 * m.s), 1) * 0.9;
        var c = Math.cos(ang) * SC, sn = Math.sin(ang) * SC;
        ctx.setTransform(c * st, sn * st, -sn, c, p.x * SC, p.y * SC);
        ctx.drawImage(p.img, -r, -r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
    }
    resize();
    window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(top);
    }
    requestAnimationFrame(frame);
  })();

  /* ---------- 3Dコーヒー缶 ---------- */
  var can = document.querySelector('.p-can');
  var stage = document.querySelector('.p-stage');
  var guide = document.querySelector('.p-guide');
  if (!can || !stage) return;
  var caps = [].slice.call(stage.querySelectorAll('.p-stage__cap'));
  var g3 = null, loadStarted = false;

  var CW = 260, CH = 460;      // 缶を描く領域（上下に余白をとり、切れないようにする）
  // 描画の細かさ。スマホや非力なPCでは下げて負担を減らす
  var dprCap = Math.min(window.devicePixelRatio || 1, 2);
  var lowPower = window.matchMedia('(pointer: coarse)').matches ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  var RES = lowPower ? Math.min(dprCap, 1.5) : dprCap;

  function init3D() {
    var T = window.THREE;
    var cv = document.createElement('canvas');
    var renderer;
    try { renderer = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: RES < 2, powerPreference: 'low-power' }); }
    catch (e) { return; }
    renderer.setPixelRatio(RES); renderer.setSize(CW, CH, false);
    renderer.setClearColor(0x000000, 0);
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(30, CW / CH, 0.1, 50);
    cam.position.set(0, 0, 8.9);
    // 写真に光の陰影が写り込んでいるので、ライトは控えめにして色をそのまま見せる
    scene.add(new T.AmbientLight(0xffffff, 0.74));
    var key = new T.DirectionalLight(0xfff4e6, 0.28); key.position.set(-3, 4, 5); scene.add(key);
    var rim = new T.DirectionalLight(0xffc890, 0.14); rim.position.set(4, 1, -3); scene.add(rim);

    var rad = 0.95, hh = 3.7;
    var tex = new T.TextureLoader().load('assets/img/hero/can-dydo-blend.jpg', function () { if (g3) g3.dirty = true; });
    tex.wrapS = T.RepeatWrapping; tex.offset.x = 0.5;
    tex.anisotropy = 4;
    var side = new T.MeshPhongMaterial({ map: tex, shininess: 38, specular: 0x333333 });
    var cap = new T.MeshPhongMaterial({ color: 0xd2d2d2, shininess: 110, specular: 0x999999 });
    var can3 = new T.Group();
    can3.add(new T.Mesh(new T.CylinderGeometry(rad, rad, hh, 48, 1), [side, cap, cap]));
    [1, -1].forEach(function (d) {
      var ring = new T.Mesh(new T.TorusGeometry(rad - 0.02, 0.05, 10, 48), cap);
      ring.rotation.x = Math.PI / 2; ring.position.y = d * hh / 2; can3.add(ring);
    });
    var lid = new T.Mesh(new T.CylinderGeometry(rad - 0.12, rad - 0.12, 0.04, 48),
      new T.MeshPhongMaterial({ color: 0xe0e0e0, shininess: 120, specular: 0xaaaaaa }));
    lid.position.y = hh / 2 + 0.01; can3.add(lid);
    var tab = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.03, 24), cap);
    tab.scale.set(1.3, 1, 0.9); tab.position.set(0.1, hh / 2 + 0.04, 0.1); can3.add(tab);
    scene.add(can3);

    // 向きが変わったときだけ描き直す（止まっている間は描かない）
    var lastRy = 1e9, lastRx = 1e9;
    g3 = {
      dirty: true,
      render: function (ry) {
        var rx = 0.14 + pointer.y * 0.06;
        if (!this.dirty && Math.abs(ry - lastRy) < 0.0008 && Math.abs(rx - lastRx) < 0.0008) return;
        this.dirty = false; lastRy = ry; lastRx = rx;
        can3.rotation.set(rx, ry, 0);
        renderer.render(scene, cam);
      }
    };
    cv.className = 'p-can__3d';
    can.appendChild(cv);
    can.classList.add('is-3d');
  }
  // 3Dの部品（約600KB）は、ステージが近づいてから読み込む。最初の表示を軽くするため
  function load3D() {
    if (loadStarted) return; loadStarted = true;
    var sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    sc.onload = function () { if (window.THREE) init3D(); };
    document.head.appendChild(sc);
  }

  /* ---------- 缶の動き：ステージで大きく回る → 左右の余白で案内 ---------- */
  var secs = [].slice.call(document.querySelectorAll('.l-main section[aria-labelledby]'))
    .filter(function (s) { return !s.classList.contains('p-related'); });
  var names = secs.map(function (s) { var h = s.querySelector('h2'); return h ? h.textContent.trim() : ''; });

  // 位置は毎フレーム測らず、画面サイズが変わったときだけ測り直す（読み込みが軽くなる）
  var L = { vw: 0, vh: 0, stageTop: 0, stageH: 1, tops: [], hs: [], docH: 1 };
  function measure() {
    var y = window.scrollY, sr = stage.getBoundingClientRect();
    L.vw = window.innerWidth; L.vh = window.innerHeight;
    L.stageTop = sr.top + y; L.stageH = sr.height;
    L.tops = []; L.hs = [];
    secs.forEach(function (s) { var r = s.getBoundingClientRect(); L.tops.push(r.top + y); L.hs.push(r.height); });
    L.docH = document.documentElement.scrollHeight;
  }
  var mTimer = 0;
  function remeasure() { cancelAnimationFrame(mTimer); mTimer = requestAnimationFrame(measure); }
  measure();
  window.addEventListener('resize', remeasure);
  window.addEventListener('load', function () {
    setTimeout(measure, 300);
    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 1200); };
    idle(load3D, { timeout: 2500 });
  });
  if (window.ResizeObserver) new ResizeObserver(remeasure).observe(document.body);

  var cur = { x: 0, y: 0, s: 1, r: 0, ry: 0, a: 0 }, tar = { x: 0, y: 0, s: 1, r: 0, ry: 0, a: 0 };
  var first = true, idx = -1, eNow = 0, ciPrev = -2, liveNow = false, showNow = null;
  var lastT = '', lastO = '', lastProg = -1;

  function section(y, vh) {
    var line = vh * 0.45, k = -1, f = 0;
    for (var i = 0; i < L.tops.length; i++) { if (L.tops[i] - y <= line) k = i; }
    if (k >= 0) f = k + 1 + clamp((line - (L.tops[k] - y)) / Math.max(L.hs[k], 1), 0, 0.999);
    return { k: k, f: f };
  }
  function stageCap(prog) { return prog < 0.04 ? -1 : Math.min(caps.length - 1, Math.floor((prog - 0.04) / 0.32)); }

  function compute() {
    var vw = L.vw, vh = L.vh, y = window.scrollY;
    var wide = vw >= 1200, big = vw >= 1100;
    var srTop = L.stageTop - y, srBottom = srTop + L.stageH;
    var prog = clamp(-srTop / Math.max(L.stageH - vh, 1), 0, 1);
    var enter = clamp((vh - srTop) / (vh * 0.7), 0, 1);
    var e = smooth(clamp((vh - srBottom) / (vh * 0.9), 0, 1));
    var sec = section(y, vh), f = sec.f;
    eNow = e;

    // ステージの中心（CSS の sticky の位置と同じ計算）
    var pinTop = Math.min(Math.max(srTop, 0), srBottom - vh);
    var hx = vw / 2, hy = pinTop + vh * (big ? 0.5 : 0.36);
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

    // ステージの文字を、回転の進み具合に合わせて切り替える（変わったときだけ触る）
    var ci = e > 0.02 ? -1 : ci0;
    if (ci !== ciPrev) { ciPrev = ci; caps.forEach(function (c, i) { c.classList.toggle('is-on', i === ci); }); }
    updateGuide(y, vh);
    return y;
  }

  function updateGuide(y, vh) {
    if (!guide) return;
    var prog = Math.round(clamp(y / Math.max(L.docH - vh, 1), 0, 1) * 500) / 500;
    if (prog !== lastProg) { lastProg = prog; guide.style.setProperty('--prog', prog); }
    var label, next = idx + 1;
    if (idx < 0) label = '次は「' + (names[0] || '') + '」へ <span class="p-guide__arrow">▼</span>';
    else if (next < secs.length) label = '今は <b>' + names[idx] + '</b>　次は「' + names[next] + '」へ <span class="p-guide__arrow">▼</span>';
    else label = '<b>' + names[idx] + '</b>　上に戻る <span class="p-guide__arrow">▲</span>';
    if (guide.dataset.label !== label) {
      guide.innerHTML = '<span class="p-guide__txt">' + label + '</span><span class="p-guide__bar"></span>';
      guide.dataset.label = label;
    }
    var show = eNow > 0.35;
    if (show !== showNow) { showNow = show; guide.classList.toggle('is-show', show); }
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
    requestAnimationFrame(frame);
    var y = compute();
    if (!loadStarted && y > L.vh * 0.15) load3D();
    var d = reduce ? 1 : 0.2;
    cur.x = lerp(cur.x, tar.x, d); cur.y = lerp(cur.y, tar.y, d);
    cur.s = lerp(cur.s, tar.s, d); cur.r = lerp(cur.r, tar.r, d); cur.ry = lerp(cur.ry, tar.ry, d);
    cur.a = lerp(cur.a, tar.a, 0.2);

    // 缶が見えていないとき（ヒーロー表示中）は、3Dを描かない
    if (g3 && cur.a > 0.02) g3.render(cur.ry);
    var o = cur.a.toFixed(2);
    if (o !== lastO) { lastO = o; can.style.opacity = o; }
    var live = cur.a > 0.5;
    if (live !== liveNow) { liveNow = live; can.classList.toggle('is-live', live); }
    var tr = 'translate3d(' + (cur.x - CW / 2).toFixed(1) + 'px,' + (cur.y - CH / 2).toFixed(1) +
      'px,0) rotate(' + cur.r.toFixed(2) + 'deg) scale(' + Math.max(cur.s, 0.01).toFixed(3) + ')';
    if (tr !== lastT) { lastT = tr; can.style.transform = tr; }
  }
  requestAnimationFrame(frame);
})();
