import { validate, type Snapshot } from '../contracts';
export function freshness(s: Snapshot, now = Date.now(), thresholdMs = 6000) { return { ageMs: Math.max(0, now - Date.parse(s.observedAt)), stale: now - Date.parse(s.observedAt) > thresholdMs }; }
/** Une époque par démarrage producteur ; séquences propres à (cluster, époque). */
export class SnapshotGate {
    private epoch: string | null = null;
    private last = -1;
    private retired = new Set<string>();
    constructor(private cluster: string) { }
    accept(input: unknown): Snapshot | null { const s = validate(input); if (s.cluster.id !== this.cluster || this.retired.has(s.stream.epoch))
        return null; if (this.epoch !== s.stream.epoch) {
        if (this.epoch)
            this.retired.add(this.epoch);
        this.epoch = s.stream.epoch;
        this.last = -1;
    } if (s.sequence <= this.last)
        return null; this.last = s.sequence; return s; }
}
export function connect(key: string, onSnapshot: (s: Snapshot) => void, onStatus: (s: string) => void) { let stopped = false, socket: WebSocket, timer: ReturnType<typeof setTimeout>; const gate = new SnapshotGate(key); function open() { onStatus('Connexion'); socket = new WebSocket(`ws://127.0.0.1:8787/?scenario=${key}`); socket.onopen = () => onStatus('En direct'); socket.onmessage = e => { if(stopped)return; try {
    const s = gate.accept(JSON.parse(e.data));
    if (s)
        onSnapshot(s);
}
catch {
    onStatus('Message invalide rejeté');
} }; socket.onclose = () => { if (!stopped) {
    onStatus('Reconnexion');
    timer = setTimeout(open, 1500);
} }; socket.onerror = () => socket.close(); } open(); return () => { stopped = true; clearTimeout(timer); socket.close(); }; }
