import assert from 'node:assert/strict';
import{PART_TWO_GIRLS,newPartTwo,startPartTwo,tickPartTwo,skipPartTwoShot,boardPartTwoLift}from '../part-two-state.js';
assert.deepEqual(PART_TWO_GIRLS,[7,8,9,10,11,12,13]);
for(const character of PART_TWO_GIRLS){
 const s=newPartTwo(character);assert.equal(s.character,character);assert.equal(s.phase,'remember');assert.equal(s.floor,0,'Camera returns to the ground floor first');
 assert.equal(startPartTwo(s),false);
 tickPartTwo(s,4);assert.equal(s.phase,'sabotage');
 tickPartTwo(s,4);assert.equal(s.damagedLift,true);assert.equal(s.canDescend,false);
 tickPartTwo(s,3);assert.equal(s.floor,2);assert.equal(s.phase,'encounter');
 tickPartTwo(s,4);assert.equal(s.phase,'choose');tickPartTwo(s,60);assert.equal(s.phase,'choose');assert.equal(startPartTwo(s),true);assert.equal(s.phase,'flee');
 assert.equal(boardPartTwoLift(s,{x:.3,y:.8}),false,'Cannot board from the club door');
 assert.equal(boardPartTwoLift(s,{x:.68,y:.94}),false,'Must approach the elevator door');
 assert.equal(boardPartTwoLift(s,{x:.68,y:.76}),true,'No keys or puzzle required to board');
 assert.equal(s.phase,'boarding');tickPartTwo(s,1.6);assert.equal(s.phase,'girlRide');
 tickPartTwo(s,4);assert.equal(s.floor,3);assert.equal(s.phase,'arrived');
 const frozen=JSON.stringify(s);tickPartTwo(s,10000);assert.equal(JSON.stringify(s),frozen,'The elevator state stays at the handoff to floor three');
 assert.equal(skipPartTwoShot(s),false);assert.equal(boardPartTwoLift(s,{x:.68,y:.76}),false);
}
let s=newPartTwo(0);assert.equal(s.character,7,'Only the remaining seven girls are selectable');
for(const phase of ['sabotage','monsterRide','encounter','choose']){assert.ok(skipPartTwoShot(s));assert.equal(s.phase,phase)}
assert.equal(skipPartTwoShot(s),false,'Skipping cannot bypass the playable chase');
console.log('PASS: all seven remaining girls, monster memory → sabotage → second-floor encounter → playable flight → automatic ascent to floor 3, no elevator puzzle, third-floor handoff.');
