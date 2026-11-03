import {createGame,act} from './engine.js';
const TYPES=new Set(['roll','buy','decline','bid','pass','end','build','sell','mortgage','redeem','payJail','useCard','bankrupt']);
export class EstateNetwork {
 constructor(update){this.update=update;this.members=[];this.connections=new Map();this.lastSeen=new Map();this.state=null;this.id='';this.room='';this.host=false;this.status='未接続';this.closed=false;}
 emit(){this.update(this);}
 fail(message){this.status=message;this.emit();}
 async open(room,name){
  clearInterval(this.heartbeat);this.peer?.destroy();this.halted=false;
  this.name=(String(name).trim()||'旅人').slice(0,20);this.host=!room;this.closed=false;
  this.room=room?String(room).toUpperCase().replace(/[^A-F0-9]/g,''):Array.from(crypto.getRandomValues(new Uint8Array(5)),n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
  if(this.room.length!==10)throw new Error('ルームコードは10文字です');
  this.status='通信を接続中…';this.emit();
  this.peer=new Peer(this.host?'komore-estates-'+this.room:undefined,{debug:0});
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{this.peer.destroy();reject(new Error('接続がタイムアウトしました。通信環境を確認してください。'));},20000);
   this.peer.once('open',id=>{clearTimeout(timer);this.id=id;resolve();});
   this.peer.once('error',e=>{clearTimeout(timer);reject(new Error('通信サーバーに接続できません: '+e.type));});
  });
  window.addEventListener('pagehide',()=>this.peer.destroy(),{once:true});
  this.heartbeat=setInterval(()=>{if(this.closed)return;if(this.host){for(const [id,c] of this.connections){if(Date.now()-(this.lastSeen.get(id)||0)>18000)c.close();else if(c.open)c.send({type:'ping'});}}else if(this.connection?.open&&this.lastPing&&Date.now()-this.lastPing>22000){this.halted=true;this.connection.close();}},3000);
  this.peer.on('error',e=>this.fail('通信エラー: '+e.type));
  this.peer.on('disconnected',()=>{if(!this.closed){this.status='接続サーバーとの通信が切れました。既存の対戦は継続できます。';this.emit();}});
  if(this.host){this.members=[{id:this.id,name:this.name,connected:true}];this.status='友だちの参加を待っています';this.peer.on('connection',c=>this.accept(c));this.broadcast();}
  else {this.connection=this.peer.connect('komore-estates-'+this.room,{reliable:true,serialization:'json'});const c=this.connection;let accepted=false;const timer=setTimeout(()=>{if(!accepted){c.close();this.fail('参加できませんでした。コードとホストの接続を確認してください。');}},20000);c.on('open',()=>c.send({type:'join',name:this.name}));c.on('data',d=>{if(!d||typeof d!=='object')return;if(d.type==='ping'){this.lastPing=Date.now();if(c.open)c.send({type:'pong'});return;}if(d.type==='snapshot'){accepted=true;clearTimeout(timer);this.members=d.members;this.state=d.state;this.status=d.status;this.halted=d.halted;this.emit();}else if(d.type==='error'){clearTimeout(timer);this.fail(d.message);} });c.on('close',()=>{clearTimeout(timer);this.halted=true;this.fail('ホストとの接続が切れました。この対戦は再接続できません。新しいルームを作ってください。');});c.on('error',()=>this.fail('ルームに接続できません。'));}
 }
 accept(c){let joined=false;let last=0,count=0;const timer=setTimeout(()=>{if(!joined)c.close();},15000);
  c.on('data',d=>{if(!d||typeof d!=='object'||JSON.stringify(d).length>2048){c.close();return;}const now=Date.now();if(now-last>1000){last=now;count=0;}if(++count>20){c.close();return;}
   if(d.type==='join'&&!joined){if(this.state||this.members.length>=4||typeof d.name!=='string'||this.connections.has(c.peer)){c.send({type:'error',message:'開始済み、または満員です。'});setTimeout(()=>c.close(),200);return;}joined=true;clearTimeout(timer);this.connections.set(c.peer,c);this.lastSeen.set(c.peer,Date.now());this.members.push({id:c.peer,name:d.name.trim().slice(0,20)||'旅人',connected:true});this.broadcast();}
   else if(joined&&d.type==='pong'){this.lastSeen.set(c.peer,Date.now());}
   else if(joined&&d.type==='action'){this.dispatch(c.peer,d.action,d.revision);}
  });
  c.on('close',()=>{clearTimeout(timer);if(!joined)return;this.connections.delete(c.peer);if(this.state){const member=this.members.find(m=>m.id===c.peer);if(member)member.connected=false;this.halted=true;this.status='参加者が退出したため対戦を中断しました。退出して新しいルームを作ってください。';}else this.members=this.members.filter(m=>m.id!==c.peer);this.broadcast();});c.on('error',()=>{});
 }
 broadcast(){const snapshot={type:'snapshot',members:this.members,state:this.state,status:this.status,halted:!!this.halted};for(const c of this.connections.values())if(c.open)c.send(snapshot);this.emit();}
 start(){if(!this.host||this.state||this.members.length<2)return;this.state=createGame(this.members);this.status='対戦中';this.broadcast();}
 dispatch(id,action,revision){if(!this.host||!this.state||this.halted)return;if(!action||!TYPES.has(action.type)||revision!==this.state.revision){this.error(id,'古い操作です。最新の盤面で操作してください。');return;}const clean={type:action.type};if(['build','sell','mortgage','redeem'].includes(clean.type)){if(!Number.isInteger(action.property)||action.property<0||action.property>39)return;clean.property=action.property;}if(clean.type==='bid'){if(!Number.isSafeInteger(action.amount)||action.amount<1||action.amount>1e9)return;clean.amount=action.amount;}
  const result=act(this.state,id,clean);if(!result.ok){this.error(id,result.error||'今はその操作ができません');return;}this.state=result.state;this.status='対戦中';this.broadcast();
 }
 error(id,message){if(id===this.id)this.fail(message);else this.connections.get(id)?.send({type:'error',message});}
 action(action){if(!this.state||this.halted)return;if(this.host)this.dispatch(this.id,action,this.state.revision);else if(this.connection?.open)this.connection.send({type:'action',action,revision:this.state.revision});}

 leave(){this.closed=true;clearInterval(this.heartbeat);this.peer?.destroy();location.href=location.pathname;}
}
