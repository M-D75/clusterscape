import{capsuleLayout}from'../../../packages/world/capsules';
import{BoxGeometry,CapsuleGeometry}from'three';
const capsule=new CapsuleGeometry(.09,.22,2,6),pallet=new BoxGeometry(1,.07,1),lot=new BoxGeometry(.76,.18,.2);
/** Presentation only. Exact count is always supplied by its adjacent waiting counter. */
export function WaitingCapsules({jobs}:{jobs:number}){const p=capsuleLayout(jobs);if(!p.total)return null;return <group><mesh geometry={pallet} position={[0,.05,0]}><meshStandardMaterial color="#786c52"/></mesh>{p.positions.map((position,i)=><mesh key={i} geometry={capsule} position={position} rotation={[0,0,Math.PI/2]}><meshStandardMaterial color="#c8bb97" roughness={.8}/></mesh>)}{p.bundled>0&&<group><mesh geometry={lot} position={[0,.15,.62]}><meshStandardMaterial color="#978869"/></mesh><mesh position={[0,.25,.62]}><boxGeometry args={[.78,.025,.08]}/><meshBasicMaterial color="#d5c08a"/></mesh></group>}</group>;}
