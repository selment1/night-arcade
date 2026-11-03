import {BOARD} from './board.js?v=expansion-1';
import {tradable} from './trading.js?v=trade-1';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
const euro=n=>'€'+n.toLocaleString('ja-JP');
export class TradePanel{
 constructor(send){this.send=send;this.root=el('details',undefined,'card trade-panel');this.root.id='trade-panel';this.summary=el('summary','物件の交渉');this.body=el('div',undefined,'trade-body');this.root.append(this.summary,this.body);document.getElementById('my-deeds').after(this.root);}
 button(text,fn,parent){const b=el('button',text);b.type='button';b.onclick=()=>{if(!this.blocked)fn()};parent.append(b);return b;}
 update(state,id,blocked){
 // Only carry an unsent proposal within the same player's current decision.
 // Legal property choices are rebuilt below, so mortgaged/lost deeds are pruned.
 const existing=this.body.querySelector('form'),sameDecision=this.id===id&&this.state&&!this.state.trade&&!state.trade&&this.state.turn===state.turn&&this.state.phase===state.phase;
 const draft=existing&&sameDecision?{to:existing.elements['trade-target'].value,give:[...existing.querySelectorAll('[name=give]:checked')].map(n=>Number(n.value)),take:[...existing.querySelectorAll('[name=take]:checked')].map(n=>Number(n.value)),cashDirection:existing.elements['cash-direction'].value,cashValue:existing.elements['trade-cash'].value}:null;
 this.state=state;this.id=id;this.blocked=blocked;const key=JSON.stringify([state.trade,state.phase,state.turn,state.properties,state.players.map(p=>[p.id,p.money,p.bankrupt]),id]);
 if(key!==this.key){this.key=key;this.body.replaceChildren();const t=state.trade;this.summary.textContent=t?'物件の交渉 · '+(t.to===id?'提案が届いています':t.from===id?'返答待ち':'他の旅人が交渉中'):'物件の交渉';
 this.body.append(el('p','物件と差額€を提示し、双方が合意したときだけ交換します。抵当中の物件、同じ色に建物がある物件は対象外です。','note'));
 if(t){this.root.open=true;const name=id=>state.players.find(p=>p.id===id)?.name||'';for(const [owner,ids,cash] of [[t.from,t.give,t.giveCash],[t.to,t.take,t.takeCash]]){const section=el('div',undefined,'trade-terms');section.append(el('strong',name(owner)+' が渡すもの'),el('p',ids.length?ids.map(i=>BOARD[i].name).join(' / '):'物件なし'),el('b',euro(cash)));this.body.append(section);}
 const controls=el('div',undefined,'trade-controls');this.body.append(controls);
 if(t.to===id){this.button('この条件で承諾',()=>this.send({type:'acceptTrade',tradeId:t.id}),controls);this.button('見送る',()=>this.send({type:'rejectTrade',tradeId:t.id}),controls);this.counterButton=this.button('条件を変えて再提案',()=>{controls.remove();this.form({to:t.from,give:t.take,take:t.give,giveCash:t.takeCash,takeCash:t.giveCash},t.id)},controls);}
 else if(t.from===id)this.button('提案を取り下げる',()=>this.send({type:'cancelTrade',tradeId:t.id}),controls);
 else this.body.append(el('p',name(t.from)+' と '+name(t.to)+' の返答を待っています。'));
 }else if(['roll','end'].includes(state.phase)&&state.players[state.turn].id===id&&!state.players.find(p=>p.id===id).bankrupt)this.form(draft);else this.body.append(el('p','自分の手番の開始時、または終了前に交渉できます。購入・競売・支払いは先に解決してください。'));
 }
 this.root.querySelectorAll('button,input,select').forEach(n=>n.disabled=!!blocked);
 }
 form(draft=null,tradeId=null){
 const s=this.state,me=this.id,form=el('form',undefined,'trade-form'),opponents=s.players.filter(p=>p.id!==me&&!p.bankrupt),label=el('label','交渉相手'),target=el('select');target.name='trade-target';for(const p of opponents){const o=el('option',p.name);o.value=p.id;target.append(o)}target.value=opponents.some(p=>p.id===draft?.to)?draft.to:opponents[0]?.id||'';if(tradeId)target.setAttribute('aria-readonly','true');label.append(target);form.append(label);
 const lists=el('div',undefined,'trade-lists');form.append(lists);const draw=()=>{lists.replaceChildren();for(const [side,owner,title] of [['give',me,'あなたが渡す物件'],['take',target.value,'あなたが受け取る物件']]){const group=el('fieldset');group.append(el('legend',title));const choices=BOARD.filter(b=>tradable(s,b.id,owner));if(!choices.length)group.append(el('p','交渉できる物件はありません','note'));for(const b of choices){const l=el('label'),input=el('input');input.type='checkbox';input.name=side;input.value=b.id;input.checked=!!draft?.[side]?.includes(b.id);l.append(input,el('span',b.name+' · 定価 '+euro(b.price)));group.append(l)}lists.append(group)}};target.onchange=()=>{if(tradeId)target.value=draft.to;draw()};draw();
 const directionLabel=el('label','差額の向き'),direction=el('select');direction.name='cash-direction';for(const [v,t] of [['pay','あなたが支払う'],['receive','あなたが受け取る']]){const o=el('option',t);o.value=v;direction.append(o)}direction.value=draft?.cashDirection||(draft?.takeCash?'receive':'pay');directionLabel.append(direction);const amountLabel=el('label','差額（€・0なら物件のみ）'),amount=el('input');amount.name='trade-cash';amount.type='number';amount.min='0';amount.max='1000000000';amount.step='1';amount.value=draft?.cashValue??(draft?Math.max(draft.giveCash,draft.takeCash):'0');amountLabel.append(amount);form.append(directionLabel,amountLabel);
 const hint=el('p','提案中は手番が止まります。合意するまで所持金・所有地は変わりません。CPUは定価と手持ち資金を基準に判断します。','note');form.append(hint);const submit=el('button',tradeId?'変更した条件を送る':'この条件を提案');submit.type='submit';form.append(submit);form.onsubmit=e=>{e.preventDefault();if(this.blocked)return;const cash=Number(amount.value);this.send({type:tradeId?'counterTrade':'offerTrade',...(tradeId?{tradeId}:{}),to:target.value,give:[...form.querySelectorAll('[name=give]:checked')].map(n=>Number(n.value)),take:[...form.querySelectorAll('[name=take]:checked')].map(n=>Number(n.value)),giveCash:direction.value==='pay'?cash:0,takeCash:direction.value==='receive'?cash:0});};
 if(tradeId)this.button('条件変更をやめる',()=>{this.key=null;this.update(this.state,this.id,this.blocked);this.counterButton?.focus()},form);
 this.body.append(form);
 // Countering removes the focused action; keep keyboard users inside the editor.
 if(tradeId)target.focus();
 }
}
