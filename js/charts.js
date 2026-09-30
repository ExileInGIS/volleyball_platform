/* =========================================================
 * charts.js — 轻量原生 SVG 图表库（无外部依赖）
 * sparkline / lineChart / multiLine / barChart / donut
 * ========================================================= */
(function () {
  const VBM = window.VBM;
  const NS = 'http://www.w3.org/2000/svg';
  const PAL = ['#722F86', '#B07FD0', '#3E79C9', '#2E9E6B', '#D9922B'];
  function el(name, attrs) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function path(data, w, h, pad, min, max) {
    min = min === undefined ? Math.min(...data) : min;
    max = max === undefined ? Math.max(...data) : max;
    if (max === min) max = min + 1;
    const dx = (w - pad * 2) / (data.length - 1);
    return data.map((v, i) => {
      const x = pad + i * dx;
      const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
      return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ');
  }

  /* 迷你趋势图 */
  function sparkline(data, opts = {}) {
    const w = opts.w || 96, h = opts.h || 30, p = 3;
    const svg = el('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}` });
    const min = Math.min(...data) - 1, max = Math.max(...data) + 1;
    const d = path(data, w, h, p, min, max);
    if (opts.area !== false) {
      const dx = (w - p * 2) / (data.length - 1);
      const area = d + ` L ${(p + (data.length - 1) * dx).toFixed(1)} ${h - p} L ${p} ${h - p} Z`;
      svg.appendChild(el('path', { d: area, fill: opts.fill || 'rgba(114,47,134,.12)', stroke: 'none' }));
    }
    svg.appendChild(el('path', { d, fill: 'none', stroke: opts.color || '#722F86', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    const dx = (w - p * 2) / (data.length - 1);
    const x = p + (data.length - 1) * dx;
    const y = h - p - ((data[data.length - 1] - min) / (max - min)) * (h - p * 2);
    svg.appendChild(el('circle', { cx: x, cy: y, r: 2.8, fill: opts.color || '#722F86' }));
    return svg;
  }

  /* 折线图 */
  function lineChart(data, labels, opts = {}) {
    const w = opts.w || 560, h = opts.h || 250, pl = 38, pr = 16, pt = 18, pb = 30;
    const color = opts.color || PAL[0];
    const unit = opts.unit || '';
    const iw = w - pl - pr, ih = h - pt - pb;
    const min = (opts.min !== undefined ? opts.min : Math.min(...data) - 6);
    const max = (opts.max !== undefined ? opts.max : Math.max(...data) + 6);
    const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, width: '100%', class: 'svg-line' });
    for (let i = 0; i <= 4; i++) {
      const y = pt + (ih / 4) * i;
      svg.appendChild(el('line', { x1: pl, x2: w - pr, y1: y, y2: y, stroke: '#EEEAF2', 'stroke-width': 1 }));
      const val = Math.round(max - ((max - min) / 4) * i);
      const t = el('text', { x: pl - 8, y: y + 4, 'text-anchor': 'end', 'font-size': 10.5, fill: '#9AA0AF' });
      t.textContent = val;
      svg.appendChild(t);
    }
    const dx = iw / (data.length - 1);
    const py = v => pt + ih - ((v - min) / (max - min)) * ih;
    let d = `M ${pl} ${py(data[0])}`;
    data.forEach((v, i) => { if (i) d += ` L ${pl + dx * i} ${py(v)}`; });
    svg.appendChild(el('path', { d: d + ` L ${pl + dx * (data.length - 1)} ${pt + ih} L ${pl} ${pt + ih} Z`, fill: opts.fill || 'rgba(114,47,134,.08)' }));
    svg.appendChild(el('path', { d, fill: 'none', stroke: color, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    data.forEach((v, i) => {
      const x = pl + dx * i, y = py(v);
      svg.appendChild(el('circle', { cx: x, cy: y, r: 3.6, fill: '#fff', stroke: color, 'stroke-width': 2.4 }));
      const t = el('text', { x, y: h - 9, 'text-anchor': 'middle', 'font-size': 11.5, fill: '#8A90A2' });
      t.textContent = labels[i];
      svg.appendChild(t);
    });
    const wrap = document.createElement('div');
    wrap.style.position = 'relative';
    wrap.appendChild(svg);
    const tip = document.createElement('div');
    Object.assign(tip.style, {
      position: 'absolute', pointerEvents: 'none', background: '#2B2338', color: '#fff',
      fontSize: '12px', padding: '5px 10px', borderRadius: '8px', opacity: 0, transform: 'translate(-50%,-120%)', whiteSpace: 'nowrap'
    });
    wrap.appendChild(tip);
    svg.style.cursor = 'crosshair';
    svg.addEventListener('mousemove', e => {
      const rect = svg.getBoundingClientRect();
      const rel = ((e.clientX - rect.left) / rect.width) * w;
      let i = Math.round((rel - pl) / dx);
      i = Math.max(0, Math.min(data.length - 1, i));
      tip.style.left = ((pl + dx * i) / w * 100) + '%';
      tip.style.top = (py(data[i]) / h * 100) + '%';
      tip.style.opacity = 1;
      tip.textContent = `${labels[i]}：${data[i]}${unit}`;
    });
    svg.addEventListener('mouseleave', () => { tip.style.opacity = 0; });
    return wrap;
  }

  /* 多线对比 */
  function multiLine(series, labels, opts = {}) {
    const w = opts.w || 560, h = opts.h || 250, pl = 38, pr = 16, pt = 22, pb = 30;
    const colors = opts.colors || PAL;
    const iw = w - pl - pr, ih = h - pt - pb;
    const all = series.flatMap(s => s.data);
    const min = (opts.min !== undefined ? opts.min : Math.min(...all) - 5);
    const max = (opts.max !== undefined ? opts.max : Math.max(...all) + 5);
    const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, width: '100%' });
    for (let i = 0; i <= 4; i++) {
      const y = pt + (ih / 4) * i;
      svg.appendChild(el('line', { x1: pl, x2: w - pr, y1: y, y2: y, stroke: '#EEEAF2' }));
      const t = el('text', { x: pl - 8, y: y + 4, 'text-anchor': 'end', 'font-size': 10.5, fill: '#9AA0AF' });
      t.textContent = Math.round(max - ((max - min) / 4) * i);
      svg.appendChild(t);
    }
    const dx = iw / (labels.length - 1);
    const py = v => pt + ih - ((v - min) / (max - min)) * ih;
    series.forEach((s, si) => {
      const dd = s.data.map((v, i) => `${i ? 'L' : 'M'} ${pl + dx * i} ${py(v)}`).join(' ');
      svg.appendChild(el('path', { d: dd, fill: 'none', stroke: s.color || colors[si], 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      s.data.forEach((v, i) => svg.appendChild(el('circle', { cx: pl + dx * i, cy: py(v), r: 3, fill: s.color || colors[si] })));
    });
    labels.forEach((lb, i) => {
      const t = el('text', { x: pl + dx * i, y: h - 9, 'text-anchor': 'middle', 'font-size': 11.5, fill: '#8A90A2' });
      t.textContent = lb; svg.appendChild(t);
    });
    let lx = pl;
    series.forEach((s, si) => {
      svg.appendChild(el('rect', { x: lx, y: 4, width: 9, height: 9, rx: 2, fill: s.color || colors[si] }));
      const t = el('text', { x: lx + 13, y: 12, 'font-size': 11, fill: '#6B7080' });
      t.textContent = s.name; svg.appendChild(t);
      lx += 13 + s.name.length * 12 + 16;
    });
    return svg;
  }

  /* 柱状图 */
  function barChart(data, labels, opts = {}) {
    const w = opts.w || 720, h = opts.h || 280, pl = 36, pr = 12, pt = 18, pb = 64;
    const color = opts.color || PAL[0];
    const iw = w - pl - pr, ih = h - pt - pb;
    const max = (opts.max !== undefined ? opts.max : Math.max(...data) + 8);
    const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, width: '100%' });
    for (let i = 0; i <= 4; i++) {
      const y = pt + (ih / 4) * i;
      svg.appendChild(el('line', { x1: pl, x2: w - pr, y1: y, y2: y, stroke: '#EEEAF2' }));
      const t = el('text', { x: pl - 8, y: y + 4, 'text-anchor': 'end', 'font-size': 10.5, fill: '#9AA0AF' });
      t.textContent = Math.round(max - (max / 4) * i); svg.appendChild(t);
    }
    const n = data.length, slot = iw / n, bw = Math.min(34, slot * 0.58);
    data.forEach((v, i) => {
      const x = pl + slot * i + (slot - bw) / 2;
      const bh = (v / max) * ih;
      const y = pt + ih - bh;
      svg.appendChild(el('rect', { x, y, width: bw, height: bh, rx: 5, fill: color, opacity: .9 }));
      const vt = el('text', { x: x + bw / 2, y: y - 5, 'text-anchor': 'middle', 'font-size': 10.5, fill: '#5A5F6E', 'font-weight': 700 });
      vt.textContent = v; svg.appendChild(vt);
      const t = el('text', { x: x + bw / 2, y: pt + ih + 15, 'text-anchor': 'end', 'font-size': 10.5, fill: '#8A90A2', transform: `rotate(-38 ${x + bw / 2} ${pt + ih + 15})` });
      t.textContent = labels[i]; svg.appendChild(t);
    });
    return svg;
  }

  /* 环形进度 */
  function donut(value, opts = {}) {
    const size = opts.size || 120, r = size / 2 - 11, c = size / 2;
    const color = opts.color || PAL[0];
    const svg = el('svg', { viewBox: `0 0 ${size} ${size}`, width: size, height: size });
    svg.appendChild(el('circle', { cx: c, cy: c, r, fill: 'none', stroke: '#F0EAF4', 'stroke-width': 10 }));
    const circ = 2 * Math.PI * r;
    const arc = el('circle', {
      cx: c, cy: c, r, fill: 'none', stroke: color, 'stroke-width': 10,
      'stroke-linecap': 'round', transform: `rotate(-90 ${c} ${c})`,
      'stroke-dasharray': circ, 'stroke-dashoffset': circ
    });
    svg.appendChild(arc);
    requestAnimationFrame(() => {
      arc.style.transition = 'stroke-dashoffset .8s ease';
      arc.setAttribute('stroke-dashoffset', circ * (1 - value / 100));
    });
    const t = el('text', { x: c, y: c + 2, 'text-anchor': 'middle', 'font-size': opts.fs || 22, 'font-weight': 800, fill: opts.ink || '#1F2430' });
    t.textContent = value + (opts.unit === undefined ? '%' : opts.unit);
    svg.appendChild(t);
    if (opts.label) {
      const t2 = el('text', { x: c, y: c + 18, 'text-anchor': 'middle', 'font-size': 10.5, fill: '#9AA0AF' });
      t2.textContent = opts.label; svg.appendChild(t2);
    }
    return svg;
  }

  VBM.charts = { sparkline, lineChart, multiLine, barChart, donut, PAL };
})();
