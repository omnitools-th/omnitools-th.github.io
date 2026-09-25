/* กราฟ SVG เบาๆ ไม่พึ่งไลบรารี: area ซ้อน, เส้น, แถบช่วง (band) + เส้นชี้ค่าและ tooltip */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  function niceStep(max, ticks) {
    const raw = max / ticks, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }
  // ตัวเลขแกนแบบไทย: 5 แสน, 1.2 ล้าน
  function axisTH(v) {
    const a = Math.abs(v), f = (x, d) => x.toLocaleString('th-TH', { maximumFractionDigits: d });
    if (a >= 1e6) return f(v / 1e6, 1) + ' ล้าน';
    if (a >= 1e5) return f(v / 1e5, 1) + ' แสน';
    if (a >= 1e4) return f(v / 1e4, 1) + ' หมื่น';
    return f(v, 0);
  }
  const el = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };

  /**
   * opts: {
   *   labels: [x...], xFmt: (x) => text, yFmt: (v) => text (tooltip),
   *   series: [{ name, color: 'var(--s1)', kind: 'area'|'line'|'band', values, lower, upper, dash }],
   *   stacked: true  // area series ซ้อนกันตามลำดับ
   * }
   */
  function render(box, opts) {
    box.__opts = opts;
    box.classList.add('chart');
    box.innerHTML = '';
    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    if (opts.series.length > 1) {
      legend.innerHTML = opts.series.map((s) =>
        `<span><i style="background:${s.color};${s.kind === 'band' ? 'opacity:.35' : ''}${s.dash ? ';height:2px;border-radius:0' : ''}"></i>${s.name}</span>`).join('');
      box.appendChild(legend);
    }
    const W = Math.max(280, box.clientWidth), H = opts.height || (W < 500 ? 240 : 300);
    const M = { l: W < 500 ? 52 : 62, r: 10, t: 10, b: 26 };
    const iw = W - M.l - M.r, ih = H - M.t - M.b, n = opts.labels.length;

    // stacked tops
    const tops = [];
    let acc = new Array(n).fill(0);
    opts.series.forEach((s) => {
      if (s.kind === 'area' && opts.stacked) {
        const base = acc.slice();
        acc = acc.map((a, i) => a + (s.values[i] || 0));
        tops.push({ s, base, top: acc.slice() });
      } else tops.push({ s, base: null, top: s.kind === 'band' ? s.upper : s.values });
    });
    let max = 0, min = 0;
    tops.forEach(({ s, top }) => top.forEach((v, i) => {
      max = Math.max(max, v || 0);
      min = Math.min(min, (s.kind === 'band' ? s.lower[i] : v) || 0);
    }));
    if (max <= 0) max = 1;
    const step = niceStep(max - min, W < 500 ? 4 : 5);
    const yMax = Math.ceil(max / step) * step, yMin = Math.floor(min / step) * step;
    const x = (i) => M.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
    const y = (v) => M.t + ih - ((v - yMin) / (yMax - yMin)) * ih;

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': opts.title || 'กราฟ' });
    // grid + y ticks
    for (let v = yMin; v <= yMax + step / 2; v += step) {
      svg.appendChild(el('line', { x1: M.l, x2: W - M.r, y1: y(v), y2: y(v), class: v === 0 ? 'c-base' : 'c-grid' }));
      const t = el('text', { x: M.l - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'c-tick' });
      t.textContent = axisTH(v);
      svg.appendChild(t);
    }
    // x ticks
    const want = Math.max(2, Math.floor(iw / 70)), every = Math.max(1, Math.ceil((n - 1) / want));
    const xt = [];
    for (let i = 0; i < n; i += every) xt.push(i);
    // ให้จุดสุดท้ายมีป้ายเสมอ ถ้าชิดตัวก่อนหน้าเกินไปให้แทนที่
    if (xt[xt.length - 1] !== n - 1) { if (n - 1 - xt[xt.length - 1] < every * 0.6) xt.pop(); xt.push(n - 1); }
    for (const i of xt) {
      const t = el('text', { x: x(i), y: H - 8, 'text-anchor': 'middle', class: 'c-tick' });
      t.textContent = opts.xFmt ? opts.xFmt(opts.labels[i], i) : opts.labels[i];
      svg.appendChild(t);
    }
    const path = (pts) => pts.map(([a, b], i) => (i ? 'L' : 'M') + a.toFixed(1) + ',' + b.toFixed(1)).join('');
    // marks: bands first, then areas, then lines
    const order = ['band', 'area', 'line'];
    order.forEach((kind) => tops.forEach(({ s, base, top }) => {
      if (s.kind !== kind) return;
      if (kind === 'band') {
        const up = s.upper.map((v, i) => [x(i), y(v)]), lo = s.lower.map((v, i) => [x(i), y(v)]).reverse();
        svg.appendChild(el('path', { d: path(up.concat(lo)) + 'Z', fill: s.color, opacity: 0.18 }));
      } else if (kind === 'area') {
        const b = base || new Array(n).fill(0);
        const up = top.map((v, i) => [x(i), y(v)]), lo = b.map((v, i) => [x(i), y(v)]).reverse();
        svg.appendChild(el('path', { d: path(up.concat(lo)) + 'Z', fill: s.color, opacity: 0.88 }));
        svg.appendChild(el('path', { d: path(up), fill: 'none', stroke: 'var(--surface)', 'stroke-width': 2 }));
      } else {
        svg.appendChild(el('path', {
          d: path(top.map((v, i) => [x(i), y(v)])), fill: 'none', stroke: s.color, 'stroke-width': 2,
          'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...(s.dash ? { 'stroke-dasharray': '5 5' } : {}),
        }));
      }
    }));
    // hover layer
    const cross = el('line', { y1: M.t, y2: M.t + ih, class: 'c-cross', visibility: 'hidden' });
    svg.appendChild(cross);
    const dots = tops.filter(({ s }) => s.kind !== 'band').map(({ s }) => {
      const d = el('circle', { r: 5, fill: s.color, stroke: 'var(--surface)', 'stroke-width': 2, visibility: 'hidden' });
      svg.appendChild(d);
      return d;
    });
    const hit = el('rect', { x: M.l, y: M.t, width: iw, height: ih, fill: 'transparent', style: 'cursor:crosshair;touch-action:pan-y' });
    svg.appendChild(hit);
    const wrap = document.createElement('div');
    wrap.className = 'chart-plot';
    wrap.appendChild(svg);
    const tip = document.createElement('div');
    tip.className = 'chart-tip';
    tip.hidden = true;
    wrap.appendChild(tip);
    box.appendChild(wrap);

    const show = (evt) => {
      const r = svg.getBoundingClientRect(), px = (evt.clientX - r.left) * (W / r.width);
      const i = Math.max(0, Math.min(n - 1, Math.round(((px - M.l) / iw) * (n - 1))));
      const cx = x(i);
      cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('visibility', 'visible');
      let k = 0;
      tops.forEach(({ s, top }) => {
        if (s.kind === 'band') return;
        const d = dots[k++];
        d.setAttribute('cx', cx); d.setAttribute('cy', y(top[i])); d.setAttribute('visibility', 'visible');
      });
      const fmt = opts.yFmt || axisTH;
      const rows = opts.series.map((s) => s.kind === 'band'
        ? `<div><i style="background:${s.color};opacity:.35"></i>${s.name}<b>${fmt(s.lower[i])} – ${fmt(s.upper[i])}</b></div>`
        : `<div><i style="background:${s.color}"></i>${s.name}<b>${fmt(s.values[i])}</b></div>`).join('');
      const extra = opts.tipExtra ? opts.tipExtra(i) : '';
      tip.innerHTML = `<strong>${opts.xFmt ? opts.xFmt(opts.labels[i], i, true) : opts.labels[i]}</strong>${rows}${extra}`;
      tip.hidden = false;
      const tw = tip.offsetWidth, sx = cx * (r.width / W);
      tip.style.left = Math.max(0, Math.min(r.width - tw, sx + 12 + tw > r.width ? sx - tw - 12 : sx + 12)) + 'px';
      tip.style.top = '8px';
    };
    const hide = () => {
      tip.hidden = true; cross.setAttribute('visibility', 'hidden');
      dots.forEach((d) => d.setAttribute('visibility', 'hidden'));
    };
    hit.addEventListener('pointermove', show);
    hit.addEventListener('pointerdown', show);
    hit.addEventListener('pointerleave', hide);

    if (!box.__ro && 'ResizeObserver' in window) {
      let lastW = box.clientWidth;
      box.__ro = new ResizeObserver(() => {
        if (Math.abs(box.clientWidth - lastW) > 4) { lastW = box.clientWidth; render(box, box.__opts); }
      });
      box.__ro.observe(box);
    }
  }

  window.KDChart = { render, axisTH };
})();
