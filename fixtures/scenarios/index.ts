import{lively}from'./lively';
import{source30}from'./source30';
import {canStart} from '../../packages/cluster-model';
import type { Snapshot } from '../../packages/contracts';
export function scenario(key: string, sequence: number, epoch = "fixture-epoch"): Snapshot {
    if(key==='lively')return lively(sequence,epoch);
    if(key==='slurm30'||key==='cluster31')return source30(sequence,epoch);
    const small = key === 'aurora', tick = sequence % 30;
    const partitions = small ? [{ id: 'science', name: 'Science', limitHours: 6 }, { id: 'image', name: 'Image', limitHours: 12 }] : [{ id: 'short', name: 'Express', limitHours: 2 }, { id: 'normal', name: 'Production', limitHours: 24 }, { id: 'long', name: 'Longue durée', limitHours: 72 }, { id: 'mem', name: 'Grande mémoire', limitHours: 48 }, { id: 'gpu', name: 'Accélération', limitHours: 24 }];
    const nodes: Snapshot['state']['nodes'] = Array.from({ length: small ? 4 : 12 }, (_, i) => { const kind = small ? (i === 3 ? 'gpu' : 'standard') : (i < 8 ? 'standard' : i < 10 ? 'memory' : 'gpu'); return { id: `n${i}`, name: `${small ? 'aurore' : 'atlas'}-${String(i + 1).padStart(2, '0')}`, kind, cpus: kind === 'memory' ? 64 : 32, memory: kind === 'memory' ? 512 : 128, gpus: kind === 'gpu' ? 4 : 0, partitions: small ? (kind === 'gpu' ? ['image'] : ['science']) : (kind === 'standard' ? ['short', 'normal', 'long'] : [kind === 'memory' ? 'mem' : 'gpu']), status: tick >= 14 && tick < 20 && i === 1 ? 'maintenance' : 'ready', usage: tick >= 10 && tick < 15 && i === 0 ? null : 0 }; });
    nodes.push({ id: 'login', name: 'Accès / connexion', kind: 'access', cpus: 0, memory: 0, gpus: 0, partitions: [], status: 'ready', usage: null });
    const users = Array.from({ length: small ? 4 : 12 }, (_, i) => `chercheur-${i + 1}`);
    const jobs: Snapshot['state']['jobs'] = Array.from({ length: small ? 6 : 18 }, (_, i) => { let status: Snapshot['state']['jobs'][number]['status'] = i < (small ? 3 : 8) ? 'running' : i < (small ? 5 : 15) ? 'queued' : i === (small ? 5 : 17) ? 'failed' : 'finished'; if (tick >= 6 && i === 0)
        status = 'finished'; if (tick >= 8 && i === (small ? 3 : 8))
        status = 'running'; if(tick>=12&&i===(small?3:8))status='finished'; if(tick>=20&&i===(small?4:9))status=tick<28?'running':'finished'; if (tick >= 12 && i === 1)
        status = 'finished'; const ni = i === (small ? 4 : 9) ? 1 : i === (small ? 3 : 8) ? 0 : !small && i >= 4 && i < 8 ? i + 4 : i % (small ? 4 : 12); const n = nodes[ni]; const partition = n.partitions[i % n.partitions.length]; const allocations = status === 'running' ? [{ nodeId: n.id, cpus: 8, memory: 32, gpus: n.kind === 'gpu' ? 1 : 0 }] : []; if (i === 2 && status === 'running')
        allocations.push({ nodeId: nodes[small ? 0 : 3].id, cpus: 8, memory: 32, gpus: 0 }); return { id: `t${i + 1}`, submittedAt:new Date(Date.parse('2026-10-13T12:00:00.000Z')+Math.floor(sequence/30)*60000).toISOString(), name: ['Simulation fluide', 'Assemblage génome', 'Transport multi-nœuds', 'Analyse climat'][i % 4], user: users[i % users.length], partition, status, waitingReason:status==='queued'?(i===(small?3:8)?'Créneau réservé pas encore ouvert':i===(small?4:9)?tick>=14?'Nœud cible en maintenance':'Priorité du scénario, démarrage non garanti':'Ressources ou priorité du scheduler'):null, request:{cpus:8,memory:32,gpus:n.kind==='gpu'?1:0,nodeCount:i===2?2:1}, allocations }; });
    for (const n of nodes)
        if (n.usage !== null)
            n.usage = jobs.flatMap(j => j.allocations).some(a => a.nodeId === n.id) ? 45 + (sequence * 7 + Number(n.id.slice(1)) * 11) % 45 : 0;
    for(let i=0;i<nodes.length;i++){const n=nodes[i];const allocated=jobs.flatMap(j=>j.allocations).filter(a=>a.nodeId===n.id).reduce((v,a)=>v+a.memory,0);n.memoryUsed=n.kind==='access'||i===0&&tick>=10&&tick<15?null:Math.min(n.memory,Math.round(n.memory*.06+allocated*(.45+((sequence+i)%7)/20)));}
    const base=Date.parse('2026-10-13T12:00:00.000Z')+Math.floor(sequence/30)*60000;
    const reservations:Snapshot['state']['reservations']=[{id:`r-${Math.floor(sequence/30)}`,jobId:small?'t4':'t9',status:tick<8?'planned':tick<12?'active':'finished',startsAt:new Date(base+16000).toISOString(),endsAt:new Date(base+24000).toISOString(),allocations:[{nodeId:'n0',cpus:8,memory:32,gpus:0}]}];
    const snapshot:Snapshot = { version: 3, clock:{mode:'simulated',now:new Date(base+tick*2000).toISOString(),rate:1}, stream: { epoch }, units: { cpus: 'logical-cpu', memory: 'GiB', gpus: 'device', usage: 'percent-cpu-capacity' }, cluster: { id: key, name: small ? 'Aurore · laboratoire' : 'Atlas · centre de calcul' }, sequence, observedAt: new Date().toISOString(), topology: { partitions, users }, state: { nodes, jobs, reservations } };
    for(const i of [small?3:8,small?4:9]){const j=jobs[i];if(j.status==='running'&&!canStart(snapshot,j.id,j.allocations)){j.status='queued';j.allocations=[];j.waitingReason='Contraintes de capacité ou disponibilité non satisfaites';}}
    return snapshot;
}
