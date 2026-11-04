#!/usr/bin/env python3
"""Original compass artwork, no third-party imagery; opaque RGB App Store icon."""
import math, pathlib, struct, zlib, json
out=pathlib.Path(__file__).resolve().parents[1]/'Heritage/Assets.xcassets/AppIcon.appiconset'
out.mkdir(parents=True,exist_ok=True)
rows=[]
for y in range(1024):
 row=bytearray([0])
 for x in range(1024):
  dx,dy=x-512,y-512; r=math.hypot(dx,dy)
  c=(19+int(y/160),48+int(y/100),61+int(y/100))
  if 340<r<354 or 292<r<296: c=(215,185,115)
  if abs(dx)<6 and 325<abs(dy)<375 or abs(dy)<6 and 325<abs(dx)<375: c=(239,221,177)
  # Two-tone compass needle and a small orbit, unlike Monopoly branding.
  if abs(dx)/84 + abs(dy)/253 < 1: c=(239,221,177) if dy<0 else (80,150,157)
  if abs(dx)/228 + abs(dy)/56 < 1: c=(215,185,115) if dx<0 else (139,184,187)
  if r<29: c=(245,237,216)
  row.extend(c)
 rows.append(row)
def chunk(kind,data): return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',1024,1024,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(rows)))+chunk(b'IEND',b'')
(out/'AppIcon.png').write_bytes(png)
(out/'Contents.json').write_text(json.dumps({'images':[{'filename':'AppIcon.png','idiom':'universal','platform':'ios','size':'1024x1024'}],'info':{'author':'xcode','version':1}},indent=2))
(out.parent/'Contents.json').write_text('{"info":{"author":"xcode","version":1}}\n')
