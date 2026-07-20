/*
  Ta Panda Business OS — Shared SVG Chart Renderers
  ----------------------------------------------------
  Zero-dependency, hand-rolled SVG charts styled to match the OS design
  system. Every renderer takes a container element and plain data and
  builds a responsive (viewBox-scaled) SVG into it. Colors default to the
  design tokens (via inline style="...:var(--x)") so charts stay correct
  across the light/dark theme toggle without re-rendering.

  Load AFTER business-os.css/js and os-data.js, BEFORE page scripts.
*/

(function () {
  'use strict';

  let uid = 0;
  function nextId(prefix) {
    uid += 1;
    return prefix + '-' + uid;
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => node.setAttribute(k, attrs[k]));
    }
    return node;
  }

  // -----------------------------------------------------------------
  // Shared floating tooltip (single instance reused by every chart)
  // -----------------------------------------------------------------
  let tooltipEl = null;
  function ensureTooltip() {
    if (tooltipEl) return tooltipEl;
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'chart-tooltip';
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }
  function showTooltip(evt, html) {
    const tip = ensureTooltip();
    tip.innerHTML = html;
    tip.classList.add('visible');
    positionTooltip(evt);
  }
  function positionTooltip(evt) {
    if (!tooltipEl) return;
    const pad = 14;
    let x = evt.clientX + pad;
    let y = evt.clientY + pad;
    const rect = tooltipEl.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 8) x = evt.clientX - rect.width - pad;
    if (y + rect.height > window.innerHeight - 8) y = evt.clientY - rect.height - pad;
    tooltipEl.style.left = x + 'px';
    tooltipEl.style.top = y + 'px';
  }
  function hideTooltip() {
    if (tooltipEl) tooltipEl.classList.remove('visible');
  }

  function bindTooltip(target, htmlFn) {
    target.addEventListener('mouseenter', (e) => showTooltip(e, htmlFn()));
    target.addEventListener('mousemove', positionTooltip);
    target.addEventListener('mouseleave', hideTooltip);
  }

  // -----------------------------------------------------------------
  // Line / area chart
  // opts: { color, area, height, formatValue }
  // -----------------------------------------------------------------
  function line(container, data, opts) {
    opts = opts || {};
    container.innerHTML = '';
    if (!data || !data.length) return renderEmpty(container);

    const W = 600, H = opts.height || 220;
    const padX = 24, padTop = 16, padBottom = 28;
    const color = opts.color || 'var(--accent-gold)';
    const max = Math.max(...data.map((p) => p.v), 1);
    const min = Math.min(0, ...data.map((p) => p.v));
    const range = max - min || 1;
    const stepX = (W - padX * 2) / Math.max(data.length - 1, 1);

    const points = data.map((p, i) => {
      const x = padX + i * stepX;
      const y = H - padBottom - ((p.v - min) / range) * (H - padTop - padBottom);
      return { x, y, p };
    });

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'os-chart-svg', preserveAspectRatio: 'none', role: 'img' });

    // gridlines
    for (let i = 0; i <= 3; i++) {
      const y = padTop + ((H - padTop - padBottom) / 3) * i;
      svg.appendChild(el('line', { x1: padX, x2: W - padX, y1: y, y2: y, style: 'stroke:var(--border-subtle);stroke-width:1' }));
    }

    const linePath = points.map((pt, i) => (i === 0 ? 'M' : 'L') + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1)).join(' ');

    if (opts.area !== false) {
      const areaId = nextId('area-grad');
      const defs = el('defs');
      const grad = el('linearGradient', { id: areaId, x1: '0', y1: '0', x2: '0', y2: '1' });
      const stop1 = el('stop', { offset: '0%' });
      stop1.setAttribute('style', `stop-color:${color};stop-opacity:0.35`);
      const stop2 = el('stop', { offset: '100%' });
      stop2.setAttribute('style', `stop-color:${color};stop-opacity:0`);
      grad.appendChild(stop1);
      grad.appendChild(stop2);
      defs.appendChild(grad);
      svg.appendChild(defs);

      const areaPath = linePath + ` L${points[points.length - 1].x.toFixed(1)} ${H - padBottom} L${points[0].x.toFixed(1)} ${H - padBottom} Z`;
      svg.appendChild(el('path', { d: areaPath, fill: `url(#${areaId})`, stroke: 'none' }));
    }

    svg.appendChild(el('path', { d: linePath, fill: 'none', style: `stroke:${color};stroke-width:2.5`, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));

    points.forEach((pt) => {
      const dot = el('circle', { cx: pt.x, cy: pt.y, r: 4, style: `fill:var(--bg-primary);stroke:${color};stroke-width:2;cursor:pointer` });
      bindTooltip(dot, () => `<strong>${pt.p.l}</strong><br>${opts.formatValue ? opts.formatValue(pt.p.v) : pt.p.v}`);
      svg.appendChild(dot);

      const label = el('text', { x: pt.x, y: H - 8, 'text-anchor': 'middle', class: 'os-chart-axis-label' });
      label.textContent = pt.p.l;
      svg.appendChild(label);
    });

    container.appendChild(svg);
  }

  // -----------------------------------------------------------------
  // Vertical bar chart
  // opts: { color, height, formatValue }
  // -----------------------------------------------------------------
  function bar(container, data, opts) {
    opts = opts || {};
    container.innerHTML = '';
    if (!data || !data.length) return renderEmpty(container);

    const W = 600, H = opts.height || 220;
    const padX = 20, padTop = 16, padBottom = 28;
    const color = opts.color || 'var(--accent-gold)';
    const max = Math.max(...data.map((p) => p.v), 1);
    const gap = 10;
    const barW = (W - padX * 2 - gap * (data.length - 1)) / data.length;

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'os-chart-svg', preserveAspectRatio: 'none', role: 'img' });

    for (let i = 0; i <= 3; i++) {
      const y = padTop + ((H - padTop - padBottom) / 3) * i;
      svg.appendChild(el('line', { x1: padX, x2: W - padX, y1: y, y2: y, style: 'stroke:var(--border-subtle);stroke-width:1' }));
    }

    data.forEach((p, i) => {
      const x = padX + i * (barW + gap);
      const barH = ((p.v / max) * (H - padTop - padBottom)) || 0;
      const y = H - padBottom - barH;
      const rect = el('rect', {
        x, y, width: barW, height: Math.max(barH, 2), rx: 4,
        style: `fill:${p.color || color};cursor:pointer;transition:opacity .15s`
      });
      bindTooltip(rect, () => `<strong>${p.l}</strong><br>${opts.formatValue ? opts.formatValue(p.v) : p.v}`);
      rect.addEventListener('mouseenter', () => rect.style.opacity = '0.75');
      rect.addEventListener('mouseleave', () => rect.style.opacity = '1');
      svg.appendChild(rect);

      const label = el('text', { x: x + barW / 2, y: H - 8, 'text-anchor': 'middle', class: 'os-chart-axis-label' });
      label.textContent = p.l;
      svg.appendChild(label);
    });

    container.appendChild(svg);
  }

  // -----------------------------------------------------------------
  // Horizontal bar chart (for content-type analysis style widgets)
  // -----------------------------------------------------------------
  function hbar(container, data, opts) {
    opts = opts || {};
    container.innerHTML = '';
    if (!data || !data.length) return renderEmpty(container);

    const wrap = document.createElement('div');
    wrap.className = 'os-hbar-list';
    const max = Math.max(...data.map((p) => p.v), 1);

    data.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'os-hbar-row';
      const pct = Math.max((p.v / max) * 100, 3);
      row.innerHTML = `
        <span class="os-hbar-label">${p.l}</span>
        <span class="os-hbar-track"><span class="os-hbar-fill" style="width:${pct}%;background:${p.color || 'var(--accent-gold)'}"></span></span>
        <span class="os-hbar-value">${opts.formatValue ? opts.formatValue(p.v) : p.v}</span>
      `;
      wrap.appendChild(row);
    });

    container.appendChild(wrap);
  }

  // -----------------------------------------------------------------
  // Donut chart. data: [{l, v, color}]
  // opts: { size, thickness, centerLabel, centerValue }
  // -----------------------------------------------------------------
  function donut(container, data, opts) {
    opts = opts || {};
    container.innerHTML = '';
    if (!data || !data.length) return renderEmpty(container);

    const size = opts.size || 180;
    const thickness = opts.thickness || 22;
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const total = data.reduce((sum, p) => sum + p.v, 0) || 1;

    const wrap = document.createElement('div');
    wrap.className = 'os-donut-wrap';

    const svg = el('svg', { viewBox: `0 0 ${size} ${size}`, width: size, height: size, class: 'os-donut-svg' });
    svg.appendChild(el('circle', { cx: size / 2, cy: size / 2, r: radius, style: `fill:none;stroke:var(--bg-tertiary);stroke-width:${thickness}` }));

    let offset = 0;
    data.forEach((p) => {
      const frac = p.v / total;
      const dash = frac * circumference;
      const circle = el('circle', {
        cx: size / 2, cy: size / 2, r: radius,
        style: `fill:none;stroke:${p.color};stroke-width:${thickness};stroke-dasharray:${dash} ${circumference - dash};stroke-dashoffset:${-offset};cursor:pointer;transition:opacity .15s`,
        transform: `rotate(-90 ${size / 2} ${size / 2})`
      });
      bindTooltip(circle, () => `<strong>${p.l}</strong><br>${p.v}% (${Math.round(frac * total)}/${total})`);
      circle.addEventListener('mouseenter', () => circle.style.opacity = '0.8');
      circle.addEventListener('mouseleave', () => circle.style.opacity = '1');
      svg.appendChild(circle);
      offset += dash;
    });

    wrap.appendChild(svg);

    if (opts.centerLabel || opts.centerValue) {
      const center = document.createElement('div');
      center.className = 'os-donut-center';
      center.innerHTML = `${opts.centerValue ? `<div class="os-donut-center-value">${opts.centerValue}</div>` : ''}${opts.centerLabel ? `<div class="os-donut-center-label">${opts.centerLabel}</div>` : ''}`;
      wrap.appendChild(center);
    }

    const legend = document.createElement('div');
    legend.className = 'os-chart-legend';
    data.forEach((p) => {
      const item = document.createElement('div');
      item.className = 'os-chart-legend-item';
      item.innerHTML = `<span class="os-legend-dot" style="background:${p.color}"></span>${p.l} <strong>${p.v}%</strong>`;
      legend.appendChild(item);
    });

    const outer = document.createElement('div');
    outer.className = 'os-donut-container';
    outer.appendChild(wrap);
    outer.appendChild(legend);
    container.appendChild(outer);
  }

  // -----------------------------------------------------------------
  // Radial single-value progress ring (e.g. success rate %)
  // -----------------------------------------------------------------
  function radial(container, percent, opts) {
    opts = opts || {};
    container.innerHTML = '';
    const size = opts.size || 72;
    const thickness = opts.thickness || 7;
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const dash = (Math.max(0, Math.min(100, percent)) / 100) * circumference;
    const color = opts.color || (percent >= 95 ? 'var(--status-success-text)' : percent >= 80 ? 'var(--status-warning-text)' : 'var(--status-danger-text)');

    const svg = el('svg', { viewBox: `0 0 ${size} ${size}`, width: size, height: size, class: 'os-radial-svg' });
    svg.appendChild(el('circle', { cx: size / 2, cy: size / 2, r: radius, style: `fill:none;stroke:var(--bg-tertiary);stroke-width:${thickness}` }));
    svg.appendChild(el('circle', {
      cx: size / 2, cy: size / 2, r: radius,
      style: `fill:none;stroke:${color};stroke-width:${thickness};stroke-linecap:round;stroke-dasharray:${dash} ${circumference - dash}`,
      transform: `rotate(-90 ${size / 2} ${size / 2})`
    }));

    const wrap = document.createElement('div');
    wrap.className = 'os-radial-wrap';
    wrap.style.width = size + 'px';
    wrap.style.height = size + 'px';
    wrap.appendChild(svg);
    const label = document.createElement('div');
    label.className = 'os-radial-label';
    label.textContent = Math.round(percent) + '%';
    wrap.appendChild(label);
    container.appendChild(wrap);
  }

  // -----------------------------------------------------------------
  // Heatmap (GitHub-style contribution grid)
  // data: [{date: 'YYYY-MM-DD', count: 0|1|2}]
  // -----------------------------------------------------------------
  function heatmap(container, data, opts) {
    opts = opts || {};
    container.innerHTML = '';
    if (!data || !data.length) return renderEmpty(container);

    const weeks = [];
    let current = [];
    data.forEach((cell, i) => {
      current.push(cell);
      const dow = new Date(cell.date + 'T00:00:00').getDay();
      if (dow === 6 || i === data.length - 1) {
        weeks.push(current);
        current = [];
      }
    });

    const grid = document.createElement('div');
    grid.className = 'os-heatmap-grid';
    weeks.forEach((week) => {
      const col = document.createElement('div');
      col.className = 'os-heatmap-col';
      for (let d = 0; d < 7; d++) {
        const cell = week.find((c) => new Date(c.date + 'T00:00:00').getDay() === d);
        const box = document.createElement('div');
        box.className = 'os-heatmap-cell level-' + (cell ? cell.count : -1);
        if (cell) {
          bindTooltip(box, () => `<strong>${cell.count}</strong> item${cell.count === 1 ? '' : 's'}<br>${cell.date}`);
        }
        col.appendChild(box);
      }
      grid.appendChild(col);
    });

    container.appendChild(grid);
  }

  function renderEmpty(container) {
    container.innerHTML = '<div class="empty-state empty-state-inline"><span class="empty-state-text">No data yet</span></div>';
  }

  window.OSCharts = { line, bar, hbar, donut, radial, heatmap };
})();
