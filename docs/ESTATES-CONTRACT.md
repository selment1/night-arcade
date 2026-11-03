# World Heritage Estates integration contract

Files under public/estates/. Native modules, no build step. index.html mobile app; engine.js rules; board.js heritage dataset; network.js or app.js manages PeerJS transport. All money displayed in euros (€); 2–4 players. Original appearance, UNESCO property names, Monopoly-style gameplay. Standalone URL /night-arcade/estates/.

Engine exports from engine.js:
- BOARD array 40 {id:number,name,type:'go'|'property'|'station'|'utility'|'chance'|'chest'|'tax'|'jail'|'parking'|'gotojail',group?,color?,price?,rent?:number[],houseCost?,mortgage?,source?:URL}
- createGame(players: Array<{id:string,name:string}>) => state
- act(state,playerId,action,rng=Math.random) => {ok:boolean,state,error?:string}; immutable on rejected operations and ideally clone-on-write on all.
- State shape: {players:[{id,name,money,position,jail:number,bankrupt:boolean,cards:number}],turn:number,phase:'roll'|'buy'|'auction'|'end'|'debt'|'over',properties:{[boardId]:{owner:string|null,houses:number,mortgaged:boolean}},dice:[number,number],doubles:number,log:string[],pending:null|object,auction:null|object,winner:string|null,revision:number}.
- Actions: {type:'roll'}, buy, decline (starts auction), {type:'bid',amount}, pass (auction pass); end; {type:'build',property}, {type:'sell',property}, {type:'mortgage',property}, {type:'redeem',property}; payJail; useCard; bankrupt. Trade optional only if engine owner and UI owner explicitly agree schema; otherwise clearly report not supported. Do not silently claim official full rules.
- pending for buy: {property:number}; debt {amount:number,creditor:string|null,reason:string}; auction {property:number,highestBid:number,highestBidder:string|null,active:string[]}.
- Current active player = players[turn]. Host validates actor and runs rng; guests send actions only, never entire state.

UI state renders using textContent for user nicknames. Currency Intl.NumberFormat with EUR or literal €amount. Host lobby separate from engine: member identity bound to data connection, nickname <=20 chars, max4, cryptographic room code, validation. Serverless WebRTC using vendored PeerJS+free default signaling. Never treat two local tabs/BroadcastChannel as network proof. Verify real PeerJS data channel between isolated Chrome contexts (and live origin) or explicitly report blocked. Surface connection failure, host departure, reconnect statuses; no paid backend/new credentials.
