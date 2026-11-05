# -*- coding: utf-8 -*-
"""把主脚本里的窗口标题常量换掉（不改字节码语义，只换字符串常量）。

用法: python patch_main.py <输入 exe> <输出 exe> "<旧标题>" "<新标题>"
"""
import marshal
import sys
import types
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
from repack import load, body, repack  # noqa: E402


def transform(code, old, new, hits):
    consts = []
    for k in code.co_consts:
        if isinstance(k, str):
            if old in k:
                hits.append(k)
                consts.append(k.replace(old, new))
            else:
                consts.append(k)
        elif isinstance(k, types.CodeType):
            consts.append(transform(k, old, new, hits))
        else:
            consts.append(k)
    return code.replace(co_consts=tuple(consts))


def main():
    src, dst, old, new = sys.argv[1:5]
    arc = load(src)
    e = [x for x in arc['entries'] if x['name'] == 'main'][0]
    code = marshal.loads(body(arc, e))
    hits = []
    patched = transform(code, old, new, hits)
    print('命中常量', len(hits))
    data = marshal.dumps(patched)
    print('新 main 大小', len(data), '旧', e['uncomplen'])
    size = repack(arc, {'main': data}, dst)
    print('已写出', dst, size)


if __name__ == '__main__':
    main()
