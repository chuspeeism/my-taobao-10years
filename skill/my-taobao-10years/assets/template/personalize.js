(function () {
  const d = window.TEN_YEARS || {}, t = d.theme || {};
  const colors = ['bg','bg2','fg','accent','accent2','onAccent','onAccent2','pcBody','pcFrame','pcBase','pcHandle','pcSide','pcCap','screenTop','screenBg','screenFg','screenLabel','screenDate','heroBg','heroGlow','heroInk','heroWord','heroWord2','memoTop','memoBottom','heroSnIm','ticker'];
  colors.forEach(k => { if (/^#[a-f0-9]{6}$/i.test(t[k] || '')) document.documentElement.style.setProperty('--' + k.replace(/[A-Z]/g, c => '-'+c.toLowerCase()), t[k]); });
  document.querySelector('.hero').dataset.theme=t.palette || 'original-digital';
  if (d.meta?.demo) {
    const badge = document.createElement('div'); badge.className = 'demo-badge'; badge.textContent = '虚构示意 · 自绘商品图'; document.body.appendChild(badge);
  }
})();
