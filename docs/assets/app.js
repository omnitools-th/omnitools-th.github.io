/* ส่วนกลาง: โหมดดื่ม/ไม่ดื่ม, ผู้เล่น, เสียง, สั่น, กันจอดับ, สุ่ม */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- ตั้งค่าที่จำไว้ในเครื่อง ----------
  const KEY = 'wmg-v1';
  let S = { mode: 'drink', vibe: 'fun', adult: false, players: [] };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* ใช้ค่าเริ่มต้น */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };

  // ---------- สุ่ม ----------
  const rand = () => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; };
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // ถุงสุ่มแบบไม่ซ้ำจนกว่าจะหมด
  function bag(items) {
    let pool = [];
    return () => { if (!pool.length) pool = shuffle(items); return pool.pop(); };
  }

  // ---------- บทลงโทษ ----------
  const softBag = () => bag(window.WD ? window.WD.softPen : ['ทำภารกิจที่วงเลือก']);
  let nextSoft = null;
  // แจ็คพอต: ทุกบทลงโทษมีโอกาสออกรางวัลใหญ่ (ปิดได้ที่หน้าแรก)
  const JACKPOT_RATE = 0.06, JP = '🎰 แจ็คพอต! ';
  const isJackpot = (s) => String(s).startsWith(JP);
  // คืนข้อความแจ็คพอต หรือ null ถ้าไม่ออก
  function maybeJackpot(silent) {
    if (!nextSoft) nextSoft = softBag();
    if (S.jackpot === false || rand() >= JACKPOT_RATE) return null;
    if (!silent) setTimeout(jackpotFx, 30);
    if (S.mode === 'drink') return JP + (rand() < 0.25 ? 'หมดแก้ว!' : 'ดื่มครึ่งแก้ว');
    return JP + nextSoft() + ' และ ' + nextSoft();
  }
  function pen(n = 1) {
    if (!nextSoft) nextSoft = softBag();
    const jp = n < 99 ? maybeJackpot() : null;
    if (jp) return jp;
    if (S.mode === 'drink') {
      const k = S.vibe === 'drink' ? n * 2 : n;
      return n >= 99 ? 'หมดแก้ว!' : k > 5 ? 'ดื่มครึ่งแก้ว' : `ดื่ม ${k} จิบ`;
    }
    return nextSoft();
  }
  const penHtml = (p) => `<b class="pen${isJackpot(p) ? ' jackpot' : ''}">${esc(p)}</b>`;
  const penText = (s) => s.replace(/\{pen(\d+)\}/g, (_, n) => penHtml(pen(+n)));
  // เอฟเฟกต์แจ็คพอต: จอวาบสีทอง + เสียงสล็อต + สั่น (กันซ้อนภายใน 1.5 วินาที)
  let jpAt = 0;
  function jackpotFx() {
    const now = Date.now(); if (now - jpAt < 1500) return; jpAt = now;
    let fx = document.getElementById('jackpotFx');
    if (!fx) { fx = document.createElement('div'); fx.id = 'jackpotFx'; fx.innerHTML = '<span>🎰 JACKPOT 🎰</span>'; document.body.appendChild(fx); }
    fx.classList.remove('on'); void fx.offsetWidth; fx.classList.add('on');
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.16, 'square', 0.12, i * 0.09));
    tone(1568, 0.5, 'triangle', 0.14, 0.5);
    buzz([80, 40, 80, 40, 250]);
  }

  // ---------- เสียง (สร้างเอง ไม่ต้องโหลดไฟล์) ----------
  let ac = null;
  const audio = () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) { ac = null; } return ac; };
  function tone(freq = 660, dur = 0.08, type = 'sine', vol = 0.18, delay = 0) {
    const a = audio(); if (!a || S.mute) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function boom() {
    const a = audio(); if (!a || S.mute) return;
    const len = a.sampleRate * 1.2, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (rand() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    f.type = 'lowpass'; f.frequency.value = 900; g.gain.value = 0.9;
    s.buffer = buf; s.connect(f).connect(g).connect(a.destination); s.start();
    tone(70, 0.6, 'sine', 0.5);
  }
  const ding = () => { tone(880, 0.12, 'triangle'); tone(1320, 0.18, 'triangle', 0.15, 0.1); };
  const buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* ignore */ } };

  // ---------- กันจอดับระหว่างเล่น ----------
  let lock = null;
  async function keepAwake() {
    try { if ('wakeLock' in navigator && !lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch (e) { /* ไม่รองรับก็ไม่เป็นไร */ }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && document.body.dataset.game) keepAwake(); });
  document.addEventListener('pointerdown', () => { if (document.body.dataset.game) keepAwake(); audio(); }, { once: true });

  // ---------- ผู้เล่น ----------
  let turn = 0;
  const players = () => S.players.filter(Boolean);
  function nextPlayer() { const p = players(); if (!p.length) return ''; const n = p[turn % p.length]; turn++; return n; }
  // ช่องกรอกชื่อ คนละช่อง (S.players เก็บช่องว่างไว้ระหว่างพิมพ์ได้ ส่วน players() กรองออก)
  const countLabel = () => {
    const n = players().length;
    $$('#playerCount').forEach((e) => { e.textContent = n ? `${n} คน` : 'ยังไม่ใส่ชื่อ'; });
  };
  function renderPlayers(focus = -1) {
    const box = $('#players');
    if (!box) return;
    while (S.players.length < 2) S.players.push('');
    box.innerHTML = S.players.map((n, i) => `<div class="prow"><span class="pnum">${i + 1}</span>` +
      `<input type="text" data-pi="${i}" value="${esc(n)}" placeholder="ชื่อเพื่อนคนที่ ${i + 1}" maxlength="20" autocomplete="off" enterkeyhint="next">` +
      `<button type="button" data-rm="${i}" aria-label="ลบช่องที่ ${i + 1}">×</button></div>`).join('');
    countLabel();
    if (focus >= 0) { const f = $(`[data-pi="${focus}"]`, box); if (f) f.focus(); }
  }
  const addRow = () => { S.players.push(''); save(); renderPlayers(S.players.length - 1); };
  document.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { S.players.splice(+rm.dataset.rm, 1); save(); renderPlayers(); return; }
    if (e.target.closest('#addPlayer')) addRow();
  });
  document.addEventListener('input', (e) => {
    const i = e.target.dataset && e.target.dataset.pi;
    if (i === undefined) return;
    S.players[+i] = e.target.value.trim().slice(0, 20); save(); countLabel();
  });
  document.addEventListener('keydown', (e) => {
    const i = e.target.dataset && e.target.dataset.pi;
    if (i === undefined || e.key !== 'Enter') return;
    e.preventDefault();
    if (+i === S.players.length - 1) addRow(); else { const n = $(`[data-pi="${+i + 1}"]`); if (n) n.focus(); }
  });

  // ---------- โหมด ----------
  function renderMode() {
    $$('[data-mode-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modeBtn === S.mode)));
    document.documentElement.dataset.mode = S.mode;
    $$('.pen-label').forEach((e) => { e.textContent = S.mode === 'drink' ? 'ดื่ม' : 'โดนภารกิจ'; });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode-btn]');
    if (!b) return;
    S.mode = b.dataset.modeBtn; save(); renderMode();
    document.dispatchEvent(new CustomEvent('modechange'));
  });

  // ---------- สายเกม ----------
  const VIBE_NAMES = { fun: 'ฮา', spicy: 'ทะลึ่ง', drink: 'กิน', deep: 'เจาะใจ', couple: 'คู่รัก', all: 'รวมทุกสาย' };
  function setVibe(v) {
    if (!VIBE_NAMES[v]) v = 'fun';
    if (v === 'spicy' && !S.adult) {
      if (!window.confirm('สายทะลึ่งสำหรับผู้ที่มีอายุ 20 ปีขึ้นไปเท่านั้น\nยืนยันว่าทุกคนในวงอายุ 20 ปีขึ้นไป?')) return false;
      S.adult = true;
    }
    S.vibe = v; save(); renderVibe();
    document.dispatchEvent(new CustomEvent('vibechange'));
    return true;
  }
  function renderVibe() {
    $$('button[data-vibe]').forEach((b) => {
      const on = b.dataset.vibe === S.vibe;
      b.setAttribute('aria-pressed', String(on));
      // เลื่อนแถบให้เห็นสายที่เลือก (จอมือถือแคบ)
      if (on && b.parentElement) b.parentElement.scrollLeft = b.offsetLeft - b.parentElement.clientWidth / 2 + b.offsetWidth / 2;
    });
    $$('.vibe-name').forEach((e) => { e.textContent = VIBE_NAMES[S.vibe]; });
    document.documentElement.dataset.sai = S.vibe;
  }
  // ชุดคำถามตามสายที่เลือก
  function bank(kind) {
    const P = (window.WD && window.WD.packs) || {};
    if (S.vibe === 'all') return Object.keys(P).filter((k) => k !== 'spicy' || S.adult).flatMap((k) => P[k][kind] || []);
    return (P[S.vibe] || P.fun || {})[kind] || [];
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-vibe]');
    if (b) setVibe(b.dataset.vibe);
  });

  // ---------- ติดตั้งเป็นแอป ----------
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; $$('[data-install]').forEach((b) => { b.hidden = false; }); });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-install]') || !deferred) return;
    deferred.prompt(); deferred = null;
  });
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => { navigator.serviceWorker.register($('link[rel=manifest]') ? new URL('sw.js', $('link[rel=manifest]').href).href : 'sw.js').catch(() => {}); });
  }

  window.W = { $, $$, esc, S, save, bank, setVibe, maybeJackpot, jackpotFx, isJackpot, penHtml, rand, pick, shuffle, bag, pen, penText, tone, boom, ding, buzz, keepAwake, players, nextPlayer, games: {} };

  document.addEventListener('DOMContentLoaded', () => {
    const qv = new URLSearchParams(location.search).get('vibe');
    if (qv && qv !== S.vibe) setVibe(qv);
    renderMode();
    renderVibe();
    renderPlayers();
    const jt = $('#jpToggle');
    if (jt) { jt.checked = S.jackpot !== false; jt.addEventListener('change', () => { S.jackpot = jt.checked; save(); if (jt.checked) jackpotFx(); }); }
    // เกมสายทะลึ่ง: ถามอายุก่อนเข้า
    if (document.body.dataset.adult && !S.adult) {
      if (window.confirm('เกมนี้สำหรับผู้ที่มีอายุ 20 ปีขึ้นไปเท่านั้น\nยืนยันว่าทุกคนในวงอายุ 20 ปีขึ้นไป?')) { S.adult = true; save(); }
      else { location.href = '../'; return; }
    }
    const g = document.body.dataset.game;
    if (g && window.W.games[g]) window.W.games[g]();
  });
})();
