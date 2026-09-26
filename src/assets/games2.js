/* เกมประจำสาย (10 เกม) */
(function () {
  'use strict';
  const W = window.W, D = window.WD, { $, $$, esc, S, rand, shuffle, bag, pen, penText, tone, boom, ding, buzz } = W;
  const G = W.games;
  const flash = (el, cls = 'pop') => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const show = (id, on = true) => { const e = $('#' + id); if (e) e.hidden = !on; };
  const names = (n) => { const p = W.players(); return Array.from({ length: n }, (_, i) => p[i] || `ผู้เล่น ${i + 1}`); };
  const P = (n) => penText(`{pen${n}}`);

  // ================================================================ 😂 ห้ามหัวเราะ
  G['no-laugh'] = () => {
    const next = bag(D.noLaugh), card = $('#prompt'), timer = $('#timer'), res = $('#result'), turn = $('#turn');
    let prompt = '', iv = null, phase = 'hidden';
    const who = () => { const n = W.nextPlayer(); turn.innerHTML = n ? `คนแสดง: <b>${esc(n)}</b>` : 'คนแสดง: คนที่ถือมือถือ'; };
    const reset = () => {
      clearInterval(iv); phase = 'hidden'; prompt = next(); timer.textContent = ''; res.innerHTML = '&nbsp;';
      card.innerHTML = '<p class="q dim">คนแสดงแตะตรงนี้เพื่อดูโจทย์<br><small>อย่าให้คนอื่นเห็น!</small></p>';
      show('startAct', false); show('verdict', false); who();
    };
    card.addEventListener('click', () => {
      if (phase !== 'hidden') return;
      phase = 'seen'; card.innerHTML = `<p class="tag">โจทย์ของคุณ</p><p class="q">${esc(prompt)}</p>`; flash(card); show('startAct');
    });
    $('#startAct').addEventListener('click', () => {
      phase = 'acting'; show('startAct', false); show('verdict');
      card.innerHTML = '<p class="q">แสดงเลย! 🎭</p><p class="hint">ทุกคนห้ามหัวเราะ ห้ามยิ้ม!</p>';
      let t = 15; timer.textContent = t; ding();
      iv = setInterval(() => {
        t--; timer.textContent = t; if (t <= 3 && t > 0) tone(900, 0.05, 'square');
        if (t <= 0) { clearInterval(iv); verdict(false); }
      }, 1000);
    });
    const verdict = (laughed) => {
      clearInterval(iv); show('verdict', false); timer.textContent = '';
      card.innerHTML = `<p class="tag">โจทย์คือ</p><p class="q">${esc(prompt)}</p>`;
      if (laughed) { boom(); buzz([200, 80, 200]); res.innerHTML = `ทุกคนที่หลุดหัวเราะ → ${P(1)}`; }
      else { tone(220, 0.3, 'sawtooth'); res.innerHTML = `ไม่มีใครขำ คนแสดง → ${P(1)}`; }
      phase = 'done';
    };
    $('#laughed').addEventListener('click', () => verdict(true));
    $('#noLaugh').addEventListener('click', () => verdict(false));
    $('#nextAct').addEventListener('click', reset);
    reset();
  };

  // ================================================================ 😂 ใครคือสปาย
  G.spy = () => {
    const nSel = $('#spyPlayers');
    const p = W.players().length;
    nSel.innerHTML = Array.from({ length: 10 }, (_, i) => i + 3).map((n) => `<option value="${n}"${n === (p >= 3 ? Math.min(p, 12) : 5) ? ' selected' : ''}>${n} คน</option>`).join('');
    const pairs = bag(D.spyPairs);
    let order = [], spies = new Set(), words = [], i = 0, seen = false;
    const screen = (id) => ['spySetup', 'spyDeal', 'spyTalk', 'spyReveal'].forEach((s) => show(s, s === id));
    const holdBtn = $('#hold'), word = $('#spyWord');
    const deal = () => {
      const n = +nSel.value, k = +$('#spyCount').value;
      order = names(n); const pair = pairs(); const swap = rand() < 0.5;
      words = swap ? [pair[1], pair[0]] : pair;
      spies = new Set(shuffle([...order.keys()]).slice(0, Math.min(k, n - 2)));
      i = 0; step(); screen('spyDeal');
    };
    const step = () => {
      seen = false; $('#spyNext').disabled = true; word.textContent = '';
      $('#spyWho').innerHTML = `ส่งมือถือให้ <b>${esc(order[i])}</b> <small>(${i + 1}/${order.length})</small>`;
    };
    const reveal = (on) => {
      if (!order.length) return;
      word.textContent = on ? (spies.has(i) ? words[1] : words[0]) : '';
      holdBtn.classList.toggle('holding', on);
      if (on) { seen = true; $('#spyNext').disabled = false; buzz(20); }
    };
    holdBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); reveal(true); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => holdBtn.addEventListener(ev, () => reveal(false)));
    holdBtn.addEventListener('contextmenu', (e) => e.preventDefault());
    $('#spyNext').addEventListener('click', () => {
      if (!seen) return;
      i++; if (i < order.length) { step(); tone(600, 0.05); return; }
      $('#spyFirst').innerHTML = `เริ่มจาก <b>${esc(order[Math.floor(rand() * order.length)])}</b>`;
      screen('spyTalk'); ding();
    });
    $('#spyStart').addEventListener('click', deal);
    $('#spyShow').addEventListener('click', () => {
      const sp = [...spies].map((x) => esc(order[x])).join(', ');
      $('#spyAnswer').innerHTML = `<p class="tag">สปายคือ</p><p class="q">${sp}</p>` +
        `<p class="hint">คำของคนส่วนใหญ่: <b>${esc(words[0])}</b> · คำของสปาย: <b>${esc(words[1])}</b></p>` +
        `<p class="hint">จับสปายได้ → สปาย ${P(2)}<br>จับผิดคน หรือสปายรอด → ทุกคนที่ไม่ใช่สปาย ${P(1)}</p>`;
      screen('spyReveal'); boom(); buzz([200, 60, 200]);
    });
    $('#spyAgain').addEventListener('click', () => screen('spySetup'));
  };

  // ================================================================ 🔥 ลูกเต๋าทะลึ่ง
  G['spicy-dice'] = () => {
    const dd = D.spicyDice, a = $('#sa'), b = $('#sb'), c = $('#sc'), res = $('#result');
    const face = (el, t) => { el.textContent = t; };
    const actLabel = (s) => s.replace('{ที่}', '…').replace(/ แต่หยุดก่อนถึง| แล้วพูดว่า “น่ารักจัง”/, '');
    let busy = false;
    const roll = () => {
      if (busy) return; busy = true; res.innerHTML = '&nbsp;';
      let k = 0;
      const iv = setInterval(() => {
        face(a, actLabel(dd.act[Math.floor(rand() * 6)])); face(b, dd.where[Math.floor(rand() * 6)]); face(c, dd.who[Math.floor(rand() * 6)]);
        tone(400 + rand() * 500, 0.02, 'triangle', 0.06);
        if (++k < 14) return;
        clearInterval(iv); busy = false;
        const act = dd.act[Math.floor(rand() * 6)], where = dd.where[Math.floor(rand() * 6)], who = dd.who[Math.floor(rand() * 6)];
        face(a, actLabel(act)); face(b, where); face(c, who); ding(); buzz(80);
        res.innerHTML = `<b>${esc(who)}</b><br><span class="big-task">${esc(act.replace('{ที่}', where))}</span>` +
          `<br><small>ถ้าอีกฝ่ายไม่ยินยอม คนทอย ${P(2)} แทน</small>`;
      }, 70);
    };
    $('#roll').addEventListener('click', roll);
    $('#spicyDice').addEventListener('click', roll);
  };

  // ================================================================ 🔥 ดวลมุกจีบ
  G['flirt-duel'] = () => {
    const words = bag(D.flirtWords), w = $('#flirtWord'), t = $('#timer'), res = $('#result');
    let pair = [], iv = null;
    const newRound = () => {
      clearInterval(iv); t.textContent = ''; res.innerHTML = '&nbsp;';
      const p = W.players();
      pair = p.length >= 2 ? shuffle(p).slice(0, 2) : ['คนทางซ้าย', 'คนทางขวา'];
      $('#duo').innerHTML = `<span class="duo a">${esc(pair[0])}</span><span class="vs">VS</span><span class="duo b">${esc(pair[1])}</span>`;
      w.textContent = words(); flash(w);
      $('#go1').textContent = `${pair[0]} เริ่ม (20 วิ)`; $('#go2').textContent = `${pair[1]} เริ่ม (20 วิ)`;
      $('#win1').textContent = `${pair[0]} ชนะ`; $('#win2').textContent = `${pair[1]} ชนะ`;
    };
    const go = () => {
      clearInterval(iv); let s = 20; t.textContent = s; ding();
      iv = setInterval(() => { s--; t.textContent = s; if (s <= 3 && s > 0) tone(900, 0.05, 'square'); if (s <= 0) { clearInterval(iv); t.textContent = 'หมดเวลา!'; tone(200, 0.3, 'sawtooth'); } }, 1000);
    };
    $('#go1').addEventListener('click', go);
    $('#go2').addEventListener('click', go);
    const win = (k) => { clearInterval(iv); t.textContent = ''; boom(); res.innerHTML = `${esc(pair[k])} ชนะ! ${esc(pair[1 - k])} → ${P(1)}`; };
    $('#win1').addEventListener('click', () => win(0));
    $('#win2').addEventListener('click', () => win(1));
    $('#nextDuel').addEventListener('click', newRound);
    newRound();
  };

  // ================================================================ 🍻 ทายไพ่ 4 ด่าน
  G['ride-bus'] = () => {
    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'], SUITS = ['♠', '♥', '♦', '♣'];
    const val = (c) => RANKS.indexOf(c[0]) + 2, red = (c) => c[1] === '♥' || c[1] === '♦';
    let deck = [], hand = [], stage = 0;
    const slots = $$('.slot'), title = $('#stageTitle'), ch = $('#choices'), res = $('#result');
    const draw = () => { if (!deck.length) deck = shuffle(RANKS.flatMap((r) => SUITS.map((s) => [r, s]))); return deck.pop(); };
    const cardHtml = (c) => `<span class="mini${red(c) ? ' red' : ''}">${c[0]}<br>${c[1]}</span>`;
    const STAGES = [
      ['ด่าน 1: สีแดงหรือสีดำ?', [['แดง ♥♦', (c) => red(c)], ['ดำ ♠♣', (c) => !red(c)]]],
      ['ด่าน 2: สูงหรือต่ำกว่าใบแรก?', [['สูงกว่า ⬆', (c) => val(c) > val(hand[0])], ['ต่ำกว่า ⬇', (c) => val(c) < val(hand[0])]]],
      ['ด่าน 3: อยู่ระหว่างสองใบแรก หรือนอก?', [['ระหว่าง ↔', (c) => { const [a, b] = [val(hand[0]), val(hand[1])].sort((x, y) => x - y); return val(c) > a && val(c) < b; }],
        ['นอก ⇤⇥', (c) => { const [a, b] = [val(hand[0]), val(hand[1])].sort((x, y) => x - y); return val(c) < a || val(c) > b; }]]],
      ['ด่าน 4: ทายดอก!', SUITS.map((s) => [s, (c) => c[1] === s])],
    ];
    const render = () => {
      slots.forEach((sl, k) => { sl.innerHTML = hand[k] ? cardHtml(hand[k]) : '?'; sl.classList.toggle('now', k === stage); });
      if (stage >= 4) { title.textContent = 'ผ่านครบ 4 ด่าน! 🎉'; ch.innerHTML = ''; return; }
      title.textContent = STAGES[stage][0];
      ch.innerHTML = STAGES[stage][1].map(([label], k) => `<button type="button" class="btn ${k % 2 ? 'alt' : ''}" data-c="${k}">${label}</button>`).join('');
    };
    const restart = (msg = '&nbsp;') => { hand = []; stage = 0; res.innerHTML = msg; render(); };
    ch.addEventListener('click', (e) => {
      const b = e.target.closest('[data-c]'); if (!b || stage >= 4) return;
      const c = draw(); hand[stage] = c;
      const ok = STAGES[stage][1][+b.dataset.c][1](c);
      render(); flash(slots[stage], 'flip');
      if (ok) {
        stage++; ding(); render();
        if (stage >= 4) { boom(); res.innerHTML = `ผ่านครบ! เลือกใครก็ได้ในวง → ${P(4)}`; }
      } else {
        const lost = stage + 1; tone(160, 0.35, 'sawtooth'); buzz([200, 60, 200]);
        ch.innerHTML = ''; res.innerHTML = `ผิดที่ด่าน ${lost}! → ${P(lost)} แล้วเริ่มใหม่จากด่าน 1`;
        setTimeout(() => { hand = []; stage = 0; render(); }, 1600);
      }
    });
    $('#restart').addEventListener('click', () => restart());
    restart();
  };

  // ================================================================ 🍻 เทไม่ให้ล้น
  G.pour = () => {
    const liquid = $('#liquid'), glass = $('#glass'), btn = $('#pourBtn'), status = $('#status'), turn = $('#turn'), stage = $('#stage');
    let fill = 0, limit = 0, added = 0, holding = false, last = 0, broken = false, cur = '', tick = -1;
    const who = () => { cur = W.nextPlayer(); turn.innerHTML = cur ? `ตาของ <b>${esc(cur)}</b>` : 'ส่งมือถือวนรอบวง'; };
    const reset = () => {
      fill = 0; added = 0; limit = 35 + rand() * 60; broken = false;
      stage.classList.remove('exploded'); glass.classList.remove('cracked'); liquid.style.height = '0%';
      status.textContent = 'กดค้างเพื่อเท ต้องเทอย่างน้อยนิดหน่อยทุกตา แล้วส่งต่อ'; btn.disabled = false; who();
    };
    const loop = (t) => {
      if (!holding || broken) return;
      const dt = (t - last) / 1000; last = t;
      const d = dt * (18 + fill * 0.25); fill += d; added += d;
      liquid.style.height = Math.min(fill, 100) + '%';
      if (Math.floor(fill / 3) !== tick) { tick = Math.floor(fill / 3); tone(300 + fill * 6, 0.02, 'sine', 0.04); }
      if (fill >= limit) return crack();
      requestAnimationFrame(loop);
    };
    const crack = () => {
      holding = false; broken = true; btn.disabled = true;
      glass.classList.add('cracked'); stage.classList.add('exploded'); boom(); buzz([400, 80, 400]);
      status.innerHTML = `แก้วแตก! ${cur ? esc(cur) : 'คนที่เท'} → ${P(2)}`;
    };
    const start = (e) => { e.preventDefault(); if (broken) return; holding = true; last = performance.now(); requestAnimationFrame(loop); };
    const stop = () => {
      if (!holding) return; holding = false;
      if (broken) return;
      if (added < 4) { status.textContent = 'เทน้อยไป! ต้องเทอีกหน่อยก่อนส่งต่อ'; buzz(60); return; }
      added = 0; tone(700, 0.06, 'triangle'); status.textContent = 'รอด! ส่งมือถือให้คนถัดไป'; who();
    };
    btn.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
    $('#reset').addEventListener('click', reset);
    reset();
  };

  // ================================================================ 💔 ไพ่ถามใจ 3 ระดับ
  G['deep-cards'] = () => {
    const bags = D.deepLevels.map((l) => bag(l.q)), wild = bag(D.deepWild), q = $('#qcard'), prog = $('#progress');
    let lv = 0, count = 0;
    const levelBtns = $$('[data-lv]');
    const setLv = (n) => { lv = n; levelBtns.forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.lv === n))); draw(); };
    const draw = () => {
      count++;
      const isWild = rand() < 0.14;
      q.innerHTML = isWild
        ? `<p class="tag wild">✨ ไพ่พิเศษ</p><p class="q">${esc(wild().replace('ไพ่พิเศษ: ', ''))}</p>`
        : `<p class="tag lv${lv}">${esc(D.deepLevels[lv].name)}</p><p class="q">${esc(bags[lv]())}</p><p class="hint">ถามคนที่คุณเลือกในวง แล้วให้เขาเป็นคนหยิบไพ่ต่อ</p>`;
      flash(q); tone(520 + lv * 80, 0.08, 'triangle');
      prog.textContent = `เปิดไปแล้ว ${count} ใบ` + (count >= 8 && lv < 2 ? ' · พร้อมไประดับถัดไปหรือยัง?' : '');
    };
    levelBtns.forEach((b) => b.addEventListener('click', () => setLv(+b.dataset.lv)));
    $('#next').addEventListener('click', draw);
    q.addEventListener('click', draw);
    $('#skip').addEventListener('click', () => { $('#skipPen').innerHTML = `ไม่อยากตอบข้อนี้ → ${P(1)} แล้วเปิดใบใหม่`; draw(); });
    setLv(0);
  };

  // ================================================================ 💔 ทายใจเพื่อน
  G['guess-me'] = () => {
    const qs = bag(D.guessMe), q = $('#qcard'), opts = $('#opts'), phase = $('#phase'), res = $('#result');
    let cur, answer = -1, who = '', state = 'secret';
    const round = () => {
      cur = qs(); answer = -1; state = 'secret'; res.innerHTML = '&nbsp;';
      who = W.nextPlayer() || 'คนที่ถือมือถือ';
      q.innerHTML = `<p class="q">${esc(cur[0])}</p>`; flash(q);
      phase.innerHTML = `<b>${esc(who)}</b> เลือกคำตอบของตัวเองแบบลับๆ อย่าให้ใครเห็น`;
      opts.innerHTML = cur[1].map((o, k) => `<button type="button" class="opt-btn" data-o="${k}"><b>${k + 1}</b> ${esc(o)}</button>`).join('');
      show('reveal', false);
    };
    opts.addEventListener('click', (e) => {
      const b = e.target.closest('[data-o]'); if (!b || state !== 'secret') return;
      answer = +b.dataset.o; state = 'guess'; buzz(30); tone(500, 0.05);
      phase.innerHTML = 'บันทึกคำตอบแล้ว 🤫<br>ทุกคนชูนิ้วบอกเลข 1–4 พร้อมกันว่าคิดว่าเขาเลือกข้อไหน แล้วกด “เฉลย”';
      show('reveal');
    });
    $('#reveal').addEventListener('click', () => {
      if (state !== 'guess') return;
      state = 'done'; show('reveal', false); ding();
      $$('.opt-btn', opts).forEach((b, k) => b.classList.add(k === answer ? 'right' : 'dim'));
      res.innerHTML = `คำตอบคือข้อ ${answer + 1}! คนที่ทายผิด → ${P(1)}<br><small>ถ้าไม่มีใครทายถูกเลย ${esc(who)} → ${P(1)} (เพราะไม่มีใครรู้จักคุณ!)</small>`;
      phase.textContent = `${who} เล่าให้ฟังหน่อยว่าทำไมถึงเลือกข้อนี้`;
    });
    $('#next').addEventListener('click', round);
    round();
  };

  // ================================================================ 💑 ใจตรงกันไหม
  G['couple-sync'] = () => {
    const p = W.players();
    $('#nameA').value = p[0] || ''; $('#nameB').value = p[1] || '';
    const qs = bag(D.coupleSync), ROUNDS = 10;
    let A = '', B = '', r = 0, score = 0, cur, ans = [], step = 0;
    const screen = (id) => ['syncSetup', 'syncPlay', 'syncEnd'].forEach((s) => show(s, s === id));
    const options = () => cur[1] === 'who' ? [A, B] : cur[1];
    const ask = () => {
      const person = step === 0 ? A : B;
      $('#syncInfo').textContent = `ข้อ ${r + 1}/${ROUNDS} · คะแนนใจตรงกัน ${score}`;
      $('#syncQ').innerHTML = `<p class="q">${esc(cur[0])}</p>`;
      $('#syncPhase').innerHTML = `ให้ <b>${esc(person)}</b> ตอบ (อีกคนห้ามดู!)`;
      $('#syncOpts').innerHTML = options().map((o, k) => `<button type="button" class="opt-btn" data-o="${k}">${esc(o)}</button>`).join('');
      show('syncPass', false); show('syncNext', false); $('#syncRes').innerHTML = '&nbsp;';
    };
    const round = () => { cur = qs(); ans = []; step = 0; ask(); flash($('#syncQ')); };
    $('#syncOpts').addEventListener('click', (e) => {
      const b = e.target.closest('[data-o]'); if (!b || ans.length > step) return;
      ans[step] = +b.dataset.o; buzz(30); tone(500, 0.05);
      if (step === 0) {
        $('#syncOpts').innerHTML = ''; $('#syncPhase').innerHTML = `บันทึกแล้ว 🤫 ส่งมือถือให้ <b>${esc(B)}</b>`; show('syncPass');
      } else {
        const o = options(), same = ans[0] === ans[1];
        if (same) score++;
        $('#syncOpts').innerHTML = '';
        $('#syncPhase').innerHTML = `${esc(A)}: <b>${esc(o[ans[0]])}</b> · ${esc(B)}: <b>${esc(o[ans[1]])}</b>`;
        $('#syncRes').innerHTML = same ? '💞 ใจตรงกัน! +1' : `💔 ไม่ตรงกัน! ทั้งคู่ → ${P(1)}`;
        same ? ding() : tone(200, 0.3, 'sawtooth');
        r++; show('syncNext');
        $('#syncNext').textContent = r >= ROUNDS ? 'ดูผลรวม' : 'ข้อต่อไป';
      }
    });
    $('#syncPass').addEventListener('click', () => { step = 1; ask(); });
    $('#syncNext').addEventListener('click', () => {
      if (r < ROUNDS) return round();
      const pct = Math.round(score / ROUNDS * 100);
      $('#syncScore').textContent = pct + '%';
      $('#syncMsg').textContent = pct >= 80 ? 'คู่แท้! รู้ใจกันสุดๆ 💘' : pct >= 50 ? 'เข้ากันดี แต่ยังมีเรื่องให้เรียนรู้อีกเยอะ 💕' : 'ต้องคุยกันเยอะขึ้นแล้วล่ะ 😂 ลองเล่นอีกรอบ';
      screen('syncEnd'); boom();
    });
    $('#syncStart').addEventListener('click', () => {
      A = $('#nameA').value.trim() || 'คนที่ 1'; B = $('#nameB').value.trim() || 'คนที่ 2'; r = 0; score = 0;
      screen('syncPlay'); round();
    });
    $('#syncAgain').addEventListener('click', () => screen('syncSetup'));
  };

  // ================================================================ 💑 ดวลความไว
  G['reaction-duel'] = () => {
    const top = $('#p1'), bot = $('#p2'), msg = $$('.duel-msg'), sc = $$('.duel-score');
    const tasks = bag(D.loveTasks), p = W.players();
    const nm = [p[0] || 'คนบน', p[1] || 'คนล่าง'];
    let state = 'idle', score = [0, 0], timer = null, goAt = 0;
    const say = (h) => msg.forEach((m) => { m.innerHTML = h; });
    const paint = (cls) => { [top, bot].forEach((x) => { x.className = 'duel-half ' + cls; }); };
    const scores = () => sc.forEach((s) => { s.textContent = `${nm[0]} ${score[0]} : ${score[1]} ${nm[1]}`; });
    const ready = () => { state = 'idle'; paint('idle'); say('แตะที่ไหนก็ได้เพื่อเริ่มรอบ<br><small>รอจอเป็นสีเขียวแล้วแตะฝั่งตัวเองให้ไวที่สุด</small>'); scores(); };
    const begin = () => {
      state = 'wait'; paint('wait'); say('รอ…'); tone(300, 0.08);
      timer = setTimeout(() => { state = 'go'; goAt = performance.now(); paint('go'); say('แตะ!'); tone(1000, 0.12, 'square'); buzz(40); }, 1500 + rand() * 3500);
    };
    const end = (winner, why) => {
      clearTimeout(timer); state = 'result'; score[winner]++; scores();
      const loser = 1 - winner; boom(); buzz([150, 50, 150]);
      [top, bot][winner].className = 'duel-half win'; [top, bot][loser].className = 'duel-half lose';
      const task = S.mode === 'drink' && rand() < 0.3 ? pen(1) : tasks();
      const done = score[winner] >= 3;
      say(`${why}<br><b>${esc(nm[winner])}</b> ชนะ!<br>${esc(nm[loser])} → ${W.penHtml(task)}` + (done ? `<br>🏆 ${esc(nm[winner])} ชนะทั้งแมตช์!` : ''));
      if (done) score = [0, 0];
      setTimeout(() => { if (state === 'result') state = 'idle-wait'; }, 900);
    };
    const tap = (who) => (e) => {
      e.preventDefault();
      if (state === 'idle' || state === 'idle-wait') { if (state === 'idle-wait') { ready(); } begin(); return; }
      if (state === 'wait') return end(1 - who, `${esc(nm[who])} แตะก่อนเวลา!`);
      if (state === 'go') return end(who, `${Math.round(performance.now() - goAt)} มิลลิวินาที`);
    };
    top.addEventListener('pointerdown', tap(0));
    bot.addEventListener('pointerdown', tap(1));
    ready();
  };
})();
