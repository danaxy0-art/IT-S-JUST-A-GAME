// Shared deterministic navigation and game-state helpers, independent of rendering.
export const ROOM={minX:-10.3,maxX:10.3,minZ:-8.3,maxZ:8.3};
export const SOLIDS=[
{x:-9,z:-4.5,w:2.2,d:5.4}, // sofa
{x:-4,z:-7.9,w:7.2,d:1.2}, // TV cabinets
{x:4.5,z:-5.3,w:4.6,d:2.5}, // table tennis
{x:4.6,z:2.4,w:4.8,d:2.9}, // pool
{x:-7.8,z:3.7,w:2.6,d:2.1}, // foosball
{x:9,z:-6,w:1.3,d:2.4} // storage
];
export const KEY_POSITIONS=[{x:-8.3,z:7},{x:7.9,z:6.8},{x:1.2,z:-6.4}];
export const EXIT={x:9,z:-8};
export function walkable(x,z,r=.29){return x>=ROOM.minX+r&&x<=ROOM.maxX-r&&z>=ROOM.minZ+r&&z<=ROOM.maxZ-r&&!SOLIDS.some(o=>Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r)}
export function move(body,dx,dz,r=.29){if(walkable(body.x+dx,body.z,r))body.x+=dx;if(walkable(body.x,body.z+dz,r))body.z+=dz;return body}
export function path(start,end,r=.29){const step=.5,W=43,H=35;const grid=p=>({x:Math.max(0,Math.min(W-1,Math.round((p.x+10.5)/step))),z:Math.max(0,Math.min(H-1,Math.round((p.z+8.5)/step)))});let a=grid(start),b=grid(end);const id=(x,z)=>z*W+x,world=(x,z)=>({x:x*step-10.5,z:z*step-8.5});let open=[{...a,g:0,h:0}],parent=new Map(),cost=new Map([[id(a.x,a.z),0]]),closed=new Set(),goal=null;while(open.length){open.sort((a,b)=>(a.g+a.h)-(b.g+b.h));let cur=open.shift(),ci=id(cur.x,cur.z);if(closed.has(ci))continue;closed.add(ci);if(Math.abs(cur.x-b.x)+Math.abs(cur.z-b.z)<=1){goal=ci;break}for(let [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){let x=cur.x+dx,z=cur.z+dz,ni=id(x,z);if(x<0||x>=W||z<0||z>=H||closed.has(ni))continue;let p=world(x,z);if(!walkable(p.x,p.z,r))continue;let g=cur.g+1;if(g>=(cost.get(ni)??Infinity))continue;cost.set(ni,g);parent.set(ni,ci);open.push({x,z,g,h:Math.abs(x-b.x)+Math.abs(z-b.z)})}}if(goal===null)return[];let out=[];while(parent.has(goal)){out.push(world(goal%W,Math.floor(goal/W)));goal=parent.get(goal)}return out.reverse()}
export function newRun(character){return{character,keys:[],time:0,health:3,stamina:100,dashCooldown:0,dashTime:0,immune:0,won:false}}
export function addKey(run,index){if(!run.keys.includes(index))run.keys.push(index);return run.keys.length===3}
export function hit(run){if(run.immune>0)return false;run.health--;run.immune=2.8;return run.health<=0}
export function availableCharacters(){return[1,2,3,4,5,6]}
export function newLobby(correct=1){return{correct:Math.max(0,Math.min(2,correct)),wrong:0,phase:'lobby',floor:2,clues:[]}}
export function collectLobbyClue(lobby,index){if(lobby.phase==='lobby'&&[0,1,2].includes(index)&&!lobby.clues.includes(index))lobby.clues.push(index);return lobby.clues.length===3}
export function elevatorDisplay(lobby,index){return '↓ 1 · '+String([2,4,8][(index-lobby.correct+3)%3]).padStart(2,'0')}
export function chooseElevator(lobby,index){if(lobby.phase!=='lobby'||![0,1,2].includes(index))return 'ignored';if(lobby.clues.length<3)return 'locked';if(index===lobby.correct){lobby.phase='riding';return 'correct'}lobby.wrong++;return 'wrong'}
export function arriveDownstairs(lobby){if(lobby.phase==='riding'){lobby.phase='lower';lobby.floor=1;return true}return false}
// A real 20-second grace period; opening or guessing the code never resets it.
export function newCorridor(code='6382'){return{phase:'corridor',elapsed:0,code:String(code),wrong:0,notes:[]}}
export function tickCorridor(state,dt){if(state.phase==='corridor')state.elapsed+=Math.max(0,dt);return state.elapsed>=20}
export function submitCorridorCode(state,code){if(state.phase!=='corridor')return 'ignored';if(String(code)!==state.code){state.wrong++;return 'wrong'}state.phase='transfer';return 'correct'}
export function finishCorridorLift(state){if(state.phase!=='transfer')return false;state.phase='exitLobby';return true}
export function leaveFinalLobby(state,x){if(state.phase!=='exitLobby'||x>.1)return false;state.phase='outside';return true}

// Physical controls work with English and Arabic keyboard layouts alike.
export function controlKey(event){const codes={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',KeyE:'e',KeyP:'p',Space:' ',ShiftLeft:'shift',ShiftRight:'shift'};return codes[event.code]??event.key.toLowerCase()}
export const LIFT_X=[.32,.50,.68];
export function nearbyElevator(p){let nearest=-1,distance=.075;LIFT_X.forEach((x,i)=>{let d=Math.hypot(p.x-x,(p.y-.70)*.5625);if(d<distance){nearest=i;distance=d}});return nearest}
export function nearCorridorLift(p){return Math.hypot(p.x-.86,(p.y-.70)*.5625)<.085}
export function normalizeCode(value){return String(value).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776))}

const FLEE_POINTS=[{x:-5.5,z:6.6},{x:.1,z:6.7},{x:8.4,z:-1.1},{x:0,z:-5.8},{x:-6.3,z:-1},{x:8,z:6},{x:-1,z:1},{x:0,z:-2}];
export function nearestWalkable(p){const connected=q=>walkable(q.x,q.z)&&(Math.hypot(q.x,q.z)<.6||path(q,{x:0,z:0}).length>0);if(connected(p))return{x:p.x,z:p.z};let candidates=[];for(let x=-10;x<=10;x+=.5)for(let z=-8;z<=8;z+=.5)if(walkable(x,z))candidates.push({x,z});candidates.sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));return candidates.find(connected)}
export function newFleeingCompanion(position,id){return{...nearestWalkable(position),id,route:[],target:null,replan:0,turn:0}}
export function stepFleeingCompanion(body,threat,dt){
 body.replan-=dt;
 const reached=body.target&&Math.hypot(body.x-body.target.x,body.z-body.target.z)<.7;
 const danger=Math.hypot(body.x-threat.x,body.z-threat.z)<2.5;
 if(!body.route.length||reached||(danger&&body.replan<=0)){
  const candidates=FLEE_POINTS.map((p,i)=>({...p,score:Math.hypot(p.x-threat.x,p.z-threat.z)-.18*Math.hypot(p.x-body.x,p.z-body.z)+Math.sin(i*2.7+body.id+body.turn)*1.2})).filter(p=>Math.hypot(p.x-body.x,p.z-body.z)>2).sort((a,b)=>b.score-a.score);
  for(const target of candidates){const route=path(body,target);if(route.length){body.route=route;body.target=target;break}}
  body.replan=.8+body.id*.025;body.turn++;
 }
 const before={x:body.x,z:body.z};let remaining=dt*(3.0+(body.id%3)*.12);
 while(remaining>0&&body.route.length){const p=body.route[0],dx=p.x-body.x,dz=p.z-body.z,d=Math.hypot(dx,dz);if(d<.06){body.route.shift();continue}const step=Math.min(d,remaining);move(body,dx/d*step,dz/d*step);body.heading=Math.atan2(dx,dz);remaining-=step;if(Math.hypot(body.x-before.x,body.z-before.z)<.0001){body.route=[];break}}
 return Math.hypot(body.x-before.x,body.z-before.z)>.0001;
}
