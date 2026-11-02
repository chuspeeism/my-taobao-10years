"""生成原创几何合成音示意曲；非商业歌曲、非在线作曲能力。仅标准库。"""
import argparse
import math
from pathlib import Path
import random
import struct
import wave

def synthesize(output, seed="小铺"):
    rng = random.Random(seed)
    rate, beat = 22050, .36
    scale = [60, 62, 64, 67, 69, 72]
    notes = [rng.choice(scale) for _ in range(24)]
    samples = []
    for n, note in enumerate(notes):
        freq = 440 * 2 ** ((note-69)/12)
        for j in range(round(rate*beat)):
            t = j/rate
            envelope = min(1,t/.012) * math.exp(-t*7) * min(1,(beat-t)/.035)
            tone = (math.sin(2*math.pi*freq*t)+.18*math.sin(4*math.pi*freq*t))*.16
            bass = .055*math.sin(2*math.pi*(freq/4)*t)*math.exp(-t*5)
            samples.append(struct.pack('<h',int(max(-1,min(1,(tone+bass)*envelope))*32767)))
    output = Path(output); output.parent.mkdir(parents=True,exist_ok=True)
    with wave.open(str(output),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes(b''.join(samples))
    return {'seconds':len(samples)/rate,'seed':seed,'license':'原创合成示意音频，CC0-1.0；不是商业歌曲或在线作曲结果'}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('output');p.add_argument('--seed',default='小铺');a=p.parse_args();print(synthesize(a.output,a.seed))
