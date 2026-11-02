import http from 'node:http';
import {readFile} from 'node:fs/promises';
const allowed = new Set(['index.html','style.css','icon.svg','manifest.webmanifest','games/echo.html','games/prism.html','games/memory.html','games/orbit.html','games/garden.html']);
const types={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',webmanifest:'application/manifest+json'};
http.createServer(async(req,res)=>{let path=new URL(req.url,'http://localhost').pathname.replace(/^\/night-arcade\//,'/').replace(/^\//,'')||'index.html';if(!allowed.has(path)){res.writeHead(404);res.end('Not found');return;}try{const content=await readFile(new URL('public/'+path,import.meta.url));res.writeHead(200,{'Content-Type':types[path.split('.').pop()],'X-Content-Type-Options':'nosniff'});res.end(content);}catch{res.writeHead(404);res.end('Not found');}}).listen(Number(process.env.PORT||4185),process.env.HOST||'127.0.0.1',()=>console.log('Night arcade on port '+(process.env.PORT||4185)));
