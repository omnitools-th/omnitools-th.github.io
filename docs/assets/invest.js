/* เครื่องมือหมวดออมและลงทุน: ดอกเบี้ยทบต้น, ดอกเบี้ยเงินฝาก, DCA (จำลองความผันผวน), วางแผนเกษียณ + กราฟ */
(function () {
  'use strict';
  const { $, $$, val, fmt, fmt0, baht, out, rows, big, bind, tools } = window.KD;
  const chart = (id, opts) => { const b = $('#' + id); if (b && window.KDChart) window.KDChart.render(b, opts); };
  const short = (v) => window.KDChart ? window.KDChart.axisTH(v) : fmt0(v);
  const stats = (items) => '<div class="stats">' + items.map(([k, v, c]) =>
    `<div class="stat${c ? ' ' + c : ''}"><b>${v}</b><span>${k}</span></div>`).join('') + '</div>';
  const insight = (t) => `<p class="insight">${t}</p>`;
  const showWhen = (attr, value) => $$(`[data-${attr}]`).forEach((e) => { e.hidden = e.dataset[attr] !== value; });
  const table = (head, body) => `<div class="tbl-wrap"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;

  // ---------------------------------------------------------------- ดอกเบี้ยทบต้น
  tools['compound-interest'] = () => bind(() => {
    const goal = $('#mode').value === 'goal';
    showWhen('mode', goal ? 'goal' : 'grow');
    const P = val('principal'), r = val('rate') / 100, Y = Math.min(80, Math.max(1, Math.round(val('years'))));
    const n = +$('#freq').value, g = val('grow') / 100, tax = $('#tax').checked, inf = val('inf') / 100;
    const mf = Math.pow(1 + r / n, n / 12) - 1;
    const sim = (c, years) => {
      let bal = P, prin = P;
      const rs = [{ y: 0, prin, bal, yi: 0 }];
      for (let y = 1; y <= years; y++) {
        const cm = c * Math.pow(1 + g, y - 1);
        let yi = 0;
        for (let m = 0; m < 12; m++) {
          const i = bal * mf * (tax ? 0.85 : 1);
          bal += i + cm; prin += cm; yi += i;
        }
        rs.push({ y, prin, bal, yi });
      }
      return rs;
    };
    let C = val('monthly');
    if (goal) {
      const f0 = sim(0, Y)[Y].bal, f1 = sim(1, Y)[Y].bal;
      C = Math.max(0, (val('target') - f0) / (f1 - f0));
    }
    const rs = sim(C, Y), last = rs[Y], interest = last.bal - last.prin;
    const cross = rs.find((x) => x.y > 0 && x.bal - x.prin > x.prin);
    const late = Y > 5 ? sim(C, Y - 5)[Y - 5].bal : null;
    let html = goal
      ? big(`ต้องออมเดือนละ (เพื่อให้มี ${short(val('target'))} บาท ใน ${Y} ปี)`, baht(C))
      : big(`ยอดเงินเมื่อครบ ${Y} ปี`, baht(last.bal));
    html += stats([
      ['เงินต้นที่ใส่ไปทั้งหมด', short(last.prin)],
      ['ดอกเบี้ย / ผลตอบแทน', short(interest), 'hl'],
      ['ยอดเงินรวม', short(last.bal)],
      ['เงินโตขึ้น', last.prin ? fmt(last.bal / last.prin, 2) + ' เท่า' : '-'],
    ]);
    const tips = [];
    if (cross) tips.push(`ปีที่ <b>${cross.y}</b> ดอกเบี้ยสะสมจะแซงเงินต้นที่ใส่ไป จากนั้นเงินจะโตเร็วขึ้นเรื่อยๆ`);
    if (late !== null) tips.push(`ถ้าเริ่มช้าไป 5 ปี (ออม ${Y - 5} ปี) จะได้ <b>${baht(late)}</b> น้อยลง <b>${baht(last.bal - late)}</b>`);
    if (r > 0) tips.push(`กฎ 72: ที่ผลตอบแทน ${fmt(r * 100, 1)}% เงินก้อนจะเพิ่มเป็น 2 เท่าในประมาณ <b>${fmt(72 / (r * 100), 1)} ปี</b>`);
    if (inf > 0) tips.push(`หักเงินเฟ้อ ${fmt(inf * 100, 1)}% ต่อปี ยอดนี้มีค่าเท่ากับเงินวันนี้ประมาณ <b>${baht(last.bal / Math.pow(1 + inf, Y))}</b>`);
    html += tips.map(insight).join('');
    out('result', html);
    chart('chart', {
      title: 'เงินต้นและดอกเบี้ยสะสมรายปี', labels: rs.map((x) => x.y), stacked: true,
      xFmt: (v, i, tip) => tip ? `ปีที่ ${v}` : String(v), yFmt: baht,
      series: [
        { name: 'เงินต้นสะสม', color: 'var(--s1)', kind: 'area', values: rs.map((x) => x.prin) },
        { name: 'ดอกเบี้ยสะสม', color: 'var(--s2)', kind: 'area', values: rs.map((x) => x.bal - x.prin) },
      ],
      tipExtra: (i) => `<div class="tip-total">รวม<b>${baht(rs[i].bal)}</b></div>`,
    });
    out('table', table(['ปี', 'เงินต้นสะสม', 'ดอกเบี้ยปีนี้', 'ดอกเบี้ยสะสม', 'ยอดรวม'],
      rs.slice(1).map((x) => `<tr><td>${x.y}</td><td>${fmt0(x.prin)}</td><td>${fmt0(x.yi)}</td><td>${fmt0(x.bal - x.prin)}</td><td><b>${fmt0(x.bal)}</b></td></tr>`).join('')));
  });

  // ---------------------------------------------------------------- ดอกเบี้ยเงินฝาก
  tools['deposit-interest'] = () => bind(() => {
    const type = $('#type').value;
    showWhen('type', type);
    if (type === 'savings') {
      const bal = val('amount'), r = val('rate') / 100, Y = Math.max(1, Math.round(val('years')));
      let b = bal, first = 0;
      for (let y = 1; y <= Y; y++) {
        let yi = 0;
        for (let h = 0; h < 2; h++) { const i = b * r / 2; yi += i; b += i; }
        const t = yi > 20000 ? yi * 0.15 : 0;
        b -= t;
        if (y === 1) first = yi;
      }
      const taxed = first > 20000;
      out('result',
        big('ดอกเบี้ยปีแรก (ก่อนภาษี)', baht(first)) +
        stats([
          ['เฉลี่ยต่อเดือน', short(first / 12)],
          ['ภาษี 15%', taxed ? short(first * 0.15) : 'ยกเว้น', taxed ? '' : 'hl'],
          ['ดอกเบี้ยสุทธิปีแรก', short(taxed ? first * 0.85 : first)],
          [`ยอดเงินเมื่อครบ ${Y} ปี`, short(b)],
        ]) +
        insight(r > 0 ? `ดอกเบี้ยออมทรัพย์รวมทุกบัญชีไม่เกิน 20,000 บาทต่อปี ได้รับยกเว้นภาษี ที่ดอกเบี้ย ${fmt(r * 100, 2)}% คุณฝากได้ถึงประมาณ <b>${baht(20000 / r)}</b> โดยไม่เสียภาษี` : '') +
        insight('ธนาคารส่วนใหญ่จ่ายดอกเบี้ยออมทรัพย์ปีละ 2 ครั้ง (มิถุนายนและธันวาคม) ดอกเบี้ยที่ได้จะทบเข้าเงินต้นให้อัตโนมัติ'));
    } else if (type === 'fixed') {
      const P = val('amount'), r = val('rate') / 100, m = +$('#term').value, k = Math.max(1, Math.round(val('rounds')));
      const gross = P * r * m / 12, tax = gross * 0.15;
      let b = P;
      for (let i = 0; i < k; i++) b += b * r * m / 12 * 0.85;
      out('result',
        big(`ดอกเบี้ยสุทธิเมื่อครบ ${m} เดือน`, baht(gross - tax)) +
        stats([
          ['ดอกเบี้ยก่อนภาษี', short(gross)],
          ['หักภาษี ณ ที่จ่าย 15%', short(tax)],
          ['ยอดรับเมื่อครบกำหนด', short(P + gross - tax)],
          ['ดอกเบี้ยสุทธิต่อปี', fmt(r * 85, 2) + '%', 'hl'],
        ]) +
        (k > 1 ? insight(`ฝากต่ออัตโนมัติ ${k} รอบ (รวม ${fmt((m * k) / 12, 1)} ปี) โดยทบดอกเบี้ยสุทธิเข้าเงินต้น จะได้ยอดรวม <b>${baht(b)}</b>`) : '') +
        insight('ดอกเบี้ยเงินฝากประจำถูกหักภาษี ณ ที่จ่าย 15% เสมอ ไม่มีข้อยกเว้น 20,000 บาทเหมือนออมทรัพย์ แต่เลือกนำไปรวมคำนวณภาษีปลายปีได้ ถ้าฐานภาษีของคุณต่ำกว่า 15% อาจได้เงินคืน'));
    } else {
      const c = val('monthlyDep'), r = val('rate') / 100, T = +$('#tfTerm').value;
      let bal = 0, it = 0;
      for (let i = 1; i <= T; i++) { bal += c; it += bal * r / 12; }
      const warn = [];
      if (c > 25000) warn.push('บัญชีปลอดภาษีฝากได้ไม่เกิน 25,000 บาทต่อเดือน');
      if (c * T > 600000) warn.push('ยอดฝากรวมต้องไม่เกิน 600,000 บาท');
      out('result',
        big(`ดอกเบี้ยเมื่อครบ ${T} เดือน (ไม่เสียภาษี)`, baht(it)) +
        stats([
          ['เงินฝากรวม', short(bal)],
          ['ยอดรับเมื่อครบกำหนด', short(bal + it)],
          ['ถ้าต้องเสียภาษี 15% จะเสียไป', short(it * 0.15), 'hl'],
        ]) +
        warn.map((w) => `<p class="warn" style="margin:10px 0 0">${w}</p>`).join('') +
        insight('ต้องฝากทุกเดือนเท่ากันตลอดสัญญา ถ้าขาดฝากเกินจำนวนครั้งที่ธนาคารกำหนด หรือถอนก่อนครบกำหนด จะไม่ได้สิทธิยกเว้นภาษีและอาจได้ดอกเบี้ยออมทรัพย์แทน'));
    }
  });

  // ---------------------------------------------------------------- DCA + จำลองความผันผวน
  const PRESETS = { deposit: [1.5, 0], bond: [2.5, 3], mixed: [5, 10], thai: [6, 18], global: [7, 15], us: [8, 16], gold: [5, 15] };
  function rng(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const pct = (arr, p) => { const s = arr.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
  tools.dca = () => {
    let timer;
    bind((e) => {
      if (e && e.target.id === 'asset' && PRESETS[e.target.value]) {
        [$('#ret').value, $('#vol').value] = PRESETS[e.target.value];
      }
      if (e && (e.target.id === 'ret' || e.target.id === 'vol')) $('#asset').value = 'custom';
      clearTimeout(timer);
      timer = setTimeout(run, e ? 120 : 0);
    });
    function run() {
      const c = val('monthly'), L = val('lump'), Y = Math.min(40, Math.max(1, Math.round(val('years'))));
      const mu = Math.log(1 + val('ret') / 100) / 12, sd = val('vol') / 100 / Math.sqrt(12);
      const N = 1500, rand = rng(20260926), months = Y * 12, total = L + c * months;
      const yearly = Array.from({ length: Y + 1 }, () => []);
      const finals = [], lumps = [];
      for (let p = 0; p < N; p++) {
        let bal = L, lump = total;
        yearly[0].push(L);
        for (let m = 1; m <= months; m++) {
          let z = 0;
          if (sd) { const u = 1 - rand(), v = rand(); z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
          const f = Math.exp(mu + sd * z);
          bal = (bal + c) * f; lump *= f;
          if (m % 12 === 0) yearly[m / 12].push(bal);
        }
        finals.push(bal); lumps.push(lump);
      }
      const inv = yearly.map((_, y) => L + c * 12 * y);
      const p10 = yearly.map((a) => pct(a, 0.1)), p50 = yearly.map((a) => pct(a, 0.5)), p90 = yearly.map((a) => pct(a, 0.9));
      const loss = finals.filter((v) => v < total).length / N, lossL = lumps.filter((v) => v < total).length / N;
      out('result',
        big(`ผลลัพธ์กลางๆ เมื่อครบ ${Y} ปี`, baht(p50[Y])) +
        stats([
          ['เงินที่ลงทุนทั้งหมด', short(total)],
          ['กรณีแย่ (โอกาส 1 ใน 10)', short(p10[Y])],
          ['กรณีดี (โอกาส 1 ใน 10)', short(p90[Y])],
          ['โอกาสขาดทุนเมื่อครบกำหนด', fmt(loss * 100, 1) + '%', 'hl'],
        ]) +
        `<h3 style="margin-top:16px">DCA เทียบกับลงทุนก้อนเดียวตั้งแต่วันแรก</h3>` +
        table(['', 'DCA ทุกเดือน', 'ลงก้อนเดียว'],
          `<tr><td>ผลลัพธ์กลางๆ</td><td>${fmt0(p50[Y])}</td><td>${fmt0(pct(lumps, 0.5))}</td></tr>` +
          `<tr><td>กรณีแย่ (10%)</td><td>${fmt0(p10[Y])}</td><td>${fmt0(pct(lumps, 0.1))}</td></tr>` +
          `<tr><td>โอกาสขาดทุน</td><td>${fmt(loss * 100, 1)}%</td><td>${fmt(lossL * 100, 1)}%</td></tr>`) +
        insight('ถ้าตลาดเป็นขาขึ้นในระยะยาว การลงเงินก้อนเดียวมักได้ผลลัพธ์กลางๆ สูงกว่า แต่ DCA ช่วยเฉลี่ยราคาซื้อ ลดความเสี่ยงที่จะซื้อตอนแพง และเหมาะกับคนที่มีรายได้เข้ามาทุกเดือน'));
      chart('chart', {
        title: 'ช่วงผลลัพธ์ที่เป็นไปได้ของ DCA', labels: inv.map((_, y) => y),
        xFmt: (v, i, tip) => tip ? `ปีที่ ${v}` : String(v), yFmt: baht,
        series: [
          { name: 'ช่วงผลลัพธ์ 80% ของกรณี', color: 'var(--s1)', kind: 'band', lower: p10, upper: p90 },
          { name: 'ผลลัพธ์กลางๆ', color: 'var(--s1)', kind: 'line', values: p50 },
          { name: 'เงินที่ลงทุนสะสม', color: 'var(--s2)', kind: 'line', values: inv, dash: true },
        ],
      });
    }
  };

  // ---------------------------------------------------------------- วางแผนเกษียณ (แทนที่เวอร์ชันเดิม เพิ่มกราฟ)
  tools.retirement = () => bind(() => {
    const age = val('age'), ret = val('retire'), until = val('until');
    const inf = val('inf') / 100, r1 = val('ret1') / 100, r2 = val('ret2') / 100;
    const yTo = Math.max(0, ret - age), yIn = Math.max(1, until - ret);
    const spendRet = val('spend') * 12 * Math.pow(1 + inf, yTo), pension = val('pension') * 12, have = val('have');
    let need = 0;
    for (let k = 0; k < yIn; k++) need += Math.max(0, spendRet * Math.pow(1 + inf, k) - pension) / Math.pow(1 + r2, k);
    const pmt = (years) => {
      const gap = Math.max(0, need - have * Math.pow(1 + r1, years)), n = years * 12, r = r1 / 12;
      if (!gap) return 0;
      if (!n) return Infinity;
      return r ? gap * r / (Math.pow(1 + r, n) - 1) : gap / n;
    };
    const path = (save) => {
      const ages = [], w = [];
      let b = have, broke = null;
      for (let a = age; a <= until; a++) {
        ages.push(a); w.push(Math.max(0, b));
        if (a < ret) { for (let m = 0; m < 12; m++) b = b * (1 + r1 / 12) + save; }
        else {
          b = (b - Math.max(0, spendRet * Math.pow(1 + inf, a - ret) - pension)) * (1 + r2);
          if (b <= 0 && broke === null) broke = a + 1;
        }
      }
      return { ages, w, broke };
    };
    const now = pmt(yTo), late = yTo > 5 ? pmt(yTo - 5) : null, cur = val('save');
    const plan = path(now === Infinity ? 0 : now), mine = path(cur);
    out('result',
      big('ต้องออม/ลงทุนเดือนละ', now === Infinity ? 'เกษียณแล้ว' : baht(now)) +
      stats([
        ['เงินที่ต้องมีวันเกษียณ', short(need), 'hl'],
        [`ค่าใช้จ่าย/เดือน ตอนอายุ ${ret}`, short(spendRet / 12)],
        ['เงินที่มีอยู่จะโตเป็น', short(have * Math.pow(1 + r1, yTo))],
        ['ระยะเวลาออม', fmt0(yTo) + ' ปี'],
      ]) +
      insight(mine.broke !== null && mine.broke <= until
        ? `ถ้าออมเดือนละ ${baht(cur)} เท่าที่ออมอยู่ <b>เงินจะหมดตอนอายุประมาณ ${mine.broke} ปี</b> ก่อนเป้าหมาย (อายุ ${until}) ${until - mine.broke} ปี`
        : `ถ้าออมเดือนละ ${baht(cur)} เท่าที่ออมอยู่ <b>เงินพอใช้ถึงอายุ ${until} ปี</b> 🎉`) +
      (late !== null ? insight(`ถ้าเริ่มช้าไป 5 ปี ต้องออมเดือนละ <b>${baht(late)}</b>`) : '') +
      '<p class="note" style="margin:10px 0 0">ตัวเลขนี้เป็นการประมาณจากสมมติฐานที่คุณกรอก ไม่ใช่คำแนะนำการลงทุน</p>');
    chart('chart', {
      title: 'เงินออมตามอายุ', labels: plan.ages, yFmt: baht,
      xFmt: (v, i, tip) => tip ? `อายุ ${v} ปี` : String(v),
      series: [
        { name: `ออมตามแผน (${short(now === Infinity ? 0 : now)}/เดือน)`, color: 'var(--s1)', kind: 'line', values: plan.w },
        { name: `ออมเท่าที่ออมอยู่ (${short(cur)}/เดือน)`, color: 'var(--s2)', kind: 'line', values: mine.w },
      ],
    });
  });
})();
