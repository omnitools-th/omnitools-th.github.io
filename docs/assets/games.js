/* ตัวเกมทั้งหมด — แต่ละเกมผูกกับ <body data-game="..."> */
(function () {
  'use strict';
  const W = window.W, D = window.WD, { $, $$, esc, S, save, rand, pick, shuffle, bag, pen, penText, tone, boom, ding, buzz } = W;
  const G = W.games;
  const turnLabel = (el) => { const n = W.nextPlayer(); el.innerHTML = n ? `ตาของ <b>${esc(n)}</b>` : ''; };
  const flash = (el, cls = 'pop') => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  // ================================================================ ไพ่วงเหล้า
  G.cards = () => {
    const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], SUITS = ['♠', '♥', '♦', '♣'];
    let custom = {};
    try { custom = JSON.parse(localStorage.getItem('wmg-rules') || '{}'); } catch (e) { /* ignore */ }
    const rule = (r) => custom[r] || D.cardRules[r];
    let deck = [], kings = 0;
    const card = $('#card'), ruleBox = $('#rule'), turn = $('#turn');
    const reset = () => {
      deck = shuffle(RANKS.flatMap((r) => SUITS.map((s) => [r, s]))); kings = 0;
      card.className = 'playcard'; card.innerHTML = '<span class="back">แตะเพื่อเปิดไพ่</span>';
      ruleBox.innerHTML = ''; meta(); turnLabel(turn);
    };
    const meta = () => { $('#left').textContent = `เหลือ ${deck.length} ใบ`; $('#kings').textContent = `K ออกแล้ว ${kings}/4`; };
    const draw = () => {
      if (!deck.length) { ruleBox.innerHTML = '<h2>ไพ่หมดแล้ว!</h2><p>กด “สับไพ่ใหม่” เพื่อเล่นรอบต่อไป</p>'; return; }
      const [r, s] = deck.pop();
      const red = s === '♥' || s === '♦';
      card.className = 'playcard face' + (red ? ' red' : '');
      card.innerHTML = `<span class="corner">${r}<br>${s}</span><span class="big-r">${r}</span><span class="big-s">${s}</span><span class="corner br">${r}<br>${s}</span>`;
      flash(card, 'flip');
      tone(520, 0.05, 'triangle');
      let [title, text] = rule(r);
      if (r === 'K') {
        kings++;
        if (kings === 4) { title = 'K ใบสุดท้าย!'; text = S.mode === 'drink' ? 'คุณเปิด K ใบที่ 4 ต้องจัดการแก้วกลางทั้งหมด!' : 'คุณเปิด K ใบที่ 4 โดนภารกิจใหญ่: {pen1} และ {pen1}'; boom(); buzz([300, 80, 300]); }
        else if (S.mode !== 'drink') { title = 'สะสม K'; text = 'สะสม K ครบ 4 ใบเมื่อไหร่ คนที่เปิดใบที่ 4 โดนภารกิจใหญ่'; }
      }
      ruleBox.innerHTML = `<h2>${esc(r)} · ${esc(title)}</h2><p>${penText(esc(text))}</p>`;
      meta(); turnLabel(turn);
    };
    card.addEventListener('click', draw);
    $('#draw').addEventListener('click', draw);
    $('#reset').addEventListener('click', reset);
    // แก้ไขกติกา
    const ed = $('#ruleEdit');
    ed.innerHTML = RANKS.map((r) => `<label class="field"><span>${r} – <input data-t="${r}" value="${esc(rule(r)[0])}" maxlength="30"></span>` +
      `<textarea data-x="${r}" rows="2">${esc(rule(r)[1])}</textarea></label>`).join('');
    ed.addEventListener('input', () => {
      RANKS.forEach((r) => { custom[r] = [$(`[data-t="${r}"]`, ed).value, $(`[data-x="${r}"]`, ed).value]; });
      try { localStorage.setItem('wmg-rules', JSON.stringify(custom)); } catch (e) { /* ignore */ }
    });
    $('#ruleReset').addEventListener('click', () => { custom = {}; try { localStorage.removeItem('wmg-rules'); } catch (e) { /* ignore */ } location.reload(); });
    reset();
  };

  // ================================================================ เกมการ์ดคำถาม (ใช้ร่วม: ฉันไม่เคย / ใครมีแนวโน้ม)
  function questionGame(items, render) {
    const next = bag(items), q = $('#qcard'), turn = $('#turn');
    const go = () => { q.innerHTML = render(next()); flash(q); tone(600, 0.05, 'triangle'); turnLabel(turn); };
    q.addEventListener('click', go);
    $('#next').addEventListener('click', go);
    document.addEventListener('modechange', go);
    go();
  }
  G.never = () => questionGame(D.never, (s) => `<p class="q">${esc(s)}</p><p class="hint">ใครเคย → ${penText('{pen1}')}</p>`);
  G.likely = () => questionGame(D.likely, (s) => `<p class="tag">ใครในวงมีแนวโน้มจะ…</p><p class="q">${esc(s)}</p>` +
    `<p class="hint">นับ 1-2-3 แล้วทุกคนชี้พร้อมกัน คนที่ถูกชี้มากที่สุด → ${penText('{pen2}')}</p>`);
  G.wyr = () => questionGame(D.wyr, ([a, b]) => `<p class="tag">ถ้าต้องเลือก จะเลือกอะไร?</p>` +
    `<div class="wyr"><span class="opt a">${esc(a)}</span><span class="or">หรือ</span><span class="opt b">${esc(b)}</span></div>` +
    `<p class="hint">นับ 1-2-3 ยกมือพร้อมกัน (มือซ้าย = บน, มือขวา = ล่าง) ฝั่งที่มีคนน้อยกว่า → ${penText('{pen1}')}</p>`);

  // ================================================================ จริงหรือกล้า
  G['truth-dare'] = () => {
    const t = bag(D.truth), d = bag(D.dare), q = $('#qcard'), turn = $('#turn');
    const show = (kind) => {
      const s = kind === 'truth' ? t() : d();
      q.innerHTML = `<p class="tag ${kind}">${kind === 'truth' ? 'จริง' : 'กล้า'}</p><p class="q">${esc(s)}</p>` +
        `<p class="hint">${kind === 'truth' ? 'ไม่ยอมตอบ' : 'ไม่กล้าทำ'} → ${penText('{pen2}')}</p>`;
      flash(q); tone(kind === 'truth' ? 520 : 780, 0.07, 'triangle');
    };
    $('#truth').addEventListener('click', () => show('truth'));
    $('#dare').addEventListener('click', () => show('dare'));
    $('#rnd').addEventListener('click', () => show(rand() < 0.5 ? 'truth' : 'dare'));
    $('#next').addEventListener('click', () => { turnLabel(turn); q.innerHTML = '<p class="q dim">เลือก “จริง” หรือ “กล้า”</p>'; });
    turnLabel(turn);
  };

  // ================================================================ หมุนขวด
  G.bottle = () => {
    const b = $('#bottle'), res = $('#result');
    let angle = 0, busy = false;
    const spin = () => {
      if (busy) return;
      busy = true; res.innerHTML = '&nbsp;';
      angle += 360 * (4 + Math.floor(rand() * 3)) + rand() * 360;
      b.style.transform = `rotate(${angle}deg)`;
      const tick = setInterval(() => tone(900 + rand() * 300, 0.02, 'square', 0.05), 120);
      setTimeout(() => {
        clearInterval(tick); busy = false; ding(); buzz(120);
        res.innerHTML = `ปากขวดชี้ใคร → ${penText('{pen1}')} หรือเล่น<a href="../truth-or-dare/">จริงหรือกล้า</a>`;
      }, 4200);
    };
    $('#bottleWrap').addEventListener('click', spin);
    $('#spin').addEventListener('click', spin);
  };

  // ================================================================ วางนิ้วสุ่มคน
  G.finger = () => {
    const area = $('#touch'), hint = $('#touchHint'), COLORS = ['#ff4d8d', '#35d0ff', '#ffd23f', '#7cff6b', '#b18cff', '#ff8a3d', '#4dffd2', '#ff5c5c', '#ffffff', '#9ad0ff'];
    const pts = new Map();
    let timer = null, done = false;
    const count = () => Math.max(1, parseInt($('#pickN').value, 10) || 1);
    const reset = () => { clearTimeout(timer); timer = null; area.classList.remove('arming'); };
    const arm = () => {
      reset();
      if (done || pts.size < count() + 1) { hint.textContent = pts.size ? `วางนิ้วเพิ่มอีก (ตอนนี้ ${pts.size} นิ้ว)` : 'ทุกคนวางนิ้วบนจอพร้อมกัน'; return; }
      hint.textContent = 'ค้างไว้… กำลังสุ่ม';
      void area.offsetWidth; area.classList.add('arming');
      tone(500, 0.06); timer = setTimeout(choose, 2200);
    };
    const choose = () => {
      done = true; area.classList.remove('arming');
      const ids = shuffle([...pts.keys()]), win = new Set(ids.slice(0, count()));
      pts.forEach((p, id) => p.el.classList.add(win.has(id) ? 'win' : 'lose'));
      boom(); buzz([200, 60, 200]);
      hint.innerHTML = `คนที่ถูกเลือก → ${penText('{pen1}')}<br><small>ยกนิ้วทุกนิ้วออกเพื่อเล่นใหม่</small>`;
    };
    area.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (done) return;
      const el = document.createElement('i');
      el.className = 'finger'; el.style.setProperty('--c', COLORS[pts.size % COLORS.length]);
      area.appendChild(el);
      pts.set(e.pointerId, { el });
      move(e); tone(400 + pts.size * 60, 0.05); buzz(15); arm();
    });
    const move = (e) => {
      const p = pts.get(e.pointerId); if (!p) return;
      const r = area.getBoundingClientRect();
      p.el.style.left = (e.clientX - r.left) + 'px'; p.el.style.top = (e.clientY - r.top) + 'px';
    };
    area.addEventListener('pointermove', move);
    const up = (e) => {
      const p = pts.get(e.pointerId); if (!p) return;
      p.el.remove(); pts.delete(e.pointerId);
      if (done) { if (!pts.size) { done = false; hint.textContent = 'ทุกคนวางนิ้วบนจอพร้อมกัน'; } return; }
      arm();
    };
    area.addEventListener('pointerup', up);
    area.addEventListener('pointercancel', up);
    area.addEventListener('contextmenu', (e) => e.preventDefault());
    $('#pickN').addEventListener('change', arm);
  };

  // ================================================================ ระเบิดเวลา
  G.bomb = () => {
    const btn = $('#bombBtn'), stage = $('#stage'), topic = $('#topic'), status = $('#status');
    const TOPICS = Object.keys(D.charades).map((k) => `พูดชื่อ${k} 1 อย่าง`).concat([
      'พูดชื่อเพลงไทย 1 เพลง', 'พูดชื่อยี่ห้อรถ 1 ยี่ห้อ', 'พูดชื่อจังหวัด 1 จังหวัด', 'พูดคำที่ขึ้นต้นด้วย “ก”', 'พูดชื่อผลไม้ 1 อย่าง',
      'พูดชื่อประเทศ 1 ประเทศ', 'พูดชื่อตัวการ์ตูน 1 ตัว', 'พูดชื่อแอปในมือถือ 1 แอป', 'พูดชื่อสีภาษาอังกฤษ 1 สี', 'พูดชื่อกีฬา 1 ชนิด']);
    const nextTopic = bag(TOPICS);
    let end = 0, start = 0, t = null, running = false;
    const RANGES = { short: [10, 25], mid: [20, 45], long: [40, 90] };
    const loop = () => {
      const now = performance.now();
      if (now >= end) return explode();
      const p = (now - start) / (end - start);
      tone(1100, 0.03, 'square', 0.08); btn.classList.toggle('blink');
      t = setTimeout(loop, Math.max(110, 650 - p * 560));
    };
    const explode = () => {
      running = false; boom(); buzz([500, 100, 500, 100, 300]);
      stage.classList.add('exploded'); btn.textContent = 'ตูม!!';
      status.innerHTML = `คนที่ถือมือถืออยู่ → ${penText('{pen2}')}`;
      topic.textContent = '';
      setTimeout(() => { btn.textContent = 'เริ่มใหม่'; }, 1500);
    };
    btn.addEventListener('click', () => {
      if (running) { if ($('#useTopic').checked) { topic.textContent = nextTopic(); flash(topic); } tone(700, 0.04); return; }
      stage.classList.remove('exploded');
      const [a, b] = RANGES[$('#len').value];
      start = performance.now(); end = start + (a + rand() * (b - a)) * 1000; running = true;
      btn.textContent = 'ส่งต่อ!';
      status.textContent = 'ตอบแล้วกด “ส่งต่อ!” แล้วยื่นมือถือให้คนถัดไป เร็ว!';
      topic.textContent = $('#useTopic').checked ? nextTopic() : '';
      loop();
    });
  };

  // ================================================================ เลขระเบิด
  G['number-bomb'] = () => {
    const disp = $('#guess'), range = $('#range'), log = $('#log'), turn = $('#turn'), stage = $('#stage');
    let lo, hi, secret, cur = '', over = false;
    const reset = () => {
      const max = +$('#max').value; lo = 1; hi = max; secret = 1 + Math.floor(rand() * max); cur = ''; over = false;
      stage.classList.remove('exploded'); log.innerHTML = ''; show(); turnLabel(turn);
    };
    const show = () => { range.textContent = `${lo} – ${hi}`; disp.textContent = cur || '—'; };
    const guess = () => {
      if (over || !cur) return;
      const g = +cur; cur = '';
      if (g < lo || g > hi) { flash(disp, 'shake'); buzz(80); tone(200, 0.12, 'sawtooth'); show(); return; }
      if (g === secret) {
        over = true; boom(); buzz([500, 100, 500]); stage.classList.add('exploded');
        range.textContent = `💥 ${secret}`;
        log.innerHTML = `<p class="boom-text">ตูม! เลขระเบิดคือ ${secret} → ${penText('{pen2}')}</p>` + log.innerHTML;
        disp.textContent = '—'; return;
      }
      if (g < secret) lo = g + 1; else hi = g - 1;
      tone(640, 0.06, 'triangle');
      log.innerHTML = `<span>${g} ${g < secret ? '↑' : '↓'}</span>` + log.innerHTML;
      show(); flash(range); turnLabel(turn);
    };
    $('#pad').addEventListener('click', (e) => {
      const k = e.target.closest('button'); if (!k || over) return;
      const v = k.dataset.k;
      if (v === 'del') cur = cur.slice(0, -1);
      else if (v === 'ok') return guess();
      else if (cur.length < 4) cur = (cur + v).replace(/^0+/, '');
      tone(880, 0.02, 'square', 0.05); show();
    });
    $('#reset').addEventListener('click', reset);
    $('#max').addEventListener('change', reset);
    reset();
  };

  // ================================================================ ใบ้คำ
  G.charades = () => {
    const cats = Object.keys(D.charades);
    $('#cats').innerHTML = cats.map((c, i) => `<label class="pill"><input type="radio" name="cat" value="${esc(c)}"${i ? '' : ' checked'}>${esc(c)}</label>`).join('') +
      '<label class="pill"><input type="radio" name="cat" value="*">สุ่มทุกหมวด</label>';
    const setup = $('#setup'), play = $('#play'), endBox = $('#end'), word = $('#word'), clock = $('#clock');
    let words, ok = [], skip = [], left = 0, iv = null, cur = '';
    const show = (el) => [setup, play, endBox].forEach((x) => { x.hidden = x !== el; });
    const next = () => { cur = words(); word.textContent = cur; flash(word); };
    const finish = () => {
      clearInterval(iv); iv = null; boom(); buzz([400, 100, 400]);
      $('#score').textContent = ok.length;
      $('#words').innerHTML = ok.map((w) => `<span class="ok">✓ ${esc(w)}</span>`).join('') + skip.map((w) => `<span class="no">✗ ${esc(w)}</span>`).join('');
      $('#endPen').innerHTML = `ทีมที่ได้น้อยที่สุดเมื่อจบทุกทีม → ${penText('{pen2}')}`;
      show(endBox);
    };
    const start = () => {
      const c = $('input[name=cat]:checked').value;
      words = bag(c === '*' ? cats.flatMap((k) => D.charades[k]) : D.charades[c]);
      ok = []; skip = []; left = +$('#secs').value;
      show(play); let n = 3; word.textContent = n; clock.textContent = '';
      const cd = setInterval(() => {
        n--; tone(500, 0.1);
        if (n > 0) { word.textContent = n; return; }
        clearInterval(cd); ding(); next(); clock.textContent = left;
        iv = setInterval(() => { left--; clock.textContent = left; if (left <= 5 && left > 0) tone(900, 0.05, 'square'); if (left <= 0) finish(); }, 1000);
      }, 800);
    };
    $('#start').addEventListener('click', start);
    $('#again').addEventListener('click', () => show(setup));
    $('#hit').addEventListener('click', () => { if (!iv) return; ok.push(cur); ding(); buzz(40); next(); });
    $('#pass').addEventListener('click', () => { if (!iv) return; skip.push(cur); tone(220, 0.12, 'sawtooth'); next(); });
    const stop = () => { clearInterval(iv); iv = null; };
    $('#quit').addEventListener('click', () => { stop(); show(setup); });
  };

  // ================================================================ ลูกเต๋าวงเหล้า
  G.dice = () => {
    const WHO = ['ตัวเอง', 'คนทางซ้าย', 'คนทางขวา', 'คนฝั่งตรงข้าม', 'เลือกใครก็ได้ 1 คน', 'ทุกคนในวง!'];
    const d1 = $('#d1'), d2 = $('#d2'), res = $('#result');
    const face = (el, n) => { el.dataset.n = n; el.innerHTML = '<i></i>'.repeat(n); };
    let busy = false;
    const roll = () => {
      if (busy) return; busy = true; res.innerHTML = '&nbsp;';
      let k = 0;
      const iv = setInterval(() => {
        face(d1, 1 + Math.floor(rand() * 6)); face(d2, 1 + Math.floor(rand() * 6)); tone(300 + rand() * 400, 0.02, 'square', 0.06);
        if (++k < 12) return;
        clearInterval(iv); busy = false;
        const a = 1 + Math.floor(rand() * 6), b = 1 + Math.floor(rand() * 6);
        face(d1, a); face(d2, b); ding(); buzz(60);
        const what = S.mode === 'drink' ? `ดื่ม ${b} จิบ` : pen();
        res.innerHTML = `<b>${WHO[a - 1]}</b> → <b class="pen">${esc(what)}</b>` + (a === b ? '<br><span class="dbl">ดับเบิล! ทอยต่ออีกรอบ</span>' : '');
      }, 60);
    };
    $('#roll').addEventListener('click', roll);
    $('#diceWrap').addEventListener('click', roll);
    face(d1, 5); face(d2, 3);
    $('#coin').addEventListener('click', () => {
      const c = $('#coinFace'); c.classList.remove('spin'); void c.offsetWidth; c.classList.add('spin');
      setTimeout(() => { c.textContent = rand() < 0.5 ? 'หัว' : 'ก้อย'; ding(); }, 600);
    });
  };

  // ================================================================ วงล้อลงโทษ
  G.wheel = () => {
    const cv = $('#wheel'), g = cv.getContext('2d'), ta = $('#items');
    const COLORS = ['#ff4d8d', '#35d0ff', '#ffd23f', '#7cff6b', '#b18cff', '#ff8a3d', '#4dffd2', '#ff5c5c'];
    const DRINK = ['ดื่ม 1 จิบ', 'ดื่ม 2 จิบ', 'ดื่มครึ่งแก้ว', 'รอด! ไม่ต้องทำอะไร', 'คนทางซ้ายดื่ม', 'คนทางขวาดื่ม', 'ทุกคนดื่ม!', 'เลือกใครก็ได้ดื่ม', 'เล่นจริงหรือกล้า', 'หมดแก้ว!'];
    const SOFT = () => shuffle(D.softPen).slice(0, 7).concat(['รอด! ไม่ต้องทำอะไร', 'เลือกเพื่อนให้ทำแทน', 'เล่นจริงหรือกล้า']);
    const key = () => 'wmg-wheel-' + S.mode;
    const load = () => { let v = null; try { v = localStorage.getItem(key()); } catch (e) { /* ignore */ } ta.value = v || (S.mode === 'drink' ? DRINK : SOFT()).join('\n'); draw(); };
    let rot = 0, spinning = false;
    const items = () => ta.value.split('\n').map((s) => s.trim()).filter(Boolean);
    function draw() {
      const L = items(), n = L.length, R = cv.width / 2;
      g.clearRect(0, 0, cv.width, cv.height);
      if (!n) return;
      const seg = Math.PI * 2 / n;
      L.forEach((t, i) => {
        const a0 = rot + i * seg;
        g.beginPath(); g.moveTo(R, R); g.arc(R, R, R - 6, a0, a0 + seg); g.closePath();
        g.fillStyle = (i === n - 1 && i % COLORS.length === 0 && n > 1) ? COLORS[3] : COLORS[i % COLORS.length]; g.fill();
        g.strokeStyle = '#120f1f'; g.lineWidth = 3; g.stroke();
        g.save(); g.translate(R, R); g.rotate(a0 + seg / 2);
        g.fillStyle = '#120f1f'; g.textAlign = 'right'; g.textBaseline = 'middle';
        g.font = `600 ${Math.max(13, Math.min(26, Math.floor(seg * R * 0.42)))}px Kanit, sans-serif`;
        g.fillText(t.length > 18 ? t.slice(0, 17) + '…' : t, R - 22, 0); g.restore();
      });
      g.beginPath(); g.arc(R, R, 30, 0, Math.PI * 2); g.fillStyle = '#120f1f'; g.fill();
    }
    const spin = () => {
      const L = items(); if (spinning || L.length < 2) return;
      spinning = true; $('#result').innerHTML = '&nbsp;';
      const n = L.length, seg = Math.PI * 2 / n, win = Math.floor(rand() * n), TAU = Math.PI * 2;
      const target = Math.PI * 1.5 - (win + 0.15 + rand() * 0.7) * seg, s0 = rot;
      const delta = ((target - s0) % TAU + TAU) % TAU + TAU * (5 + Math.floor(rand() * 3)), t0 = performance.now(), dur = 4500;
      let lastSeg = -1;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        rot = s0 + delta * (1 - Math.pow(1 - p, 4)); draw();
        const cs = Math.floor(((Math.PI * 1.5 - rot) % TAU + TAU) % TAU / seg);
        if (cs !== lastSeg) { lastSeg = cs; tone(1200, 0.015, 'square', 0.05); }
        if (p < 1) return requestAnimationFrame(step);
        rot %= TAU; spinning = false; ding(); buzz(100);
        $('#result').innerHTML = `<b class="pen">${esc(L[win])}</b>`;
      };
      requestAnimationFrame(step);
    };
    $('#spin').addEventListener('click', spin);
    cv.addEventListener('click', spin);
    ta.addEventListener('input', () => { try { localStorage.setItem(key(), ta.value); } catch (e) { /* ignore */ } draw(); });
    $('#defaults').addEventListener('click', () => { try { localStorage.removeItem(key()); } catch (e) { /* ignore */ } load(); });
    document.addEventListener('modechange', load);
    if (document.fonts) document.fonts.ready.then(draw);
    load();
  };
})();
