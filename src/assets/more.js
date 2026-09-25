(function () {
  'use strict';
  const { $, num, val, raw, fmt, fmt0, baht, out, esc, rows, big, bind, parseDate, iso, today, thDate, ymd, ymdText, DAY, progressive, tools } = window.KD;

  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const note = (t) => `<p class="note" style="margin:10px 0 0">${t}</p>`;
  const stats = (items) => '<div class="stats">' + items.map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('') + '</div>';

  // ---------------------------------------------------------------- พลังงาน / รถ / บ้าน
  tools['ev-cost'] = () => bind(() => {
    const km = val('km'), kwhPerKm = val('eff') / 100 * 1.1;
    const hp = clamp(val('homePct'), 0, 100) / 100;
    const evKm = kwhPerKm * (val('home') * hp + val('pub') * (1 - hp));
    const iceKm = val('kml') ? val('fuel') / val('kml') : 0;
    const ev = evKm * km, ice = iceKm * km, save = ice - ev;
    out('result',
      big(save >= 0 ? 'ใช้รถ EV ประหยัดกว่าต่อเดือน' : 'รถ EV แพงกว่าต่อเดือน', baht(Math.abs(save))) +
      rows([
        ['ค่าชาร์จ EV ต่อเดือน', baht(ev)],
        ['ค่าน้ำมันต่อเดือน', baht(ice)],
        ['ค่าพลังงาน EV ต่อ กม.', fmt(evKm) + ' บาท'],
        ['ค่าน้ำมันต่อ กม.', fmt(iceKm) + ' บาท'],
        ['ใช้ไฟต่อเดือน', fmt0(kwhPerKm * km) + ' หน่วย'],
        ['ประหยัดต่อปี', baht(save * 12), 'strong'],
        ['ประหยัดใน 5 ปี', baht(save * 60), 'strong'],
      ]));
  });

  tools.solar = () => bind(() => {
    const kw = val('kw'), cost = val('cost'), self = clamp(val('self'), 0, 100) / 100;
    const rate = val('rate'), sell = val('sell');
    const yearKwh = kw * val('sun') * 365;
    if (!yearKwh) return out('result', '');
    let cum = 0, payback = null, total = 0;
    for (let y = 1; y <= 25; y++) {
      const prod = yearKwh * Math.pow(0.995, y - 1);
      const s = prod * self * rate * Math.pow(1.02, y - 1) + prod * (1 - self) * sell;
      if (payback === null && cum + s >= cost) payback = y - 1 + (cost - cum) / s;
      cum += s; total += s;
    }
    const y1 = yearKwh * (self * rate + (1 - self) * sell);
    out('result',
      big('คืนทุนภายใน', payback === null ? 'เกิน 25 ปี' : fmt(payback, 1) + ' ปี') +
      rows([
        ['ผลิตไฟได้', fmt0(yearKwh / 12) + ' หน่วย/เดือน'],
        ['ประหยัดค่าไฟปีแรก', baht(y1 / 12) + '/เดือน'],
        ['ประหยัดปีแรกทั้งปี', baht(y1)],
        ['ประหยัดรวม 25 ปี', baht(total)],
        ['กำไรสุทธิ 25 ปี (หักค่าติดตั้ง)', baht(total - cost), 'strong'],
        ['ผลตอบแทนเฉลี่ยต่อปี', cost ? fmt((total - cost) / cost / 25 * 100, 1) + '%' : '-'],
      ]) + note('สมมติแผงเสื่อมปีละ 0.5% และค่าไฟขึ้นปีละ 2% ยังไม่รวมค่าเปลี่ยนอินเวอร์เตอร์ (มักเปลี่ยนราวปีที่ 10–12)'));
  });

  tools['appliance-power'] = () => bind((e) => {
    if (e && e.target.id === 'preset' && e.target.value) $('#watt').value = e.target.value;
    const kwhDay = val('watt') * Math.max(1, val('qty')) * val('hours') / 1000;
    const rate = val('rate'), d = val('days');
    out('result',
      big('ค่าไฟต่อเดือน', baht(kwhDay * d * rate)) +
      rows([
        ['ใช้ไฟต่อวัน', fmt(kwhDay) + ' หน่วย'],
        ['ค่าไฟต่อชั่วโมง', baht(val('hours') ? kwhDay / val('hours') * rate : 0)],
        ['ค่าไฟต่อวัน', baht(kwhDay * rate)],
        ['ใช้ไฟต่อเดือน', fmt(kwhDay * d, 1) + ' หน่วย'],
        ['ค่าไฟต่อปี', baht(kwhDay * d * 12 * rate), 'strong'],
      ]));
  });

  tools['transfer-fee'] = () => bind(() => {
    const price = val('price'), appr = val('appraise'), loan = val('loan');
    const years = Math.max(0, Math.floor(val('years')));
    const company = $('#seller').value === 'company', promo = $('#promo').checked;
    const base = Math.max(price, appr);
    const transfer = appr * (promo ? 0.0001 : 0.02);
    const mortgage = loan * (promo ? 0.0001 : 0.01);
    const sbtExempt = !company && (years >= 5 || $('#regHouse').checked);
    const sbt = sbtExempt ? 0 : base * 0.033;
    const stamp = sbt ? 0 : base * 0.005;
    let wht;
    if (company) wht = base * 0.01;
    else {
      const y = clamp(years, 1, 10);
      const ded = [0.92, 0.84, 0.77, 0.71, 0.65, 0.60, 0.55, 0.50][Math.min(y, 8) - 1];
      const perYear = appr * (1 - ded) / y;
      const LAND_BR = [[300000, .05], [500000, .10], [750000, .15], [1000000, .20], [2000000, .25], [5000000, .30], [Infinity, .35]];
      wht = Math.min(progressive(perYear, LAND_BR) * y, price * 0.2);
    }
    const split = $('#split').value;
    const tBuyer = split === 'buyer' ? transfer : split === 'half' ? transfer / 2 : 0;
    const tSeller = transfer - tBuyer;
    const buyer = tBuyer + mortgage, seller = tSeller + sbt + stamp + wht;
    out('result',
      big('ค่าใช้จ่ายวันโอนรวม', baht(buyer + seller)) +
      rows([
        [`ค่าธรรมเนียมการโอน (${promo ? '0.01' : '2'}%)`, baht(transfer)],
        [`ค่าจดจำนอง (${promo ? '0.01' : '1'}%)`, baht(mortgage)],
        ['ภาษีธุรกิจเฉพาะ 3.3%', sbt ? baht(sbt) : 'ได้รับยกเว้น'],
        ['อากรแสตมป์ 0.5%', stamp ? baht(stamp) : 'ไม่ต้องเสีย (เสียภาษีธุรกิจเฉพาะแล้ว)'],
        ['ภาษีเงินได้หัก ณ ที่จ่าย', baht(wht)],
        ['ผู้ซื้อจ่าย', baht(buyer), 'strong'],
        ['ผู้ขายจ่าย', baht(seller), 'strong'],
      ]));
  });

  tools['car-tax'] = () => bind(() => {
    const cc = Math.max(0, val('cc')), age = val('age');
    const t = Math.min(cc, 600) * 0.5 + clamp(cc - 600, 0, 1200) * 1.5 + Math.max(0, cc - 1800) * 4;
    const disc = age >= 10 ? 0.5 : age >= 9 ? 0.4 : age >= 8 ? 0.3 : age >= 7 ? 0.2 : age >= 6 ? 0.1 : 0;
    out('result',
      big('ภาษีรถยนต์ที่ต้องจ่าย', baht(t * (1 - disc))) +
      rows([
        ['ภาษีเต็ม', baht(t)],
        ['ส่วนลดตามอายุรถ', disc ? `${disc * 100}% (−${fmt(t * disc)} บาท)` : 'ยังไม่ได้ส่วนลด (อายุรถต่ำกว่า 6 ปี)'],
      ]) + note('ยังไม่รวมค่า พ.ร.บ. (รถเก๋งประมาณ 645 บาท/ปี) และค่าตรวจสภาพรถสำหรับรถอายุเกิน 7 ปี'));
  });

  tools.land = () => bind(() => {
    const sqmIn = raw('sqm');
    const wa = Number.isFinite(sqmIn) && sqmIn > 0 ? sqmIn / 4 : val('rai') * 400 + val('ngan') * 100 + val('wa');
    if (!wa) return out('result', '');
    const sqm = wa * 4, r = Math.floor(wa / 400), n = Math.floor((wa - r * 400) / 100), w = wa - r * 400 - n * 100;
    const items = [
      ['ตารางวารวม', fmt(wa) + ' ตร.วา'],
      ['ตารางเมตร', fmt(sqm) + ' ตร.ม.'],
      ['ไร่ (ทศนิยม)', fmt(wa / 400, 4) + ' ไร่'],
      ['เอเคอร์', fmt(sqm / 4046.8564, 4)],
      ['เฮกตาร์', fmt(sqm / 10000, 4)],
      ['ตารางฟุต', fmt0(sqm * 10.7639)],
    ];
    const ppw = raw('ppw'), ppr = raw('ppr');
    if (Number.isFinite(ppw) && ppw > 0) items.push(['ราคาที่ดินรวม', baht(ppw * wa), 'strong'], ['คิดเป็นราคาต่อไร่', baht(ppw * 400)]);
    else if (Number.isFinite(ppr) && ppr > 0) items.push(['ราคาที่ดินรวม', baht(ppr * wa / 400), 'strong'], ['คิดเป็นราคาต่อตารางวา', baht(ppr / 400)]);
    out('result', big('ขนาดที่ดิน (ไร่-งาน-ตารางวา)', `${fmt0(r)}-${n}-${fmt(w, w % 1 ? 1 : 0)}`) + rows(items));
  });

  // ---------------------------------------------------------------- เงิน
  tools['seller-tax'] = () => bind(() => {
    const sales = val('sales'), salary = val('salary');
    const exp = $('#method').value === 'flat' ? sales * 0.6 : Math.min(val('actual'), sales);
    const net = Math.max(0, sales - exp + salary - Math.min(salary * 0.5, 100000) - 60000 - val('allow'));
    const t1 = progressive(net);
    let t2 = sales >= 120000 ? sales * 0.005 : 0;
    if (t2 <= 5000) t2 = 0;
    const tax = Math.max(t1, t2);
    out('result',
      big('ภาษีที่ต้องจ่ายทั้งปี (ประมาณ)', baht(tax)) +
      rows([
        ['ยอดขายทั้งปี', baht(sales)],
        ['หักค่าใช้จ่าย', baht(exp)],
        ['เงินได้สุทธิ (หลังค่าลดหย่อน)', baht(net)],
        ['วิธีที่ 1: อัตราขั้นบันได', baht(t1)],
        ['วิธีที่ 2: 0.5% ของรายรับ', t2 ? baht(t2) : 'ได้รับยกเว้น (ไม่เกิน 5,000 บาท)'],
        ['อัตราภาษีเทียบยอดขาย', sales ? fmt(tax / sales * 100) + '%' : '-', 'strong'],
      ]) +
      (sales > 1800000 ? '<p class="warn" style="margin:10px 0 0"><b>ยอดขายเกิน 1.8 ล้านบาท</b> ต้องจดทะเบียน VAT ภายใน 30 วันนับจากวันที่ยอดเกิน</p>' : ''));
  });

  function crc16(s) {
    let crc = 0xFFFF;
    for (let i = 0; i < s.length; i++) {
      crc ^= s.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) crc = ((crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1) & 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v;
  function promptpayPayload(id, amount) {
    let sub;
    if (id.length === 15) sub = tlv('03', id);
    else if (id.length === 13) sub = tlv('02', id);
    else sub = tlv('01', ('0000000000000' + id.replace(/^0/, '66')).slice(-13));
    let p = tlv('00', '01') + tlv('01', amount ? '12' : '11') +
      tlv('29', tlv('00', 'A000000677010111') + sub) + tlv('58', 'TH') + tlv('53', '764');
    if (amount) p += tlv('54', amount.toFixed(2));
    p += '6304';
    return p + crc16(p);
  }
  tools['promptpay-qr'] = () => {
    try { const s = localStorage.getItem('kd-pp'); if (s) $('#ppid').value = s; } catch (e) { /* ไม่มี storage ก็ได้ */ }
    bind(() => {
      const id = $('#ppid').value.replace(/\D/g, '');
      try { localStorage.setItem('kd-pp', id); } catch (e) { /* ignore */ }
      if (!id) return out('result', '<p class="note">กรอกเบอร์โทรหรือเลขบัตรประชาชนเพื่อสร้าง QR</p>');
      if (!(id.length === 10 && id[0] === '0') && id.length !== 13 && id.length !== 15)
        return out('result', '<p class="warn">เบอร์มือถือต้องมี 10 หลัก เลขบัตรประชาชน/ผู้เสียภาษี 13 หลัก หรือ e-Wallet 15 หลัก</p>');
      if (typeof qrcode !== 'function') return out('result', '<p class="warn">โหลดตัวสร้าง QR ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วรีเฟรช</p>');
      const amt = raw('amount');
      const amount = Number.isFinite(amt) && amt > 0 ? Math.round(amt * 100) / 100 : 0;
      const qr = qrcode(0, 'M');
      qr.addData(promptpayPayload(id, amount));
      qr.make();
      const n = qr.getModuleCount(), cell = Math.floor(440 / n), size = n * cell;
      const W = size + 80, H = size + 190;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const g = c.getContext('2d');
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#0b3b63'; g.fillRect(0, 0, W, 64);
      g.fillStyle = '#ffffff'; g.font = '600 26px "IBM Plex Sans Thai", sans-serif'; g.textAlign = 'center';
      g.fillText('สแกนจ่ายด้วยแอปธนาคาร', W / 2, 42);
      g.fillStyle = '#000000';
      for (let r = 0; r < n; r++) for (let q = 0; q < n; q++) if (qr.isDark(r, q)) g.fillRect(40 + q * cell, 88 + r * cell, cell, cell);
      g.fillStyle = '#1c1c1a';
      g.font = '600 30px "IBM Plex Sans Thai", sans-serif';
      g.fillText(amount ? fmt(amount) + ' บาท' : 'ระบุจำนวนเงินในแอป', W / 2, size + 128);
      const label = $('#label').value.trim();
      const masked = id.length === 10 ? id.replace(/^(\d{3})(\d{3})(\d{4})$/, 'xxx-xxx-$3') : 'x'.repeat(id.length - 4) + id.slice(-4);
      g.font = '400 22px "IBM Plex Sans Thai", sans-serif'; g.fillStyle = '#5e5d58';
      g.fillText(label ? `${label} · ${masked}` : `พร้อมเพย์ ${masked}`, W / 2, size + 166);
      const url = c.toDataURL('image/png');
      out('result', `<div class="qr-out"><img src="${url}" alt="QR Code พร้อมเพย์" width="${W}" height="${H}">` +
        `<a class="btn" href="${url}" download="promptpay-qr.png">ดาวน์โหลด QR (PNG)</a></div>`);
    });
  };

  tools.gold = () => bind(() => {
    const gpb = $('#type').value === 'bar' ? 15.244 : 15.16;
    const w = val('w'), u = $('#unit').value;
    const wb = u === 'baht' ? w : u === 'salung' ? w / 4 : w / gpb;
    const price = val('price'), fee = val('fee');
    out('result',
      big('ราคารวม', baht(price * wb + fee)) +
      rows([
        ['น้ำหนัก (บาททอง)', fmt(wb, 4) + ' บาท'],
        ['น้ำหนัก (สลึง)', fmt(wb * 4, 2) + ' สลึง'],
        ['น้ำหนัก (กรัม)', fmt(wb * gpb, 3) + ' กรัม'],
        ['ค่าเนื้อทอง', baht(price * wb)],
        ['ค่ากำเหน็จ', baht(fee)],
        ['ราคาเนื้อทองต่อกรัม', baht(price / gpb), 'strong'],
      ]));
  });

  // ---------------------------------------------------------------- งาน / เกษียณ
  tools.severance = () => {
    $('#end').value = iso(today());
    bind(() => {
      const s = parseDate($('#start').value), e = parseDate($('#end').value);
      if (!s || !e || e < s) return out('result', '<p class="warn">กรุณาเลือกวันเริ่มงานและวันที่ถูกเลิกจ้างให้ถูกต้อง</p>');
      const worked = Math.round((e - s) / DAY) + 1;
      const span = ymd(s, new Date(e.getTime() + DAY));
      const y = span.y;
      const days = worked < 120 ? 0 : y < 1 ? 30 : y < 3 ? 90 : y < 6 ? 180 : y < 10 ? 240 : y < 20 ? 300 : 400;
      const wage = val('wage'), daily = wage / 30;
      const comp = days * daily, notice = $('#notice').checked ? wage : 0, leave = val('leave') * daily;
      out('result',
        big('รวมเงินที่ควรได้รับ', baht(comp + notice + leave)) +
        rows([
          ['อายุงาน', ymdText(span) + ` (${fmt0(worked)} วัน)`],
          ['ค่าจ้างต่อวัน', baht(daily)],
          ['ค่าชดเชยตามกฎหมาย', `${days} วัน = ${baht(comp)}`, 'strong'],
          ['ค่าบอกกล่าวล่วงหน้า (ค่าตกใจ)', baht(notice)],
          ['ค่าจ้างวันลาพักร้อนที่เหลือ', baht(leave)],
        ]));
    });
  };

  tools.ot = () => bind(() => {
    const month = $('#type').value === 'month';
    const hourly = (month ? val('wage') / 30 : val('wage')) / Math.max(1, val('hpd'));
    const a = val('h15') * hourly * 1.5, b = val('hHol') * hourly * (month ? 1 : 2), c = val('h3') * hourly * 3;
    out('result',
      big('ค่าล่วงเวลารวม', baht(a + b + c)) +
      rows([
        ['ค่าจ้างต่อชั่วโมง', baht(hourly)],
        ['OT วันทำงาน (1.5 เท่า)', `${fmt(hourly * 1.5)} × ${fmt(val('h15'), 1)} ชม. = ${baht(a)}`],
        [`ทำงานวันหยุด (${month ? 1 : 2} เท่า)`, baht(b)],
        ['OT วันหยุด (3 เท่า)', baht(c)],
      ]) + (val('h15') + val('hHol') + val('h3') > 36 ? '<p class="warn" style="margin:10px 0 0">ถ้าเป็นชั่วโมงในสัปดาห์เดียว กฎหมายกำหนดรวมไม่เกิน 36 ชั่วโมงต่อสัปดาห์</p>' : ''));
  });

  tools['sso-pension'] = () => bind(() => {
    const m = Math.floor(val('months')), w = val('wage'), years = Math.max(0, val('life') - val('age'));
    if (m >= 180) {
      const pct = 20 + 1.5 * Math.floor((m - 180) / 12), p = w * pct / 100;
      out('result',
        big('บำนาญชราภาพ (รายเดือน ตลอดชีวิต)', baht(p)) +
        rows([
          ['อัตราบำนาญ', fmt(pct, 1) + '% ของค่าจ้างเฉลี่ย'],
          ['ต่อปี', baht(p * 12)],
          [`รวมถ้ารับ ${fmt0(years)} ปี`, baht(p * 12 * years), 'strong'],
          ['ส่งต่ออีก 12 เดือน บำนาญเพิ่ม', baht(w * 0.015) + '/เดือน'],
        ]));
    } else {
      const own = w * 0.03 * m, both = m >= 12 ? own * 2 : own;
      out('result',
        big('บำเหน็จชราภาพ (ก้อนเดียว ประมาณ)', baht(both)) +
        rows([
          ['เงินสมทบชราภาพส่วนของคุณ (3%)', baht(own)],
          ['ส่วนของนายจ้าง', m >= 12 ? baht(own) : 'ไม่ได้ (ส่งไม่ถึง 12 เดือน)'],
          ['ต้องส่งอีกกี่เดือนถึงได้บำนาญ', fmt0(180 - m) + ' เดือน', 'strong'],
          ['บำนาญถ้าส่งครบ 180 เดือน', baht(w * 0.2) + '/เดือน'],
        ]) + note('ยังไม่รวมผลตอบแทนที่กองทุนประกาศในแต่ละปี ยอดจริงจึงมักสูงกว่านี้เล็กน้อย'));
    }
  });

  tools.retirement = () => bind(() => {
    const age = val('age'), ret = val('retire'), until = val('until');
    const inf = val('inf') / 100, r1 = val('ret1') / 100, r2 = val('ret2') / 100;
    const yTo = Math.max(0, ret - age), yIn = Math.max(1, until - ret);
    const spendRet = val('spend') * 12 * Math.pow(1 + inf, yTo), pension = val('pension') * 12;
    let need = 0;
    for (let k = 0; k < yIn; k++) need += Math.max(0, spendRet * Math.pow(1 + inf, k) - pension) / Math.pow(1 + r2, k);
    const pmt = (years, have) => {
      const gap = Math.max(0, need - have * Math.pow(1 + r1, years)), n = years * 12, r = r1 / 12;
      if (!gap) return 0;
      if (!n) return Infinity;
      return r ? gap * r / (Math.pow(1 + r, n) - 1) : gap / n;
    };
    const have = val('have'), now = pmt(yTo, have), late = yTo > 5 ? pmt(yTo - 5, have) : null;
    out('result',
      big('ต้องออม/ลงทุนเพิ่มเดือนละ', now === Infinity ? 'เกษียณแล้ว' : baht(now)) +
      rows([
        ['เงินที่ต้องมีวันเกษียณ', baht(need), 'strong'],
        [`ค่าใช้จ่ายต่อเดือนตอนอายุ ${ret} (รวมเงินเฟ้อ)`, baht(spendRet / 12)],
        ['เงินที่มีอยู่จะโตเป็น', baht(have * Math.pow(1 + r1, yTo))],
        ['ระยะเวลาออม', fmt0(yTo) + ' ปี'],
        ...(late !== null ? [['ถ้าเริ่มช้าไป 5 ปี ต้องออมเดือนละ', baht(late)]] : []),
      ]) + note('ตัวเลขนี้เป็นการประมาณจากสมมติฐานที่คุณกรอก ไม่ใช่คำแนะนำการลงทุน'));
  });

  // ---------------------------------------------------------------- สุขภาพ / สิ่งแวดล้อม
  function aqiCalc(c, bps) {
    for (const [cl, ch, il, ih] of bps) if (c >= cl && c <= ch) return Math.round((ih - il) / (ch - cl) * (c - cl) + il);
    return null;
  }
  tools.aqi = () => bind(() => {
    const c = Math.floor(val('pm') * 10) / 10;
    const TH = [[0, 15, 0, 25], [15.1, 25, 26, 50], [25.1, 37.5, 51, 100], [37.6, 75, 101, 200]];
    const THL = [
      [25, 'ดีมาก', '#3bb3e0', 'เหมาะกับกิจกรรมกลางแจ้งและการท่องเที่ยว'],
      [50, 'ดี', '#5bb450', 'ทำกิจกรรมกลางแจ้งได้ตามปกติ'],
      [100, 'ปานกลาง', '#e0c200', 'กลุ่มเสี่ยงควรสังเกตอาการ เช่น ไอ หายใจลำบาก'],
      [200, 'เริ่มมีผลกระทบต่อสุขภาพ', '#f08c1a', 'ควรลดกิจกรรมกลางแจ้ง ใส่หน้ากาก N95 เมื่ออยู่นอกอาคาร'],
      [Infinity, 'มีผลกระทบต่อสุขภาพ', '#e04646', 'ทุกคนควรงดกิจกรรมกลางแจ้ง ใส่หน้ากาก N95 และอยู่ในห้องที่มีเครื่องฟอกอากาศ'],
    ];
    const US = [[0, 9, 0, 50], [9.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 125.4, 151, 200], [125.5, 225.4, 201, 300], [225.5, 325.4, 301, 500]];
    const USL = [[50, 'Good', '#5bb450'], [100, 'Moderate', '#e0c200'], [150, 'Unhealthy for Sensitive Groups', '#f08c1a'],
      [200, 'Unhealthy', '#e04646'], [300, 'Very Unhealthy', '#8f3f97'], [Infinity, 'Hazardous', '#7e0023']];
    const th = c > 75 ? null : aqiCalc(c, TH), thv = th === null ? 201 : th;
    const us = c > 325.4 ? 500 : aqiCalc(c, US);
    const tl = THL.find(([m]) => thv <= m), ul = USL.find(([m]) => us <= m);
    out('result',
      `<div class="aqi-pair"><div class="aqi-card" style="--c:${tl[2]}"><span>AQI ประเทศไทย</span><b>${th === null ? '200+' : th}</b><em>${tl[1]}</em></div>` +
      `<div class="aqi-card" style="--c:${ul[2]}"><span>US AQI</span><b>${us}${c > 325.4 ? '+' : ''}</b><em>${ul[1]}</em></div></div>` +
      rows([['คำแนะนำ (เกณฑ์ไทย)', tl[3]]]));
  });

  tools['heat-index'] = () => bind(() => {
    const tc = val('t'), rh = clamp(val('rh'), 0, 100), T = tc * 9 / 5 + 32;
    let hi = 0.5 * (T + 61 + (T - 68) * 1.2 + rh * 0.094);
    if ((hi + T) / 2 >= 80) {
      hi = -42.379 + 2.04901523 * T + 10.14333127 * rh - 0.22475541 * T * rh - 0.00683783 * T * T - 0.05481717 * rh * rh +
        0.00122874 * T * T * rh + 0.00085282 * T * rh * rh - 0.00000199 * T * T * rh * rh;
      if (rh < 13 && T >= 80 && T <= 112) hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
      if (rh > 85 && T >= 80 && T <= 87) hi += ((rh - 85) / 10) * ((87 - T) / 5);
    }
    const hc = (hi - 32) * 5 / 9;
    const L = [[27, 'ปกติ', '#5bb450', 'ทำกิจกรรมได้ตามปกติ ดื่มน้ำให้เพียงพอ'],
      [32, 'เฝ้าระวัง', '#e0c200', 'อาจอ่อนเพลียถ้าอยู่กลางแดดนาน ควรพักในที่ร่มเป็นระยะ'],
      [41, 'เตือนภัย', '#f08c1a', 'เสี่ยงตะคริวแดดและเพลียแดด หลีกเลี่ยงงานหนักกลางแจ้งช่วงบ่าย'],
      [54, 'อันตราย', '#e04646', 'เสี่ยงฮีทสโตรก งดกิจกรรมกลางแจ้ง ดื่มน้ำบ่อยๆ ดูแลเด็กและผู้สูงอายุใกล้ชิด'],
      [Infinity, 'อันตรายมาก', '#8f3f97', 'ฮีทสโตรกเกิดได้ทันที อยู่ในที่เย็น หากมีอาการผิดปกติโทร 1669']];
    const l = L.find(([m]) => hc < m);
    out('result',
      `<div class="aqi-pair"><div class="aqi-card" style="--c:${l[2]}"><span>รู้สึกร้อนเหมือน</span><b>${fmt(hc, 1)}°C</b><em>${l[1]}</em></div></div>` +
      rows([['อุณหภูมิจริง', fmt(tc, 1) + '°C'], ['ร้อนกว่าที่วัดได้', fmt(hc - tc, 1) + '°C'], ['คำแนะนำ', l[3]]]));
  });

  tools.calories = () => bind(() => {
    const w = val('weight'), h = val('height'), a = val('age'), male = $('#sex').value === 'm';
    if (!w || !h || !a) return out('result', '');
    const bmr = 10 * w + 6.25 * h - 5 * a + (male ? 5 : -161), tdee = bmr * parseFloat($('#act').value);
    const floor = male ? 1500 : 1200;
    out('result',
      big('พลังงานที่ใช้ต่อวัน (TDEE)', fmt0(tdee) + ' kcal') +
      stats([
        ['ลดน้ำหนัก ~0.5 กก./สัปดาห์', fmt0(Math.max(floor, tdee - 500))],
        ['ลดน้ำหนักแบบเบาๆ', fmt0(Math.max(floor, tdee - 250))],
        ['คงน้ำหนัก', fmt0(tdee)],
        ['เพิ่มกล้ามเนื้อ', fmt0(tdee + 300)],
      ]) +
      rows([
        ['BMR (ใช้ขณะพัก)', fmt0(bmr) + ' kcal'],
        ['โปรตีนแนะนำ (ทั่วไป)', `${fmt0(w * 0.8)}–${fmt0(w)} กรัม/วัน`],
        ['โปรตีนแนะนำ (สร้างกล้ามเนื้อ)', `${fmt0(w * 1.6)}–${fmt0(w * 2)} กรัม/วัน`],
      ]));
  });

  tools['due-date'] = () => {
    if (!$('#lmp').value) $('#lmp').value = iso(new Date(today().getTime() - 70 * DAY));
    bind(() => {
      const lmp = parseDate($('#lmp').value);
      if (!lmp) return out('result', '');
      const adj = new Date(lmp.getTime() + (val('cycle') - 28) * DAY);
      const at = (d) => new Date(adj.getTime() + d * DAY);
      const edd = at(280), ga = Math.round((today() - adj) / DAY);
      const wk = Math.floor(ga / 7), dd = ga % 7;
      const tri = ga < 0 ? '-' : wk < 14 ? 'ไตรมาสที่ 1' : wk < 28 ? 'ไตรมาสที่ 2' : 'ไตรมาสที่ 3';
      const pct = clamp(ga / 280 * 100, 0, 100);
      out('result',
        big('กำหนดคลอดโดยประมาณ', thDate(edd)) +
        (ga >= 0 && ga <= 300 ? `<div class="progress"><span style="width:${pct}%"></span></div>` +
          `<p style="margin:6px 0 0">อายุครรภ์วันนี้ <b>${wk} สัปดาห์ ${dd} วัน</b> · ${tri} · อีก ${fmt0(Math.max(0, 280 - ga))} วันถึงกำหนดคลอด</p>` : '') +
        rows([
          ['ตรวจอัลตราซาวด์คัดกรอง (11–13 สัปดาห์)', `${thDate(at(77))}`],
          ['อัลตราซาวด์ดูอวัยวะทารก (18–22 สัปดาห์)', `${thDate(at(126))}`],
          ['ตรวจเบาหวานขณะตั้งครรภ์ (24–28 สัปดาห์)', `${thDate(at(168))}`],
          ['ครบกำหนด (37 สัปดาห์)', thDate(at(259)), 'strong'],
          ['เกินกำหนด (42 สัปดาห์)', thDate(at(294))],
        ]));
    });
  };

  // ---------------------------------------------------------------- ข้อความ / เครื่องมือ
  const EN = '`1234567890-=qwertyuiop[]\\asdfghjkl;\'zxcvbnm,./~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:"ZXCVBNM<>?';
  const TH = ['_', 'ๅ', '/', '-', 'ภ', 'ถ', 'ุ', 'ึ', 'ค', 'ต', 'จ', 'ข', 'ช',
    'ๆ', 'ไ', 'ำ', 'พ', 'ะ', 'ั', 'ี', 'ร', 'น', 'ย', 'บ', 'ล', 'ฃ',
    'ฟ', 'ห', 'ก', 'ด', 'เ', '้', '่', 'า', 'ส', 'ว', 'ง',
    'ผ', 'ป', 'แ', 'อ', 'ิ', 'ื', 'ท', 'ม', 'ใ', 'ฝ',
    '%', '+', '๑', '๒', '๓', '๔', 'ู', '฿', '๕', '๖', '๗', '๘', '๙',
    '๐', '"', 'ฎ', 'ฑ', 'ธ', 'ํ', '๊', 'ณ', 'ฯ', 'ญ', 'ฐ', ',', 'ฅ',
    'ฤ', 'ฆ', 'ฏ', 'โ', 'ฌ', '็', '๋', 'ษ', 'ศ', 'ซ', '.',
    '(', ')', 'ฉ', 'ฮ', 'ฺ', '์', '?', 'ฒ', 'ฬ', 'ฦ'];
  const toTh = {}, toEn = {};
  [...EN].forEach((ch, i) => { toTh[ch] = TH[i]; if (/[฀-๿]/.test(TH[i])) toEn[TH[i]] = ch; });
  tools['keyboard-fix'] = () => bind(() => {
    const s = $('#src').value;
    if (!s.trim()) return out('result', '');
    let dir = $('#dir').value;
    if (dir === 'auto') {
      const th = (s.match(/[฀-๿]/g) || []).length, en = (s.match(/[A-Za-z]/g) || []).length;
      dir = th > en ? 'toEn' : 'toTh';
    }
    const map = dir === 'toTh' ? toTh : toEn;
    const r = [...s].map((ch) => map[ch] || ch).join('');
    out('result', big(dir === 'toTh' ? 'แปลงเป็นภาษาไทย' : 'แปลงเป็นภาษาอังกฤษ', esc(r).replace(/\n/g, '<br>')) +
      `<p style="margin:12px 0 0"><button type="button" class="btn" data-copy="${esc(r)}">คัดลอกข้อความ</button></p>`);
  });

  tools['thai-count'] = () => bind(() => {
    const s = $('#txt').value;
    const cps = [...s];
    const seg = (g) => (typeof Intl !== 'undefined' && Intl.Segmenter) ? [...new Intl.Segmenter('th', { granularity: g }).segment(s)] : null;
    const gs = seg('grapheme'), ws = seg('word');
    const words = ws ? ws.filter((x) => x.isWordLike).length : s.split(/\s+/).filter(Boolean).length;
    const visible = gs ? gs.length : cps.length;
    const thai = (s.match(/[฀-๿]/g) || []).length;
    const noSpace = cps.filter((c) => !/\s/.test(c)).length;
    const lines = s ? s.split('\n').length : 0;
    const bytes = new TextEncoder().encode(s).length;
    const uni = /[^\x00-\x7F]/.test(s);
    const sms = !cps.length ? 0 : uni ? (cps.length <= 70 ? 1 : Math.ceil(cps.length / 67)) : (cps.length <= 160 ? 1 : Math.ceil(cps.length / 153));
    const xw = cps.reduce((n, c) => n + (c.codePointAt(0) <= 0x10FF ? (/[฀-๿]/.test(c) ? 2 : 1) : 2), 0);
    out('result', stats([
      ['ตัวอักษรทั้งหมด', fmt0(cps.length)],
      ['ตัวอักษรที่มองเห็น', fmt0(visible)],
      ['ไม่นับช่องว่าง', fmt0(noSpace)],
      ['จำนวนคำ', fmt0(words)],
      ['ตัวอักษรไทย', fmt0(thai)],
      ['บรรทัด', fmt0(lines)],
      ['จำนวน SMS', fmt0(sms)],
      ['น้ำหนักบน X (จาก 280)', fmt0(xw)],
      ['ขนาด (UTF-8)', fmt0(bytes) + ' ไบต์'],
    ]));
  });

  tools['random-wheel'] = () => {
    const cv = $('#wheel'), g = cv.getContext('2d'), ta = $('#names');
    const COLORS = ['#0d6b5f', '#e0a526', '#d2553f', '#3d6fb6', '#7a5cc2', '#3fa86b', '#e07a3c', '#2f8fa3', '#b8457a', '#6b7d2a'];
    let rot = 0, spinning = false;
    try { const s = localStorage.getItem('kd-wheel'); if (s) ta.value = s; } catch (e) { /* ignore */ }
    const names = () => ta.value.split('\n').map((x) => x.trim()).filter(Boolean);
    const draw = () => {
      const list = names(), n = list.length, R = cv.width / 2;
      g.clearRect(0, 0, cv.width, cv.height);
      if (!n) return;
      const seg = Math.PI * 2 / n;
      list.forEach((name, i) => {
        const a0 = rot + i * seg;
        g.beginPath(); g.moveTo(R, R); g.arc(R, R, R - 4, a0, a0 + seg); g.closePath();
        // ชิ้นสุดท้ายห้ามสีซ้ำกับชิ้นแรกที่อยู่ติดกัน
        g.fillStyle = (i === n - 1 && n > 1 && i % COLORS.length === 0) ? COLORS[3] : COLORS[i % COLORS.length];
        g.fill();
        g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.stroke();
        g.save(); g.translate(R, R); g.rotate(a0 + seg / 2);
        g.fillStyle = '#ffffff'; g.textAlign = 'right'; g.textBaseline = 'middle';
        const fs = clamp(Math.floor(seg * R * 0.45), 11, 26);
        g.font = `500 ${fs}px "IBM Plex Sans Thai", sans-serif`;
        const label = name.length > 22 ? name.slice(0, 21) + '…' : name;
        g.fillText(label, R - 20, 0);
        g.restore();
      });
      g.beginPath(); g.arc(R, R, 34, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill();
      g.strokeStyle = '#dddbd3'; g.lineWidth = 3; g.stroke();
    };
    const rand = () => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; };
    const spin = () => {
      const list = names();
      if (spinning || list.length < 2) { if (list.length < 2) out('result', '<p class="warn">ใส่อย่างน้อย 2 ชื่อ</p>'); return; }
      spinning = true; out('result', '');
      const n = list.length, seg = Math.PI * 2 / n, win = Math.floor(rand() * n);
      const target = Math.PI * 1.5 - (win + 0.15 + rand() * 0.7) * seg;
      const TAU = Math.PI * 2, start = rot;
      const delta = ((target - start) % TAU + TAU) % TAU + TAU * (6 + Math.floor(rand() * 3));
      const dur = 4800, t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        rot = start + delta * (1 - Math.pow(1 - p, 4));
        draw();
        if (p < 1) return requestAnimationFrame(step);
        rot %= TAU; spinning = false;
        out('result', big('ผลการสุ่ม', esc(list[win])));
        if ($('#removeWin').checked) {
          const rest = list.slice(); rest.splice(win, 1); ta.value = rest.join('\n'); save();
          setTimeout(draw, 900);
        }
      };
      requestAnimationFrame(step);
    };
    const save = () => { try { localStorage.setItem('kd-wheel', ta.value); } catch (e) { /* ignore */ } };
    $('#spin').addEventListener('click', spin);
    cv.addEventListener('click', spin);
    $('#shuffle').addEventListener('click', () => {
      const l = names();
      for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
      ta.value = l.join('\n'); save(); draw();
    });
    bind(() => { save(); if (!spinning) draw(); });
    if (document.fonts) document.fonts.ready.then(draw);
  };
})();
