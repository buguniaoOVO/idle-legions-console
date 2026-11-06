/* X1X 中控台 —— 前端 */
'use strict';

const FEATURES = [
  ['claim_mail', '领邮件', '领取'], ['claim_pass', '通行证奖励', '领取'],
  ['claim_dex', '图鉴奖励', '领取'], ['expedition', '远征领回/再出发', '领取'],
  ['open_chests', '开宝箱', '宝箱宠物'], ['hatch_pets', '开宠物石', '宝箱宠物'],
  ['pet_fill', '空栏位补宠物', '宝箱宠物'], ['pet_upgrade', '出战宠物升级', '宝箱宠物'],
  ['auto_equip', '自动换装', '装备'], ['salvage', '分解/出售垃圾', '装备'],
  ['forge_upgrade', '装备强化', '装备'], ['talents', '天赋配点', '成长'],
  ['commander', '指挥官树', '成长'], ['worldboss', '世界头目', '挑战'],
  ['boss_retry', '章节首领补打', '挑战'], ['fallback', '卡关退回练级', '挑战'],
  ['daily_shop', '每日商店', '每日'], ['guild_donate', '公会捐献', '每日'],
];
const FNAME = Object.fromEntries(FEATURES.map(([k, n]) => [k, n]));

const META = {
  dry_run: { label: '预演模式', hint: '只记录，不真的执行', type: 'bool' },
  auto_update: { label: '助手自动更新', hint: '从 x1x.tw 拉签名版本', type: 'bool' },
  pacing_min_ms: { label: '动作间隔下限', hint: '毫秒', type: 'num', min: 300, step: 100 },
  pacing_max_ms: { label: '动作间隔上限', hint: '毫秒', type: 'num', min: 500, step: 100 },
  gold_reserve: { label: '保留金币', hint: '低于此数不花', type: 'num', min: 0, step: 1000 },
  essence_reserve: { label: '保留精华', type: 'num', min: 0, step: 10 },
  fallback_losses: { label: '卡关判失败次数', type: 'num', min: 1, max: 20 },
  fallback_stages: { label: '退回关卡数', type: 'num', min: 1, max: 10 },
  fallback_minutes: { label: '练级时长', hint: '分钟', type: 'num', min: 1, max: 600 },
  forge_max_plus: { label: '强化上限', hint: '+N', type: 'num', min: 0, max: 15 },
  chest_min: { label: '最少开箱数量', type: 'num', min: 1, max: 50 },
  bag_free_min: { label: '背包保底空位', type: 'num', min: 0, max: 100 },
  salvage_max_rarity: { label: '分解最高稀有度', type: 'select', options: ['common', 'uncommon', 'rare', 'epic', 'legendary'] },
  salvage_mode: { label: '垃圾处理', type: 'select', options: [['salvage', '分解'], ['inventory', '出售']] },
  salvage_min_batch: { label: '最少凑够几件', type: 'num', min: 1, max: 50 },
  salvage_keep_upgrades: { label: '保留可升级装备', type: 'bool' },
  talent_mode: { label: '天赋方案', type: 'select', options: [['recommend', '推荐'], ['manual', '手动']] },
  expedition_stage: { label: '远征关卡', type: 'select', options: [['frontier', '最远'], ['best', '效率最高']] },
  expedition_relaunch: { label: '远征自动再出发', type: 'bool' },
  expedition_add_free: { label: '再出发带闲置英雄', type: 'bool' },
  commander_cheapest: { label: '指挥官只点最便宜', type: 'bool' },
};

const RAR = { common: '普通', uncommon: '精良', rare: '稀有', epic: '史诗', legendary: '传说', unique: '独特', mythic: '神话' };
const RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, unique: 5, mythic: 6 };
const SRC = { drop: '掉落', chest: '宝箱', shop: '商店', forge: '强化', boss: '首领', pet: '宠物' };

/* 控制台自身：版本号、发布页、赞助入口。界面只露版本号，任何地方都不显示仓库地址。 */
const CONSOLE_VERSION = '2.1.3';
const GITHUB_REPO = { owner: 'buguniaoOVO', repo: 'idle-legions-console' };
const SPONSOR_URL = 'https://afdian.com/a/Awan0v0?utm_source=copylink&utm_medium=link';

const cmpVer = (a, b) => {
  const pa = String(a || '').replace(/^v/i, '').split(/[.+-]/).map((x) => parseInt(x, 10) || 0);
  const pb = String(b || '').replace(/^v/i, '').split(/[.+-]/).map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
};

let updateState = { kind: 'idle', text: '尚未检测' };

const state = {
  snap: null, page: 'inst', sel: null, tab: 'feat', drawer: false,
  loot: { rar: 'all', src: 'all', q: '' },
  timer: null, busy: false,
};

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v) => (v == null || v === '' ? '—' : Number(v).toLocaleString('zh-CN'));
const kfmt = (v) => {
  const n = Number(v || 0);
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1) + 'k';
  return String(Math.round(n));
};
const hhmm = (t) => { const d = new Date(t * 1000); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const mmdd = (t) => { const d = new Date(t * 1000); return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${hhmm(t)}`; };
const ago = (t) => {
  if (!t) return '—';
  const s = Math.max(0, Math.round(Date.now() / 1000 - t));
  if (s < 60) return s + ' 秒前';
  if (s < 3600) return Math.round(s / 60) + ' 分钟前';
  if (s < 86400) return Math.round(s / 3600) + ' 小时前';
  return Math.round(s / 86400) + ' 天前';
};
const shortStage = (s) => {
  if (!s) return '—';
  const m = /·\s*([^·]+)$/.exec(s);
  return (m ? m[1] : s).trim();
};
const typing = (el) => {
  const a = document.activeElement;
  return !!(a && el.contains(a) && (a.tagName === 'INPUT' || a.tagName === 'SELECT'));
};

function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2100);
  setTimeout(() => t.remove(), 2500);
}

async function api(path, body) {
  const opt = body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {};
  try {
    const r = await fetch(path, opt);
    return await r.json();
  } catch (e) {
    toast('本地服务没响应，可能已退出', 'bad');
    return { ok: false };
  }
}

const BLOCKED = {
  stopped: '主开关已关',
  not_logged_in: '游戏未登录',
  site_unverified: '站点验签过期',
  paused_by_site: '站点已暂停',
  too_old: '助手版本过旧',
};
const BLOCKED_WHY = {
  site_unverified: '助手 10 分钟内没能读到 x1x.tw，为安全它自己停手了',
  too_old: '官网要求的最低版本高于当前版本，先更新助手',
  paused_by_site: '官方在 release.json 里标了暂停，所有助手都不动',
  not_logged_in: '游戏还没进到角色界面，助手拿不到 token',
};

function statusOf(i) {
  if (i.loggedIn === false) return ['err', '未登录'];
  if (i.updating) return ['warn', '更新中'];
  if (i.blocked && i.blocked !== 'stopped') return ['warn', BLOCKED[i.blocked] || i.blocked];
  if (i.running) return ['on', '游戏在线'];
  return ['', '已停止'];
}

/* 打开官方控制台（带端口和 key 的深链）。窗口版是内嵌——在同一个窗口里
   叠一层原生 WebView2，不新开窗口；只有在浏览器里访问本地页面时才开新标签。 */
async function openOfficial(port) {
  const p = Number(port || 0);
  if (window.pywebview && window.pywebview.api && window.pywebview.api.open_console) {
    try {
      const r = await window.pywebview.api.open_console(p);
      if (r === 'embedded') return;          // 已经盖在这个窗口上了
      if (r === 'browser') return toast('已用浏览器打开官方设置', 'ok');
    } catch (e) { /* 掉到浏览器 */ }
  }
  // 网页模式（直接开 http://127.0.0.1:8898）没有原生窗口可嵌，只能新标签
  const r = await api('/api/console', { ports: p ? [p] : [] });
  const url = (r && r.url) || 'https://x1x.tw/legions/helper/';
  window.open(url, '_blank', 'noopener');
}

/* 内嵌官方页的「返回控制台」按钮由原生工具条触发 */
window.__backFromConsole = function () {
  if (state.page !== 'inst') go('inst');
  refresh(true);
};

/* ------------------------------------------------------------------ 框架 */

const TITLES = { inst: '账号状态', loot: '掉落记录', sandbox: '沙箱', settings: '本工具设置' };

function renderChrome(s) {
  const k = s.kpi || {};
  $('#navInst').textContent = k.instances || 0;
  $('#navLoot').textContent = k.loot || 0;
  $('#navBox').textContent = k.boxes || 0;
  $('#pageTitle').textContent = TITLES[state.page];
  $('#pageSub').textContent = {
    inst: '主机与各沙箱里的游戏、助手与运行状态',
    loot: '所有实例的掉落汇总，越用越全',
    sandbox: 'Sandboxie 检测、助手部署与实例启停',
    settings: '路径、助手版本与运维入口',
  }[state.page];

  const sb = s.sandbox || {};
  const led = $('#sbLed');
  led.className = sb.running ? 'on' : (sb.found ? 'warn' : 'err');
  $('#sbText').textContent = sb.running ? '控制服务在线' : (sb.found ? '沙箱未启动' : '无 Sandboxie');
  const ports = (s.app && s.app.ports) || [];
  $('#portRange').textContent = ports.length ? ports[0] + '—' + ports[ports.length - 1] : '8840—8843';
  $('#verText').textContent = '助手版本 ' + (s.release && s.release.latest ? 'v' + s.release.latest : '—');

  $('#liveStat').textContent = `${(s.instances || []).length} 个助手在线 ${hhmm(s.app.now)}`;
  const fv = $('#footVer'); if (fv) fv.textContent = 'v' + CONSOLE_VERSION;

  const acts = {
    inst: [['primary', '全部开始', 'startall'], ['', '全部停止', 'stopall'],
           ['', '助手设置', 'official'], ['', '启动游戏', 'launchone'], ['', '刷新', 'refresh']],
    loot: [['', '刷新', 'refresh']],
    sandbox: [['primary', '启动全部沙箱', 'launchall'], ['', '部署全部', 'deployall']],
    settings: [['', '刷新', 'refresh']],
  }[state.page] || [];
  // 顶部只放本页动作；发布页 / 赞助 / 退出在右侧图标组里（和桌面版同一位置）
  $('#topacts').innerHTML = acts.map(([cls, label, act]) =>
    `<button class="btn ${cls}" data-top="${act}">${esc(label)}</button>`).join('');
}

/* ------------------------------------------------------------------ 账号状态 */

function head(cols) {
  return `<thead><tr>${cols.map((c) => {
    const right = c.startsWith('#');
    return `<th class="${right ? 'r' : ''}">${esc(right ? c.slice(1) : c)}</th>`;
  }).join('')}</tr></thead>`;
}

function renderInst(s) {
  const ins = s.instances || [];
  const k = s.kpi || {};
  const loot = s.loot || [];
  const highest = loot.reduce((a, b) => (Number(b.power || 0) > Number(a.power || 0) ? b : a), { power: 0 });
  const epic = loot.filter((x) => RANK[x.rarity] >= 3).length;

  $('#kpis').innerHTML = `
    <div class="kpi"><div class="k">在线账号</div>
      <div class="v">${k.instances}<small>/ 4</small></div>
      <div class="s">助手已连接 ${k.instances} 个</div></div>
    <div class="kpi"><div class="k">全自动运行</div>
      <div class="v">${k.running}<small>/ ${k.instances}</small></div>
      <div class="s">已停 ${Math.max(0, k.instances - k.running)} 个</div></div>
    <div class="kpi"><div class="k">24 小时掉落</div>
      <div class="v">${k.loot}<small>件</small></div>
      <div class="s">记录合计 ${loot.length} 条</div></div>
    <div class="kpi"><div class="k">最高战力</div>
      <div class="v">${num(highest.power)}</div>
      <div class="s">史诗以上 ${epic} 件</div></div>`;

  const sb = s.sandbox || {};
  const hostN = ins.filter((i) => i.target === '').length;
  const boxN = ins.filter((i) => i.target).length;
  const unknownN = ins.filter((i) => i.target === null).length;
  $('#envLeft').innerHTML = `<h2>环境</h2><span class="count">${k.boxes} 个沙箱</span>
    <span class="barenv">· Sandboxie ${sb.running ? '运行中' : '未运行'} · 本机 ${hostN} 个 · 沙箱 ${boxN} 个${
      unknownN ? ` · <span style="color:#b54708">${unknownN} 个位置未知</span>` : ''}</span>`;
  // 环境栏右侧：显示/隐藏窗口 + 全局锁帧总开关（和桌破中控同一位置）
  const capOn = globalCapOn();
  // 已锁时显示实例当前档位（可能是卡片上单独设的），没锁时显示默认档位
  const capFps = capOn ? Number((s.instances || [])[0].fps || globalCapRate()) : globalCapRate();
  $('#envRight').innerHTML = `
    <button class="btn" data-top="togglewin">${k.hidden ? '显示全部窗口' : '隐藏全部窗口'}</button>
    <button class="btn ${capOn ? 'danger' : ''}" data-global-lock="1" title="全局锁帧：给所有实例写 settings.cfg 的 max_fps，改了即时生效">
      ${capOn ? `关闭全局锁帧 · ${capFps} 帧` : `开启全局锁帧 · ${capFps} 帧`}</button>
    <button class="btn" data-goto="sandbox">沙箱管理</button>`;

  $('#cards').innerHTML = ins.map(card).join('');
  $('#instEmpty').classList.toggle('hidden', ins.length > 0);

  const recent = loot.slice(0, 8);
  $('#recentCount').textContent = `${loot.length} 条`;
  $('#recentTable').innerHTML = head(['时间', '账号', '物品', '品质', '来源', '位置']) +
    `<tbody>${recent.length ? recent.map((x) => `<tr class="lootrow ${esc(x.rarity || '')}">
        <td class="mono">${mmdd(x.t)}</td>
        <td>${esc(x.account || '—')}</td>
        <td><span class="iname">${esc(x.name)}</span></td>
        <td class="qcell">${esc(RAR[x.rarity] || x.rarity)}</td>
        <td class="dim">${esc(SRC[x.src] || x.src || '—')}</td>
        <td class="dim">${esc(x.scope || '—')}</td>
      </tr>`).join('')
      : `<tr><td colspan="6"><div class="empty" style="border:0"><p>还没有掉落记录。</p>
         <p class="dim">助手运行后会自己记，界面随刷新累积。</p></div></td></tr>`}</tbody>`;
}

function card(i) {
  const [cls, label] = statusOf(i);
  const name = i.alias || i.account || ('端口 ' + i.port);
  const f = i.farm || {};
  const last = (i.log || [])[0];
  const pillCls = cls === 'on' ? 'ok' : cls === 'err' ? 'err' : cls === 'warn' ? 'warn' : '';
  const unknown = i.target === null;
  return `<article class="icard ${i.running ? '' : 'off'}">
    <div class="ihead">
      <i class="${cls}"></i>
      <b>${esc(name)}</b>
      <span class="pill ${pillCls}">${esc(label)}</span>
    </div>
    <div class="imeta"><span>PORT ${i.port}</span><span>·</span>
      <span${unknown ? ' style="color:#b54708"' : ''}>${esc(i.scope || '—')}</span><span>·</span>
      <span>助手 v${esc(i.version || '?')}</span></div>

    <div class="igrid">
      <div class="icell"><span>当前关卡</span><b title="${esc(f.stage || '')}">${esc(shortStage(f.stage))}</b></div>
      <div class="icell"><span>金币 / 时</span><b class="mono">${kfmt(f.gph)}</b></div>
      <div class="icell"><span>背包</span><b class="mono">${num(i.bag[0])} / ${num(i.bag[1])}</b></div>
      <div class="icell"><span>邮件</span><b class="mono">${num(i.mail)}</b></div>
    </div>

    ${i.blocked && i.blocked !== 'stopped' && !i.running ? `<div class="iwarn">
      <span>${esc(BLOCKED_WHY[i.blocked] || ('助手被拦住：' + BLOCKED[i.blocked]))}</span>
      <button class="btn sm" data-fix="${i.port}">${i.blocked === 'too_old' ? '更新' : '修复'}</button>
    </div>` : ''}
    <div class="irecent"><small>最近记录</small><span>${last ? esc(last.m || '') : '暂无动作'}</span></div>

    <div class="ifoot">
      <button class="btn sm ${i.running ? 'danger' : 'primary'}" data-pow="${i.port}">${i.running ? '停止自动' : '开始自动'}</button>
      ${i.target === null ? '' : `<span class="locksplit">
        <button class="btn sm ${Number(i.fps || 0) > 0 ? 'danger' : ''}" data-lock-loop="${i.port}"
          title="${Number(i.fps || 0) > 0 ? '这个号锁在 ' + i.fps + ' 帧，点一下解除' : '把这个号锁到 ' + globalCapRate() + ' 帧（即时生效）'}">${Number(i.fps || 0) > 0 ? '锁帧 ' + i.fps : '锁帧'}</button>
        <button class="btn sm lockcaret" data-lock-menu="${i.port}" title="选择 10 / 30 / 不锁">▾</button></span>`}
      <button class="btn sm" data-official="${i.port}">设置</button>
      <button class="btn sm" data-win="${i.port}">${i.hidden ? '显示窗口' : '隐藏窗口'}</button>
      <button class="btn sm" data-detail="${i.port}">详情</button>
      <button class="btn sm" data-kill="${i.port}">关闭游戏</button>
    </div>
  </article>`;
}

/* ------------------------------------------------------------------ 掉落 */

function lootRows(rows, full) {
  return rows.length ? rows.map((x) => `<tr class="lootrow ${esc(x.rarity || '')}">
      <td class="mono">${mmdd(x.t)}</td>
      <td>${esc(x.account || '—')}</td>
      <td><span class="iname">${esc(x.name)}</span>
          ${x.lines && x.lines.length ? `<div class="attrs">${x.lines.map(esc).join(' · ')}</div>` : ''}</td>
      <td class="qcell">${esc(RAR[x.rarity] || x.rarity)}</td>
      ${full ? `<td class="dim">${esc(x.slot || '—')}</td><td class="r mono">${x.power == null ? '—' : num(x.power)}</td>` : ''}
      <td class="dim">${esc(SRC[x.src] || x.src || '—')}</td>
      <td class="dim">${esc(x.scope || '—')}</td>
    </tr>`).join('')
    : `<tr><td colspan="${full ? 8 : 6}"><div class="empty" style="border:0">
        <p>没有符合条件的掉落。</p><p class="dim">助手只保留最近 40 条，界面随刷新累积。</p></div></td></tr>`;
}

function filterLoot(all, f) {
  return all.filter((x) => {
    if (f.rar === 'epic' && RANK[x.rarity] < 3) return false;
    if (f.rar === 'legend' && RANK[x.rarity] < 4) return false;
    if (f.rar === 'unique' && RANK[x.rarity] < 5) return false;
    if (f.src !== 'all' && x.src !== f.src) return false;
    if (f.q && !((x.name || '') + ' ' + (x.account || '')).toLowerCase().includes(f.q.toLowerCase())) return false;
    return true;
  });
}

function renderLoot(s) {
  const all = s.loot || [];
  const now = s.app.now;
  const f = state.loot;
  const rows = filterLoot(all, f);

  const c24 = all.filter((x) => now - x.t < 86400).length;
  const epic = all.filter((x) => RANK[x.rarity] >= 3).length;
  const legend = all.filter((x) => RANK[x.rarity] >= 4).length;
  const top = all.reduce((a, b) => (Number(b.power || 0) > Number(a.power || 0) ? b : a), { power: 0 });
  $('#lootKpis').innerHTML = `
    <div class="kpi"><div class="k">24 小时</div><div class="v">${c24}<small>件</small></div>
      <div class="s">合计 ${all.length} 条</div></div>
    <div class="kpi"><div class="k">史诗以上</div><div class="v">${epic}<small>件</small></div>
      <div class="s">占 ${all.length ? Math.round(epic / all.length * 100) : 0}%</div></div>
    <div class="kpi"><div class="k">传说以上</div><div class="v">${legend}<small>件</small></div>
      <div class="s">独特 ${all.filter((x) => RANK[x.rarity] >= 5).length} 件</div></div>
    <div class="kpi"><div class="k">最高战力</div><div class="v">${num(top.power)}</div>
      <div class="s">${esc(top.name || '—')}</div></div>`;

  const fb = $('#lootFilter');
  if (!typing(fb)) {
    const chips = [['all', '全部'], ['epic', '史诗+'], ['legend', '传说+'], ['unique', '独特+']];
    const srcs = [['all', '全部来源'], ['drop', '掉落'], ['chest', '宝箱'], ['shop', '商店']];
    fb.innerHTML = chips.map(([k, n]) => `<button class="chip ${f.rar === k ? 'on' : ''}" data-rar="${k}">${n}</button>`).join('')
      + '<span style="width:10px"></span>'
      + srcs.map(([k, n]) => `<button class="chip ${f.src === k ? 'on' : ''}" data-src="${k}">${n}</button>`).join('')
      + `<span class="spacer"></span><input id="lootQ" placeholder="搜装备或账号" value="${esc(f.q)}">`;
  }
  $('#lootTable').innerHTML = head(['时间', '账号', '物品', '品质', '槽位', '#战力', '来源', '位置'])
    + `<tbody>${lootRows(rows, true)}</tbody>`;
}

/* ------------------------------------------------------------------ 沙箱 */

function renderSandbox(s) {
  const sb = s.sandbox || {};
  const boxes = s.boxes || [];
  const insts = s.instances || [];
  const procs = s.procs || [];

  const deployed = boxes.filter((b) => b.helper && b.helper.installed).length;
  const running = boxes.filter((b) => b.port).length;
  $('#sbKpis').innerHTML = `
    <div class="kpi"><div class="k">沙箱</div><div class="v">${boxes.length}<small>个</small></div>
      <div class="s">Sandboxie ${sb.running ? '运行中' : '未运行'}</div></div>
    <div class="kpi"><div class="k">游戏在跑</div><div class="v">${running}<small>个</small></div>
      <div class="s">进程合计 ${procs.length} 个</div></div>
    <div class="kpi"><div class="k">已部署助手</div><div class="v">${deployed}<small>个</small></div>
      <div class="s">其余读本机安装</div></div>
    <div class="kpi"><div class="k">助手版本</div><div class="v">${esc((s.release || {}).latest || '—')}</div>
      <div class="s">本机 v${esc((s.host.helper || {}).version || '未装')}</div></div>`;

  $('#boxCount').textContent = `${boxes.length} 个 · ${sb.root || '未找到根目录'}`;
  $('#sbActions').innerHTML = `
    <button class="btn" data-top="deployall">部署到全部</button>
    <button class="btn" data-top="updateall">更新全部助手</button>`;

  const hostInst = insts.find((i) => i.target === '') || {};
  const rows = [{ name: '本机', host: true, has_game: true, helper: s.host.helper,
    fps: hostInst.fps, port: hostInst.port || 0, account: hostInst.account || '', last_active: 0 }]
    .concat(boxes);

  $('#boxTable').innerHTML = head(['沙箱', '游戏', '助手', '锁帧', '端口', '账号', '最近活动', ''])
    + `<tbody>${rows.map((b) => {
      const hp = b.helper || {};
      const helperCell = hp.installed
        ? `<span class="q uncommon"><i></i>v${esc(hp.version || '?')}</span>${hp.autoload ? '' : ' <span class="tiny" style="color:var(--red)">缺 autoload</span>'}`
        : (b.port ? `<span class="dim">共用本机 v${esc((s.host.helper || {}).version || '?')}</span>`
                  : '<span class="dim">未部署</span>');
      return `<tr>
        <td><b>${b.host ? '本机' : '沙箱 ' + esc(b.name)}</b></td>
        <td class="dim">${b.has_game ? '已装' : '<span style="color:var(--ink3)">空</span>'}</td>
        <td>${helperCell}</td>
        <td class="mono">${b.fps == null ? '—' : b.fps}</td>
        <td class="mono">${b.port ? ':' + b.port : '—'}</td>
        <td class="dim">${esc(b.account || '—')}</td>
        <td class="dim">${b.last_active ? ago(b.last_active) : '—'}</td>
        <td class="r">
          ${b.port
            ? `<button class="btn sm" data-box-show="${b.pid || 0}">显示</button>
               <button class="btn sm danger" data-box-kill="${b.pid || 0}">结束</button>`
            : `<button class="btn sm primary" data-box-launch="${esc(b.name)}">启动</button>`}
          <button class="btn sm" data-box-deploy="${esc(b.name)}">${hp.installed ? '重新部署' : '部署'}</button>
        </td>
      </tr>`;
    }).join('')}</tbody>`;

  $('#procCount').textContent = `${procs.length} 个`;
  $('#procTable').innerHTML = head(['PID', '位置', '端口', '窗口', '#内存', ''])
    + `<tbody>${procs.length ? procs.map((p) => `<tr>
        <td class="mono">${p.pid}</td>
        <td class="dim">${p.box ? '沙箱 ' + esc(p.box) : '本机'}</td>
        <td class="mono">${p.port ? ':' + p.port : '—'}</td>
        <td><span class="q ${p.hidden ? 'common' : 'uncommon'}"><i></i>${p.hidden ? '已隐藏' : '可见'}</span></td>
        <td class="r mono">${esc(p.mem || '')}</td>
        <td class="r">
          <button class="btn sm" data-pid-win="${p.pid}" data-show="${p.hidden ? 1 : 0}">${p.hidden ? '显示' : '隐藏'}</button>
          <button class="btn sm danger" data-pid-kill="${p.pid}">结束</button>
        </td></tr>`).join('')
      : `<tr><td colspan="6"><div class="empty" style="border:0"><p>没有运行中的客户端。</p></div></td></tr>`}</tbody>`;
}

/* ------------------------------------------------------------------ 设置 */

function renderSettings(s) {
  const box = $('#settingsBody');
  if (typing(box)) return;
  const h = s.host.helper || {};
  const rel = s.release || {};
  box.innerHTML = `
  <div class="card">
    <h2>路径</h2>
    <div class="rows">
      <div class="srow"><div class="lbl">游戏客户端<small>启动实例用这个 exe</small></div>
        <input data-conf="client_exe" value="${esc(s.client || '')}"></div>
      <div class="srow"><div class="lbl">Sandboxie 目录<small>留空自动检测，现在是 ${esc((s.sandbox || {}).root || '未找到')}</small></div>
        <input data-conf="sandbox_root" placeholder="自动检测" value="${esc((s.conf || {}).sandbox_root || '')}"></div>
      <div class="srow"><div class="lbl">Start.exe<small>留空自动检测，现在是 ${esc((s.sandbox || {}).exe || '未找到')}</small></div>
        <input data-conf="sandboxie_exe" placeholder="自动检测" value="${esc((s.conf || {}).sandboxie_exe || '')}"></div>
      <div class="srow"><div class="lbl">刷新间隔（秒）</div>
        <input data-conf="poll_seconds" type="number" min="1" max="30" value="${esc(s.app.poll)}"></div>
    </div>
  </div>

  <div class="card">
    <h2>助手</h2>
    <div class="rows">
      <div class="srow"><div class="lbl">本机安装<small>${esc(h.dir || '')}</small></div>
        <span class="val">${h.installed ? 'v' + esc(h.version || '?') : '未部署'}${h.autoload ? '' : ' · 缺 autoload'}</span>
        <button class="btn sm" data-op="deploy-host">${h.installed ? '重新部署' : '部署到本机'}</button></div>
      <div class="srow"><div class="lbl">线上最新<small>${rel.error ? esc(rel.error) : 'x1x.tw/legions/helper'}</small></div>
        <span class="val">${rel.ok ? 'v' + esc(rel.latest) : '—'}</span>
        <button class="btn sm" data-op="update-all">更新全部</button></div>
      <div class="srow"><div class="lbl">发行包<small>${(s.conf || {}).helper_pkg ? esc(s.conf.helper_pkg) : 'exe 同目录下没找到 X1X-IdleLegions-Helper*'}</small></div>
        <span class="val">${(s.conf || {}).helper_pkg_ver ? 'v' + esc(s.conf.helper_pkg_ver) : '—'}</span></div>
      <div class="srow"><div class="lbl">配置文件<small>${esc(s.app.confPath)}</small></div>
        <button class="btn sm" data-op="open-conf">打开目录</button></div>
    </div>
  </div>

  <div class="card">
    <h2>锁帧</h2>
    <div class="rows">
      <div class="srow"><div class="lbl">全局锁帧档位<small>环境栏「开启全局锁帧」用的档位；单个号可以在卡片上单独设</small></div>
        <select data-cap-rate>
          <option value="10" ${globalCapRate() === 10 ? 'selected' : ''}>10 帧</option>
          <option value="30" ${globalCapRate() === 30 ? 'selected' : ''}>30 帧</option>
        </select></div>
    </div>
  </div>

  <div class="card">
    <h2>版本与更新</h2>
    <div class="rows">
      <div class="srow"><div class="lbl">当前版本<small>检测更新只比较版本号，界面上不显示仓库地址</small></div>
        <span class="val">v${CONSOLE_VERSION}</span>
        <button class="btn sm" data-check-update="1">检测更新</button></div>
      <div class="srow"><div class="lbl">更新状态<small id="updHint">启动时检测一次，运行期间每 6 小时一次</small></div>
        <span class="val" id="updState">${esc(updateState.text)}</span></div>
    </div>
  </div>

  <div class="card">
    <h2>关于</h2>
    <div class="rows">
      <div class="srow"><div class="lbl">Idle Legions 多开中控<small>非官方玩家工具。助手设置一律走 x1x.tw 官方页面，这边只做部署、批量开关、窗口与沙箱管理</small></div>
        <span class="val">v${CONSOLE_VERSION}</span></div>
      <div class="srow"><div class="lbl">助手端口<small>8840—8843，所以最多 4 开</small></div>
        <span class="val">:8840 – :8843</span></div>
      <div class="srow"><div class="lbl">退出中控台<small>右上角 X 只是最小化到任务栏，真要关点这里。已开的助手和游戏不受影响</small></div>
        <button class="btn sm" data-op="quit">退出</button></div>
    </div>
  </div>`;
}

/* ------------------------------------------------------------------ 抽屉 */

function curInst() {
  return (state.snap.instances || []).find((x) => x.port === state.sel);
}

function openDrawer(port) {
  state.sel = port;
  state.drawer = true;
  state.tab = 'feat';
  $('#drawer').classList.add('open');
  $('#scrim').classList.add('on');
  renderDrawer();
}

function closeDrawer() {
  state.drawer = false;
  $('#drawer').classList.remove('open');
  $('#scrim').classList.remove('on');
}

function renderDrawer() {
  if (!state.drawer) return;
  const i = curInst();
  if (!i) { closeDrawer(); return; }
  const body = $('#dbody');
  if (typing(body)) return;
  const keep = body.scrollTop;
  const [, label] = statusOf(i);

  $('#dtitle').textContent = i.alias || i.account || ('端口 ' + i.port);
  $('#dsub').textContent = `:${i.port} · ${i.scope} · 助手 v${i.version} · ${label}`;
  $('#dacts').innerHTML = `
    <button class="btn sm ${i.running ? 'danger' : 'primary'}" data-pow="${i.port}">${i.running ? '停止自动' : '开始自动'}</button>
    <button class="btn sm" data-win="${i.port}">${i.hidden ? '显示窗口' : '隐藏窗口'}</button>
    <button class="btn sm" data-official="${i.port}">官方设置</button>
    <button class="btn sm" data-restart="${i.port}">重启实例</button>
    <button class="btn sm" data-alias="${i.port}">备注</button>
    <button class="btn sm" data-kill="${i.port}">关闭游戏</button>`;

  const featN = FEATURES.filter(([k]) => (i.config || {})[k]).length;
  const tabs = [['feat', '功能 ' + featN], ['official', '官方设置'], ['log', '动作'], ['run', '战报']];
  $('#dtabs').innerHTML = tabs.map(([k, n]) =>
    `<button data-tab="${k}" class="${state.tab === k ? 'on' : ''}">${esc(n)}</button>`).join('');

  const c = i.config || {};
  let html = '';
  if (state.tab === 'feat') html = featTab(i, c);
  else if (state.tab === 'official') html = officialTab(i, c);
  else if (state.tab === 'log') html = logTab(i);
  else html = runTab(i);

  body.innerHTML = html;
  body.scrollTop = keep;
}

function featTab(i, c) {
  const groups = {};
  FEATURES.forEach(([k, n, g]) => { (groups[g] = groups[g] || []).push([k, n]); });
  let html = `<div class="frow" style="height:44px">
      <span class="nm"><b>主开关</b><span class="hint">${c.enabled ? '正在跑' : '已停'}</span></span>
      <div class="sw ${c.enabled ? 'on' : ''}" data-cfg="enabled" data-type="bool"><i></i></div></div>`;
  Object.keys(groups).forEach((g) => {
    html += `<div class="group"><h3>${esc(g)}</h3>`;
    groups[g].forEach(([k, n]) => {
      html += `<div class="frow"><span class="nm">${esc(n)}</span>
        <button class="btn sm" data-run="${k}">执行</button>
        <div class="sw ${c[k] ? 'on' : ''}" data-cfg="${k}" data-type="bool"><i></i></div></div>`;
    });
    html += '</div>';
  });
  html += `<div class="note">改单个实例不影响别的号。要把这套开关复制过去，用下面的按钮。
    <div style="margin-top:8px"><button class="btn sm" data-syncall="1">复制到其他实例</button></div></div>`;
  return html;
}

function officialTab(i, c) {
  const fpsOpts = [0, 5, 10, 15, 20, 24, 30, 45, 60, 90, 120, 144];
  const opts = i.fps != null && !fpsOpts.includes(i.fps) ? [...fpsOpts, i.fps].sort((a, b) => a - b) : fpsOpts;
  const unknown = i.target === null;
  const site = i.site || {};
  const age = site.okAt ? Math.round(Date.now() / 1000 - site.okAt) : null;
  const fresh = age != null && age < 600;

  let html = `<div class="official">
    <div class="ohead">
      <div>
        <b>助手设置由官网页面负责</b>
        <p>点开就在这个窗口里加载 x1x.tw 的官方控制台（不是新窗口、不是浏览器），链接已带上端口和 key，进去直接改。左上角「返回控制台」回到这边。</p>
      </div>
      <button class="btn primary" data-official="${i.port}">在窗口内打开官方设置</button>
    </div>
    <div class="ourl">${esc(i.console || (state.snap.app && state.snap.app.site) || 'https://x1x.tw/legions/helper/')}</div>
  </div>`;

  html += `<div class="group"><h3>站点连接</h3>
    <div class="frow"><span class="nm">验签余量<span class="hint">不足 10 分钟助手会自己停手</span></span>
      <span class="val ${fresh ? 'good' : 'warned'}">${age == null ? '从没验过' : (fresh ? Math.max(0, 600 - age) + ' 秒后过期' : '已过期')}</span></div>
    <div class="frow"><span class="nm">最近一次来源<span class="hint">直连 x1x.tw 还是中控转发</span></span>
      <span class="val">${site.relayAt && site.relayAt >= (site.okAt || 0) ? '中控转发' : (site.okAt ? '助手直连' : '—')}</span></div>
    <div class="frow"><span class="nm">助手报错</span>
      <span class="val">${esc(site.err || '无')}</span></div>
    <div class="frow"><span class="nm">官网要求版本<span class="hint">低于它会被 site 拦下</span></span>
      <span class="val">v${esc(site.minimum || '?')}</span></div>
    <div class="frow"><span class="nm">立即补验签<span class="hint">把 release.json 转给这个助手</span></span>
      <button class="btn sm" data-relay="1">刷新验签</button></div>
  </div>`;

  html += `<div class="group"><h3>游戏进程</h3>
    <div class="frow"><span class="nm">锁帧<span class="hint">max_fps，写这个号自己的 settings.cfg；重启实例生效。低于 60 会顺带关掉垂直同步</span></span>
      ${unknown
        ? '<span class="val">位置未知，先认领</span>'
        : `<span class="fpsbox">
      <select data-fps>${opts.map((f) =>
        `<option value="${f}" ${i.fps === f ? 'selected' : ''}>${f === 0 ? '不限制' : f + ' FPS'}</option>`).join('')}</select>
      <input data-fpsnum type="number" min="1" max="240" step="1" placeholder="自定义"
             value="${i.fps != null && !fpsOpts.includes(i.fps) ? i.fps : ''}"></span>`}</div>
    <div class="frow"><span class="nm">进程优先级</span>
      <select data-prio><option value="idle">最低</option><option value="below">低于正常</option>
        <option value="normal">正常</option><option value="above">高于正常</option></select></div></div>`;

  if (unknown) {
    html += `<div class="note" style="border-color:#fde3cf;background:#fffbf5">
      这个实例的位置没认出来，锁帧和部署不会执行——避免写错目录。
      到「沙箱」页看它在哪个沙箱，或重启一次让程序自己认领。</div>`;
  }
  html += `<div class="note">主开关和 18 个功能开关留在「功能」页，批量下发比官网一页页点快。
    数值参数（金币保留、卡关阈值、宝箱档位这些）一律走官方页面，那边是权威实现，我不重复一套。</div>`;
  return html;
}

function logTab(i) {
  const l = i.log || [];
  if (!l.length) return '<div class="empty" style="border:0"><p>还没有动作记录。</p></div>';
  return l.map((x) => `<div class="logline ${x.ok === false ? 'bad' : ''}">
      <span class="t">${hhmm(x.t)}</span><span class="f" title="${esc(x.f || '')}">${esc(x.f || '')}</span>
      <span class="m">${esc(x.m || '')}</span></div>`).join('');
}

function runTab(i) {
  const f = i.farm || {};
  const r = i.runs || {};
  const fb = i.fallback || {};
  return `<div class="group"><h3>当前</h3>
    <div class="frow"><span class="nm">关卡</span><span class="mono dim">${esc(f.stage || '—')}</span></div>
    <div class="frow"><span class="nm">杀怪进度</span><span class="mono dim">${num(f.kills[0])} / ${num(f.kills[1])}</span></div>
    <div class="frow"><span class="nm">金 / 经验 每小时</span><span class="mono dim">${kfmt(f.gph)} · ${kfmt(f.xph)}</span></div>
    <div class="frow"><span class="nm">首领</span><span class="mono dim">${esc(f.boss || '—')}${f.bossReady ? ' · 可打' : ''}</span></div>
    ${f.stuck ? '<div class="frow"><span class="nm" style="color:var(--red)">卡关中</span></div>' : ''}
    ${fb && fb.active ? `<div class="frow"><span class="nm">退回练级</span><span class="mono dim">${esc(fb.target || '')} · 第 ${fb.round || 1} 轮</span></div>` : ''}
  </div>
  <div class="group"><h3>战斗记录</h3>
    <div class="frow"><span class="nm">累计</span><span class="mono dim">${num(r.n)} 条</span></div>
    <div class="frow"><span class="nm">进行中</span><span class="mono dim">${r.open ? esc(r.open.label) + ' · ' + (r.open.w || 0) + ' 波' : '—'}</span></div>
  </div>
  <div class="group"><h3>最近战斗</h3>
    ${(i.fights || []).length ? (i.fights || []).map((x) => `<div class="frow">
      <span class="nm">${esc(x.stage || '')}</span>
      <span class="mono dim" style="font-size:11.5px">${x.win ? '胜' : '败'} · ${hhmm(x.t)}</span></div>`).join('')
      : '<div class="frow"><span class="nm dim">暂无</span></div>'}
  </div>`;
}

/* ------------------------------------------------------------------ 渲染 */

function render() {
  const s = state.snap;
  if (!s) return;
  renderChrome(s);
  if (state.page === 'inst') renderInst(s);
  else if (state.page === 'loot') renderLoot(s);
  else if (state.page === 'sandbox') renderSandbox(s);
  else renderSettings(s);
  if (state.drawer) renderDrawer();
}

async function refresh(force) {
  if (state.busy) return;
  state.busy = true;
  try {
    const s = await api('/api/snapshot' + (force ? '?force=1' : ''));
    if (s && s.ok) {
      state.snap = s;
      if (state.sel === null || !s.instances.some((i) => i.port === state.sel)) {
        state.sel = s.instances.length ? s.instances[0].port : null;
      }
      render();
    }
  } finally {
    state.busy = false;
  }
}

function go(page) {
  if (!TITLES[page]) page = 'inst';
  state.page = page;
  if (location.hash !== '#' + page) history.replaceState(null, '', '#' + page);
  document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.page === page));
  document.querySelectorAll('.page').forEach((p) => p.classList.toggle('hidden', p.id !== 'page-' + page));
  render();
}

/* ------------------------------------------------------------------ 事件 */

document.querySelectorAll('#nav button').forEach((b) => {
  b.onclick = () => {
    if (b.dataset.page === 'official') {
      document.querySelectorAll('#nav button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      return openOfficial(0);
    }
    go(b.dataset.page);
  };
});
$('#dclose').onclick = closeDrawer;
$('#scrim').onclick = closeDrawer;

async function batchCfg(ports, patch, quiet) {
  if (!ports || !ports.length) return toast('没有目标实例', 'bad');
  const r = await api('/api/config', { ports, patch });
  const bad = (r.results || []).filter((x) => !x.ok).length;
  if (!quiet) toast(bad ? `失败 ${bad} 个` : '已下发', bad ? 'bad' : 'ok');
  await refresh(true);
}

function allPorts() { return (state.snap.instances || []).map((i) => i.port); }

/* ---------------------------------------------------------------- 锁帧 */
const CAP_RATE_KEY = 'il-console-cap-rate';

function globalCapRate() {
  const v = Number(localStorage.getItem(CAP_RATE_KEY) || 10);
  return v === 30 ? 30 : 10;
}

function setGlobalCapRate(v) {
  localStorage.setItem(CAP_RATE_KEY, String(v === 30 ? 30 : 10));
}

/* 全局锁帧「已开启」= 所有实例都锁在同一个非零档位 */
function globalCapOn() {
  const list = (state.snap && state.snap.instances) || [];
  if (!list.length) return false;
  const first = Number(list[0].fps || 0);
  return first > 0 && list.every((i) => Number(i.fps || 0) === first);
}

/* 写 max_fps：写的是各实例自己的 settings.cfg，游戏里由 cap.gd 每秒读一次，改完即时生效 */
async function writeFps(scopes, fps, label) {
  const r = await api('/api/fps', { scopes, fps });
  if (!r.ok) return toast(r.error || '写入失败', 'bad');
  const off = (r.results || []).some((x) => x.vsync_off);
  toast(`${label}：${fps === 0 ? '已解除锁帧' : '锁 ' + fps + ' 帧'}${off ? '（顺带关垂直同步）' : ''}，即时生效`, 'ok');
  return refresh(true);
}

function openLockMenu(i, anchor) {
  const menu = document.querySelector('#popMenu');
  if (!menu) return;
  const cur = Number(i.fps || 0);
  menu.innerHTML = [10, 30, 0].map((v) =>
    `<button class="popitem ${cur === v ? 'on' : ''}" data-lock-set="${i.port}" data-fps="${v}">${v === 0 ? '不限制' : '锁定 ' + v + ' 帧'}${cur === v ? ' · 当前' : ''}</button>`).join('');
  menu.classList.remove('hidden');
  const r = anchor.getBoundingClientRect();
  const width = 150;
  menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8)) + 'px';
  menu.style.top = Math.min(r.bottom + 6, window.innerHeight - 130) + 'px';
}

function closePopMenu() {
  const menu = document.querySelector('#popMenu');
  if (menu) menu.classList.add('hidden');
}

document.addEventListener('click', async (ev) => {
  const t = ev.target.closest('[data-goto],[data-top],[data-pow],[data-win],[data-kill],[data-detail],[data-tab],[data-cfg],[data-run],[data-syncall],[data-rar],[data-src],[data-box-launch],[data-box-deploy],[data-box-show],[data-box-kill],[data-pid-win],[data-pid-kill],[data-op],[data-alias],[data-restart],[data-official],[data-fix],[data-relay],[data-lock],[data-global-lock],[data-sponsor],[data-github],[data-exit],[data-check-update]');
  if (!t) return;
  const s = state.snap;
  if (!s) return;

  if (t.dataset.goto) return go(t.dataset.goto);
  if (t.dataset.rar) { state.loot.rar = t.dataset.rar; return render(); }
  if (t.dataset.src) { state.loot.src = t.dataset.src; return render(); }
  if (t.dataset.tab) { state.tab = t.dataset.tab; return renderDrawer(); }
  if (t.dataset.detail) return openDrawer(Number(t.dataset.detail));
  if (t.dataset.official !== undefined) return openOfficial(t.dataset.official);
  if (t.dataset.fix) {
    const i = (s.instances || []).find((x) => x.port === Number(t.dataset.fix));
    if (i && i.blocked === 'too_old') {
      const r = await api('/api/update', { scopes: [i.target === null ? '本机' : (i.target || '本机')] });
      toast(r.ok ? '已发起更新，助手会自己换版本重载' : (r.error || '更新失败'), r.ok ? 'ok' : 'bad');
    } else {
      const r = await api('/api/relay', { ports: [Number(t.dataset.fix)] });
      toast(r.ok ? '已把 release.json 转给这个助手，验签恢复' : (r.error || '仍然取不到 release.json'), r.ok ? 'ok' : 'bad');
    }
    return setTimeout(() => refresh(true), 1500);
  }
  if (t.dataset.relay) {
    const r = await api('/api/relay', { ports: [state.sel] });
    toast(r.ok ? '已补验签' : (r.error || '失败'), r.ok ? 'ok' : 'bad');
    return setTimeout(() => refresh(true), 1200);
  }

  if (t.dataset.top) {
    const a = t.dataset.top;
    if (a === 'refresh') return refresh(true);
    if (a === 'official') return openOfficial(0);
    if (a === 'startall') return batchCfg(allPorts(), { enabled: true });
    if (a === 'stopall') return batchCfg(allPorts(), { enabled: false });
    if (a === 'togglewin') {
      const hide = !(s.kpi.hidden > 0);
      await api('/api/window', { show: !hide, all: true });
      toast(hide ? '已隐藏全部游戏窗口' : '已显示全部窗口', 'ok');
      return refresh(true);
    }
    if (a === 'launchone') {
      const free = (s.boxes || []).filter((b) => b.has_game && !b.port);
      if (free.length) {
        const r = await api('/api/launch', { box: free[0].name });
        toast(r.ok ? `正在沙箱 ${free[0].name} 里启动，等它登录` : (r.error || '启动失败'), r.ok ? 'ok' : 'bad');
      } else {
        const r = await api('/api/launch', { count: 1 });
        toast(r.ok ? '已启动一个客户端' : (r.error || '启动失败'), r.ok ? 'ok' : 'bad');
      }
      return setTimeout(() => refresh(true), 3500);
    }
    if (a === 'launchall') {
      const free = (s.boxes || []).filter((b) => b.has_game && !b.port);
      if (!free.length) return toast('没有待启动的沙箱', 'bad');
      for (const b of free) {
        await api('/api/launch', { box: b.name });
        await new Promise((r) => setTimeout(r, 600));
      }
      toast(`已在 ${free.length} 个沙箱里拉起游戏`, 'ok');
      return setTimeout(() => refresh(true), 4000);
    }
    if (a === 'deployall') {
      const scopes = ['本机'].concat((s.boxes || []).filter((b) => b.has_game).map((b) => b.name));
      const r = await api('/api/deploy', { scopes });
      if (!r.ok) return toast(r.error || '部署失败', 'bad');
      toast(`已部署 ${(r.results || []).filter((x) => x.ok).length} 处`, 'ok');
      return refresh(true);
    }
    if (a === 'updateall') {
      toast('正在拉最新助手…');
      const r = await api('/api/update', { scopes: ['all'] });
      if (!r.ok) return toast(r.error || '更新失败', 'bad');
      toast(`处理 ${(r.results || []).filter((x) => x.ok).length} 处，最新 v${r.latest}`, 'ok');
      return refresh(true);
    }
  }

  const byPort = (p) => (s.instances || []).find((x) => x.port === Number(p));

  if (t.dataset.lockLoop) {
    const i = byPort(t.dataset.lockLoop);
    if (!i) return;
    const fps = Number(i.fps || 0) > 0 ? 0 : globalCapRate();
    await writeFps([i.target === '' ? '本机' : i.target], fps, i.alias || i.account || ('端口 ' + i.port));
    return;
  }
  if (t.dataset.lockMenu) {
    const i = byPort(t.dataset.lockMenu);
    if (!i) return;
    openLockMenu(i, t);
    return;
  }
  if (t.dataset.lockSet) {
    const i = byPort(t.dataset.lockSet);
    if (!i) return;
    closePopMenu();
    await writeFps([i.target === '' ? '本机' : i.target], Number(t.dataset.fps), i.alias || i.account || ('端口 ' + i.port));
    return;
  }
  if (t.dataset.globalLock !== undefined) {
    const on = globalCapOn();
    const fps = on ? 0 : globalCapRate();
    const scopes = (s.instances || []).filter((x) => x.target !== null).map((x) => (x.target === '' ? '本机' : x.target));
    if (!scopes.length) return toast('没有可写设置的实例', 'bad');
    await writeFps(scopes, fps, `${scopes.length} 个实例`);
    return;
  }
  if (t.dataset.exit !== undefined) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.quit) {
      await window.pywebview.api.quit();
      return;
    }
    await api('/api/quit', {});
    return toast('已退出', 'ok');
  }
  if (t.dataset.checkUpdate) return checkConsoleUpdate(true);
  if (t.dataset.sponsor) return openSponsor();
  if (t.dataset.github) return openGithub();

  if (t.dataset.pow) {
    const i = byPort(t.dataset.pow);
    if (i) return batchCfg([i.port], { enabled: !i.running });
  }
  if (t.dataset.win) {
    const i = byPort(t.dataset.win);
    if (i) { await api('/api/window', { pids: [i.pid], show: i.hidden }); return refresh(true); }
  }
  if (t.dataset.kill) {
    const i = byPort(t.dataset.kill);
    if (!i) return;
    if (!confirm(`关闭 ${i.account || i.port} 的游戏客户端？未上传的进度会丢。`)) return;
    await api('/api/kill', { pids: [i.pid] });
    toast('已关闭', 'ok');
    return refresh(true);
  }
  if (t.dataset.restart) {
    const i = byPort(t.dataset.restart);
    if (!i) return;
    if (!confirm('重启这个实例？锁帧等启动期设置会在重启后生效。')) return;
    await api('/api/kill', { pids: [i.pid] });
    await new Promise((r) => setTimeout(r, 1200));
    if (i.target === null) toast('位置未知，只能到沙箱页手动启动', 'bad');
    else await api('/api/launch', i.target === '' ? { count: 1 } : { box: i.target });
    toast('正在重启', 'ok');
    return setTimeout(() => refresh(true), 4000);
  }
  if (t.dataset.alias) {
    const i = byPort(t.dataset.alias);
    if (!i) return;
    const n = prompt('备注名（留空清除）', i.alias || '');
    if (n === null) return;
    await api('/api/alias', { port: i.port, name: n.trim() });
    return refresh(true);
  }
  if (t.dataset.syncall) {
    const i = curInst();
    if (!i) return;
    const others = allPorts().filter((p) => p !== i.port);
    if (!others.length) return toast('没有别的实例', 'bad');
    if (!confirm(`把 ${i.alias || i.account} 的功能开关复制到另外 ${others.length} 个实例？`)) return;
    const patch = {};
    Object.keys(i.config || {}).forEach((k) => { if (FNAME[k]) patch[k] = i.config[k]; });
    return batchCfg(others, patch);
  }
  if (t.dataset.run) {
    const i = curInst();
    if (!i) return;
    await api('/api/run', { ports: [i.port], feature: t.dataset.run });
    toast(`已触发「${FNAME[t.dataset.run] || t.dataset.run}」`, 'ok');
    return setTimeout(() => refresh(true), 900);
  }
  if (t.dataset.cfg && t.tagName !== 'INPUT' && t.tagName !== 'SELECT') {
    const i = curInst();
    if (!i) return;
    const on = !t.classList.contains('on');
    t.classList.toggle('on', on);
    return batchCfg([i.port], { [t.dataset.cfg]: on }, true);
  }

  if (t.dataset.boxLaunch !== undefined) {
    const box = t.dataset.boxLaunch;
    const r = box === '本机' ? await api('/api/launch', { count: 1 }) : await api('/api/launch', { box });
    toast(r.ok ? `已在${box === '本机' ? '本机' : '沙箱 ' + box}启动，等它登录` : (r.error || '启动失败'), r.ok ? 'ok' : 'bad');
    return setTimeout(() => refresh(true), 4000);
  }
  if (t.dataset.boxDeploy !== undefined) {
    const scope = t.dataset.boxDeploy;
    const r = await api('/api/deploy', { scopes: [scope] });
    if (!r.ok) return toast(r.error || '部署失败', 'bad');
    const res = (r.results || [])[0] || {};
    toast(res.ok ? `已部署到 ${scope}（${(res.wrote || []).length} 个文件）` : '部署失败', res.ok ? 'ok' : 'bad');
    return refresh(true);
  }
  if (t.dataset.boxShow !== undefined) {
    const pid = Number(t.dataset.boxShow);
    if (!pid) return toast('这个沙箱里的游戏还没连上助手', 'bad');
    await api('/api/window', { pids: [pid], show: true });
    return refresh(true);
  }
  if (t.dataset.boxKill) {
    const pid = Number(t.dataset.boxKill);
    if (!confirm('结束这个沙箱里的游戏进程？')) return;
    await api('/api/kill', { pids: [pid] });
    toast('已结束', 'ok');
    return refresh(true);
  }
  if (t.dataset.pidWin !== undefined) {
    await api('/api/window', { pids: [Number(t.dataset.pidWin)], show: t.dataset.show === '1' });
    return refresh(true);
  }
  if (t.dataset.pidKill) {
    if (!confirm('结束这个客户端进程？未上传的进度会丢。')) return;
    await api('/api/kill', { pids: [Number(t.dataset.pidKill)] });
    toast('已结束', 'ok');
    return refresh(true);
  }
  if (t.dataset.op === 'deploy-host') {
    const r = await api('/api/deploy', { scopes: ['本机'] });
    toast(r.ok ? '已部署到本机' : (r.error || '部署失败'), r.ok ? 'ok' : 'bad');
    return refresh(true);
  }
  if (t.dataset.op === 'update-all') {
    toast('正在拉最新助手…');
    const r = await api('/api/update', { scopes: ['all'] });
    if (!r.ok) return toast(r.error || '更新失败', 'bad');
    toast(`处理 ${(r.results || []).filter((x) => x.ok).length} 处，最新 v${r.latest}`, 'ok');
    return refresh(true);
  }
  if (t.dataset.op === 'open-conf') return api('/api/openconf', {});
  if (t.dataset.op === 'quit') {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.quit) {
      await window.pywebview.api.quit();
      return;
    }
    await api('/api/quit', {});
    return toast('已退出', 'ok');
  }
});

document.addEventListener('change', async (ev) => {
  const t = ev.target;
  const i = curInst();

  if ((t.dataset.fps || t.hasAttribute('data-fpsnum')) && i) {
    if (i.target === null) return toast('位置未知，不写文件', 'bad');
    let fps = Number(t.value);
    if (t.hasAttribute('data-fpsnum')) {
      if (!Number.isFinite(fps) || !t.value.trim()) return;     // 空着不算输入
      fps = Math.max(1, Math.min(240, Math.round(fps)));
      t.value = fps;
    }
    const r = await api('/api/fps', { scopes: [i.target === '' ? '本机' : i.target], fps });
    const off = (r.results || []).some((x) => x.vsync_off);
    toast(r.ok
      ? `已写入 ${fps === 0 ? '不限制' : fps + ' FPS'}${off ? '（顺带关了垂直同步）' : ''}，重启实例生效`
      : (r.error || '写入失败'), r.ok ? 'ok' : 'bad');
    return refresh(true);
  }
  if (t.dataset.prio && i) {
    await api('/api/priority', { pids: [i.pid], level: t.value });
    return toast('优先级已设置', 'ok');
  }
  if (t.dataset.cfg && i) {
    const v = t.dataset.type === 'num' ? Number(t.value) : t.value;
    if (t.dataset.type === 'num' && !Number.isFinite(v)) return;
    return batchCfg([i.port], { [t.dataset.cfg]: v }, true);
  }
  if (t.dataset.capRate) {
    setGlobalCapRate(Number(t.value));
    toast('全局锁帧档位已设为 ' + globalCapRate() + ' 帧', 'ok');
    return render();
  }
  if (t.dataset.conf) {
    let v = t.value;
    if (t.dataset.conf === 'poll_seconds') {
      v = Number(v);
      if (!Number.isFinite(v) || v < 1) return;
    }
    await api('/api/settings', { patch: { [t.dataset.conf]: v } });
    toast('已保存', 'ok');
    return refresh(true);
  }
  if (t.id === 'lootQ') { state.loot.q = t.value.trim(); render(); }
});

document.addEventListener('input', (ev) => {
  if (ev.target.id !== 'lootQ' || !state.snap) return;
  state.loot.q = ev.target.value.trim();
  const rows = document.querySelector('#lootTable tbody');
  if (rows) rows.innerHTML = lootRows(filterLoot(state.snap.loot || [], state.loot), true);
});

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.key === 'Escape') closeDrawer();
  if (e.key === 'r') refresh(true);
});


/* ------------------------------------------------------------------ 发布页 / 赞助 / 检测更新 */

function openSponsor() {
  try { window.open(SPONSOR_URL, '_blank'); toast('已打开赞助页，谢谢支持', 'ok'); }
  catch (e) { toast('打不开浏览器：' + (e.message || ''), 'bad'); }
}

function openGithub() {
  const { owner, repo } = GITHUB_REPO;
  if (!owner || !repo) return toast('还没配置发布页', 'bad');
  window.open('https://github.com/' + owner + '/' + repo + '/releases', '_blank');
}

function setUpdateState(kind, text) {
  updateState = { kind, text };
  const n = document.querySelector('#updState');
  if (n) n.textContent = text;
  const hint = document.querySelector('#updHint');
  if (hint && kind === 'new') hint.textContent = '有新版本：到项目发布页下载新包，覆盖当前 exe 后重开即可';
}

async function checkConsoleUpdate(manual) {
  const { owner, repo } = GITHUB_REPO;
  if (!owner || !repo) {
    setUpdateState('idle', '未配置发布页');
    if (manual) toast('还没配置发布页', 'bad');
    return;
  }
  setUpdateState('checking', '正在检测…');
  try {
    const r = await fetch('https://api.github.com/repos/' + owner + '/' + repo + '/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store',
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    const latest = String(j.tag_name || '').replace(/^v/i, '');
    if (!latest) throw new Error('发布页没有版本标签');
    const c = cmpVer(latest, CONSOLE_VERSION);
    if (c > 0) {
      setUpdateState('new', '发现新版本 v' + latest);
      toast('发现新版本 v' + latest + '，可在「本工具设置」里查看', 'ok');
    } else {
      setUpdateState('latest', '已是最新（v' + CONSOLE_VERSION + '）');
      if (manual) toast('当前已是最新版本', 'ok');
    }
  } catch (e) {
    setUpdateState('error', '检测失败：' + (e.message || '网络不可用'));
    if (manual) toast('检测失败：' + (e.message || '网络不可用'), 'bad');
  }
}

/* 启动 */
(async function boot() {
  await refresh(false);
  const raw = (location.hash || '').replace('#', '');
  const [page, port, tab] = raw.split('/');
  if (TITLES[page]) go(page);
  if (port && Number(port)) {
    openDrawer(Number(port));
    if (tab && ['feat', 'official', 'log', 'run'].includes(tab)) { state.tab = tab; renderDrawer(); }
  }
  state.timer = setInterval(() => {
    if (state.page === 'inst' || state.page === 'loot') refresh(false);
  }, 3000);
  setTimeout(() => checkConsoleUpdate(false), 4000);
  setInterval(() => checkConsoleUpdate(false), 6 * 60 * 60 * 1000);
})();
