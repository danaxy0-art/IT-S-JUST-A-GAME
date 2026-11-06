import assert from 'node:assert/strict';
import {controlKey,nearbyElevator,nearCorridorLift,normalizeCode,newFleeingCompanion,stepFleeingCompanion,walkable,newLobby,newRun} from '../engine.js';
import {ElevatorLevel} from '../elevator-level.js';
import {FinalEscape} from '../final-escape.js';

assert.equal(controlKey({code:'KeyE',key:'ث'}),'e');
assert.equal(controlKey({code:'KeyE',key:'E'}),'e');
assert.equal(controlKey({code:'KeyW',key:'ص'}),'w');
assert.equal(normalizeCode('٦۳٨2'),'6382');
for(const x of [.32,.5,.68])assert.ok(nearbyElevator({x,y:.76})>=0,'E works in front of each elevator');
assert.equal(nearbyElevator({x:.5,y:.9}),-1,'Distant players cannot enter');
assert.ok(nearCorridorLift({x:.86,y:.8}));

const nodes=new Map();
globalThis.document={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,{textContent:'',value:'',style:{},classList:{add(){},remove(){},toggle(){}},focus(){this.focused=true}});return nodes.get(selector)}};
for(let correct=0;correct<3;correct++){
 const state=newLobby(correct);state.clues=[0,1,2];
 const level={state,p:{x:[.32,.5,.68][correct],y:.76},final:{active:false},setMode(mode){this.mode=mode},tone(){},toast(){}};
 ElevatorLevel.prototype.interact.call(level);
 assert.equal(state.phase,'riding');assert.equal(level.mode,'lift');
}
const final={state:{phase:'corridor'},p:{x:.86,y:.8},toast(){}};
FinalEscape.prototype.interact.call(final);
assert.ok(nodes.get('#codeInput').focused,'E opens and focuses the code box at the single-door elevator');

// Every girl must leave her seat/pool corner and keep navigating furniture.
const starts=[[-4.7,-4.1],[-5.8,-2.9],[-3.9,-3],[-2.6,-4],[-1.45,-3.25],[-3.1,-1.7],[-1.7,-1.65],[9,2.8],[-8.85,-6.4],[1.5,2.1],[7.7,1.8],[-8.85,-5.1],[-8.85,-3.8],[-8.85,-2.5]];
for(let selected=1;selected<=6;selected++){
 const crowd=starts.slice(1).map(([x,z],k)=>newFleeingCompanion({x,z},k+1)).filter(p=>p.id!==selected);
 assert.equal(crowd.length,12);
 for(let second=0;second<25;second++){
  const distance=crowd.map(()=>0);
  for(let frame=0;frame<30;frame++)for(let i=0;i<crowd.length;i++){
   const p=crowd[i],before={x:p.x,z:p.z};
   stepFleeingCompanion(p,{x:-4.6+Math.sin(second/3)*3,z:-3.8+Math.cos(second/3)*3},1/30);
   distance[i]+=Math.hypot(p.x-before.x,p.z-before.z);assert.ok(walkable(p.x,p.z));
  }
  distance.forEach((d,i)=>assert.ok(d>.3,`Girl ${crowd[i].id} stopped during second ${second}, player ${selected}`));
 }
}
console.log('PASS: Arabic/English physical E, proximity at all elevators, correct elevator transition, code input focus, Arabic digits, all 12 companions move throughout 25 seconds for each selectable character without entering furniture.');
