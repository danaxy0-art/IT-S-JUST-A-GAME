import { newRun } from './engine.js';

const WIDTH = 1680;
const HEIGHT = 945;
const HERO = 2;
const FRIEND = 0;
const HERO_HEIGHT = 254;
const TV_DOCK = { x: .48, y: .588 };
const GUIDE = { x: .78, y: .76 };
const MONSTER = { x: .70, y: .84 };
const $ = selector => document.querySelector(selector);

const SCENES = {
  reveal: { room: 'lobby', speaker: 'صاحبة البني', line: 'لقيت العلاج! أعرف وش بيرجّع صديقتنا. لازم أرجع لغرفة اللعب أول.', action: 'روحي للمصعد', next: 'lobby' },
  lobby: { room: 'lobby', speaker: 'البهو', line: 'غرفة اللعب بالطابق الثاني. خذي المصعد اللي على اليمين.', goal: { x: .68, y: .76 }, action: 'ادخلي المصعد', next: 'rideToGame' },
  rideToGame: { speaker: 'المصعد', line: 'الطابق الثاني…', duration: 2.5, next: 'gameRoom' },
  gameRoom: { room: 'game', speaker: 'صاحبة البني', line: 'هنا كنا نلعب سوا… خلّيني أشيّك عند التلفزيون.', goal: { x: .445, y: .77 }, action: 'اسحبي اللي تحت التلفزيون', next: 'retrieve' },
  retrieve: { room: 'game', speaker: 'صاحبة البني', line: 'هذا هو! السويتش اللي كنا نلعب فيه.', duration: 1.55, next: 'returnToLift' },
  returnToLift: { room: 'game', speaker: 'صاحبة البني', line: 'الحين أرجع للمصعد وأطلع لها بالطابق الثالث.', goal: { x: .94, y: .87 }, action: 'ارجعي للمصعد', next: 'secondFloor' },
  secondFloor: { room: 'secondFloor', speaker: 'الطابق الثاني', line: 'اطلعي للطابق الثالث ومعك السويتش.', goal: { x: .68, y: .76 }, action: 'اطلعي للطابق الثالث', next: 'rideToGuide' },
  rideToGuide: { speaker: 'المصعد', line: 'الطابق الثالث…', duration: 2.8, next: 'arrival' },
  arrival: { room: 'arrival', speaker: 'صاحبة البني', line: 'الوحش مو هنا… خلّيني أسألها.', goal: { x: .72, y: .77 }, action: 'اسأليها عن الوحش', next: 'ask' },
  ask: { room: 'arrival', speaker: 'صاحبة البني', line: 'أنتِ شفتي الوحش؟', action: 'اسمعي ردّها', next: 'laces' },
  laces: { room: 'arrival', speaker: 'الشخصية الجديدة', english: 'Tie your shoes.', action: 'اربطي الجزمة', next: 'tying' },
  tying: { room: 'arrival', speaker: 'صاحبة البني', line: 'دقيقة… خليني أربطها.', duration: 2, next: 'point' },
  point: { room: 'arrival', speaker: 'الشخصية الجديدة', line: 'راح يمين، آخر الممر. بتلقينه هناك.', action: 'اتبعي إشارتها', next: 'follow' },
  follow: { room: 'arrival', speaker: 'صاحبة البني', line: 'آخر الممر، على اليمين…', goal: { x: .94, y: .79 }, action: 'ادخلي آخر الممر', next: 'meet' },
  meet: { room: 'office', speaker: 'صاحبة البني', line: 'أنا جيت عشانك. شوفي وش جبت لك… لعبتك اللي تحبّينها.', goal: { x: .57, y: .85 }, action: 'عطيها السويتش', next: 'handoff' },
  handoff: { room: 'office', speaker: 'صاحبة البني', line: 'تتذكرين يوم كنا نلعب سوا؟', duration: 2.7, next: 'reunited' },
  reunited: { room: 'office', speaker: 'صديقتهم', line: 'إيه… تذكّرتكم. نلعب جولة ثانية؟', action: 'كمّلي للنهاية', next: 'complete' },
  complete: { room: 'office' }
};

function loadImage(filename) {
  const image = new Image();
  image.src = '' + filename;
  return image;
}

function ready(image) {
  return image?.complete && image.naturalWidth > 0;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, (a.y - b.y) * HEIGHT / WIDTH);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export class PartThree {
  constructor(host) {
    this.host = host;
    this.ctx = host.ctx;
    this.active = false;
    this.images = {
      lobby: host.groundBg,
      secondFloor: host.bg,
      game: loadImage('part-three-game-room.png'),
      arrival: host.floorThree.backgrounds.arrival,
      office: host.floorThree.backgrounds.office
    };
    this.console = loadImage('part-three-switch.png');
    this.action = $('#partThreeAction');
    this.action.onclick = () => this.interact(true);
  }

  start() {
    this.active = true;
    this.hasSwitch = false;
    this.host.floorThree.hide();
    this.run = newRun(HERO);
    this.host.onRun(this.run);
    this.player = { x: .24, y: .85 };
    this.camera = { x: 0, y: 0, zoom: 1 };
    this.setScene('reveal');
    this.draw(0);
  }

  hide() {
    if (this.active) $('#restart').textContent = 'إعادة من اختيار الشخصية';
    this.active = false;
    for (const id of ['partThreeCaption', 'partThreeAction', 'partThreeWin']) $('#' + id).classList.add('hidden');
    document.body.classList.remove('partThreeActive');
    $('#partTwoScene').setAttribute('aria-label', 'الجزء الثاني · البنات السبع الباقيات');
    this.host.canvas.setAttribute('aria-label', 'الجزء الثاني بالبكسل، من عودة الوحش إلى الهروب للكلية الثانية');
  }

  setScene(phase) {
    this.phase = phase;
    this.elapsed = 0;
    this.target = null;
    this.autoInteract = false;
    this.moving = false;
    if (phase === 'gameRoom') this.player = { x: .84, y: .87 };
    if (phase === 'returnToLift') this.hasSwitch = true;
    if (phase === 'secondFloor') this.player = { x: .32, y: .86 };
    if (phase === 'arrival') this.player = { x: .62, y: .76 };
    if (phase === 'meet') this.player = { x: .33, y: .87 };
    if (phase === 'laces') this.host.speak?.(SCENES.laces.english);
    this.sync();
  }

  sync() {
    const scene = SCENES[this.phase];
    const paused = !$('#pauseOverlay').classList.contains('hidden');
    document.body.classList.toggle('partThreeActive', this.active);
    $('#partTwoScene').setAttribute('aria-label', 'الجزء الثالث · رجعة صديقتنا');
    this.host.canvas.setAttribute('aria-label', 'صاحبة البني ترجع لصديقتها ومعها السويتش');
    $('#partThreeCaption').classList.toggle('hidden', !(scene.line || scene.english) || paused);
    $('#partThreeSpeaker').textContent = scene.speaker || '';
    $('#partThreeLine').textContent = scene.line || '';
    $('#partThreeLine').classList.toggle('hidden', !scene.line);
    $('#partThreeEnglish').textContent = scene.english || '';
    $('#partThreeEnglish').classList.toggle('hidden', !scene.english);
    this.action.classList.toggle('hidden', !scene.action || paused);
    this.action.textContent = scene.action ? scene.action + ' · E' : '';
    $('#partThreeWin').classList.toggle('hidden', this.phase !== 'complete');
    $('#hud').classList.toggle('hidden', !scene.goal || paused);
    $('#restart').textContent = 'إعادة الجزء الثالث';
    $('#pauseHelp').textContent = 'تحرّكي بالأسهم أو بلمس الأرض. اضغطي E عند العلامة أو اضغطي الزر عشان تروحين لها.';
  }

  point(event) {
    const goal = SCENES[this.phase].goal;
    if (!goal) return;
    const rect = this.host.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * WIDTH / rect.width - this.camera.x) / (WIDTH * this.camera.zoom);
    const y = ((event.clientY - rect.top) * HEIGHT / rect.height - this.camera.y) / (HEIGHT * this.camera.zoom);
    this.autoInteract = false;
    this.target = { x: clamp(x, .09, .95), y: clamp(y, .70, .94) };
  }

  interact(approach = false) {
    const scene = SCENES[this.phase];
    if (!scene.action || !$('#pauseOverlay').classList.contains('hidden')) return;
    if (scene.goal && distance(this.player, scene.goal) > .047) {
      if (approach) {
        this.target = scene.goal;
        this.autoInteract = true;
      } else {
        this.host.toast('اقتربي من العلامة واضغطي E، أو اضغطي زر التفاعل.');
      }
      return;
    }
    this.host.tone(600, .10);
    this.setScene(scene.next);
  }

  move(dt) {
    const { keys, stick } = this.host.getInput();
    let dx = Number(!!(keys.d || keys.arrowright)) - Number(!!(keys.a || keys.arrowleft)) + stick.x;
    let dy = Number(!!(keys.s || keys.arrowdown)) - Number(!!(keys.w || keys.arrowup)) + stick.z;
    if (Math.hypot(dx, dy) > .1) {
      this.target = null;
      this.autoInteract = false;
    } else if (this.target) {
      dx = this.target.x - this.player.x;
      dy = (this.target.y - this.player.y) * HEIGHT / WIDTH;
    } else {
      dx = dy = 0;
    }
    const length = Math.hypot(dx, dy);
    this.moving = length > (this.target ? .005 : .1);
    if (this.moving) {
      const speed = this.target ? Math.min(length, dt * .25) : dt * .19;
      this.player.x = clamp(this.player.x + dx / length * speed, .09, .95);
      this.player.y = clamp(this.player.y + dy / length * speed * WIDTH / HEIGHT, .70, .94);
    }
    if (this.autoInteract && distance(this.player, SCENES[this.phase].goal) <= .041) this.interact();
  }

  update(dt, time) {
    const scene = SCENES[this.phase];
    this.elapsed += dt;
    if (scene.duration && this.elapsed >= scene.duration) this.setScene(scene.next);
    else if (scene.goal) this.move(dt);
    const zoom = 1.14;
    const follow = Math.min(1, dt * 6);
    this.camera.zoom += (zoom - this.camera.zoom) * follow;
    const x = clamp(WIDTH * .55 - this.player.x * WIDTH * zoom, WIDTH * (1 - zoom), 0);
    const y = clamp(HEIGHT * .77 - this.player.y * HEIGHT * zoom, HEIGHT * (1 - zoom), 0);
    this.camera.x += (x - this.camera.x) * follow;
    this.camera.y += (y - this.camera.y) * follow;
    this.draw(time);
  }

  drawSwitch(x, y, width) {
    if (!ready(this.console)) return;
    // Skip the transparent margins so the prop fits the girl's hand.
    const height = width * 664 / 1656;
    this.ctx.drawImage(this.console, 163, 57, 1656, 664,
      Math.round(x - width / 2), Math.round(y - height / 2), width, height);
  }

  draw(time) {
    const scene = SCENES[this.phase];
    const g = this.ctx;
    g.imageSmoothingEnabled = false;
    if (this.phase === 'rideToGame' || this.phase === 'rideToGuide') {
      const floor = this.phase === 'rideToGame' ? (this.elapsed < 1 ? '١' : '٢') : (this.elapsed < 1.2 ? '٢' : '٣');
      this.host.liftInterior('↑ ' + floor, [HERO]);
      if (this.hasSwitch) this.drawSwitch(WIDTH * .533, HEIGHT * .743, 115);
      return;
    }

    g.fillStyle = '#17373a';
    g.fillRect(0, 0, WIDTH, HEIGHT);
    g.save();
    g.translate(this.camera.x, this.camera.y);
    g.scale(this.camera.zoom, this.camera.zoom);
    const background = this.images[scene.room];
    if (ready(background)) g.drawImage(background, 0, 0, WIDTH, HEIGHT);

    if (scene.room === 'game') this.drawDock();
    if (scene.room === 'arrival') this.drawGuide();
    if (scene.goal || this.phase === 'point') this.drawMarker(scene.goal ?? SCENES.follow.goal, time);

    const restored = this.phase === 'reunited' || this.phase === 'complete';
    if (scene.room === 'office') this.drawFriend(time, restored);
    this.drawHero(time, restored);
    if (this.phase === 'retrieve') this.drawPickup();
    g.restore();
  }

  drawDock() {
    const x = TV_DOCK.x * WIDTH;
    const y = TV_DOCK.y * HEIGHT;
    const g = this.ctx;
    g.fillStyle = '#191f24';
    g.fillRect(x - 44, y - 24, 88, 24);
    g.fillStyle = '#475158';
    g.fillRect(x - 42, y - 24, 84, 5);
    g.fillStyle = '#80d9aa';
    g.fillRect(x - 35, y - 11, 4, 4);
  }

  drawPickup() {
    const { x, y } = this.player;
    const handX = x * WIDTH + 53;
    const handY = y * HEIGHT - 100;
    const lift = clamp(this.elapsed / .55, 0, 1);
    const transfer = clamp((this.elapsed - .62) / .75, 0, 1);
    const dockX = TV_DOCK.x * WIDTH;
    const dockY = TV_DOCK.y * HEIGHT - 25 - 48 * lift;
    const propX = dockX + (handX - dockX) * transfer;
    const propY = dockY + (handY - dockY) * transfer;
    this.drawSwitch(propX, propY, 90);
    this.ctx.fillStyle = '#dba179';
    this.ctx.fillRect(Math.round(propX - 30), Math.round(propY + 12), 14, 10);
  }

  drawGuide() {
    const image = this.host.floorThree.guideArt;
    if (!ready(image)) return;
    const height = 250;
    const width = height * image.naturalWidth / image.naturalHeight;
    const x = GUIDE.x * WIDTH;
    const y = GUIDE.y * HEIGHT;
    this.ctx.drawImage(image, x - width / 2, y - height, width, height);
    if (this.phase === 'point' || this.phase === 'follow') {
      this.ctx.fillStyle = '#ffe9a2';
      this.ctx.font = 'bold 58px monospace';
      this.ctx.fillText('→', x + 56, y - 160);
    }
  }

  drawMarker(goal, time) {
    const x = goal.x * WIDTH;
    const y = goal.y * HEIGHT;
    const offset = Math.round(4 * Math.sin(time * 5));
    const g = this.ctx;
    g.fillStyle = '#173c3c90';
    g.fillRect(x - 26, y - 4, 52, 10);
    g.fillStyle = '#ffda77';
    g.fillRect(x - 10, y - 40 + offset, 20, 9);
    g.fillRect(x - 5, y - 31 + offset, 10, 7);
  }

  drawHero(time, restored) {
    const { x, y } = this.player;
    const g = this.ctx;
    g.save();
    if (this.phase === 'tying') {
      const bend = Math.min(1, this.elapsed * 5, (2 - this.elapsed) * 5) * .36;
      g.translate(0, y * HEIGHT * bend);
      g.scale(1, 1 - bend);
    }
    this.host.person(HERO, x, y, time, this.moving, false, false, false, HERO_HEIGHT);
    if (this.phase === 'tying') {
      const motion = Math.round(Math.sin(this.elapsed * 15) * 5);
      g.fillStyle = '#f0c39b';
      g.fillRect(Math.round(x * WIDTH - 20 + motion), Math.round(y * HEIGHT - 24), 13, 10);
      g.fillRect(Math.round(x * WIDTH + 6 - motion), Math.round(y * HEIGHT - 22), 13, 10);
      g.fillStyle = '#fff0cf';
      g.fillRect(Math.round(x * WIDTH - 13), Math.round(y * HEIGHT - 13), 24, 4);
    }
    if (this.hasSwitch && !restored) {
      const progress = this.phase === 'handoff' ? Math.min(1, this.elapsed / 1.15) : 0;
      const propX = x * WIDTH + 53 + (MONSTER.x * WIDTH - 41 - x * WIDTH - 53) * progress;
      const propY = y * HEIGHT - 100 + (MONSTER.y * HEIGHT - 112 - y * HEIGHT + 100) * progress;
      this.drawSwitch(propX, propY, 90);
      if (progress === 0) {
        g.fillStyle = '#dba179';
        g.fillRect(Math.round(propX - 30), Math.round(propY + 12), 14, 10);
      }
    }
    g.restore();
    if (restored) this.drawSwitch(MONSTER.x * WIDTH - 36, MONSTER.y * HEIGHT - 101, 91);
  }

  drawFriend(time, restored) {
    const changing = this.phase === 'handoff';
    const progress = changing ? clamp((this.elapsed - 1.25) / 1.25, 0, 1) : Number(restored);
    const g = this.ctx;
    g.save();
    if (progress < 1) {
      g.globalAlpha = 1 - progress;
      this.host.person(FRIEND, MONSTER.x, MONSTER.y, 0, false, true);
    }
    if (progress > 0) {
      g.globalAlpha = progress;
      this.host.person(FRIEND, MONSTER.x, MONSTER.y, time, false, false, false, false, HERO_HEIGHT);
    }
    g.restore();
    if (changing && progress > 0 && progress < 1) {
      g.fillStyle = '#ffe6a6';
      for (let i = 0; i < 10; i++) {
        const angle = i * Math.PI / 5;
        const radius = 55 + progress * 117;
        g.fillRect(Math.round(MONSTER.x * WIDTH + Math.cos(angle) * radius), Math.round(MONSTER.y * HEIGHT - 135 + Math.sin(angle) * radius), 8, 8);
      }
    }
  }
}
