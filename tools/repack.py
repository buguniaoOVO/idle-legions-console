# -*- coding: utf-8 -*-
r"""把 console-src/ 下的前端资源与 webview 补丁重新塞回 PyInstaller 单文件 exe。

用法：
    python repack.py <原始 exe> <输出 exe> <资源目录>

资源目录里的相对路径就是归档内的条目名（web\app.js、webview\__init__.py）；
归档里没有的条目（例如新增的 web\logo.png）会被追加进 TOC。
"""
import os
import struct
import sys
import zlib

MAGIC = b'MEI\014\013\012\013\016'


def load(path):
    data = open(path, 'rb').read()
    i = data.rfind(MAGIC)
    if i < 0:
        raise SystemExit('不是 PyInstaller 归档：找不到 MEI cookie')
    packagelen, tocoffset, toclen, pyver = struct.unpack('!iiii', data[i + 8:i + 24])
    pylib = data[i + 24:i + 88]
    base = i + 88 - packagelen
    toc = data[base + tocoffset: base + tocoffset + toclen]
    entries, pos = [], 0
    while pos < len(toc):
        (elen,) = struct.unpack('!i', toc[pos:pos + 4])
        if elen <= 0:
            break
        offset, complen, uncomplen = struct.unpack('!III', toc[pos + 4:pos + 16])
        cflag = toc[pos + 16]
        typ = toc[pos + 17:pos + 18].decode('latin1')
        namebytes = toc[pos + 18:pos + elen]
        name = namebytes.rstrip(b'\x00').decode('utf-8', 'replace')
        entries.append(dict(typ=typ, name=name, namebytes=namebytes, offset=offset,
                            complen=complen, uncomplen=uncomplen, cflag=cflag))
        pos += elen
    return dict(data=data, base=base, pyver=pyver, pylib=pylib, entries=entries)


def payload(arc, e):
    return arc['data'][arc['base'] + e['offset']: arc['base'] + e['offset'] + e['complen']]


def body(arc, e):
    raw = payload(arc, e)
    return zlib.decompress(raw) if e['cflag'] else raw


def collect(root):
    out = {}
    for dirpath, _dirnames, filenames in os.walk(root):
        for fn in filenames:
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, root).replace('/', '\\')
            # 只收前端资源，别把工具脚本和说明文档也塞进 exe
            if not rel.lower().startswith('web\\'):
                continue
            if rel.endswith('.pyc'):
                continue
            out[rel] = open(full, 'rb').read()
    return out


def repack(arc, files, out_path):
    blobs, toc, offset = [], b'', 0
    names = set(e['name'] for e in arc['entries'])
    for e in arc['entries']:
        raw = payload(arc, e)
        if e['name'] in files:
            newbody = files.pop(e['name'])
            raw = zlib.compress(newbody, 9)
            e = dict(e, complen=len(raw), uncomplen=len(newbody), cflag=1)
        e['offset'] = offset
        blobs.append(raw)
        offset += len(raw)
        nb = e['namebytes']
        toc += struct.pack('!iIIIBc', 18 + len(nb), e['offset'], e['complen'],
                           e['uncomplen'], e['cflag'], e['typ'].encode('latin1')) + nb
    for name, newbody in files.items():
        raw = zlib.compress(newbody, 9)
        nb = name.encode('utf-8')
        toc += struct.pack('!iIIIBc', 18 + len(nb), offset, len(raw), len(newbody), 1, b'b') + nb
        blobs.append(raw)
        offset += len(raw)
        print('  + 新增条目', name, len(newbody))
    pkg = b''.join(blobs)
    packagelen = len(pkg) + len(toc) + 88
    cookie = MAGIC + struct.pack('!iiii', packagelen, len(pkg), len(toc), arc['pyver']) + arc['pylib']
    data = arc['data'][:arc['base']] + pkg + toc + cookie
    open(out_path, 'wb').write(data)
    return len(data)


def main():
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    src, dst, root = sys.argv[1], sys.argv[2], sys.argv[3]
    arc = load(src)
    files = collect(root)
    print('替换 %d 个条目' % len(files))
    size = repack(arc, files, dst)
    print('已写出 %s（%d 字节）' % (dst, size))


if __name__ == '__main__':
    main()