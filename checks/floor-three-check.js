import assert from 'node:assert/strict';
import { checkSearchStep, createSearch } from '../floor-three-puzzle.js';

const search = createSearch();
assert.equal(checkSearchStep(search, 3), 'wrong');
assert.deepEqual(search, { low: 0, high: 8, solved: false });
assert.equal(checkSearchStep(search, 4), 'right');
assert.deepEqual(search, { low: 5, high: 8, solved: false });
assert.equal(checkSearchStep(search, 5), 'wrong', 'Finding the target by guessing cannot unlock the door');
assert.equal(checkSearchStep(search, 6), 'left');
assert.deepEqual(search, { low: 5, high: 5, solved: false });
assert.equal(checkSearchStep(search, 5), 'found');
assert.equal(search.solved, true);
assert.equal(checkSearchStep(search, 5), 'wrong');
console.log('PASS: binary search narrows both sides and requires the midpoint before unlocking the door.');

const { FloorThree } = await import('../floor-three.js');
const calls = [];
const drawn = [];
const context = new Proxy({ drawImage: image => drawn.push(image) }, {
  get: (target, key) => target[key] ?? (() => {}),
  set: () => true
});
const floor = Object.assign(Object.create(FloorThree.prototype), {
  stage: 'hall',
  elapsed: 0,
  p: { x: .22, y: .72 },
  m: { x: .52, y: .72 },
  guide: { x: .52, y: .72 },
  girls: [],
  shoes: 0,
  blush: 0,
  monsterHidden: 0,
  guideCooldown: 1,
  run: { immune: 0, health: 3, stamina: 100, dashTime: 0 },
  ctx: context,
  backgrounds: { hall: {} },
  guideArt: {},
  shyMonster: { complete: true, naturalWidth: 800, naturalHeight: 900 },
  partTwo: {
    toast() {},
    tone() {},
    getInput: () => ({ keys: { d: true }, stick: { x: 0, z: 0 } }),
    person: (...args) => calls.push(args)
  }
});
floor.say = (...args) => calls.push(args);
for (let encounter = 0; encounter < 2; encounter++) {
  floor.m = { x: floor.guide.x + .10, y: floor.guide.y };
  floor.updateHazards(.1);
  assert.equal(floor.blush, 1.1);
  drawn.length = 0;
  floor.draw(0);
  assert.ok(drawn.includes(floor.shyMonster), 'Seeing the guide shows the shy pose before contact');
  for (let step = 0; step < 11; step++) floor.updateHazards(.1);
  assert.equal(floor.monsterHidden, 5);
  calls.length = 0;
  drawn.length = 0;
  floor.draw(0);
  assert.ok(!drawn.includes(floor.shyMonster));
  assert.ok(!calls.some(args => args[0] === 0), 'Hidden monster is absent from the scene');
  const returnX = floor.m.x;
  for (let step = 0; step < 40; step++) floor.updateHazards(.125);
  assert.equal(floor.monsterHidden, 0);
  floor.updateHazards(.125);
  assert.notEqual(floor.m.x, returnX, 'Monster resumes its chase after five seconds');
}
floor.guide = { ...floor.p };
floor.guideCooldown = 0;
floor.updateHazards(.1);
assert.equal(floor.shoes, 2);
assert.ok(calls.some(args => args[1] === 'Tie your shoes!'));
const stoppedX = floor.p.x;
floor.movePlayer(.1);
assert.equal(floor.p.x, stoppedX);
console.log('PASS: repeated monster captures, pink cheeks, five-second disappearance, and two-second shoe penalty.');

const numbers = [];
const controls = {
  '#floorThreeNumbers': {
    replaceChildren() { numbers.length = 0; },
    append(button) { numbers.push(button); },
    querySelector() { return numbers.find(button => !button.disabled); }
  },
  '#floorThreeRange': {},
  '#floorThreeFeedback': {}
};
globalThis.document = {
  querySelector: selector => controls[selector],
  createElement: () => ({ focus() {} })
};
floor.stage = 'office';
floor.puzzleOpen = true;
floor.puzzlePanel = { classList: { add() {} } };
floor.setStage = stage => { floor.stage = stage; };
floor.search = createSearch();
floor.renderSearch();
numbers[3].onclick();
assert.equal(floor.stage, 'office', 'A wrong guess keeps the player in the puzzle room');
for (const index of [4, 6, 5]) numbers[index].onclick();
assert.equal(floor.stage, 'lift');
assert.equal(floor.puzzleOpen, false);
assert.equal(floor.nearDoor(), false, 'Players enter at the front of the lounge');
floor.shoes = 0;
floor.p = { x: .55, y: .77 };
floor.interact();
assert.equal(floor.stage, 'ride', 'The interaction at the lounge elevator boards it');
console.log('PASS: correct binary-search steps enter the lounge, whose elevator starts the ride.');
