# -*- coding: utf-8 -*-
"""宝箱图标（透明底）v7：逐列找宝箱顶部描边，底部取固定基线，只保留宝箱那几列。"""
import os
from PIL import Image

SRC = r'D:\Tool\赛博养蛊\IL\icon-work\chest-src.png'
OUT = r'D:\Tool\赛博养蛊\IL\console-src\assets\icon'
PAD = 0.05
Y_TOP = 14
Y_BOTTOM = 88        # 宝箱底边（石台在下面一行）
DARK = 165
TOP_LIMIT = 62       # 顶部描边必须在这条线以上，否则这列不是宝箱


def main():
    im = Image.open(SRC).convert('RGB')
    w, h = im.size
    px = im.load()

    tops = {}
    for x in range(w):
        for y in range(Y_TOP, Y_BOTTOM):
            if sum(px[x, y]) < DARK:
                tops[x] = y
                break
    keep = [x for x, y in tops.items() if y <= TOP_LIMIT]
    if not keep:
        raise SystemExit('没找到宝箱')
    x0, x1 = min(keep), max(keep)
    # 只保留连续段里包含中心的那一段
    print('keep columns', x0, '..', x1)

    mask = Image.new('L', (w, h), 0)
    mp = mask.load()
    for x in range(x0, x1 + 1):
        top = tops.get(x)
        if top is None or top > TOP_LIMIT:
            # 用左右最近的宝箱列插值
            left = max([c for c in keep if c < x], default=None)
            right = min([c for c in keep if c > x], default=None)
            if left is None or right is None:
                continue
            top = (tops[left] + tops[right]) // 2
        for y in range(top, Y_BOTTOM):
            mp[x, y] = 255

    box = (x0, max(0, min(tops[x] for x in keep) - 1), x1 + 1, Y_BOTTOM)
    crop = im.crop(box).convert('RGBA')
    crop.putalpha(mask.crop(box))
    print('box', box, 'size', crop.size)

    cw, ch = crop.size
    side = int(max(cw, ch) * (1 + PAD * 2))
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(crop, ((side - cw) // 2, (side - ch) // 2), crop)
    big = canvas.resize((side * 6, side * 6), Image.NEAREST)
    os.makedirs(OUT, exist_ok=True)
    big.save(os.path.join(OUT, 'icon-1024.png'))
    sizes = [256, 128, 64, 48, 32, 24, 16]
    imgs = []
    for s in sizes:
        im2 = big.resize((s, s), Image.LANCZOS)
        im2.save(os.path.join(OUT, 'icon-%d.png' % s))
        imgs.append(im2)
    imgs[0].save(os.path.join(OUT, 'app.ico'), sizes=[(s, s) for s in sizes[:5]])
    print('wrote', OUT)


if __name__ == '__main__':
    main()
