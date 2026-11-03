import {HERITAGE_MEDIA} from './heritage-media.js?v=rights-1';
import {BOARD} from './board.js?v=expansion-1';
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n};
const link=(text,url)=>{const a=el('a',text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a};
export function content(root,section){root.replaceChildren();const title={help:'遊び方・サポート',privacy:'プライバシーと通信',credits:'写真・音・ライセンス'}[section]||'遊び方・サポート';const h=el('h2',title);h.id='info-title';root.append(h);const para=text=>root.append(el('p',text));
 if(section==='privacy'){
 para('この説明は現在のWeb版「世界遺産トラベル」のデータの扱いです（2026年11月4日）。運営窓口：GitHubアカウント selment1 のプロジェクトサポート。');
 root.append(el('h3','端末に保存するもの'));para('音量と短い演出の設定を、このサイトのブラウザ内に保存します。CPU対戦の進行状況とニックネームは、このブラウザに自動保存します。「CPUと遊ぶ」から再開・新規開始・保存の削除ができます。通信対戦は保存・復元できません。このゲームにはアカウント登録、広告、行動解析、カメラ・マイク・位置情報の要求はありません。');
 root.append(el('h3','通信対戦で共有するもの'));para('参加した相手とニックネーム、対戦用ID、ゲームの進行状況を共有します。本名を入力する必要はありません。ルームコードを知る人が開始前の部屋へ参加できるため、信頼できる相手だけに共有してください。');para('接続にはPeerJS CloudのシグナリングとWebRTCを使います。接続先サービスにはIPアドレス等の接続情報が送られ、直接通信では対戦相手にもネットワーク情報が伝わる場合があります。CPU対戦ではこの接続処理を開始しません。');root.append(link('PeerJSの通信方式','https://peerjs.com/client/faq'));
 root.append(el('h3','サイトの配信と外部リンク'));para('画面と写真はGitHub Pagesから配信します。配信元がアクセスに伴うIPアドレスなどを処理する場合があります。外部の資料・ライセンス・サポートを開くと、そのサイトの規約が適用されます。第三者サービスのログ保管期間は、このゲーム側で保証できません。');root.append(link('GitHubのプライバシー方針','https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement'));
 root.append(el('h3','保存・削除と問い合わせ'));para('CPU対戦の保存は開始画面の「保存を削除」で削除できます。通信対戦の状態は退出・終了で破棄されます。対戦相手の画面・記録や外部サービス側のログは、この操作では削除できません。音の設定は「サウンド・演出設定」で変更できます。');para('不具合・方針への一般的な質問は下のサポートへ。公開窓口なので個人情報・ルームコード・秘密情報は投稿しないでください。');root.append(link('プロジェクトの公開サポート','https://github.com/selment1/night-arcade/issues'));
 }else if(section==='credits'){
 para('実在の場所を題材とした非公式のゲームです。UNESCO、遺産管理者、ボードゲーム権利者の公式商品・認定・提携を示すものではありません。金額、所有、建築は架空のゲーム設定で、実際の遺産の売買・開発権を表しません。');para('音楽・効果音はこのゲーム用のプログラム生成音です。写真には以下の個別ライセンスが適用されます。各写真は縮小・JPEG圧縮済みで、画面上では切り抜かれることがあります。');
 for(const [id,m] of Object.entries(HERITAGE_MEDIA)){const article=el('article');article.className='credit-item';article.dataset.creditId=id;article.append(el('h3',BOARD[Number(id)].name),el('p',m.alt),el('p','写真：'+m.credit+' / '+m.license),el('p',m.changes),link('原典・元写真',m.source));if(m.licenseUrl)article.append(link('ライセンス条件',m.licenseUrl));article.append(link('使用している写真を単独で開く',m.src));root.append(article)}
 root.append(el('h3','通信ライブラリ'));root.append(link('PeerJS — MITライセンス','../vendor/LICENSE-peerjs.txt'));para('各素材のライセンスは、その素材に対するものです。写っている建築物・商標・撮影場所の条件など、写真の著作権以外の権利を保証する表示ではありません。');
 }else{
 const steps=el('ol');for(const text of ['「CPUと遊ぶ」で1人＋CPU1〜3人、またはルームコードで友だちと2〜4人で開始します。','サイコロで移動し、購入する土地名・価格・残るお金を確認します。見送ると全員参加の競売です。','同色の土地を集め、均等に家・ホテルを建てると利用料が増えます。盤面の緑の数字は家の軒数、赤いHはホテルです。','「物件の交渉」では土地と差額を提案できます。合意前は何も移動しません。抵当中・同色に建物がある土地は対象外です。','自分のカードはタップして確認。自分の入出金は「確認して次へ」を押すまで待ち、それ以外の入出金は自動で進みます。','支払い不足なら建物の売却や抵当で資金を作ります。支払えなくなった旅人が脱落し、最後に残った人が勝ちです。'])steps.append(el('li',text));root.append(steps);
 root.append(el('h3','小さなマスを押しづらいとき'));para('盤面下の「全40マスの名前・価格」や「場所をくわしく見る」を使えます。所持物件・保管カードは「手持ちのカード」で確認できます。');
 root.append(el('h3','中断・通信・音'));para('CPU対戦は同じブラウザで「CPUと遊ぶ」→「続きから」で再開できます。別のタブと同時には遊べません。通信対戦は保存・再接続に対応していません。通信対戦では参加者の退出・画面ロック・別アプリへの切替で接続が切れることがあります。対戦中は参加者全員が画面を開いたまま遊んでください。');para('音は「音 ON」を押した後だけ鳴ります。BGM・効果音の音量、短い演出を設定できます。');
 root.append(el('h3','接続できない・操作できないとき'));para('通信コードが正しいか、ホストが画面を開いているかを確認してください。接続が切れた対戦は復元できません。確認待ちのカード・お会計・交渉があれば先に操作します。');para('改善の報告は下の公開窓口へ。端末・ブラウザ・直前の操作を書くと調査しやすくなります。個人情報やルームコードは書かないでください。');root.append(link('不具合・改善を報告する','https://github.com/selment1/night-arcade/issues'));
 }
}
export class InfoCenter{
 constructor(getNetwork,onResume){this.getNetwork=getNetwork;const nav=el('nav');nav.className='info-nav';nav.setAttribute('aria-label','ゲームの案内');this.dialog=el('dialog');this.dialog.className='info-dialog';this.dialog.setAttribute('aria-labelledby','info-title');const close=el('button','閉じる');close.className='info-close';close.onclick=()=>this.dialog.close();const body=el('div');body.className='info-content';this.dialog.append(close,body);document.body.append(this.dialog);for(const [key,label] of [['help','遊び方・サポート'],['privacy','プライバシー'],['credits','写真・ライセンス']]){const b=el('button',label);b.id='info-'+key;b.onclick=()=>{content(body,key);this.opener=b;this.dialog.showModal();body.scrollTop=0;close.focus()};nav.append(b)}document.querySelector('footer').prepend(nav);this.dialog.onclose=()=>this.opener?.focus();
 this.exitDialog=el('dialog');this.exitDialog.className='info-dialog exit-dialog';this.exitDialog.setAttribute('aria-labelledby','exit-title');const title=el('h2','対戦を終了しますか？');title.id='exit-title';this.exitText=el('p');const cancel=el('button','対戦に戻る');cancel.id='exit-cancel';cancel.onclick=()=>this.exitDialog.close();const end=el('button','終了して戻る');end.id='exit-confirm';end.onclick=()=>getNetwork().leave();this.exitDialog.append(title,this.exitText,cancel,end);this.exitDialog.onclose=()=>{document.getElementById('leave').focus();onResume()};document.body.append(this.exitDialog);
 }
 leave(){const n=this.getNetwork();if(!n.state||n.state.phase==='over'){n.leave();return;}this.exitText.textContent=n.solo?'進行状況はこのブラウザに自動保存します。「CPUと遊ぶ」から続きを遊べます。':'退出すると全員の通信対戦が中断します。この対戦へ戻ることはできません。';this.exitDialog.showModal();document.getElementById('exit-cancel').focus();if(n.solo)clearTimeout(n.timer);}
}
if(document.getElementById('standalone-info')){const show=()=>content(document.getElementById('standalone-info'),location.hash.slice(1));show();window.addEventListener('hashchange',show);}
