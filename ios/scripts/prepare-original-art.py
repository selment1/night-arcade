#!/usr/bin/env python3
"""Create a separate photo-free review bundle. Never replace the playable iOS bundle."""
import pathlib, shutil, json, subprocess, html, hashlib
root=pathlib.Path(__file__).resolve().parents[2]
source=root/'ios/Heritage/Resources/Web'
out=root/'ios/build/original-art/Web'
assert (source/'SourceCommit.txt').is_file(), 'Run sync-web.py first'
if out.exists(): shutil.rmtree(out)
shutil.copytree(source,out)
media=json.loads(subprocess.check_output(['node','--input-type=module','-e',f"import {{HERITAGE_MEDIA}} from {json.dumps((source/'estates/heritage-media.js').as_uri())}; process.stdout.write(JSON.stringify(HERITAGE_MEDIA));"],text=True))
photos=out/'estates/photos'
if photos.exists(): shutil.rmtree(photos)
art=out/'estates/art';art.mkdir(exist_ok=True)
manifest={}; provenance=[]
for index,(key,old) in enumerate(media.items()):
    # Generic travel symbols, not depictions/reconstructions of named monuments.
    palettes=[('#122e3b','#e1bc76','#52878e'),('#223c48','#e5c496','#9eaca0'),('#253e43','#edc599','#699c85'),('#223548','#cfc0a3','#7c9caf')]
    bg,gold,accent=palettes[index%len(palettes)]
    country=old.get('country','世界の旅')
    caption=f'{country}への旅のイメージ（現地写真ではありません）'
    label=html.escape(caption)
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 600" role="img" aria-label="{label}"><title>{label}</title><rect width="960" height="600" fill="{bg}"/><circle cx="730" cy="160" r="76" fill="{gold}"/><path d="M0 470 Q180 250 360 440 T720 400 T1100 420 V600 H0Z" fill="{accent}"/><path d="M0 540 Q240 400 480 520 T960 480 V600 H0Z" fill="{gold}" opacity=".24"/><circle cx="285" cy="245" r="115" fill="none" stroke="{gold}" stroke-width="3"/><path d="M285 108 L311 245 285 382 259 245Z" fill="{gold}"/><path d="M148 245 L285 219 422 245 285 271Z" fill="{accent}"/><circle cx="285" cy="245" r="16" fill="#fff1d4"/><path d="M80 520 Q240 440 450 500 T840 465" fill="none" stroke="{gold}" stroke-width="3" stroke-dasharray="8 12"/><circle cx="840" cy="465" r="10" fill="{gold}"/><text x="50" y="65" fill="{gold}" font-family="sans-serif" font-size="18" letter-spacing="5">TRAVEL SKETCH · {index+1:02}</text><text x="50" y="570" fill="#fff1d4" font-family="sans-serif" font-size="16">SYMBOLIC ART · NOT A DESTINATION PHOTOGRAPH</text></svg>'''
    file=art/f'{key}.svg';file.write_text(svg)
    manifest[key]={'credit':'プロジェクト独自の図案コード','license':'外部写真不使用','source':f'art/{key}.svg','src':f'art/{key}.svg','alt':caption,'caption':caption,'country':country,'changes':'抽象的な旅の図案です。現地の建物・景観を再現したものではありません。'}
    provenance.append({'id':key,'file':f'estates/art/{key}.svg','sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'origin':'ios/scripts/prepare-original-art.py','external_source':None})
(out/'estates/heritage-media.js').write_text('export const HERITAGE_MEDIA = Object.freeze('+json.dumps(manifest,ensure_ascii=False,indent=2)+');\n')
for filename in ['photo-view.js','about.js']:
    path=out/'estates'/filename;text=path.read_text()
    text=text.replace('写真の出典・ライセンス','図案について').replace('写真・音・ライセンス','図案・音・ライセンス').replace('写真・ライセンス','図案・ライセンス').replace('写真：','図案：').replace('原典・元写真','図案を開く').replace('使用している写真を単独で開く','図案を単独で開く')
    text=text.replace('写真には以下の個別ライセンスが適用されます。各写真は縮小・JPEG圧縮済みで、画面上では切り抜かれることがあります。','この配布準備用セットに外部の写真は含めていません。独自のコードで作った抽象図案であり、現地写真ではありません。')
    text=text.replace('写真の著作権以外の権利を保証する表示ではありません。','ゲーム全体の権利確認が完了したことを示すものではありません。')
    path.write_text(text)
(out/'ART-PROVENANCE.json').write_text(json.dumps({'sourceCommit':(source/'SourceCommit.txt').read_text().strip(),'generator':'ios/scripts/prepare-original-art.py','assets':provenance,'status':'photo-free-review-only; game-design-and-name-clearance-pending'},ensure_ascii=False,indent=2))
assert not list(out.rglob('*.jpg'))
print(f'Created {len(manifest)} original symbolic images at {out}; playable bundle unchanged.')
