export const PART_TWO_GIRLS=[7,8,9,10,11,12,13];
const TIMED={remember:[4,'sabotage'],sabotage:[4,'monsterRide'],monsterRide:[3,'encounter'],encounter:[4,'choose'],boarding:[1.6,'girlRide'],girlRide:[4,'arrived']};
export function newPartTwo(character=7){return{character:PART_TWO_GIRLS.includes(character)?character:7,phase:'remember',elapsed:0,floor:0,damagedLift:false,canDescend:false}}
export function startPartTwo(state){if(state.phase!=='choose')return false;state.phase='flee';state.elapsed=0;return true}
export function tickPartTwo(state,dt){const previous=state.phase,step=TIMED[state.phase];if(!step)return false;state.elapsed+=Math.max(0,dt);if(state.elapsed>=step[0]){state.phase=step[1];state.elapsed=0;if(previous==='sabotage')state.damagedLift=true;if(previous==='monsterRide')state.floor=2;if(state.phase==='arrived')state.floor=3}return state.phase!==previous}
export function skipPartTwoShot(state){if(!['remember','sabotage','monsterRide','encounter'].includes(state.phase))return false;return tickPartTwo(state,100)}
export function boardPartTwoLift(state,position){if(state.phase!=='flee'||Math.abs(position.x-.68)>.07||position.y>.82)return false;state.phase='boarding';state.elapsed=0;return true}
