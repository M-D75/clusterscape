export type Selection={nodeId:string|null;jobId:string|null};
export const emptySelection:Selection={nodeId:null,jobId:null};
export function toggleNode(current:Selection,id:string):Selection{return {nodeId:current.nodeId===id?null:id,jobId:current.jobId};}
/** Suit tout le trajet, pas seulement le déplacement final (aller-retour compris). */
export class SceneGesture {
 private start:{x:number;y:number;pointer:number}|null=null;private dragged=false;
 begin(x:number,y:number,pointer:number,button:number){if(this.start){this.dragged=true;return;}this.start={x,y,pointer};this.dragged=button!==0;}
 move(x:number,y:number,pointer:number){if(this.start?.pointer===pointer&&Math.hypot(x-this.start.x,y-this.start.y)>4)this.dragged=true;}
 end(x:number,y:number,pointer:number){if(!this.start||this.start.pointer!==pointer)return false;this.move(x,y,pointer);const click=!this.dragged;this.cancel();return click;}
 cancel(){this.start=null;this.dragged=false;}
}
export function escapeClears(key:string,editing:boolean,composing:boolean){return key==='Escape'&&!editing&&!composing;}

export type SceneFocus=Selection&{partition:string};
/** Sortie du périmètre visuel sans arrêter un suivi explicitement choisi. */
export function leaveFocus(current:SceneFocus):SceneFocus{return{partition:'all',nodeId:null,jobId:current.jobId};}
export function partitionFocus(current:SceneFocus,id:string):SceneFocus{return current.partition===id?leaveFocus(current):{...current,partition:id,nodeId:null};}
