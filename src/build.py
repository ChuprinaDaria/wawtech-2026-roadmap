"""Build the roadmap: text_<lang>.py + resources -> out/roadmap-<lang>.html -> ../roadmap-<lang>.pdf
Usage: python3 build.py en [uk]"""
import html, importlib, json, re, subprocess, sys
from pathlib import Path
import figures, scenes

ROOT = Path(__file__).parent
KEYS = ('id', 'url', 'title', 'provider', 'cost', 'hours', 'level', 'lang')
RES = {r[0]: dict(zip(KEYS, r)) for m in ('resources_core', 'resources_hw') for r in importlib.import_module(m).R}
SIL = json.load(open(ROOT / 'img/silhouette.json'))
e = html.escape
SEEN = set()


def rich(s):
    """Text with `code` and [label](#anchor or resource id) -> HTML."""
    s = e(s, quote=False)
    s = re.sub(r'`([^`]+)`', r'<span class="mono" style="font-size:.88em">\1</span>', s)
    def link(m):
        label, target = m.group(1), m.group(2)
        url = target if target.startswith(('#', 'http')) else RES[target]['url']
        if target in RES: SEEN.add(target)
        return f'<a class="in" href="{e(url)}">{label}</a>'
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)', link, s)


class Doc:
    def __init__(self, lang):
        self.T = importlib.import_module(f'text_{lang}')
        self.M, self.lang, self.pages, self.used, self.scenes = self.T.META, lang, [], [], None

    # ---- pieces
    def meta_line(self, r):
        bits = [r['provider'], self.T.hours(r['hours']), self.M['level'].get(r['level'], ''), self.M['langs'].get(r['lang'], '')]
        return ' \u00b7 '.join(e(b) for b in bits if b)

    def res(self, rid, note, start=False):
        r = RES[rid]; self.used.append(rid)
        tag = f'<span class="tag">{e(self.M["ui"]["start"])}</span>' if start else ''
        return (f'<a class="res{" start" if start else ""}" href="{e(r["url"])}">{tag}'
                f'<span class="cost {r["cost"]}">{e(self.M["cost"][r["cost"]])}</span>'
                f'<span><span class="t">{e(r["title"])}</span><span class="prov">{self.meta_line(r)}</span>'
                f'<span class="note">{rich(note)}</span></span><span class="go mono">↗</span></a>')

    def multi(self, title, prov, cost, links, note):
        ls = ' · '.join(f'<a class="in" href="{e(RES[i]["url"])}">{e(l)}</a>' for l, i in links)
        self.used += [i for _, i in links]
        return (f'<div class="res"><span class="cost {cost}">{e(self.M["cost"][cost])}</span>'
                f'<span><span class="t">{e(title)}</span><span class="prov">{e(prov)}</span>'
                f'<span class="note">{rich(note)} {ls}</span></span><span class="go mono"></span></div>')

    def block(self, b):
        k, ui = b[0], self.M['ui']
        if k == 'why': return f'<p class="why">{rich(b[1])}</p>'
        if k == 'p': return f'<p class="p">{rich(b[1])}</p>'
        if k == 'small': return f'<p class="small">{rich(b[1])}</p>'
        if k == 'h2': return f'<h2>{e(b[1])}</h2>'
        if k == 'list':
            out = ['<div class="reslist">']
            for it in b[1]:
                if it[0] == 'multi': out.append(self.multi(*it[1:]))
                else: out.append(self.res(it[1], it[2], start=it[0] == 'start'))
            return ''.join(out) + '</div>'
        if k == 'also':
            self.used += [i for _, i in b[1]]
            return (f'<p class="also"><span class="mono">{e(ui["also"])}</span>'
                    + ' · '.join(f'<a href="{e(RES[i]["url"])}">{e(l)}</a>' for l, i in b[1]) + '</p>')
        if k == 'box': return f'<div class="box {b[1]}"><span class="tag">{e(b[2])}</span>{rich(b[3])}</div>'
        if k == 'home': return f'<div class="box"><span class="tag">{e(ui["home"])}</span>{rich(b[1])}</div>'
        if k == 'done': return f'<p class="done"><i></i><span><span class="mono lab">{e(ui["done"])}</span>{rich(b[1])}</span></p>'
        if k == 'traps': return '<div class="traps">' + ''.join(f'<div><i></i><span><b>{e(a)}.</b> {rich(t)}</span></div>' for a, t in b[1]) + '</div>'
        if k == 'steps': return '<ol class="steps">' + ''.join(f'<li><span>{rich(t)}</span></li>' for t in b[1]) + '</ol>'
        if k == 'legend':
            return '<div class="legend">' + ''.join(f'<div><span class="cost {c}">{e(self.M["cost"][c])}</span><span>{rich(t)}</span></div>' for c, t in b[1]) + '</div>'
        if k == 'projects':
            out = []
            for p in b[1]:
                see = ''.join(f'<a href="#ch{n:02d}">{n:02d}</a>' for n in p['see'])
                out.append(f'<div class="proj"><span class="n">{p["n"]}</span><div><b>{e(p["name"])}</b><dl>'
                           f'<dt>{e(ui["need"])}</dt><dd>{rich(p["need"])}</dd><dt>{e(ui["build"])}</dt><dd>{rich(p["build"])}</dd>'
                           f'<dt>{e(ui["proof"])}</dt><dd>{rich(p["proof"])}</dd><dt>{e(ui["see"])}</dt><dd>{see}</dd></dl></div></div>')
            return ''.join(out)
        if k == 'fig': return figures.FIGS[b[1]](self.T.FIG)
        if k == 'formula':
            return '<div class="formula">' + ''.join(f'<div><span>{e(a)}</span><span class="c">{rich(c)}</span></div>' for a, c in b[1]) + '</div>'
        if k == 'table':
            head = ''.join(f'<th>{e(h)}</th>' for h in b[2])
            rows = ''.join(f'<tr class="{cls}">' + ''.join(f'<td>{rich(c)}</td>' for c in cells) + '</tr>' for cls, cells in b[3])
            return f'<table class="t {b[1]}"><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table>'
        if k == 'faq':
            out = []
            for q, a, f in b[1]:
                self.qn += 1
                formula = f'<span class="f mono">{e(f)}</span>' if f else ''
                out.append(f'<div><i class="mono">{self.qn:02d}</i><span><b>{e(q)}</b><span class="a">{rich(a)}</span>{formula}</span></div>')
            return '<div class="faq">' + ''.join(out) + '</div>'
        if k == 'scene':                                               # a picture from the scene of the landing page
            if self.scenes is None: self.scenes = scenes.render(self.lang)
            spec, cells = scenes.SPECS[b[1]], []
            for i, p in enumerate(spec['panels']):
                r = self.scenes[f'{b[1]}{i}']
                if spec.get('who'): cells.append(f'<div class="row"><div class="pic">{r["svg"]}</div><div class="lim-who">{r["who"]}</div></div>')
                else: cells.append(f'<div class="{p.get("hush", "")}"><div class="pic">{r["svg"]}</div>' + (f'<p class="say">{r["say"]}</p>' if spec.get('say') else '') + '</div>')
            return (f'<figure class="scene n{len(cells)}{" who" if spec.get("who") else ""}{" side" if spec.get("side") else ""}"><div class="panels">{"".join(cells)}</div>'
                    f'<figcaption>{rich(b[2])}</figcaption></figure>')
        raise ValueError(k)

    def bar(self, current=None):
        ticks = ''.join(f'<a href="#ch{c["n"]:02d}" class="{"on" if c["n"] == current else ""}"></a>' for c in self.T.CHAPTERS)
        return f'<header class="bar mono"><a class="back" href="#map">← {e(self.M["map"])}</a><nav class="ticks">{ticks}</nav></header>'

    def page(self, body, pid='', cls='', current=None, bar=True):
        head = self.bar(current) if bar else ''
        ida = f' id="{pid}"' if pid else ''
        self.pages.append(f'<section class="page {cls}"{ida}>{head}<div class="content">{body}</div>'
                          f'<footer class="foot mono"><span>{e(self.M["foot"])}</span><span>{{PN}}</span></footer></section>')

    # ---- pages
    def cover(self):
        M = self.M; w = 100; h = w * SIL['h'] / SIL['w']
        pts = ' '.join(f'{SIL["w"] - x},{y}' for x, y in SIL['points'])   # mirrored: the gun points left, out from under the photo
        other = f'<a class="other mono" href="{e(M["other_url"])}">{e(M["other"])} ↗</a>' if M.get('other_url') else ''
        body = (f'<p class="kick mono">{e(M["kicker"])}</p>'
                f'<div class="hero"><div class="blob" style="width:{w + 8}mm;padding:4mm"><span class="tag">{e(M["cover_tag"].format(w=SIL["px"][0], h=SIL["px"][1]))}</span>'
                f'<svg viewBox="0 0 {SIL["w"]} {SIL["h"]}" style="width:{w}mm;height:{h:.1f}mm"><polygon points="{pts}" fill="#02feb9"/></svg></div>'
                f'<img class="me" src="../img/cover-frame.png" alt="{e(M["author"])}, I am going to WAWTech"></div>'
                f'<h1>{e(M["title"])}</h1><p class="sub">{e(M["subtitle"])}</p><p class="line">{e(M["cover_line"])}</p>'
                f'<div class="who">{e(M["author"])}<br>{e(M["role"])}<span class="mono">{e(M["version"])}</span></div>{other}')
        self.pages.append(f'<section class="page cover" id="cover"><div class="content">{body}</div></section>')

    def map(self):
        T = self.T; mm = lambda v: f'{v}mm'
        H, G = 12, 5.5
        ys = [10 + i * (H + G) for i in range(5)]                      # the chain, top to bottom
        chain = [5, 6, 7, 10, 12]
        boxes = {n: (42, y, 47, H, 'air') for n, y in zip(chain, ys)}
        boxes.update({8: (0, ys[1], 29, H, 'ground'), 9: (0, ys[2], 29, H, 'ground'), 13: (98, ys[3], 28, H, 'air'),
                      3: (0, 114, 40, H, 'base'), 4: (43, 114, 40, H, 'base'), 11: (86, 114, 40, H, 'base'),
                      15: (0, 134, 61.5, H, 'you'), 16: (64.5, 134, 61.5, H, 'you')})
        limits = 2 in T.MAP                                            # the chapter on limits sits on top of the ground column
        if limits: boxes[2] = (0, ys[0], 29, H, 'ground')
        out = []
        ar = lambda x1, y1, x2, y2: f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#a39bbd" stroke-width=".25" marker-end="url(#a)"/>'
        lines = [ar(65.5, ys[i] + H, 65.5, ys[i + 1] - .6) for i in range(4)] + [ar(65.5, ys[4] + H, 65.5, ys[4] + H + G - .6),
                 ar(14.5, ys[1] + H, 14.5, ys[2] - .6), ar(29, ys[2] + H / 2, 41.4, ys[2] + H / 2), ar(98, ys[3] + H / 2, 89.6, ys[3] + H / 2)]
        if limits: lines.append(ar(14.5, ys[0] + H, 14.5, ys[1] - .6))
        out.append(f'<svg viewBox="0 0 126 147"><defs><marker id="a" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#a39bbd"/></marker></defs>{"".join(lines)}</svg>')
        fy, fh = 2, ys[4] + H + G + 9 - 2
        out.append(f'<a class="frame" href="#ch14" style="left:39mm;top:{fy}mm;width:53mm;height:{fh}mm"><span class="tag">14 · {e(T.MAP[14][0].lower())}</span></a>')
        L = self.M['layers']
        for txt, x, y in ((L['air'], 42, 5.2), (L['ground'], 0, 5.2 if limits else ys[1] - 7.2), (L['base'], 0, 108.6), (L['you'], 0, 128.6)):
            out.append(f'<span class="lay" style="left:{x}mm;top:{y}mm">{e(txt)}</span>')
        F = T.FLOW
        for txt, x, y in ((F[0], 67.5, ys[0] + H + 1.6), (F[1], 67.5, ys[1] + H + 1.6), (F[2], 67.5, ys[2] + H + 1.6), (F[3], 67.5, ys[3] + H + 1.6), (F[4], 67.5, ys[4] + H + 1.6),
                          (F[5], 16.5, ys[1] + H + 1.6), (F[6], 29.6, ys[2] + H / 2 - 3.3), (F[7], 92.4, ys[3] + H / 2 - 3.3)):
            out.append(f'<span class="flow" style="left:{x}mm;top:{y}mm">{e(txt)}</span>')
        if limits: out.append(f'<span class="flow" style="left:16.5mm;top:{ys[0] + H + 1.6}mm">{e(F[8])}</span>')
        out.append(f'<div class="oper" style="left:42mm;top:{ys[4] + H + G + .6}mm;width:47mm">{e(T.OPERATOR[0])}<span>{e(T.OPERATOR[1])}</span></div>')
        for n, (x, y, w, h, cls) in boxes.items():
            name, sub = T.MAP[n]
            out.append(f'<a class="blk {cls}" href="#ch{n:02d}" style="left:{x}mm;top:{y}mm;width:{w}mm;height:{h}mm"><span class="tag">{n:02d}</span><b>{e(name)}</b><span>{e(sub)}</span></a>')
        head = f'<div class="maphead"><h1>{e(T.MAPHEAD[0])}</h1><p>{rich(T.MAPHEAD[1])}</p></div>'
        self.page(head + f'<div class="map">{"".join(out)}</div>', pid='map')

    def chapter(self, c):
        L = self.M['layers']; ui = self.M['ui']; self.qn = 0          # questions are numbered through the chapter
        for i, blocks in enumerate(c['pages']):
            body = ''
            if i == 0:
                body += f'<p class="eyebrow mono"><b>{c["n"]:02d}</b>{e(L[c["layer"]])}</p><h1>{e(c["title"])}</h1>'
                if c.get('inp'):
                    body += (f'<div class="io"><div><span class="mono lab">{e(ui["inp"])}</span>{e(c["inp"])}</div><div class="ar">→</div>'
                             f'<div class="o"><span class="mono lab">{e(ui["out"])}</span>{e(c["out"])}</div></div>')
            else:
                body += f'<p class="eyebrow mono"><b>{c["n"]:02d}</b>{e(c["title"])} · {e(ui["cont"])}</p>'
            body += ''.join(self.block(b) for b in blocks)
            self.page(body, pid=f'ch{c["n"]:02d}' if i == 0 else '', current=c['n'])

    def build(self):
        T = self.T
        self.cover(); self.map()
        self.page(f'<p class="eyebrow mono"><b>00</b>{e(T.HOW["eyebrow"])}</p><h1>{e(T.HOW["title"])}</h1>' + ''.join(self.block(b) for b in T.HOW['blocks']), pid='how')
        for c in T.CHAPTERS: self.chapter(c)
        self.page(f'<p class="eyebrow mono"><b>—</b>{e(T.CREDITS["eyebrow"])}</p><h1>{e(T.CREDITS["title"])}</h1>' + ''.join(self.block(b) for b in T.CREDITS['blocks']), pid='credits')
        n = len(self.pages)
        pages = [p.replace('{PN}', f'{i + 1:02d} / {n:02d}').replace('<section ', f'<section data-n="{i + 1}" ', 1) for i, p in enumerate(self.pages)]
        probe = ("<script>document.fonts.ready.then(function(){document.querySelectorAll('.content').forEach(function(c){"
                 "var d=c.scrollHeight-c.clientHeight;if(d>1)c.parentElement.setAttribute('data-overflow',d)});"
                 "document.body.setAttribute('data-fonts',document.fonts.size)})</script>")
        doc = (f'<!doctype html><html lang="{self.lang}"><head><meta charset="utf-8"><title>{e(self.M["title"])}: {e(self.M["subtitle"])}</title>'
               f'<meta name="author" content="{e(self.M["author"])}"><link rel="stylesheet" href="../style.css"></head><body>{"".join(pages)}{probe}</body></html>')
        out = ROOT / 'out' / f'roadmap-{self.lang}.html'
        out.parent.mkdir(exist_ok=True)
        out.write_text(doc, encoding='utf-8')
        pdf = ROOT.parent / f'roadmap-{self.lang}.pdf'
        chrome = ['google-chrome', '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--generate-pdf-document-outline']
        dom = subprocess.run(chrome + ['--virtual-time-budget=4000', '--dump-dom', out.as_uri()], capture_output=True, text=True).stdout
        over = [f'p{n}: {float(d):.0f} px' for n, d in re.findall(r'<section data-n="(\d+)"[^>]*? data-overflow="([\d.]+)"', dom)]
        assert 'data-fonts=' in dom, 'the overflow probe did not run'
        subprocess.run(chrome + [f'--print-to-pdf={pdf}', out.as_uri()], capture_output=True, text=True)
        unused = sorted(set(RES) - set(self.used) - SEEN)
        print(f'{self.lang}: {n} pages -> {pdf.name}; overflow: {over or "none"}; resources used {len(set(self.used))}/{len(RES)}; unused: {unused}')


if __name__ == '__main__':
    for lang in sys.argv[1:] or ['en']:
        Doc(lang).build()
