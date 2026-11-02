#!/usr/bin/env python3
"""离线分析、生成、打包；只使用 Python 3.9+ 标准库。"""
import argparse
import base64
from collections import Counter, defaultdict
from datetime import date
from decimal import Decimal, InvalidOperation
import hashlib
import html
import json
import mimetypes
from pathlib import Path
import re
import shutil
import sys
from urllib.parse import quote
from themes import theme_for
from behavior import behavior_facts, song_candidates

ROOT = Path(__file__).resolve().parents[1]
# 能当主线、能默认上架的实体大类。词序有讲究：先判母婴/户外/美妆/数码，再判家居和食品，最后才是服饰和阅读。
FAMILIES = {
    "宠物": ("宠物", "猫粮", "猫砂", "猫条", "猫罐头", "猫窝", "猫抓", "逗猫", "猫咪", "狗粮", "狗窝", "狗绳", "狗狗"),
    "母婴": ("母婴", "婴", "奶瓶", "纸尿裤", "尿不湿", "童车", "宝宝", "儿童", "童装", "辅食", "奶粉"),
    "户外": ("户外", "露营", "登山", "帐篷", "徒步", "骑行", "钓鱼", "滑雪", "冲锋衣"),
    "美妆": ("美妆", "护肤", "彩妆", "化妆", "口红", "面霜", "面膜", "香水", "粉底", "精华", "眼影", "眉笔", "防晒", "卸妆", "洁面"),
    "数码": ("手机", "电脑", "笔记本", "平板", "相机", "镜头", "耳机", "音箱", "音响", "数码", "键盘", "鼠标", "存储", "硬盘", "U盘", "内存", "显卡", "显示器", "主板", "机箱", "路由", "充电", "数据线", "游戏机", "手柄", "手表", "手环", "打印机", "投影", "无人机", "触控笔"),
    "家居": ("家居", "家具", "家电", "收纳", "厨具", "灯具", "台灯", "床", "沙发", "桌", "椅", "柜", "茶几", "窗帘", "地毯", "餐具", "锅", "杯", "洗衣机", "吹风机", "空气炸锅", "扫地机"),
    "食品": ("食品", "零食", "咖啡", "茶叶", "茶", "粮油", "坚果", "面包", "牛奶", "方便面", "泡面", "饼干", "巧克力", "水果", "生鲜", "饮料", "榴莲", "热狗"),
    "服饰": ("服饰", "服装", "鞋", "背包", "书包", "钱包", "箱包", "手提包", "双肩包", "衣服", "上衣", "大衣", "毛衣", "外套", "连衣裙", "羽绒服", "T恤", "裤", "裙", "袜", "帽", "围巾"),
    "阅读": ("阅读", "书籍", "图书", "书", "文具", "小说", "笔", "教材"),
    "兴趣": ("玩具", "积木", "乐高", "手办", "模型", "乐器", "吉他", "钢琴", "电子琴", "桌游"),
}
# 能统计、不当主线、默认不上架：观众录屏时最容易显得奇怪的几类。
SIDE_FAMILIES = {
    "烟酒": ("白酒", "啤酒", "红酒", "洋酒", "香烟", "烟酒"),
    "虚拟": ("设计素材", "素材", "模板", "字体", "教程", "网课", "课程", "虚拟", "会员", "充值", "点卡", "卡密", "激活码", "兑换码", "源文件", "插件", "预设", "笔刷", "电子书", "软件", "网盘"),
    "外卖团购": ("外卖", "团购", "套餐券", "代金券", "优惠券", "电子券", "兑换券", "代下单", "快餐", "麦当劳", "肯德基", "星巴克", "瑞幸", "必胜客", "汉堡王", "喜茶", "奈雪"),
    "日用": ("日用", "纸巾", "抽纸", "卷纸", "卫生纸", "洗衣液", "洗衣粉", "洗衣凝珠", "洗洁", "牙膏", "牙刷", "垃圾袋", "洗发", "沐浴", "清洁"),
    "健康": ("药", "保健", "医疗", "维生素", "感冒", "膏药"),
}
# 标题里出现这些词，不管豆包填的品类是什么，都算虚拟。“送教程”的实体商品会被一起挡下，宁可少放；“会员专享”这种实体也常写的词不放进来。
VIRTUAL_TITLE = ("样机", "充值", "卡密", "激活码", "代激活", "兑换码", "素材", "模板", "教程", "下载", "软件", "远程", "源文件", "网盘", "代下单", "电子券", "兑换券")
# 默认不上架，也不进 data.js / profile.json；只记行数。用户明确要求才用 --keep-sensitive 放回。词表不放人名。
SENSITIVE = {
    "成人": ("人体润滑", "润滑液", "男用倒模", "成人玩具", "按摩棒", "计生", "情侣秘戏", "透视装", "小雨伞", "延时湿巾", "私密", "成人用品", "安全套", "避孕", "情趣", "飞机杯", "跳蛋", "震动棒", "壮阳", "延时喷", "充气娃娃", "自慰", "杜蕾斯", "冈本", "杰士邦"),
    "健康隐私": ("胶囊", "片剂", "软膏", "试纸", "栓", "抑郁", "补肾", "助眠", "褪黑素", "HPV", "备孕", "试管", "叶酸", "丰胸", "医美", "水光针", "减肥", "瘦身", "姨妈巾", "验孕", "排卵", "早孕", "胎心", "痔疮", "脚气", "灰指甲", "处方", "抗抑郁", "安眠", "减肥药", "防脱", "生发", "尿失禁", "成人纸尿裤", "性病", "妇科", "男科", "私处", "前列腺", "卫生巾", "内衣", "内裤", "文胸"),
    "政治": ("总统", "党建", "红色语录", "抗议", "标语", "领导人", "总书记", "国家主席", "总理讲话", "党史", "政治", "选举", "语录", "台独", "港独"),
    "灰产": ("烧录卡", "代安装", "远程安装", "加速器", "代做", "代练", "代打", "销分", "代扣", "二手QQ", "接码", "复刻", "代办", "实名", "破解", "代激活", "永久激活", "注册机", "翻墙", "翻墙梯子", "VPN", "vpn", "代考", "代写", "刷单", "刷量", "代刷", "假证", "办证", "外挂", "游戏私服", "盗版", "高仿", "原单", "A货"),
    "管制": ("雾化", "烟油", "香烟", "军刀", "防狼", "隐藏摄像", "定位追踪", "电击", "钢珠", "弹弓", "开锁", "电子烟", "烟弹", "仿真枪", "弓弩", "匕首", "管制刀", "电击器", "防身", "甩棍", "催泪", "窃听", "针孔摄像", "偷拍", "追踪器"),
    "迷信殡葬": ("紫微", "纸钱", "算命", "转运符", "开光吊坠", "开光手串", "符咒", "寿衣", "骨灰", "冥币"),
}
GROUP_ORDER = list(FAMILIES)

def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))

def save(path, obj):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def money(value):
    if value is None or value == "":
        return None
    try:
        d = Decimal(str(value))
        if not d.is_finite() or d < 0:
            raise ValueError("金额须为非负有限数值")
        return float(d.quantize(Decimal("0.01")))
    except InvalidOperation as exc:
        raise ValueError("金额格式错误") from exc

def luminance(color):
    c = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
    c = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in c]
    return sum(v * w for v, w in zip(c, [.2126, .7152, .0722]))

def contrast(a, b):
    x, y = sorted([luminance(a), luminance(b)])
    return (y + .05) / (x + .05)

def on_color(c):
    preferred = max(["#111111", "#ffffff"], key=lambda x: contrast(x, c))
    return preferred if contrast(preferred, c) >= 4.5 else "#000000"

def match_family(text):
    for k in ("外卖团购", "烟酒"):
        if any(w in text for w in SIDE_FAMILIES[k]):
            return k
    for k, words in FAMILIES.items():
        if any(w in text for w in words):
            return k
    for k, words in SIDE_FAMILIES.items():
        if any(w in text for w in words):
            return k
    return "游戏" if "游戏" in text else "其他"

def family(cat, title=""):
    """先看标题里明确的虚拟特征，再看品类；品类对不上大类时才退回标题，品类写得粗或细都能归到同一类。"""
    if any(w in title for w in SIDE_FAMILIES["外卖团购"]):
        return "外卖团购"
    if any(w in title for w in VIRTUAL_TITLE):
        return "虚拟"
    found = match_family(cat)
    if found in ("其他", "游戏") and title:
        again = match_family(title)
        found = again if again != "其他" else found
    return "虚拟" if found == "游戏" else found

def sensitive_group(raw):
    text = " ".join(str(raw.get(k) or "") for k in ("title", "name", "category", "spec"))
    for group, words in SENSITIVE.items():
        if any(w in text for w in words):
            return group
    return None

def pick_featured(its, n=16):
    """首屏盒子：有图优先、未分类靠后，每个品类轮流取最贵的一件，同款不重复；不再直接取最早的16行。"""
    pool = [i for i in its if i["img"] and i["cat"] != "未分类"] or [i for i in its if i["img"]] or its
    by_cat, seen, picked = defaultdict(list), set(), []
    for i in sorted(pool, key=lambda i: (-(i["price"] or 0), i["date"], i["id"])):
        by_cat[i["cat"]].append(i)
    order = sorted(by_cat, key=lambda c: (-len(by_cat[c]), c))
    while len(picked) < n and any(by_cat.values()):
        for c in order:
            while by_cat[c]:
                i = by_cat[c].pop(0)
                if i["product_key"] not in seen:
                    seen.add(i["product_key"])
                    picked.append(i)
                    break
            if len(picked) >= n:
                break
    return picked

def requested_window(source):
    """以输入记录的采集日计算十年窗口，不依赖运行机器的当天日期。"""
    demo = source.get("demo", False)
    if not isinstance(demo, bool):
        raise ValueError("demo 须为布尔值；真实订单不能标作示意")
    coverage = source.get("coverage", {})
    if not isinstance(coverage, dict):
        raise ValueError("coverage 须为对象")
    value = coverage.get("as_of")
    if value is None and demo:
        return None
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError("真实订单须在 coverage.as_of 写明本次采集日（北京时间YYYY-MM-DD），不能猜测十年范围")
    end = date.fromisoformat(value)
    if end.year <= 10:
        raise ValueError("采集日无法回溯十年")
    try:
        start = end.replace(year=end.year - 10)
    except ValueError:
        start = end.replace(year=end.year - 10, day=28)
    return {"from": start.isoformat(), "to": end.isoformat()}

def spotlight(its):
    """页面最显眼的位置会放的商品：首屏盒子、各年最贵一件、人气首批。豆包要逐条过一遍，词表拦不住的靠这一步。"""
    years = defaultdict(list)
    for i in its:
        years[i["date"][:4]].append(i)
    chosen = pick_featured(its) + [max(v, key=lambda i: i["price"] or 0) for _, v in sorted(years.items())]
    chosen += sorted(its, key=lambda i: -(i["price"] or 0))[:6]
    seen, out = set(), []
    for i in chosen:
        if i["id"] not in seen:
            seen.add(i["id"])
            out.append({"id": i["id"], "name": i["name"], "cat": i["cat"]})
    return out

def analyze(source, scope="auto", only=None, keep_sensitive=False, hide=()):
    window = requested_window(source)
    rows = source.get("orders", [])
    if not isinstance(rows, list):
        raise ValueError("orders 必须是数组")
    normalized, private_map, seen = [], {}, {}
    excluded = Counter()
    for row in rows:
        # 去重以原始订单ID进行；没有ID不得用日期或商品名猜测合并。
        rid = row.get("id")
        if not isinstance(rid, str) or not rid:
            raise ValueError("每单须有字符串 id；仅在私有采集文件中保留")
        if rid in seen:
            if row != seen[rid]:
                raise ValueError("同一订单ID出现互相冲突的数据，需核实")
            excluded["重复列表记录"] += 1
            continue
        seen[rid] = row
        day = row.get("date", "")
        if not isinstance(day, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", day):
            raise ValueError("每单须有YYYY-MM-DD格式的列表日期")
        date.fromisoformat(day)
        if window and not window["from"] <= day <= window["to"]:
            excluded["请求十年范围之外"] += 1
            continue
        if row.get("status") != "交易成功":
            excluded["非交易成功或状态不明"] += 1
            continue
        if row.get("refund") in ("已退款", "退款中", "部分退款"):
            excluded["退款或退款中待核"] += 1
            continue
        if not row.get("items"):
            raise ValueError("交易成功订单缺少商品，不能静默丢弃")
        normalized.append(row)
    normalized.sort(key=lambda r: (r["date"], r["id"]))
    orders, items = [], []
    item_seq = 0
    for row in normalized:
        oid = "o%04d" % (len(orders) + 1)
        private_map[oid] = row["id"]
        order = {"id": oid, "date": row["date"], "paid": money(row.get("paid"))}
        orders.append(order)
        for raw in row["items"]:
            group = None if keep_sensitive else sensitive_group(raw)
            if group:
                # 编号照常占位，后面的商品ID不因下架而变；被下架的这一行不进任何对外文件。
                item_seq += 1
                excluded["敏感或不宜公开（默认不上架）"] += 1
                continue
            cat = str(raw.get("category") or "未分类")
            qty = raw.get("qty", 1)
            if not isinstance(qty, int) or isinstance(qty, bool) or qty < 1:
                raise ValueError("qty 须为正整数")
            title = str(raw.get("title") or "")
            if not title:
                raise ValueError("商品缺少列表原名")
            item_seq += 1
            it = {"id": "i%04d" % item_seq, "order": oid, "date": row["date"],
                  "title": title, "name": str(raw.get("name") or title)[:24], "cat": cat,
                  "family": family(cat, title), "brand": str(raw.get("brand") or "未标注"),
                  "color": str(raw.get("color") or "未标注"), "qty": qty,
                  "spec": str(raw.get("spec") or ""), "img": str(raw.get("image") or ""),
                  "price": money(raw.get("paid")), "product_key": str(raw.get("product_key") or title),
                  "product_line": str(raw.get("product_line") or ""),
                  "generation": raw.get("generation")}
            if it["price"] is None and len(row["items"]) == 1 and qty == 1:
                it["price"] = order["paid"]
            items.append(it)
    def rank(field, data=items):
        counts, ids = Counter(), defaultdict(list)
        for it in data:
            counts[it[field]] += 1
            ids[it[field]].append(it["id"])
        return [{"value": k, "lines": n, "items": ids[k]} for k, n in sorted(counts.items(), key=lambda p: (-p[1], p[0]))]
    families = rank("family")
    # 主线只在实体大类里选，占比也只按实体大类算：虚拟、外卖、日用、未分类不再挡路或摊薄占比。
    lines = [f for f in families if f["value"] in FAMILIES]
    physical = sum(f["lines"] for f in lines)
    top = lines[0] if lines else None
    focused = bool(top and top["lines"] >= 3 and top["lines"] / max(1, physical) >= .35)
    candidates = [{"family": f["value"], "lines": f["lines"], "share": round(f["lines"] / max(1, physical), 3)} for f in lines[:3]]
    if only:
        if only not in FAMILIES and only not in SIDE_FAMILIES:
            raise ValueError("只放某一类时，类名须是：" + "、".join(list(FAMILIES) + list(SIDE_FAMILIES)))
        main, focused = only, True
        selected = [it for it in items if it["family"] == only]
    elif focused:
        main = top["value"]
        selected = items if scope == "all" else [it for it in items if it["family"] == main]
    else:
        # 没有明显主线：开实体杂货铺，不把虚拟、外卖、日用、看不出是什么的商品摆上来。
        main = "生活杂货"
        selected = items if scope == "all" else [it for it in items if it["family"] in FAMILIES]
        if scope != "all" and len(selected) < 8:
            selected = [it for it in items if it["family"] in FAMILIES or it["family"] == "日用"]
    hidden = [it for it in selected if it["id"] in set(hide)]
    if hidden:
        excluded["店长或豆包手动隐藏"] = len(hidden)
        selected = [it for it in selected if it["id"] not in set(hide)]
    chosen_ids = {it["order"] for it in selected}
    selected_orders = [o for o in orders if o["id"] in chosen_ids]
    by_product, by_line = defaultdict(list), defaultdict(list)
    for it in selected:
        by_product[it["product_key"]].append(it)
        if it["product_line"]:
            by_line[it["product_line"]].append(it)
    repurchases = [{"product": k, "orders": len({i["order"] for i in v}), "units": sum(i["qty"] for i in v),
                    "items": [i["id"] for i in v]} for k, v in sorted(by_product.items()) if len({i["order"] for i in v}) > 1]
    sequences = []
    for k, v in sorted(by_line.items()):
        if len(v) < 2:
            continue
        gens = [i["generation"] for i in v]
        is_upgrade = all(isinstance(g, (int, float)) and not isinstance(g, bool) for g in gens) and all(a < b for a, b in zip(gens, gens[1:]))
        sequences.append({"line": k, "kind": "已标注代次的购买序列" if is_upgrade else "同系列购买序列（不能认定换代）", "items": [i["id"] for i in v]})
    # 按订单去重统计节奏，无订单月份不等同完整读取的零消费月份。
    years, months = defaultdict(list), defaultdict(list)
    for o in selected_orders:
        years[o["date"][:4]].append(o["id"])
        months[o["date"][5:7]].append(o["id"])
    theme = theme_for(main)
    theme.update(onAccent=on_color(theme['accent']),onAccent2=on_color(theme['accent2']))
    checks = {"fg/bg": contrast(theme["fg"], theme["bg"]), "fg/bg2": contrast(theme["fg"], theme["bg2"]),
              "onAccent/accent": contrast(theme["onAccent"], theme["accent"]),
              "onAccent2/accent2": contrast(theme["onAccent2"], theme["accent2"]), "screen": contrast(theme["screenFg"], theme["screenBg"])}
    if min(checks.values()) < 4.5:
        raise ValueError("文字对比度不足")
    behaviors = behavior_facts(selected, selected_orders)
    pool = song_candidates(main, behaviors, ROOT)
    songs = pool[:3] if len(selected_orders)>1 else []
    chosen_rank = rank("cat", selected)
    treasure = max(selected, key=lambda i: (i["price"] is not None, i["price"] or 0, i["date"]), default=None)
    return {"schema_version": 1, "demo": bool(source.get("demo")), "mainline": main,
            "requested_range": window,
            "selection": "全部消费" if scope == "all" else (main + "（用户指定）" if only else main + "主线（可改全部消费）" if focused else "生活杂货精选（可改全部消费）"),
            "candidates": candidates, "spotlight": spotlight(selected), "unclassified_lines": sum(1 for it in items if it["family"] == "其他"),
            "count_basis": "品类/品牌/颜色按商品行计数；回购按独立订单；数量另列；不汇总消费金额",
            "coverage": source.get("coverage", {"complete": False, "note": "未提供覆盖报告"}),
            "excluded": dict(excluded), "orders_read": len(orders), "orders_shown": len(selected_orders),
            "items_shown": len(selected), "range": {"from": min((o["date"] for o in orders), default="")[:7], "to": max((o["date"] for o in orders), default="")[:7]},
            "families": families, "categories": chosen_rank, "brands": rank("brand", selected), "colors": rank("color", selected),
            "repurchases": repurchases, "sequences": sequences, "year_orders": dict(sorted(years.items())), "month_of_year_orders": dict(sorted(months.items())),
            "theme": theme, "contrast": checks, "behaviors": behaviors, "song_pool": pool, "songs": songs,
            "shop": {"宠物": "毛球补给小铺", "母婴": "小芽日常小铺", "户外": "山野补给小铺", "美妆": "镜前小铺", "数码": "灵感装备小铺", "家居": "安家小铺", "服饰": "衣橱小铺", "食品": "嘴馋小铺", "阅读": "书桌小铺"}.get(main, "生活杂货小铺"),
            "treasure": treasure["id"] if treasure else None, "orders": selected_orders, "items": selected}

def default_audio(main):
    catalog_path=ROOT / 'assets/template/audio/catalog.json'
    if not catalog_path.is_file():
        return {'src':'','license':'','label':'店长自选音乐'}
    catalog=load(catalog_path)
    chosen={'宠物':'monkeys','母婴':'riley','户外':'dream-culture','数码':'pixelland','美妆':'easy-lemon','家居':'wallpaper','阅读':'dream-culture','服饰':'easy-lemon','食品':'riley'}.get(main,'wallpaper')
    rec=next(r for r in catalog if r['id']==chosen)
    return {'src':rec['file'],'license':rec['license'],'licenseUrl':rec['license_url'],'title':rec['title'],'label':rec['title'],'author':rec['author'],'source':rec['source'],'credit':rec['credit'],'changes':rec['changes'],'duration':rec['duration']}


def webpage(p, narrative=None):
    its, orders = p["items"], p["orders"]
    if not its:
        raise ValueError("看不出这些商品是什么，没有可上架的实体商品：先按标题补 category 再跑；用户明确要放全部时用 --scope all")
    demo = p["demo"]
    by_id = {i["id"]: i for i in its}
    chapters = []
    for r in p["repurchases"][:2]:
        ids = r["items"]
        chapters.append({"id": "repeat-"+ids[0], "kind": "loyal", "title": r["product"] + "又出现了", "items": ids,
                         "period": by_id[ids[0]]["date"][:4] + "—" + by_id[ids[-1]]["date"][:4], "big": str(r["orders"]) + " 单",
                         "text": f'从 {by_id[ids[0]]["date"]} 到 {by_id[ids[-1]]["date"]}，同款出现在 {r["orders"]} 个独立订单，共 {r["units"]} 件。记录能证明反复买过，不能证明用完或喜欢。'})
    for seq in p["sequences"][:2]:
        ids = seq["items"]
        chapters.append({"id": "sequence-"+ids[0], "kind": "lineup", "title": seq["line"], "items": ids, "period": "购买序列", "big": str(len(ids))+" 条", "text": seq["kind"] + "：" + "；".join(by_id[x]["date"]+" "+by_id[x]["name"] for x in ids)})
    if not chapters:
        chapters = [{"id": "observed", "kind": "moment", "title": p["mainline"]+"的几个节点", "items": [its[0]["id"], its[-1]["id"]], "period": "实际读取范围", "big": str(len(its))+" 行", "text": "记录中最早和最近的两件商品，不能据此补写中间未读取的经历。"}]
    years = {}
    for y, ids in p["year_orders"].items():
        yitems = [i for i in its if i["date"].startswith(y)]
        years[y] = {"title": p["mainline"]+"进货记", "line": f'{yitems[0]["date"]} 的「{yitems[0]["name"]}」在这一年出现；读到 {len(ids)} 单。'}
    candidates = p["songs"]
    bgm = dict(candidates[0]) if candidates else {"song": "暂不匹配", "singer": "", "reasons": [], "verdict": "至少需要两条订单线索"}
    bgm.update(title="本店 BGM", candidates=candidates, tone="趣味配乐建议；没有收录商业歌曲音频，不代表听歌偏好。")
    for i in its:
        i["star"] = True
        i["line"] = i["date"] + " 的" + i["cat"] + "订单记录。"
    first, last = its[0], its[-1]
    prefix = "【虚构示意】" if demo else ""
    answer = f'本页展示 {len(orders)} 个独立订单、{len(its)} 条商品行。比如 {first["date"]} 的「{first["name"]}」。'
    data = {"meta": {"owner": "示意店长" if demo else "店长", "range": p["range"], "ordersRead": p["orders_read"], "scope": p["selection"],
                     "requestedRange": p["requested_range"],
                     "by": "豆包电脑版", "demo": demo, "dataset": hashlib.sha256(json.dumps(its, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:12],
                     "amountNote": "列表实付；未逐单核退款", "coverageNote": p["coverage"].get("note", "覆盖未确认")},
            "theme": p["theme"], "scheme": {"shop": prefix+p["shop"], "service": "客服小豆"},
            "hero": {"title": p["mainline"]+"\n小铺", "kicker": prefix+"从订单里找到自己的主线", "sub": "一间由真实购买记录整理的小店。" if not demo else "商品、金额、品牌和人物均为虚构，图片为自绘示意。", "featured": [i["id"] for i in pick_featured(its)]},
            "orders": orders, "items": its, "story": {"summary": prefix+f'读到的记录从 {first["date"]} 的「{first["name"]}」，走到 {last["date"]} 的「{last["name"]}」。本店先展示{p["selection"]}，保留具体物件，未读取的时段不补写。',
                                                         "keywords": [r["value"] for r in p["categories"][:4]], "years": years, "chapters": chapters},
            "bgm": bgm, "egg": {"role": "待店长揭晓", "work": "趣味联想", "verdict": "购买记录不能推断人格；角色联想由豆包根据证据另写。", "like": [], "unlike": [], "whyNot": [], "tone": "暂未匹配角色，不作心理或人格测评。"},
            "plan": {"title": "下一步，店长说了算", "groups": [{"name": title, "items": [{"id": "p"+str(n), "month": 1, "text": text, "basis": "线索："+last["date"]+" "+last["name"]}]} for n, (title, text) in enumerate([("想整理的物件", "看看已有的物件现在怎么样了"), ("想尝试的技能", "由店长补充一项想学的技能"), ("想实现的生活愿望", "由店长补充一个生活愿望")])]},
            "chat": {"enabled": True, "name": "豆包", "endpoint": "", "greeting": "我可以翻本页记录，离线回答不等于实时对话。", "presets": [{"q": q, "a": answer, "items": [first["id"]]} for q in ["本店展示了多少订单？", "本店的主线是什么？", "读到的最早一件是什么？"]]},
            "audio": default_audio(p["mainline"])}
    insights = []
    for field, title in [("brands", "高频品牌"), ("colors", "商品颜色")]:
        known = [r for r in p[field] if r["value"] != "未标注"]
        if known:
            tied = [r for r in known if r["lines"] == known[0]["lines"]]
            insights.append({"label": title + ("（并列）" if len(tied) > 1 else ""),
                             "text": "、".join(r["value"] for r in tied) + ("，各 " if len(tied) > 1 else "，") + str(known[0]["lines"]) + " 条商品行；只比较明确标注的记录。",
                             "items": known[0]["items"][:2]})
        else:
            insights.append({"label": title, "text": "记录缺少明确标注，暂不作判断。", "items": []})
    repeats = sorted(p["repurchases"], key=lambda r: (-r["orders"], r["product"]))
    if repeats:
        r = repeats[0]
        insights.append({"label": "反复出现的同款", "text": r["product"] + "出现在 " + str(r["orders"]) + " 个独立订单；不等于用完或最喜欢。", "items": r["items"][:2]})
    else:
        insights.append({"label": "同款回购", "text": "当前记录尚不足以证明同款跨单回购。", "items": []})
    data["insights"] = insights
    if narrative:
        # 数据与主题不可由叙事覆盖；内容里的证据ID必须存在。
        for k in ["hero", "story", "bgm", "egg", "plan", "chat"]:
            if k in narrative:
                data[k].update(narrative[k])
        if "shop" in narrative:
            data["scheme"]["shop"] = str(narrative["shop"])
        def check_refs(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if k in ("items", "featured") and isinstance(v, list) and all(isinstance(x, str) for x in v) and any(x not in by_id for x in v):
                        raise ValueError("叙事引用了不存在或未展示的商品")
                    check_refs(v)
            elif isinstance(obj, list):
                for v in obj:
                    check_refs(v)
        check_refs(narrative)
        if data["chat"].get("endpoint"):
            raise ValueError("大众离线版不允许叙事启用远程接口")
    return data

def js_data(path):
    s = Path(path).read_text(encoding="utf-8-sig")
    return json.loads(s.split("=", 1)[1].strip().rstrip(";").strip())

def privacy_errors(obj):
    text = json.dumps(obj, ensure_ascii=False)
    errs = []
    for pat, label in [(r"\d{15,}", "长数字串"), (r"(?<!\d)1[3-9]\d{9}(?!\d)", "疑似手机号"), (r"(?:trade|buyertrade|order)\.[^\s\"]*taobao|buyerTrade|biz_order_id", "订单入口"), (r"收货地址|收货人|联系电话|身份证号", "隐私字段")]:
        if re.search(pat, text, re.I):
            errs.append(label)
    return errs

def bundle(folder, output):
    folder = Path(folder).resolve()
    page = (folder / "index.html").read_text(encoding="utf-8")
    refs = {}
    def embed_path(rel):
        if rel in refs:
            return refs[rel]
        p = (folder / rel).resolve()
        if not p.is_relative_to(folder) or not p.is_file():
            raise ValueError("资源缺失或越界："+rel)
        mime = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
        uri = "data:"+mime+";base64,"+base64.b64encode(p.read_bytes()).decode("ascii")
        refs[rel] = uri
        return uri
    def replace_resources(text):
        return re.sub(r'(?P<q>[\"\x27])((?:images|audio)/[^\"\x27]+)(?P=q)', lambda m: m["q"] + embed_path(m[2]) + m["q"], text)
    def inline_css(m):
        code = replace_resources((folder / m[1]).read_text(encoding="utf-8"))
        return "<style>\n"+code.replace("</style", "<\\/style")+"\n</style>"
    page = re.sub(r'<link rel="stylesheet" href="([^\"]+)">', inline_css, page)
    def inline_js(m):
        code = replace_resources((folder / m[1]).read_text(encoding="utf-8"))
        return "<script>\n"+code.replace("</script", "<\\/script")+"\n</script>"
    page = re.sub(r'<script src="([^\"]+)"></script>', inline_js, page)
    page = replace_resources(page)
    markup = re.sub(r'<script>.*?</script>', '', page, flags=re.S)
    if re.search(r'<(?:script|link|img|audio)[^>]+(?:src|href)=[\"\x27](?!data:|#|https:)', markup):
        raise ValueError("仍有未内嵌资源")
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(page, encoding="utf-8")
    return {"embedded": len(refs), "missing": 0, "bytes": output.stat().st_size, "file": output.name}

def build(source_path, out, scope="auto", narrative_path=None, only=None, keep_sensitive=False):
    source_path, out = Path(source_path).resolve(), Path(out).resolve()
    if out.exists() and any(out.iterdir()):
        raise ValueError("输出目录已有文件，请换新目录以免覆盖")
    narrative = load(narrative_path) if narrative_path else None
    p = analyze(load(source_path), scope, only, keep_sensitive, (narrative or {}).get("hide", ()))
    if narrative is not None and not p["demo"] and not narrative.get("spotlight_reviewed"):
        raise ValueError("先逐条看过 profile.spotlight：不适合被录屏分享的商品ID写进 narrative.json 的 hide，看完写 spotlight_reviewed: true，再生成")
    data = webpage(p, narrative)
    errors = privacy_errors(data)
    if errors:
        raise ValueError("公开数据待检查："+"、".join(errors))
    shutil.copytree(ROOT / "assets/template", out, dirs_exist_ok=True,
                    ignore=shutil.ignore_patterns("data.js", "images", "audio"))
    (out / "images").mkdir(exist_ok=True)
    for it in data["items"]:
        if not it["img"]:
            continue
        src = (source_path.parent / it["img"]).resolve()
        if not src.is_relative_to(source_path.parent) or not src.is_file():
            raise ValueError("图片须在私有数据目录内且存在："+it["id"])
        if src.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"):
            raise ValueError("图片格式不支持")
        rel = "images/"+it["id"]+src.suffix.lower()
        shutil.copyfile(src, out / rel)
        it["img"] = rel
    if data['audio'].get('src'):
        (out/'audio').mkdir(exist_ok=True)
        rel=data['audio']['src']
        shutil.copyfile(ROOT/'assets/template'/rel,out/rel)
        credit=data['audio']
        (out/'audio/LICENSES.txt').write_text(credit['credit']+'\n'+credit['source']+'\n'+credit['licenseUrl']+'\n改动：'+credit['changes']+'\n',encoding='utf-8')
    save(out / "profile.json", p)
    (out / "data.js").write_text("window.TEN_YEARS = "+json.dumps(data, ensure_ascii=False, indent=2).replace("<", "\\u003c")+";\n", encoding="utf-8")
    result = bundle(out, out.parent / (out.name+"-单文件.html"))
    save(out.parent / (out.name+"-打包检查.json"), result)
    return result

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("analyze"); a.add_argument("orders"); a.add_argument("profile"); a.add_argument("--scope", choices=["auto", "all"], default="auto"); a.add_argument("--only"); a.add_argument("--keep-sensitive", action="store_true")
    b = sub.add_parser("build"); b.add_argument("orders"); b.add_argument("output"); b.add_argument("--scope", choices=["auto", "all"], default="auto"); b.add_argument("--narrative"); b.add_argument("--only"); b.add_argument("--keep-sensitive", action="store_true")
    c = sub.add_parser("bundle"); c.add_argument("folder"); c.add_argument("output")
    v = sub.add_parser("check"); v.add_argument("folder")
    args = ap.parse_args()
    if args.cmd == "analyze":
        p = analyze(load(args.orders), args.scope, args.only, args.keep_sensitive); save(args.profile, p); print(json.dumps({"orders": p["orders_shown"], "items": p["items_shown"], "mainline": p["mainline"], "selection": p["selection"], "candidates": p["candidates"], "excluded": p["excluded"]}, ensure_ascii=False))
    elif args.cmd == "build":
        print(json.dumps(build(args.orders, args.output, args.scope, args.narrative, args.only, args.keep_sensitive), ensure_ascii=False))
    elif args.cmd == "bundle":
        print(json.dumps(bundle(args.folder, args.output), ensure_ascii=False))
    else:
        d = js_data(Path(args.folder) / "data.js")
        errors = privacy_errors(d)
        for it in d.get("items", []):
            for k in ("img", "cut"):
                if it.get(k) and not (Path(args.folder) / it[k]).is_file():
                    errors.append("缺图："+it["id"])
        print(json.dumps({"ok": not errors, "errors": errors, "note": "程序扫描不能代替逐张图和弹窗隐私检查"}, ensure_ascii=False))
        return bool(errors)
    return 0

if __name__ == "__main__":
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    try:
        sys.exit(main())
    except (ValueError, OSError, KeyError) as exc:
        print("未完成："+str(exc), file=sys.stderr)
        sys.exit(1)
