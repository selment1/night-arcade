import {CARD_DECKS} from './cards.js?v=expansion-1';
import {HERITAGE_MEDIA} from './heritage-media.js?v=rights-1';
import {BOARD} from './board.js?v=expansion-1';
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n};
const link=(text,url)=>{const a=el('a',text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a};
export function content(root,section){root.replaceChildren();const title={help:'遊び方・サポート',privacy:'プライバシーと通信',credits:'写真・音・ライセンス'}[section]||'遊び方・サポート';const h=el('h2',title);h.id='info-title';root.append(h);const para=text=>root.append(el('p',text));
 if(section==='privacy'){
 para('この説明は現在のWeb版「TheRich」のデータの扱いです（2026年11月5日）。運営窓口：GitHubアカウント selment1 のプロジェクトサポート。');
 root.append(el('h3','端末に保存するもの'));para('音量と短い演出の設定を、このサイトのブラウザ内に保存します。CPU対戦の進行状況とニックネームは、このブラウザに自動保存します。「CPUと遊ぶ」から再開・新規開始・保存の削除ができます。通信対戦は保存・復元できません。このゲームにはアカウント登録、広告、行動解析、カメラ・マイク・位置情報の要求はありません。');
 root.append(el('h3','通信対戦で共有するもの'));para('参加した相手とニックネーム、対戦用ID、ゲームの進行状況を共有します。本名を入力する必要はありません。ルームコードを知る人が開始前の部屋へ参加できるため、信頼できる相手だけに共有してください。');para('接続にはHTTPS中継サーバーとCloudflareの一時トンネルを使用します。運営サーバーがニックネーム・対戦用ID・進行状況を処理し、Cloudflareと運営側はIPアドレス等の接続情報を扱います。CPU対戦ではこの接続処理を開始しません。通信状態はメモリ内のみで管理し、最後の通信から2時間後、またはサーバー停止で削除します。');root.append(link('Cloudflareのプライバシーポリシー','https://www.cloudflare.com/privacypolicy/'));
 root.append(el('h3','サイトの配信と外部リンク'));para('画面と写真はGitHub Pagesから配信します。配信元がアクセスに伴うIPアドレスなどを処理する場合があります。外部の資料・ライセンス・サポートを開くと、そのサイトの規約が適用されます。第三者サービスのログ保管期間は、このゲーム側で保証できません。');root.append(link('GitHubのプライバシー方針','https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement'));
 root.append(el('h3','保存・削除と問い合わせ'));para('CPU対戦の保存は開始画面の「CPUと遊ぶ」→「保存データの管理」→「保存を削除」で削除できます。通信対戦の状態は最後の通信から2時間後、またはサーバー停止時に破棄されます。対戦相手の画面・記録や外部サービス側のログは、この操作では削除できません。音の設定は「サウンド・演出設定」で変更できます。');para('不具合・方針への一般的な質問は下のサポートへ。公開窓口なので個人情報・ルームコード・秘密情報は投稿しないでください。');root.append(link('プロジェクトの公開サポート','https://github.com/selment1/night-arcade/issues'));
 }else if(section==='credits'){
 para('実在の場所を題材とした非公式のゲームです。UNESCO、遺産管理者、ボードゲーム権利者の公式商品・認定・提携を示すものではありません。金額、所有、建築は架空のゲーム設定で、実際の遺産の売買・開発権を表しません。');para('音楽・効果音はこのゲーム用のプログラム生成音です。写真には以下の個別ライセンスが適用されます。各写真は縮小・JPEG圧縮済みで、画面上では切り抜かれることがあります。');
 for(const [id,m] of Object.entries(HERITAGE_MEDIA)){const article=el('article');article.className='credit-item';article.dataset.creditId=id;article.append(el('h3',BOARD[Number(id)].name),el('p',m.alt),el('p','写真：'+m.credit+' / '+m.license),el('p',m.changes),link('原典・元写真',m.source));if(m.licenseUrl)article.append(link('ライセンス条件',m.licenseUrl));article.append(link('使用している写真を単独で開く',m.src));root.append(article)}
 root.append(el('h3','通信ライブラリ'));root.append(link('PeerJS — MITライセンス','../vendor/LICENSE-peerjs.txt'));para('各素材のライセンスは、その素材に対するものです。写っている建築物・商標・撮影場所の条件など、写真の著作権以外の権利を保証する表示ではありません。');
 }else{
 const sections=[
  [
    "まずはここから：目的と開始方法",
    [
      "TheRichは世界遺産をめぐる資産ゲームです。各プレイヤーは€1,500で出発し、土地の購入・利用料・交渉で資産を増やします。支払いができなくなった人から脱落し、最後まで残った1人が勝者です。€はゲーム内通貨で、現金や課金ではありません。",
      "1人ならCPUの人数を1〜3人から選び「CPUと遊ぶ」。友だちとの通信対戦は合計2〜4人です。部屋を作った人が、全員の参加を確認して「このメンバーで出発」を押します。下の「通信対戦」で接続方法とテスト版の制限を確認してください。"
    ]
  ],
  [
    "手番の流れ・サイコロ・ゾロ目",
    [
      "自分の番になったら「サイコロを振る」。2個の合計だけ進み、止まった場所の購入・支払い・カードの効果を処理します。必要な確認を終えたら「ターンを終了」で次へ進みます。",
      "ゾロ目なら処理後にもう一度振れます。ただし同じ手番で3回連続ゾロ目になると拘留所へ移動します。拘留中のゾロ目による釈放では、追加のサイコロはありません。",
      "前進して出発点を通過・到着すると€200を受け取ります。「拘留所へ移動」や後ろへ戻る移動では、出発点収入は発生しません。"
    ]
  ],
  [
    "土地の購入・利用料",
    [
      "未所有の物件に止まると、名前・定価・購入後の所持金が表示されます。「購入」で銀行から取得できます。資金が足りない場合は、資金を用意するか競売へ進みます。",
      "相手の物件に止まると、その場所の現在の利用料を支払います。自分の物件では支払いなし。抵当中の物件でも利用料はかかりません。物件カードで定価・現在の利用料・建築費・抵当額を確認できます。"
    ]
  ],
  [
    "購入を見送ったときの競売",
    [
      "「見送る → 競売」を押すと、その物件を全員で競ります。購入を見送った本人も参加できます。初回は€1以上、その後は現在の最高額より大きく、所持金以内の整数€で入札します。",
      "最高入札者は相手の判断を待ちます。「入札をやめる」と、その競売には戻れません。他の参加者が全員降りると最高入札者が落札額を支払い、所有者になります。全員が入札なしで降りた場合は銀行に残ります。"
    ]
  ],
  [
    "同じ色の土地をそろえる",
    [
      "同じ色の土地をすべて所有すると、建物がない土地の利用料が通常の2倍になります。家・ホテルが建っている場合は、その建物段階の料金を使います。",
      "同じ色がそろい、その色に抵当中の物件がなければ建築できます。現在の所有数は物件の説明欄で、土地ごとの料金はカード内の「利用料の一覧」で確認できます。"
    ]
  ],
  [
    "鉄道・港・空港のセット効果",
    [
      "東の鉄道・南の港・西の空港・北の鉄道は、名前が違っても共通の交通セットです。同じ人が所有する数に応じて、各拠点の利用料が1か所€25、2か所€50、3か所€100、4か所€200になります。家やホテルは建てられません。",
      "例えば2か所持つ人の交通拠点に止まると€50です。現在の実装では抵当中の拠点も所有数には含みますが、止まった拠点自体が抵当中なら支払いは€0です。"
    ]
  ],
  [
    "電力・水力のセット効果",
    [
      "クリーン電力と水のネットワークは2社セットです。同じ人が1社だけ所有するとサイコロの合計×4、2社そろえると合計×10が利用料です。家・ホテルは建てられません。",
      "出目が7なら、1社所有で€28、2社所有で€70です。抵当中の会社に止まった場合は€0。カードには所有者の保有数と現在の倍率を表示します。"
    ]
  ],
  [
    "家・ホテルを建てる／売る",
    [
      "手持ちの物件カードを開いて「建築」を選びます。同じ色の土地を全部そろえ、同色に抵当がなく、建築費を持っている必要があります。競売・交渉中や支払い不足中は建築できません。",
      "建物は同じ色の中で均等に増やします。最も建物の少ない土地から、家1〜4軒、次にホテル1軒へ進みます。盤面の家マークと数字が家の数、赤いHがホテルです。",
      "売るときは「建物を売る」。同じ色で最も建物が多い土地から均等に1段階ずつ減らし、1段階につき建築費の半額を受け取ります。ホテルを1段階売ると家4軒に戻ります。"
    ]
  ],
  [
    "抵当に入れる／解除する",
    [
      "自分の物件カードから「抵当に入れる」を選ぶと、表示された抵当額を受け取れます。所有権は残りますが、その物件から利用料を受け取れなくなります。土地の場合は同色の建物をすべて売ってから抵当に入れます。",
      "抵当中は盤面の縞模様と「抵」マーク、カードの「抵当中」で確認できます。「抵当を解除」で、抵当額の110%（端数切り上げ）を支払うと復帰します。例えば€30の抵当なら解除は€33です。支払い不足中の解除はできません。"
    ]
  ],
  [
    "物件をトレードする",
    [
      "自分の手番の開始時か終了前に、物件カードの「この物件をトレード」、または「手持ちのカード」内の「物件の交渉」を開きます。相手・渡す物件・受け取る物件・差額の向きと金額を指定します。",
      "現金を添えた売買や物件同士の交換ができます。少なくとも1つの物件が必要です。抵当中の物件、同じ色に建物がある物件は交渉できません。差額はどちらか一方が支払い、所持金を超える提案はできません。",
      "相手は承諾・見送り・条件変更による再提案を選べます。提案者は取り下げも可能です。双方が合意するまで、物件もお金も移動しません。交渉中は手番が止まります。CPUは定価や手持ち資金を基準に判断するため、必ず受け入れるわけではありません。"
    ]
  ],
  [
    "チャンス・手紙・入出金の確認",
    [
      "チャンスと旅人の手紙は別々の山札で、それぞれ12種類あります。引いたカードをタップしてめくり、内容を確認すると効果が進みます。収入・支出、移動、拘留、修繕費など、文章に書かれた効果が適用されます。全カードの説明はこのガイドの最後に掲載しています。",
      "移動先でも購入・利用料・税などが発生します。修繕費は家の軒数とホテルの数で計算し、ホテルを家5軒とは数えません。",
      "通常のカードは使用後に手元へ残りません。釈放カードだけ保管され、使うまで山札に戻りません。山札が空になると、保管中のカードを除いて補充します。直近の結果は「直近のカードの効果」で読み返せます。",
      "自分が関わる入出金は「確認して次へ」を押すまで待ちます。自分に関係のない相手の入出金は自動で進みます。"
    ]
  ],
  [
    "拘留所・税・休憩のマス",
    [
      "拘留所に普通に止まっただけなら見学で、拘留されません。「拘留所へ」、カードの指示、3連続ゾロ目では拘留されます。拘留中の手番開始時に€50を支払うか、保管した釈放カードを使うと解除できます。",
      "支払わずサイコロでゾロ目を狙うこともできます。成功すると出目だけ移動します。失敗した1・2回目はその手番終了、3回目の失敗では€50を支払ってから出目だけ移動します。資金不足なら先に清算が必要です。",
      "税のマスは表示された金額を銀行へ支払います。自由広場などの休憩マスでは、税金の積立や特別な賞金はありません。"
    ]
  ],
  [
    "資金不足・破産・勝敗",
    [
      "支払う額より所持金が少ないと、支払い待ちになります。手持ちのカードから建物売却や抵当で資金を作ってください。必要額がそろうと支払いが自動で清算されます。支払いを残したままターンを終えることはできません。",
      "建物を売り、抵当に入れても足りない場合だけ「破産して棄権」が使えます。相手への負債なら、残金・建物売却相当額・物件・保管カードを相手に引き継ぎます。銀行への負債なら物件は銀行に戻ります。破産者は以後の手番を飛ばし、最後の1人が勝利します。"
    ]
  ],
  [
    "カード・相手の資産を見る／保存・音",
    [
      "盤面のマスをタップすると、説明・定価・現在の利用料・セット効果を確認できます。小さなマスが押しづらい場合は「全40マスの名前・価格」から検索できます。「場所をくわしく見る」は表示中の場所を切り替えます。",
      "自分の物件と保管カードは「手持ちのカード」へ。相手の名前・所持金のパネルをタップすると、その相手の所有地・建物数・抵当中の物件が見られます。所有地を押すと価格などの詳細を開きます。",
      "CPU対戦はこのブラウザに自動保存します。「CPUと遊ぶ」→「続きから」で再開できます。「新しく始める」は既存の保存を置き換えます。「保存データの管理」内の削除は保存を消す操作です。同じ保存を別タブで同時には開けません。",
      "音は「音 ON」を押したときだけ鳴ります。BGM・効果音の音量や「短い演出」はサウンド・演出設定で変更できます。"
    ]
  ],
  [
    "通信対戦・困ったとき",
    [
      "作成者は好きな4桁の数字を指定して部屋を作ります。空欄なら自動です。使用中の番号は選び直してください。招待リンクから入る人は番号入力不要で、ニックネームを確認して参加します。番号を手入力して入ることもできます。",
      "通信はHTTPSサーバー経由です。ホストが4桁のルーム番号を決めて作成し、友だちは招待リンクから名前を入れて参加するか、同じ4桁を入力します。参加ボタンの下に接続状況を表示します。無料テスト環境のため、運営側のMacと中継が稼働している間のみ利用できます。常時接続を保証する正式サービスではありません。",
      "対戦中は全員が画面を開いたままにしてください。画面ロック・別アプリへの切替の後は同じ画面に戻ると通信を再試行します。ページの再読込・退出後の再参加や通信対戦の保存には未対応です。",
      "操作できないときは、自分の手番か、カード・お会計・交渉が確認待ちでないかを確認してください。押せない物件操作には資金・セット・建物・手番などの条件があります。改善報告には端末・ブラウザ・直前の操作を記載し、個人情報やルーム番号は公開窓口に書かないでください。"
    ]
  ]
];
 para('TheRichの現在のゲーム内ルールです。項目をタップして説明を開いてください。');
 const label=el('label','知りたいことを探す'),search=el('input');search.type='search';search.placeholder='例：抵当・ホテル・鉄道';search.setAttribute('aria-label','遊び方を検索');label.append(search);root.append(label);const topics=[];
 for(const [i,[name,paragraphs]]of sections.entries()){const d=el('details');d.className='guide-topic';d.dataset.guideTopic=String(i);d.append(el('summary',name));for(const text of paragraphs)d.append(el('p',text));if(i===0)d.open=true;root.append(d);topics.push(d);}
 const catalog=el('details');catalog.className='guide-topic';catalog.dataset.guideTopic='cards';catalog.append(el('summary','全24枚のカード：名前と効果'));for(const [type,cards]of Object.entries(CARD_DECKS)){catalog.append(el('h3',type==='chance'?'旅のチャンス（12枚）':'旅人の手紙（12枚）'));for(const card of cards){const a=el('article');a.dataset.guideCard=type+'-'+card.id;a.append(el('h4',card.title),el('p',card.text));catalog.append(a);}}root.append(catalog);topics.push(catalog);
 const empty=el('p','一致する説明がありません。別の言葉で検索してください。');empty.hidden=true;root.append(empty);search.oninput=()=>{const q=search.value.trim().normalize('NFKC').toLowerCase();let found=0;for(const d of topics){d.hidden=!!q&&!d.textContent.normalize('NFKC').toLowerCase().includes(q);d.open=q?!d.hidden:d===topics[0];if(!d.hidden)found++;}empty.hidden=found>0;};
 root.append(link('不具合・改善を報告する','https://github.com/selment1/night-arcade/issues'));

 }
}
export class InfoCenter{
 constructor(getNetwork,onResume){this.getNetwork=getNetwork;const nav=el('nav');nav.className='info-nav';nav.setAttribute('aria-label','ゲームの案内');this.dialog=el('dialog');this.dialog.className='info-dialog';this.dialog.setAttribute('aria-labelledby','info-title');const close=el('button','閉じる');close.className='info-close';close.onclick=()=>this.dialog.close();const body=el('div');body.className='info-content';this.dialog.append(close,body);document.body.append(this.dialog);for(const [key,label] of [['help','遊び方・サポート'],['privacy','プライバシー'],['credits','写真・ライセンス']]){const b=el('button',label);b.id='info-'+key;b.onclick=()=>{content(body,key);this.opener=b;this.dialog.showModal();body.scrollTop=0;close.focus()};nav.append(b)}document.querySelector('footer').prepend(nav);this.dialog.onclose=()=>this.opener?.focus();
 this.exitDialog=el('dialog');this.exitDialog.className='info-dialog exit-dialog';this.exitDialog.setAttribute('aria-labelledby','exit-title');const title=el('h2','対戦を終了しますか？');title.id='exit-title';this.exitText=el('p');const cancel=el('button','対戦に戻る');cancel.id='exit-cancel';cancel.onclick=()=>this.exitDialog.close();const end=el('button','終了して戻る');end.id='exit-confirm';end.onclick=()=>getNetwork().leave();this.exitDialog.append(title,this.exitText,cancel,end);this.exitDialog.onclose=()=>{document.getElementById('leave').focus();onResume()};document.body.append(this.exitDialog);
 }
 leave(){const n=this.getNetwork();if(!n.state||n.state.phase==='over'){n.leave();return;}this.exitText.textContent=n.solo?'進行状況はこのブラウザに自動保存します。「CPUと遊ぶ」から続きを遊べます。':'退出すると全員の通信対戦が中断します。この対戦へ戻ることはできません。';this.exitDialog.showModal();document.getElementById('exit-cancel').focus();if(n.solo)clearTimeout(n.timer);}
}
if(document.getElementById('standalone-info')){const show=()=>content(document.getElementById('standalone-info'),location.hash.slice(1));show();window.addEventListener('hashchange',show);}
