# Limits first: where the numbers come from

The toy on the front page is a rough model. Every number in it is a round, neutral one and none describes a
real product. The arithmetic is in `model.js`, the tests in `test.mjs`: `node --test limits/test.mjs`.

## Optics and air

| What | Value | Source |
|---|---|---|
| pixels on target | `px = f · L / SR` | chapter 5 of the roadmap |
| thresholds 2, 4, 8, 16, 32 px | detect, dot, small object, object, detail | Johnson's criteria and the table "Pixels choose the method" in chapter 5 |
| contrast in haze and fog | `C = exp(−3.912 · SR / V)`, V = 20 km, 4 km, 400 m | Koschmieder's law, chapter 2 |
| blur | `(v / SR + ω) · t · f` | chapter 2 |
| plain camera | 1920 × 1080, 60°, 1/1000 s | a neutral example |
| thermal camera | 640 × 512, 50°, 1/100 s | a neutral example; the long time stands for the slow response of a microbolometer |
| targets | 1.8 m on the ground, 0.35 m in the air | the example vehicle of the roadmap; a small quadcopter |

## Hardware

The budget is how many times a second a small detector (a nano model, 640 px input) runs on one tile.

| Class | Budget | Where it comes from |
|---|---|---|
| weak: a processor, no accelerator | 15 | measured: 67 ms per image with NCNN on a single-board computer, [Ultralytics deployment guides](https://docs.ultralytics.com/guides) |
| medium: a neural accelerator | 40 | an estimate between the two measured classes; vendors of such chips quote from 20 to over 100 |
| strong: a graphics module | 200 | measured: 1.4 to 4.6 ms per image with TensorRT FP16, [Ultralytics deployment guides](https://docs.ultralytics.com/guides) |

The weights of the candidates against that small detector are estimates by size, not measurements:
the big open-vocabulary model 40, the mask network 0.4, frame differencing 0.05. Tiles multiply the cost
by six for the plain camera. A carrier in flight needs 6 frames per second, a tower needs 2.
