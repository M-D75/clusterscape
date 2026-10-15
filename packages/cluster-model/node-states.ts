import type {Snapshot} from '../contracts';
export const nodeStates=['free','partial','allocated','maintenance','invalid','down','unknown'] as const;
export type NodeState=typeof nodeStates[number];
/** État courant exclusif : les mesures inconnues ne changent pas l'état d'allocation. */
export function currentNodeState(s:Snapshot,id:string):NodeState{
 const n=s.state.nodes.find(n=>n.id===id);if(!n)return'unknown';
 if(n.status==='invalid')return'invalid';
 if(n.status==='down'||n.responding===false)return'down';
 if(n.status==='maintenance')return'maintenance';
 if(n.status!=='ready')return'unknown';
 const cpus=s.state.jobs.flatMap(j=>j.allocations).filter(a=>a.nodeId===id).reduce((v,a)=>v+a.cpus,0);
 return cpus<=0?'free':cpus<n.cpus?'partial':'allocated';
}
export function countNodeStates(s:Snapshot,partition='all'){
 const counts=Object.fromEntries(nodeStates.map(k=>[k,0])) as Record<NodeState,number>;
 const nodes=new Map(s.state.nodes.filter(n=>n.kind!=='access'&&(partition==='all'||n.partitions.includes(partition))).map(n=>[n.id,n]));
 for(const id of nodes.keys())counts[currentNodeState(s,id)]++;
 return{total:nodes.size,counts};
}
