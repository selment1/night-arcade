#!/usr/bin/env python3
"""Bundle a committed web snapshot; never copy a concurrent working-tree edit."""
import pathlib, subprocess, tarfile, io, shutil
root = pathlib.Path(__file__).resolve().parents[2]
out = root / 'ios/Heritage/Resources/Web'
rev = (root / 'ios/SOURCE_REVISION').read_text().strip()
rev = subprocess.check_output(['git','rev-parse',rev+'^{commit}'],cwd=root,text=True).strip()
blob = subprocess.check_output(['git','archive',rev,'public/estates','public/vendor/peerjs.min.js','public/vendor/LICENSE-peerjs.txt'],cwd=root)
if out.exists(): shutil.rmtree(out)
out.mkdir(parents=True)
with tarfile.open(fileobj=io.BytesIO(blob)) as archive:
    for member in archive.getmembers():
        if not member.isfile(): continue
        path = pathlib.PurePosixPath(member.name)
        target = out.joinpath(*path.parts[1:])
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(archive.extractfile(member).read())
(out/'SourceCommit.txt').write_text(rev+'\n')
print(rev)

app = out/'estates/app.js'
text = app.read_text()
old = "location.origin+location.pathname+'?room='"
assert text.count(old) == 1, 'Review invitation URL adapter against new snapshot'
text = text.replace(old, "'https://selment1.github.io/night-arcade/estates/?room='")
app.write_text(text)
index = out/'estates/index.html'
text = index.read_text().replace('アプリのインストール不要。ホストのブラウザを開いたまま遊んでください。','招待された友だちはブラウザからも参加できます。対戦中はアプリを開いたままにしてください。')
index.write_text(text)

about = out/'estates/about.js'
text = about.read_text().replace('現在のWeb版', 'iOS検証版').replace('このサイトのブラウザ内', 'このアプリ内').replace('このブラウザ', 'このアプリ').replace('同じブラウザ', '同じアプリ')
text = text.replace('画面と写真はGitHub Pagesから配信します。配信元がアクセスに伴うIPアドレスなどを処理する場合があります。', '画面と写真はアプリ内に同梱しています。CPU対戦のために配信サイトへ接続する必要はありません。招待リンクは友だちがGitHub PagesのWeb版を開けるURLです。')
about.write_text(text)
