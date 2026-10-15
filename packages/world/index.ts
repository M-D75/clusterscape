import{rectsOverlap,type ScreenRect}from'./overlays';
export{rectsOverlap,placeAgentBadges,type ScreenRect}from'./overlays';
import type { Snapshot } from '../contracts';
// Un emplacement par identité ; la première appartenance sert uniquement au regroupement visuel.
export function representativePartition(s:Snapshot){return s.topology.partitions.find(p=>p.isDefault)??[...s.topology.partitions].sort((a,b)=>s.state.nodes.filter(n=>n.partitions.includes(b.id)).length-s.state.nodes.filter(n=>n.partitions.includes(a.id)).length)[0];}
export {createWorldPlanner,zonesOverlap} from './fan';
export {fanWorldPlan as worldPlan} from './fan';
import {fanWorldPlan as worldPlan} from './fan';
export function layout(s:Snapshot){return worldPlan(s).positions;}

export function nodeReading(s:Snapshot,id:string){const n=s.state.nodes.find(n=>n.id===id)!;const cpus=s.state.jobs.flatMap(j=>j.allocations).filter(a=>a.nodeId===id).reduce((v,a)=>v+a.cpus,0);const state=n.status==='invalid'?'invalid':n.status==='down'||n.responding===false?'down':n.status==='maintenance'?'maintenance':cpus>0?'occupied':'free';return{cpus,state,symbol:state==='invalid'?'!':state==='down'?'↓':state==='maintenance'?'×':cpus>0?'■':'○',label:state==='invalid'?'Invalide':state==='down'?`Hors service${n.responding===false?' · non répondant':''}`:state==='maintenance'?'Maintenance':cpus>0?cpus<n.cpus?'Prêt · partiellement alloué':'Prêt · alloué':'Prêt · libre'};}

export function semanticLevel(level:number,distance:number){return level===0?(distance<22?1:0):level===1?(distance>25?0:distance<14?2:1):(distance>17?1:2);}

export type LabelCandidate={id:string;x:number;y:number;priority:number};
/** Budget et collisions en pixels ; indépendant du moteur et des mesures. */
export function chooseLabels(candidates:LabelCandidate[],selected:string|null,level:number,width:number,height:number):string[]{
 const limit=level===0?0:Math.min(level===1?3:6,Math.max(1,Math.floor(width/180)));
 const accepted:{id:string;x:number;y:number;w:number;h:number}[]=[];
 for(const c of [...candidates].sort((a,b)=>(a.id===selected?-1:b.id===selected?1:b.priority-a.priority)||a.id.localeCompare(b.id))){const rich=c.id===selected;const w=rich?194:c.priority>=2?116:106,h=rich?138:c.priority>=2?45:27;
 if(level===0&&!rich)continue;if(accepted.length>=Math.max(limit,selected?1:0))break;
 if(c.x-w/2<12||c.x+w/2>width-12||c.y-h/2<12||c.y+h/2>height-12)continue;
 if(accepted.some(a=>Math.abs(a.x-c.x)<(a.w+w)/2+12&&Math.abs(a.y-c.y)<(a.h+h)/2+10))continue;
 accepted.push({...c,w,h});}
 return accepted.map(c=>c.id);
}

export function framingDistance(radius:number,aspect:number,fovDegrees=42){const vertical=fovDegrees*Math.PI/360;const horizontal=Math.atan(Math.tan(vertical)*Math.max(.1,aspect));return Math.max(4,radius)/Math.sin(Math.min(vertical,horizontal))*1.12;}
export function scopeReservations(s:Snapshot,partition:string){return s.state.reservations.filter(r=>partition==='all'||s.state.jobs.find(j=>j.id===r.jobId)?.partition===partition);}

export function projectedFramingDistance(points:{x:number;y:number;z:number}[],aspect:number,fov=42){const tanV=Math.tan(fov*Math.PI/360),tanH=tanV*Math.max(.1,aspect);return Math.max(8,...points.flatMap(p=>[p.z+Math.abs(p.x)/(.88*tanH),p.z+Math.abs(p.y)/(.88*tanV)]));}

/** Compact partition badges: keep every badge inside the canvas and separate in screen pixels. */
export function placeGroupLabels(candidates:{id:string;x:number;y:number}[],width:number,height:number,w=110,h=40,reserved:ScreenRect[]=[]){
 const gap=6,placed:ScreenRect[]=[...reserved],offsets:Record<string,{x:number;y:number}>={};
 for(const c of [...candidates].sort((a,b)=>a.x-b.x||a.id.localeCompare(b.id))){
  const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
  const possible=[];for(let row=-7;row<=7;row++)for(let col=-4;col<=4;col++)possible.push({x:clamp(c.x+col*(w+gap),w/2+8,width-w/2-8),y:clamp(c.y+row*(h+gap),h/2+8,height-h/2-8)});
  possible.sort((a,b)=>(a.x-c.x)**2+(a.y-c.y)**2-((b.x-c.x)**2+(b.y-c.y)**2));
  const p=possible.find(p=>placed.every(a=>!rectsOverlap({...p,w,h},a)));if(!p)continue;placed.push({...p,w,h});offsets[c.id]={x:Math.round(p.x-c.x),y:Math.round(p.y-c.y)};
 }
 return offsets;
}
