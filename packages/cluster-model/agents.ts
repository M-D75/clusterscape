import type{Snapshot}from'../contracts';
import type{Job}from'./jobs';
const order=(a:string,b:string)=>a.localeCompare(b,'fr',{numeric:true});
export function occurrence(s:Snapshot,j:Job){return JSON.stringify([s.cluster.id,s.stream.epoch,j.id,j.submittedAt??null]);}
export function userBadge(user:string){let h=2166136261;for(const c of user){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}h>>>=0;const colors=['#94c7cc','#b9d3a4','#8ab4db','#ce9eac','#c3cbd4','#c7cd9a'];const shapes=['●','◆','▲','■','⬟','✚'];return{color:colors[h%colors.length],shape:shapes[(h>>>8)%shapes.length],sides:[16,4,3,4,5,8][(h>>>8)%6],rotation:(h>>>8)%6===3?Math.PI/4:0};}
export function waitingSummary(s:Snapshot,partition:string){const jobs=s.state.jobs.filter(j=>j.partition===partition&&j.status==='queued');return{jobs:jobs.length,users:new Set(jobs.map(j=>j.user)).size};}
export function waitingUsers(s:Snapshot,partition:string,query=''){
 const q=query.trim().toLocaleLowerCase('fr');const users=new Map<string,Job[]>();
 for(const j of s.state.jobs.filter(j=>j.partition===partition&&j.status==='queued'&&(!q||[j.user,j.id,j.name].some(v=>v.toLocaleLowerCase('fr').includes(q))))){users.set(j.user,[...(users.get(j.user)??[]),j]);}
 return [...users].sort(([a],[b])=>order(a,b)).map(([user,jobs])=>({user,jobs:jobs.sort((a,b)=>order(a.id,b.id))}));
}
export function sameUserJobs(s:Snapshot,id:string){const j=s.state.jobs.find(j=>j.id===id);return j?s.state.jobs.filter(other=>other.id!==id&&other.user===j.user).sort((a,b)=>order(a.id,b.id)):[];}
export function sameUserNodes(s:Snapshot,id:string){return [...new Set(sameUserJobs(s,id).filter(j=>j.status==='running').flatMap(j=>j.allocations.map(a=>a.nodeId)))];}
export type AgentInstance={key:string;occurrence:string;jobId:string;nodeId:string;user:string;slot:number};
export function visibleAgents(s:Snapshot,partition:string,limit=18,perNode=2,focused:string|null=null,related=false){
 const chosen=s.state.jobs.find(j=>j.id===focused),eligible=s.state.jobs.filter(j=>j.status==='running'&&(partition==='all'||j.partition===partition||j.id===focused||(related&&j.user===chosen?.user))).sort((a,b)=>Number(b.id===focused)-Number(a.id===focused)||Number(related&&b.user===chosen?.user)-Number(related&&a.user===chosen?.user)||order(a.id,b.id));
 const all=eligible.flatMap(j=>j.allocations.map(a=>({key:JSON.stringify([occurrence(s,j),a.nodeId]),occurrence:occurrence(s,j),jobId:j.id,nodeId:a.nodeId,user:j.user,slot:0}))),instances:AgentInstance[]=[],byNode=new Map<string,number>(),hidden=new Map<string,Set<string>>();
 for(const a of all){const slot=byNode.get(a.nodeId)??0;if(instances.length<Math.max(0,limit)&&slot<perNode){instances.push({...a,slot});byNode.set(a.nodeId,slot+1);}else{const set=hidden.get(a.nodeId)??new Set();set.add(a.occurrence);hidden.set(a.nodeId,set);}}
 return{instances,hidden:[...hidden].map(([nodeId,jobs])=>({nodeId,jobs:jobs.size})),totalJobs:eligible.length,totalInstances:all.length,visibleJobs:new Set(instances.map(a=>a.occurrence)).size};
}
/** Last accepted observation only: no event history and no replay after a sequence gap. */
export class AgentTransitions{
 private previous:Snapshot|null=null;private progress=new Map<string,number>();
 observe(s:Snapshot){if(this.previous?.cluster.id===s.cluster.id&&this.previous.stream.epoch===s.stream.epoch&&this.previous.sequence===s.sequence)return;
  const consecutive=this.previous?.cluster.id===s.cluster.id&&this.previous.stream.epoch===s.stream.epoch&&s.sequence===this.previous.sequence+1,next=new Map<string,number>();
  for(const j of s.state.jobs.filter(j=>j.status==='running')){const key=occurrence(s,j),before=consecutive?this.previous?.state.jobs.find(old=>occurrence(this.previous!,old)===key):undefined;next.set(key,before?.status==='queued'?0:this.progress.get(key)??1);}
  this.progress=next;this.previous=s;
 }
 advance(seconds:number,stale:boolean,reduced:boolean){for(const [key,value]of this.progress)if(reduced)this.progress.set(key,1);else if(!stale)this.progress.set(key,Math.min(1,value+Math.max(0,seconds)/.7));}
 value(key:string){return this.progress.get(key)??1;}
 activeKeys(){return [...this.progress.keys()];}
}
