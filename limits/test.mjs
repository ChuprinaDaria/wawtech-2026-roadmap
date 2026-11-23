// The model of the "limits first" toy, checked without a browser:  node --test limits/test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const L = require('./model.js');
const T = require('./text.js');

const base = { camera: 'plain', carrier: 'fly', board: 'mid', night: false, air: 'clear', h: 100, gr: 400, alt: 0 };
const st = (over) => ({ ...base, ...over });
const by = (list) => Object.fromEntries(list.map((c) => [c.id, c]));
const alive = (list) => list.filter((c) => c.status === 'ok' || c.status === 'meh').map((c) => c.id);

test('the typical state: two hopeless, two short of pixels, the mask lives, motion shakes', () => {
  const list = L.judge(base);
  assert.deepEqual(list.map((c) => c.id), ['gpt', 'dino', 'yolo', 'tiles', 'mask', 'motion']);
  assert.deepEqual(list.map((c) => c.status), ['x', 'x', 'no', 'no', 'ok', 'meh']);
  assert.deepEqual(list.map((c) => c.why), ['never', 'board', 'px', 'px', 'ok', 'shaky']);
});

test('the numbers behind the typical state', () => {
  const d = L.derive(base);
  assert.equal(Math.round(d.focal), 1663);
  assert.equal(Math.round(d.sr), 412);
  assert.equal(d.px.toFixed(1), '7.3');
  assert.equal(d.pxIn.toFixed(1), '2.4');   // the whole frame is squeezed three times
  assert.equal(Math.round(d.angle), 76);
  assert.equal(d.target, 'ground');
});

test('at night the plain camera leaves nobody alive, the thermal one does not care', () => {
  assert.deepEqual(alive(L.judge(st({ night: true }))), []);
  assert.equal(by(L.judge(st({ night: true }))).mask.why, 'night');
  assert.ok(alive(L.judge(st({ night: true, camera: 'thermal', carrier: 'tower', h: 30, gr: 80 }))).length > 0);
});

test('the chat model is dead whatever you choose', () => {
  for (const camera of ['plain', 'thermal']) for (const carrier of ['fly', 'tower']) for (const board of ['weak', 'mid', 'strong']) {
    const gpt = by(L.judge(st({ camera, carrier, board, h: 30, gr: 30 }))).gpt;
    assert.deepEqual([gpt.status, gpt.why], ['x', 'never']);
  }
});

test('the big model is hopeless on weak and middle hardware, and alive on a strong tower up close', () => {
  assert.equal(by(L.judge(st({ board: 'weak' }))).dino.status, 'x');
  assert.equal(by(L.judge(st({ board: 'mid' }))).dino.status, 'x');
  assert.equal(by(L.judge(st({ board: 'strong', carrier: 'tower', h: 20, gr: 20 }))).dino.status, 'ok');
  assert.equal(by(L.judge(st({ board: 'strong', carrier: 'tower', h: 30, gr: 300 }))).dino.status, 'no');
});

test('the thermal camera smears on a flying carrier far away, not close and never on a tower', () => {
  const far = st({ camera: 'thermal', h: 100, gr: 283 });
  assert.equal(by(L.judge(far)).mask.why, 'blur');
  assert.notEqual(by(L.judge(st({ camera: 'thermal', h: 100, gr: 20 }))).mask.why, 'blur');
  assert.equal(L.derive(st({ camera: 'thermal', carrier: 'tower', h: 30 })).blur, 0);
});

test('fog at four hundred metres kills everyone', () => {
  assert.deepEqual(alive(L.judge(st({ air: 'fog' }))), []);
  assert.ok(L.derive(st({ air: 'fog' })).contrast < 0.05);
  assert.ok(L.derive(st({ air: 'haze' })).contrast > 0.6);
});

test('lift the target and it becomes a small drone', () => {
  const d = L.derive(st({ alt: 60 }));
  assert.deepEqual([d.target, d.size], ['air', 0.35]);
  assert.equal(L.derive(st({ alt: 3 })).target, 'ground');
  assert.ok(L.derive(st({ alt: 250, h: 50 })).angle > 90);   // the camera looks up
});

test('the rings: where a target still gets 16, 8 and 2 pixels', () => {
  assert.deepEqual(L.rings(base).map(Math.round), [187, 374, 1496]);
  assert.deepEqual(L.rings(st({ camera: 'thermal' })).map(Math.round), [77, 154, 618]);
  assert.deepEqual(L.rings(st({ alt: 60 })).map(Math.round), [36, 73, 291]);
});

test('the frame is a cone around the line to the target', () => {
  const c = L.cone(base);
  assert.ok(c.lo < 76 && c.hi > 76 && Math.round(c.hi - c.lo) === 36);
});

test('the state stays inside the scene and inside what the carrier can do', () => {
  assert.equal(L.clamp(st({ carrier: 'tower', h: 200 })).h, 50);
  assert.equal(L.clamp(st({ carrier: 'tower', h: 1 })).h, 5);
  assert.equal(L.clamp(st({ h: 5 })).h, 20);
  assert.deepEqual([L.clamp(st({ gr: 900 })).gr, L.clamp(st({ gr: 0 })).gr, L.clamp(st({ alt: 999 })).alt, L.clamp(st({ alt: -5 })).alt], [600, 20, 300, 0]);
});

test('one verdict for every situation', () => {
  const key = (over) => L.verdict(st(over)).key;
  assert.equal(key({ night: true }), 'night');
  assert.equal(key({ air: 'fog' }), 'fog');
  assert.equal(key({ camera: 'thermal', h: 200, gr: 600 }), 'johnson');
  assert.equal(key({ camera: 'thermal', h: 100, gr: 283 }), 'smear');
  assert.deepEqual(L.verdict(st({ board: 'weak', gr: 250 })), { key: 'board', name: 'tiles' });
  assert.equal(key({ camera: 'thermal', carrier: 'tower', h: 30, gr: 350 }), 'dot');
  assert.equal(key({}), 'noclass');
  assert.equal(key({ gr: 250 }), 'shed');
  assert.equal(key({ carrier: 'tower', board: 'strong', h: 30, gr: 30 }), 'fine');
});

test('both languages have the same words', () => {
  const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v, p + k + '.') : [p + k]));
  assert.deepEqual(keys(T.uk).sort(), keys(T.en).sort());
  for (const lang of [T.uk, T.en]) {
    for (const id of ['gpt', 'dino', 'yolo', 'tiles', 'mask', 'motion']) assert.ok(lang.name[id]);
    for (const why of ['never', 'board', 'px', 'night', 'fog', 'blur', 'ok', 'shaky']) assert.ok(lang.why[why]);
    for (const key of ['night', 'fog', 'johnson', 'smear', 'board', 'dot', 'noclass', 'shed', 'fine']) assert.ok(lang.verdict[key]);
  }
});
