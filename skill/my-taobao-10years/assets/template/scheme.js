/* 方案六·最终融合版 页面逻辑。
   首屏 = 方案六A「蓝色小电脑」：超大淡蓝窄体字 + three.js 真 3D 小电脑（屏幕跟着货架同步、出纸口吐小票、转向鼠标、点屏幕开详情，
          WebGL 不可用时退回 CSS 小电脑）+ 方格纸桌面上会随鼠标波浪升起的商品盒货架 + 拍立得、关键词便签、「营业中」挂牌、小猫。
   其余各段 = 方案六C「标签海报」：方格画布、倾斜标签块、选框手柄、亮面 3D 小图标。
   第三段「本店 BGM / 影视人物」是新做的两张揭晓海报。全部原生 JS（首屏 3D 用随页附带的 three.js），离线可用。 */
(function () {
  'use strict';
  const { $, $$, esc, fmt, items, stats, story, hero, meta, years, ordersByYear, scheme, egg } = TY;
  const range = meta.range || {};
  const shop = scheme.shop || `${meta.owner || '我'}的十年小铺`;
  const service = scheme.service || '客服小豆';
  const plan = TY.raw.plan || {};
  const fy = +String(range.from || '').slice(0, 4), ty = +String(range.to || '').slice(0, 4);
  const bind = {
    shop, service, serviceShort: service.replace(/^客服/, '') || service, kicker: hero.kicker || '', sub: hero.sub || '',
    planTitle: plan.title || '2027 愿望清单', count: stats.items,
    foot: `数据范围 ${range.from || ''} 至 ${range.to || ''} · 读取淘宝交易成功订单 ${meta.ordersRead || '—'} 单，本店上架 ${meta.scope || ''} ${stats.orders} 单、${stats.items} 件 · 由${meta.by || '豆包'}整理 · ${meta.amountNote || "列表实付；未逐单核退款"} · ${meta.coverageNote || "覆盖情况待确认"}`,
  };
  $$('[data-bind]').forEach((el) => { const v = bind[el.dataset.bind]; if (v != null) el.textContent = v; });
  document.title = shop;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => matchMedia('(max-width: 760px)').matches;
  const now = new Date();
  const priceOf = (it) => (it.price != null ? it.price : null);
  // 价签数字：¥ 小、整数大、角分小
  function priceHTML(v) {
    if (v == null) return '<span class="int">—</span>';
    const s = fmt.money(v).slice(1); const [a, b] = s.split('.');
    return `<span class="cur">¥</span><span class="int">${a}</span>${b ? `<span class="dec">.${b}</span>` : ''}`;
  }
  // 抠图直接悬浮；白底图装进白色小窗
  const pic = (it) => (it.cut ? `<img class="cut" src="${esc(it.cut)}" alt="${esc(it.name)}" loading="lazy" decoding="async">` : `<span class="win">${TY.imgTag(it, 'img')}</span>`);

  /* ---------- 亮面 3D 小图标（SVG 现画：挤出厚度 + 渐变 + 高光） ---------- */
  let gid = 0;
  const hl = (id, cx = 0.32, cy = 0.22, r = 0.5, o = 0.75) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="#fff" stop-opacity="${o}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;
  const lin = (id, stops, x2 = 1, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const svg = (inner) => `<svg class="i3d" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${inner}</svg>`;
  const ICON = {
    bubble() {
      const g = 'g' + (++gid);
      const P = 'M32 10H68A24 24 0 0 1 92 34V48A24 24 0 0 1 68 72H42L22 89L26 69.6A24 24 0 0 1 8 48V34A24 24 0 0 1 32 10Z';
      return svg(`<defs>${lin(g + 'a', [[0, '#8e9bff'], [0.5, '#4352ff'], [1, '#2530d8']])}${hl(g + 'b')}</defs>
        <path d="${P}" fill="#1a22a8" transform="translate(0 5)"/><path d="${P}" fill="url(#${g}a)"/><path d="${P}" fill="url(#${g}b)"/>
        <g fill="none" stroke-linecap="round" stroke-width="6.5"><path d="M30 31H70M30 42H70M30 53H52" stroke="#141c96" stroke-opacity=".35" transform="translate(0 2.2)"/><path d="M30 31H70M30 42H70M30 53H52" stroke="#fff"/></g>`);
    },
    thumb() {
      const g = 'g' + (++gid);
      const H = 'M43 47L52 29C54 24 59 23 62 26C64.5 28.5 64 32 63 36L61 43H73C78 43 80 47 79 51L75.5 70C74.5 74 72 76 68 76H43Z';
      return svg(`<defs>${lin(g + 'a', [[0, '#eaff9a'], [0.5, '#c6f432'], [1, '#8fc80f']])}${hl(g + 'b')}${lin(g + 'c', [[0, '#ffffff'], [1, '#e2e4f2']], 0, 1)}</defs>
        <rect x="10" y="10" width="80" height="80" rx="24" fill="#6c9a00" transform="translate(0 6)"/><rect x="10" y="10" width="80" height="80" rx="24" fill="url(#${g}a)"/><rect x="10" y="10" width="80" height="80" rx="24" fill="url(#${g}b)"/>
        <g fill="#4f7400" fill-opacity=".38" transform="translate(1.5 2.6)"><rect x="25" y="47" width="13" height="29" rx="3.5"/><path d="${H}"/></g>
        <g fill="url(#${g}c)"><rect x="25" y="47" width="13" height="29" rx="3.5"/><path d="${H}"/></g>`);
    },
    mega() {
      const g = 'g' + (++gid);
      return svg(`<defs>${lin(g + 'v', [[0, '#b7a3ff'], [0.5, '#7b5cff'], [1, '#5134d0']])}${lin(g + 'w', [[0, '#ffffff'], [0.55, '#eceef9'], [1, '#b7b9d6']], 0, 1)}</defs>
        <g transform="rotate(-20 50 50)">
          <rect x="33" y="55" width="13" height="30" rx="6.5" fill="url(#${g}v)"/>
          <ellipse cx="20" cy="50" rx="7" ry="13.5" fill="#5e40dc"/>
          <path d="M20 36.5L70 16C64 38 64 62 70 84L20 63.5Z" fill="url(#${g}w)"/>
          <path d="M24.5 34.6L33 31.2V68.8L24.5 65.4Z" fill="url(#${g}v)"/>
          <ellipse cx="71" cy="50" rx="12.5" ry="34.5" fill="url(#${g}v)"/>
          <ellipse cx="73.5" cy="50" rx="7.8" ry="27.5" fill="#3f24b5"/>
          <ellipse cx="75" cy="50" rx="4.6" ry="14" fill="#c4b5ff"/>
          <path d="M37 33.5L64 22.6" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>
        </g>`);
    },
    heart() {
      const g = 'g' + (++gid);
      const H = 'M50 67C32 55 28 45 33 37.5C38 30 46 32 50 39C54 32 62 30 67 37.5C72 45 68 55 50 67Z';
      return svg(`<defs><radialGradient id="${g}a" cx=".36" cy=".3" r=".75"><stop offset="0" stop-color="#ffc6f0"/><stop offset=".5" stop-color="#ff6fd0"/><stop offset="1" stop-color="#d9349c"/></radialGradient>${hl(g + 'b', 0.34, 0.24, 0.42, 0.7)}${lin(g + 'c', [[0, '#ffffff'], [1, '#f1dcef']], 0, 1)}</defs>
        <circle cx="50" cy="53" r="39" fill="#b8237f"/><circle cx="50" cy="49" r="39" fill="url(#${g}a)"/><circle cx="50" cy="49" r="39" fill="url(#${g}b)"/>
        <path d="${H}" fill="#9c1a6a" fill-opacity=".35" transform="translate(1.4 2.6)"/><path d="${H}" fill="url(#${g}c)"/>`);
    },
    ring(kind = 'pink') {
      const g = 'g' + (++gid);
      const c = kind === 'white' ? ['#ffffff', '#eef0ff', '#b4b8dc'] : kind === 'lime' ? ['#efffb0', '#c6f432', '#86bc08'] : ['#ffd4f4', '#ff6fd0', '#c22c90'];
      return svg(`<defs>${lin(g + 'a', [[0, c[0]], [0.5, c[1]], [1, c[2]]])}</defs>
        <circle cx="50" cy="53" r="28" fill="none" stroke="${c[2]}" stroke-width="18"/><circle cx="50" cy="50" r="28" fill="none" stroke="url(#${g}a)" stroke-width="18"/>
        <path d="M27.5 39A25 25 0 0 1 43 25" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="5" stroke-linecap="round"/>`);
    },
    ball(kind = 'pink') {
      const g = 'g' + (++gid);
      const c = kind === 'lime' ? ['#f2ffb8', '#c6f432', '#7fb300', '#5f8a00'] : kind === 'violet' ? ['#d6caff', '#7b5cff', '#4f2fd0', '#3a1fa8'] : ['#ffc6f0', '#ff6fd0', '#d9349c', '#b8237f'];
      return svg(`<defs><radialGradient id="${g}a" cx=".36" cy=".3" r=".75"><stop offset="0" stop-color="${c[0]}"/><stop offset=".5" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></radialGradient>${hl(g + 'b', 0.34, 0.24, 0.42, 0.7)}</defs>
        <circle cx="50" cy="53" r="39" fill="${c[3]}"/><circle cx="50" cy="49" r="39" fill="url(#${g}a)"/><circle cx="50" cy="49" r="39" fill="url(#${g}b)"/>`);
    },
    cross() {
      const g = 'g' + (++gid);
      return svg(`<defs>${lin(g + 'a', [[0, '#ffffff'], [1, '#c9cbe6']])}</defs>
        <g transform="rotate(45 50 50)"><g fill="#a9acd2" transform="translate(0 4)"><rect x="41" y="14" width="18" height="72" rx="9"/><rect x="14" y="41" width="72" height="18" rx="9"/></g><g fill="url(#${g}a)"><rect x="41" y="14" width="18" height="72" rx="9"/><rect x="14" y="41" width="72" height="18" rx="9"/></g></g>`);
    },
  };
  $$('[data-icon]').forEach((el) => { const f = ICON[el.dataset.icon]; if (f) el.innerHTML = f(el.dataset.kind); });

  /* ---------- 顶栏 ---------- */
  const nav = $('.nav');
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 30), { passive: true });

  /* ======== 首屏：以下整段移植自方案六A「蓝色小电脑」（逻辑原样保留） ======== */
  /* ---------- 首屏：超大淡蓝窄体字（hero.title） ---------- */
  const lines = String(hero.title || shop).split('\n').map((s) => s.trim()).filter(Boolean);
  const l1 = lines[0] || shop, l2 = lines.slice(1).join('');
  const bwHTML = `<span class="l1">${esc(l1)}</span>${l2 ? `<span class="l2">${esc(l2)}</span>` : ''}`;
  $$('.bw-row').forEach((r) => { r.innerHTML = bwHTML; });
  if (!l2) $('.scene').classList.add('one-line');
  $('.bigword').setAttribute('aria-label', lines.join(''));
  $('.scene').style.setProperty('--n1', [...l1].length); $('.scene').style.setProperty('--nall', [...(l1 + l2)].length);

  // 电脑版：整幅首屏按 1440 宽设计，窄一点的屏幕等比缩小；手机版另排
  const sceneEl = $('.scene');
  function fitScene() {
    const k = small() ? 1 : Math.min(1, document.documentElement.clientWidth / 1440);
    sceneEl.style.setProperty('--k', k.toFixed(4));
  }
  fitScene(); addEventListener('resize', fitScene);

  // 图钉拍立得：最早、中间、最近三年的代表藏品
  const repOf = (y) => items.filter((it) => it.year === y && (it.cut || it.img)).sort((a, b) => (b.star ? 1 : 0) - (a.star ? 1 : 0) || (b.price || 0) - (a.price || 0))[0];
  const snapYears = [years[0], years[Math.floor(years.length / 2)], years[years.length - 1]].filter((y, i, a) => y && a.indexOf(y) === i);
  $('.snaps').innerHTML = snapYears.map((y, i) => { const it = repOf(y); return it ? `<button class="snap s${i}" type="button" data-id="${it.id}" aria-label="${y} 年：${esc(it.name)}"><i class="pin"></i><span class="sn-im">${TY.imgTag(it, 'img')}</span><b>${y}</b></button>` : ''; }).join('');
  $('.snaps').addEventListener('click', (e) => { const b = e.target.closest('[data-id]'); if (b) TY.openItem(b.dataset.id); });
  // 关键词便签
  $('.memo ul').innerHTML = (story.keywords || []).slice(0, 5).map((k) => `<li>${esc(k)}</li>`).join('');
  if (!(story.keywords || []).length) $('.memo').remove();

  /* ---------- 首屏：商品盒货架 + 小电脑屏幕 ----------
     商品盒采用本版本重写的距离分段插值与缓动选择器；无第三方动效代码。 */
  const theme = TY.raw.theme || {};
  const PAL = theme.heroPalette || ['#a9c2ff','#d4bdfb','#bfe7f4','#ffd3e2','#c4ecd2','#ffe2b8'];
  const catColor = Object.fromEntries(TY.cats.map(([c], i) => [c, PAL[i % PAL.length]]));
  const WANT = small() ? 8 : 12; // 电脑 12 个（电脑左右各 6 个），手机 8 个
  let feat = TY.pick(hero.featured);
  if (feat.length < WANT) feat = feat.concat(items.filter((it) => it.star && !feat.includes(it)).sort((a, b) => (b.cut ? 1 : 0) - (a.cut ? 1 : 0) || (b.price || 0) - (a.price || 0)));
  if (feat.length < 3) feat = feat.concat(items.slice(-WANT).filter((it) => !feat.includes(it)));
  const lead = feat[0];
  feat = feat.slice(0, Math.max(WANT, Math.min(TY.pick(hero.featured).length, small() ? 10 : 16)))
    .sort((a, b) => a.date.localeCompare(b.date) || a.no - b.no); // 从左到右按时间摆，最右边是最新的
  const NB = feat.length;
  const world = $('.world'), pc = $('.pc'), stage = $('.stage');
  const tagPrice = (it) => priceOf(it);
  world.innerHTML = `<div class="plank"><i class="pk-top"></i><i class="pk-front"></i></div>` + feat.map((it, boxIndex) => `
    <div class="pkg" data-id="${it.id}" role="button" tabindex="-1" aria-label="${esc(it.name)}" style="--c:${theme.palette === 'original-digital' ? (catColor[it.cat] || PAL[0]) : PAL[boxIndex % PAL.length]}">
      <i class="bsh"></i>
      <div class="lift">
        <div class="fc fr">
          <div class="b-top"><span>${fmt.no(it.no)}</span><i></i></div>
          <div class="b-im ${it.cut ? 'cut' : 'win'}">${it.cut ? `<img src="${esc(it.cut)}" alt="" decoding="async">` : TY.imgTag(it, 'img')}</div>
          <div class="b-y">${it.year}</div><div class="b-nm">${esc(it.name)}</div>
          <span class="b-pr">${fmt.money(tagPrice(it))}</span>
        </div>
        <div class="fc bk"></div>
        <div class="fc sl"><span>${esc(shop)}</span></div>
        <div class="fc sr"><span>${fmt.no(it.no)}</span></div>
        <div class="fc tp"><i class="hd"></i><i class="seal"></i></div>
      </div>
    </div>`).join('');
  const boxes = $$('.pkg', world), lifts = $$('.pkg .lift', world), shades = $$('.pkg .bsh', world);
  let U = 100;
  function place() {
    const sm = small(), W = stage.clientWidth;
    const step = sm ? 0.46 : 0.5, beta = sm ? 36 : 32, rad = (beta * Math.PI) / 180;
    const one = Math.cos(rad) + 0.3 * Math.sin(rad); // 一个盒子投影宽度（以 U 计）
    const D = Math.min(0.42, step * Math.sin(rad) * 0.96); // 盒子厚度：刚好不和旁边的盒子穿模
    if (sm) { // 手机：一整排
      U = Math.max(56, Math.min(96, (W * 0.96) / ((NB - 1) * step + one)));
      boxes.forEach((b, i) => { b.style.transform = `translate3d(${((i - (NB - 1) / 2) * step * U).toFixed(1)}px, 0, 0) rotateY(${beta}deg)`; });
      world.style.setProperty('--PL', (((NB - 1) * step + 1.5) * U).toFixed(0) + 'px');
    } else { // 电脑：小电脑站中间，盒子分左右两组
      const gap = parseFloat(getComputedStyle(sceneEl).getPropertyValue('--gap')) || 440;
      const nL = Math.ceil(NB / 2), nR = NB - nL, gw = (W - gap) / 2 - 40;
      U = Math.max(60, Math.min(118, gw / ((Math.max(nL, nR) - 1) * step + one)));
      const cL = -(gap / 2 + gw / 2 - 10), cR = gap / 2 + gw / 2 - 10;
      boxes.forEach((b, i) => {
        const x = i < nL ? cL + (i - (nL - 1) / 2) * step * U : cR + (i - nL - (nR - 1) / 2) * step * U;
        b.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0) rotateY(${beta}deg)`;
      });
      world.style.setProperty('--PL', (W + 150).toFixed(0) + 'px');
    }
    world.style.setProperty('--U', U.toFixed(1) + 'px'); world.style.setProperty('--D', (D * U).toFixed(1) + 'px');
  }
  place();
  let curId = null, curI = -1, pc3d = null;
  let lastMove = -Infinity, heroOn = true, cursor = null, keyboardIndex = -1;
  const birth = performance.now();
  const states = boxes.map(() => ({y: reduce ? 0 : -3, speed: 0, depth: 0, depthSpeed: 0}));
  let centers = [];
  function measure() { centers = boxes.map(b => { const r = b.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height*.4+scrollY}; }); }
  function showTag(it) {
    if (!it || it.id === curId) return;
    curId = it.id; curI = feat.indexOf(it);
    $('.tag-no', pc).textContent = `${fmt.no(it.no)} · ${it.cat}${it.tier !== '日常' ? ' · ' + it.tier : ''}`;
    $('.tag-price', pc).innerHTML = priceHTML(tagPrice(it));
    $('.tag-name', pc).textContent = it.name;
    $('.tag-date', pc).textContent = `${fmt.date(it.date)} 入手`;
    $('.pp-no', pc).textContent = `${fmt.no(it.no)} · ${fmt.date(it.date)}`;
    $('.pp-line', pc).textContent = it.line || it.date + ' 的购买记录';
    if (!pc.classList.contains('is-3d')) { pc.classList.remove('pop'); void pc.offsetWidth; pc.classList.add('pop'); }
    boxes.forEach(b => b.classList.toggle('on', b.dataset.id === it.id));
    if (pc3d) pc3d.show(it);
  }
  showTag(lead);
  $('.hint-txt').textContent = '划过货架，盒子像波浪一样升起，小电脑跟着换 · 点击查看记录';
  function point(e) {
    cursor = {x:e.clientX,y:e.clientY}; lastMove = performance.now(); keyboardIndex = -1;
  }
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') point(e); }, {passive:true});
  stage.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') point(e); });
  stage.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') point(e); });
  document.addEventListener('mouseleave', () => { cursor = null; });
  addEventListener('blur', () => { cursor = null; });
  addEventListener('load', () => setTimeout(measure,80));
  addEventListener('resize', () => { place(); setTimeout(measure,80); });
  // 质量-弹簧-阻尼的解析解；每帧直接求解，无原版的四次欧拉积分实现。
  // k=70、c=12.5 是手感参数，保持现有展示节奏。
  function spring(value, velocity, target, dt) {
    const damping = 6.25, omega = Math.sqrt(70-damping*damping);
    const displacement = value-target, impulse = (velocity+damping*displacement)/omega;
    const decay = Math.exp(-damping*dt), sine = Math.sin(omega*dt), cosine = Math.cos(omega*dt);
    const next = decay*(displacement*cosine+impulse*sine);
    return [target+next, decay*((-damping*displacement+omega*impulse)*cosine+(-damping*impulse-omega*displacement)*sine)];
  }
  let previous = performance.now();
  function animateShelf(now) {
    requestAnimationFrame(animateShelf);
    const dt = Math.min(.05,(now-previous)/1000); previous = now;
    if (!heroOn || document.hidden) return;
    const age = (now-birth)/1000;
    if (!centers.length) measure();
    let active = now-lastMove<4000 ? cursor : null;
    if (keyboardIndex>=0 && now-lastMove<6000) active = {x:centers[keyboardIndex].x,y:centers[keyboardIndex].y-scrollY};
    if (!active && NB>2) {
      const fraction=(Math.sin(age*.26-1.1)+1)/2;
      active={x:centers[0].x+(centers[NB-1].x-centers[0].x)*fraction,y:centers[0].y+(centers[NB-1].y-centers[0].y)*fraction-scrollY};
    }
    const scale=parseFloat(sceneEl.style.getPropertyValue('--k'))||1;
    const radius=Math.max(U*.95,Math.min(innerWidth,1600)*.07)*scale;
    const targets=centers.map((c,i)=>{
      const dx=active ? c.x-active.x : Infinity, dy=active ? (c.y-scrollY-active.y)*.55 : Infinity;
      return reduce ? 0 : age<.35+i*.05 ? -3 : .78*Math.exp(-(dx*dx+dy*dy)/(radius*radius));
    });
    let chosen=-1, peak=.05;
    targets.forEach((target,i)=>{
      if(target>peak){chosen=i;peak=target;}
      const q=states[i]; [q.y,q.speed]=spring(q.y,q.speed,target,dt);
      [q.depth,q.depthSpeed]=spring(q.depth,q.depthSpeed,Math.max(0,target)*.35,dt);
      lifts[i].style.transform=`translate3d(0px, ${(-q.y*U).toFixed(1)}px, ${(q.depth*U).toFixed(1)}px) rotateX(${(-q.speed*.7).toFixed(2)}deg)`;
      shades[i].style.opacity=String(q.y<0?0:Math.max(.25,1-q.y*.9));
    });
    if(chosen>=0 && chosen!==curI && (curI<0 || peak>targets[curI]+.05)) showTag(feat[chosen]);
  }
  requestAnimationFrame(animateShelf);
  new IntersectionObserver(es => { heroOn = es[0].isIntersecting; },{threshold:.2}).observe($('.hero'));
  world.addEventListener('click', e => { const b=e.target.closest('.pkg'); if(b) TY.openItem(b.dataset.id); });
  if(reduce) world.addEventListener('pointerover', e => { const b=e.target.closest('.pkg'); if(b) showTag(TY.itemMap[b.dataset.id]); });
  $('.pc-mon', pc).addEventListener('click', () => curId && TY.openItem(curId));
  $('.paper-win', pc).addEventListener('click', () => curId && TY.openItem(curId));
  document.addEventListener('keydown', e => {
    if (!heroOn || $('.ty-modal.open') || e.target.closest('input,textarea,select,button,a,[contenteditable]')) return;
    if (e.key==='ArrowLeft'||e.key==='ArrowRight') {
      if(keyboardIndex<0) keyboardIndex=Math.max(0,curI);
      keyboardIndex=(keyboardIndex+(e.key==='ArrowRight'?1:NB-1))%NB;
      lastMove=performance.now();cursor=null;
    }
    if(e.key==='Enter'&&curId) TY.openItem(curId);
  });

  /* ---------- 首屏：three.js 真 3D 小电脑 ----------
     用 three.js 几何体拼的原创圆润复古小电脑：圆角机身、往里凹的屏幕、顶上提手、侧面银色旋钮、正面橙色小凹槽、
     底座和出纸口、三个彩色小键；软塑料材质（MeshPhysicalMaterial + RoomEnvironment），地面柔和投影。
     屏幕和小票都是 CanvasTexture：屏幕显示离鼠标最近的那件（换商品时从上往下扫过刷新），小票从出纸口吐出来。
     鼠标移动时电脑带惯性转向鼠标，平时轻轻上下浮动；点电脑打开当前商品详情。
     浏览器不支持 WebGL 或出错时，什么都不做，继续显示原来的 CSS 小电脑。 */
  function initPC3D() {
    const T = window.THREE;
    if (!T || !T.WebGLRenderer || !T.RoundedBoxGeometry) return null;
    try { const tc = document.createElement('canvas'); if (!(tc.getContext('webgl2') || tc.getContext('webgl'))) return null; } catch (err) { return null; } // 先探一下，不支持就安静地退回 CSS 电脑
    const W3 = 620, H3 = 640; // 画布在小电脑盒子里的大小（场景像素）
    const canvas = document.createElement('canvas');
    canvas.className = 'pc3d'; canvas.dataset.bodyColor = theme.pcBody; canvas.dataset.screenColor = theme.screenBg; canvas.setAttribute('aria-hidden', 'true');
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
      if (!renderer.getContext()) throw new Error('no gl');
    } catch (err) { return null; }
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.NeutralToneMapping || T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    const scene3 = new T.Scene();
    const pmrem = new T.PMREMGenerator(renderer);
    scene3.environment = pmrem.fromScene(new T.RoomEnvironment(), 0.04).texture; pmrem.dispose();
    scene3.environmentIntensity = 0.5;
    const camera = new T.PerspectiveCamera(28, W3 / H3, 0.1, 100);
    camera.position.set(0, 1.5, 14); camera.lookAt(0, -0.85, 0);
    const sun = new T.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-3.5, 7, 5); sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 });
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.radius = 7; sun.shadow.bias = -0.0006;
    scene3.add(sun, new T.HemisphereLight(0xf2f5ff, 0xb9a6ee, 0.45));

    // 材质：淡蓝软塑料
    const phys = (color, o = {}) => new T.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.46, clearcoat: 0.45, clearcoatRoughness: 0.32, sheen: 0.25, sheenRoughness: 0.6, sheenColor: new T.Color('#cfdcff') }, o));
    const M = {
      body: phys(theme.pcBody), frame: phys(theme.pcFrame, { roughness: 0.4 }), base: phys(theme.pcBase), handle: phys(theme.pcHandle),
      side: phys(theme.pcSide), silver: new T.MeshPhysicalMaterial({ color: '#e5e9f2', metalness: 0.85, roughness: 0.26, clearcoat: 0.6 }),
      cap: phys(theme.pcCap, { clearcoat: 0.8 }), orange: phys('#f2894a', { roughness: 0.5 }), dark: phys('#242949', { roughness: 0.6, sheen: 0 }),
      g: phys('#6fd795'), p: phys('#a888f0'), c: phys('#5fc6d8'), led: new T.MeshBasicMaterial({ color: '#63f0a2' }),
    };
    const rbox = (w, h, d, r, mat, seg = 6) => { const m = new T.Mesh(new T.RoundedBoxGeometry(w, h, d, seg, r), mat); m.castShadow = true; m.receiveShadow = true; return m; };
    const rr = (w, h, r, P = T.Shape) => { const s = new P(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };

    const pc = new T.Group(); // 整台电脑
    const BODY = { w: 3.4, h: 2.6, d: 2.0 };
    const body = rbox(BODY.w, BODY.h, BODY.d, 0.55, M.body, 8); pc.add(body);
    // 机身后半截稍深一点的蓝，像参考图那种前后两段的复古显示器
    const back = rbox(2.9, 2.2, 1.2, 0.5, M.side, 6); back.position.set(0, 0.02, -0.95); pc.add(back);
    // 屏幕框：圆角矩形挖一个圆角洞再挤出，屏幕就往里凹
    const frameShape = rr(3.02, 2.12, 0.42); frameShape.holes.push(rr(2.5, 1.66, 0.26, T.Path));
    const frame = new T.Mesh(new T.ExtrudeGeometry(frameShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 5, curveSegments: 18 }), M.frame);
    frame.position.set(0, 0.16, 0.97); frame.castShadow = true; pc.add(frame);
    // 屏幕（自发光 CanvasTexture）
    const SW = 1024, SH = Math.round(1024 * 1.66 / 2.5);
    const scrCv = document.createElement('canvas'); scrCv.width = SW; scrCv.height = SH;
    const prevCv = document.createElement('canvas'); prevCv.width = SW; prevCv.height = SH;
    const nextCv = document.createElement('canvas'); nextCv.width = SW; nextCv.height = SH;
    const scrTex = new T.CanvasTexture(scrCv); scrTex.colorSpace = T.SRGBColorSpace; scrTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const screen = new T.Mesh(new T.PlaneGeometry(2.5, 1.66), new T.MeshBasicMaterial({ map: scrTex, toneMapped: false }));
    screen.position.set(0, 0.16, 1.005); pc.add(screen);
    // 屏幕玻璃反光
    const glareCv = document.createElement('canvas'); glareCv.width = 256; glareCv.height = 170;
    { const g = glareCv.getContext('2d'); const gr = g.createLinearGradient(0, 0, 256, 170); gr.addColorStop(0, 'rgba(255,255,255,.22)'); gr.addColorStop(0.35, 'rgba(255,255,255,.04)'); gr.addColorStop(0.36, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 170); }
    const glare = new T.Mesh(new T.PlaneGeometry(2.5, 1.66), new T.MeshBasicMaterial({ map: new T.CanvasTexture(glareCv), transparent: true, depthWrite: false, toneMapped: false }));
    glare.position.set(0, 0.16, 1.012); pc.add(glare);
    // 屏幕角上一张小便签
    const note = rbox(0.5, 0.42, 0.03, 0.04, phys('#f3eaff', { clearcoat: 0, sheen: 0, roughness: 0.85 }), 2); note.position.set(1.05, 0.95, 1.14); note.rotation.z = -0.16; pc.add(note);
    // 正面下沿：指示灯、散热格栅、橙色小凹槽
    const led = new T.Mesh(new T.SphereGeometry(0.07, 16, 12), M.led); led.position.set(-1.28, -1.04, 1.0); pc.add(led);
    for (let i = 0; i < 7; i++) { const g = rbox(0.05, 0.16, 0.06, 0.02, M.dark, 1); g.position.set(-0.45 + i * 0.13, -1.04, 0.99); pc.add(g); }
    const slot = rbox(0.56, 0.24, 0.14, 0.1, M.orange, 4); slot.position.set(1.12, -1.04, 0.97); pc.add(slot);
    const slotIn = rbox(0.36, 0.08, 0.1, 0.035, phys('#8a3f1c', { clearcoat: 0, sheen: 0 }), 2); slotIn.position.set(1.12, -1.04, 1.03); pc.add(slotIn);
    // 顶上提手：半个圆环
    const handle = new T.Mesh(new T.TorusGeometry(0.56, 0.15, 20, 48, Math.PI), M.handle); handle.position.set(0, 1.18, -0.2); handle.castShadow = true; pc.add(handle);
    const hb = rbox(1.5, 0.22, 0.5, 0.1, M.handle, 3); hb.position.set(0, 1.28, -0.2); pc.add(hb);
    // 侧面银色旋钮
    const knob = new T.Mesh(new T.CylinderGeometry(0.56, 0.56, 0.26, 56), M.silver); knob.rotation.z = Math.PI / 2; knob.position.set(BODY.w / 2 + 0.08, 0.2, 0.15); knob.castShadow = true; pc.add(knob);
    const ring = new T.Mesh(new T.TorusGeometry(0.5, 0.05, 12, 56), M.silver); ring.rotation.y = Math.PI / 2; ring.position.set(BODY.w / 2 + 0.22, 0.2, 0.15); pc.add(ring);
    const cap = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.12, 40), M.cap); cap.rotation.z = Math.PI / 2; cap.position.set(BODY.w / 2 + 0.24, 0.2, 0.15); pc.add(cap);
    // 底座 + 出纸口 + 三个彩色小键
    const baseY = -1.62, baseBottom = -2.1;
    const base = rbox(2.5, 0.96, 1.7, 0.32, M.base, 6); base.position.set(0, baseY, 0.12); pc.add(base);
    const mouth = rbox(1.32, 0.11, 0.08, 0.04, M.dark, 2); mouth.position.set(-0.36, baseY + 0.02, 0.97); pc.add(mouth);
    [M.g, M.p, M.c].forEach((m, i) => { const k = rbox(0.22, 0.22, 0.14, 0.06, m, 3); k.position.set(0.52 + i * 0.3, baseY + 0.02, 0.96); pc.add(k); });
    pc.traverse((o) => { if (o.isMesh && o !== screen && o !== glare) { o.castShadow = true; } });

    // 小票：从出纸口吐出来，CanvasTexture，出纸口以上的部分用剪裁平面藏起来
    const PW = 1.12, PH = 2.05, slotY = baseY + 0.02;
    const papCv = document.createElement('canvas'); papCv.width = 384; papCv.height = Math.round(384 * PH / PW);
    const papTex = new T.CanvasTexture(papCv); papTex.colorSpace = T.SRGBColorSpace; papTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const clip = new T.Plane(new T.Vector3(0, -1, 0), slotY);
    const papGeo = new T.PlaneGeometry(PW, PH, 1, 16);
    { const pos = papGeo.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); const d = Math.max(0, PH / 2 - y - 0.55); pos.setZ(i, d * d * 0.09); } pos.needsUpdate = true; papGeo.computeVertexNormals(); }
    const paper = new T.Mesh(papGeo, new T.MeshBasicMaterial({ map: papTex, transparent: true, alphaTest: 0.5, side: T.DoubleSide, clippingPlanes: [clip], toneMapped: false }));
    paper.position.set(-0.36, slotY - PH / 2, 1.0); paper.renderOrder = 2; pc.add(paper);

    // 地面：只接投影的透明平面 + 一块柔和的接触阴影
    const ground = new T.Mesh(new T.PlaneGeometry(10, 7), new T.ShadowMaterial({ opacity: 0.16, depthWrite: false }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = baseBottom - 0.005; ground.receiveShadow = true; ground.renderOrder = 1;
    const blobCv = document.createElement('canvas'); blobCv.width = blobCv.height = 128;
    { const g = blobCv.getContext('2d'); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(31,35,64,.42)'); gr.addColorStop(1, 'rgba(31,35,64,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
    const blob = new T.Mesh(new T.PlaneGeometry(3.6, 2.2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(blobCv), transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.set(0, baseBottom - 0.002, 0.15); blob.renderOrder = 1;
    scene3.add(ground, blob);
    const holder = new T.Group(); holder.add(pc); scene3.add(holder);
    holder.rotation.y = -0.34;

    /* 屏幕：深色点阵屏 + 逐行扫过刷新 */
    const sctx = scrCv.getContext('2d');
    function drawScreen(cv, it) {
      const c = cv.getContext('2d'); const w = cv.width, h = cv.height;
      const bg = c.createRadialGradient(w * 0.3, h * 0.2, 20, w * 0.5, h * 0.5, w * 0.75); bg.addColorStop(0, theme.screenTop); bg.addColorStop(1, theme.screenBg);
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      if (it) {
        const px = 74; c.textBaseline = 'alphabetic'; c.shadowColor = 'rgba(150,185,255,.7)'; c.shadowBlur = 18;
        c.fillStyle = theme.screenLabel; c.font = '700 34px "SF Mono", Menlo, Consolas, monospace';
        c.fillText(`${fmt.no(it.no)} · ${it.cat}${it.tier !== '日常' ? ' · ' + it.tier : ''}`, px, 120);
        const pv = tagPrice(it); const ps = pv == null ? '—' : fmt.money(pv); const [pi, pd] = ps.slice(1).split('.');
        c.fillStyle = theme.screenFg; c.font = '700 76px "Arial Rounded MT Bold", "Arial Rounded Bold", "Helvetica Neue", Arial, sans-serif'; c.fillText(pv == null ? '' : '¥', px, 280);
        const yw = pv == null ? 0 : c.measureText('¥').width + 6;
        let fs = 168; c.font = `700 ${fs}px "Arial Rounded MT Bold", "Arial Rounded Bold", "Helvetica Neue", Arial, sans-serif`;
        while (c.measureText(pi || ps).width > w - px * 2 - yw - 120 && fs > 90) { fs -= 8; c.font = `700 ${fs}px "Arial Rounded MT Bold", "Arial Rounded Bold", "Helvetica Neue", Arial, sans-serif`; }
        c.fillText(pi || ps, px + yw, 290); const iw = c.measureText(pi || ps).width;
        if (pd) { c.font = `700 ${Math.round(fs * 0.45)}px "Arial Rounded MT Bold", "Arial Rounded Bold", Arial, sans-serif`; c.fillText('.' + pd, px + yw + iw + 4, 290); }
        c.font = '900 64px "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif';
        let nm = it.name; while (c.measureText(nm).width > w - px * 2 && nm.length > 2) nm = nm.slice(0, -2) + '…';
        c.fillText(nm, px, 410);
        c.fillStyle = theme.screenDate; c.font = '600 36px "SF Mono", Menlo, Consolas, monospace'; c.fillText(`${fmt.date(it.date)} 入手`, px, 492);
        c.shadowBlur = 0;
      }
      // 点阵：一格一格的暗缝
      c.fillStyle = 'rgba(14,16,30,.5)';
      for (let x = 0; x < w; x += 7) c.fillRect(x, 0, 2, h);
      for (let y = 0; y < h; y += 7) c.fillRect(0, y, w, 2);
      const vg = c.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.68); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
      c.fillStyle = vg; c.fillRect(0, 0, w, h);
    }
    let scan = 1, scanT0 = 0;
    function composeScreen(p) {
      sctx.clearRect(0, 0, SW, SH);
      const y = Math.round(p * SH);
      sctx.globalAlpha = 1; sctx.drawImage(prevCv, 0, 0);
      sctx.save(); sctx.beginPath(); sctx.rect(0, 0, SW, y); sctx.clip(); sctx.drawImage(nextCv, 0, 0); sctx.restore();
      if (p < 1) { const g = sctx.createLinearGradient(0, y - 46, 0, y + 6); g.addColorStop(0, 'rgba(160,195,255,0)'); g.addColorStop(1, 'rgba(190,215,255,.75)'); sctx.fillStyle = g; sctx.fillRect(0, y - 46, SW, 52); }
      scrTex.needsUpdate = true;
    }
    /* 小票 */
    function drawPaper(it) {
      const c = papCv.getContext('2d'); const w = papCv.width, h = papCv.height;
      c.clearRect(0, 0, w, h);
      const zig = 14;
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(w, h - zig);
      for (let x = w; x > 0; x -= zig * 2) { c.lineTo(x - zig, h); c.lineTo(Math.max(0, x - zig * 2), h - zig); }
      c.closePath(); c.fill();
      const sh = c.createLinearGradient(0, 0, 0, 60); sh.addColorStop(0, 'rgba(31,35,64,.16)'); sh.addColorStop(1, 'rgba(31,35,64,0)'); c.fillStyle = sh; c.fillRect(0, 0, w, 60);
      if (!it) return;
      const px = 26; c.fillStyle = '#6b7194'; c.font = '700 27px "SF Mono", Menlo, Consolas, monospace';
      c.fillText(`${fmt.no(it.no)} · ${fmt.date(it.date)}`, px, 66);
      c.strokeStyle = 'rgba(31,35,64,.3)'; c.setLineDash([8, 7]); c.lineWidth = 2; c.beginPath(); c.moveTo(px, 90); c.lineTo(w - px, 90); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#1f2340'; c.font = '800 40px "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif';
      const txt = it.line || it.note || `${fmt.cn(it.date)}入手的${it.cat}。`; let line = '', y = 148; const lh = 56, maxW = w - px * 2;
      for (const ch of [...txt]) { if (c.measureText(line + ch).width > maxW) { c.fillText(line, px, y); line = ch; y += lh; if (y > h - 240) { line += '…'; break; } } else line += ch; }
      if (line) c.fillText(line, px, y);
      // 条形码
      let bx = px, s = it.no * 97 + 13; const by = h - 190;
      c.fillStyle = '#1f2340'; while (bx < w - px) { s = (s * 9301 + 49297) % 233280; const bw = 2 + (s % 5); c.fillRect(bx, by, bw, 62); bx += bw + 2 + ((s >> 3) % 4); }
      c.fillStyle = '#6b7194'; c.font = '600 20px "SF Mono", Menlo, monospace'; c.fillText(String(it.no).padStart(6, '0') + String(it.year), px, by + 92);
      papTex.needsUpdate = true;
    }
    let printT0 = -1e9;
    let shownId = null;
    function show(it) {
      if (!it || it.id === shownId) return; shownId = it.id; canvas.dataset.item = it.id;
      // 上一次还没扫完就又换了（鼠标快速划过）：扫描线接着往下走，只把目标换成最新这件，小票同理。
      // 这样屏幕上最多两件商品（线上是最新的，线下是上一件扫完的），一直快划也能扫到底。
      const now = performance.now();
      if (scan >= 1) { prevCv.getContext('2d').drawImage(nextCv, 0, 0); scanT0 = now; scan = 0; }
      drawScreen(nextCv, it);
      drawPaper(it); if (now - printT0 >= 200) printT0 = now;
    }

    // 放进页面：画布叠在小电脑盒子上，CSS 电脑藏起来（屏幕文字仍留给读屏）
    const host = $('.pc');
    host.appendChild(canvas); host.classList.add('is-3d');
    function resize() {
      const vis = canvas.getBoundingClientRect().width / W3 || 1; // 场景缩放、手机缩放之后的实际比例
      const pr = Math.min(2, Math.max(1, (window.devicePixelRatio || 1) * vis)) * lowRes;
      renderer.setPixelRatio(pr); renderer.setSize(W3, H3, false);
    }
    let lowRes = 1; resize(); addEventListener('resize', resize);

    // 转向鼠标（带惯性）+ 上下浮动
    let mx = 0.5, my = 0.5, ry = -0.34, rx = 0, vy = 0, vx = 0;
    addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; }, { passive: true });
    let on = true;
    new IntersectionObserver((es) => es.forEach((e) => { on = e.isIntersecting; }), { threshold: 0.05 }).observe(canvas);
    // 点电脑打开详情；指到电脑上时鼠标变小手
    const ray = new T.Raycaster(), ndc = new T.Vector2();
    const hit = (cx, cy) => { const r = canvas.getBoundingClientRect(); if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return false; ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.intersectObject(pc, true).length > 0; };
    document.addEventListener('click', (e) => { if (!e.target.closest('.pkg, a, button, .snap') && hit(e.clientX, e.clientY) && curId) TY.openItem(curId); });
    let hovT = 0;
    addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse' || performance.now() - hovT < 60) return; hovT = performance.now(); sceneEl.classList.toggle('pc-hover', hit(e.clientX, e.clientY)); }, { passive: true });
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop = true; host.classList.remove('is-3d'); canvas.remove(); });

    let stop = false, last = performance.now(), slow = 0, frames = 0;
    const t0 = performance.now();
    function loop(now) {
      if (stop) return; requestAnimationFrame(loop);
      if (!on || document.hidden) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      // 太卡就降低像素比、关掉实时阴影
      if (frames < 90) { frames++; if (dt > 0.034) slow++; if (frames === 90 && slow > 45) { lowRes = 0.7; renderer.shadowMap.enabled = false; resize(); } }
      const t = (now - t0) / 1000;
      const ty = -0.34 + (reduce ? 0 : (mx - 0.5) * 0.62), tx = reduce ? 0 : (my - 0.45) * 0.16;
      vy += ((ty - ry) * 28 - vy * 7.5) * dt; ry += vy * dt; vx += ((tx - rx) * 28 - vx * 7.5) * dt; rx += vx * dt;
      holder.rotation.set(rx, ry, 0);
      pc.position.y = reduce ? 0 : Math.sin(t * 1.5) * 0.055;
      blob.scale.setScalar(1 - pc.position.y * 0.6); blob.material.opacity = 1 - pc.position.y * 2;
      if (scan < 1) { scan = Math.min(1, (now - scanT0) / 200); composeScreen(1 - (1 - scan) * (1 - scan)); }
      const pp = reduce ? 1 : Math.min(1, (now - printT0) / 200); const stepP = Math.floor(pp * 4) / 4;
      paper.position.y = slotY - PH / 2 + (1 - stepP) * PH * 0.13; // 换商品时小票往回缩一小截再一格一格吐出来
      paper.rotation.x = Math.sin(t * 1.1) * 0.03;
      holder.updateMatrixWorld(true);
      clip.set(new T.Vector3(0, -1, 0), slotY).applyMatrix4(pc.matrixWorld);
      renderer.render(scene3, camera);
    }
    drawScreen(prevCv, null);
    requestAnimationFrame(loop);
    return { show };
  }
  try { pc3d = initPC3D(); } catch (err) { pc3d = null; const c = $('.pc3d'); if (c) c.remove(); $('.pc').classList.remove('is-3d'); }
  if (pc3d && curId) pc3d.show(TY.itemMap[curId]);

  // 首屏底部的滚动公告条
  const fromTxt = String(range.from || (stats.first && stats.first.date) || '').replace('-', '.');
  const tick = [`已读始于 ${fromTxt}`, `${stats.orders} 单`, `${stats.items} 件`, `${TY.cats.length} 个品类`, stats.top ? `已知单件最高 ${fmt.money(stats.top.price)}` : '', ...(story.keywords || [])].filter(Boolean);
  const tickHTML = tick.map((t) => `<span>${esc(t)}</span><i>✦</i>`).join('');
  $('.ticker-in').innerHTML = tickHTML + tickHTML;
  requestAnimationFrame(() => document.body.classList.add('ready'));
  /* ======== 首屏结束；以下各段是方案六C「标签海报」 ======== */

  /* ---------- 本店故事 ---------- */
  $('.story .summary').textContent = story.summary || '';
  $('.since-open').textContent = range.from ? `已读记录始于 ${fy} 年 ${+String(range.from).slice(5, 7)} 月 · 最近读到 ${ty} 年 ${+String(range.to).slice(5, 7)} 月` : '';
  const statList = [[stats.orders, '笔订单', 'l'], [stats.items, '件商品', 'k'], [TY.cats.length, '个品类', 'v'], [ty && fy ? ty - fy : years.length, '年记录跨度', 'w']];
  $('.stats').innerHTML = statList.map(([n, l, c], i) => `<div class="stat c-${c}" style="--rot:${[-4, 3, -2, 5][i]}deg"><b data-n="${n}">0</b><span>${l}</span></div>`).join('');
  new IntersectionObserver((es, io) => es.forEach((e) => { if (e.isIntersecting) { $$('.stat b').forEach((b) => TY.countUp(b, +b.dataset.n)); io.disconnect(); } }), { threshold: 0.4 }).observe($('.stats'));
  $('.kw').innerHTML = (story.keywords || []).map((k, i) => `<span class="kw-s k${i % 5}${i % 5 === 1 ? ' hs' : ''}" style="--rot:${[-4, 3, -2, 5, -5][i % 5]}deg">${esc(k)}</span>`).join('');

  /* ---------- 人气单品 ---------- */
  const pool = items.filter((it) => it.tier === '镇馆' || it.star)
    .sort((a, b) => (b.cut ? 1 : 0) - (a.cut ? 1 : 0) || (b.tier === '镇馆' ? 1 : 0) - (a.tier === '镇馆' ? 1 : 0) || (b.price || 0) - (a.price || 0));
  const PER = 6; const pages = Math.max(1, Math.ceil(pool.length / PER)); let page = 0;
  function renderCards() {
    const list = pool.slice(page * PER, page * PER + PER);
    $('.cards').innerHTML = list.map((it, k) => `<article class="pcard c${k % 3} hs" data-id="${it.id}" style="--i:${k}">
      <div class="pimg ${it.cut ? 'is-cut' : 'is-win'}">${pic(it)}</div>
      ${it.tier !== '日常' ? `<span class="pt-tier ${it.tier === '镇馆' ? 't1' : 't2'}">${esc(it.tier)}</span>` : ''}
      <div class="pbody"><span class="pno">${fmt.no(it.no)} · ${fmt.date(it.date)}</span><h3>${esc(it.name)}</h3>
      <p>${esc(it.line || it.note || `${fmt.cn(it.date)}入手的${it.cat}`)}</p>
      <div class="price">${priceHTML(priceOf(it))}</div>
      <button class="mini-btn" type="button">再看一眼</button></div></article>`).join('');
    $('.batch').textContent = pages > 1 ? `第 ${page + 1} / ${pages} 批` : '';
    $('.cards').scrollLeft = 0;
  }
  renderCards();
  $('[data-more]').onclick = () => { page = (page + 1) % pages; renderCards(); };
  if (pages < 2) $('[data-more]').hidden = true;
  $('.cards').addEventListener('click', (e) => { const c = e.target.closest('.pcard'); if (c) TY.openItem(c.dataset.id); });

  /* ---------- 年度小票 ---------- */
  function barcode(seed) {
    let x = 0, s = seed, g = [];
    while (x < 100) { s = (s * 9301 + 49297) % 233280; const w = 0.6 + (s / 233280) * 2.2; const gap = 0.5 + ((s * 7) % 233280) / 233280 * 1.6; g.push(`#111 ${x.toFixed(1)}% ${(x + w).toFixed(1)}%`, `transparent ${(x + w).toFixed(1)}% ${(x + w + gap).toFixed(1)}%`); x += w + gap; }
    return `linear-gradient(90deg, ${g.join(',')})`;
  }
  $('.tickets').innerHTML = years.map((y, k) => {
    const list = items.filter((it) => it.year === y);
    const reps = list.slice().sort((a, b) => (b.star ? 1 : 0) - (a.star ? 1 : 0) || (b.price || 0) - (a.price || 0)).slice(0, 6);
    const lead = reps.find((it) => it.img || it.cut);
    const ys = (story.years || {})[y] || {};
    return `<article class="ticket" style="--tilt:${[-1.4, 1.1, -0.6, 1.6, -1.1, 0.7][k % 6]}deg;--k:${k}">
      <div class="t-head"><b>${esc(shop)}</b><span>年度购物小票</span></div>
      <div class="t-year">${y}</div>
      <div class="t-title"><span>${esc(ys.title || '')}</span></div>
      <div class="t-meta"><span>单数 ${ordersByYear[y].length}</span><span>件数 ${list.length}</span></div>
      ${lead ? `<button class="t-pic" type="button" data-id="${lead.id}" aria-label="${esc(lead.name)}">${TY.imgTag(lead, 'img')}</button>` : ''}
      <div class="t-rows"><div class="t-th"><span>商品</span><span>实付</span></div>${reps.map((it) => `<button class="t-row" type="button" data-id="${it.id}"><span>${esc(it.name)}</span><i></i><b>${fmt.money(it.price)}</b></button>`).join('')}
      ${list.length > reps.length ? `<button class="t-more" type="button" data-date="${list[0].date}">…另有 ${list.length - reps.length} 件，去日历翻翻</button>` : ''}</div>
      <div class="t-total"><span>全年合计</span><b>${ordersByYear[y].length} 单 · ${list.length} 件</b></div>
      ${ys.line ? `<p class="t-line">${esc(ys.line)}</p>` : ''}
      <div class="t-bar" style="background:${barcode(y * 31 + list.length)}"></div><div class="t-no">${y}${String(ordersByYear[y].length).padStart(3, '0')}${String(list.length).padStart(3, '0')}</div>
    </article>`;
  }).join('');
  $('.tickets').addEventListener('click', (e) => {
    const m = e.target.closest('.t-more'); if (m) return TY.emit('goto-date', { date: m.dataset.date });
    const b = e.target.closest('[data-id]'); if (b) TY.openItem(b.dataset.id);
  });
  new IntersectionObserver((es, io) => es.forEach((e) => { if (e.isIntersecting) { $('.tickets').classList.add('printed'); io.disconnect(); } }), { threshold: 0.12 }).observe($('.tickets'));
  const scrollRow = (el, d) => el.scrollBy({ left: d * Math.max(260, el.clientWidth * 0.7), behavior: 'smooth' });
  $('.receipts .scroll-btns').addEventListener('click', (e) => { const b = e.target.closest('[data-sc]'); if (b) scrollRow($('.tickets'), +b.dataset.sc); });

  /* ---------- 本店专题 ---------- */
  const KIND = { lineup: '同款换代', compare: '前后对比', loyal: '回购常客', moment: '那一年', rare: '绝版好物' };
  const TC = ['w', 'k', 'l', 'v', 'b', 'w2'];
  const thumb = (it) => `<button class="ti ${it.cut ? 'is-cut' : 'is-win'}" type="button" data-id="${it.id}" title="${esc(it.name)}"><span class="ti-im">${pic(it)}</span><span class="ti-y">${it.year}</span></button>`;
  $('.topic-grid').innerHTML = (story.chapters || []).map((c, i) => {
    const its = TY.pick(c.items);
    let strip;
    if (c.kind === 'compare' && its.length >= 2) {
      const a = its[0], b = its[its.length - 1];
      strip = `<div class="vs"><button class="vs-a ${a.cut ? 'is-cut' : 'is-win'}" type="button" data-id="${a.id}"><span class="ti-im">${pic(a)}</span><span class="vs-l">${a.year} · ${esc(a.name)}<b>${fmt.money(a.price)}</b></span></button>
        <span class="vs-arrow" aria-hidden="true">→</span>
        <button class="vs-b ${b.cut ? 'is-cut' : 'is-win'}" type="button" data-id="${b.id}"><span class="ti-im">${pic(b)}</span><span class="vs-l">${b.year} · ${esc(b.name)}<b>${fmt.money(b.price)}</b></span></button></div>`;
    } else strip = `<div class="strip">${its.slice(0, 6).map(thumb).join('')}</div>`;
    return `<article class="topic t-${TC[i % TC.length]}" data-reveal>
      <div class="tp-top"><span class="tp-kind">${KIND[c.kind] || '专题'}</span><span class="tp-per">${esc(c.period || '')}</span></div>
      <h3>${esc(c.title)}</h3>
      ${c.big ? `<div class="ptag hs"><b>${esc(c.big)}</b></div>` : ''}
      <div class="tp-items">${strip}</div>
      <p>${esc(c.text)}</p></article>`;
  }).join('');
  $('.topic-grid').addEventListener('click', (e) => { const b = e.target.closest('[data-id]'); if (b) TY.openItem(b.dataset.id); });

  /* ---------- 全部货架（收藏图鉴） ---------- */
  let filt = '';
  const chips = [['', `全部 ${stats.items}`], ['__fav', '♥ 心头好'], ['__done', '已盘点'], ['__todo', '未盘点'], ...TY.cats.map(([c, n]) => [c, `${c} ${n}`])];
  $('.filters').innerHTML = chips.map(([c, l]) => `<button type="button" data-c="${esc(c)}" class="${c === '' ? 'on' : ''}">${esc(l)}</button>`).join('');
  function good(it) {
    const st = TY.statusMap[it.id], fv = TY.favMap[it.id];
    return `<button class="good ${it.cut ? 'is-cut' : 'is-box'}${st ? ' has-st' : ''}${fv ? ' is-fav' : ''}" type="button" data-id="${it.id}" title="${esc(it.name)}">
      <span class="g-img">${it.cut ? `<img src="${esc(it.cut)}" alt="" loading="lazy" decoding="async">` : `<span class="g-box">${TY.imgTag(it, 'img')}</span>`}</span>
      ${it.tier !== '日常' ? `<span class="g-tier ${it.tier === '镇馆' ? 't1' : 't2'}">${esc(it.tier)}</span>` : ''}
      <span class="g-st">${esc(st || '')}</span><span class="g-fav" aria-hidden="true">♥</span>
      <span class="g-lab"><em>${fmt.no(it.no)}</em><i>${fmt.money(priceOf(it))}</i></span>
      <span class="g-name">${esc(it.name)}</span></button>`;
  }
  function rack(name, n, list, k, wrap) {
    return `<div class="rack p${k % 3}${wrap ? ' wrap' : ''}">
      <div class="r-head"><span class="sign">${esc(name)}<b>${n}</b></span>${wrap ? '' : '<span class="r-btns"><button type="button" data-sc="-1" aria-label="向左">‹</button><button type="button" data-sc="1" aria-label="向右">›</button></span>'}</div>
      <div class="r-track"><div class="r-goods">${list.map(good).join('')}</div></div></div>`;
  }
  function renderRacks() {
    let html;
    if (!filt) html = TY.cats.map(([c, n], k) => rack(c, n, items.filter((it) => it.cat === c), k)).join('');
    else {
      const name = { __fav: '心头好', __done: '已盘点', __todo: '未盘点' }[filt] || filt;
      const list = items.filter((it) => (filt === '__fav' ? TY.favMap[it.id] : filt === '__done' ? TY.statusMap[it.id] : filt === '__todo' ? !TY.statusMap[it.id] : it.cat === filt));
      html = list.length ? rack(name, list.length, list, Math.max(0, TY.cats.findIndex(([c]) => c === filt)), true)
        : `<div class="empty">${filt === '__fav' ? '还没有心头好。点开任意商品，按「设为心头好」就会摆到这里。' : '这里还空着。点开任意商品，标一下它现在怎么样了。'}</div>`;
    }
    $('.racks').innerHTML = html;
  }
  function renderCount() {
    const done = Object.keys(TY.statusMap).filter((id) => TY.itemMap[id]).length;
    const favs = Object.keys(TY.favMap).filter((id) => TY.itemMap[id]).length;
    $('.count').innerHTML = `<span class="c-k">盘点进度</span><b>已盘点 ${done} / ${stats.items} 件</b><div class="bar"><i style="width:${(done / stats.items) * 100}%"></i></div><span class="c-f">♥ 心头好 ${favs} 件</span>`;
    const bn = $('.bag-n'); bn.textContent = favs; bn.hidden = !favs;
  }
  function setFilter(c) { filt = c; $$('.filters button').forEach((b) => b.classList.toggle('on', b.dataset.c === c)); renderRacks(); }
  $('.filters').addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) setFilter(b.dataset.c); });
  $('.racks').addEventListener('click', (e) => {
    const s = e.target.closest('[data-sc]'); if (s) return scrollRow(s.closest('.rack').querySelector('.r-track'), +s.dataset.sc);
    const g = e.target.closest('.good'); if (g) TY.openItem(g.dataset.id);
  });
  $('.bag').addEventListener('click', () => { setFilter('__fav'); $('#shelves').scrollIntoView({ behavior: 'smooth' }); });
  TY.onChange((kind, id) => {
    renderCount();
    if (filt && filt.startsWith('__')) return renderRacks();
    $$(`.good[data-id="${id}"]`).forEach((g) => {
      const st = TY.statusMap[id];
      g.classList.toggle('has-st', !!st); g.classList.toggle('is-fav', !!TY.favMap[id]); $('.g-st', g).textContent = st || '';
    });
  });
  renderRacks(); renderCount();

  /* ---------- 那年今日 + 开张至今 ---------- */
  const md = `${now.getMonth() + 1}.${String(now.getDate()).padStart(2, '0')}`;
  let otd = TY.onThisDay(now, 7), otdSub = `${now.getMonth() + 1} 月 ${now.getDate()} 日前后一周，往年进的货`;
  if (!otd.length) { otd = items.filter((it) => +it.date.slice(5, 7) === now.getMonth() + 1 && it.year < now.getFullYear()); otdSub = `往年 ${now.getMonth() + 1} 月进的货`; }
  otd = otd.slice().reverse().slice(0, 12);
  $('.datecard').innerHTML = `<div class="dc-top"><i></i><i></i>${now.getFullYear()}</div><b>${md}</b><span class="dc-w">星期${'日一二三四五六'[now.getDay()]}</span><p>${otdSub}，一共 ${otd.length} 件</p>`;
  $('.otd-list').innerHTML = otd.length ? otd.map((it) => `<button class="oc" type="button" data-id="${it.id}"><span class="ago">${now.getFullYear() - it.year} 年前</span><span class="o-im ${it.cut ? 'is-cut' : ''}">${TY.imgTag(it, it.cut ? 'cut' : 'img')}</span><b>${esc(it.name)}</b><span class="o-d">${fmt.date(it.date)} · ${fmt.money(it.price)}</span></button>`).join('')
    : '<p class="ty-muted">往年这几天没有进货。</p>';
  const first = stats.first, top = stats.top, last = stats.last;
  const days = first ? Math.max(0, Math.floor((now - new Date(first.date)) / 864e5)) : 0;
  const mile = (it, k) => (it ? `<button class="mile" type="button" data-id="${it.id}"><span class="m-im">${TY.imgTag(it, it.cut ? 'cut' : 'img')}</span><span class="m-t"><em>${k}</em><b>${esc(it.name)}</b><span>${fmt.date(it.date)} · ${fmt.money(it.price)}</span><span class="m-y">${fmt.yearsSince(it.date) ? `到今天 ${fmt.yearsSince(it.date)} 年` : '不到一年'}</span></span></button>` : '');
  $('.since').innerHTML = `<div class="days"><span>最早已读记录至今</span><b data-n="${days}">0</b><span>天</span></div>${mile(first, '最早已读记录')}${mile(top, '已知单件最高')}${mile(last, '最近一单')}`;
  new IntersectionObserver((es, io) => es.forEach((e) => { if (e.isIntersecting) { const b = $('.days b'); TY.countUp(b, +b.dataset.n); io.disconnect(); } }), { threshold: 0.4 }).observe($('.since'));
  $('.otd').addEventListener('click', (e) => { const b = e.target.closest('[data-id]'); if (b) TY.openItem(b.dataset.id); });

  /* ---------- 本店 BGM / 影视人物：两张「揭晓」海报 ----------
     左：本店 BGM（黑胶唱片从唱片套里滑出来、唱臂落下，翻牌揭晓歌名）；右：影视人物（翻牌揭晓角色）。
     翻牌之后，结论和依据卡片一张张掉下来；依据里的商品小图点开就是详情。商业推荐歌不播放；授权纯音乐由独立控制播放。
     数据：TY.raw.bgm（title song singer verdict reasons[] tone）、TY.egg（title work role verdict candidates like[] unlike[] whyNot[] tone）。 */
  const bgm = TY.raw.bgm || {};
  const songName = String(bgm.song || '').replace(/^《|》$/g, '');
  const rvThumbs = (ids) => { const its = TY.pick(ids); return its.length ? `<div class="rv-th">${its.map((it) => `<button type="button" data-id="${it.id}" title="${esc(it.name)}">${TY.imgTag(it, it.cut ? 'cut' : 'img')}</button>`).join('')}</div>` : ''; };
  const rvCard = (r, i, k, tag) => `<div class="rv-card ${k}" style="--i:${i}"><span class="rv-k">${tag}</span><div class="rv-t"><b>${esc(r.point || '')}</b><p>${esc(r.text || '')}</p>${rvThumbs(r.items)}</div></div>`;
  const flipHTML = (q, a, label) => `<button class="flip" type="button" aria-label="${esc(label)}"><span class="flip-in"><span class="face q">${q}</span><span class="face a">${a}</span></span></button>`;
  const pzB = $('.pz-bgm'), pzR = $('.pz-role');
  if (songName) {
    pzB.innerHTML = `
      <span class="stamp" aria-hidden="true">揭晓</span>
      <div class="pz-head"><span class="pz-chip">${esc(bgm.title || '本店 BGM')}</span><span class="pz-meta">SIDE A · 豆包点歌</span></div>
      <div class="disc" aria-hidden="true">
        <div class="vinyl"><div class="v-spin"><i class="v-lab"><b>${esc(songName)}</b><em>${esc(bgm.singer || '')}</em></i></div></div>
        <div class="sleeve"><span class="sl-k">${esc(shop)}</span><b>本店<br>精选</b><i class="sl-dot"></i></div>
        <i class="arm"></i>
      </div>
      ${flipHTML(`<em>本店 BGM 是……</em><b>？</b><small>点一下揭晓</small>`, `<span class="song hs">《${esc(songName)}》</span>${bgm.singer ? `<span class="singer">${esc(bgm.singer)}</span>` : ''}`, '揭晓本店 BGM')}
      ${bgm.verdict ? `<p class="pz-verdict" style="--i:0">${esc(bgm.verdict)}</p>` : ''}
      ${(bgm.reasons || []).length ? `<h4 class="rv-h" style="--i:1"><i>♪</i>为什么是这首</h4><div class="rv-list">${bgm.reasons.map((r, i) => rvCard(r, i + 2, 'why', `理由<br>${i + 1}`)).join('')}</div>` : ''}
      ${bgm.tone ? `<p class="pz-tone">${esc(bgm.tone)}</p>` : ''}`;
  } else pzB.remove();
  if (egg.role) {
    const like = egg.like || [], un = egg.unlike || [], why = egg.whyNot || [], cands = egg.candidates || [];
    const others = ['', '一', '两', '三', '四'][why.length] || '几';
    pzR.innerHTML = `
      <span class="stamp" aria-hidden="true">揭晓</span>
      <div class="pz-head"><span class="pz-chip">影视人物</span><span class="pz-q">${esc(egg.title || '')}</span></div>
      ${flipHTML(`<em>最像本店的国民角色是……</em><b>？</b><small>点一下揭晓</small>`, `<span class="role-row"><span class="role hs">${esc(egg.role)}</span><span class="ball" aria-hidden="true">${ICON.ball('pink')}<em>${esc([...egg.role][0])}</em></span></span>${egg.work ? `<span class="work">${esc(egg.work)}</span>` : ''}`, '揭晓影视人物')}
      ${egg.verdict ? `<p class="pz-verdict" style="--i:0">${esc(egg.verdict)}</p>` : ''}
      ${like.length ? `<h4 class="rv-h" style="--i:1"><i>像</i>像在哪 · ${like.length} 条依据</h4><div class="rv-list">${like.map((r, i) => rvCard(r, i + 2, 'like', '像')).join('')}</div>` : ''}
      <div class="rv-two">
        ${un.length ? `<div><h4 class="rv-h" style="--i:${like.length + 2}"><i class="pk">✕</i>哪里不像</h4><div class="rv-list">${un.map((r, i) => rvCard(r, i + like.length + 3, 'un', '不像')).join('')}</div></div>` : ''}
        ${why.length || cands.length > 1 ? `<div><h4 class="rv-h" style="--i:${like.length + 2}"><i class="bk">？</i>为什么不是另外${others}位</h4>
          ${cands.length > 1 ? `<div class="cands" style="--i:${like.length + 3}"><span>海选名单</span>${cands.map((c) => `<em class="${String(c).includes(egg.role) ? 'win' : ''}">${esc(c)}</em>`).join('')}</div>` : ''}
          <div class="rv-list">${why.map((w, i) => `<div class="rv-card no" style="--i:${i + like.length + 4}"><span class="rv-k">落选</span><div class="rv-t"><b><s>${esc(w.role || '')}</s></b><p>${esc(w.text || '')}</p></div></div>`).join('')}</div></div>` : ''}
      </div>
      ${egg.tone ? `<p class="pz-tone">${esc(egg.tone)}</p>` : ''}`;
  } else pzR.remove();
  if (!songName && !egg.role) { $('.bgm').remove(); const a = $('.nav a[href="#bgm"]'); if (a) a.remove(); }
  else {
    $('.bgm-q').textContent = `豆包读完 ${stats.orders} 张进货单，给本店点了一首歌，角色联想只作为趣味表达。`;
    if (!songName || !egg.role) $('.reveal-grid').classList.add('single');
    // 歌名牌、角色名牌：按海报里实际能用的宽度自动缩字号，豆包填的名字 1～8 个字都完整放在海报里
    const fitName = (el, again) => {
      const face = el.closest('.face'); if (!face) return;
      el.style.fontSize = '';
      const row0 = el.closest('.role-row'); if (row0 && !again) row0.classList.remove('tight');
      const fcs = getComputedStyle(face), row = el.closest('.role-row'), ball = row && $('.ball', row);
      const avail = face.clientWidth - parseFloat(fcs.paddingLeft) - parseFloat(fcs.paddingRight)
        - (ball ? ball.offsetWidth + (parseFloat(getComputedStyle(row).columnGap) || 0) : 0) - 32; // 32：两侧选框手柄 + 倾斜的余量
      const base = parseFloat(getComputedStyle(el).fontSize); let fs = base;
      for (let k = 0; k < 4 && el.offsetWidth > avail && fs > 20; k++) { fs = Math.max(20, Math.floor(fs * avail / el.offsetWidth)); el.style.fontSize = fs + 'px'; }
      if (ball && !again && fs < base * 0.6) { row.classList.add('tight'); fitName(el, true); } // 名字太长：把旁边的首字圆球收起来，让名字大一点
      face.style.setProperty('--ov', `${-Math.round(fs * 0.13)}px`); // 下面压着的歌手 / 作品小标签，名字缩小了就少压一点
    };
    let fitW = 0;
    const fitAll = () => { const w = $('.reveal-grid').clientWidth; if (w === fitW) return; fitW = w; $$('.bgm .song, .bgm .role').forEach((el) => fitName(el)); };
    fitAll(); new ResizeObserver(fitAll).observe($('.reveal-grid'));
    const pzs = $$('.bgm .pz');
    const reveal = (pz) => { if (pz.classList.contains('open')) return; pz.classList.add('open'); $('.flip', pz).classList.add('flipped'); };
    if (reduce) pzs.forEach(reveal);
    else {
      pzs.forEach((pz) => pz.classList.add('armed'));
      // 翻牌那一块进到视野里才揭晓：BGM 先揭，人物晚一拍
      const rio = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return; rio.unobserve(e.target);
        const pz = e.target.closest('.pz'); setTimeout(() => reveal(pz), pz.classList.contains('pz-role') ? 420 : 160);
      }), { threshold: 0.6 });
      pzs.forEach((pz) => rio.observe($('.flip', pz)));
    }
    $('.bgm').addEventListener('click', (e) => {
      const f = e.target.closest('.flip');
      if (f) { const pz = f.closest('.pz'); if (!pz.classList.contains('open')) reveal(pz); else f.classList.toggle('flipped'); return; } // 揭晓后再点，可以翻回去再揭一次
      const b = e.target.closest('[data-id]'); if (b) TY.openItem(b.dataset.id);
    });
  }

  /* ---------- 客服、日历、愿望清单 ---------- */
  $('.cw-sub').textContent = `读过本店 ${stats.orders} 张进货单`;
  TY.chat($('.chatwin .chat'), { chips: 4, placeholder: `问${service}，比如：我哪一年买得最凶？` });
  TY.calendar($('.calendar .cal'), { onGoto: () => $('#calendar').scrollIntoView({ behavior: 'smooth' }) });
  const planEl = $('.wish .plan');
  TY.plan(planEl);
  const syncDue = () => { $('.due').textContent = $$('.it', planEl).filter((x) => !x.classList.contains('done')).length; };
  syncDue(); new MutationObserver(syncDue).observe(planEl, { childList: true, subtree: true });
  $('.cart-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    $$('.cart-tabs button').forEach((x) => x.classList.toggle('on', x === b)); planEl.classList.toggle('only-due', b.dataset.tab === 'due');
  });

  /* ---------- 导航高亮、进场动画 ---------- */
  const links = $$('.nav nav a');
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    const on = links.find((a) => a.classList.contains('on')); const nv = $('.nav nav');
    if (on && nv.scrollWidth > nv.clientWidth) nv.scrollTo({ left: on.offsetLeft - nv.clientWidth / 2 + on.offsetWidth / 2, behavior: 'smooth' });
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('section[id]').forEach((s) => io.observe(s));
  TY.revealOnScroll();
})();
