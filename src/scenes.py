"""Pictures for the chapter on limits. They are not drawn here: the script of the landing page
(limits/scene.js) draws them in headless Chrome, one state per picture, so the PDF and the toy cannot disagree.
A picture is the scene in one state, cut to one part of it."""
import html, json, re, subprocess
from pathlib import Path

ROOT = Path(__file__).parent
BASE = dict(camera='plain', carrier='fly', board='mid', night=False, air='clear', h=100, gr=400, alt=0)
WHOLE, STRIP, NEAR, STICKER = '-18 0 378 270', '-18 96 378 174', '-18 110 280 160', '227 279 128 42'   # viewBox: all of it, the lower strip, its near part, the hardware sticker
SPECS = {
    'pixels': dict(side=True, panels=[dict(view=WHOLE)]),
    'light': dict(say=True, panels=[dict(state=dict(night=True), view=WHOLE), dict(state=dict(air='fog'), view=WHOLE)]),
    'platform': dict(panels=[dict(state=dict(gr=300), view=NEAR, hush='no-far'), dict(state=dict(gr=300, carrier='tower', h=30), view=NEAR, hush='no-far')]),
    'lens': dict(panels=[dict(state=dict(gr=300), view=NEAR, hush='no-far'), dict(state=dict(gr=300, camera='thermal'), view=NEAR, hush='no-far')]),
    'ground': dict(side=True, panels=[dict(view=STRIP, hush='hush-rings hush-frame')]),
    'board': dict(who=True, panels=[dict(state=dict(h=40, gr=60, board=b), view=STICKER) for b in ('weak', 'mid', 'strong')]),
}
COLLECT = """<script>
var out = [];
document.querySelectorAll('[data-key]').forEach(function (root) {
  var svg = root.querySelector('.lim-scene svg');
  svg.querySelector('.lim-ui').remove();
  var only = root.dataset.view === '227 279 128 42' ? '.lim-stickers' : null;                       // what the cut does not show is not printed either
  if (only) svg.querySelectorAll('.lim-art > *').forEach(function (n) { if (!n.matches(only)) n.remove(); });
  else svg.querySelector('.lim-stickers').remove();
  svg.querySelectorAll('filter').forEach(function (n) { n.remove(); });               // a filter would be printed as a bitmap
  svg.querySelectorAll('[filter]').forEach(function (n) { n.removeAttribute('filter'); });
  svg.setAttribute('viewBox', root.dataset.view); svg.setAttribute('role', 'img');
  var box = document.createElement('section');
  box.dataset.key = root.dataset.key; box.dataset.say = root.querySelector('.lim-say').textContent;
  box.innerHTML = svg.outerHTML + '<!--who-->' + root.querySelector('.lim-who').innerHTML;
  out.push(box.outerHTML);
});
document.body.innerHTML = out.join('');
</script>"""


def render(lang):
    """'<name><panel index>' -> dict(svg, who, say) for every picture of SPECS."""
    roots = []
    for name, spec in SPECS.items():
        for i, p in enumerate(spec['panels']):
            state = html.escape(json.dumps({**BASE, **p.get('state', {})}))
            roots.append(f'<div id="limits" data-key="{name}{i}" data-lang="{lang}" data-view="{p["view"]}" data-state="{state}"></div>'
                         '<script src="../../limits/scene.js"></script><script>document.getElementById("limits").removeAttribute("id")</script>')
    page = ROOT / 'out' / f'scenes-{lang}.html'
    page.parent.mkdir(exist_ok=True)
    page.write_text('<!doctype html><meta charset="utf-8"><body><script src="../../limits/model.js"></script><script src="../../limits/text.js"></script>'
                    + ''.join(roots) + COLLECT + '</body>', encoding='utf-8')
    dom = subprocess.run(['google-chrome', '--headless=new', '--disable-gpu', '--dump-dom', page.as_uri()], capture_output=True, text=True).stdout
    got = {}
    for key, say, body in re.findall(r'<section data-key="([^"]+)" data-say="([^"]*)">(.*?)</section>', dom, re.S):
        svg, who = body.split('<!--who-->')
        svg = svg.replace('id="lim-', f'id="{key}-').replace('url(#lim-', f'url(#{key}-')     # many pictures share one document
        got[key] = dict(svg=svg, who=who, say=say)
    want = [f'{n}{i}' for n, s in SPECS.items() for i in range(len(s['panels']))]
    assert sorted(got) == sorted(want), f'the scene script drew {sorted(got)}, wanted {sorted(want)}'
    return got
