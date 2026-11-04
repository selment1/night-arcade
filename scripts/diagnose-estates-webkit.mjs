// Read-only connection diagnostic; never logs candidate addresses or room IDs.
import {webkit,chromium} from '@playwright/test';
const base=process.env.BASE_URL||'https://selment1.github.io/night-arcade/estates/';
const browsers=[];try{
 const hostBrowser=await (process.env.CHROME_HOST?chromium:webkit).launch({headless:true,...(process.env.CHROME_HOST?{channel:'chrome'}:{})});browsers.push(hostBrowser);
 const guestBrowser=await webkit.launch({headless:true});browsers.push(guestBrowser);
 const create=async b=>{const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await c.addInitScript(()=>{window.rtcProbe=[];const Native=window.RTCPeerConnection;window.RTCPeerConnection=class extends Native{constructor(...args){super(...args);const record={types:[],errors:[]};window.rtcProbe.push(record);this.addEventListener('icecandidate',e=>{if(e.candidate)record.types.push(e.candidate.type)});this.addEventListener('icecandidateerror',e=>record.errors.push(e.errorCode));this.addEventListener('iceconnectionstatechange',()=>record.ice=this.iceConnectionState);this.addEventListener('connectionstatechange',()=>record.connection=this.connectionState);}};});return c.newPage()};
 const h=await create(hostBrowser),g=await create(guestBrowser);await h.goto(base);await h.waitForFunction(()=>window.estateNetwork);await h.locator('#create').click();await h.waitForFunction(()=>estateNetwork.members.length===1,{},{timeout:30000});const link=await h.locator('#share-url').inputValue();await g.goto(link);await g.waitForFunction(()=>window.estateNetwork);await g.locator('#join').click();let connected=true;try{await g.waitForFunction(()=>estateNetwork.members.length===2,{},{timeout:25000})}catch{connected=false}
 for(const [label,p]of [['host',h],['guest',g]])console.log(label,JSON.stringify(await p.evaluate(()=>({status:estateNetwork.status,probe:rtcProbe,hidden:document.hidden}))));
 console.log({connected,host:process.env.CHROME_HOST?'Chrome':'WebKit',guest:'WebKit'});
}finally{for(const b of browsers)await b.close()}
