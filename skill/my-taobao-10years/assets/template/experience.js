(function () {
  const data = TY.raw;
  const proofLinks = ids => { const seen=new Set();return (ids||[]).filter(id=>{const name=TY.itemMap[id]?.name?.trim();if(!name||seen.has(name))return false;seen.add(name);return true;}).map(id=>`<button type="button" data-proof="${TY.esc(id)}">${TY.esc(TY.itemMap[id].name)} ↗</button>`).join(''); };
  if (data.insights?.length) {
    const panel = document.createElement('div'); panel.className = 'profile-insights';
    panel.innerHTML = '<p class="insight-scope">本店线索 · 按已读取且展示的记录计算</p>' + data.insights.map(r => `<article><b>${TY.esc(r.label)}</b><p>${TY.esc(r.text)}</p><div class="insight-links">${proofLinks(r.items)}</div></article>`).join('');
    panel.addEventListener('click', e => { const id=e.target.closest('[data-proof]')?.dataset.proof; if(id) TY.openItem(id); });
    document.querySelector('.story-main').appendChild(panel);
  }
  if (data.chat?.enabled === false) {
    document.querySelector('#service')?.remove();
    document.querySelector('.nav a[href="#service"]')?.remove();
  }
  // 三首商业音乐仅提供搜索跳转，永不请求歌曲音频。
  const songKey=s=>String(s||'').replace(/[《》]/g,'').trim().toLowerCase();
  const candidates = (data.bgm?.candidates || []).filter(s=>songKey(s.song)!==songKey(data.bgm?.song));
  if (candidates.length) {
    const list = document.createElement('div'); list.className = 'song-options';
    list.innerHTML = '<h3>本店还有这几首可选</h3>' + candidates.map(s => `<details><summary>${TY.esc(s.song)} · ${TY.esc(s.singer)}</summary><p>${TY.esc(s.verdict)}</p>${(s.reasons||[]).map(r => `<p>${TY.esc(r.text)}</p>`).join('')}<a target="_blank" rel="noopener" href="${TY.esc(/^https:\/\//.test(s.url||'') ? s.url : 'https://www.doubao.com/')}" >去听 ↗</a></details>`).join('');
    document.querySelector('#bgm .wrap').appendChild(list);
  }
  const cfg = data.audio || {};
  const hasAudio = /^(audio\/|data:audio\/)/.test(cfg.src || '') && !!cfg.license;
  if (!hasAudio) return;
  const audio = document.createElement('audio'); audio.loop = true; audio.preload = 'none'; audio.dataset.shopAudio = 'true'; audio.src = cfg.src;
  const key = 'shop_audio_' + (data.meta.dataset || 'local');
  let stored = 'on'; try { stored = localStorage.getItem(key) || 'on'; } catch (_) {}
  audio.muted = stored === 'off';
  const btn = document.createElement('button'); btn.className = 'audio-control'; btn.type = 'button';
  const show = () => { btn.textContent = audio.paused || audio.muted ? '♫ 开启店内音乐' : '♫ 静音'; btn.setAttribute('aria-pressed', String(!audio.paused && !audio.muted)); };
  let attempting = false;
  const unbind = () => { document.removeEventListener('click', firstInteraction, true); document.removeEventListener('keydown', firstInteraction, true); };
  const start = async () => {
    if (stored === 'off' || attempting) return;
    attempting = true;
    try { audio.muted = false; await audio.play(); unbind(); }
    catch (_) { TY.toast('浏览器暂未允许播放，可点音乐按钮重试'); }
    finally { attempting = false; show(); }
  };
  function firstInteraction(e) { if (!e.target.closest?.('.audio-control')) start(); }
  // 页面内第一次点击或按键即请求播放；静音记忆优先，不依赖特定进店按钮。
  document.addEventListener('click', firstInteraction, true);
  document.addEventListener('keydown', firstInteraction, true);
  btn.onclick = async () => {
    if (!audio.paused && !audio.muted) { audio.muted = true; stored = 'off'; }
    else { stored = 'on'; await start(); }
    try { localStorage.setItem(key, stored); } catch (_) {}
    show();
  };
  document.body.append(audio, btn); show();
  // 署名随文件夹和单文件保存；链接仅供阅读，不会自动请求远端音频。
  const credit = document.createElement('details'); credit.className = 'music-credit';
  credit.innerHTML = '<summary>本店音乐来源与授权</summary><p>' + TY.esc(cfg.title || cfg.label || '本店音乐') + ' — ' + TY.esc(cfg.author || '') + '</p><p>' + TY.esc(cfg.credit || cfg.license) + '</p><p>' + TY.esc(cfg.changes || '') + '</p>' + (/^https:\/\//.test(cfg.source || '') ? '<a target="_blank" rel="noopener" href="'+TY.esc(cfg.source)+'">作者曲目页</a> · ' : '') + (/^https:\/\//.test(cfg.licenseUrl || '') ? '<a target="_blank" rel="noopener" href="'+TY.esc(cfg.licenseUrl)+'">许可原文</a>' : '');
  document.querySelector('.foot .f-txt').appendChild(credit);
})();
