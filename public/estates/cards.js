// Original travel events. Separate finite decks; not an official licensed card list.
const card=(id,title,text,effect)=>({id,title,text,...effect});
export const CARD_DECKS={
 chance:[
  card('photo','旅の写真が入賞','写真コンテストの賞金 €100 を受け取る。',{kind:'income',amount:100}),
  card('ticket','交通券を追加購入','旅程変更の費用 €50 を支払う。',{kind:'payment',amount:50}),
  card('departure','新しい旅の始まり','出発点へ進み、€200 を受け取る。',{kind:'destination',target:0}),
  card('detention','渡航書類の確認','出発点の収入を受け取らず、拘留所へ移動する。',{kind:'jail'}),
  card('escape','案内人の助け','脱出カードを保管。拘留中、自分の手番の最初に使える。',{kind:'escape'}),
  card('conservation','景観保全への協力','保全協力金 €100 を支払う。',{kind:'payment',amount:100}),
  card('detour','忘れ物を取りに','3マス戻る。到着したマスの購入・利用料・効果を適用する。',{kind:'back',steps:3}),
  card('guide','ガイドのお手伝い','お礼として €50 を受け取る。',{kind:'income',amount:50}),
  card('rail','次の鉄道駅へ','次の鉄道駅へ進む。出発点通過なら €200、通常の購入・利用料を適用。',{kind:'nearest',space:'station'}),
  card('paris','パリへの招待','パリのセーヌ河岸へ進む。通常の購入・利用料を適用する。',{kind:'destination',target:39}),
  card('repairs','施設の一斉点検','所有する家1軒につき €25、ホテル1軒につき €100 を支払う。',{kind:'repairs',house:25,hotel:100}),
  card('grant','旅の奨励金','文化交流の活動費 €150 を受け取る。',{kind:'income',amount:150})
 ],
 chest:[
  card('refund','旅先からの返金','予約の精算で €100 が返金された。',{kind:'income',amount:100}),
  card('luggage','荷物の修理','壊れたスーツケースの修理費 €50 を支払う。',{kind:'payment',amount:50}),
  card('departure','次の旅への手紙','出発点へ進み、€200 を受け取る。',{kind:'destination',target:0}),
  card('detention','手続きのお知らせ','出発点の収入を受け取らず、拘留所へ移動する。',{kind:'jail'}),
  card('escape','仲間からの紹介状','脱出カードを保管。拘留中、自分の手番の最初に使える。',{kind:'escape'}),
  card('archive','資料の寄付','文化資料の保存に €100 を支払う。',{kind:'payment',amount:100}),
  card('scholarship','文化研究の助成','研究助成金 €200 を受け取る。',{kind:'income',amount:200}),
  card('postcard','旅の記録への謝礼','紀行文の掲載料 €50 を受け取る。',{kind:'income',amount:50}),
  card('doctor','旅先の診療費','診察と薬の費用 €100 を支払う。',{kind:'payment',amount:100}),
  card('maintenance','施設の修繕通知','所有する家1軒につき €40、ホテル1軒につき €115 を支払う。',{kind:'repairs',house:40,hotel:115}),
  card('heritage','保全活動へのお礼','ボランティア活動への謝礼 €25 を受け取る。',{kind:'income',amount:25}),
  card('souvenir','忘れていた預り金','預り金 €20 が戻ってきた。',{kind:'income',amount:20})
 ]
};
