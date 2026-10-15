import { z } from 'zod';
const node = z.object({ id: z.string(), name: z.string(), kind: z.enum(['standard', 'memory', 'gpu', 'access']), cpus: z.number().int().nonnegative(), memory: z.number().finite().nonnegative(), gpus: z.number().int().nonnegative(), partitions: z.array(z.string()), status: z.enum(['ready', 'maintenance','invalid','down']), usage: z.number().min(0).max(100).nullable(), responding:z.boolean().nullable().optional(),capacityBasis:z.enum(['source-exact','representative']).optional(),referenceState:z.object({scheduler:z.enum(['idle','alloc','mix','inval','down']),responding:z.boolean().nullable()}).optional(), memoryUsed:z.number().finite().nonnegative().nullable().optional() });
const allocation = z.object({ nodeId: z.string(), cpus: z.number().int().positive(), memory: z.number().finite().positive(), gpus: z.number().int().nonnegative() });
const reservation = z.object({ id: z.string(), jobId: z.string(), status: z.enum(['planned','active','finished']), startsAt: z.string().datetime(), endsAt: z.string().datetime(), allocations: z.array(allocation).min(1) });
const job = z.object({ id: z.string(), submittedAt:z.string().datetime().optional(), name: z.string(), user: z.string(), partition: z.string(), status: z.enum(['running', 'queued', 'finished', 'failed']), waitingReason: z.string().nullable(), request: z.object({cpus:z.number().int().positive(), memory:z.number().finite().positive(), gpus:z.number().int().nonnegative(), nodeCount:z.number().int().positive()}), allocations: z.array(allocation) });
export const snapshotSchema = z.object({ version: z.literal(3), clock:z.object({mode:z.literal('simulated'),now:z.string().datetime(),rate:z.number().finite().positive().max(60),cycleSteps:z.number().int().positive().optional(),cycleStep:z.number().int().nonnegative().optional(),phase:z.string().optional(),windowSeconds:z.number().positive().optional()}), stream: z.object({ epoch: z.string().min(1) }), units: z.object({ cpus: z.literal('logical-cpu'), memory: z.literal('GiB'), gpus: z.literal('device'), usage: z.literal('percent-cpu-capacity') }), cluster: z.object({ id: z.string(), name: z.string() }), sequence: z.number().int().nonnegative(), observedAt: z.string().datetime(), topology: z.object({ referenceNotice:z.string().optional(), communication:z.object({id:z.string().min(1),name:z.string().min(1),description:z.string().min(1)}).optional(), partitions: z.array(z.object({ id: z.string(), name: z.string(), limitHours: z.number().finite().positive().nullable(),limitUnlimited:z.boolean().optional(),isDefault:z.boolean().optional(),reference:z.object({memberships:z.number().int().nonnegative(),cpus:z.number().int().positive(),cpuMinimum:z.boolean(),memoryMiB:z.number().positive(),memoryMinimum:z.boolean(),gpus:z.number().int().nonnegative()}).optional() })), users: z.array(z.string()) }), state: z.object({ nodes: z.array(node), jobs: z.array(job), reservations: z.array(reservation) }) });
export type Snapshot = z.infer<typeof snapshotSchema>;
export function validate(input: unknown): Snapshot {
    const s = snapshotSchema.parse(input);
    if(s.clock.cycleStep!==undefined&&(!s.clock.cycleSteps||s.clock.cycleStep>=s.clock.cycleSteps))throw Error('Position de cycle invalide');
    if (s.topology.users.length !== new Set(s.topology.users).size)
        throw Error('Utilisateur dupliqué');
    for(const p of s.topology.partitions)if(p.limitHours===null&&!p.limitUnlimited)throw Error('Durée absente sans limite illimitée');
    const ids = new Set(s.state.nodes.map(n => n.id));
    if(s.topology.communication&&ids.has(s.topology.communication.id))throw Error('Identité logique confondue avec un nœud de calcul');
    const ps = new Set(s.topology.partitions.map(p => p.id));
    if (ids.size !== s.state.nodes.length || ps.size !== s.topology.partitions.length || new Set(s.state.jobs.map(j => j.id)).size !== s.state.jobs.length)
        throw Error('Identifiants dupliqués');
    for (const n of s.state.nodes) {
        if(n.memoryUsed!=null&&n.memoryUsed>n.memory)throw Error('Mesure mémoire supérieure à capacité');
        if (n.partitions.length !== new Set(n.partitions).size || n.partitions.some(p => !ps.has(p)))
            throw Error('Partition inconnue ou dupliquée');
        if (n.kind === 'access' && (n.cpus || n.memory || n.gpus || n.partitions.length))
            throw Error('Accès hors calcul');
    }
    for (const j of s.state.jobs) {
        if(j.submittedAt&&Date.parse(j.submittedAt)>Date.parse(s.clock.now))throw Error('Soumission postérieure au temps observé');
        if (!ps.has(j.partition) || !s.topology.users.includes(j.user))
            throw Error('Relation inconnue');
        if(j.status!=='queued'&&j.waitingReason!==null)throw Error('Motif hors attente');
        if(j.status==='running'&&(j.allocations.length!==j.request.nodeCount||j.allocations.some(a=>a.cpus!==j.request.cpus||a.memory!==j.request.memory||a.gpus!==j.request.gpus)))throw Error('Allocation différente de la demande');
        if (new Set(j.allocations.map(a => a.nodeId)).size !== j.allocations.length)
            throw Error('Allocation dupliquée');
        if (j.status === 'running' && !j.allocations.length)
            throw Error('Tâche active sans allocation');
        if (j.status !== 'running' && j.allocations.length)
            throw Error('Allocation hors exécution');
        for (const a of j.allocations) {
            const n = s.state.nodes.find(n => n.id === a.nodeId);
            if (!n || n.kind === 'access' || n.status !== 'ready' || n.responding===false || !n.partitions.includes(j.partition))
                throw Error('Allocation invalide');
        }
    }
    for (const n of s.state.nodes) {
        const a = [...s.state.jobs.flatMap(j => j.allocations),...s.state.reservations.filter(r=>r.status==='active'&&s.state.jobs.find(j=>j.id===r.jobId)?.status!=='running').flatMap(r=>r.allocations)].filter(a => a.nodeId === n.id);
        if (a.reduce((v, a) => v + a.cpus, 0) > n.cpus || a.reduce((v, a) => v + a.memory, 0) > n.memory || a.reduce((v, a) => v + a.gpus, 0) > n.gpus)
            throw Error('Capacité dépassée');
    }
    const reservations = s.state.reservations;
    if (new Set(reservations.map(r => r.id)).size !== reservations.length)
        throw Error('Réservation dupliquée');
    for (const r of reservations) {
        const j = s.state.jobs.find(j => j.id === r.jobId);
        const time=Date.parse(s.clock.now); const expected=time<Date.parse(r.startsAt)?'planned':time<Date.parse(r.endsAt)?'active':'finished';
        if (!j || Date.parse(r.startsAt) >= Date.parse(r.endsAt) || r.status!==expected || (r.status==='planned'&&j.status!=='queued') || (r.status==='active'&&!['queued','running'].includes(j.status)) || (r.status==='finished'&&j.status==='running'))
            throw Error('Réservation invalide');
        if(r.status==='active'&&j.status==='running'&&JSON.stringify([...r.allocations].sort((a,b)=>a.nodeId.localeCompare(b.nodeId)))!==JSON.stringify([...j.allocations].sort((a,b)=>a.nodeId.localeCompare(b.nodeId))))throw Error('Allocation active différente de réservation');
        if(r.allocations.length!==j.request.nodeCount||r.allocations.some(a=>a.cpus!==j.request.cpus||a.memory!==j.request.memory||a.gpus!==j.request.gpus))throw Error('Réservation différente de demande');
        if (new Set(r.allocations.map(a => a.nodeId)).size !== r.allocations.length)
            throw Error('Allocation de réservation dupliquée');
        for (const a of r.allocations) {
            const n = s.state.nodes.find(n => n.id === a.nodeId);
            if (!n || n.kind === 'access' || (r.status==='active'&&(n.status!=='ready'||n.responding===false)) || !n.partitions.includes(j.partition) || a.cpus > n.cpus || a.memory > n.memory || a.gpus > n.gpus)
                throw Error('Capacité ou référence réservation invalide');
        }
    }
    for(const r of reservations)if(reservations.some(x=>x.id!==r.id&&x.jobId===r.jobId&&Date.parse(x.startsAt)<Date.parse(r.endsAt)&&Date.parse(x.endsAt)>Date.parse(r.startsAt)))throw Error('Créneaux simultanés pour la même tâche');
    // À chaque début de réservation, contrôler la somme des réservations simultanées.
    for (const r of reservations)
        for (const n of s.state.nodes) {
            const a = reservations.filter(x => x.status!=='finished' && Date.parse(x.startsAt) <= Date.parse(r.startsAt) && Date.parse(x.endsAt) > Date.parse(r.startsAt)).flatMap(x => x.allocations).filter(a => a.nodeId === n.id);
            if (a.reduce((v, a) => v + a.cpus, 0) > n.cpus || a.reduce((v, a) => v + a.memory, 0) > n.memory || a.reduce((v, a) => v + a.gpus, 0) > n.gpus)
                throw Error('Réservations simultanées excessives');
        }
    return s;
}
