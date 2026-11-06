# -*- coding: utf-8 -*-
"""宝箱图标：整张图方形补边（保持像素原貌），导出多尺寸 + ico。"""
import os
from PIL import Image, ImageOps

SRC = r'D:\Tool\赛博养蛊\IL\icon-work\chest-src.png'
OUT = r'D:\Tool\赛博养蛊\IL\console-src\assets\icon'

im = Image.open(SRC).convert('RGB')
w, h = im.size
side = max(w, h)
# 用顶部一行的中位色补边，看起来像石墙延伸
top = [im.getpixel((x, 0)) for x in range(w)]
top.sort(key=lambda c: c[0] + c[1] + c[2])
fill = top[len(top) // 2]
canvas = Image.new('RGB', (side, side), fill)
canvas.paste(im, ((side - w) // 2, (side - h) // 2))

os.makedirs(OUT, exist_ok=True)
big = canvas.resize((side * 6, side * 6), Image.LANCZOS)
big.save(os.path.join(OUT, 'icon-1024.png'))
sizes = [256, 128, 64, 48, 32, 24, 16]
imgs = []
for s in sizes:
    im2 = big.resize((s, s), Image.LANCZOS)
    im2.save(os.path.join(OUT, 'icon-%d.png' % s))
    imgs.append(im2)
imgs[0].save(os.path.join(OUT, 'app.ico'), sizes=[(s, s) for s in sizes[:5]])
print('fill', fill, 'side', side, 'wrote', sizes)
