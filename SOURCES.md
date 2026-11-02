# 随包来源

| 内容 | 来源 | 授权/处理 |
|---|---|---|
| 十年小铺融合版模板 | 项目提供的虚构数据模板 | 本项目未附开源许可证，欢迎个人安装使用。 |
| 首屏货架观感 | 灵感来自 motionsites 的 Folio 效果 | 货架波浪控制代码已重写为解析阻尼求解；保留连续波浪、屏幕跟手与吐纸体验，不带原改写注释或原积分实现 |
| three.global.min.js | three.js r170，含其示例 RoundedBoxGeometry 与 RoomEnvironment；https://github.com/mrdoob/three.js/tree/r170 | MIT；完整许可在每份模板的 THREE-LICENSE.txt，单文件也保留许可注释 |
| 字体 | 系统字体回退栈 | 不打包、不下载字体文件 |
| 虚构商品图 | 本项目以SVG几何绘制 | 原创示意，非真实商品图，可用于本项目演示 |
| music.py 输出的示意音轨 | 本项目合成器脚本；不是已有歌曲、不是在线作曲 | 生成音频按 CC0-1.0 提供；https://creativecommons.org/publicdomain/zero/1.0/ |
| 商业歌曲名称和搜索链接 | 真实歌曲元信息 | 仅推荐，未复制音频/歌词/封面；不授予播放或再分发权 |

Skill 的分析、打包、开关与自绘示例脚本为本项目新增，Python只使用标准库。用户真实商品图和音乐不属于本包，需本人分别核实分享范围与使用权。

## 模板内的7首纯音乐

全部在下载前核对作者官方许可页与曲目元数据，按 CC BY 4.0 署名。文件为前100秒节选，添加首尾淡入淡出并重编码为112kbps MP3；每首约1.40MB。以下曲目尚未经过人耳试听。

| 曲目 | 作者 | 原页 | 许可 | 文件 |
|---|---|---|---|---|
| Monkeys Spinning Monkeys | Kevin MacLeod | [官方曲目](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400011) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `audio/monkeys.mp3`，100秒 |
| Carefree | Kevin MacLeod | [官方曲目](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400037) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `audio/carefree.mp3`，100秒 |
| Life of Riley | Kevin MacLeod | [官方曲目](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400054) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `audio/riley.mp3`，100秒 |
| Pixelland | Kevin MacLeod | [官方曲目](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1500076) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `audio/pixelland.mp3`，100秒 |
| Wallpaper | Kevin MacLeod | [官方曲目](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100843) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `audio/wallpaper.mp3`，100秒 |
| Easy Lemon | Kevin MacLeod | [官方曲目](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1200076) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `audio/easy-lemon.mp3`，100秒 |
| Dream Culture | Kevin MacLeod | [官方曲目](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300046) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `audio/dream-culture.mp3`，100秒 |

作者原文许可关键句：Licensed under Creative Commons: By Attribution 4.0 License。完整署名在 `assets/template/audio/LICENSES.txt`，生成的网页页脚与单文件会保留当前曲目的作者、来源、许可和改动说明。商业歌曲只推荐，不与这些音轨混称。合成器只留作用户找不到授权音乐时的手动兜底，不默认启用。
