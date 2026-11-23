/* The model behind the "limits first" toy: arithmetic and rules, no drawing.
   Every number is a neutral round one; none describes a real product. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Limits = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // input: the side of the square a whole-frame detector squeezes the frame into; tiles: 640 px pieces per frame
  const CAMERAS = {
    plain:   { width: 1920, height: 1080, hfov: 60, input: 640, tiles: 6, exposure: 1 / 1000, night: false, hazeGain: 1 },
    thermal: { width: 640,  height: 512,  hfov: 50, input: 640, tiles: 1, exposure: 1 / 100,  night: true,  hazeGain: 2 },
  };
  // speed in m/s, shake in degrees per second, needFps: frames per second the job needs
  const CARRIERS = {
    fly:   { speed: 15, shake: 20, needFps: 6, hMin: 20, hMax: 300 },
    tower: { speed: 0,  shake: 0,  needFps: 2, hMin: 5,  hMax: 50 },
  };
  // how many times a second a small detector runs on one tile
  const BOARDS = { weak: 8, mid: 40, strong: 100 };
  const AIR = { clear: 20000, haze: 4000, fog: 400 };            // meteorological visibility, metres
  const TARGET = { ground: 1.8, air: 0.35, airFrom: 5 };         // narrow side in metres; above airFrom it flies
  const SCENE = { range: 600, ceiling: 300, nearest: 20 };
  const MIN_CONTRAST = 0.15;

  // px: pixels the method needs; squeezed: it sees the whole frame squeezed; cost: against one small detector
  const CANDIDATES = [
    { id: 'gpt', never: true },
    { id: 'dino', px: 32, squeezed: true, cost: 40, boards: ['strong'] },
    { id: 'yolo', px: 16, squeezed: true, cost: 1 },
    { id: 'tiles', px: 8, cost: 1, tiled: true },
    { id: 'mask', px: 4, cost: 0.4, tiled: true },
    { id: 'motion', px: 2, cost: 0.05, shaky: true },
  ];

  const rad = (deg) => deg * Math.PI / 180;
  const focal = (cam) => (cam.width / 2) / Math.tan(rad(cam.hfov / 2));
  const between = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  function clamp(s) {
    const car = CARRIERS[s.carrier];
    return Object.assign({}, s, {
      h: between(s.h, car.hMin, car.hMax),
      gr: between(s.gr, SCENE.nearest, SCENE.range),
      alt: between(s.alt, 0, SCENE.ceiling),
    });
  }

  function derive(s) {
    const cam = CAMERAS[s.camera], car = CARRIERS[s.carrier], f = focal(cam);
    const target = s.alt >= TARGET.airFrom ? 'air' : 'ground';
    const size = TARGET[target];
    const drop = s.h - s.alt;                                   // how far below the camera the target is
    const sr = Math.max(5, Math.hypot(s.gr, drop));             // slant range
    const px = f * size / sr;
    const visibility = AIR[s.air] * (s.air === 'haze' ? cam.hazeGain : 1);
    return {
      target, size, sr, px, focal: f,
      pxIn: px * Math.min(1, cam.input / cam.width),
      contrast: Math.exp(-3.912 * sr / visibility),
      blur: (car.speed / sr + rad(car.shake)) * cam.exposure * f,
      angle: Math.atan2(s.gr, drop) * 180 / Math.PI,            // from straight down; above 90 the camera looks up
      needFps: car.needFps,
    };
  }

  // the first stage a candidate fails at, or null
  function fails(c, s, d) {
    if (c.never) return 'never';
    const cam = CAMERAS[s.camera];
    if ((c.squeezed ? d.pxIn : d.px) < c.px) return 'px';
    if (s.night && !cam.night) return 'night';
    if (d.contrast < MIN_CONTRAST) return 'fog';
    if (d.blur > d.px / 2) return 'blur';
    if (c.boards && c.boards.indexOf(s.board) < 0) return 'board';
    if (BOARDS[s.board] / (c.cost * (c.tiled ? cam.tiles : 1)) < d.needFps) return 'board';
    return null;
  }

  // with this camera, carrier and hardware: is there any place and any weather where it lives?
  function hopeless(c, s) {
    if (c.never) return true;
    const car = CARRIERS[s.carrier];
    const heights = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => car.hMin + t * (car.hMax - car.hMin));
    for (const h of heights) for (const gr of [20, 40, 80, 150, 250, 400, 600]) for (const alt of [0, 10, 50, 150, 300]) for (const night of [false, true]) {
      const t = Object.assign({}, s, { h, gr, alt, night, air: 'clear' });
      if (!fails(c, t, derive(t))) return false;
    }
    return true;
  }

  function judge(s) {
    const d = derive(s);
    return CANDIDATES.map((c) => {
      const stage = fails(c, s, d);
      if (!stage) return c.shaky && s.carrier === 'fly' ? { id: c.id, status: 'meh', why: 'shaky', stage: null } : { id: c.id, status: 'ok', why: 'ok', stage: null };
      if (hopeless(c, s)) return { id: c.id, status: 'x', why: c.never ? 'never' : 'board', stage };
      return { id: c.id, status: 'no', why: stage, stage };
    });
  }

  function verdict(s) {
    const d = derive(s), list = judge(s);
    const living = list.filter((c) => c.status === 'ok' || c.status === 'meh');
    if (s.night && !CAMERAS[s.camera].night) return { key: 'night' };
    if (d.contrast < MIN_CONTRAST) return { key: 'fog' };
    if (d.px < 2) return { key: 'johnson' };
    if (!living.length && list.some((c) => c.stage === 'blur')) return { key: 'smear' };
    const slow = list.find((c) => c.stage === 'board');
    if (slow) return { key: 'board', name: slow.id };
    if (d.px < 4) return { key: 'dot' };
    if (d.px < 8) return { key: 'noclass' };
    if (d.px < 16) return { key: 'shed' };
    return { key: 'fine' };
  }

  // slant ranges at which the target still gets 16, 8 and 2 pixels
  function rings(s) {
    const d = derive(s);
    return [16, 8, 2].map((p) => d.focal * d.size / p);
  }

  // the two edges of the frame, as angles from straight down
  function cone(s) {
    const cam = CAMERAS[s.camera], d = derive(s);
    const half = Math.atan((cam.height / 2) / d.focal) * 180 / Math.PI;
    return { lo: d.angle - half, hi: d.angle + half };
  }

  return { CAMERAS, CARRIERS, BOARDS, AIR, TARGET, SCENE, CANDIDATES, clamp, derive, judge, verdict, rings, cone };
});
