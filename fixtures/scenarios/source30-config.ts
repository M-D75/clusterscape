/** Appartenances et états du relevé utilisateur, sans ajout de noms ni de nœuds. */
export const sourceGroups=[
 {id:'long',nodes:[10,12,13,22,23]}, {id:'short',nodes:[18,3,14,15,16]},
 {id:'normal',nodes:[11,4,8,9,17,20,24,0,1,5,7,21,27]},
 {id:'supermem',nodes:[2,25]}, {id:'global',nodes:[31]}, {id:'highmem',nodes:[30,28,29]}, {id:'gpu',nodes:[26]},
];
export const sourceStates:Record<number,'idle'|'alloc'|'mix'|'inval'|'down'>={10:'inval',12:'idle',13:'idle',22:'idle',23:'idle',18:'mix',3:'idle',14:'idle',15:'idle',16:'idle',11:'down',4:'mix',8:'mix',9:'mix',17:'mix',20:'mix',24:'mix',0:'alloc',1:'alloc',5:'alloc',7:'alloc',21:'alloc',27:'alloc',2:'mix',25:'idle',31:'mix',30:'mix',28:'idle',29:'idle',26:'alloc'};
/** Variations synthétiques ≥ minima, seulement sur les groupes hétérogènes. */
export const representativeOverrides:Record<number,{cpus?:number;memory?:number}>={0:{cpus:24,memory:128},1:{cpus:48,memory:256},4:{memory:128}};
