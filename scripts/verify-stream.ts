import WebSocket from 'ws';
import { SnapshotGate } from '../packages/connectors';
const gate = new SnapshotGate('atlas');
let count = 0, closed = 0, lastTime = 0, longest = 0, done = false;
let retry: ReturnType<typeof setTimeout>;
let current: WebSocket;
function open() { current = new WebSocket('ws://127.0.0.1:8787/?scenario=atlas'); current.on('message', raw => { if (!gate.accept(JSON.parse(raw.toString())))
    throw Error('État ancien reçu'); count++; if (lastTime)
    longest = Math.max(longest, Date.now() - lastTime); lastTime = Date.now(); }); current.on('close', () => { closed++; if (!done)
    retry = setTimeout(open, 1500); }); current.on('error', () => { }); }
open();
setTimeout(() => { done = true; clearTimeout(retry); current.close(); if (count < 20 || closed < 1 || longest < 6000) {
    console.error('Cycle réseau incomplet', { count, closed, longest });
    process.exitCode = 1;
}
else
    console.log(JSON.stringify({ messagesValides: count, fermetures: closed, intervalleMaxMs: longest, reconnexion: 'confirmée' })); }, 80000);
