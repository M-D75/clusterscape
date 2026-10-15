import type {Snapshot} from '../contracts';
import {fanLayout} from './scene-config';
type Point=[number,number,number];
type Zone={id:string;name:string;nodeIds:string[];x:number;z:number;width:number;depth:number;angle:number;entry:Point;corners:Point[];label:Point};
type GroupMemory={angle:number;radius:number;cols:number;slots:Map<string,number>};
type Memory={groups:Map<string,GroupMemory>;owners:Map<string,string>;signature:string;plan:ReturnType<typeof compute>|null};
const order=(a:string,b:string)=>a.localeCompare(b,'en',{numeric:true});
const radial=(angle:number)=>{const a=fanLayout.backAngle+angle;return [Math.sin(a),Math.cos(a)];};
function zone(id:string,name:string,ids:string[],m:GroupMemory):Zone{
 const [rx,rz]=radial(m.angle),tx=rz,tz=-rx;
 const last=Math.max(...ids.map(id=>m.slots.get(id)!),0),rows=Math.floor(last/m.cols)+1;
 const width=(m.cols-1)*fanLayout.pitch+2*fanLayout.sidePadding,depth=(rows-1)*fanLayout.pitch+fanLayout.frontPadding+fanLayout.rearPadding;
 const entry:Point=[rx*m.radius,0,rz*m.radius],x=entry[0]+rx*depth/2,z=entry[2]+rz*depth/2;
 const corners=[[-1,-1],[1,-1],[1,1],[-1,1],[-1,-1]].map(([u,v])=>[x+tx*u*width/2+rx*v*depth/2,0,z+tz*u*width/2+rz*v*depth/2] as Point);
 return{id,name,nodeIds:ids,x,z,width,depth,angle:m.angle,entry,corners,label:[entry[0],.08,entry[2]]};
}
/** Separating axes for padded oriented rectangles; padding is the path between zones. */
export function zonesOverlap(a:Zone,b:Zone,gap=fanLayout.zoneGap){
 for(const z of [a,b])for(let i=0;i<2;i++){
  const dx=z.corners[i+1][0]-z.corners[i][0],dz=z.corners[i+1][2]-z.corners[i][2],length=Math.hypot(dx,dz),axis=[-dz/length,dx/length];
  const pa=a.corners.slice(0,4).map(p=>p[0]*axis[0]+p[2]*axis[1]),pb=b.corners.slice(0,4).map(p=>p[0]*axis[0]+p[2]*axis[1]);
  if(Math.max(...pa)+gap<=Math.min(...pb)||Math.max(...pb)+gap<=Math.min(...pa))return false;
 }
 return true;
}
function compute(s:Snapshot,memory:Memory){
 const names=new Map(s.topology.partitions.map(p=>[p.id,p.name]));names.set('__access','Accès / hors partition');
 const members=new Map<string,string[]>();
 for(const n of [...s.state.nodes].sort((a,b)=>order(a.id,b.id))){
  const eligible=n.kind==='access'?[]:n.partitions.filter(p=>names.has(p)).sort(order);
  const old=memory.owners.get(n.id),owner=old&&eligible.includes(old)?old:eligible[0]??'__access';memory.owners.set(n.id,owner);
  members.set(owner,[...(members.get(owner)??[]),n.id]);
 }
 const ids=[...members.keys()].sort(order),newIds=ids.filter(id=>!memory.groups.has(id));
 if(!memory.groups.size){
  // Initial opening is shared by physical widths, not by equal partition sectors.
  const widths=ids.map(id=>(Math.min(fanLayout.columns,members.get(id)!.length)-1)*fanLayout.pitch+2*fanLayout.sidePadding+fanLayout.zoneGap);
  const total=widths.reduce((a,b)=>a+b,0),opening=fanLayout.openingDegrees*Math.PI/180;
  const radius=Math.max(fanLayout.innerRadius,total/opening);let cursor=-opening/2;
  ids.forEach((id,i)=>{const span=opening*widths[i]/total;memory.groups.set(id,{angle:cursor+span/2,radius,cols:Math.min(fanLayout.columns,members.get(id)!.length),slots:new Map()});cursor+=span;});
 }else for(const id of newIds){
  // Insert into the largest angular gap without rotating existing anchors.
  const half=fanLayout.openingDegrees*Math.PI/360,angles=[-half,...[...memory.groups.values()].map(g=>g.angle).sort((a,b)=>a-b),half];
  let best=0;for(let i=1;i<angles.length-1;i++)if(angles[i+1]-angles[i]>angles[best+1]-angles[best])best=i;
  memory.groups.set(id,{angle:(angles[best]+angles[best+1])/2,radius:fanLayout.innerRadius,cols:Math.min(fanLayout.columns,members.get(id)!.length),slots:new Map()});
 }
 const changed=new Set<string>();
 for(const id of ids){const g=memory.groups.get(id)!,nodes=members.get(id)!;
  for(const node of nodes)if(!g.slots.has(node)){g.slots.set(node,g.slots.size);changed.add(id);}
 }
 // Retained zones are obstacles. Growth affects the changed zone before any neighbour.
 const zones:Zone[]=ids.filter(id=>!changed.has(id)).map(id=>zone(id,names.get(id)!,members.get(id)!,memory.groups.get(id)!));
 for(const id of ids.filter(id=>changed.has(id))){const g=memory.groups.get(id)!;let z=zone(id,names.get(id)!,members.get(id)!,g);
  while(zones.some(other=>zonesOverlap(z,other))){g.radius+=fanLayout.growthStep;z=zone(id,names.get(id)!,members.get(id)!,g);}
  zones.push(z);
 }
 zones.sort((a,b)=>a.angle-b.angle);
 const positions=zones.flatMap(z=>{const g=memory.groups.get(z.id)!,[rx,rz]=radial(g.angle),tx=rz,tz=-rx;return z.nodeIds.map(id=>{const slot=g.slots.get(id)!,u=((slot%g.cols)-(g.cols-1)/2)*fanLayout.pitch,v=fanLayout.frontPadding+Math.floor(slot/g.cols)*fanLayout.pitch;return{id,position:[z.entry[0]+tx*u+rx*v,0,z.entry[2]+tz*u+rz*v] as Point};});});
 const hub=s.topology.communication?{...s.topology.communication,position:[0,0,0] as Point}:null;
 return{positions,groups:zones,hub,signature:memory.signature};
}
/** A planner owns placement history for one scene session; ticks with unchanged topology reuse the plan. */
export function createWorldPlanner(){
 const memories=new Map<string,Memory>();
 return(s:Snapshot)=>{
  let m=memories.get(s.cluster.id);if(!m){m={groups:new Map(),owners:new Map(),signature:'',plan:null};memories.set(s.cluster.id,m);}
  const signature=JSON.stringify([s.topology.communication,s.topology.partitions.map(p=>[p.id,p.name]).sort((a,b)=>order(a[0],b[0])),s.state.nodes.map(n=>[n.id,n.kind,[...n.partitions].sort(order)]).sort((a,b)=>order(a[0] as string,b[0] as string))]);
  if(signature!==m.signature){m.signature=signature;m.plan=compute(s,m);}return m.plan!;
 };
}
export const fanWorldPlan=createWorldPlanner();
