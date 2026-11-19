"""Read the finished PDFs back: every resource link is clickable, every internal link lands on a real page, the map leads to the right chapters."""
import importlib, sys
from urllib.parse import unquote
import fitz
RES = [r for m in ('resources_core', 'resources_hw') for r in importlib.import_module(m).R]
norm = lambda u: unquote(u).rstrip('/')
ok = True
for lang in sys.argv[1:] or ['en', 'uk']:
    T = importlib.import_module(f'text_{lang}')
    d = fitz.open(f'../roadmap-{lang}.pdf')
    uris, internal, broken = set(), 0, []
    for i, p in enumerate(d):
        for l in p.get_links():
            if l.get('uri'): uris.add(norm(l['uri']))
            else:
                internal += 1
                if not (0 <= l.get('page', -1) < len(d)): broken.append((i + 1, l))
    missing = [r[0] for r in RES if norm(r[1]) not in uris]
    extra = sorted(uris - {norm(r[1]) for r in RES})
    # the map: each block must land on the page that carries that chapter title
    titles = {c['n']: c['title'] for c in T.CHAPTERS}; wrong = []; hits = 0
    for l in d[1].get_links():
        if l.get('uri') or 'page' not in l: continue
        text = d[l['page']].get_text()
        if l['page'] == 1: continue
        hits += 1
        if not any(t in text for t in titles.values()): wrong.append(l['page'] + 1)
    fonts = sorted({f[3].split('+')[-1] for p in d for f in p.get_fonts()})
    w, h = [round(v / 72 * 25.4) for v in d[0].rect[2:]]
    print(f'{lang}: {len(d)} pages {w}x{h} mm, {len(uris)} external links, {internal} internal, outline {len(d.get_toc())} entries')
    print(f'   resources missing from the PDF: {missing or "none"}; broken internal: {broken or "none"}; map links {hits}, wrong targets: {wrong or "none"}')
    print(f'   other external links: {extra}')
    print(f'   fonts: {fonts}')
    ok &= not missing and not broken and not wrong
sys.exit(0 if ok else 1)
