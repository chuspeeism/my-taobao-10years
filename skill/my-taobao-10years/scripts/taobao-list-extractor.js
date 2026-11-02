// 淘宝「已买到的宝贝」列表页：只读提取当前这一页的订单，返回数组。不点击、不改数据。
// 文字和图片在同一次调用、同一个订单容器里取，不会错位，也不用为了补图再翻一遍。
// 淘宝改版后可能失效，批量前按 references/collection-and-facts.md 的两页试采核对。
(() => {
  const clean = (s) => (s || '').replace(/\[交易快照\]/g, '').replace(/\s+/g, ' ').trim();
  const idsIn = (el) => [...new Set([...(el.textContent || '').matchAll(/订单号[:：]\s*(\d{6,})/g)].map((m) => m[1]))];

  // 订单容器 = 只含一个订单号、而父元素含多个订单号的最外层元素，不依赖淘宝会变的 class 名
  const candidates = [...document.body.querySelectorAll('*')].filter((el) => idsIn(el).length === 1);
  let boxes = candidates.filter((el) => idsIn(el.parentElement).length > 1);
  if (!boxes.length && candidates.length) {
    // 整页只有一单：从最内层往外找到第一个带图或带商品链接的元素
    let el = candidates[candidates.length - 1];
    while (el.parentElement !== document.body && !el.querySelector('img, a[href*="item"], a[href*="detail"]')) el = el.parentElement;
    boxes = [el];
  }

  const ITEM_LINK = /item\.htm|item\.taobao|detail\.tmall|detail\.taobao|tradeSnap/;
  const money = (s) => [...(s || '').matchAll(/[￥¥]\s*([0-9]+(?:\.[0-9]+)?)/g)].map((m) => m[1]);
  const imageOf = (el) => {
    const img = [...el.querySelectorAll('img')].find((i) => /alicdn/.test(i.currentSrc || i.src || i.dataset.src || ''));
    return img ? img.currentSrc || img.src || img.dataset.src : null;
  };

  return boxes.map((box) => {
    const text = box.innerText || box.textContent || '';
    const rows = [...box.querySelectorAll('tr')].filter((tr) => [...tr.querySelectorAll('a')].some((a) => ITEM_LINK.test(a.href || '') && a.innerText.trim().length > 3));
    const items = rows.map((tr) => {
      const tds = [...tr.querySelectorAll('td')];
      const link = [...tr.querySelectorAll('a')].find((a) => ITEM_LINK.test(a.href || '') && a.innerText.trim().length > 3);
      const cell = tds[0] || link.closest('td') || tr;
      const lines = (cell.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean);
      const prices = tds[1] ? money(tds[1].innerText) : [];
      const id = (link.href.match(/[?&]id=(\d+)/) || [])[1];
      return {
        title: clean(lines[0] || link.innerText),
        spec: clean(lines.slice(1).join(' ')),
        unit_price: prices.length ? prices[prices.length - 1] : null,
        qty: tds[2] ? tds[2].innerText.trim() : null,
        item_ops: tds[3] ? clean(tds[3].innerText) : '',
        item_id: id || null,
        thumb: imageOf(tr),
      };
    });

    // 实付按订单只取一次：含「含运费」的那一格里第一个金额
    const paidCell = [...box.querySelectorAll('td, div')].filter((el) => /含运费|电子凭证/.test(el.innerText || '')).pop();
    const paid = paidCell ? money(paidCell.innerText)[0] || null : null;
    const shop = [...box.querySelectorAll('a')].find((a) => /view_shop\.htm|shop\.taobao\.com|\.tmall\.com\/?$/.test(a.href || ''));

    return {
      order_id: idsIn(box)[0],
      date: (text.match(/20\d{2}-\d{2}-\d{2}/) || [null])[0],
      shop: shop ? clean(shop.innerText) : null,
      status: (text.match(/交易成功|交易关闭|卖家已发货|买家已付款|等待买家付款|付款确认中|退款中/) || [''])[0],
      paid,
      items,
    };
  });
})();
