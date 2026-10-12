"""Check actual raster dimensions, transparency, edge padding and export coverage."""
from pathlib import Path
from PIL import Image
import json
root = Path(__file__).resolve().parent
manifest = json.loads((root/'manifest.json').read_text())
exports = list((root/'exports').glob('*.png'))
stickers = list((root/'stickers').glob('*.png'))
assert len(exports) == 20, len(exports)
assert len(stickers) == 8, len(stickers)
for file in exports:
    with Image.open(file) as im:
        assert im.width == 1600, (file.name, im.size)
        if file.stem.startswith(('model-', 'expression-', 'pose-')) and 'sheet' not in file.stem:
            assert im.height == 1600, (file.name, im.size)
        if file.stem.startswith('board-'):
            assert im.height == 2000, (file.name, im.size)
for index, name in enumerate(manifest['stickers'], 1):
    file = root/'stickers'/f'{index:02}-{name}.png'
    with Image.open(file) as im:
        assert im.size == (512,512), (file.name, im.size)
        assert im.mode == 'RGBA', (file.name, im.mode)
        alpha = im.getchannel('A')
        assert alpha.getextrema() == (0,255), file.name
        x0,y0,x1,y1 = alpha.getbbox()
        assert 12 <= x0 < x1 <= 500 and 12 <= y0 < y1 <= 500, (file.name,alpha.getbbox())
        assert im.getpixel((0,0))[3] == 0
print('PASS: 20 exports at 1600 px, 8 RGBA stickers at 512 × 512; transparent corners and >=12 px clipping safety margins.')
