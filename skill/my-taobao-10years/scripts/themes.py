"""首屏的明暗层次固定；主题只改变色相与醒目的强调色。"""
import colorsys

def mix(a,b,t):
    return '#'+''.join('%02x'%round(int(a[k:k+2],16)*(1-t)+int(b[k:k+2],16)*t) for k in (1,3,5))

DIGITAL={
 'palette':'original-digital','bg':'#eceefb','bg2':'#ffffff','fg':'#111111','accent':'#c6f432','accent2':'#7b5cff',
 'pcBody':'#5d88f5','pcFrame':'#86a9fb','pcBase':'#789df8','pcHandle':'#94b4fd','pcSide':'#4a70e4','pcCap':'#3f6cf0',
 'screenTop':'#30365a','screenBg':'#171a2c','screenFg':'#f4f7ff','screenLabel':'#9fb6ff','screenDate':'#b9c8f5',
 'heroBg':'#f3eefc','heroGlow':'#fbf9ff','heroInk':'#1f2340','heroWord':'#cbd8fd','heroWord2':'#e2e7fb',
 'memoTop':'#efe4ff','memoBottom':'#e6d8ff','heroSnIm':'#efe6ff','ticker':'#2f45ff',
 'heroPalette':['#a9c2ff','#d4bdfb','#bfe7f4','#ffd3e2','#c4ecd2','#ffe2b8'], 'voice':'平实亲切'}

BASES={
 '手机':('#ecf2e9','#c5ed35','#237969','#499083'),
 '影音':('#faedf4','#ff97c9','#9252d5','#bd76af'),
 '影像':('#f5f0e8','#ffce39','#6b59cf','#7d92b5'),
 '电脑':('#f6f3e9','#aee82f','#7853e6','#63a16b')}

def theme_for(main):
    if main not in BASES:return {**DIGITAL,'heroPalette':DIGITAL['heroPalette'][:]}
    bg,accent,accent2,pc=BASES[main]
    h,_,_=colorsys.rgb_to_hls(*[int(pc[k:k+2],16)/255 for k in (1,3,5)])
    pal=['#'+''.join('%02x'%round(v*255) for v in colorsys.hls_to_rgb((h+offset)%1,.84,.54)) for offset in (0,.13,.28,.46,.66,.85)]
    return {**DIGITAL,'palette':main,'bg':bg,'accent':accent,'accent2':accent2,
        'pcBody':pc,'pcFrame':mix(pc,'#ffffff',.35),'pcBase':mix(pc,'#ffffff',.18),'pcHandle':mix(pc,'#ffffff',.45),
        'pcSide':mix(pc,'#111111',.18),'pcCap':mix(pc,'#111111',.25),
        'heroBg':mix(bg,'#ffffff',.2),'heroGlow':mix(bg,'#ffffff',.8),'heroWord':mix(pc,'#ffffff',.73),'heroWord2':mix(pc,'#ffffff',.87),
        'memoTop':mix(accent2,'#ffffff',.86),'memoBottom':mix(accent2,'#ffffff',.8),'heroSnIm':mix(pc,'#ffffff',.9),
        'ticker':accent2,'heroPalette':pal,'screenTop':mix(pc,'#141625',.72),'screenBg':mix(pc,'#10121d',.9),
        'screenLabel':mix(pc,'#ffffff',.65),'screenDate':mix(pc,'#ffffff',.8)}
