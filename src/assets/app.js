(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const num = (v) => parseFloat(String(v == null ? '' : v).replace(/[,\s]/g, ''));
  const val = (id) => { const n = num($('#' + id).value); return Number.isFinite(n) ? n : 0; };
  const raw = (id) => num($('#' + id).value);
  const fmt = (n, d = 2) => Number.isFinite(n)
    ? n.toLocaleString('th-TH', { minimumFractionDigits: d, maximumFractionDigits: d }) : '-';
  const fmt0 = (n) => fmt(n, 0);
  const baht = (n) => fmt(n) + ' บาท';
  const out = (id, html) => { const el = $('#' + id); if (el) el.innerHTML = html; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function rows(items) {
    return '<dl class="rows">' + items.map(([k, v, cls]) =>
      `<div class="row ${cls || ''}"><dt>${k}</dt><dd>${v}</dd></div>`).join('') + '</dl>';
  }
  function big(label, value) {
    return `<div class="big-label">${label}</div><div class="big">${value}</div>`;
  }
  function bind(fn) {
    const form = $('.calc');
    form.addEventListener('submit', (e) => e.preventDefault());
    form.addEventListener('input', fn);
    form.addEventListener('change', fn);
    fn();
  }

  // ---------- dates (all in UTC to avoid timezone drift) ----------
  const DAY = 86400000;
  function parseDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
  }
  const iso = (d) => d.toISOString().slice(0, 10);
  function today() { const n = new Date(); return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); }
  const thDate = (d) => d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  function ymd(a, b) {
    let y = b.getUTCFullYear() - a.getUTCFullYear();
    let m = b.getUTCMonth() - a.getUTCMonth();
    let d = b.getUTCDate() - a.getUTCDate();
    if (d < 0) { m--; d += new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 0)).getUTCDate(); }
    if (m < 0) { y--; m += 12; }
    return { y, m, d };
  }
  const ymdText = (o) => `${o.y} ปี ${o.m} เดือน ${o.d} วัน`;

  // ---------- Thai baht text ----------
  const DIG = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const POS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];
  function readInt(s) {
    s = s.replace(/^0+/, '');
    if (!s) return '';
    const groups = [];
    for (let i = s.length; i > 0; i -= 6) groups.unshift(s.slice(Math.max(0, i - 6), i));
    let text = '', seen = false;
    groups.forEach((g, gi) => {
      for (let i = 0; i < g.length; i++) {
        const d = +g[i], p = g.length - 1 - i;
        if (d === 0) continue;
        if (p === 0 && d === 1 && seen) text += 'เอ็ด';
        else if (p === 1 && d === 1) text += 'สิบ';
        else if (p === 1 && d === 2) text += 'ยี่สิบ';
        else text += DIG[d] + POS[p];
        seen = true;
      }
      if (gi < groups.length - 1) text += 'ล้าน';
    });
    return text;
  }
  function bahtText(input) {
    let s = String(input).replace(/[,\s฿]/g, '').replace(/บาท$/, '');
    if (!s) return null;
    let neg = false;
    if (s[0] === '-') { neg = true; s = s.slice(1); }
    if (!/^\d*\.?\d*$/.test(s) || s === '.') return null;
    const [ip = '', dp = ''] = s.split('.');
    const d3 = (dp + '000').slice(0, 3);
    let satang = BigInt(ip || '0') * 100n + BigInt(d3.slice(0, 2));
    if (+d3[2] >= 5) satang += 1n;
    const whole = satang / 100n, st = satang % 100n;
    if (whole === 0n && st === 0n) return 'ศูนย์บาทถ้วน';
    let text = whole > 0n ? readInt(whole.toString()) + 'บาท' : '';
    text += st > 0n ? readInt(st.toString()) + 'สตางค์' : 'ถ้วน';
    return (neg ? 'ลบ' : '') + text;
  }
  function groupDigits(input) {
    const s = String(input).replace(/[,\s฿]/g, '');
    if (!/^-?\d*\.?\d*$/.test(s)) return '';
    const [i, d] = s.split('.');
    return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d !== undefined ? '.' + d : '');
  }

  // ---------- tools ----------
  const tools = {
    'baht-text'() {
      bind(() => {
        const v = $('#amount').value;
        const t = bahtText(v);
        if (!v.trim()) return out('result', '');
        if (!t) return out('result', '<p class="warn">กรุณากรอกเฉพาะตัวเลข เช่น 12,345.50</p>');
        out('result', big(esc(groupDigits(v)) + ' บาท', t) +
          `<p style="margin:12px 0 0"><button type="button" class="btn" data-copy="${esc(t)}">คัดลอกข้อความ</button></p>`);
      });
    },

    tax() {
      const BR = [[150000, 0], [300000, .05], [500000, .10], [750000, .15], [1000000, .20], [2000000, .25], [5000000, .30], [Infinity, .35]];
      bind(() => {
        const salary = val('salary'), months = Math.min(12, Math.max(0, val('months')));
        const income = salary * months + val('bonus');
        const ssoRaw = raw('sso');
        const sso = Number.isFinite(ssoRaw) ? ssoRaw :Math.min(salary * 0.05, 875) * months;
        const expense = Math.min(income * 0.5, 100000);
        const allow = 60000 + ($('#spouse').checked ? 60000 : 0) + val('kids') * 30000 +
          Math.min(4, val('parents')) * 30000 + sso + val('other');
        const net = Math.max(0, income - expense - allow);
        let prev = 0, tax = 0, table = '';
        for (const [cap, rate] of BR) {
          if (net <= prev) break;
          const part = Math.min(net, cap) - prev, t = part * rate;
          tax += t;
          table += `<tr><td>${fmt0(prev + (prev ? 1 : 0))} – ${cap === Infinity ? 'ขึ้นไป' : fmt0(Math.min(net, cap))}</td><td>${rate * 100}%</td><td>${fmt(t)}</td></tr>`;
          prev = cap;
        }
        out('result',
          big('ภาษีที่ต้องจ่ายทั้งปี', baht(tax)) +
          rows([
            ['เงินได้ทั้งปี', baht(income)],
            ['หักค่าใช้จ่าย (50% ไม่เกิน 100,000)', baht(expense)],
            ['หักค่าลดหย่อนรวม', baht(allow)],
            ['ประกันสังคม (รวมอยู่ในค่าลดหย่อน)', baht(sso)],
            ['เงินได้สุทธิ', baht(net), 'strong'],
            ['ภาษีเฉลี่ยต่อเดือน', baht(tax / 12)],
            ['อัตราภาษีที่แท้จริง', income ? fmt(tax / income * 100) + '%' : '-'],
          ]) +
          (table ? `<h3 style="margin-top:14px">ภาษีแยกตามขั้นบันได</h3><div class="tbl-wrap"><table><thead><tr><th>เงินได้สุทธิช่วง</th><th>อัตรา</th><th>ภาษี (บาท)</th></tr></thead><tbody>${table}</tbody></table></div>` : ''));
      });
    },

    'car-loan'() {
      const calc = (p, rate, months, vat) => {
        const interest = p * rate / 100 * months / 12;
        const m = (p + interest) / months;
        return { interest, m, mv: vat ? m * 1.07 : m };
      };
      bind(() => {
        const price = val('price'), downPct = val('down'), rate = val('rate');
        const months = parseInt($('#months').value, 10), vat = $('#vat').checked;
        const down = price * downPct / 100, p = Math.max(0, price - down);
        const r = calc(p, rate, months, vat);
        let tbl = '';
        for (const n of [48, 60, 72, 84]) {
          const x = calc(p, rate, n, vat);
          tbl += `<tr${n === months ? ' style="font-weight:600"' : ''}><td>${n} งวด (${n / 12} ปี)</td><td>${fmt0(Math.ceil(x.mv))}</td><td>${fmt0(x.interest)}</td></tr>`;
        }
        out('result',
          big(`ค่างวดต่อเดือน${vat ? ' (รวม VAT 7%)' : ''}`, fmt0(Math.ceil(r.mv)) + ' บาท') +
          rows([
            ['เงินดาวน์', baht(down)],
            ['ยอดจัดไฟแนนซ์', baht(p)],
            ['ดอกเบี้ยทั้งหมด', baht(r.interest)],
            ['ค่างวดก่อน VAT', baht(r.m)],
            ['ยอดผ่อนทั้งหมด', baht(r.mv * months), 'strong'],
            ['ราคารวมที่จ่ายจริง (ดาวน์ + ผ่อน)', baht(down + r.mv * months)],
          ]) +
          `<h3 style="margin-top:14px">เทียบจำนวนงวด</h3><div class="tbl-wrap"><table><thead><tr><th>ระยะผ่อน</th><th>ค่างวด/เดือน</th><th>ดอกเบี้ยรวม</th></tr></thead><tbody>${tbl}</tbody></table></div>`);
      });
    },

    'home-loan'() {
      bind(() => {
        const p = val('loan'), rate = val('rate') / 100 / 12, n = Math.round(val('years') * 12);
        if (!p || !n) return out('result', '');
        const m = rate ? p * rate / (1 - Math.pow(1 + rate, -n)) : p / n;
        const total = m * n;
        out('result',
          big('ค่างวดต่อเดือน', fmt0(Math.ceil(m)) + ' บาท') +
          rows([
            ['ยอดกู้', baht(p)],
            ['จำนวนงวด', fmt0(n) + ' งวด'],
            ['ดอกเบี้ยทั้งหมด', baht(total - p)],
            ['ยอดผ่อนทั้งหมด', baht(total), 'strong'],
            ['งวดแรก: ตัดดอกเบี้ย', baht(p * rate)],
            ['งวดแรก: ตัดเงินต้น', baht(m - p * rate)],
            ['รายได้ขั้นต่ำที่ควรมี (ผ่อนไม่เกิน 40%)', baht(m / 0.4)],
          ]));
      });
    },

    vat() {
      bind(() => {
        const amt = val('amount'), r = val('rate') / 100, w = parseFloat($('#wht').value) / 100;
        const mode = $('input[name="mode"]:checked').value;
        const base = mode === 'add' ? amt : amt / (1 + r);
        const vat = base * r, total = base + vat, wht = base * w;
        const items = [
          ['ราคาก่อน VAT', baht(base)],
          [`VAT ${fmt(r * 100, 0)}%`, baht(vat)],
          ['ราคารวม VAT', baht(total), w ? '' : 'strong'],
        ];
        if (w) items.push([`หัก ณ ที่จ่าย ${fmt(w * 100, 0)}% (คิดจากราคาก่อน VAT)`, '−' + baht(wht)], ['ยอดที่ต้องโอนจริง', baht(total - wht), 'strong']);
        out('result', big(mode === 'add' ? 'ราคารวม VAT' : 'ราคาก่อน VAT', baht(mode === 'add' ? total : base)) + rows(items));
      });
    },

    age() {
      $('#asof').value = iso(today());
      bind(() => {
        const b = parseDate($('#birth').value), a = parseDate($('#asof').value);
        if (!b || !a) return out('result', '');
        if (b > a) return out('result', '<p class="warn">วันเกิดต้องอยู่ก่อนวันที่คำนวณ</p>');
        const age = ymd(b, a), days = Math.round((a - b) / DAY);
        let next = new Date(Date.UTC(a.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()));
        if (next < a) next = new Date(Date.UTC(a.getUTCFullYear() + 1, b.getUTCMonth(), b.getUTCDate()));
        const toNext = Math.round((next - a) / DAY);
        out('result',
          big('อายุ', ymdText(age)) +
          rows([
            ['เกิดวัน', thDate(b)],
            ['ปีเกิด', `พ.ศ. ${b.getUTCFullYear() + 543} / ค.ศ. ${b.getUTCFullYear()}`],
            ['มีชีวิตมาแล้ว', fmt0(days) + ' วัน'],
            ['คิดเป็นสัปดาห์', fmt0(Math.floor(days / 7)) + ' สัปดาห์'],
            ['คิดเป็นเดือน', fmt0(age.y * 12 + age.m) + ' เดือน'],
            ['วันเกิดครั้งถัดไป', toNext === 0 ? 'วันนี้! สุขสันต์วันเกิด 🎂' : `อีก ${fmt0(toNext)} วัน (${thDate(next)})`, 'strong'],
          ]));
      });
    },

    days() {
      const t = today();
      $('#start').value = iso(t);
      $('#end').value = iso(new Date(t.getTime() + 30 * DAY));
      $('#base').value = iso(t);
      bind(() => {
        const s = parseDate($('#start').value), e = parseDate($('#end').value);
        if (s && e) {
          const [a, b] = s <= e ? [s, e] : [e, s];
          const incl = $('#incl').checked ? 1 : 0;
          const days = Math.round((b - a) / DAY) + incl;
          let work = 0;
          if (days < 200000) {
            for (let i = 0; i < days; i++) {
              const wd = new Date(a.getTime() + i * DAY).getUTCDay();
              if (wd !== 0 && wd !== 6) work++;
            }
          }
          const span = ymd(a, incl ? new Date(b.getTime() + DAY) : b);
          out('result',
            big('จำนวนวัน', fmt0(days) + ' วัน') +
            rows([
              ['คิดเป็น', ymdText(span)],
              ['คิดเป็นสัปดาห์', `${fmt0(Math.floor(days / 7))} สัปดาห์ ${days % 7} วัน`],
              ['วันทำงาน (จันทร์–ศุกร์)', fmt0(work) + ' วัน'],
              ['วันเสาร์–อาทิตย์', fmt0(days - work) + ' วัน'],
              ['คิดเป็นชั่วโมง', fmt0(days * 24) + ' ชั่วโมง'],
            ]) + '<p class="note" style="margin:8px 0 0">วันทำงานยังไม่ได้หักวันหยุดนักขัตฤกษ์</p>');
        } else out('result', '');
        const base = parseDate($('#base').value), n = Math.trunc(val('n'));
        if (base) {
          const r = new Date(base.getTime() + n * DAY);
          out('result2', big(`${n >= 0 ? 'อีก' : 'ย้อนหลัง'} ${fmt0(Math.abs(n))} วัน คือ`, thDate(r)));
        } else out('result2', '');
      });
    },

    bmi() {
      const CATS = [
        [18.5, 'น้ำหนักน้อย / ผอม', '#6aa6d8'],
        [23, 'ปกติ (สุขภาพดี)', '#3fa86b'],
        [25, 'ท้วม / น้ำหนักเกิน', '#d8b84a'],
        [30, 'อ้วน', '#e08a3c'],
        [Infinity, 'อ้วนมาก', '#d2553f'],
      ];
      bind(() => {
        const w = val('weight'), h = val('height') / 100;
        if (!w || !h) return out('result', '');
        const bmi = w / (h * h);
        const cat = CATS.find(([lim]) => bmi < lim);
        const pos = Math.min(100, Math.max(0, (bmi - 15) / (35 - 15) * 100));
        const seg = [[15, 18.5], [18.5, 23], [23, 25], [25, 30], [30, 35]]
          .map(([a, b], i) => `<span style="flex:${b - a};background:${CATS[i][2]}"></span>`).join('');
        out('result',
          big('ค่า BMI ของคุณ', `${fmt(bmi, 1)} <span style="font-size:.6em;color:${cat[2]}">${cat[1]}</span>`) +
          `<div class="gauge-wrap"><div class="gauge">${seg}</div><div class="gauge-marker" style="left:${pos}%"></div></div>` +
          '<div class="gauge-labels"><span>15</span><span>18.5</span><span>23</span><span>25</span><span>30</span><span>35</span></div>' +
          rows([
            ['น้ำหนักที่เหมาะสมกับส่วนสูงนี้', `${fmt(18.5 * h * h, 1)} – ${fmt(22.9 * h * h, 1)} กก.`, 'strong'],
            ['เกณฑ์ที่ใช้', 'เกณฑ์สำหรับคนเอเชีย (WHO)'],
          ]));
      });
    },

    discount() {
      bind(() => {
        const p = val('price'), d1 = val('d1') / 100, d2 = val('d2') / 100;
        const final = p * (1 - d1) * (1 - d2);
        out('result', p ? big('ราคาหลังลด', baht(final)) + rows([
          ['ประหยัดไป', baht(p - final), 'strong'],
          ['ส่วนลดรวมจริง', p ? fmt((1 - final / p) * 100) + '%' : '-'],
        ]) + (d2 ? '<p class="note" style="margin:8px 0 0">ลดซ้อนไม่ใช่การบวกเปอร์เซ็นต์ตรงๆ ส่วนลดชั้นที่สองคิดจากราคาที่ลดแล้ว</p>' : '') : '');
        const a = raw('from'), b = raw('to');
        if (Number.isFinite(a) && Number.isFinite(b) && a !== 0) {
          const c = (b - a) / Math.abs(a) * 100;
          out('result2', big(c >= 0 ? 'เพิ่มขึ้น' : 'ลดลง', fmt(Math.abs(c)) + '%') +
            rows([['ส่วนต่าง', fmt(b - a)], [`${fmt(b)} คิดเป็น`, fmt(b / a * 100) + '% ของ ' + fmt(a)]]));
        } else out('result2', '');
        const x = raw('pct'), y = raw('of');
        out('result3', Number.isFinite(x) && Number.isFinite(y) ? big(`${fmt(x)}% ของ ${fmt(y)} เท่ากับ`, fmt(x / 100 * y)) : '');
      });
    },

    gpa() {
      const GR = [['A', 4], ['B+', 3.5], ['B', 3], ['C+', 2.5], ['C', 2], ['D+', 1.5], ['D', 1], ['F', 0]];
      const body = $('#courses');
      const addRow = () => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><input class="c-name" placeholder="ชื่อวิชา (ไม่ต้องกรอกก็ได้)" aria-label="ชื่อวิชา"></td>` +
          `<td style="width:90px"><input class="c-cr" type="number" inputmode="decimal" min="0" step="0.5" value="3" aria-label="หน่วยกิต"></td>` +
          `<td style="width:90px"><select class="c-gr" aria-label="เกรด">${GR.map(([g, v]) => `<option value="${v}">${g}</option>`).join('')}</select></td>` +
          `<td style="width:44px"><button type="button" class="icon-btn" data-del aria-label="ลบวิชา">×</button></td>`;
        body.appendChild(tr);
      };
      for (let i = 0; i < 5; i++) addRow();
      const calc = () => {
        let cr = 0, pts = 0;
        $$('tr', body).forEach((tr) => {
          const c = num($('.c-cr', tr).value);
          if (Number.isFinite(c) && c > 0) { cr += c; pts += c * parseFloat($('.c-gr', tr).value); }
        });
        if (!cr) return out('result', '');
        const gpa = pts / cr;
        const items = [['หน่วยกิตเทอมนี้', fmt(cr, 1)], ['แต้มรวม', fmt(pts, 1)]];
        const pg = raw('prevGpa'), pc = raw('prevCr');
        if (Number.isFinite(pg) && Number.isFinite(pc) && pc > 0) {
          items.push(['เกรดเฉลี่ยสะสม (GPAX) ใหม่', fmt((pg * pc + pts) / (pc + cr)), 'strong'],
            ['หน่วยกิตสะสมรวม', fmt(pc + cr, 1)]);
        }
        out('result', big('เกรดเฉลี่ยเทอมนี้ (GPA)', fmt(Math.floor(gpa * 100 + 1e-9) / 100)) + rows(items));
      };
      $('#addRow').addEventListener('click', () => { addRow(); calc(); });
      body.addEventListener('click', (e) => {
        if (e.target.closest('[data-del]')) { e.target.closest('tr').remove(); calc(); }
      });
      bind(calc);
    },
  };

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    const text = b.getAttribute('data-copy');
    const done = () => { const o = b.textContent; b.textContent = 'คัดลอกแล้ว ✓'; setTimeout(() => { b.textContent = o; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => {});
    else {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove(); done();
    }
  });

  // อัตราภาษีเงินได้บุคคลธรรมดาแบบขั้นบันได
  const TAX_BR = [[150000, 0], [300000, .05], [500000, .10], [750000, .15], [1000000, .20], [2000000, .25], [5000000, .30], [Infinity, .35]];
  function progressive(net, br = TAX_BR) {
    let prev = 0, tax = 0;
    for (const [cap, rate] of br) {
      if (net <= prev) break;
      tax += (Math.min(net, cap) - prev) * rate;
      prev = cap;
    }
    return tax;
  }

  window.KD = { $, $$, num, val, raw, fmt, fmt0, baht, out, esc, rows, big, bind, parseDate, iso, today, thDate, ymd, ymdText, DAY, progressive, tools };

  document.addEventListener('DOMContentLoaded', () => {
    const tool = document.body.dataset.tool;
    if (tool && tools[tool]) tools[tool]();

    // ค้นหาเครื่องมือในหน้าแรก
    const q = $('#toolSearch');
    if (q) {
      const none = $('#noResult');
      q.addEventListener('input', () => {
        const s = q.value.trim().toLowerCase();
        let shown = 0;
        $$('.cat-section').forEach((sec) => {
          let n = 0;
          $$('.tool', sec).forEach((a) => {
            const hit = !s || a.textContent.toLowerCase().includes(s) || (a.dataset.k || '').includes(s);
            a.hidden = !hit;
            if (hit) n++;
          });
          sec.hidden = n === 0;
          shown += n;
        });
        if (none) none.hidden = shown > 0;
      });
    }
  });
})();
