import{WebSocketServer,type WebSocket}from'ws';
import{scenario}from'../../fixtures/scenarios';import{validate,type Snapshot}from'../../packages/contracts';
const epoch=crypto.randomUUID(),server=new WebSocketServer({host:'127.0.0.1',port:8787}),clients=new Map<WebSocket,string>();let tick=0;
const quiet=(key:string)=>key==='lively'?tick%120>=104&&tick%120<112:tick%60>=44&&tick%60<52;
const cache=new Map<string,{sequence:number;snapshot:Snapshot}>();
function send(ws:WebSocket,key:string){if(quiet(key)){ws.close(1012,'Interruption réseau simulée');return;}if(ws.readyState!==1)return;const sequence=key==='lively'?tick:Math.floor(tick/2);let cached=cache.get(key);if(cached?.sequence!==sequence){cached={sequence,snapshot:validate(scenario(key,sequence,epoch))};cache.set(key,cached);}ws.send(JSON.stringify(cached.snapshot));}
server.on('connection',(ws,req)=>{const requested=new URL(req.url||'/','http://localhost').searchParams.get('scenario'),key=requested&&['lively','atlas','aurora','slurm30'].includes(requested)?requested:'lively';clients.set(ws,key);send(ws,key);ws.on('close',()=>clients.delete(ws));});
setInterval(()=>{tick++;for(const[ws,key]of clients){if(quiet(key)){ws.close(1012,'Interruption réseau simulée');continue;}if(key==='lively'||tick%2===0)send(ws,key);}},1000);
console.log('Simulateur ClusterScape : ws://127.0.0.1:8787 · vivante : 120 s réelles, temps ×10 ; simples : 60 s, temps ×1');
