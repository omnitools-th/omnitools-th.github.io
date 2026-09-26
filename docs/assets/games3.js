/* เกมง่าย กดเดียวรู้เรื่อง + หมุนขวดทะลึ่ง */
(function () {
  'use strict';
  const W = window.W, D = window.WD, { $, $$, esc, S, rand, shuffle, bag, pen, penText, tone, boom, ding, buzz } = W;
  const G = W.games;
  const flash = (el, cls = 'pop') => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const P = (n) => penText(`{pen${n}}`);
  const turnLabel = (el) => { const n = W.nextPlayer(); el.innerHTML = n ? `ตาของ <b>${esc(n)}</b>` : 'ส่งมือถือวนรอบวง'; };

  // ================================================================ 🐊 จระเข้กัด
  G.croc = () => {
    const teeth = $('#teeth'), croc = $('#croc'), res = $('#result'), turn = $('#turn');
    let bad = 0, over = false;
    const reset = () => {
      const n = +$('#nTeeth').value; bad = Math.floor(rand() * n); over = false;
      croc.classList.remove('bite'); res.innerHTML = 'กดฟันทีละซี่ ระวังโดนงับ!';
      teeth.innerHTML = Array.from({ length: n }, (_, i) => `<button type="button" class="tooth" data-t="${i}" aria-label="ฟันซี่ที่ ${i + 1}"></button>`).join('');
      turnLabel(turn);
    };
    teeth.addEventListener('click', (e) => {
      const t = e.target.closest('.tooth'); if (!t || over || t.disabled) return;
      t.disabled = true; t.classList.add('down');
      if (+t.dataset.t === bad) {
        over = true; croc.classList.add('bite'); boom(); buzz([300, 80, 300]);
        res.innerHTML = `งับ!! 🐊 คนที่กดซี่นี้ → ${P(2)}`;
      } else { tone(500 + rand() * 300, 0.05, 'triangle'); buzz(15); turnLabel(turn); }
    });
    $('#reset').addEventListener('click', reset);
    $('#nTeeth').addEventListener('change', reset);
    reset();
  };

  // ================================================================ 🫵 ทำตามคำบอก
  G.simon = () => {
    const next = bag(D.simon), cmd = $('#cmd'), rule = $('#rule'), box = $('#simonBox');
    let auto = null;
    const COLORS = ['#ff4d8d', '#35d0ff', '#ffd23f', '#7cff6b', '#b18cff', '#ff8a3d'];
    const go = () => {
      const [text, trap] = next();
      cmd.textContent = text; box.style.background = COLORS[Math.floor(rand() * COLORS.length)];
      rule.innerHTML = trap ? `⚠️ คำสั่งหลอก! ใครเผลอทำ → ${P(1)}` : `คนสุดท้ายที่ทำ → ${P(1)}`;
      flash(cmd); tone(trap ? 300 : 880, 0.12, trap ? 'sawtooth' : 'square'); buzz(60);
    };
    box.addEventListener('click', go);
    $('#next').addEventListener('click', go);
    $('#auto').addEventListener('change', (e) => {
      clearInterval(auto);
      if (e.target.checked) { go(); auto = setInterval(go, +$('#speed').value * 1000); }
    });
    $('#speed').addEventListener('change', () => { if ($('#auto').checked) { clearInterval(auto); auto = setInterval(go, +$('#speed').value * 1000); } });
  };

  // ================================================================ 🎰 สุ่มคนดื่ม
  G.slot = () => {
    const reel1 = $('#reel1'), reel2 = $('#reel2'), res = $('#result'), hist = $('#history');
    const AMOUNT = [['ดื่ม 1 จิบ', 4], ['ดื่ม 2 จิบ', 3], ['ดื่มครึ่งแก้ว', 1], ['หมดแก้ว!', 0.5], ['รอด! 😅', 1.5], ['เลือกคนดื่มแทน', 1]];
    const weighted = () => { const t = AMOUNT.reduce((s, a) => s + a[1], 0); let r = rand() * t; for (const [a, w] of AMOUNT) { r -= w; if (r <= 0) return a; } return AMOUNT[0][0]; };
    let busy = false;
    const spin = () => {
      const names = W.players();
      if (names.length < 2) { res.innerHTML = '<span class="warn-line">ใส่ชื่อเพื่อนอย่างน้อย 2 คนก่อน (ช่องด้านล่าง)</span>'; $('#playersPanel').open = true; return; }
      if (busy) return; busy = true; res.innerHTML = '&nbsp;';
      const win = names[Math.floor(rand() * names.length)], amt = S.mode === 'drink' ? weighted() : pen();
      let k = 0, delay = 50;
      const tick = () => {
        reel1.textContent = names[k % names.length]; reel2.textContent = S.mode === 'drink' ? AMOUNT[k % AMOUNT.length][0] : '🎯 ภารกิจ';
        tone(600 + (k % 5) * 80, 0.02, 'square', 0.05); k++;
        if (delay < 260) { delay *= 1.12; return setTimeout(tick, delay); }
        reel1.textContent = win; reel2.textContent = amt; busy = false;
        flash(reel1); flash(reel2); boom(); buzz([120, 50, 120]);
        res.innerHTML = `<b>${esc(win)}</b> → <b class="pen">${esc(amt)}</b>`;
        hist.innerHTML = `<span>${esc(win)}: ${esc(amt)}</span>` + hist.innerHTML;
      };
      tick();
    };
    $('#lever').addEventListener('click', spin);
    $('#slotBox').addEventListener('click', spin);
  };

  // ================================================================ 🂠 จั่วไพ่ ใครต่ำสุดดื่ม
  G['low-card'] = () => {
    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'], SUITS = ['♠', '♥', '♦', '♣'];
    const table = $('#table'), res = $('#result'), btn = $('#drawBtn');
    let deck = [], drawn = [], order = [];
    const reset = () => {
      const p = W.players(); const n = p.length >= 2 ? p.length : +$('#nPlayers').value;
      order = Array.from({ length: n }, (_, i) => p[i] || `คนที่ ${i + 1}`);
      deck = shuffle(RANKS.flatMap((r) => SUITS.map((s) => [r, s]))); drawn = [];
      table.innerHTML = ''; res.innerHTML = '&nbsp;'; btn.disabled = false; label();
    };
    const label = () => { btn.textContent = drawn.length < order.length ? `${order[drawn.length]} จั่ว!` : 'จั่วครบแล้ว'; };
    const draw = () => {
      if (drawn.length >= order.length) return;
      const c = deck.pop(), who = order[drawn.length]; drawn.push([who, c]);
      const red = c[1] === '♥' || c[1] === '♦';
      table.insertAdjacentHTML('beforeend', `<div class="seat"><span class="mini big${red ? ' red' : ''}">${c[0]}<br>${c[1]}</span><small>${esc(who)}</small></div>`);
      flash(table.lastElementChild, 'flip'); tone(520, 0.05, 'triangle');
      label();
      if (drawn.length === order.length) {
        btn.disabled = true;
        const v = (x) => RANKS.indexOf(x[1][0]);
        const low = Math.min(...drawn.map(v)), losers = drawn.filter((x) => v(x) === low);
        $$('.seat', table).forEach((s, i) => s.classList.toggle('lose', v(drawn[i]) === low));
        boom(); buzz([200, 60, 200]);
        res.innerHTML = `ไพ่ต่ำสุด: <b>${losers.map((x) => esc(x[0])).join(', ')}</b> → ${P(losers.length > 1 ? 1 : 2)}` + (losers.length > 1 ? '<br><small>เสมอกัน โดนทุกคน!</small>' : '');
      }
    };
    btn.addEventListener('click', draw);
    $('#reset').addEventListener('click', reset);
    $('#nPlayers').addEventListener('change', reset);
    reset();
  };

  // ================================================================ 🍾 เขย่าแชมเปญ
  G.champagne = () => {
    const btl = $('#champ'), res = $('#result'), turn = $('#turn'), stage = $('#stage'), meter = $('#pressure');
    let p = 0, limit = 0, popped = false, shakes = 0;
    const reset = () => {
      p = 0; limit = 8 + Math.floor(rand() * 22); popped = false; shakes = 0;
      btl.classList.remove('popped'); stage.classList.remove('exploded'); meter.style.width = '0%';
      res.innerHTML = 'แตะที่ขวดเพื่อเขย่า คนละ 1–3 ครั้ง แล้วส่งต่อ'; turnLabel(turn);
    };
    const shake = () => {
      if (popped) return;
      p++; shakes++; flash(btl, 'wobble'); tone(200 + p * 25, 0.04, 'square', 0.07); buzz(25);
      meter.style.width = Math.min(95, p / 30 * 100 + rand() * 8) + '%';
      if (p >= limit) {
        popped = true; btl.classList.add('popped'); stage.classList.add('exploded'); boom(); buzz([400, 80, 400]);
        res.innerHTML = `ป๊อก!! 🍾 คนเขย่าคนสุดท้าย → ${P(2)}`; return;
      }
      if (shakes >= 3) { res.innerHTML = 'ครบ 3 ครั้งแล้ว ส่งต่อ!'; }
    };
    btl.addEventListener('click', shake);
    $('#pass').addEventListener('click', () => { if (popped) return; if (!shakes) { res.innerHTML = 'ต้องเขย่าอย่างน้อย 1 ครั้งก่อนส่งต่อ!'; buzz(60); return; } shakes = 0; turnLabel(turn); res.innerHTML = 'ส่งต่อแล้ว! คนถัดไปเขย่าได้ 1–3 ครั้ง'; });
    $('#reset').addEventListener('click', reset);
    reset();
  };

  // ================================================================ 🔞 หมุนขวดทะลึ่ง
  G['spicy-bottle'] = () => {
    const b = $('#bottle'), res = $('#result'), dares = bag(D.spicyBottle);
    let angle = 0, busy = false;
    const spin = () => {
      if (busy) return; busy = true; res.innerHTML = '&nbsp;';
      angle += 360 * (4 + Math.floor(rand() * 3)) + rand() * 360;
      b.style.transform = `rotate(${angle}deg)`;
      const tick = setInterval(() => tone(900 + rand() * 300, 0.02, 'square', 0.05), 120);
      setTimeout(() => {
        clearInterval(tick); busy = false; ding(); buzz(120);
        res.innerHTML = `<small>ปากขวด = คนทำ · ก้นขวด = คนโดน</small><br><span class="big-task">${esc(dares())}</span>` +
          `<br><small>ใครไม่ยินยอม ปากขวด → ${P(2)} แทน</small>`;
      }, 4200);
    };
    $('#bottleWrap').addEventListener('click', spin);
    $('#spin').addEventListener('click', spin);
  };
})();
