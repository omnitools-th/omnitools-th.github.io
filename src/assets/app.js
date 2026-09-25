/* ส่วนกลาง: โหมดดื่ม/ไม่ดื่ม, ผู้เล่น, เสียง, สั่น, กันจอดับ, สุ่ม */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- ตั้งค่าที่จำไว้ในเครื่อง ----------
  const KEY = 'wmg-v1';
  let S = { mode: 'drink', players: [] };
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
  function pen(n = 1) {
    if (S.mode === 'drink') return n >= 99 ? 'หมดแก้ว!' : `ดื่ม ${n} จิบ`;
    if (!nextSoft) nextSoft = softBag();
    return nextSoft();
  }
  const penText = (s) => s.replace(/\{pen(\d+)\}/g, (_, n) => `<b class="pen">${esc(pen(+n))}</b>`);

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
  function renderPlayers() {
    const box = $('#players');
    if (!box) return;
    const p = players();
    $('#playerCount') && ($('#playerCount').textContent = p.length ? `${p.length} คน` : 'ยังไม่ใส่ชื่อ');
    box.innerHTML = p.map((n, i) => `<span class="chip">${esc(n)}<button type="button" data-rm="${i}" aria-label="ลบ ${esc(n)}">×</button></span>`).join('');
  }
  document.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { S.players.splice(+rm.dataset.rm, 1); save(); renderPlayers(); }
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

  window.W = { $, $$, esc, S, save, rand, pick, shuffle, bag, pen, penText, tone, boom, ding, buzz, keepAwake, players, nextPlayer, games: {} };

  document.addEventListener('DOMContentLoaded', () => {
    renderMode();
    renderPlayers();
    const add = $('#addPlayer'), inp = $('#playerName');
    if (add && inp) {
      const go = () => {
        inp.value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).forEach((n) => S.players.push(n.slice(0, 20)));
        inp.value = ''; save(); renderPlayers(); inp.focus();
      };
      add.addEventListener('click', go);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    }
    const g = document.body.dataset.game;
    if (g && window.W.games[g]) window.W.games[g]();
  });
})();
