/** Shared absolute scale: one capsule = one queued job up to eight, never normalized per partition. */
export function capsuleLayout(jobs:number){
 const total=Math.max(0,Math.floor(Number.isFinite(jobs)?jobs:0)),singles=Math.min(8,total),bundled=total-singles;
 return{total,singles,bundled,positions:Array.from({length:singles},(_,i)=>[i%2===0?-.25:.25,.16+Math.floor(i/4)*.22,Math.floor(i/2)%2===0?-.25:.25] as [number,number,number])};
}
