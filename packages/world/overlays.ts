export type ScreenRect={x:number;y:number;w:number;h:number};
export function rectsOverlap(a:ScreenRect,b:ScreenRect,gap=6){return Math.abs(a.x-b.x)<(a.w+b.w)/2+gap&&Math.abs(a.y-b.y)<(a.h+b.h)/2+gap;}
export type BadgeCandidate=ScreenRect&{id:string;priority:number;rich:boolean};
/** Reserve selected cards first, then place compact targets nearby or omit them.
 * All sizes include the click target; hidden badges remain available through lists. */
export function placeAgentBadges(candidates:BadgeCandidate[],reserved:ScreenRect[],width:number,height:number){
 const occupied=[...reserved],result:Record<string,{x:number;y:number;w:number;h:number;rich:boolean}>={};
 for(const c of [...candidates].sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id))){
  const shifts=c.priority>=90?[[0,0],[0,-32],[0,32],[-48,0],[48,0],[0,-64],[0,64],[-80,-48],[80,-48],[-80,48],[80,48],[0,-96],[0,96]]:[[0,0],[0,-28],[0,28],[-28,0],[28,0],[-36,-28],[36,-28]];
  for(const[dx,dy]of shifts){const r={x:c.x+dx,y:c.y+dy,w:c.w,h:c.h};if(r.x-r.w/2<8||r.x+r.w/2>width-8||r.y-r.h/2<8||r.y+r.h/2>height-8||occupied.some(o=>rectsOverlap(r,o)))continue;
   result[c.id]={x:dx,y:dy,w:c.w,h:c.h,rich:c.rich};occupied.push(r);break;
  }
 }
 return result;
}
