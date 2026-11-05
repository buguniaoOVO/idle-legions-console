# Idle Legions 多开中控 —— 图标素材侦察记录

**结论：素材 100% 来自游戏本体，非自制。**
取自 `D:\SteamLibrary\steamapps\common\Idle Legions\client.exe` 的 PE 图标资源
（`RT_GROUP_ICON` #352 → `RT_ICON` 1–6），即游戏发布时封装进 exe 的 Windows 应用图标，
每个尺寸都是游戏原包里那一版，未做重采样、未改色、未加描边。

![sizes](preview-sizes.png)

---

## 1. 素材来源（可复核）

游戏目录 `D:\SteamLibrary\steamapps\common\Idle Legions\`：

| 文件 | 大小 | 用途 |
|---|---|---|
| `client.exe` | 98,665,472 B | **图标来源**（Godot 4.7 导出的 Windows 模板 + 项目图标） |
| `client.pck` | 291,318,864 B | 游戏资源包（见第 4 节：载荷加密，取不出美术） |
| `libgodotsteam.windows.template_release.x86_64.dll` | 3,961,344 B | Steam 集成 |
| `steam_api64.dll` | 319,128 B | Steamworks |

`client.exe` SHA-256：`b218d270771aebcf421c2a6ab445b740389dc3a9a725b24b053714998e8a2453`

资源定位（本机实测，均可复算）：

- `.rsrc` 段：RVA `0x05FBD000`，文件偏移 `0x05DB0000`，大小 11,124 B
- `RT_GROUP_ICON` id = 352，数据入口 RVA `0x0`（资源树内偏移 90 字节的 GRPICONDIR），
  全部 6 个条目 32bpp / PNG 压缩
- `RT_ICON` id 1–6 → 6 个 PNG 载荷，文件偏移与 MD5：

| RT_ICON | 声明尺寸 | bpp | exe 内文件偏移 | 字节数 | 载荷 MD5 |
|---|---|---|---|---|---|
| 1 | 16×16 | 32 | `0x05DB022C` | 497 | `42dd23e858ecf2d5690436bc0975307f` |
| 2 | 32×32 | 32 | `0x05DB0420` | 849 | `29ec5f2497816f7c176fb8ac99cd50bd` |
| 3 | 48×48 | 32 | `0x05DB0774` | 1,107 | `b8b9c4aa936dd7eeddb77d3c570f7b37` |
| 4 | 64×64 | 32 | `0x05DB0BC8` | 1,183 | `1a27f121b13fb1a9998ca9b8d667597f` |
| 5 | 128×128 | 32 | `0x05DB1068` | 542 | `372288d99bec4fc09121855eaebf7338` |
| 6 | 256×256（GRPICONDIR 里按 0 记） | 32 | `0x05DB1288` | 5,246 | `e7b3e17f9f3267ff106ad045532db299` |

机器可读副本：[pe-icon-provenance.json](pe-icon-provenance.json)；原始载荷留档在 [raw-pe/](raw-pe/)。

## 2. 为什么这张图符合"游戏元素"

图案内容（256×256 实测）：**深色底 #1A1A2E 上一把正面像素长剑** —— 银灰剑身
(`#C0C0D8`/`#8888AA`)、金色护手与两侧对称金色饰条 (`#FFD700`/`#B8860B`)、
棕色剑柄 (`#8B5A2B`)，居中对称、无文字。

判断依据：

1. **它就是游戏自己的应用图标**，不是通用占位图。Godot 默认图标是灰蓝机器人头 + 透明底；
   这张是深色底 + 剑，说明项目在 `project.godot` 里换过 `config/icon`，
   导出时由 Windows 模板写成多尺寸 `RT_GROUP_ICON`。
2. **工具链一致**：6 个尺寸 32bpp + PNG 压缩，正是 Godot 4 导出 Windows 模板的图标写法；
   同一 `client.exe` 的资源表里除 `RT_ICON`/`RT_GROUP_ICON` 只剩版本信息与 manifest，
   没有第二套图标可供误取。
3. **符合游戏题材**：Idle Legions 是放置类军团/战斗题材（pck 文件表里能读到
   `crest_corona / crest_dragon / crest_lobo`、`escudo_*`、`cru_escudo_sheet` 等徽记/盾牌资源名），
   剑 = 军团核心符号，与 `assets/iconos_char/{cruzado,paladin,berserker,...}` 的中世纪兵种设定同源。
4. **配色即游戏 UI 底色**：#1A1A2E 与 pck 中深色 UI 主题一致，放进中控台不会"外来感"。
5. **小尺寸可读**：16×16 下剑身 + 金色护手仍清晰可辨（见 `icon-16.png`），
   适合 16/32 的任务栏、托盘、列表行图标。

## 3. 产物

| 文件 | 尺寸 | 格式 | 字节 | SHA-256（前 16 位） |
|---|---|---|---|---|
| [icon-256.png](icon-256.png) | 256×256 | PNG RGBA | 4,862 | `a1655e0ae7593da9` |
| [icon-128.png](icon-128.png) | 128×128 | PNG RGBA | 410 | `646f7b3b2577d5d5` |
| [icon-64.png](icon-64.png) | 64×64 | PNG RGBA | 1,080 | `45322183b5c8cb32` |
| [icon-48.png](icon-48.png) | 48×48 | PNG RGBA | 1,038 | `23eb804d2049e22a` |
| [icon-32.png](icon-32.png) | 32×32 | PNG RGBA | 808 | `7d169121e82358fe` |
| [icon-16.png](icon-16.png) | 16×16 | PNG RGBA | 476 | `27aa55579b825abe` |
| [app.ico](app.ico) | 6 帧：256/128/64/48/32/16 | ICO（每帧 PNG 压缩，32bpp） | 8,776 | — |
| [preview-sizes.png](preview-sizes.png) | 656×288 | PNG RGBA | 9,442 | — | 六尺寸并排预览 |

说明：

- 六个 PNG **各自对应 exe 里同尺寸的那一条 `RT_ICON`**，1:1 直出，没有拿 256 缩放，
  所以每个尺寸都是游戏原生的像素对齐版本（128 那帧只有 6 色，最"脆"；256 那帧带 600 色抗锯齿，
  是导出时的原始素材）。如需"全尺寸严格同源"，告诉我，我可以改成都从 256 做 LANCZOS 缩放。
- 输出一律 **RGBA**，alpha 通道完整保留；但游戏原图本身就是**满幅不透明**背景，
  实测 alpha 极值 `(255, 255)`，所以没有"抠图"痕迹，也没有被我在边缘加透明。
- `app.ico` 为手动构造的 ICONDIR（`reserved=0, type=1, count=6`），每帧 32bpp、PNG 载荷；
  已用 Pillow 回读验证：6 帧全部解码为对应尺寸的 RGBA（Vista+ 原生支持 PNG-in-ICO）。
- 未修改 `client.exe` / `client.pck` / `X1X中控台.exe`，全部只读打开；
  `D:\Tool\赛博养蛊\IL` 下只新增了本目录。

## 4. 为什么没走 pck（以及留下的结论）

本来想取 pck 里的 `portada.png`（1,131,608 B 的 `ctex`，封面主视觉）、`titulo.png`、
`placa_titulo_*.png`（标题铭牌），但 **pck 载荷是加密的**：

- 数据区随机采样熵 ≈ **7.99 bit/byte**（加密/压缩特征；正常 pck 里 `ctex`/`gdc` 不会这么高）
- 全文件搜不到任何明文魔数：`\x89PNG` 0 次、`GDST`(Godot 4 ctex) 0 次、`GDEC`(FileAccessEncrypted) 0 次
- 文件表（表尾）本身是明文、能正常读出路径（19352 条），但按表里的 offset 去读数据全是乱码，
  且存储 MD5 与实际数据 MD5 全部不匹配 → 只能是"表明文 + 载荷整包加密"，密钥在 `client.exe` 里

顺带发现的坑（供后续逆向参考）：

- pck 头实测 `table_offset = 289227856`，而 `IL\pck_extract.py` 里硬编码的是
  `TABLE_OFF = 289159776` —— **已过期**，直接用它取数据会错位。
- `IL\pck-files.json` 记录 19350 条，当前 pck 表头声明 **19352** 条 → 该索引是旧版本快照，
  路径名可用（当关键字清单查没问题），offset 不可信。
- 想真正取 pck 美术，下一步是到 `client.exe` 里定位 32 字节 pack 密钥，
  再用表里的 MD5 当 oracle 校验解密结果（可行，但属于另一件事）。

## 5. 本目录脚本（都在 icon-work 内，均可重跑）

| 脚本 | 作用 |
|---|---|
| [pe_icon.py](pe_icon.py) | 解析 `client.exe` PE 资源树（只读），按 `RT_GROUP_ICON` 导出全部 `RT_ICON` 到 `raw-pe/` |
| [build_icon.py](build_icon.py) | 生成 `icon-<size>.png`（RGBA）、`app.ico`（6 帧）、`preview-sizes.png`，并回读校验 |
| [provenance.py](provenance.py) | 输出 exe/资源坐标/MD5 溯源，写 `pe-icon-provenance.json` |
| [scan_pck.py](scan_pck.py) | 在旧 `pck-files.json` 里搜 logo/titulo/portada 等候选 |
| [pck_art.py](pck_art.py) | 尝试从 pck 抠 `icon.svg` / `portada` / `titulo`（实测取到乱码，即加密证据） |
| [pck_index.py](pck_index.py) | 按 pck 头重算文件表（验证旧 offset 过期） |
| [dbg_rsrc.py](dbg_rsrc.py) / [dbg_off.py](dbg_off.py) / [dbg_enc.py](dbg_enc.py) / [inspect_pe.py](inspect_pe.py) / [inspect_colors.py](inspect_colors.py) | 调试/取色/熵检测用的一次性探针 |

## 6. 一句话给中控台用

> 图标 = Idle Legions 本体 `client.exe` 的 Windows 应用图标（深底金饰像素长剑），
> 六尺寸全部为游戏原生条目直出，**非自制**。
