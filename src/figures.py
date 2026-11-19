"""Figures for the "pixels on target" pages. Every number in them is computed here; nothing is typed by hand.

One model for all of them: a pinhole camera over flat ground.
  u, v   a pixel, counted from the centre of the frame: u to the right, v down
  ONA    the angle of the camera axis from straight down (0 = nadir, 90 = the horizon)
  px     = f * L / Z, where Z is the distance to the target along the camera axis
The example camera has a 60 degree horizontal field of view and a 1280 x 720 frame.
The example target is a vehicle 4.5 m long and 1.8 m wide.
"""
import math

W, HPX, HFOV = 1280, 720, 60.0
F = (W / 2) / math.tan(math.radians(HFOV / 2))            # focal length in pixels
HALF_V = math.degrees(math.atan((HPX / 2) / F))           # half of the vertical field of view
LONG, NARROW = 4.5, 1.8                                   # the target side-on and nose-on, metres
DOT, SMALL = 8, 16                                        # px on the narrow side: below DOT a dot, from SMALL an object
MINT, PINK, VIOLET, DIM, PAPER, PANEL = '#02feb9', '#ff00aa', '#9d96ff', '#a39bbd', '#fdfdfb', '#170a2c'
SIDE = dict(h=90.0, ona=55.0)
BRICKS = dict(h=50.0, ona=70.0, roll=15.0)
MINIS = dict(h=50.0, ona1=75.0, ona2=45.0, roll=20.0)


def ray(u, v, h, ona, roll=0.0):
    """A pixel -> (pixels per metre of target, slant range in metres), or None when the ray never reaches the ground."""
    t, r = math.radians(ona), math.radians(roll)
    down = v * math.cos(r) + u * math.sin(r)              # how far down the pixel is once the roll is undone
    k = F * math.cos(t) + down * math.sin(t)              # F times the cosine of this ray's own angle from nadir
    if k <= 0:
        return None
    return k / h, h * math.sqrt(u * u + v * v + F * F) / k


def row(px, h, ona):
    """The row of the centre column where the narrow side of the target is px wide."""
    t = math.radians(ona)
    return (px * h / NARROW - F * math.cos(t)) / math.sin(t)


def ground(v, h, ona):
    """Centre column, row v -> (angle of the ray from nadir, ground range, slant range, pixels per metre)."""
    ppm, sr = ray(0, v, h, ona)
    a = ona - math.degrees(math.atan(v / F))
    return a, h * math.tan(math.radians(a)), sr, ppm


def reach(px, h, ona):
    """The farthest ground range inside the frame where the narrow side still has px pixels."""
    v = max(-HPX / 2, row(px, h, ona))
    return None if v > HPX / 2 else ground(v, h, ona)[1]


def colour(ppm):
    px = NARROW * ppm
    return PINK if px < DOT else VIOLET if px < SMALL else MINT


def num(x, comma):
    s = f'{x:.1f}' if x < 9.95 else f'{x:.0f}'
    s = s[:-2] if s.endswith('.0') else s
    return s.replace('.', ',') if comma else s


def span(ppm, L):
    return f'{num(NARROW * ppm, L["comma"])}…{num(LONG * ppm, L["comma"])}'


def frame(L, h, ona, roll=0.0, cols=8, rows=5, numbers=True):
    """The frame cut into bricks, each coloured by the worst view of the target at its centre."""
    cw, ch = W / cols, HPX / rows
    g = 2 if numbers else 7                                # the gap around a brick
    t, r = math.radians(ona), math.radians(roll)
    c = -F / math.tan(t)                                   # the horizon: every pixel that is this far "down"
    out = [f'<svg viewBox="0 0 {W} {HPX}"><rect width="{W}" height="{HPX}" fill="{PANEL}"/>']
    for j in range(rows):
        for i in range(cols):
            x, y = i * cw, j * ch
            u, v = x + cw / 2 - W / 2, y + ch / 2 - HPX / 2
            hit = ray(u, v, h, ona, roll)
            box = f'x="{x + g:.0f}" y="{y + g:.0f}" width="{cw - 2 * g:.0f}" height="{ch - 2 * g:.0f}"'
            cx, cy = x + cw / 2, y + ch / 2
            text = numbers and abs(v * math.cos(r) + u * math.sin(r) - c) > 52   # the horizon line would cross the label
            if hit is None:
                out.append(f'<rect {box} fill="{PAPER}" fill-opacity=".045"/>')
                if text:
                    out.append(f'<text x="{cx:.0f}" y="{cy + 7:.0f}" text-anchor="middle" font-size="19" fill="{DIM}">{L["sky"]}</text>')
                continue
            ppm, sr = hit
            out.append(f'<rect {box} fill="{colour(ppm)}" fill-opacity=".24"/>')
            if text:
                out.append(f'<text x="{cx:.0f}" y="{cy - 2:.0f}" text-anchor="middle" font-size="26" font-weight="500" fill="{PAPER}">{span(ppm, L)}</text>')
                out.append(f'<text x="{cx:.0f}" y="{cy + 30:.0f}" text-anchor="middle" font-size="18" fill="{DIM}">SR {sr:.0f} {L["m"]}</text>')
    (x1, y1), (x2, y2) = [(u + W / 2, (c - u * math.sin(r)) / math.cos(r) + HPX / 2) for u in (-W / 2, W / 2)]
    if min(y1, y2) < HPX and max(y1, y2) > 0:
        out.append(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="{PAPER}" stroke-width="{4 if numbers else 10}"/>')
    return ''.join(out) + '</svg>'


def key(L):
    return ('<p class="key">' + ''.join(f'<span><i style="background:{c};opacity:{o}"></i>{t}</span>'
            for c, o, t in zip((PINK, VIOLET, MINT, PAPER), ('.6', '.6', '.6', '.12'), L['key'])) +
            f'<span><i class="hz"></i>{L["horizon"]}</span></p>')


def side(L):
    """The same camera from the side, to scale: three rays of the centre column and where the thresholds fall."""
    h, ona = SIDE['h'], SIDE['ona']
    bot, mid, top = ground(HPX / 2, h, ona), ground(0, h, ona), ground(-HPX / 2, h, ona)
    x0, yg = 13.0, 39.0
    s = 107.0 / top[1]                                     # millimetres per metre, the same in both directions
    yd = yg - h * s
    X = lambda gr: x0 + gr * s
    m, com = L['m'], L['comma']
    o = ['<svg viewBox="0 0 126 55.5">',
         f'<polygon points="{x0},{yd:.2f} {X(bot[1]):.2f},{yg} {X(top[1]):.2f},{yg}" fill="{PAPER}" fill-opacity=".06"/>',
         f'<line x1="3" y1="{yg}" x2="124" y2="{yg}" stroke="{DIM}" stroke-width=".2"/>',
         f'<line x1="{x0}" y1="{yd:.2f}" x2="{x0}" y2="{yg}" stroke="{DIM}" stroke-width=".2" stroke-dasharray=".8 .8"/>',
         f'<text x="{x0 - 1.6}" y="{(yd + yg) / 2 + 3:.2f}" text-anchor="end" font-size="1.9" fill="{PAPER}">H {h:.0f} {m}</text>']
    for g, w, c in ((bot, .22, DIM), (top, .22, DIM), (mid, .4, PAPER)):
        o.append(f'<line x1="{x0}" y1="{yd:.2f}" x2="{X(g[1]):.2f}" y2="{yg}" stroke="{c}" stroke-width="{w}"/>')
    # the ground inside the frame, coloured the same way as the bricks
    cuts = [bot[1]] + [ground(min(HPX / 2, max(-HPX / 2, row(p, h, ona))), h, ona)[1] for p in (SMALL, DOT)] + [top[1]]
    for (a, b), c in zip(zip(cuts, cuts[1:]), (MINT, VIOLET, PINK)):
        if b > a:
            o.append(f'<line x1="{X(a):.2f}" y1="{yg}" x2="{X(b):.2f}" y2="{yg}" stroke="{c}" stroke-width="1.1"/>')
    for p, gr in ((SMALL, cuts[1]), (DOT, cuts[2])):
        if bot[1] < gr < top[1]:
            o.append(f'<line x1="{X(gr):.2f}" y1="{yg - 1.5}" x2="{X(gr):.2f}" y2="{yg + 1.7}" stroke="{PAPER}" stroke-width=".25"/>')
            o.append(f'<text x="{X(gr):.2f}" y="{yg + 4.4}" text-anchor="middle" font-size="1.75" fill="{PAPER}">{p} px · GR {gr:.0f} {m}</text>')
    # the angle from nadir to the axis
    R, t = 8.0, math.radians(ona)
    o.append(f'<path d="M{x0},{yd + R:.2f} A{R},{R} 0 0 0 {x0 + R * math.sin(t):.2f},{yd + R * math.cos(t):.2f}" fill="none" stroke="{MINT}" stroke-width=".3"/>')
    o.append(f'<text x="{x0 - 1.6}" y="{yd + R + .7:.2f}" text-anchor="end" font-size="1.9" fill="{MINT}">ONA {ona:.0f}°</text>')
    o.append(f'<circle cx="{x0}" cy="{yd:.2f}" r=".95" fill="{PAPER}"/>')
    o.append(f'<text x="{x0}" y="{yd - 2:.2f}" text-anchor="middle" font-size="1.75" fill="{DIM}">{L["cam"]}</text>')
    # what each of the three rays gives
    for g, name, anchor in ((bot, L['bottom'], 'end'), (mid, L['axis'], 'middle'), (top, L['top'], 'end')):
        x, y = X(g[1]), yg + 9.2
        if g is mid:
            o.append(f'<line x1="{x:.2f}" y1="{yg}" x2="{x:.2f}" y2="{y - 2.3:.2f}" stroke="{DIM}" stroke-width=".15"/>')
        o.append(f'<text x="{x:.2f}" y="{y:.2f}" text-anchor="{anchor}" font-size="1.95" fill="{PAPER}">{name}</text>')
        o.append(f'<text x="{x:.2f}" y="{y + 2.7:.2f}" text-anchor="{anchor}" font-size="1.7" fill="{DIM}">ONA {g[0]:.0f}° · SR {g[2]:.0f} {m} · GR {g[1]:.0f} {m}</text>')
        o.append(f'<text x="{x:.2f}" y="{y + 5.5:.2f}" text-anchor="{anchor}" font-size="1.95" font-weight="500" fill="{colour(g[3])}">{span(g[3], L)} px</text>')
    cap = L['side_cap'].format(h=f'{h:.0f}', ona=f'{ona:.0f}', hfov=f'{HFOV:.0f}', w=W, long=num(LONG, com), narrow=num(NARROW, com))
    return f'<div class="fig">{"".join(o)}</svg><p class="cap">{cap}</p></div>'


def bricks(L):
    b = BRICKS
    cap = L['bricks_cap'].format(h=f'{b["h"]:.0f}', ona=f'{b["ona"]:.0f}', roll=f'{b["roll"]:.0f}')
    return f'<div class="fig">{frame(L, **b)}{key(L)}<p class="cap">{cap}</p></div>'


def minis(L):
    q = MINIS
    n = dict(ona1=f'{q["ona1"]:.0f}', ona2=f'{q["ona2"]:.0f}', roll=f'{q["roll"]:.0f}',
             dot=f'{reach(DOT, q["h"], q["ona1"]):.0f}', small=f'{reach(SMALL, q["h"], q["ona1"]):.0f}',
             end=f'{ground(-HPX / 2, q["h"], q["ona2"])[1]:.0f}')
    views = (dict(ona=q['ona1']), dict(ona=q['ona2']), dict(ona=q['ona1'], roll=q['roll']))
    cells = ''.join(f'<div>{frame(L, q["h"], numbers=False, **v)}<p><b>{t.format(**n)}</b>{x.format(**n)}</p></div>'
                    for v, (t, x) in zip(views, L['minis']))
    return f'<div class="minis">{cells}</div>'


FIGS = dict(side=side, bricks=bricks, minis=minis)


if __name__ == '__main__':                                 # the numbers the text quotes: run this after changing the example
    for h, ona in ((100, 60), (100, 30), (100, 0)):
        ppm, sr = ray(0, 0, h, ona)
        print(f'H {h} m, ONA {ona}: SR {sr:.0f} m, nose-on {NARROW * ppm:.1f} px, side-on {LONG * ppm:.1f} px')
    print('f =', round(F, 1), 'px; vertical field of view', round(2 * HALF_V, 1), 'deg')
    print('range for 8 / 16 / 32 px on the narrow side:', [round(F * NARROW / p) for p in (8, 16, 32)], 'm')
    for k, v in (('side', SIDE), ('bricks', BRICKS), ('minis', MINIS)): print(k, v)
    q = MINIS
    print('minis: dot', round(reach(DOT, q['h'], q['ona1'])), 'small', round(reach(SMALL, q['h'], q['ona1'])), 'end', round(ground(-HPX / 2, q['h'], q['ona2'])[1]),
          '| tilted-down top row px', round(NARROW * ray(0, -288, q['h'], q['ona2'])[0], 1), '| axis px', round(NARROW * ray(0, 0, q['h'], q['ona1'])[0], 1), round(NARROW * ray(0, 0, q['h'], q['ona2'])[0], 1))
