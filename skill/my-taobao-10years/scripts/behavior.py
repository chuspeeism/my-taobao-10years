"""订单行为证据与可追溯的配乐候选；不推断动机/使用情况。"""
from collections import defaultdict
from datetime import date
from statistics import median
import json
import hashlib
from collections import Counter
from pathlib import Path

CHOICES={
 '宠物':[('小手拉大手','reorder','把一再补货的小动作配成轻快的照料日常'),('简单爱','cadence','让稳定出现的日常用品搭配简单轻松的节奏'),('小幸运','variety','用几类小用品切换画面，保留温暖气质'),('宝贝','bulk','适合把成组购买的照料物件拍成温柔小景'),('稻香','reorder','围绕反复出现的生活补给，做朴素的日常画面'),('小美满','variety','配生活小物件的轻松陈列')],
 '母婴':[('宝贝','reorder','以反复补给的照料用品作温柔的物件叙事'),('亲亲我的宝贝','bulk','适合成组用品的照料场景，不据此判断家庭身份'),('小手拉大手','cadence','用品按记录反复出现，可配轻快的日常整理'),('小美满','variety','把多类用品的细节剪成小而轻的生活画面'),('简单爱','sequence','商品系列发生变化时，用轻松节奏串联物件'),('稻香','reorder','围绕具体生活补给选曲，不替主人编经历')],
 '户外':[('去大理','variety','多种户外装备可以剪成准备出发的物件组'),('平凡之路','sequence','把同类装备购买序列配上行进感'),('蓝莲花','cadence','围绕户外用品再次出现的节奏，留舒展的画面空间'),('Try Everything','variety','配尝试不同类型装备的陈列，不宣称已经使用'),('生活因你而火热','bulk','一单多件装备适合利落、热闹的组合镜头'),('稻香','reorder','回到重复买过的实用物件，让画面松弛一点')],
 '数码':[('阳光宅男','variety','把多种数码/游戏物件拍成轻松的装备柜，不当人物标签'),('超跑女神','sequence','同系列产品购买顺序适合利落的切换节奏'),('我的滑板鞋','reorder','同款反复出现，可用诙谐气质调侃挑装备的细节'),('快乐崇拜','bulk','成组设备可搭明快的产品轮播，不推断下单时心情'),('Try Everything','variety','多种硬件可配尝试不同工具的展示表达'),('生活因你而火热','cadence','把反复出现的配件采购配成热闹的物件拼贴')],
 '其他':[('生活因你而火热','bulk','一单多件的生活小物适合热闹的组合画面'),('小美满','variety','多类小物件可以做轻松的生活陈列'),('小手拉大手','cadence','为反复出现的日常用品留轻快节奏'),('稻香','reorder','以具体生活补给而不是年份跨度来选曲'),('简单爱','sequence','用简单轻松的节奏串联商品变化'),('Try Everything','variety','配多类物件的探索式陈列')]
}

def behavior_facts(items, orders):
    facts=[];by_product=defaultdict(list);by_cat=defaultdict(list);by_line=defaultdict(list);by_order=defaultdict(list)
    for it in items:
        by_product[it['product_key']].append(it);by_cat[it['cat']].append(it);by_order[it['order']].append(it)
        if it['product_line']:by_line[it['product_line']].append(it)
    def distinct(rows):
        seen=set();return [i for i in rows if not(i['order'] in seen or seen.add(i['order']))]
    def cadence(rows):
        dates=[date.fromisoformat(i['date']) for i in distinct(rows)]
        gaps=[(b-a).days for a,b in zip(dates,dates[1:])]
        return gaps,float(median(gaps)) if gaps else None
    def add(kind,label,text,rows,**extra):
        rows=distinct(rows)
        facts.append({'kind':kind,'label':label,'text':text,'items':[i['id'] for i in rows], 'order_ids':[i['order'] for i in rows], 'clue_id':kind+'-'+hashlib.sha256('|'.join(i['id'] for i in rows).encode()).hexdigest()[:10],**extra})
    for name,rows in sorted(by_product.items(),key=lambda p:(-len({i['order'] for i in p[1]}),p[0])):
        unique=distinct(rows)
        if len(unique)<2:continue
        gaps,med=cadence(rows)
        add('reorder','同款跨单回购',f'「{rows[0]["name"]}」在{len(unique)}个独立订单出现，共{sum(i["qty"] for i in rows)}件；{unique[0]["date"]}至{unique[-1]["date"]}，相邻已读下单间隔中位{med:g}天。',rows,orders=len(unique),units=sum(i['qty'] for i in rows),gaps_days=gaps,median_days=med)
    for cat,rows in sorted(by_cat.items(),key=lambda p:(-len({i['order'] for i in p[1]}),p[0])):
        unique=distinct(rows)
        if len(unique)<3:continue
        gaps,med=cadence(rows)
        add('cadence','同品类的购买节奏',f'「{cat}」分布在{len(unique)}个独立订单；{unique[0]["date"]}至{unique[-1]["date"]}，相邻已读下单间隔中位{med:g}天（不是完整消费周期）。',rows,orders=len(unique),gaps_days=gaps,median_days=med)
    for oid,rows in sorted(by_order.items()):
        units=sum(i['qty'] for i in rows)
        if units>1:add('bulk','同一订单的件数',f'{rows[0]["date"]}的同一订单内，本页展示{len(rows)}条商品行、合计{units}件；例如「{rows[0]["name"]}」。',rows,lines=len(rows),units=units)
    for line,rows in sorted(by_line.items()):
        if len(distinct(rows))<2:continue
        add('sequence','同系列购买序列',f'「{line}」从{rows[0]["date"]}的「{rows[0]["name"]}」到{rows[-1]["date"]}的「{rows[-1]["name"]}」，出现{len(rows)}条记录；不能据此认定升级或替换。',rows,lines=len(rows))
    if len(by_cat)>1 and len(orders)>1:
        desc='、'.join(f'{cat}{len(rows)}行' for cat,rows in sorted(by_cat.items(),key=lambda p:(-len(p[1]),p[0]))[:3])
        add('variety','物件组合',f'展示范围有{len(by_cat)}个品类：{desc}；可从{items[0]["date"]}的「{items[0]["name"]}」点回核对。',items,categories=len(by_cat))
    if len(orders)>1:
        add('coverage','已读订单范围',f'本页{len(orders)}个独立订单，实际覆盖{len({o["date"][:7] for o in orders})}个有记录月份；最近一条是{items[-1]["date"]}的「{items[-1]["name"]}」。',items,orders=len(orders))
    # 按独立订单生成短名线索，用于每首歌的一条独有证据；不复制原始商品长标题。
    for oid,rows in sorted(by_order.items(),key=lambda p:(p[1][0]['date'],p[0])):
        it=rows[0];same=distinct(by_product[it['product_key']]);category=distinct(by_cat[it['cat']]);series=by_line.get(it['product_line'],[])
        units=sum(i['qty'] for i in rows)
        detail='同款在'+str(len(same))+'个独立订单出现' if len(same)>1 else '同品类在'+str(len(category))+'个独立订单出现'
        if len(series)>1:detail='这个明确系列有'+str(len(series))+'条购买记录'
        add('purchase','具体订单与购买方式',f'{it["date"]}「{it["name"]}」所在订单，本页展示{len(rows)}条商品行、{units}件，{detail}。',rows,
            short_name=it['name'],cat=it['cat'],repeat_orders=len(same),category_orders=len(category),series_rows=len(series),units=units)
    return facts

def song_candidates(main, facts, root):
    catalog={r['song']:r for r in json.loads((Path(root)/'references/song-catalog.json').read_text(encoding='utf-8'))}
    grouped=[f for f in facts if f['kind']!='purchase']
    purchases=[f for f in facts if f['kind']=='purchase']
    if len(purchases)<2:return []
    # 避免独有订单又成为另一条汇总线索的首尾证据。
    endpoint_orders={oid for f in grouped for oid in f['order_ids'][:1]+f['order_ids'][-1:]}
    available={f['kind'] for f in grouped}
    choices=CHOICES.get(main,CHOICES['其他'])
    selected=[];used_orders=set();used_names=set();used_cats=set()
    for name,kind,verdict in choices:
        candidates=[f for f in purchases if f['order_ids'][0] not in used_orders and f['short_name'] not in used_names]
        if not candidates:break
        def score(f):
            match={'reorder':f['repeat_orders']>1,'cadence':f['category_orders']>=3,'bulk':f['units']>1,'sequence':f['series_rows']>1,'variety':f['cat'] not in used_cats}.get(kind,False)
            return (f['order_ids'][0] in endpoint_orders,not match,f['cat'] in used_cats)
        primary=min(candidates,key=score)
        used_orders.add(primary['order_ids'][0]);used_names.add(primary['short_name']);used_cats.add(primary['cat'])
        selected.append((name,kind,verdict,primary))
    name_uses=Counter(f['short_name'] for _,_,_,f in selected)
    names={f['short_name'] for f in purchases}
    clue_uses=Counter();order_uses=Counter();pool=[]
    secondary_pool=grouped+[f for f in purchases if f['order_ids'][0] not in used_orders]
    for name,kind,verdict,primary in selected:
        options=[f for f in secondary_pool if clue_uses[f['clue_id']]<2 and not(set(f['order_ids'][:1]+f['order_ids'][-1:])&used_orders) and all(order_uses[oid]<2 for oid in f['order_ids'][:1]+f['order_ids'][-1:]) and all(name_uses[n]<2 for n in names if '「'+n+'」' in f['text'])]
        if not options:continue
        def rank(f):
            endpoints=f['order_ids'][:1]+f['order_ids'][-1:]
            return (f['kind']!=kind,f['kind']=='purchase',clue_uses[f['clue_id']],f['kind']=='coverage')
        secondary=min(options,key=rank)
        clue_uses[secondary['clue_id']]+=1
        for oid in set(secondary['order_ids'][:1]+secondary['order_ids'][-1:]):order_uses[oid]+=1
        for n in names:
            if '「'+n+'」' in secondary['text']:name_uses[n]+=1
        proof=[primary,secondary]
        reasons=[]
        for f in proof:
            # 每条恰好一句；匹配气质只写在verdict，不在两条末尾重复。
            text=f['text'].rstrip('。').replace('。','；')+'。'
            reasons.append({'point':f['label'],'text':text,'items':f['items'][:1]+f['items'][-1:] if len(f['items'])>1 else f['items'], 'behavior':f['kind'],'clue_id':f['clue_id']})
        rec=catalog[name]
        pool.append({'song':rec['song'],'singer':rec['singer'],'verdict':verdict,'url':rec['source'],'verified_source':rec['source'],'behavior_tag':kind,'behavior_match':kind in available,'reasons':reasons})
    return pool
