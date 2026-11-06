# -*- coding: utf-8 -*-
"""把图标写进 exe：不占用原来那几个小图标槽，而是把新图标数据放进 .reloc 末尾，
   再把资源数据项指过去（不动 PyInstaller 归档，也不新增节表）。

用法: python patch_icon_pe.py <exe> <参考图 png>
"""
import io
import os
import struct
import sys

import pefile
from PIL import Image

SIZES = [16, 24, 32, 48, 64, 128, 256]


def build_pngs(src):
    im = Image.open(src).convert('RGBA')
    out = {}
    for s in SIZES:
        buf = io.BytesIO()
        im.resize((s, s), Image.LANCZOS).save(buf, format='PNG', optimize=True)
        out[s] = buf.getvalue()
    return out


def main():
    exe, src = sys.argv[1], sys.argv[2]
    pngs = build_pngs(src)
    pe = pefile.PE(exe)
    data = bytearray(open(exe, 'rb').read())

    # 找图标资源
    icon_entries = {}
    group_entry = None
    for entry in pe.DIRECTORY_ENTRY_RESOURCE.entries:
        for sub in entry.directory.entries:
            for lang in sub.directory.entries:
                if entry.id == 3:
                    icon_entries[sub.id] = lang.data.struct
                elif entry.id == 14:
                    group_entry = (lang.data.struct, sub.id)

    # 组图标里每项的真实尺寸
    gstruct, gid = group_entry
    goff = pe.get_offset_from_rva(gstruct.OffsetToData)
    gsize = gstruct.Size
    gblob = bytearray(data[goff:goff + gsize])
    cnt = struct.unpack('<H', gblob[4:6])[0]
    group = []
    for i in range(cnt):
        base = 6 + i * 14
        w = gblob[base] or 256
        nid = struct.unpack('<H', gblob[base + 12:base + 14])[0]
        group.append((base, w, nid))

    # .reloc 末尾放新图标
    reloc = None
    for s in pe.sections:
        if s.Name.rstrip(b'\x00') == b'.reloc':
            reloc = s
    assert reloc is not None
    va = reloc.VirtualAddress
    raw = reloc.PointerToRawData
    vsize = reloc.Misc_VirtualSize
    rsize = reloc.SizeOfRawData
    overlay_start = raw + rsize
    overlay = bytes(data[overlay_start:])

    new_base_rva = va + ((vsize + 0xFFF) // 0x1000) * 0x1000 - ((vsize + 0xFFF) // 0x1000) * 0x1000  # placeholder
    # 简单做：新数据紧跟在 .reloc 现有 raw 末尾（按 512 对齐），RVA 与 raw 内的偏移保持 1:1
    pad = (-rsize) % 512
    blob = bytearray()
    offsets = {}
    cursor = rsize + pad
    for base, w, nid in group:
        b = pngs.get(w)
        if b is None:
            continue
        offsets[nid] = (va + cursor, len(b))
        blob += b
        cursor += len(b)

    new_vsize = cursor
    new_rsize = (cursor + 0x1FF) // 0x200 * 0x200

    # 写资源数据项（RT_ICON 的 OffsetToData/Size）
    for nid, (rva, ln) in offsets.items():
        st = icon_entries[nid]
        off = st.get_file_offset()
        struct.pack_into('<I', data, off, rva)
        struct.pack_into('<I', data, off + 4, ln)
    # 改组图标里的 dwBytesInRes
    for base, w, nid in group:
        if nid in offsets:
            struct.pack_into('<I', data, goff + base + 8, offsets[nid][1])

    # 更新 .reloc 节头
    sec_off = reloc.get_file_offset()
    struct.pack_into('<I', data, sec_off + 8, new_vsize)      # VirtualSize
    struct.pack_into('<I', data, sec_off + 16, new_rsize)     # SizeOfRawData
    # SizeOfImage
    opt_off = pe.OPTIONAL_HEADER.get_file_offset()
    new_image = (va + new_vsize + 0xFFF) // 0x1000 * 0x1000
    struct.pack_into('<I', data, opt_off + 56, new_image)

    # 组装：原内容（到 .reloc 末尾）+ 新图标 + overlay
    tail = bytes(data[:overlay_start]) + b'\x00' * pad + bytes(blob)
    tail += b'\x00' * (new_rsize - len(blob) - pad)
    out = tail + overlay
    pe.close()
    with open(exe, 'wb') as fh:
        fh.write(out)
    print('icon bytes', len(blob), 'reloc', hex(rsize), '->', hex(new_rsize), 'file', len(out))


if __name__ == '__main__':
    main()
