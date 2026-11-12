import { walkFrame } from './pixel-characters.js';
import { newRun, hit } from './engine.js';
import { PART_TWO_GIRLS } from './part-two-state.js';
import { SEARCH_VALUES, SEARCH_TARGET, createSearch, checkSearchStep } from './floor-three-puzzle.js';

const $ = selector => document.querySelector(selector);
const WIDTH = 1680;
const HEIGHT = 945;
const SHOE_LINE = 'Tie your shoes!';
const SHOE_STOP = 2;
const BLUSH_TIME = 1.1;
const GUIDE_SIGHT_RANGE = .16;
const HIDE_TIME = 5;
const INTRO_BLUSH_AT = 5.6;
const INTRO_END = 8.4;
const DESTINATIONS = {
  arrival: { x: .945, y: .76, label: 'إلى الصالة →', action: 'الانتقال للصالة' },
  hall: { x: .357, y: .663, label: 'باب المكاتب', action: 'دخول غرفة المكاتب' },
  office: { x: .50, y: .633, label: 'باب الاستراحة', action: 'فحص باب المصعد' },
  lift: { x: .55, y: .77, label: 'إلى الكلية الثانية', action: 'دخول المصعد' }
};
const HINTS = {
  arrival: ['امشي إلى الصالة الثانية', 'اتجهي للممر على اليمين'],
  hall: ['وصّلي البنات إلى باب المكاتب', 'الباب بين خزانتَي العرض على اليسار'],
  office: ['حلّي خوارزمية البحث الثنائي', 'اقتربي من الباب المقابل واضغطي E'],
  lift: ['اركبوا المصعد', 'اضغطي E عند باب المصعد']
};

function image(name) {
  const result = new Image();
  result.src = '' + name;
  return result;
}

function loaded(asset) {
  return asset?.complete && asset.naturalWidth > 0;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, (a.y - b.y) * .5625);
}

function walkTowards(actor, target, speed, dt) {
  const length = distance(actor, target);
  if (length < .001) return false;
  const portion = Math.min(1, speed * dt / length);
  actor.x += (target.x - actor.x) * portion;
  actor.y += (target.y - actor.y) * portion;
  return length > .006;
}

export class FloorThree {
  constructor(partTwo) {
    this.partTwo = partTwo;
    this.canvas = partTwo.canvas;
    this.ctx = partTwo.ctx;
    this.active = false;
    this.backgrounds = {
      arrival: image('floor-three-arrival.png'),
      hall: image('floor-three-hall.png'),
      office: image('floor-three-office.png'),
      lift: image('floor-three-elevator-lounge.png'),
      college: image('floor-three-college.png')
    };
    this.shyMonster = image('monster-shy.png');
    this.guideArt = image('floor-three-guide.png');
    this.guideArt.onload = () => {
      const frame = document.createElement('canvas');
      frame.width = 64;
      frame.height = 192;
      const ctx = frame.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.guideArt, 256, 0, 512, 1536, 0, 0, frame.width, frame.height);
      this.guideWalk = Array.from({ length: 8 }, (_, step) => walkFrame(frame, step));
    };
    this.caption = $('#floorThreeCaption');
    this.action = $('#floorThreeAction');
    this.puzzlePanel = $('#floorThreePuzzle');
    this.action.onclick = () => this.interact();
    $('#floorThreeClose').onclick = () => this.closePuzzle();
    $('#floorThreeRetry').onclick = () => this.retry();
  }

  start(character) {
    this.active = true;
    this.character = character;
    this.run = newRun(character);
    this.partTwo.onRun(this.run);
    this.search = createSearch();
    $('#toast').textContent = '';
    $('#toast').classList.remove('show');
    this.setStage('intro');
    this.p = { x: .63, y: .69 };
    this.m = { x: .29, y: .79 };
    this.guide = { x: .84, y: .76 };
    this.girls = PART_TWO_GIRLS.filter(id => id !== character).map((id, i) => ({
      id, x: .60 + i * .014, y: .66 + (i % 3) * .025
    }));
    this.blush = 0;
    this.monsterHidden = 0;
    this.shoes = 0;
    this.guideCooldown = 0;
    this.draw(0);
  }

  hide() {
    this.active = false;
    this.puzzleOpen = false;
    for (const id of ['floorThreeCaption', 'floorThreeAction', 'floorThreePuzzle', 'floorThreeWin', 'floorThreeCaught']) {
      $('#' + id).classList.add('hidden');
    }
  }

  setStage(stage) {
    this.stage = stage;
    this.elapsed = 0;
    this.target = null;
    this.lastCaption = '';
    this.caption.classList.add('hidden');
    this.action.classList.add('hidden');
    $('#floorThreeWin').classList.toggle('hidden', stage !== 'complete');
    $('#floorThreeCaught').classList.toggle('hidden', stage !== 'caught');
    this.syncHud();
  }

  syncHud() {
    const hints = HINTS[this.stage];
    const playing = !!hints && !this.puzzleOpen;
    $('#hud').classList.toggle('hidden', !playing);
    $('#pauseHelp').textContent = 'تحرّكي بالأسهم أو بلمس الأرض، واضغطي E عند الباب. حلّي البحث الثنائي للوصول للمصعد.';
    if (hints) {
      $('#goal').textContent = hints[0];
      $('#goalSub').textContent = hints[1];
      $('#keyCount').textContent = 'الطابق الثالث';
    }
  }

  say(title, line, english = false) {
    const key = title + line;
    if (this.lastCaption === key && !this.caption.classList.contains('hidden')) return;
    this.lastCaption = key;
    $('#floorThreeTitle').textContent = title;
    $('#floorThreeLine').textContent = line;
    $('#floorThreeLine').dir = english ? 'ltr' : 'rtl';
    this.caption.classList.remove('hidden');
    if (english) this.partTwo.speak?.(line);
  }

  setTarget(event) {
    if (!HINTS[this.stage] || this.puzzleOpen) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const door = DESTINATIONS[this.stage];
    if (Math.abs(x - door.x) < .08 && y < door.y) {
      this.target = { x: door.x, y: door.y };
      return;
    }
    this.target = this.walkablePoint(x, y);
  }

  walkablePoint(x, y) {
    const lounge = this.stage === 'lift';
    return {
      x: Math.max(lounge ? .51 : .06, Math.min(lounge ? .66 : .96, x)),
      y: Math.max(lounge ? .755 : .65, Math.min(.94, y))
    };
  }

  nearDoor() {
    const door = DESTINATIONS[this.stage];
    return door && distance(this.p, door) < .065;
  }

  interact() {
    if (this.puzzleOpen || !HINTS[this.stage]) return;
    if (!this.nearDoor()) {
      this.partTwo.toast('اقتربي من المكان المعلّم بالسهم.');
      return;
    }
    if (this.shoes > 0) return;
    if (this.stage === 'arrival') this.enterHall();
    else if (this.stage === 'hall') {
      this.setStage('office');
      this.p = { x: .49, y: .90 };
      this.arrangeGirls();
    } else if (this.stage === 'office') {
      this.openPuzzle();
      return;
    } else if (this.stage === 'lift') this.setStage('ride');
    this.partTwo.tone(630, .18);
  }

  enterHall() {
    this.setStage('hall');
    if (this.blush > 0) {
      this.blush = 0;
      this.monsterHidden = HIDE_TIME;
    }
    this.p = { x: .86, y: .698 };
    this.resetMonsterPosition();
    this.guide = { x: .96, y: .70 };
    this.arrangeGirls();
  }

  retry() {
    this.run = newRun(this.character);
    this.partTwo.onRun(this.run);
    this.blush = 0;
    this.monsterHidden = HIDE_TIME;
    this.shoes = 0;
    this.guideCooldown = 2;
    this.enterHall();
  }

  arrangeGirls() {
    this.girls.forEach((girl, index) => {
      const point = this.walkablePoint(
        this.p.x + (index - 2.5) * (this.stage === 'lift' ? .024 : .04),
        this.p.y + .025 + index % 2 * .024
      );
      Object.assign(girl, point);
    });
  }

  openPuzzle() {
    this.puzzleOpen = true;
    this.target = null;
    this.puzzlePanel.classList.remove('hidden');
    this.action.classList.add('hidden');
    $('#floorThreeFeedback').textContent = '';
    this.renderSearch();
    this.syncHud();
    $('#floorThreeNumbers button:not(:disabled)')?.focus();
  }

  closePuzzle() {
    this.puzzleOpen = false;
    this.puzzlePanel.classList.add('hidden');
    this.syncHud();
    if (this.nearDoor()) this.action.classList.remove('hidden');
    this.action.focus();
  }

  renderSearch() {
    const { low, high } = this.search;
    $('#floorThreeRange').textContent = 'النطاق الحالي من ' + SEARCH_VALUES[low] + ' إلى ' + SEARCH_VALUES[high];
    const numbers = $('#floorThreeNumbers');
    numbers.replaceChildren();
    SEARCH_VALUES.forEach((value, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.disabled = index < low || index > high;
      button.textContent = value;
      button.onclick = () => {
        const outcome = checkSearchStep(this.search, index);
        if (outcome === 'wrong') {
          $('#floorThreeFeedback').textContent = 'جرّبي العنصر في منتصف النطاق المضيء.';
          return;
        }
        if (outcome === 'found') {
          this.puzzleOpen = false;
          this.puzzlePanel.classList.add('hidden');
          this.p = { x: .56, y: .91 };
          this.setStage('lift');
          this.arrangeGirls();
          this.partTwo.tone(780, .28);
          this.partTwo.toast('حلّيتوا اللغز! المصعد قدّامكم في الاستراحة.');
          return;
        }
        this.renderSearch();
        $('#floorThreeFeedback').textContent = outcome === 'right'
          ? 'العدد أصغر من ٢٣. كمّلي البحث في النصف الأيمن.'
          : 'العدد أكبر من ٢٣. كمّلي البحث في النصف الأيسر.';
        numbers.querySelector('button:not(:disabled)')?.focus();
      };
      numbers.append(button);
    });
  }

  updateIntro(dt) {
    const t = this.elapsed;
    if (t < 2.2) {
      this.say('الطابق الثالث', 'افتحوا الطريق… خلونا نطلع من المصعد.');
      walkTowards(this.p, { x: .71, y: .79 }, .10, dt);
      this.girls.forEach((girl, i) => walkTowards(girl, { x: .51 + i * .040, y: .75 + i % 2 * .04 }, .09, dt));
    } else if (t < 3.6) {
      this.say('إحدى البنات', 'يلا بسرعة، قبل لا يلحقنا!');
      walkTowards(this.p, { x: .77, y: .79 }, .065, dt);
      this.guide.moving = walkTowards(this.guide, this.p, .14, dt);
    } else if (t < INTRO_BLUSH_AT) {
      this.say('الشخصية الجديدة', SHOE_LINE, true);
      this.guide.moving = walkTowards(this.guide, { x: this.p.x + .065, y: this.p.y }, .2, dt);
    } else if (t < INTRO_END) {
      this.guide.moving = false;
      this.say('الوحش شافها', 'الوحش استحى واختفى!');
    } else {
      this.monsterHidden = Math.max(0, INTRO_BLUSH_AT + BLUSH_TIME + HIDE_TIME - t);
      this.guideCooldown = 4;
      this.setStage('arrival');
      this.resetMonsterPosition();
    }
  }

  resetMonsterPosition() {
    this.m = { x: this.stage === 'arrival' ? -.11 : 1.10, y: .71 };
  }

  updateHazards(dt) {
    if (this.blush > 0) {
      this.blush = dt + 1e-9 >= this.blush ? 0 : this.blush - dt;
      if (this.blush === 0) {
        this.monsterHidden = HIDE_TIME;
        this.resetMonsterPosition();
      }
    } else if (this.monsterHidden > 0) {
      this.monsterHidden = Math.max(0, this.monsterHidden - dt);
    } else {
      walkTowards(this.m, this.p, .086, dt);
    }

    const monsterActive = this.blush === 0 && this.monsterHidden === 0;
    const patrol = this.stage === 'arrival' ? .60 : .48;
    const route = { x: patrol + .26 * Math.sin(this.elapsed * .8), y: .70 + .08 * Math.cos(this.elapsed * 1.1) };
    if (this.stage === 'hall' && route.x >= .565) route.y = Math.min(.746, route.y);
    const monsterNear = monsterActive && distance(this.guide, this.m) < GUIDE_SIGHT_RANGE;
    const playerNear = this.guideCooldown === 0 && distance(this.guide, this.p) < .145;
    const guideTarget = monsterNear ? this.m : playerNear ? this.p : route;
    const x = this.guide.x;
    this.guide.moving = walkTowards(this.guide, guideTarget, .105, dt);
    if (Math.abs(this.guide.x - x) > .0005) this.guide.left = this.guide.x < x;

    if (this.guideCooldown === 0 && distance(this.guide, this.p) < .033) {
      this.shoes = SHOE_STOP;
      this.guideCooldown = 8;
      this.target = null;
      this.say('الشخصية الجديدة', SHOE_LINE, true);
      this.partTwo.tone(440, .12);
    }
    if (monsterNear) {
      this.blush = BLUSH_TIME;
      this.partTwo.toast('الوحش شافها واستحى! بيختفي ٥ ثواني.');
    } else if (monsterActive && distance(this.m, this.p) < .034 && this.run.immune === 0) {
      if (hit(this.run)) this.setStage('caught');
      else this.partTwo.toast('الوحش قرب! اركضي للباب.');
    }
  }

  movePlayer(dt) {
    const { keys, stick, run } = this.partTwo.getInput();
    let dx = Number(!!(keys.d || keys.arrowright)) - Number(!!(keys.a || keys.arrowleft)) + stick.x;
    let dy = Number(!!(keys.s || keys.arrowdown)) - Number(!!(keys.w || keys.arrowup)) + stick.z;
    if (Math.hypot(dx, dy) > .1) this.target = null;
    else if (this.target && distance(this.target, this.p) > .007) {
      dx = this.target.x - this.p.x;
      dy = (this.target.y - this.p.y) * .5625;
    } else {
      this.target = null;
      dx = dy = 0;
    }
    const magnitude = Math.hypot(dx, dy);
    const sprinting = (keys.shift || run) && this.run.stamina > 1;
    const speed = this.run.dashTime > 0 ? .44 : sprinting ? .24 : .16;
    this.moving = magnitude > .0001 && this.shoes === 0;
    if (this.moving) {
      const amount = Math.min(speed * dt, this.target ? distance(this.target, this.p) : Infinity);
      const { x: nextX, y: nextY } = this.walkablePoint(
        this.p.x + dx / magnitude * amount,
        this.p.y + dy / magnitude * amount * 1.78
      );
      // Keep movement in the marble aisle around the foreground couches.
      if (this.stage !== 'hall' || nextX < .565 || nextY < .755) {
        this.p.x = nextX;
        this.p.y = nextY;
      }
    }
    this.run.stamina = Math.max(0, Math.min(100, this.run.stamina + dt * (this.moving && sprinting ? -22 : 14)));
    this.girls.forEach((girl, index) => {
      const target = this.walkablePoint(
        this.p.x + (index - 2.5) * (this.stage === 'lift' ? .024 : .034),
        Math.min(this.stage === 'hall' && this.p.x >= .565 ? .746 : .94, this.p.y + .035 + index % 2 * .029)
      );
      girl.moving = walkTowards(girl, target, .22, dt);
    });
  }

  update(dt, time) {
    this.elapsed += dt;
    if (this.stage === 'intro') this.updateIntro(dt);
    else if (this.stage === 'ride' && this.elapsed > 3.5) {
      this.setStage('complete');
      this.run.won = true;
      this.partTwo.tone(840, .35);
    } else if (HINTS[this.stage] && !this.puzzleOpen) {
      for (const key of ['shoes', 'guideCooldown']) this[key] = Math.max(0, this[key] - dt);
      for (const key of ['immune', 'dashCooldown', 'dashTime']) this.run[key] = Math.max(0, this.run[key] - dt);
      this.run.time += dt;
      this.movePlayer(dt);
      if (this.stage === 'arrival' || this.stage === 'hall') this.updateHazards(dt);
      if (this.shoes === 0 && this.stage !== 'caught') this.caption.classList.add('hidden');
      const door = DESTINATIONS[this.stage];
      this.action.classList.toggle('hidden', !door || !this.nearDoor() || this.shoes > 0);
      if (door) this.action.textContent = door.action + ' · E';
      $('#hearts').textContent = '♥ '.repeat(this.run.health) + '♡ '.repeat(3 - this.run.health);
      $('#staminaFill').style.width = this.run.stamina + '%';
      $('#dashText').textContent = this.run.dashCooldown > 0 ? 'الاندفاع بعد ' + Math.ceil(this.run.dashCooldown) + 'ث' : 'اندفاع جاهز';
      const chasing = this.stage === 'arrival' || this.stage === 'hall';
      const monsterAway = this.blush > 0 || this.monsterHidden > 0;
      $('#keyCount').textContent = this.shoes > 0 ? 'ربط الجزمة · ' + Math.ceil(this.shoes) + ' ث'
        : chasing && monsterAway ? 'الوحش يختفي · ' + Math.ceil(this.monsterHidden || HIDE_TIME) + ' ث'
        : 'الطابق الثالث';
      $('#danger i').style.width = chasing && !monsterAway ? Math.max(0, 100 - distance(this.m, this.p) * 230) + '%' : '0%';
    }
    this.draw(time);
  }

  drawGuide(time) {
    if (!loaded(this.guideArt)) return;
    const height = 215;
    const frame = this.guide.moving ? this.guideWalk?.[Math.floor(time * 11) % 8] : null;
    const sprite = frame ?? this.guideArt;
    const width = height * sprite.width / sprite.height;
    const x = this.guide.x * WIDTH;
    const y = this.guide.y * HEIGHT;
    const g = this.ctx;
    g.fillStyle = '#173c4044';
    g.beginPath();
    g.ellipse(x, y - 4, 26, 7, 0, 0, Math.PI * 2);
    g.fill();
    g.save();
    g.translate(x, y);
    if (this.guide.left) g.scale(-1, 1);
    g.drawImage(sprite, -width / 2, -height, width, height);
    g.restore();
  }

  drawLiftOpening() {
    const g = this.ctx;
    const x = 963, y = 303, w = 187, h = 320;
    const opening = Math.max(0, Math.min(1, this.elapsed / 1.15));
    const panel = w * (1 - opening) / 2;
    const asset = this.backgrounds.arrival;
    g.fillStyle = '#163137';
    g.fillRect(x, y, w, h);
    g.fillStyle = '#38737b';
    g.fillRect(x + 8, y + 10, w - 16, 12);
    if (panel > 0 && loaded(asset)) {
      const scaleX = asset.naturalWidth / WIDTH;
      const scaleY = asset.naturalHeight / HEIGHT;
      for (const side of [0, 1]) {
        const dest = x + side * (w - panel);
        const source = x + side * (w / 2);
        g.drawImage(asset, source * scaleX, y * scaleY, panel * scaleX, h * scaleY, dest, y, panel, h);
      }
    }
  }

  draw(time) {
    const g = this.ctx;
    g.imageSmoothingEnabled = false;
    g.textAlign = 'center';
    g.fillStyle = '#143238';
    g.fillRect(0, 0, WIDTH, HEIGHT);
    if (this.stage === 'ride') {
      this.partTwo.liftInterior('↑', PART_TWO_GIRLS);
      this.say('المصعد', 'الوجهة: كلية ثانية');
      return;
    }
    const view = this.stage === 'intro' ? 'arrival'
      : this.stage === 'caught' ? 'hall'
      : this.stage === 'complete' ? 'college' : this.stage;
    const bg = this.backgrounds[view];
    if (loaded(bg)) g.drawImage(bg, 0, 0, WIDTH, HEIGHT);
    if (this.stage === 'complete') return;

    const intro = this.stage === 'intro';
    const zoom = intro ? 1.16 - .16 * Math.min(1, Math.max(0, this.elapsed - 5.6) / 2.8) : 1;
    if (intro && zoom > 1) {
      g.save();
      g.translate(-WIDTH * (zoom - 1) * .63, -HEIGHT * (zoom - 1) * .69);
      g.scale(zoom, zoom);
      if (loaded(bg)) g.drawImage(bg, 0, 0, WIDTH, HEIGHT);
    }
    if (intro) this.drawLiftOpening();
    const people = this.girls.map(girl => ({ ...girl }));
    people.push({ id: this.character, ...this.p, moving: this.moving || intro && this.elapsed < 2.2, player: !intro });
    const introHidden = intro && this.elapsed >= INTRO_BLUSH_AT + BLUSH_TIME;
    const blushing = intro ? this.elapsed >= INTRO_BLUSH_AT : this.blush > 0;
    if (intro || this.stage === 'arrival' || view === 'hall') {
      people.push({ ...this.guide, guide: true });
      if (!introHidden && this.monsterHidden === 0) {
        people.push({ id: 0, ...this.m, monster: true, moving: true, blushing });
      }
    }
    people.sort((a, b) => a.y - b.y).forEach(person => {
      if (person.guide) this.drawGuide(time);
      else if (person.blushing && loaded(this.shyMonster)) {
        const height = 239;
        const width = height * this.shyMonster.naturalWidth / this.shyMonster.naturalHeight;
        g.drawImage(this.shyMonster, person.x * WIDTH - width / 2, person.y * HEIGHT - height, width, height);
      } else {
        const tying = person.id === this.character && (this.shoes > 0 || intro && this.elapsed >= 3.6 && this.elapsed < INTRO_BLUSH_AT);
        if (tying) {
          g.save();
          g.translate(0, person.y * HEIGHT * .28);
          g.scale(1, .72);
        }
        const height = this.stage === 'lift' ? Math.round(252 + (person.y - .77) * 130) : undefined;
        this.partTwo.person(person.id, person.x, person.y, time, !tying && person.moving, person.monster, person.player, person.blushing, height);
        if (tying) g.restore();
      }
    });
    if (intro && zoom > 1) g.restore();
    const door = DESTINATIONS[this.stage];
    if (door) {
      const x = door.x * WIDTH;
      const y = this.stage === 'lift' ? 309 : door.y * HEIGHT + 24;
      g.fillStyle = '#143b40';
      g.fillRect(x - 95, y - 14, 190, 34);
      g.fillStyle = '#ffe397';
      g.font = 'bold 22px Tahoma';
      g.fillText(door.label, x, y + 10);
    }
  }
}
