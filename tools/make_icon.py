# -*- coding: utf-8 -*-
"""生成控制台图标（游戏风格配色，但构图与游戏本体图标区分开）。

构图：深海军蓝圆角底 + 细金边 + 2×2 的「多开窗口」格子（左上金色实心，其余银色描边）。
用法: python make_icon.py <输出目录>
"""
import os
import sys
from PIL import Image, ImageDraw

BG = (22, 26, 43, 255)        # #161A2B 深海军蓝
GOLD = (216, 169, 59, 255)    # #D8A93B
GOLD_DARK = (168, 126, 32, 255)
SILVER = (201, 206, 218, 255) # #C9CEDA

S = 1024  # 超采样画布


def rounded(size, radius, fill=None, outline=None, width=1):
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius,
                        fill=fill, outline=outline, width=width)
    return img


def build():
    canvas = rounded((S, S), int(S * 0.22), fill=BG)
    d = ImageDraw.Draw(canvas)

    # 内侧细金边
    inset = int(S * 0.055)
    d.rounded_rectangle([inset, inset, S - 1 - inset, S - 1 - inset],
                        radius=int(S * 0.17), outline=GOLD, width=max(2, int(S * 0.012)))

    # 2×2 窗口格
    gap = int(S * 0.075)
    pad = int(S * 0.20)
    cell = (S - pad * 2 - gap) // 2
    stroke = max(3, int(S * 0.028))
    r = int(cell * 0.24)
    positions = [(pad, pad), (pad + cell + gap, pad),
                 (pad, pad + cell + gap), (pad + cell + gap, pad + cell + gap)]
    for idx, (x, y) in enumerate(positions):
        box = [x, y, x + cell, y + cell]
        if idx == 0:
            d.rounded_rectangle(box, radius=r, fill=GOLD)
        else:
            d.rounded_rectangle(box, radius=r, outline=SILVER, width=stroke)

    return canvas


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else r'D:\Tool\赛博养蛊\IL\console-src\assets\icon'
    os.makedirs(out, exist_ok=True)
    big = build()
    big.save(os.path.join(out, 'icon-1024.png'))
    sizes = [256, 128, 64, 48, 32, 24, 16]
    imgs = []
    for s in sizes:
        im = big.resize((s, s), Image.LANCZOS)
        im.save(os.path.join(out, 'icon-%d.png' % s))
        imgs.append(im)
    imgs[0].save(os.path.join(out, 'app.ico'), sizes=[(s, s) for s in sizes[:5]])
    print('wrote', out, sizes)


if __name__ == '__main__':
    main()
