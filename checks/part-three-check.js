import assert from 'node:assert/strict';
import { PartThree } from '../part-three.js';

const overlay = { classList: { contains: () => true } };
globalThis.document = { querySelector: () => overlay };

const actions = [];
const part = Object.assign(Object.create(PartThree.prototype), {
  host: {
    floorThree: { hide() {} },
    onRun: run => actions.push(run.character),
    speak: line => actions.push(line),
    getInput: () => ({ keys: {}, stick: { x: 0, z: 0 } }),
    toast: line => actions.push(line),
    tone() {}
  },
  sync() {},
  draw() {}
});

function advance() {
  part.interact(true);
  for (let frame = 0; frame < 100 && part.autoInteract; frame++) part.update(.05, frame * .05);
}

part.start();
assert.equal(part.phase, 'reveal');
assert.deepEqual(actions, [2], 'The brown-haired character is selected automatically');
advance();
part.interact();
assert.equal(part.phase, 'lobby', 'The keyboard requires approaching the lift');
advance();
assert.equal(part.phase, 'rideToGame');
assert.equal(part.hasSwitch, false);
part.update(2.6, 2.6);
assert.equal(part.phase, 'gameRoom');
advance();
assert.equal(part.phase, 'retrieve');
assert.equal(part.hasSwitch, false, 'The Switch starts in the dock');
part.update(1.6, 4.2);
assert.equal(part.phase, 'returnToLift');
assert.equal(part.hasSwitch, true, 'She carries the Switch after picking it up');
advance();
assert.equal(part.phase, 'secondFloor');
advance();
assert.equal(part.phase, 'rideToGuide');
part.update(2.9, 2.9);
assert.equal(part.phase, 'arrival');
advance();
assert.equal(part.phase, 'ask');
advance();
assert.equal(part.phase, 'laces');
assert.ok(actions.includes('Tie your shoes.'));
advance();
assert.equal(part.phase, 'tying');
part.update(1.9, 5);
assert.equal(part.phase, 'tying');
part.update(.2, 5.2);
assert.equal(part.phase, 'point');
advance();
advance();
assert.equal(part.phase, 'meet');
advance();
assert.equal(part.phase, 'handoff');
part.update(2.8, 8);
assert.equal(part.phase, 'reunited');
advance();
assert.equal(part.phase, 'complete');
console.log('PASS: solo third chapter, elevator, guide, shoelace delay, console handoff and reunion.');
