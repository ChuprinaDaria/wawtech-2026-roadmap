/* The "limits first" scene: draws the side view from the state and listens to fingers and keys.
   All arithmetic lives in model.js; all words live in text.js. */
(function () {
  'use strict';
  const L = window.Limits, TEXT = window.LimitsText, root = document.getElementById('limits');
  if (!L || !TEXT || !root) return;

  let state = { camera: 'plain', carrier: 'fly', board: 'mid', night: false, air: 'clear', h: 100, gr: 400, alt: 0 };
  let lang = /^uk/i.test(navigator.language || '') ? 'uk' : 'en';
  try { Object.assign(state, JSON.parse(root.dataset.state || '{}')); } catch (e) { /* a broken attribute changes nothing */ }
  if (TEXT[root.dataset.lang]) lang = root.dataset.lang;

  // the scene in its own units: 0.55 of a unit per metre, the same along both axes
  const X0 = 30, GROUND = 255, K = 0.55;
  const X = (m) => X0 + K * m, Y = (m) => GROUND - K * m;
  const MINT = '#02feb9', PINK = '#ff00aa', YEL = '#ffd84a', PAPER = '#fdfdfb', INK = '#0d021b', GREY = '#8d86a8', HEAT = '#ff8a3d';
  const NEXT = { camera: ['plain', 'thermal'], carrier: ['fly', 'tower'], board: ['weak', 'mid', 'strong'], air: ['clear', 'haze', 'fog'] };
  const rad = (deg) => deg * Math.PI / 180;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const num = (v) => { const s = v < 9.95 ? v.toFixed(1).replace(/\.0$/, '') : String(Math.round(v)); return lang === 'uk' ? s.replace('.', ',') : s; };
  const fill = (t, n) => t.replace('{n}', n);
  const zone = (px) => (px >= 16 ? MINT : px >= 8 ? YEL : px >= 2 ? PINK : GREY);

  root.innerHTML =
    '<p class="lim-hint"></p>' +
    '<div class="lim-stage"><div class="lim-scene">' +
    '<svg viewBox="-18 0 378 330" role="group"><defs>' +
    '<linearGradient id="lim-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1470"/><stop offset=".75" stop-color="#5b3fd0"/><stop offset="1" stop-color="#8a6cff"/></linearGradient>' +
    '<linearGradient id="lim-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05010d"/><stop offset="1" stop-color="#1b0f45"/></linearGradient>' +
    '<pattern id="lim-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><line x1="0" y1="0" x2="0" y2="7" stroke="#fdfdfb" stroke-opacity=".28" stroke-width="1.4"/></pattern>' +
    '<pattern id="lim-grass" width="8" height="6" patternUnits="userSpaceOnUse"><path d="M1,6 l2,-5 M5,6 l1,-4" stroke="#0f7a4f" stroke-width="1.2" fill="none"/></pattern>' +
    '<clipPath id="lim-above"><rect x="-18" y="0" width="378" height="255"/></clipPath>' +
    '<filter id="lim-pen"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter>' +
    '</defs><g class="lim-art"></g><g class="lim-ui">' +
    '<circle class="lim-hit" data-drag="drone" r="24" tabindex="0" role="slider" aria-valuemin="5" aria-valuemax="300"/>' +
    '<circle class="lim-hit" data-drag="target" r="24" tabindex="0" role="slider" aria-valuemin="20" aria-valuemax="600"/>' +
    '<circle class="lim-hit" data-act="sun" cx="314" cy="42" r="30" tabindex="0" role="button"/>' +
    '<rect class="lim-hit" data-act="cloud" x="168" y="14" width="78" height="66" rx="14" tabindex="0" role="button"/>' +
    '<rect class="lim-hit" data-act="camera" x="-12" y="277" width="118" height="46" rx="23" tabindex="0" role="button"/>' +
    '<rect class="lim-hit" data-act="carrier" x="110" y="277" width="112" height="46" rx="23" tabindex="0" role="button"/>' +
    '<rect class="lim-hit" data-act="board" x="226" y="277" width="130" height="46" rx="23" tabindex="0" role="button"/>' +
    '</g></svg><button type="button" class="lim-lang"></button></div>' +
    '<p class="lim-legend"></p></div>' +
    '<div class="lim-side"><div class="lim-who" role="list"></div><p class="lim-say" aria-live="polite"></p><p class="lim-foot"></p></div>';

  const svg = root.querySelector('svg'), art = root.querySelector('.lim-art');
  const hit = (sel) => root.querySelector('.lim-hit[' + sel + ']');

  // where a ray from the camera leaves the scene: angle from straight down, world metres
  function edge(angle) {
    const dx = Math.sin(rad(angle)), dy = -Math.cos(rad(angle)), out = [];
    if (dy < 0) out.push([state.h / -dy, 0]);            // the ground
    if (dx > 0) out.push([720 / dx, 1]);                 // the right side
    if (dy > 0) out.push([(520 - state.h) / dy, 2]);     // the top
    if (dx < 0) out.push([100 / -dx, 3]);                // the left side
    out.sort((a, b) => a[0] - b[0]);
    return { x: dx * out[0][0], y: state.h + dy * out[0][0], side: out[0][1] };
  }

  function coneShape() {
    const c = L.cone(state), lo = edge(c.lo), hi = edge(c.hi);
    const corner = { 3: [-100, 0], 0: [720, 0], 1: [720, 520] }, after = { 3: 0, 0: 1, 1: 2 };
    const pts = [[0, state.h], [lo.x, lo.y]];
    for (let s = lo.side; s !== hi.side && s in corner; s = after[s]) pts.push(corner[s]);
    pts.push([hi.x, hi.y]);
    return { poly: pts.map((p) => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' '), lo, hi };
  }

  function girl() {
    return '<g transform="translate(-9 0)"><path d="M10,255 l-3,0 M18,255 l3,0 M10,244 l0,11 M18,244 l0,11" stroke="' + PAPER + '" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M14,226 l-9,19 l18,0 z" fill="' + PINK + '" stroke="' + INK + '" stroke-width="1"/><path d="M8,232 l-6,-5 M20,232 l6,-6" stroke="' + PAPER + '" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="14" cy="219" r="7" fill="#ffe1c4" stroke="' + INK + '" stroke-width="1"/><circle cx="11.5" cy="218" r="1" fill="' + INK + '"/><circle cx="16.5" cy="218" r="1" fill="' + INK + '"/>' +
      '<path d="M11,221.5 q3,3 6,0" stroke="' + INK + '" stroke-width="1.1" fill="none"/>' +
      '<path d="M7,214 l-7,-3 l1,7 z M21,214 l7,-3 l-1,7 z" fill="' + PINK + '" stroke="' + INK + '" stroke-width=".8"/><circle cx="7" cy="214" r="1.6" fill="' + YEL + '"/><circle cx="21" cy="214" r="1.6" fill="' + YEL + '"/></g>';
  }

  function carrier(cy) {
    const lens = state.camera === 'thermal' ? HEAT : MINT;
    if (state.carrier === 'tower') {
      let mast = '<path d="M26,255 L30,' + (cy + 6) + ' L34,255" fill="none" stroke="' + PAPER + '" stroke-width="2"/>';
      for (let y = 249; y > cy + 12; y -= 9) mast += '<path d="M27,' + y + ' l6,-5 M33,' + y + ' l-6,-5" stroke="' + PAPER + '" stroke-width="1" opacity=".8"/>';
      return mast + '<rect x="20" y="' + (cy + 2) + '" width="20" height="5" rx="2" fill="' + PAPER + '"/>' +
        '<rect x="22" y="' + (cy - 8) + '" width="18" height="11" rx="3" fill="' + INK + '" stroke="' + PAPER + '" stroke-width="1.6"/><circle cx="37" cy="' + (cy - 2.5) + '" r="3.6" fill="' + lens + '"/>';
    }
    return '<g transform="translate(0 ' + (cy - 200) + ')"><rect x="16" y="194" width="28" height="9" rx="4.5" fill="' + MINT + '" stroke="' + INK + '" stroke-width="1.2"/>' +
      '<circle cx="30" cy="206" r="4.5" fill="' + INK + '" stroke="' + lens + '" stroke-width="2"/><circle cx="30" cy="206" r="1.6" fill="' + lens + '"/>' +
      '<path d="M19,194 l0,-5 M41,194 l0,-5" stroke="' + PAPER + '" stroke-width="1.6"/><path d="M11,188 l16,0 M33,188 l16,0" stroke="' + PAPER + '" stroke-width="2.2" stroke-linecap="round"/></g>';
  }

  function target(tx, ty, air) {
    const arrows = '<g stroke="' + PAPER + '" stroke-width="1.6" fill="' + PAPER + '" opacity=".9"><path d="M0,-31 l0,-10"/><path d="M-4.5,-40 l4.5,-7 l4.5,7 z"/>' +
      '<path d="M26,-12 l9,0"/><path d="M34,-16.5 l7,4.5 l-7,4.5 z"/><path d="M-26,-12 l-9,0"/><path d="M-34,-16.5 l-7,4.5 l7,4.5 z"/></g>';
    if (air) {
      return '<g transform="translate(' + tx + ' ' + (ty + 12) + ')">' + arrows + '<g transform="translate(0 -12)"><ellipse cx="0" cy="0" rx="9" ry="4.5" fill="' + YEL + '" stroke="' + INK + '" stroke-width="1.2"/>' +
        '<path d="M-7,-4 l0,-4 M7,-4 l0,-4" stroke="' + PAPER + '" stroke-width="1.5"/><path d="M-13,-8.5 l12,0 M1,-8.5 l12,0" stroke="' + PAPER + '" stroke-width="2" stroke-linecap="round"/></g></g>';
    }
    return '<g transform="translate(' + tx + ' 255)">' + arrows + '<rect x="-18" y="-9" width="36" height="9" rx="4.5" fill="#3a2a5c" stroke="' + PAPER + '" stroke-width="1.2"/>' +
      '<path d="M-13,-9 l4,-9 l18,0 l4,9 z" fill="' + YEL + '" stroke="' + INK + '" stroke-width="1.2"/><rect x="-6" y="-25" width="12" height="7" rx="2" fill="' + YEL + '" stroke="' + INK + '" stroke-width="1.2"/>' +
      '<path d="M6,-22 l14,-2" stroke="' + YEL + '" stroke-width="3" stroke-linecap="round"/>' +
      [-12, -4, 4, 12].map((x) => '<circle cx="' + x + '" cy="-4" r="2" fill="' + PAPER + '"/>').join('') + '</g>';
  }

  function sky(T) {
    let s = '';
    if (state.night) {
      s += [[60, 30], [120, 62], [150, 24], [250, 30], [275, 84], [96, 96], [200, 100], [338, 104], [20, 70]].map((p) => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.1" fill="' + PAPER + '" opacity=".8"/>').join('');
      s += '<circle cx="314" cy="42" r="17" fill="#fdf3c4"/><circle cx="322" cy="36" r="15" fill="#0b0420"/>' +
        '<circle cx="305" cy="40" r="1.6" fill="' + INK + '"/><path d="M301,48 q4,3 8,0" stroke="' + INK + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    } else {
      s += '<circle cx="314" cy="42" r="17" fill="' + YEL + '"/><g stroke="' + YEL + '" stroke-width="2.6" stroke-linecap="round"><path d="M314,14 l0,-7 M314,70 l0,7 M286,42 l-7,0 M342,42 l7,0 M294,22 l-5,-5 M334,62 l5,5 M294,62 l-5,5 M334,22 l5,-5"/></g>' +
        '<circle cx="308" cy="38" r="2" fill="' + INK + '"/><circle cx="320" cy="38" r="2" fill="' + INK + '"/><path d="M307,46 q7,7 14,0" stroke="' + INK + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
    }
    const grey = { clear: PAPER, haze: '#d9d4ea', fog: '#a39bbd' }[state.air], big = state.air === 'fog' ? 1.25 : 1;
    s += '<g transform="translate(206 42) scale(' + big + ')" fill="' + grey + '" fill-opacity=".94"><ellipse cx="0" cy="4" rx="24" ry="11"/><circle cx="-10" cy="-2" r="11"/><circle cx="6" cy="-6" r="13"/></g>';
    if (state.air !== 'clear') s += '<g stroke="' + grey + '" stroke-width="2" stroke-linecap="round" opacity=".9"><path d="M186,64 l40,0 M192,70 l30,0' + (state.air === 'fog' ? ' M182,76 l48,0' : '') + '"/></g>';
    const tapSun = state.night ? T.scene.tapDay : T.scene.tapNight;
    const tapAir = { clear: T.scene.tapHaze, haze: T.scene.tapFog, fog: T.scene.tapClear }[state.air];
    s += '<g class="lim-t" font-size="10.5" text-anchor="middle"><text x="314" y="88" fill="' + (state.night ? '#fdf3c4' : YEL) + '">' + esc(tapSun) + '</text>' +
      '<text x="206" y="' + (state.air === 'clear' ? 70 : 90) + '" fill="' + PAPER + '">' + esc(tapAir) + '</text></g>';
    return s;
  }

  function stickers(T) {
    const lens = state.camera === 'thermal' ? HEAT : MINT, lit = { weak: 1, mid: 2, strong: 3 }[state.board];
    const pill = (x, w) => '<rect x="' + x + '" y="280" width="' + w + '" height="40" rx="20" fill="' + INK + '" stroke="' + MINT + '" stroke-width="1.6"/>';
    const word = (x, t) => '<text class="lim-t" x="' + x + '" y="304" font-size="12" fill="' + PAPER + '">' + esc(t) + '</text>';
    const craft = state.carrier === 'tower'
      ? '<path d="M131,311 l6,-20 l6,20 M133,304 l8,0" fill="none" stroke="' + PAPER + '" stroke-width="1.8"/><rect x="131" y="286" width="12" height="6" rx="2" fill="' + MINT + '"/>'
      : '<rect x="126" y="297" width="22" height="7" rx="3.5" fill="' + MINT + '"/><path d="M129,297 l0,-4 M145,297 l0,-4 M123,292 l12,0 M139,292 l12,0" stroke="' + PAPER + '" stroke-width="1.8" stroke-linecap="round"/>';
    return pill(-10, 114) + '<rect x="1" y="291" width="24" height="18" rx="4" fill="none" stroke="' + PAPER + '" stroke-width="1.8"/><circle cx="13" cy="300" r="5" fill="' + lens + '"/><rect x="6" y="287" width="8" height="4" rx="1.5" fill="' + PAPER + '"/>' + word(32, T.camera[state.camera]) +
      pill(112, 108) + craft + word(158, T.carrier[state.carrier]) +
      pill(228, 126) + [0, 1, 2].map((i) => '<rect x="' + (241 + i * 9) + '" y="' + (301 - i * 5.5) + '" width="6" height="' + (8 + i * 5.5) + '" fill="' + (i < lit ? MINT : '#3a2a5c') + '"/>').join('') + word(274, T.board[state.board]);
  }

  function draw() {
    const T = TEXT[lang], d = L.derive(state), air = d.target === 'air';
    const cx = X0, cy = Y(state.h), tx = X(state.gr), ty = Y(state.alt);
    const r = L.rings(state).map((m) => m * K), cone = coneShape();
    let s = '<rect x="-18" y="0" width="378" height="330" fill="url(#lim-' + (state.night ? 'night' : 'day') + ')"/>';

    // how many pixels the target still gets at this distance: three discs around the camera
    s += '<g clip-path="url(#lim-above)">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r[2] + '" fill="' + PINK + '" fill-opacity=".20"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r[1] + '" fill="' + YEL + '" fill-opacity=".30"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r[0] + '" fill="' + MINT + '" fill-opacity=".40"/>' +
      [[r[0], MINT], [r[1], YEL], [r[2], PINK]].map((q) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + q[0] + '" fill="none" stroke="' + q[1] + '" stroke-width="1.2" stroke-dasharray="3 4"/>').join('');

    // the frame: everything between its two edge rays, coloured by the same three distances
    const len = Math.max(1, Math.hypot(tx - cx, ty - cy)), far = Math.max(60, Math.min(r[2], 460));
    s += '<linearGradient id="lim-cone" gradientUnits="userSpaceOnUse" x1="' + cx + '" y1="' + cy + '" x2="' + (cx + (tx - cx) / len * far) + '" y2="' + (cy + (ty - cy) / len * far) + '">' +
      '<stop offset="0" stop-color="' + MINT + '" stop-opacity=".6"/><stop offset="' + Math.min(.6, r[0] / far).toFixed(2) + '" stop-color="' + MINT + '" stop-opacity=".5"/>' +
      '<stop offset="' + Math.min(.85, r[1] / far).toFixed(2) + '" stop-color="' + YEL + '" stop-opacity=".4"/><stop offset="1" stop-color="' + PINK + '" stop-opacity=".32"/></linearGradient>' +
      '<polygon points="' + cone.poly + '" fill="url(#lim-cone)"/><polygon points="' + cone.poly + '" fill="url(#lim-hatch)"/></g>';

    // the classic triangle: height, ground range, slant range, and the angle from straight down
    const corner = Y(state.alt), flat = Math.abs(cy - corner) < 3;
    s += '<g filter="url(#lim-pen)" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M' + cx + ',' + cy + ' L' + X(cone.lo.x).toFixed(1) + ',' + Y(cone.lo.y).toFixed(1) + ' M' + cx + ',' + cy + ' L' + X(cone.hi.x).toFixed(1) + ',' + Y(cone.hi.y).toFixed(1) + '" stroke="' + PAPER + '" stroke-width="1.2" stroke-dasharray="5 5" clip-path="url(#lim-above)"/>' +
      '<path d="M' + cx + ',' + cy + ' L' + cx + ',' + GROUND + '" stroke="' + PAPER + '" stroke-width="1.2" stroke-dasharray="3 4" opacity=".7"/>' +
      '<path d="M' + cx + ',' + cy + ' L' + cx + ',' + corner + ' L' + tx + ',' + ty + '" stroke="' + PAPER + '" stroke-width="2.4"/>' +
      '<path d="M' + cx + ',' + cy + ' L' + tx + ',' + ty + '" stroke="' + MINT + '" stroke-width="3"/>' +
      (flat || tx - cx < 16 ? '' : '<path d="M' + cx + ',' + (corner + (cy < corner ? -9 : 9)) + ' l9,0 l0,' + (cy < corner ? 9 : -9) + '" stroke="' + PAPER + '" stroke-width="1.4"/>') +
      '<path d="M' + cx + ',' + (cy + 20) + ' A20,20 0 ' + (d.angle > 180 ? 1 : 0) + ' 0 ' + (cx + 20 * Math.sin(rad(d.angle))).toFixed(1) + ',' + (cy + 20 * Math.cos(rad(d.angle))).toFixed(1) + '" stroke="' + YEL + '" stroke-width="2"/></g>';

    s += '<rect x="-18" y="255" width="378" height="75" fill="#0b3b2a"/><rect x="-18" y="255" width="378" height="12" fill="url(#lim-grass)"/>';
    s += sky(T) + girl() + carrier(cy) + target(tx, ty, air);
    s += '<g fill="' + PAPER + '" opacity=".9"><path d="M-12,' + (cy - 3) + ' l5,-8 l5,8 z"/><path d="M-12,' + (cy + 3) + ' l5,8 l5,-8 z"/></g>';

    // fog and haze: a veil that thickens with distance
    if (state.air !== 'clear') {
      const top = state.air === 'fog' ? .78 : .3;
      s += '<linearGradient id="lim-veil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9e6f4" stop-opacity="' + (top * .12).toFixed(2) + '"/><stop offset="1" stop-color="#e9e6f4" stop-opacity="' + top + '"/></linearGradient>' +
        '<rect x="-18" y="96" width="378" height="165" fill="url(#lim-veil)" pointer-events="none"/>';
    }

    // the labels that change while you drag; a label that would land on another one is left out
    const mid = (a, b) => (a + b) / 2, slope = Math.atan2(ty - cy, tx - cx) * 180 / Math.PI;
    const taken = [[cx - 24, cy - 16, 48, 30], [tx - 22, (air ? ty : GROUND - 28) - 4, 44, 30], [-13, 204, 32, 52]];   // carrier, target, girl
    const put = (text, x, y, o) => {
      const size = o.size || 13, w = text.length * size * .55 + 8, left = o.anchor === 'middle' ? x - w / 2 : o.anchor === 'end' ? x - w : x - 4;
      const box = o.box || [left, y - size, w, size + 5];
      if (!o.force && (box[0] < -16 || box[0] + box[2] > 358 || box[1] < 96 || box[1] + box[3] > GROUND + 2 ||
          taken.some((t) => box[0] < t[0] + t[2] && box[0] + box[2] > t[0] && box[1] < t[1] + t[3] && box[1] + box[3] > t[1]))) return false;
      taken.push(box);
      s += '<text x="' + x.toFixed(0) + '" y="' + y.toFixed(0) + '" fill="' + o.fill + '" font-size="' + size + '"' + (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') + (o.turn ? ' transform="' + o.turn + '"' : '') + '>' + esc(text) + '</text>';
      return true;
    };
    s += '<g class="lim-t">';
    const bx = Math.min(tx + 22, 314), by = Math.max(ty - (air ? 16 : 36), 112), pxText = fill(T.scene.px, num(d.px));
    s += '<rect x="' + (bx - 4) + '" y="' + (by - 13) + '" width="46" height="18" rx="9" fill="' + INK + '" fill-opacity=".8" stroke="' + zone(d.px) + '" stroke-width="1.4"/>';
    put(pxText, bx + 19, by, { fill: zone(d.px), size: 12, anchor: 'middle', force: true, box: [bx - 4, by - 13, 46, 18] });
    const hText = fill(T.scene.h, Math.round(state.h));
    put(hText, cx + 7, Math.min(GROUND - 6, mid(cy, GROUND) + 4), { fill: PAPER, size: 12.5 }) || put(hText, cx + 7, cy - 22, { fill: PAPER, size: 12.5 }) || put(hText, cx + 30, cy + 4, { fill: PAPER, size: 12.5 });
    const aText = fill(T.scene.angle, Math.round(d.angle));
    put(aText, cx + 26, d.angle > 90 ? cy + 22 : cy - 9, { fill: YEL }) || put(aText, cx + 26, d.angle > 90 ? cy - 9 : cy + 22, { fill: YEL });
    if (tx - cx > 60) put(fill(T.scene.ground, Math.round(state.gr)), mid(cx, tx), air ? corner + (cy > corner ? -6 : 14) : GROUND - 5, { fill: PAPER, size: 12.5, anchor: 'middle' });
    if (len > 100) {
      const sx = mid(cx, tx), sy = mid(cy, ty), text = fill(T.scene.slant, Math.round(d.sr)), w = text.length * 7.2, lean = Math.abs(Math.sin(rad(slope)));
      put(text, sx, sy - 11, { fill: MINT, anchor: 'middle', turn: 'rotate(' + slope.toFixed(1) + ' ' + sx.toFixed(0) + ' ' + sy.toFixed(0) + ')', box: [sx - w / 2 * (1 - lean * .5), sy - 22 - lean * w / 2, w * (1 - lean * .5), 20 + lean * w] });
    }
    const spot = (rr, ux, uy, text) => [[cx + rr * ux, cy - rr * uy], [cx + rr * .82, cy + rr * .46], [cx + rr * .35, cy - rr * .9]].some((q) => put(text, q[0], q[1], { fill: text === T.scene.see ? MINT : text === T.scene.dot ? '#ff9bd8' : YEL, anchor: 'middle' }));
    spot(r[0] * .62, .78, .62, T.scene.see);
    spot(mid(r[0], r[1]), .88, .47, air ? T.scene.shedAir : T.scene.shed);
    spot(Math.min(mid(r[1], r[2]), r[1] + 70), .97, .24, T.scene.dot);
    const edgeX = cx + Math.sqrt(Math.max(0, r[2] * r[2] - (cy - 110) * (cy - 110)));
    if (edgeX < 250) put(T.scene.johnson, edgeX + 8, 114, { fill: '#ff9bd8', size: 11.5 });
    else put(T.scene.johnson + ' →', 352, 114, { fill: '#ff9bd8', size: 11.5, anchor: 'end' });
    s += '</g>';

    art.innerHTML = s + stickers(T);

    // the invisible things you touch stay in place between redraws, so focus and dragging survive
    const drone = hit('data-drag="drone"'), tgt = hit('data-drag="target"');
    drone.setAttribute('cx', cx); drone.setAttribute('cy', cy);
    tgt.setAttribute('cx', tx); tgt.setAttribute('cy', air ? ty : ty - 12);
    drone.setAttribute('aria-label', T.aria.drone); drone.setAttribute('aria-valuenow', Math.round(state.h)); drone.setAttribute('aria-valuetext', fill(T.scene.h, Math.round(state.h)));
    tgt.setAttribute('aria-label', T.aria.target); tgt.setAttribute('aria-valuenow', Math.round(state.gr)); tgt.setAttribute('aria-valuetext', fill(T.scene.slant, Math.round(d.sr)) + ', ' + fill(T.scene.px, num(d.px)));
    hit('data-act="sun"').setAttribute('aria-label', T.aria.sun + ': ' + (state.night ? T.scene.tapDay : T.scene.tapNight));
    hit('data-act="cloud"').setAttribute('aria-label', T.aria.cloud);
    ['camera', 'carrier', 'board'].forEach((k) => hit('data-act="' + k + '"').setAttribute('aria-label', T.aria[k] + ': ' + T[k][state[k]]));
    svg.setAttribute('aria-label', T.aria.scene);
  }

  function face(kind) {
    const col = { ok: MINT, meh: YEL, no: PINK, x: GREY }[kind];
    const mouth = { ok: 'M14,25 q8,8 16,0', meh: 'M14,27 l16,0', no: 'M14,29 q8,-8 16,0', x: 'M14,29 q8,-7 16,0' }[kind];
    const eyes = kind === 'x'
      ? '<path d="M11,13 l8,8 M19,13 l-8,8 M25,13 l8,8 M33,13 l-8,8" stroke="' + col + '" stroke-width="2.4" stroke-linecap="round"/>'
      : '<circle cx="15" cy="17" r="2.2" fill="' + col + '"/><circle cx="29" cy="17" r="2.2" fill="' + col + '"/>';
    return '<svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19" fill="' + col + '" fill-opacity=".16" stroke="' + col + '" stroke-width="2.4"/>' + eyes +
      '<path d="' + mouth + '" fill="none" stroke="' + col + '" stroke-width="2.4" stroke-linecap="round"/></svg>';
  }

  function words() {
    const T = TEXT[lang], d = L.derive(state), v = L.verdict(state);
    root.querySelector('.lim-hint').textContent = T.hint;
    root.querySelector('.lim-who').innerHTML = L.judge(state).map((c) =>
      '<div class="lim-p ' + c.status + '" role="listitem" aria-label="' + esc(T.name[c.id] + ': ' + T.why[c.why]) + '">' + face(c.status) + '<b>' + esc(T.name[c.id]) + '</b><span>' + esc(T.why[c.why]) + '</span></div>').join('');
    root.querySelector('.lim-who').setAttribute('aria-label', T.aria.who);
    const key = v.key === 'shed' && d.target === 'air' ? 'shedAir' : v.key;
    root.querySelector('.lim-say').textContent = T.verdict[key].replace('{name}', v.name ? T.name[v.name].replace(/^./, (ch) => ch.toUpperCase()) : '');
    root.querySelector('.lim-legend').innerHTML = [['a', MINT], ['b', YEL], ['c', PINK], ['d', GREY]].map((q) => '<span><i style="background:' + q[1] + '"></i>' + esc(T.legend[q[0]]) + '</span>').join('');
    root.querySelector('.lim-foot').textContent = T.foot;
    const flip = root.querySelector('.lim-lang'); flip.textContent = T.other; flip.setAttribute('aria-label', T.aria.lang);
    root.setAttribute('lang', lang);
  }

  function update(patch) {
    state = L.clamp(Object.assign({}, state, patch || {}));
    draw(); words();
  }

  function press(what) {
    if (what === 'sun') return update({ night: !state.night });
    const key = what === 'cloud' ? 'air' : what, list = NEXT[key];
    update({ [key]: list[(list.indexOf(state[key]) + 1) % list.length] });
  }

  // dragging: the pointer is followed on the whole picture, so a redraw under the finger breaks nothing
  let dragging = null;
  const toWorld = (e) => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(svg.getScreenCTM().inverse());
    return { gr: (q.x - X0) / K, h: (GROUND - q.y) / K };
  };
  const follow = (e) => {
    const w = toWorld(e);
    if (dragging === 'drone') update({ h: w.h });
    else update({ gr: w.gr, alt: w.h < 8 ? 0 : w.h });      // close to the ground it snaps back onto it
  };
  svg.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('[data-drag]');
    if (!t) return;
    dragging = t.dataset.drag; svg.setPointerCapture(e.pointerId); svg.classList.add('lim-dragging'); e.preventDefault();
  });
  svg.addEventListener('pointermove', (e) => { if (dragging) follow(e); });
  ['pointerup', 'pointercancel'].forEach((n) => svg.addEventListener(n, () => { dragging = null; svg.classList.remove('lim-dragging'); }));
  root.querySelectorAll('[data-drag]').forEach((el) => el.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false }));

  svg.addEventListener('click', (e) => { const t = e.target.closest('[data-act]'); if (t) press(t.dataset.act); });
  svg.addEventListener('keydown', (e) => {
    const t = e.target.closest('.lim-hit'); if (!t) return;
    if (t.dataset.act && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); return press(t.dataset.act); }
    const step = e.shiftKey ? 4 : 1, dir = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowRight: [1, 0], ArrowLeft: [-1, 0] }[e.key];
    if (!dir || !t.dataset.drag) return;
    e.preventDefault();
    if (t.dataset.drag === 'drone') update({ h: state.h + dir[1] * 5 * step });
    else update({ gr: state.gr + dir[0] * 10 * step, alt: Math.max(0, state.alt + dir[1] * 10 * step) });
  });
  root.querySelector('.lim-lang').addEventListener('click', () => { lang = lang === 'uk' ? 'en' : 'uk'; update(); });

  update();
})();
