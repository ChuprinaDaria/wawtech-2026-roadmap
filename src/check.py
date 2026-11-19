"""Open every link of the roadmap and print what the server says. Usage: python3 check.py [module ...]"""
import concurrent.futures as cf, importlib, sys, urllib.request, urllib.error, ssl
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36', 'Accept-Language': 'en,uk;q=0.8'}

def probe(url):
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=25, context=ssl.create_default_context()) as r:
            return r.status, r.geturl()
    except urllib.error.HTTPError as e:
        return e.code, url
    except Exception as e:
        return type(e).__name__, url

rows = [r for m in (sys.argv[1:] or ['resources_core']) for r in importlib.import_module(m).R]
ids = [r[0] for r in rows]; assert len(ids) == len(set(ids)), 'duplicate ids'
with cf.ThreadPoolExecutor(12) as ex:
    res = list(ex.map(lambda r: probe(r[1]), rows))
bad = 0
for r, (code, final) in zip(rows, res):
    moved = '' if final.rstrip('/') == r[1].rstrip('/') else f'  -> {final}'
    if code != 200 or moved:
        bad += code != 200
        print(f'{str(code):>18}  {r[0]:<20} {r[1]}{moved}')
print(len(rows), 'links,', bad, 'not 200')
