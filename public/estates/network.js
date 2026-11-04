import {RELAY_URL} from './relay-config.js?v=relay-1';
export const normalizeRoomCode=value=>String(value??'').normalize('NFKC').trim().toUpperCase();
export const validRoomCode=value=>/^\d{4}$/.test(normalizeRoomCode(value));
export class EstateNetwork {
 constructor(update){this.update=update;this.members=[];this.state=null;this.id='';this.room='';this.host=false;this.status='未接続';this.closed=false;this.halted=false;this.busy=false;}
 emit(){this.update(this);}
 fail(message){this.status=message;this.emit();}
 async request(data){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{
   const response=await fetch(RELAY_URL+'/api',{method:'POST',mode:'cors',cache:'no-store',headers:{'Content-Type':'application/json',...(this.token?{Authorization:'Bearer '+this.token}:{})},body:JSON.stringify({...data,room:data.room??this.room}),signal:controller.signal});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'通信に失敗しました');return result;
  }catch(e){if(e instanceof TypeError||e.name==='AbortError')throw new Error('通信サーバーに届きません。回線を確認してお待ちください。テストサーバーが停止中の場合は再開が必要です。');throw e;}finally{clearTimeout(timer);}
 }
 apply(d){if(this.closed)return;if(this.state&&(!d.state||d.state.revision<this.state.revision))return;const signature=JSON.stringify([d.members,d.state?.revision,d.halted,d.status]);if(signature===this.signature&&this.status===d.status)return;this.signature=signature;this.members=d.members;this.state=d.state;this.room=d.room;this.halted=d.halted;this.status=d.status;this.emit();}
 async open(room,name,chosenCode=''){
  clearTimeout(this.timer);this.closed=false;this.state=null;this.signature='';this.token='';this.host=!room;
  const requested=normalizeRoomCode(this.host?chosenCode:room);
  if((requested&&!validRoomCode(requested))||(!this.host&&!requested))throw new Error('ルーム番号は4桁の数字を入力してください。');
  this.status='通信を接続中…';this.emit();
  const d=await this.request({op:this.host?'create':'join',room:requested,name:String(name).trim().slice(0,20)||'旅人'});
  this.id=d.id;this.token=d.token;this.host=d.host;this.apply(d);this.poll();
 }
 async poll(){
  if(this.closed)return;
  try{if(!this.busy)this.apply(await this.request({op:'poll'}));}catch(e){if(!this.closed)this.fail(e.message+' 自動で再接続しています。');}
  if(!this.closed)this.timer=setTimeout(()=>this.poll(),1200);
 }
 async send(op,extra={}){
  if(this.busy||this.closed)return;this.busy=true;
  try{this.apply(await this.request({op,...extra}));}catch(e){this.fail(e.message);}finally{this.busy=false;}
 }
 start(){if(this.host&&!this.state)this.send('start');}
 action(action){if(this.state&&!this.halted)this.send('action',{action,revision:this.state.revision});}
 leave(){this.closed=true;clearTimeout(this.timer);if(this.token)fetch(RELAY_URL+'/api',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+this.token},body:JSON.stringify({op:'leave',room:this.room}),keepalive:true}).catch(()=>{});location.href=location.pathname;}
}
