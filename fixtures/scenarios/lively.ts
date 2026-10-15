import type{Snapshot}from'../../packages/contracts';
import{source30}from'./source30';
const PERIOD=120,RATE=10,BASE=Date.parse('2026-10-13T12:00:00.000Z'),TERMINALS=160;
type Job=Snapshot['state']['jobs'][number];
type Work={job:Job;arrival:number;duration:number;end:number|null;cpu:number;ram:number};
const hash=(value:string)=>{let h=2166136261;for(const c of value){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const date=(step:number)=>new Date(BASE+step*RATE*1000).toISOString();
export function livelyPhase(step:number){const p=step%PERIOD;return p<8?'Montée progressive':p<28?'Première vague · normal / short / mémoire':p<48?'Résorption des files':p<70?'Deuxième vague · normal / GPU':p<88?'Fin des charges longues':'Accalmie';}
class Engine{
 step=-1;serial=0;work:Work[]=[];template=source30(0,'template');
 constructor(readonly epoch:string){}
 advance(to:number){while(this.step<to){this.step++;const step=this.step,p=step%PERIOD,cycle=Math.floor(step/PERIOD);
  for(const w of this.work)if(w.job.status==='running'&&w.end!==null&&step>=w.end){w.job={...w.job,status:hash(w.job.id)%47===0?'failed':'finished',allocations:[],waitingReason:null};}
  const add=(partition:string,count:number,forcedUser?:number)=>{for(let i=0;i<count;i++){
   const serial=++this.serial,id=`v${cycle+1}-${String(serial).padStart(4,'0')}`,h=hash(id+partition),user=forcedUser??1+h%80;
   let cpus=4,memory=16,gpus=0,nodeCount=1,duration=5,cpu=.8,ram=.8;
   if(partition==='normal'){cpus=[4,6,12,24][h%4];memory=[8,16,24,48][(h>>>3)%4];duration=4+(h>>>5)%8;cpu=h%3===0?1:.7+(h%25)/100;ram=.65+(h%31)/100;if(h%9===0){cpus=6;memory=16;nodeCount=2;}}
   if(partition==='short'){cpus=[2,4,6,12][h%4];memory=[8,16,44,56][(h>>>3)%4];duration=2+(h>>>5)%4;cpu=.55+(h%46)/100;ram=.8+(h%20)/100;}
   if(partition==='long'){cpus=[6,12][h%2];memory=[24,48][(h>>>2)%2];duration=28+h%17;cpu=.8+(h%21)/100;ram=.75;}
   if(partition==='highmem'){cpus=[8,16,32][h%3];memory=[192,320,448][(h>>>3)%3];duration=10+h%9;cpu=.3;ram=.93+(h%7)/100;}
   if(partition==='supermem'){cpus=[4,8,16][h%3];memory=h%2?640:896;duration=12+h%8;cpu=.35;ram=.95;}
   if(partition==='gpu'){gpus=[1,2,4,7][h%4];cpus=[2,4,8,16][h%4];memory=[16,32,64,128][h%4];duration=4+h%7;cpu=.4;ram=.8;}
   if(partition==='global'){cpus=16;memory=96;duration=6;cpu=.7;ram=.75;}
   if(forcedUser===1&&partition==='normal'){cpus=6;memory=16;nodeCount=2;duration=24;}
   if(forcedUser===1&&partition==='short'){cpus=4;memory=12;duration=14;}
   if(forcedUser===1&&partition==='gpu'){gpus=1;cpus=2;memory=16;duration=16;}
   this.work.push({arrival:step,duration,end:null,cpu,ram,job:{id,user:`chercheur-${String(user).padStart(3,'0')}`,name:({normal:'Calcul partagé',short:'Analyse courte',long:'Calcul prolongé',highmem:'Traitement mémoire',supermem:'Assemblage très grande mémoire',gpu:'Lot accéléré',global:'Analyse intermittente'}as Record<string,string>)[partition],partition,status:'queued',submittedAt:date(step),request:{cpus,memory,gpus,nodeCount},allocations:[],waitingReason:'Ressources compatibles en attente (simulation)'}});
  }};
  if(p===0)add('normal',2);if(p===3)add('normal',1,1);if(p===5)add('short',1,1);if(p===8)add('gpu',1,1);if(p===54)add('normal',1,1);if(p===55)add('short',1,1);if(p===56)add('gpu',1,1);
  if(p>=10&&p<=24)add('normal',p%4<2?5:3);if(p>=28&&p<=44&&p%3===1)add('normal',2);if(p>=52&&p<=66)add('normal',2+p%3);if(p>=70&&p<=82&&p%4===2)add('normal',1);
  if(p>=8&&p<=16)add('short',3+p%4);if(p>=42&&p<=50)add('short',2+p%2);if(p>=74&&p<=77)add('short',2);
  if([88,98,108,118].includes(p))add('normal',1);if([92,104,116].includes(p))add('short',1);
  if([5,11,45,68,95].includes(p))add('long',1);if([16,18,20,22,24,57,59,61].includes(p))add('highmem',1);if([15,17,18,19,67,68].includes(p))add('supermem',1);
  if([4,7].includes(p)||p>=12&&p<=18||p>=50&&p<=55)add('gpu',1);if(p===(cycle%2?80:20))add('global',1);
  const free=new Map(this.template.state.nodes.filter(n=>n.status==='ready').map(n=>[n.id,{cpus:n.cpus,memory:n.memory,gpus:n.gpus}]));
  for(const w of this.work.filter(w=>w.job.status==='running'))for(const a of w.job.allocations){const f=free.get(a.nodeId)!;f.cpus-=a.cpus;f.memory-=a.memory;f.gpus-=a.gpus;}
  // Greedy backfill: older jobs are tried first, but a blocked large request does not block compatible small work.
  for(const w of this.work.filter(w=>w.job.status==='queued')){const j=w.job,r=j.request,eligible=this.template.state.nodes.filter(n=>n.status==='ready'&&n.partitions.includes(j.partition));const fit=eligible.filter(n=>{const f=free.get(n.id)!;return f.cpus>=r.cpus&&f.memory>=r.memory&&f.gpus>=r.gpus;}).sort((a,b)=>{const x=free.get(a.id)!,y=free.get(b.id)!;return(x.cpus-r.cpus)-(y.cpus-r.cpus)||a.id.localeCompare(b.id,'en',{numeric:true});});
   if(fit.length>=r.nodeCount){const allocations=fit.slice(0,r.nodeCount).map(n=>({nodeId:n.id,cpus:r.cpus,memory:r.memory,gpus:r.gpus}));for(const a of allocations){const f=free.get(a.nodeId)!;f.cpus-=a.cpus;f.memory-=a.memory;f.gpus-=a.gpus;}w.end=step+w.duration;w.job={...j,status:'running',allocations,waitingReason:null};}
   else{const total=eligible.reduce((a,n)=>{const f=free.get(n.id)!;return{cpus:a.cpus+f.cpus,memory:a.memory+f.memory,gpus:a.gpus+f.gpus};},{cpus:0,memory:0,gpus:0});w.job={...j,waitingReason:r.gpus&&total.gpus<r.gpus*r.nodeCount?'GPU alloués — attente de libération (simulation)':total.memory<r.memory*r.nodeCount?'Mémoire allouée — attente de libération (simulation)':total.cpus<r.cpus*r.nodeCount?'CPU alloués — attente de libération (simulation)':'Capacités compatibles par nœud insuffisantes — fragmentation (simulation)'};}
  }
  const terminal=this.work.filter(w=>w.job.status==='finished'||w.job.status==='failed');if(terminal.length>TERMINALS){const remove=new Set(terminal.slice(0,terminal.length-TERMINALS));this.work=this.work.filter(w=>!remove.has(w));}
 }}
 snapshot(sequence:number):Snapshot{this.advance(sequence);const s=structuredClone(this.template);s.cluster={id:'lively',name:'Profil fourni · activité vivante simulée'};s.stream.epoch=this.epoch;s.sequence=sequence;s.observedAt=new Date().toISOString();s.clock={mode:'simulated',now:date(sequence),rate:RATE,cycleSteps:PERIOD,cycleStep:sequence%PERIOD,phase:livelyPhase(sequence),windowSeconds:PERIOD*RATE};s.topology.users=Array.from({length:100},(_,i)=>`chercheur-${String(i+1).padStart(3,'0')}`);s.state.jobs=this.work.map(w=>structuredClone(w.job));s.state.reservations=[];
  for(const n of s.state.nodes){if(n.status==='invalid'||n.status==='down'){n.usage=null;n.memoryUsed=null;continue;}const active=this.work.filter(w=>w.job.status==='running').flatMap(w=>w.job.allocations.filter(a=>a.nodeId===n.id).map(a=>({a,w})));n.usage=n.id==='node0'&&sequence%PERIOD>=28&&sequence%PERIOD<31?null:Math.min(100,Math.round(active.reduce((v,{a,w})=>v+a.cpus*w.cpu,0)/n.cpus*100));n.memoryUsed=Math.min(n.memory,Math.round(active.reduce((v,{a,w})=>v+a.memory*w.ram,0)*10)/10);}
  return s;
 }
}
const engines=new Map<string,Engine>();
export function lively(sequence:number,epoch:string){let engine=engines.get(epoch);if(!engine||sequence<engine.step){engine=new Engine(epoch);engines.set(epoch,engine);if(engines.size>4)engines.delete(engines.keys().next().value!);}return engine.snapshot(sequence);}
