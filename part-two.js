import { PartThree } from './part-three.js';
import { drawElevatorCabin, preloadElevatorCabin } from './elevator-cabin.js';
import { FloorThree } from './floor-three.js';
import{newRun,hit}from './engine.js';
import{PART_TWO_GIRLS,newPartTwo,startPartTwo,tickPartTwo,skipPartTwoShot,boardPartTwoLift}from './part-two-state.js';
const $=s=>document.querySelector(s);
const SHOTS={
 remember:['الطابق الأرضي · مو الكل طلع…','الوحش','لحظة… باقي بنات فوق بالنادي.'],
 sabotage:['الطابق الأرضي · المصعد يصعد فقط','الراوي','الوحش خرّب تحكم المصعد. الحين يطلع فوق بس.'],
 monsterRide:['الوحش راجع للنادي','الراوي','المصعد يصعد إلى الطابق الثاني…'],
 encounter:['البنات السبع الباقيات','إحدى البنات','هو قدامنا! اركضوا للمصعد!'],
 flee:['اهربوا للمصعد!','',''],
 boarding:['بسرعة… الكل يدخل!','إحدى البنات','اضغطي النزول!'],
 girlRide:['المصعد ما ينزل!','إحدى البنات','ليش قاعدين نطلع؟!'],
 arrived:['الطابق الثالث','','']
};
export class PartTwoIntro{
 constructor(options){Object.assign(this,options);preloadElevatorCabin();this.canvas=$('#partTwoCanvas');this.ctx=this.canvas.getContext('2d');this.floorThree=new FloorThree(this);this.active=false;this.bg=new Image();this.bg.src='second-floor-hall.png';this.groundBg=new Image();this.groundBg.src='elevator-lobby.png';this.state=newPartTwo();this.partThree=new PartThree(this);
  $('#beginPartThree').onclick=()=>{if(this.floorThree.stage==='complete'&&this.floorThree.active)this.partThree.start()};
  $('#partTwoStart').onclick=()=>{startPartTwo(this.state);this.run=newRun(this.state.character);this.onRun(this.run);this.sync()};
  $('#partTwoSkip').onclick=()=>{skipPartTwoShot(this.state);this.sync()};
  $('#partTwoEnter').onclick=()=>{this.target={x:.68,y:.76};this.enterOnArrival=true};
  $('#partTwoRetry').onclick=()=>{this.state.phase='flee';this.state.elapsed=0;this.sync()};
  document.querySelectorAll('[data-part-two-menu]').forEach(b=>b.onclick=()=>{this.hide();this.onMenu()});
  this.canvas.onpointerdown=e=>{if(this.partThree.active){this.partThree.point(e);return}if(this.floorThree.active){this.floorThree.setTarget(e);return}if(this.state.phase!=='flee')return;const r=this.canvas.getBoundingClientRect();this.target={x:Math.max(.08,Math.min(.93,(e.clientX-r.left)/r.width)),y:Math.max(.75,Math.min(.94,(e.clientY-r.top)/r.height))};this.enterOnArrival=false};
  const cards=$('#partTwoCards');for(const i of PART_TWO_GIRLS){let b=document.createElement('button');b.type='button';b.className='partTwoCard';b.setAttribute('aria-pressed',String(i===7));b.setAttribute('aria-label',this.names[i]);let c=document.createElement('canvas');c.width=90;c.height=125;const g=c.getContext('2d'),im=this.characters[i].userData.pixelTextures.stand.image;g.imageSmoothingEnabled=false;const width=118*im.width/im.height;g.drawImage(im,(90-width)/2,0,width,118);b.append(c);let name=document.createElement('span');name.textContent=this.names[i];b.append(name);b.onclick=()=>{this.state.character=i;[...cards.children].forEach((v,k)=>v.setAttribute('aria-pressed',String(PART_TWO_GIRLS[k]===i)))};cards.append(b)}
 }
 start(){this.partThree.hide();this.floorThree.hide();this.active=true;this.state=newPartTwo(this.state.character);this.run=newRun(this.state.character);this.onRun(this.run);this.previousPhase=null;this.target=null;this.enterOnArrival=false;this.setMode('part2');$('#partTwoScene').classList.remove('hidden');this.sync();this.draw(0)}
 hide(){this.partThree.hide();this.floorThree.hide();this.active=false;$('#partTwoScene').classList.add('hidden');$('#partTwoEnter').classList.add('hidden');$('#partTwoSkip').classList.add('hidden')}
 beginFlee(){this.p={x:.32,y:.86};this.m={x:-.16,y:.88};this.target=null;this.enterOnArrival=false;this.friends=PART_TWO_GIRLS.filter(i=>i!==this.state.character).map((i,k)=>({i,x:.19+k*.025,y:.8+(k%3)*.045,moving:true}));this.run=newRun(this.state.character);this.onRun(this.run);this.toast('المصعد على اليمين! اهربي واضغطي E عند الباب. ما فيه لغز هنا.');}
 sync(){if(this.partThree.active){this.partThree.sync();return}if(this.floorThree.active){this.floorThree.syncHud();return}const phase=this.state.phase;if(this.previousPhase!==phase&&phase==='flee')this.beginFlee();this.previousPhase=phase;const shot=SHOTS[phase];$('#partTwoTitle').textContent=shot?.[0]||'اختاري شخصية';$('#partTwoSpeaker').textContent=shot?.[1]||'';$('#partTwoLine').textContent=shot?.[2]||'';$('#partTwoCaption').classList.toggle('hidden',!shot||phase==='arrived');$('#partTwoChoose').classList.toggle('hidden',phase!=='choose');$('#partTwoCaught').classList.toggle('hidden',phase!=='caught');$('#partTwoSkip').classList.toggle('hidden',!['remember','sabotage','monsterRide','encounter'].includes(phase));$('#partTwoEnter').classList.toggle('hidden',phase!=='flee');$('#hud').classList.toggle('hidden',phase!=='flee');$('#goal').textContent='اهربي مع البنات السبع للمصعد';$('#goalSub').textContent='المصعد يمين · E للدخول · بدون لغز';$('#keyCount').textContent='الطابق الثاني';$('#pauseHelp').textContent='اهربي إلى المصعد على اليمين. اضغطي E عند بابه أو زر دخول المصعد. المصعد يصعد تلقائيًا، واللغز سيكون في الطابق الثالث.';if(phase==='arrived'){this.target=null;this.enterOnArrival=false;try{localStorage.setItem('ijagPartTwoReached','3')}catch{}this.floorThree.start(this.state.character)}}
 interact(){if(this.partThree.active){this.partThree.interact();return}if(this.floorThree.active){this.floorThree.interact();return}if(!this.active||this.state.phase!=='flee')return;if(boardPartTwoLift(this.state,this.p)){this.target=null;this.tone(700,.2);this.sync()}else this.toast('اقتربي من المصعد على اليمين، ثم اضغطي E.')}
 update(dt,time){if(!this.active)return;if(this.partThree.active){this.partThree.update(dt,time);return}if(this.floorThree.active){this.floorThree.update(dt,time);return}const phase=this.state.phase;if(tickPartTwo(this.state,dt))this.sync();if(this.floorThree.active)return;if(phase==='flee'&&this.state.phase==='flee'){
   const input=this.getInput(),r=this.run;r.time+=dt;for(const k of ['immune','dashCooldown','dashTime'])r[k]=Math.max(0,r[k]-dt);
   let dx=(input.keys.d||input.keys.arrowright?1:0)-(input.keys.a||input.keys.arrowleft?1:0)+input.stick.x,dy=(input.keys.s||input.keys.arrowdown?1:0)-(input.keys.w||input.keys.arrowup?1:0)+input.stick.z,n=Math.hypot(dx,dy);
   if(n>.1){dx/=n;dy/=n;this.target=null;this.enterOnArrival=false}else if(this.target){dx=this.target.x-this.p.x;dy=(this.target.y-this.p.y)*.5625;n=Math.hypot(dx,dy);if(n<.008){this.target=null;n=0;if(this.enterOnArrival)this.interact()}else{dx/=n;dy/=n}}
   this.moving=n>.1||!!this.target;const sprint=(input.keys.shift||input.run)&&r.stamina>1,speed=r.dashTime>0?.48:sprint?.23:.15;
   if(this.moving){this.p.x=Math.max(.08,Math.min(.93,this.p.x+dx*speed*dt));this.p.y=Math.max(.75,Math.min(.94,this.p.y+dy*speed*dt*1.78))}r.stamina=Math.max(0,Math.min(100,r.stamina+dt*(this.moving&&sprint?-22:14)));
   if(this.enterOnArrival&&Math.abs(this.p.x-.68)<.02&&this.p.y<.8)this.interact();
   if(this.state.phase==='flee'){const mx=this.p.x-this.m.x,my=(this.p.y-this.m.y)*.5625,d=Math.hypot(mx,my);if(d>.001){this.m.x+=mx/d*.09*dt;this.m.y+=my/d*.09*dt*1.78}if(d<.035&&r.immune<=0){if(hit(r)){this.state.phase='caught';this.sync()}else this.toast('الوحش قرب! اركضي للمصعد!')}$('#danger i').style.width=Math.max(0,100-d*230)+'%';}
   this.friends.forEach((f,k)=>{const tx=Math.max(.08,this.p.x-.045-k*.022+Math.sin(time*1.2+k)*.016),ty=Math.min(.94,this.p.y+(k%2?-.035:.035)),dx=tx-f.x,dy=ty-f.y,d=Math.hypot(dx,dy);f.moving=d>.008;if(f.moving){const step=Math.min(d,dt*.2);f.x+=dx/d*step;f.y+=dy/d*step}});
   $('#hearts').textContent='♥ '.repeat(r.health)+'♡ '.repeat(3-r.health);$('#staminaFill').style.width=r.stamina+'%';$('#dashText').textContent=r.dashCooldown>0?'الاندفاع بعد '+Math.ceil(r.dashCooldown)+'ث':'اندفاع جاهز';
  }this.draw(time)}
 person(i,x,y,time,moving=false,monster=false,player=false,blushing=false,height=monster?276:205){const g=this.ctx,d=this.characters[i].userData,k=Math.floor(time*11+i)%8,im=monster?d.monsterFrames[k]:moving?d.walkFrames[k]:d.pixelTextures.stand.image,h=height,w=h*im.width/im.height,px=x*1680,py=y*945;g.fillStyle='#12352b44';g.beginPath();g.ellipse(px,py,w*.35,8,0,0,7);g.fill();g.drawImage(im,px-w/2,py-h,w,h);if(blushing){g.fillStyle='#f68eaa';for(const cheek of [-.043,.066]){g.fillRect(Math.round(px+w*cheek)-5,Math.round(py-h*.775),11,5)}}if(player){g.fillStyle='#ffde71';g.fillRect(px-6,py-h-16,12,8)}}
 liftInterior(display, passengers){drawElevatorCabin(this.ctx,this.characters,passengers,display)}
 draw(time){const g=this.ctx,phase=this.state.phase;g.imageSmoothingEnabled=false;g.textAlign='center';g.fillStyle='#163336';g.fillRect(0,0,1680,945);
  if(['monsterRide','girlRide','arrived'].includes(phase)){const floor=phase==='monsterRide'?(this.state.elapsed<1?'٠':this.state.elapsed<2?'١':'٢'):phase==='arrived'?'٣':this.state.elapsed<1.5?'٢':'٣';this.liftInterior('↑ '+floor,phase==='monsterRide'?[0]:PART_TWO_GIRLS);return}
  if(['remember','sabotage'].includes(phase)){
   // Return to the actual ground-floor lobby where the first group escaped.
   // Camera zoom follows the monster; the elevator is part of the artwork.
   const q=Math.min(1,this.state.elapsed/3),scale=phase==='remember'?1+q*.45:1.45,focusX=phase==='remember'?.33+q*.07:.40+q*.22,focusY=.69;
   g.save();g.translate(Math.max(1680*(1-scale),Math.min(0,840-focusX*1680*scale)),Math.max(945*(1-scale),Math.min(0,560-focusY*945*scale)));g.scale(scale,scale);
   if(this.groundBg.complete&&this.groundBg.naturalWidth)g.drawImage(this.groundBg,0,0,1680,945);
   if(phase==='remember')this.person(0,.33+q*.03,.86,time,false,true);
   else{this.person(0,.36+q*.30,.86-q*.13,time,true,true);g.fillStyle='#153b3a';g.fillRect(1100,325,70,27);g.fillStyle='#ffe49a';g.font='bold 21px Tahoma';g.fillText('↑ ٢',1135,347);if(q>.65){g.fillStyle='#a63338';g.fillRect(1232,455,27,46);g.fillStyle='#ffe0a1';g.font='20px Tahoma';g.fillText('↓ ×',1245,486)}}
   g.restore();return;
  }
  if(this.bg.complete&&this.bg.naturalWidth)g.drawImage(this.bg,0,0,1680,945);
  if(phase==='choose'){g.fillStyle='#082326b8';g.fillRect(0,0,1680,945);return}
  // Use the existing right-hand elevator, never paint another set of doors.
  g.fillStyle='#153c3c';g.fillRect(1098,343,90,33);g.fillStyle='#ffe49a';g.font='bold 24px Tahoma';g.fillText('↑ ٣',1143,369);
  g.fillStyle='#173f3a';g.fillRect(25,630,180,45);g.fillStyle='#fff0bc';g.font='25px Tahoma';g.fillText('← النادي',115,663);
  if(phase==='encounter'){PART_TWO_GIRLS.forEach((i,k)=>this.person(i,.14+k*.047,.84+(k%2)*.06,time,true));this.person(0,.68,.77,time,true,true);return}
  if(['flee','boarding','caught'].includes(phase)){const board=phase==='boarding',q=board?Math.min(1,this.state.elapsed/1.5):0;let people=this.friends.map(f=>({...f,x:f.x+(.68-f.x)*q,y:f.y+(.73-f.y)*q}));people.push({i:this.state.character,x:this.p.x+(.68-this.p.x)*q,y:this.p.y+(.73-this.p.y)*q,moving:this.moving,player:true});people.push({i:0,...this.m,moving:true,monster:true});people.sort((a,b)=>a.y-b.y).forEach(p=>this.person(p.i,p.x,p.y,time,board||p.moving,p.monster,p.player));if(board){g.fillStyle='#122f3880';g.fillRect(0,0,1680,945)}}
 }
}
