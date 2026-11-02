/* ============================================================
   我的淘宝十年 · 进化版模板 · 共用功能（三套方案共用，豆包不要改这个文件）
   读取 data.js 里的 window.TEN_YEARS，提供：
   数据整理、详情浮层、日历档案、2027 计划、问豆包、藏品现状、那年今日。
   ============================================================ */
(function () {
  'use strict';
  const RAW = window.TEN_YEARS || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 隐私模式下不保存 */ } },
  };

  /* ---------- 数据整理 ---------- */
  const meta = RAW.meta || {};
  const KEY = 'ty10_' + (meta.dataset || meta.owner || 'me') + '_';
  const orders = (RAW.orders || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const orderMap = Object.fromEntries(orders.map((o) => [o.id, o]));
  const items = (RAW.items || []).slice().sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  items.forEach((it, i) => {
    it.no = i + 1;
    it.year = +it.date.slice(0, 4);
    if (it.price == null && (it.qty || 1) === 1 && orderMap[it.order] && items.filter((x) => x.order === it.order).length === 1) it.price = orderMap[it.order].paid;
  });
  const itemMap = Object.fromEntries(items.map((it) => [it.id, it]));
  const years = [...new Set(items.map((it) => it.year))].sort();
  const cats = Object.entries(items.reduce((m, it) => ((m[it.cat] = (m[it.cat] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
  const priced = items.filter((it) => it.price != null).sort((a, b) => b.price - a.price);
  // 藏品等级：豆包可以在每件上写 tier，没写就按价格自动分：前 5% 镇馆、前 25% 旗舰，其余日常
  items.forEach((it) => {
    if (it.tier) return;
    const r = priced.indexOf(it);
    it.tier = r < 0 ? '日常' : r < Math.max(1, priced.length * 0.05) ? '镇馆' : r < priced.length * 0.25 ? '旗舰' : '日常';
  });
  const ordersByYear = years.reduce((m, y) => ((m[y] = orders.filter((o) => +o.date.slice(0, 4) === y)), m), {});
  const stats = {
    orders: orders.length,
    items: items.length,
    years: years.length ? years[years.length - 1] - years[0] + (years.length > 1 ? 0 : 1) : 0,
    first: items[0],
    last: items[items.length - 1],
    top: priced[0],
    busiestYear: years.slice().sort((a, b) => ordersByYear[b].length - ordersByYear[a].length)[0],
    cats,
  };

  const fmt = {
    money(v) { return v == null ? '—' : '¥' + Number(v).toLocaleString('zh-CN', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); },
    date(d) { return d ? d.replace(/-/g, '.') : ''; },
    cn(d) { const [y, m, dd] = d.split('-'); return `${y} 年 ${+m} 月 ${+dd} 日`; },
    no(n) { return 'No.' + String(n).padStart(3, '0'); },
    yearsSince(d) { const now = new Date(); const t = new Date(d); return Math.max(0, Math.floor((now - t) / (365.25 * 864e5))); },
  };

  function placeholder(it) {
    const label = esc((it && (it.name || it.cat)) || '藏品');
    return `<div class="ty-ph">${label}</div>`;
  }
  function imgOf(it, prefer = 'img') {
    if (!it) return '';
    if (prefer === 'cut') return it.cut || it.img || '';
    return it.img || it.cut || '';
  }
  function imgTag(it, prefer, cls = '') {
    const src = imgOf(it, prefer);
    return src ? `<img class="${cls}" src="${esc(src)}" alt="${esc(it.name)}" loading="lazy" decoding="async">` : placeholder(it);
  }

  /* ---------- 藏品现状（访客自己标，存在本机） ---------- */
  const STATUS = ['在役', '退役收藏', '送人了', '卖掉了', '找不到了'];
  const statusMap = store.get(KEY + 'status', {});
  const favMap = store.get(KEY + 'fav', {});
  const listeners = [];
  function setStatus(id, s) {
    if (statusMap[id] === s) delete statusMap[id]; else statusMap[id] = s;
    store.set(KEY + 'status', statusMap); listeners.forEach((f) => f('status', id));
  }
  function toggleFav(id) {
    if (favMap[id]) delete favMap[id]; else favMap[id] = 1;
    store.set(KEY + 'fav', favMap); listeners.forEach((f) => f('fav', id));
  }

  /* ---------- 那年今日 ---------- */
  function onThisDay(ref = new Date(), windowDays = 3) {
    const md = (d) => { const parts = d.split("-"); return (+parts[1] - 1) * 31 + +parts[2]; };
    const r = ref.getMonth() * 31 + ref.getDate();
    return items.filter((it) => Math.abs(md(it.date) - r) <= windowDays && it.year < ref.getFullYear());
  }

  /* ---------- 小工具 ---------- */
  let toastEl;
  function toast(msg) {
    toastEl = toastEl || document.body.appendChild(h('<div class="ty-toast"></div>'));
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }
  function countUp(el, to, dur = 1400) {
    const t0 = performance.now(); const isMoney = String(el.dataset.money) === '1';
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur); const v = to * (1 - Math.pow(1 - p, 3));
      el.textContent = isMoney ? Math.round(v).toLocaleString('zh-CN') : Math.round(v);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function revealOnScroll(sel = '[data-reveal]') {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15 });
    $$(sel).forEach((el) => io.observe(el));
  }

  /* ---------- 详情浮层 ---------- */
  let modal;
  function openItem(id) {
    const it = itemMap[id]; if (!it) return;
    modal = modal || document.body.appendChild(h(`<div class="ty-modal" role="dialog" aria-modal="true"><div class="scrim"></div><div class="sheet"></div></div>`));
    const same = items.filter((x) => x.cat === it.cat);
    const order = orderMap[it.order] || {};
    const siblings = items.filter((x) => x.order === it.order && x.id !== it.id);
    const years = fmt.yearsSince(it.date);
    $('.sheet', modal).innerHTML = `
      <div class="pic">${imgTag(it, 'img')}<button class="ty-btn small close" data-x>关闭</button></div>
      <div class="info">
        <div class="no">${fmt.no(it.no)} · ${esc(it.cat)} · ${esc(it.tier)}</div>
        <h3>${esc(it.name)}</h3>
        <dl class="facts">
          <dt>下单日期</dt><dd>${fmt.cn(it.date)}</dd>
          <dt>${it.price != null ? '实付' : '订单实付'}</dt><dd>${fmt.money(it.price != null ? it.price : order.paid)}${it.price == null && siblings.length ? `（同单还有 ${siblings.length} 件）` : ''}</dd>
          <dt>到今天</dt><dd>${years ? `已经 ${years} 年` : '不到一年'}</dd>
          ${it.spec ? `<dt>规格</dt><dd>${esc(it.spec)}</dd>` : ''}
        </dl>
        ${it.line || it.note ? `<div class="line">${esc(it.line || '')}${it.note ? `<br><span class="ty-muted">${esc(it.note)}</span>` : ''}</div>` : ''}
        <div>
          <div class="ty-muted" style="font-size:12px;margin-bottom:6px">它现在怎么样了？（只存在你这台电脑上）</div>
          <div class="ty-status">${STATUS.map((s) => `<button data-s="${s}" class="${statusMap[id] === s ? 'on' : ''}">${s}</button>`).join('')}</div>
        </div>
        ${same.length > 1 ? `<div><div class="ty-muted" style="font-size:12px;margin-bottom:6px">同类「${esc(it.cat)}」本页共 ${same.length} 条商品行</div>
          <div class="ty-related">${same.map((x) => `<div class="r ${x.id === id ? 'cur' : ''}" data-id="${x.id}"><div class="im">${imgTag(x)}</div>${x.year}</div>`).join('')}</div></div>` : ''}
        <div class="raw">原商品名：${esc(it.title)}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="ty-btn small" data-fav>${favMap[id] ? '★ 已设为心头好' : '☆ 设为心头好'}</button>
          <button class="ty-btn small" data-cal>在日历里看这一天</button>
          ${order.link ? `<a class="ty-btn small" href="${esc(order.link)}" target="_blank" rel="noopener">打开原订单</a>` : ''}
        </div>
      </div>`;
    modal.classList.add('open'); document.documentElement.style.overflow = 'hidden';
    const close = () => { modal.classList.remove('open'); document.documentElement.style.overflow = ''; };
    modal.onclick = (e) => {
      const t = e.target;
      if (t.classList.contains('scrim') || t.hasAttribute('data-x')) return close();
      const s = t.closest('[data-s]'); if (s) { setStatus(id, s.dataset.s); return openItem(id); }
      if (t.closest('[data-fav]')) { toggleFav(id); return openItem(id); }
      const r = t.closest('.r[data-id]'); if (r) return openItem(r.dataset.id);
      if (t.closest('[data-cal]')) { close(); TY.emit('goto-date', { date: it.date, id }); }
    };
    document.onkeydown = (e) => { if (e.key === 'Escape') close(); };
    const cur = $('.r.cur', modal); if (cur) cur.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  /* ---------- 日历档案 ---------- */
  function calendar(root, opts = {}) {
    const byDate = items.reduce((m, it) => ((m[it.date] = m[it.date] || []).push(it), m), {});
    const lastDate = items.length ? items[items.length - 1].date : '2026-01-01';
    let y = +lastDate.slice(0, 4), m = +lastDate.slice(5, 7), sel = lastDate, hl = null, q = '', cat = '';
    root.classList.add('ty-cal');
    root.innerHTML = `
      <div class="bar">
        <input class="ty-input" type="search" placeholder="搜十年里买过的东西：键盘、显卡、iPhone…" aria-label="搜索">
        <select class="ty-input" style="flex:0 0 auto"><option value="">全部品类</option>${cats.map(([c, n]) => `<option value="${esc(c)}">${esc(c)}（${n}）</option>`).join('')}</select>
      </div>
      <div class="years"></div><div class="months"></div>
      <div class="results" hidden></div>
      <div class="main"><div class="grid"></div><div class="detail"></div></div>`;
    const elYears = $('.years', root), elMonths = $('.months', root), elGrid = $('.grid', root), elDetail = $('.detail', root), elRes = $('.results', root), elMain = $('.main', root);
    const inYM = (yy, mm) => items.filter((it) => it.year === yy && +it.date.slice(5, 7) === mm && (!cat || it.cat === cat));
    function row(it) {
      return `<div class="row ${hl === it.id ? 'hl' : ''}" data-id="${it.id}"><div class="im">${imgTag(it)}</div><div><b>${esc(it.name)}</b><span>${fmt.date(it.date)} · ${esc(it.cat)} · ${fmt.money(it.price != null ? it.price : (orderMap[it.order] || {}).paid)}</span></div></div>`;
    }
    function render() {
      elYears.innerHTML = years.map((yy) => `<button class="${yy === y ? 'on' : ''}" data-y="${yy}">${yy}<small>${ordersByYear[yy].length}单</small></button>`).join('');
      elMonths.innerHTML = Array.from({ length: 12 }, (_, i) => { const n = inYM(y, i + 1).length; return `<button class="${n ? 'has' : ''} ${i + 1 === m ? 'on' : ''}" data-m="${i + 1}" data-n="${n || ''}">${i + 1} 月</button>`; }).join('');
      const first = new Date(y, m - 1, 1).getDay(), days = new Date(y, m, 0).getDate();
      let g = ['日', '一', '二', '三', '四', '五', '六'].map((w) => `<div class="wd">${w}</div>`).join('');
      for (let i = 0; i < first; i++) g += '<div class="day empty"></div>';
      for (let d = 1; d <= days; d++) {
        const ds = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const list = (byDate[ds] || []).filter((it) => !cat || it.cat === cat);
        g += list.length
          ? `<button class="day has ${ds === sel ? 'on' : ''}" data-d="${ds}"><span class="d">${d}</span>${list.length > 1 ? `<span class="n">${list.length}</span>` : ''}${imgOf(list[0]) ? `<img src="${esc(imgOf(list[0]))}" alt="" loading="lazy">` : ''}</button>`
          : `<div class="day"><span class="d">${d}</span></div>`;
      }
      elGrid.innerHTML = g;
      const list = (byDate[sel] || []).filter((it) => !cat || it.cat === cat);
      elDetail.innerHTML = list.length
        ? `<h4>${fmt.cn(sel)} · ${list.length} 件</h4>${list.map(row).join('')}`
        : `<h4>${y} 年 ${m} 月</h4><p class="ty-muted">这个月买了 ${inYM(y, m).length} 件。点左边有图的日子，看那天下单的东西。</p>${inYM(y, m).slice(0, 8).map(row).join('')}`;
      const hit = $('.row.hl', elDetail); if (hit) hit.scrollIntoView({ block: 'nearest' });
    }
    function search() {
      const kw = q.trim().toLowerCase();
      if (!kw) { elRes.hidden = true; elMain.hidden = false; return render(); }
      const res = items.filter((it) => (!cat || it.cat === cat) && (it.name + it.title + it.cat + (it.spec || '')).toLowerCase().includes(kw));
      elRes.hidden = false; elMain.hidden = true;
      elRes.innerHTML = res.length ? `<div class="ty-muted" style="grid-column:1/-1">十年里找到 ${res.length} 件，点一件跳到那天</div>${res.map(row).join('')}` : '<div class="ty-muted">十年里没找到。换个词试试，比如品牌名或品类。</div>';
    }
    function goto(date, id) {
      y = +date.slice(0, 4); m = +date.slice(5, 7); sel = date; hl = id || null; q = ''; $('input', root).value = ''; search();
      if (opts.onGoto) opts.onGoto(date, id);
    }
    root.addEventListener('click', (e) => {
      const t = e.target;
      const yb = t.closest('[data-y]'); if (yb) { y = +yb.dataset.y; const ms = items.filter((it) => it.year === y).map((it) => +it.date.slice(5, 7)); m = ms.length ? ms[ms.length - 1] : 1; sel = ''; hl = null; return render(); }
      const mb = t.closest('[data-m]'); if (mb) { m = +mb.dataset.m; sel = ''; hl = null; return render(); }
      const db = t.closest('[data-d]'); if (db) { sel = db.dataset.d; hl = null; return render(); }
      const r = t.closest('.row[data-id]'); if (r) { const it = itemMap[r.dataset.id]; if (!elRes.hidden) return goto(it.date, it.id); return openItem(it.id); }
    });
    $('input', root).addEventListener('input', (e) => { q = e.target.value; search(); });
    $('select', root).addEventListener('change', (e) => { cat = e.target.value; search(); });
    TY.on('goto-date', ({ date, id }) => goto(date, id));
    render();
    return { goto, render };
  }

  /* ---------- 2027 计划 ---------- */
  function plan(root) {
    const src = RAW.plan || { groups: [] };
    const PK = KEY + 'plan';
    const base = src.groups.map((g, gi) => ({ name: g.name, items: (g.items || []).filter((x) => x.text).map((x, i) => ({ id: x.id || `g${gi}i${i}`, month: x.month || '', text: x.text, basis: x.basis || x.src || '', done: false, note: '' })) }));
    let state = store.get(PK, null);
    if (!state) state = base;
    const save = () => store.set(PK, state);
    root.classList.add('ty-plan');
    function render() {
      const all = state.flatMap((g) => g.items); const done = all.filter((x) => x.done).length;
      root.innerHTML = `
        <div class="top"><b style="font-size:15px">已完成 ${done} / ${all.length}</b><div class="prog"><i style="width:${all.length ? (done / all.length) * 100 : 0}%"></i></div>
          <button class="ty-btn small" data-exp>导出备份</button><label class="ty-btn small">导入备份<input type="file" accept="application/json" hidden data-imp></label>
          <button class="ty-btn small" data-restore>恢复导入前备份</button><button class="ty-btn small" data-reset>恢复豆包的建议</button></div>
        <div class="groups">${state.map((g, gi) => `<div class="group"><h4>${esc(g.name)}</h4>
          ${g.items.map((x, i) => `<div class="it ${x.done ? 'done' : ''}" data-g="${gi}" data-i="${i}">
            <input type="checkbox" ${x.done ? 'checked' : ''} aria-label="完成">
            <div><div class="txt" contenteditable="plaintext-only" spellcheck="false">${esc(x.text)}</div>${x.basis ? `<div class="basis">依据：${esc(x.basis)}</div>` : ''}
              <input class="ty-input note" placeholder="打卡备注（可选）" value="${esc(x.note)}"></div>
            <div class="meta"><select aria-label="月份"><option value="">月份</option>${Array.from({ length: 12 }, (_, k) => `<option ${+x.month === k + 1 ? 'selected' : ''} value="${k + 1}">${k + 1} 月</option>`).join('')}</select><button class="del" title="删除">×</button></div>
          </div>`).join('')}
          <button class="ty-btn small" data-add="${gi}">＋ 加一条</button></div>`).join('')}</div>`;
    }
    root.addEventListener('change', (e) => {
      const it = e.target.closest('.it'); if (!it) return;
      const x = state[it.dataset.g].items[it.dataset.i];
      if (e.target.type === 'checkbox') { x.done = e.target.checked; save(); render(); if (x.done) toast('打卡成功，2027 又近了一步'); }
      if (e.target.tagName === 'SELECT') { x.month = e.target.value; save(); }
      if (e.target.classList.contains('note')) { x.note = e.target.value; save(); }
    });
    root.addEventListener('focusout', (e) => {
      if (!e.target.classList.contains('txt')) return; const it = e.target.closest('.it');
      state[it.dataset.g].items[it.dataset.i].text = e.target.textContent.trim(); save();
    });
    root.addEventListener('click', (e) => {
      const t = e.target;
      if (t.classList.contains('del')) { const it = t.closest('.it'); state[it.dataset.g].items.splice(it.dataset.i, 1); save(); return render(); }
      if (t.dataset.add != null) { state[t.dataset.add].items.push({ id: 'u' + Date.now(), month: '', text: '写下一个新愿望', basis: '', done: false, note: '' }); save(); render(); const el = $$('.group', root)[t.dataset.add]; const last = $$('.txt', el).pop(); last && last.focus(); return; }
      if (t.hasAttribute('data-exp')) {
        const blob = new Blob([JSON.stringify({ kind: 'ten-years-plan', owner: meta.owner, at: new Date().toISOString(), groups: state }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '2027计划备份.json'; a.click(); return toast('已导出备份');
      }
      if (t.hasAttribute('data-restore')) { const previous = store.get(PK + '_before_import', null); if (previous) { state = previous; save(); render(); } else toast('尚无导入前备份'); return; }
      if (t.hasAttribute('data-reset')) { if (confirm('恢复成豆包最初给的建议？你自己改过的内容会被覆盖（建议先导出备份）。')) { state = JSON.parse(JSON.stringify(base)); save(); render(); } }
    });
    root.addEventListener('change', async (e) => {
      if (!e.target.hasAttribute('data-imp')) return;
      try {
        const data = JSON.parse(await e.target.files[0].text());
        if (!Array.isArray(data.groups) || !data.groups.every(g => typeof g.name === 'string' && Array.isArray(g.items) && g.items.every(x => typeof x.id === 'string' && typeof x.text === 'string'))) throw new Error('格式错误');
        store.set(PK + '_before_import', state);
        const backup = new Blob([JSON.stringify({kind: 'ten-years-plan', groups: state})], {type: 'application/json'});
        const backupLink = document.createElement('a'); backupLink.href = URL.createObjectURL(backup); backupLink.download = '导入前愿望备份.json'; backupLink.click();
        (data.groups || []).forEach((g) => {
          let mine = state.find((x) => x.name === g.name); if (!mine) { mine = { name: g.name, items: [] }; state.push(mine); }
          g.items.forEach((x) => { if (!mine.items.some((y) => y.id === x.id)) mine.items.push(x); }); // 同一条保留当前版本
        });
        save(); render(); toast('已合并导入（同一条保留你现在的版本）');
      } catch (err) { toast('导入失败：不是这个页面导出的备份'); }
    });
    render();
  }

  /* ---------- 问豆包 ---------- */
  const CHAT = RAW.chat || {};
  function contextText() {
    if (CHAT.context) return CHAT.context;
    const lines = [`称呼：${meta.owner || '我'}；范围：${(meta.range || {}).from || ''} 至 ${(meta.range || {}).to || ''}；共 ${stats.orders} 单、${stats.items} 件。`];
    years.forEach((yy) => lines.push(`${yy} 年 ${ordersByYear[yy].length} 单：` + items.filter((it) => it.year === yy && (it.star || it.tier !== '日常')).slice(0, 8).map((it) => `${it.name}（${it.date}，${fmt.money(it.price)}）`).join('、')));
    lines.push('品类件数：' + cats.map(([c, n]) => `${c}${n}`).join('、'));
    return lines.join('\n');
  }
  const SYN = { 手机: ['iphone', '手机', '小米'], 键盘: ['键盘', '键帽', '轴'], 显卡: ['显卡', 'rtx', 'gtx'], 耳机: ['耳机', 'airpods'], 游戏主机: ['主机', 'ps5', 'ps4', 'switch', '游戏机'], 掌机: ['掌机', 'steam deck', 'rog'], 显示器: ['显示器', '屏幕', '屏'], 存储: ['硬盘', '固态', 'tf', '存储'], 相机: ['相机', '镜头', '大疆'] };
  function localAnswer(q) {
    const t = q.toLowerCase();
    const bi = (s) => { const a = new Set(); s = s.replace(/[\s，。？！、,.?!]/g, ''); for (let i = 0; i < s.length - 1; i++) a.add(s.slice(i, i + 2)); return a; };
    const qb = bi(t);
    let best = null, bs = 0;
    (CHAT.presets || []).forEach((p) => { const pb = bi(p.q.toLowerCase()); let n = 0; qb.forEach((x) => pb.has(x) && n++); const sc = n / Math.max(4, Math.min(qb.size, pb.size)); if (sc > bs) { bs = sc; best = p; } });
    if (best && bs >= 0.34) return { text: best.a, items: best.items || [], src: '豆包提前读完你的订单写好的回答' };
    for (const [category] of cats) {
      if (t.includes(category.toLowerCase())) {
        const matches = items.filter(i => i.cat === category);
        return {text: `本页「${category}」共 ${matches.length} 条商品行，最早读到 ${matches[0].date} 的「${matches[0].name}」。`, items: matches.slice(0,6).map(i=>i.id)};
      }
    }
    const yr = (t.match(/20[12]\d/) || [])[0];
    if (/最贵|最高|最舍得/.test(t) && stats.top) return { text: `本页有独立商品实付记录中，最贵的是 ${fmt.cn(stats.top.date)} 的「${stats.top.name}」，${fmt.money(stats.top.price)}。`, items: [stats.top.id] };
    if (/第一|最早|开始/.test(t) && stats.first) return { text: `这份清单里最早的一件是 ${fmt.cn(stats.first.date)} 的「${stats.first.name}」。（这是读到的最早一单，不代表账号那天才开通。）`, items: [stats.first.id] };
    if (/最近|最新|最后/.test(t) && stats.last) return { text: `最近的一件是 ${fmt.cn(stats.last.date)} 的「${stats.last.name}」。`, items: [stats.last.id] };
    if (/哪.?年/.test(t) && /多|凶|疯/.test(t)) { const by = stats.busiestYear; return { text: `${by} 年下单最多，一共 ${ordersByYear[by].length} 单。`, items: items.filter((it) => it.year === by && it.star).slice(0, 6).map((it) => it.id) }; }
    for (const [cat, keys] of Object.entries(SYN)) {
      if (keys.some((k) => t.includes(k))) {
        const list = items.filter((it) => (it.cat.includes(cat) || keys.some((k) => (it.name + it.title).toLowerCase().includes(k))) && (!yr || it.year === +yr));
        if (list.length) return { text: `${yr ? yr + ' 年' : '十年里'}和「${cat}」有关的一共 ${list.length} 件，最早是 ${fmt.date(list[0].date)} 的「${list[0].name}」，最近是 ${fmt.date(list[list.length - 1].date)} 的「${list[list.length - 1].name}」。`, items: list.slice(-6).map((it) => it.id) };
      }
    }
    if (yr && ordersByYear[+yr]) { const list = items.filter((it) => it.year === +yr); return { text: `${yr} 年一共 ${ordersByYear[+yr].length} 单、${list.length} 件。比较有代表性的是：${list.filter((it) => it.star || it.tier !== '日常').slice(0, 5).map((it) => it.name).join('、') || list.slice(0, 5).map((it) => it.name).join('、')}。`, items: list.filter((it) => it.star).slice(0, 6).map((it) => it.id) }; }
    const hit = items.filter((it) => t.length >= 2 && (it.name + it.title).toLowerCase().includes(t.replace(/[？?。]/g, '').slice(-4)));
    if (hit.length) return { text: `和「${t.slice(-4)}」有关的找到 ${hit.length} 件。`, items: hit.slice(0, 6).map((it) => it.id) };
    return null;
  }
  async function askLive(q, history) {
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 25000);
    try {
      const r = await fetch(CHAT.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, history: history.slice(-6), context: contextText(), persona: CHAT.persona || '' }), signal: ctrl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json(); if (!j.answer) throw new Error('empty'); return j.answer;
    } finally { clearTimeout(timer); }
  }
  function chat(root, opts = {}) {
    const name = CHAT.name || '豆包';
    const live = !!CHAT.endpoint && location.protocol !== 'file:';
    const history = [];
    root.classList.add('ty-chat');
    root.innerHTML = `
      <div class="mode ${live ? 'live' : ''}"><span><i></i>${live ? `在线：你的问题会实时交给${esc(name)}回答` : `离线：显示${esc(name)}读完订单后写好的回答`}</span></div>
      <div class="log" aria-live="polite"></div>
      <div class="chips">${(CHAT.presets || []).slice(0, opts.chips || 6).map((p) => `<button type="button">${esc(p.q)}</button>`).join('')}</div>
      <form><input class="ty-input" placeholder="${esc(opts.placeholder || '问问这十年，比如：我哪一年买得最凶？')}" maxlength="200"><button class="ty-btn primary" type="submit">发送</button></form>`;
    const log = $('.log', root);
    function add(who, text, extra = {}) {
      const m = h(`<div class="msg ${who}"></div>`); log.appendChild(m);
      if (who === 'me') { m.textContent = text; }
      else {
        m.classList.add('typing'); let i = 0;
        const tick = () => { i += 2; m.textContent = text.slice(0, i); log.scrollTop = log.scrollHeight; if (i < text.length) setTimeout(tick, 18); else { m.classList.remove('typing'); finish(); } };
        const finish = () => {
          if (extra.items && extra.items.length) m.appendChild(h(`<div class="thumbs">${extra.items.filter((id) => itemMap[id]).map((id) => `<button data-id="${id}" title="${esc(itemMap[id].name)}">${imgTag(itemMap[id])}</button>`).join('')}</div>`));
          if (extra.src) m.appendChild(h(`<span class="src">${esc(extra.src)}</span>`));
          if (extra.handoff) { const b = h(`<button class="handoff" type="button">复制问题和资料摘要，去豆包继续问 ↗</button>`); b.onclick = () => handoff(extra.handoff); m.appendChild(b); }
          log.scrollTop = log.scrollHeight;
        };
        tick();
      }
      log.scrollTop = log.scrollHeight;
    }
    function handoff(q) {
      const text = `下面是我的淘宝订单摘要，请根据它回答我的问题，只用摘要里的事实，不要编：\n${contextText()}\n\n我的问题：${q}`;
      const box = h('<textarea class="handoff-text" aria-label="复制给豆包的摘要"></textarea>');
      box.value = text; log.appendChild(box); box.focus(); box.select();
      const go = h('<a class="ty-btn" target="_blank" rel="noopener" href="https://www.doubao.com/chat/">打开豆包，再粘贴摘要 ↗</a>');
      log.appendChild(go);
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast('已复制，点打开豆包后粘贴')).catch(() => toast('请从文本框手动复制完整摘要，再到豆包粘贴'));

    }
    async function ask(q) {
      q = q.trim(); if (!q) return;
      add('me', q); history.push({ role: 'user', content: q });
      if (live) {
        try { const a = await askLive(q, history); history.push({ role: 'assistant', content: a }); return add('ai', a, { src: `${name} 实时回答` }); }
        catch (err) { /* 在线失败就退回离线 */ }
      }
      const r = localAnswer(q);
      if (r) { history.push({ role: 'assistant', content: r.text }); return add('ai', r.text, { items: r.items, src: r.src || '离线回答 · 根据本页订单数据算出来的' }); }
      add('ai', CHAT.fallback || '这个问题我离线答不了，得联网问豆包。点下面按钮，问题和你的订单摘要会一起复制好。', { handoff: q });
    }
    root.addEventListener('submit', (e) => { e.preventDefault(); const inp = $('input', root); ask(inp.value); inp.value = ''; });
    root.addEventListener('click', (e) => {
      const c = e.target.closest('.chips button'); if (c) return ask(c.textContent);
      const th = e.target.closest('.thumbs button'); if (th) return openItem(th.dataset.id);
    });
    if (CHAT.greeting) add('ai', CHAT.greeting);
    return { ask };
  }

  /* ---------- 事件 ---------- */
  const bus = {};
  const TY = window.TY = {
    raw: RAW, meta, items, itemMap, orders, orderMap, years, cats, stats, ordersByYear,
    theme: RAW.theme || {}, story: RAW.story || {}, egg: RAW.egg || {}, scheme: RAW.scheme || {}, hero: RAW.hero || {},
    $, $$, esc, h, fmt, store, imgOf, imgTag, placeholder,
    STATUS, statusMap, favMap, setStatus, toggleFav, onChange: (f) => listeners.push(f),
    onThisDay, toast, countUp, revealOnScroll, openItem, calendar, plan, chat, contextText,
    pick(ids) { return (ids || []).map((id) => itemMap[id]).filter(Boolean); },
    on(n, f) { (bus[n] = bus[n] || []).push(f); },
    emit(n, d) { (bus[n] || []).forEach((f) => f(d)); },
  };

  // 主题色：豆包在 data.js 的 theme 里写的颜色直接生效
  const th = TY.theme, rs = document.documentElement.style;
  ['bg', 'bg2', 'fg', 'accent', 'accent2'].forEach((k) => th[k] && rs.setProperty('--' + k, th[k]));
  if (th.onAccent) rs.setProperty('--on-accent', th.onAccent);
})();
