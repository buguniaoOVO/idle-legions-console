# -*- coding: utf-8 -*-
"""把游戏图标写进已有 exe 的 PE 图标资源（原地替换，保持 PyInstaller 归档完好）。

用法: python patch_icon.py <exe> <参考图 png>
"""
import io
import struct
import sys
import pefile
from PIL import Image


def build_frames(src_png):
    im = Image.open(src_png).convert('RGB')
    budgets = {16: 176, 24: 251, 32: 300, 48: 421, 64: 498, 128: 1174, 256: 2720}
    frames = {}
    for size, budget in budgets.items():
        frame = im.resize((size, size), Image.LANCZOS)
        chosen = None
        for colors in (256, 128, 96, 64, 48, 32, 24, 16, 12, 8, 6, 4, 3, 2):
            q = frame.quantize(colors=colors, method=Image.FASTOCTREE)
            buf = io.BytesIO()
            q.save(buf, format='PNG', optimize=True,
                   bits=min(8, max(1, (colors - 1).bit_length())))
            data = buf.getvalue()
            if len(data) <= budget:
                chosen = data
                break
        if chosen is None:
            raise SystemExit('%d 图标压不进 %d 字节' % (size, budget))
        frames[size] = chosen
    return frames


def main():
    exe_path, src_png = sys.argv[1], sys.argv[2]
    pe = pefile.PE(exe_path)
    data = bytearray(open(exe_path, 'rb').read())
    frames = build_frames(src_png)

    icons = {}
    group = None
    for entry in pe.DIRECTORY_ENTRY_RESOURCE.entries:
        for sub in entry.directory.entries:
            for lang in sub.directory.entries:
                off = pe.get_offset_from_rva(lang.data.struct.OffsetToData)
                size = lang.data.struct.Size
                struct_off = lang.data.struct.get_file_offset()
                if entry.id == 3:
                    icons[sub.id] = (off, size, struct_off)
                elif entry.id == 14:
                    group = (off, size, struct_off)

    goff, gsize, gstruct = group
    count = struct.unpack('<H', data[goff + 4:goff + 6])[0]
    for i in range(count):
        base = goff + 6 + i * 14
        w, h = data[base], data[base + 1]
        size = w or 256
        nid = struct.unpack('<H', data[base + 12:base + 14])[0]
        blob = frames[size]
        off, old_size, struct_off = icons[nid]
        if len(blob) > old_size:
            raise SystemExit('%d 放不下：新 %d > 旧 %d' % (size, len(blob), old_size))
        data[off:off + len(blob)] = blob
        struct.pack_into('<I', data, struct_off + 4, len(blob))       # DATA_ENTRY.Size
        struct.pack_into('<I', data, base + 8, len(blob))             # GRPICONDIRENTRY.dwBytesInRes
        print('%3dpx  %4d → %4d 字节' % (size, old_size, len(blob)))

    pe.close()                       # 先放掉 pefile 的文件映射，否则 Windows 上写不回去
    with open(exe_path, 'wb') as fh:
        fh.write(bytes(data))
    print('已写入图标：', exe_path)


if __name__ == '__main__':
    main()