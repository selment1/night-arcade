import {SOLO_SAVE_KEY,readSoloSave,createSoloSave,writeSoloSave} from './solo-save.js?v=resume-1';
import {InfoCenter} from './about.js?v=resume-1';
import {TradePanel} from './trade-view.js?v=trade-1';
import {BOARD,act} from './engine.js?v=trade-1';
import {EstateNetwork} from './network.js?v=trade-1';
import {EstateSolo} from './solo.js?v=review-1';
import {JourneyEffects} from './effects.js?v=resume-1';
import {JourneyAudio} from './audio.js?v=immersive-1';
import {renderDestination} from './photo-view.js?v=review-1';
import {DeedCollection,rentLabel} from './deeds.js?v=deeds-1';
const $=id=>document.getElementById(id), colors=['#df765e','#5488c4','#aa77ba','#c79e33'], eur=n=>'€'+Number(n).toLocaleString('ja-JP');
let selected=0,lastPosition='',auctionControls=null,inspectionPinned=false;
function inspectSpace(id,selector){selected=id;inspectionPinned=true;render();portfolio.open(selector);}
const portfolio=new DeedCollection(inspectSpace);const trades=new TradePanel(action=>dispatch(action));
const selectionBar=document.createElement('div');selectionBar.className='board-selection';const selectionName=document.createElement('strong');selectionName.id='selected-space-name';const backToToken=document.createElement('button');backToToken.type='button';backToToken.textContent='現在地へ';backToToken.onclick=()=>{inspectionPinned=false;lastPosition='';render();};selectionBar.append(selectionName,backToToken);document.getElementById('board-viewport').after(selectionBar);
const sound=new JourneyAudio();sound.mount();const effects=new JourneyEffects({sound,board:BOARD,viewer:()=>net.id,onAcknowledged:()=>persistSolo()});effects.onReady=()=>{render();if(net.solo)net.schedule();};let pendingRollTimer;
function dispatch(action){
 if(effects.busy||net.halted)return;
 if(action.type==='roll'){if(!effects.startRoll())return;if(!effects.short)document.querySelector('.board-section').scrollIntoView({block:'center',behavior:'instant'});document.querySelectorAll('#actions button').forEach(b=>b.disabled=true);clearTimeout(pendingRollTimer);pendingRollTimer=setTimeout(()=>{effects.cancelPending();render();},6000);}
 net.action(action);
}
let net=new EstateNetwork(render);window.estateNetwork=net;const info=new InfoCenter(()=>net,()=>{if(net.solo)net.schedule();});
document.addEventListener('visibilitychange',()=>{if(net.solo){if(document.hidden)clearTimeout(net.timer);else net.schedule();}});
const param=new URLSearchParams(location.search).get('room');if(param)$('code').value=param;
function button(label,fn,parent,disabled=false){const b=document.createElement('button');b.textContent=label;b.setAttribute('aria-label',label);b.disabled=disabled;b.onclick=fn;parent.append(b);return b;}
async function connect(join){$('solo').disabled=$('create').disabled=$('join').disabled=true;try{await net.open(join?$('code').value:null,$('nickname').value);}catch(e){net.fail(e.message);net.peer?.destroy();$('solo').disabled=$('create').disabled=$('join').disabled=false;}}
let soloLease=false,soloOpening=false,soloRecord=null,soloStarting=false,soloSaveFailed=false;
function persistSolo(){
 if(!net.solo||!soloLease||soloStarting||soloSaveFailed||!soloRecord||!effects.acknowledgedState)return;
 // Rendering an unchanged revision must not rewrite the saved game.
 if(soloRecord.state?.revision===net.state.revision&&soloRecord.presentationState?.revision===effects.acknowledgedState.revision)return;
 try{const value=createSoloSave({...soloRecord,saveRevision:soloRecord.saveRevision+1,state:net.state,presentationState:effects.acknowledgedState});const result=writeSoloSave(localStorage,value);if(!result.ok)throw Error(result.error);soloRecord=value;}
 catch{soloSaveFailed=true;net.halted=true;clearTimeout(net.timer);net.status='保存できませんでした。これ以上進めず、ブラウザの保存設定を確認してください。';$('status').textContent=net.status;}
}
function startSolo(saved,replace=false){
 const candidate=new EstateSolo(render,$('nickname').value,Number($('cpu-count').value));
 if(replace){const value=createSoloSave({gameId:crypto.randomUUID(),saveRevision:1,state:candidate.state,presentationState:candidate.state});localStorage.setItem(SOLO_SAVE_KEY,JSON.stringify(value));saved=value;}
 soloStarting=true;effects.reset();net=candidate;window.estateNetwork=net;
 if(saved){net.state=saved.state;net.members=saved.state.players.map(p=>({id:p.id,name:p.name,connected:true}));}
 soloRecord=saved||{gameId:crypto.randomUUID(),saveRevision:0};soloSaveFailed=false;
 net.presentationDelay=()=>Math.max(0,effects.busyUntil-Date.now());net.presentationBlocked=()=>effects.busy||info.exitDialog.open||soloSaveFailed;
 effects.observe(saved&&saved.presentationState.revision<saved.state.revision?saved.presentationState:net.state);soloStarting=false;lastPosition='';inspectionPinned=false;net.emit();
}
function soloChoices(result){
 const dialog=document.createElement('dialog');dialog.className='info-dialog';dialog.id='solo-resume';const title=document.createElement('h2');title.textContent=result.ok?'保存した旅があります':'保存データを読み込めません';const note=document.createElement('p');note.textContent=result.ok?'続きを遊ぶか、保存した旅を置き換えて新しく始めます。':'元のデータは変更していません。破損・非対応の保存を削除する場合だけ「保存を削除」を選んでください。';dialog.append(title,note);
 const close=()=>{dialog.close();dialog.remove();};dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 if(result.ok){button('続きから',()=>{close();startSolo(result.value)},dialog).id='solo-continue';button('新しく始める（保存を置換）',()=>{try{startSolo(null,true);close();}catch{note.textContent='新しい旅を保存できませんでした。元の保存を維持します。';}},dialog).id='solo-new';}
 button('保存を削除',()=>{try{localStorage.removeItem(SOLO_SAVE_KEY);close();$('status').textContent='保存を削除しました。CPUと遊ぶから新しく始められます。';}catch{note.textContent='保存を削除できませんでした。';}},dialog).id='solo-discard';const back=button('戻る',close,dialog);(result.ok?dialog.querySelector('#solo-continue'):back).autofocus=true;document.body.append(dialog);dialog.showModal();
}
$('solo').onclick=async()=>{
 if(soloOpening)return;soloOpening=true;
 try{
 if(!soloLease){if(!navigator.locks){$('status').textContent='このブラウザでは安全な1人プレイ保存を利用できません。';return;}
 const acquired=await new Promise((resolve,reject)=>{navigator.locks.request('night-arcade.estates.solo.writer',{mode:'exclusive',ifAvailable:true},lock=>{if(!lock){resolve(false);return;}soloLease=true;resolve(true);return new Promise(()=>{});}).catch(reject);});
 if(!acquired){$('status').textContent='別のタブで1人プレイを開いています。そのタブを閉じてから再度お試しください。';return;}}
 const result=readSoloSave(localStorage);if(!result.ok||result.value)soloChoices(result);else startSolo(null);
 }catch{$('status').textContent='保存データを読み込めませんでした。元のデータは変更していません。';}finally{soloOpening=false;}
};
$('tile-select').onchange=()=>{selected=Number($('tile-select').value);inspectionPinned=true;render();};
$('create').onclick=()=>connect(false);$('join').onclick=()=>{if(!/^[A-Fa-f0-9]{10}$/.test($('code').value.trim())){net.fail('10文字のルームコードを入力してください');return;}connect(true);};$('start').onclick=()=>net.start();$('leave').onclick=()=>info.leave();
$('share').onclick=async()=>{const url=$('share-url').value;try{if(navigator.share)await navigator.share({title:'世界遺産トラベル',url});else{await navigator.clipboard.writeText(url);net.fail('招待リンクをコピーしました');}}catch{$('share-url').focus();$('share-url').select();net.fail('上のリンクを長押ししてコピーしてください');}};
function coordinates(i){if(i<=10)return[11-i,11];if(i<=20)return[1,21-i];if(i<=30)return[i-19,1];return[11,i-29];}
function render(){
 $('status').textContent=net.status;const joined=net.members.some(m=>m.id===net.id);$('entry').hidden=joined;if(!joined&&net.status!=='通信を接続中…')$('solo').disabled=$('create').disabled=$('join').disabled=false;$('lobby').hidden=!joined||!!net.state;$('game').hidden=!net.state;$('leave').hidden=!joined;
 $('room').textContent=net.room;$('share-url').value=location.origin+location.pathname+'?room='+net.room;$('members').replaceChildren();net.members.forEach(m=>{const li=document.createElement('li');li.textContent=m.name+(m.id===net.id?'（あなた）':'')+(m.connected?'':'（退出）');$('members').append(li);});$('start').hidden=!net.host;$('start').disabled=net.members.length<2;
 if(!net.state){effects.reset();return;}effects.observe(net.state);persistSolo();const s=effects.displayState||net.state;const me=s.players.find(p=>p.id===net.id),current=s.players[s.turn],mine=current.id===net.id;
 const focus=current.id+':'+current.position,moved=focus!==lastPosition;if(moved){lastPosition=focus;if(!inspectionPinned)selected=current.position;} $('players').replaceChildren();s.players.forEach((p,i)=>{const box=document.createElement('div');box.dataset.playerId=p.id;box.className='player'+(i===s.turn?' active':'');box.style.setProperty('--player',colors[i]);const name=document.createElement('span');name.textContent=p.name+(p.id===net.id?' • あなた':'')+(p.bankrupt?' • 破産':'');const money=document.createElement('strong');money.textContent=eur(p.money);const detail=document.createElement('small');detail.textContent='所有 '+Object.values(s.properties).filter(v=>v.owner===p.id).length+'か所'+(p.jail?' / 拘留中':'');box.append(name,money,detail);$('players').append(box);});
 $('board').replaceChildren();BOARD.forEach((tile,i)=>{const b=document.createElement('button');b.dataset.tileId=i;b.dataset.type=tile.type;b.className='tile'+((i>10&&i<20)||(i>30&&i<40)?' side-tile':'')+(i===selected?' selected':'');const [col,row]=coordinates(i);b.style.gridColumn=col;b.style.gridRow=row;b.style.setProperty('--group',tile.color||'#cdd8bf');b.setAttribute('aria-label',i+': '+tile.name);const name=document.createElement('span');name.className='tile-name';name.textContent=tile.name;const tokens=document.createElement('div');tokens.className='tokens';s.players.forEach((p,j)=>{if(p.position===i&&!p.bankrupt){const dot=document.createElement('span');dot.className='token';dot.dataset.playerId=p.id;dot.style.setProperty('--player',colors[j]);dot.title=p.name;tokens.append(dot);}});b.append(name,tokens);const houses=tile.type==='property'?s.properties[i]?.houses||0:0;if(houses){const marker=document.createElement('span');marker.className='building-marker'+(houses===5?' hotel':'');marker.setAttribute('aria-hidden','true');marker.textContent=houses===5?'H':'⌂'+houses;b.append(marker);b.classList.add('built');b.dataset.buildings=houses;b.setAttribute('aria-label',i+': '+tile.name+' · '+(houses===5?'ホテル1軒':'家'+houses+'軒'));}const owner=s.players.findIndex(p=>p.id===s.properties[i]?.owner);if(owner>=0){b.classList.add('owned');b.style.setProperty('--owner',colors[owner]);}b.title=b.getAttribute('aria-label');b.onclick=()=>inspectSpace(i,`[data-tile-id="${i}"]`);$('board').append(b);});
 $('turn-label').textContent=current.name+'の番';const phases={roll:'サイコロを振ろう',buy:'この場所を購入しますか？',auction:'競売中',end:'次の旅人へ',debt:'支払い資金が不足しています',trade:'物件の交渉中',over:'旅の終わり'};const waitingPhases={roll:'相手のサイコロを待っています',buy:'相手の購入判断を待っています',end:'相手のターン終了を待っています',debt:'相手の支払い対応を待っています'};$('phase').textContent=(!mine&&waitingPhases[s.phase])||phases[s.phase]||s.phase;$('current').textContent=s.phase==='over'?'勝者: '+(s.players.find(p=>p.id===s.winner)?.name||'引き分け'):current.name+' · '+BOARD[current.position].name+(mine?'（あなたの番）':'');
 const actions=$('actions');if(s.phase!=='auction'||auctionControls?.property!==s.auction.property){actions.replaceChildren();auctionControls=null;}const send=(label,type,disabled=false)=>button(label,()=>dispatch({type}),actions,disabled);
 const eligibleSend=(label,type)=>{const preview=act(s,net.id,{type},()=>0),control=send(label,type,!preview.ok);if(!preview.ok)control.title=preview.error;return control;};
 if(s.phase==='roll'){send('サイコロを振る','roll',!mine||effects.pending).classList.add('roll-action');if(me.jail){eligibleSend('€50で釈放','payJail');if(me.cards)eligibleSend('釈放カードを使う','useCard');}}
 if(s.phase==='buy'){const tile=BOARD[s.pending.property];const target=document.createElement('div');target.className='purchase-target';const heading=document.createElement('strong');heading.textContent='購入する土地：'+tile.name;const inspect=button('この土地の写真・料金を見る',()=>inspectSpace(tile.id,'#purchase-inspect'),target);inspect.id='purchase-inspect';target.prepend(heading);actions.append(target);const preview=document.createElement('p');preview.className='decision-preview';preview.textContent=(mine?'購入後の手持ち: '+eur(me.money-tile.price)+' / ':'')+'購入価格 '+eur(tile.price)+'。見送ると全員参加の競売になります。';actions.append(preview);eligibleSend('購入 '+eur(tile.price),'buy');send('見送る → 競売','decline',!mine);}
 if(s.phase==='auction'){
  const a=s.auction;
  // Keep the actual input mounted: CPU/peer updates must not dismiss a mobile keyboard.
  if(!auctionControls){
   const info=document.createElement('p'),amount=document.createElement('input');amount.type='number';amount.step='1';amount.className='bid-input';amount.setAttribute('aria-label','入札額（ユーロ）');actions.append(info,amount);
   const controls={property:a.property,info,amount,dirty:false};amount.oninput=()=>{controls.dirty=true;};
   controls.bid=button('€ 入札',()=>dispatch({type:'bid',amount:Number(amount.value)}),actions);controls.pass=send('入札をやめる','pass');auctionControls=controls;
  }
  const controls=auctionControls;controls.info.textContent=BOARD[a.property].name+' / 最高入札 '+eur(a.highestBid);controls.amount.min=String(a.highestBid+1);if(!controls.dirty)controls.amount.value=String(a.highestBid+10);
  const active=a.active.includes(net.id),leading=a.highestBidder===net.id;
  controls.bid.disabled=controls.pass.disabled=controls.amount.disabled=!active||leading;
  controls.info.textContent+=!active?' / この競売から辞退しました。落札結果を待っています。':leading?' / あなたが最高入札者です。他の参加者を待っています。':'';
 }
 if(s.phase==='trade'&&s.trade?.to===net.id){
  const notice=document.createElement('p');notice.textContent='あなたに交換の提案が届きました。内容を確認して返答してください。';notice.setAttribute('role','status');actions.append(notice);
  button('届いた交換の提案を見る',()=>{trades.root.open=true;trades.summary.focus({preventScroll:true});trades.root.scrollIntoView({block:'start',behavior:'instant'});},actions);
 }
 if(s.phase==='end')send('ターンを終了','end',!mine);
 if(s.phase==='debt'){const p=document.createElement('p');p.textContent='必要な支払い: '+eur(s.pending.amount)+'。所有地を選び、売却や抵当を使えます。';actions.append(p);const bankruptcy=eligibleSend('破産して棄権','bankrupt');if(mine&&bankruptcy.disabled)p.textContent+=' '+bankruptcy.title+'。';}
 $('tile-select').replaceChildren();for(const item of BOARD){const option=document.createElement('option');option.value=item.id;option.textContent=item.name;option.selected=item.id===selected;$('tile-select').append(option);}
 const tile=BOARD[selected],prop=s.properties[selected],owner=s.players.find(p=>p.id===prop?.owner);renderDestination(tile,prop,owner,s);selectionName.textContent=tile.name+(tile.price?' · 定価 '+eur(tile.price):'')+(prop?.houses?' · '+(prop.houses===5?'ホテル1軒':'家'+prop.houses+'軒'):'');portfolio.update(s,net.id);$('detail').textContent=tile.name+(tile.price?' · 購入 '+eur(tile.price):'')+'\n'+(owner?'所有者: '+owner.name+' / 建物 '+prop.houses+(prop.mortgaged?' / 抵当中':''):tile.price?'未所有':'購入できないマス')+(tile.rent?'\n利用料 '+rentLabel(tile,s):'');let collection=$('collection-progress');if(!collection){collection=document.createElement('div');collection.id='collection-progress';collection.className='collection-progress';$('detail').after(collection);}collection.replaceChildren();if(tile.group){const group=BOARD.filter(t=>t.group===tile.group),owned=group.filter(t=>s.properties[t.id]?.owner===net.id).length;const label=document.createElement('p');label.textContent=`この色のコレクション：${owned} / ${group.length}か所`+(owned===group.length?' — 全部そろいました！':' — あと'+(group.length-owned)+'か所');const progress=document.createElement('progress');progress.max=group.length;progress.value=owned;progress.setAttribute('aria-label','この色の所有地');collection.style.setProperty('--collection-color',tile.color);const hint=document.createElement('p');hint.textContent='同じ色をそろえると更地家賃が2倍。抵当を解除して均等に建築できます。建築費 '+eur(tile.houseCost)+' / 軒。';collection.append(label,progress,hint);}const pa=$('property-actions');pa.replaceChildren();if(prop?.owner===net.id&&!me.bankrupt&&s.phase!=='over')for(const [type,label] of [['build','建築'],['sell','建物を売る'],['mortgage','抵当に入れる'],['redeem','抵当を解除']]){
  // The reducer is immutable: preview legality without spending money or real RNG.
  const preview=act(s,net.id,{type,property:selected},()=>0);
  const control=button(label,()=>dispatch({type,property:selected}),pa,!preview.ok);
  if(!preview.ok)control.title=preview.error;
 }
 if(net.halted){$('phase').textContent=net.solo?'保存できないため対戦中断':'通信切断により対戦中断';document.querySelectorAll('#actions button,#property-actions button').forEach(b=>b.disabled=true);}
 $('last-card-result').hidden=!s.lastCard;if(s.lastCard)$('last-card-result').querySelector('p').textContent=(s.lastCard.type==='chest'?'手紙：':'チャンス：')+s.lastCard.title+' — '+s.lastCard.text;if(effects.busy){document.querySelectorAll('#actions button,#property-actions button').forEach(b=>b.disabled=true);$('phase').textContent=effects.holding?'カード・お会計を確認してください':'出目と到着先を確認中…';}
 trades.update(s,net.id,effects.busy||net.halted);
 $('log').replaceChildren();s.log.slice(-12).reverse().forEach(item=>{const li=document.createElement('li');li.textContent=item;$('log').append(li);});
}
render();
