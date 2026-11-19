#!/bin/bash
# render.sh en|uk : PDF pages -> out/<lang>-NN.png and contact sheets out/<lang>-sheet-N.jpg
cd "$(dirname "$0")" && rm -f out/$1-*.png out/$1-sheet-*.jpg
pdftoppm -png -r 80 ../roadmap-$1.pdf out/$1
python3 - "$1" <<'PY'
import glob, sys
from PIL import Image
fs = sorted(glob.glob(f'out/{sys.argv[1]}-*.png'))
for k in range(0, len(fs), 6):
    ims = [Image.open(f).convert('RGB') for f in fs[k:k + 6]]
    w, h = ims[0].size
    sheet = Image.new('RGB', (w * 3 + 40, h * 2 + 20), 'white')
    for i, im in enumerate(ims):
        sheet.paste(im, ((i % 3) * (w + 20), (i // 3) * (h + 20)))
    sheet.save(f'out/{sys.argv[1]}-sheet-{k // 6 + 1}.jpg', quality=88)
print(len(fs), 'pages')
PY
