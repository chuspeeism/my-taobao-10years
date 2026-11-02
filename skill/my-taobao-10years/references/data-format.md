# 私有输入与公开输出

`orders.json` 为UTF-8 JSON（可以有BOM），不要用可执行代码。金额是人民币元，只接受非负数字或null。日期为北京时间 YYYY-MM-DD。最低 Python 3.9，Windows 用双引号包住中文/空格路径。

```json
{
  "schema_version": 1,
  "demo": false,
  "coverage": {"as_of": "2026-11-02", "complete": false, "note": "这里写实际已读取/未读时间窗；未逐单核退款"},
  "orders": [{
    "id": "私有去重ID字符串",
    "date": "2024-06-18",
    "status": "交易成功",
    "refund": "未逐单核实",
    "paid": 89,
    "items": [{
      "title": "原列表商品标题（已人工去隐私）",
      "name": "简短商品名",
      "category": "猫粮",
      "brand": "页面明确写出的品牌",
      "color": "规格明确写出的颜色",
      "spec": "规格（已去隐私）",
      "qty": 1,
      "paid": null,
      "product_key": "核实后同款归一键",
      "product_line": "明确可比较的同系列名（可空）",
      "generation": null,
      "image": "images/私有图片.jpg"
    }]
  }]
}
```

真实输入的 `coverage.as_of` 必须替换为本次采集当天的北京时间日期，不能照抄示例，也不能填最早/最晚订单日。脚本从它回溯十个公历年（闰日回落到2月28日），边界日期均包含；范围外的记录计入 `excluded`，不参与分析、统计或网页。`profile.requested_range` 记录请求窗口，`profile.range` 仍只写实际读到的记录范围。缺采集日时真实输入直接报错；`demo` 必须是布尔值，只有虚构示例可省略采集日。

brand/color 缺失直接省略，脚本显示“未标注”，不能按商品图猜颜色、按店铺猜品牌。category 可根据明确的品名整理并保留核对表；无法判断填“未分类”。product_key 只有核实同款才统一，规格/产品不同要区分；product_line 和 generation 只依据明确型号/代次，不知道就空。image 是输入JSON所在目录内的相对路径，不能是网络图片/绝对路径/上级路径；没有对应图填空。

status 必须明确“交易成功”。退款字段可以是“未逐单核实”“无退款”“已退款”“退款中”“部分退款”。重复ID相同记录去重；同ID冲突会报错，不继续生成。缺日期、商品、ID、负数、数量错误会报错；缺实付不会猜价格。

profile 中的类别、品牌、颜色以**商品行**计算，不是订单数或数量；回购按不同订单计数，同时提供 units。每个排名/回购/序列都有证据商品ID。year_orders 是展示范围内的独立订单，month_of_year_orders 是跨年份的月份分布，不能写成某一年全年节奏。主线不够明确时展示全部，低样本不作唯一判断。

输出 data.js 只使用 o0001/i0001 新编号，图片同步改成 i0001.ext；保留实际日期和单件已知实付，不公开原始ID或链接。profile 也会进入本地网页文件夹用于核对，应同样检查隐私，不能直接把采集日志丢进分享文件。

`narrative.json` 支持 `shop`、`hero`、`story`、`bgm`、`egg`、`plan`、`chat`，会与自动结果合并，不可覆盖 orders/items/theme/meta。示例参考 `examples/`。items/featured 的证据ID必须在展示范围；文字是否符合证据仍须人工核对。

story={summary,keywords,years,chapters}；years 的键为四位年份，值为 {title,line}；chapters 每条为 {id,kind,title,period,big,items,text}。egg={role,work,verdict,candidates,like,unlike,whyNot,tone}；like/unlike 每条 {point,text,items}；whyNot 每条 {role,text}。bgm={song,singer,verdict,reasons,candidates,tone}；reasons 每条 {point,text,items}；candidates 每首包含上述字段与去听url。plan.groups 每组为 {name,items}，每条 {id,month,text,basis}。chat={enabled,name,greeting,presets,endpoint}，presets 每条 {q,a,items}，endpoint 必须留空。
