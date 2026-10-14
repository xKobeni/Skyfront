// Projectiles, player weapons, and enemy and boss attack patterns.
  function addBullet(x,y,vx,vy, damage, color, radius=4, pierce=0) {
    game.bullets.push({kind:game.selected==='warbird' && game.player.evolution==='shell'?'shell':game.selected==='nova'?'plasma':null,
      x,y,vx,vy,damage:damage*game.player.damageBoost*(game.player.dashBoost>0?1.25:1)*(game.selected==='jet' && game.player.evolution==='focus'?1.3:1),color,radius,pierce,hits:new Set()});
  }

  function addMissile(x,y,damage) {
    game.bullets.push({kind:'missile',x,y,startX:x,startY:y,vx:0,vy:-330,damage:damage*game.player.damageBoost*(game.player.dashBoost>0?1.25:1),color:'#ffc77b',radius:9,
      pierce:0,hits:new Set(),life:4,blastRadius:game.player.evolution==='cluster'?52:32});
  }

  function detonateMark(target) {
    if(!target || target.markTime<=0) return;
    target.markTime=0;target.markStacks=0;
    target.markBurstPending=true;
    burst(target.x,target.y,'#9bfff0',17,120);
    game.hitStop=Math.max(game.hitStop,.025);
    for(let i=game.enemies.length-1;i>=0;i--) {
      const e=game.enemies[i];
      if(e!==target && distanceSq(e.x,e.y,target.x,target.y)<85**2) {
        damageEnemy(e,3);if(e.hp<=0) destroyEnemy(i);
      }
    }
    game.popups.push({x:target.x,y:target.y-30,text:'MARK BURST',life:.65,maxLife:.65,color:'#adfff5'});
  }
  function markTarget(target) {
    if(!target || target.hp<=0) return;
    target.markTime=4;target.markStacks=(target.markStacks||0)+1;
    if(target.markStacks>=3) detonateMark(target);
  }
  function plasmaImpact(target) {
    if(target.markTime>0) detonateMark(target);
    else markTarget(target);
  }
  function fireLaser(x,damage) {
    damage*=game.player.damageBoost*(game.player.dashBoost>0?1.25:1)*(game.player.evolution==='overcharge'?1.35:1);
    const y=game.player.y-30;
    const width=9+game.player.weaponLevel*2+(game.player.evolution==='prism'?11:0);
    game.beams.push({x,y,life:.13,maxLife:.13,width});
    let hits=0;
    if (game.boss && game.boss.y+game.boss.radius>0 && game.boss.y<y && Math.abs(game.boss.x-x)<game.boss.radius+width) {
      hits++;
      markTarget(game.boss);
      damageBoss(game.boss,damage,x,game.boss.y+18);
      burst(x,game.boss.y,'#9bfff0',5,60);
      if (game.boss.hp<=0) destroyBoss();
    }
    for (let i=game.enemies.length-1;i>=0;i--) {
      const e=game.enemies[i];
      if (e.y+e.radius>0 && e.y<y && Math.abs(e.x-x)<e.radius+width) {
        hits++;
        markTarget(e);
        damageEnemy(e,damage);
        burst(x,e.y,'#9bfff0',3,50);
        if (e.hp<=0 && game.enemies.includes(e)) destroyEnemy(game.enemies.indexOf(e));
      }
    }
    for(const prop of [...game.mapProps]) if(prop.y<y && Math.abs(prop.x-x)<prop.radius+width) damageMapProp(prop,damage);
    if(hits>=2 && game.selected==='ray') awardMastery('LINE BREAK');
  }

  function firePlayer() {
    const p = game.player;
    const lvl = p.weaponLevel;
    const ship = game.selected;
    const speed = 660;
    if (ship === 'warbird') {
      [-15,15].forEach(x => addBullet(p.x+x, p.y-25, 0,-speed,1.5 + .22*(lvl-1), '#d4ff94',4.2));
      if (lvl >= 2) addBullet(p.x, p.y-35, 0,-speed*1.08,1.8,'#fff7c0',4.6);
      if (lvl >= 4) [-29,29].forEach(x => addBullet(p.x+x,p.y-13, x*.75, -speed*.9, 1.2,'#d4ff94',3.5));
    } else if (ship === 'jet') {
      const angles = lvl >= 2 ? [-.30,-.14,0,.14,.30] : [-.17,0,.17];
      if(p.evolution==='wide') angles.push(-.47,.47);
      angles.forEach((a,i) => addBullet(p.x,p.y-29,Math.sin(a)*speed,-Math.cos(a)*speed,.88+(lvl-1)*.14,'#8bdfff',3.5));
      if (lvl >= 4) addBullet(p.x,p.y-30,0,-speed*1.1,1.6,'#e3faff',5);
    } else if (ship === 'nova') {
      addBullet(p.x,p.y-33,0,-speed*.91,(2.85+(lvl-1)*.4)*(p.evolution==='lance'?1.4:1),'#db9bff',7,2+Math.floor(lvl/2)+(p.evolution==='lance'?2:0));
      if (lvl >= 2) [-19,19].forEach(x => addBullet(p.x+x,p.y-15,x*.8,-speed*.87,1.05,'#89f5ff',4,1));
      if (lvl >= 4) [-32,32].forEach(x => addBullet(p.x+x,p.y-6,x*1.4,-speed*.87,1.25,'#b98aff',4,1));
      if(p.evolution==='split') [-46,46].forEach(x=>addBullet(p.x+x,p.y-5,x*1.7,-speed*.84,1.8,'#c5a1ff',5,1));
    } else if (ship === 'kestrel') {
      const offsets=lvl>=4?[-23,0,23]:lvl>=2?[-17,17]:[0];
      offsets.forEach(x=>addMissile(p.x+x,p.y-30,5.2+(lvl-1)*.65));
      if(p.evolution==='swarm') [-42,42].forEach(x=>addMissile(p.x+x,p.y-15,4.2+(lvl-1)*.5));
    } else if (ship === 'ray') {
      fireLaser(p.x,4.2+(lvl-1)*.55);
      if (lvl>=2) [-21,21].forEach(x=>fireLaser(p.x+x,2.1+(lvl-2)*.3));
      if (lvl>=4) [-38,38].forEach(x=>fireLaser(p.x+x,1.4));
      if(p.evolution==='prism') [-57,57].forEach(x=>fireLaser(p.x+x,1.3));
    }
    playSound('shot');
  }

  function shootAt(x,y,speed,baseAngle=0,pattern=[0],target=game.player,color='#ff9078') {
    if (!game.player) return;
    const aim = Math.atan2(target.x-x,target.y-y) + baseAngle;
    for (const spread of pattern) {
      const angle = aim+spread;
      game.hostileBullets.push({x,y,vx:Math.sin(angle)*speed,vy:Math.cos(angle)*speed,
        radius:5.2, color});
    }
  }

  function fireEnemy(e) {
    const target = {x:e.aimX,y:e.aimY};
    const speed = 175+Math.min(game.wave*5,85);
    if(e.type==='radar'||e.type==='missile'||e.type==='generator'||e.type==='supply') return;
    if (e.type==='scout') shootAt(e.x,e.y+15,speed,0,[0],target);
    else if (e.type==='interceptor') {
      shootAt(e.x,e.y+15,speed+35,0,e.shots%2 ? [-.16,.16] : [0],target);
    } else if (e.type==='bomber') shootAt(e.x,e.y+18,speed*.85,0,[-.34,-.17,0,.17,.34],target);
    else if (e.type==='raider') shootAt(e.x,e.y+16,speed+15,0,[-.23,.23],target,'#ffc785');
    else if (e.type==='striker') {
      for (const offset of [-18,0,18]) game.hostileBullets.push({x:e.x+offset,y:e.y+17,vx:0,vy:speed+35,radius:5.5,color:'#ffd18a'});
    } else if (e.type==='drone') shootAt(e.x,e.y+17,speed+5,Math.sin(e.shots*1.4)*.22,[-.35,-.17,0,.17,.35],target,'#d6a0ff');
    else if (e.type==='skimmer') shootAt(e.x,e.y+17,speed+20,0,[-.42,.42],target,'#b8f3ff');
    else if (e.type==='shield') shootAt(e.x,e.y+18,speed*.8,0,[-.2,.2],target,'#82e7e9');
    else if (e.type==='medic') shootAt(e.x,e.y+18,speed*.7,0,[0],target,'#a4ffbc');
    else if (e.type==='ambusher') shootAt(e.x,e.y+16,speed+55,0,[0],target,'#ffdb93');
    else if (e.type==='mini') shootAt(e.x,e.y+30,speed+15,0,[-.45,-.22,0,.22,.45],target,'#ffbd7c');
    else if(e.type==='ace'||e.type==='bonusAce') shootAt(e.x,e.y+20,speed+35,0,[-.22,0,.22],target,'#ffdf9f');
    else if(e.type==='echo') shootAt(e.x,e.y+26,speed+20,0,[-.42,-.2,0,.2,.42],target,'#9ef1ff');
    else if(e.type==='flak') {
      for(let i=0;i<8;i++) {const angle=i*TAU/8+e.shots*.22;game.hostileBullets.push({x:e.x,y:e.y+12,vx:Math.sin(angle)*speed*.75,vy:Math.cos(angle)*speed*.75,radius:4.5,color:'#a8f7d7'});}
    } else if(e.type==='mine') {
      for(const offset of [-.32,0,.32]) shootAt(e.x,e.y+15,speed*.7,offset,[0],target,'#ffca89');
    } else if(e.type==='hunter') shootAt(e.x,e.y+17,speed+45,e.shots%2?.24:-.24,[-.13,0,.13],target,'#a9f7ff');
    else if(e.type==='carrier') {
      shootAt(e.x,e.y+25,speed*.8,0,[-.43,-.21,0,.21,.43],target,'#ffa978');
      if(e.shots%2===0 && game.enemies.length<12) spawnEnemy({type:'mine',x:clamp(e.x+rand(-42,42),40,W-40),y:e.y+35});
    } else if(e.type==='phase') {
      shootAt(e.x,e.y+17,speed+10,Math.sin(e.shots*.85)*.35,[-.25,0,.25],target,'#e5a7ff');
      if(e.shots%2===0) e.x0=clamp(e.x0+(e.x<W/2?55:-55),35,W-35);
    } else if(e.type==='storyMini') {
      const patterns=[[-.55,-.28,0,.28,.55],[-.42,-.2,0,.2,.42],[-.6,-.3,0,.3,.6],[-.5,-.25,0,.25,.5],[-.7,-.35,0,.35,.7]];
      shootAt(e.x,e.y+29,speed+25,Math.sin(e.shots*.65)*.18,patterns[e.miniVariant],target,['#9ef5da','#ffcb91','#b3f6ff','#ff9a6e','#dfa5ff'][e.miniVariant]);
      if(e.miniVariant===0 && e.shots%2===0) for(const side of [-1,1]) game.hostileBullets.push({x:e.x+side*35,y:e.y+10,vx:side*speed*.58,vy:speed*.55,radius:5,color:'#9ef5da'});
      if(e.miniVariant===1 && e.shots%2===0) for(const offset of [-70,70]) game.hostileBullets.push({x:clamp(e.x+offset,20,W-20),y:e.y+15,vx:0,vy:speed+40,radius:6,color:'#ffcb91'});
      if(e.miniVariant===2) for(const bullet of game.hostileBullets.slice(-5)) Object.assign(bullet,{kind:'zigzag',originX:bullet.x,age:0,amplitude:20,frequency:8});
      if(e.miniVariant===3 && e.shots%2===0 && game.enemies.length<7) spawnEnemy({type:'mine',x:e.x,y:e.y+30});
      if(e.miniVariant===4 && e.shots%2===0) {e.x0=clamp(W-e.x,60,W-60);e.x=e.x0;burst(e.x,e.y,'#dfa5ff',10,70);}
    }
    else if (e.type==='sparker') {
      shootAt(e.x,e.y+17,speed+10,0,[-.18,.18],target,'#8fd6ff');
      for (const bullet of game.hostileBullets.slice(-2)) Object.assign(bullet,{kind:'zigzag',originX:bullet.x,age:0,amplitude:22,frequency:9});
    } else shootAt(e.x,e.y+17,speed+35,0,[-.28,0,.28],target,'#ff9b6e');
    e.shots++;
    e.fireClock = (e.type==='echo'?1.1:e.type==='ace'?1.5:e.type==='mini'||e.type==='storyMini'?1.5:e.type==='bomber' ? rand(2.1,2.7) : e.type==='striker' ? rand(2,2.7) : rand(1.9,3))*(game.mode==='story'?STORY_DIFFICULTIES[game.storyDifficulty].rate:1);
  }

  function fireBoss(b) {
    checkBossPhase(b);
    const volleyStart=game.hostileBullets.length;
    const target = {x:b.aimX,y:b.aimY};
    const speed = (195+Math.min(game.wave*3,50))*(game.mode==='story'?STORY_DIFFICULTIES[game.storyDifficulty].speed:game.mode==='rush'?DIFFICULTIES[game.difficulty].speed*game.rushRisks.speed:1);
    if(b.variant==='story') {
      const c=b.chapter;
      if(c===0) {shootAt(b.x,b.y+48,speed,0,[-.55,-.3,0,.3,.55],target,'#a5f4d5');if(b.shots%2) for(const x of [W*.25,W*.75]) game.hostileBullets.push({x,y:b.y+25,vx:0,vy:speed*.85,radius:7,color:'#86e9d4'});}
      else if(c===1) {for(let x=30;x<W;x+=52) if(Math.abs(x-target.x)>65) game.hostileBullets.push({x,y:b.y+47,vx:0,vy:speed*.95,radius:5.5,color:'#ffcb8c'});shootAt(b.x,b.y+43,speed*.82,0,[-.24,.24],target,'#ffba78');}
      else if(c===2) {shootAt(b.x,b.y+48,speed+20,Math.sin(b.shots*.9)*.3,[-.48,-.24,0,.24,.48],target,'#b5fff1');for(const bullet of game.hostileBullets.slice(-5)) Object.assign(bullet,{kind:'zigzag',originX:bullet.x,age:0,amplitude:20,frequency:7});}
      else if(c===3) {for(const offset of [-65,-32,0,32,65]) game.hostileBullets.push({x:b.x+offset,y:b.y+45,vx:Math.sin(b.shots*.5)*42,vy:speed+15,radius:6,color:'#ff9a68'});if(b.shots%3===0 && game.enemies.length<3) spawnEnemy({type:'mine'});}
      else {const count=b.stage===3?12:8;for(let i=0;i<count;i++){const angle=i*TAU/count+b.shots*.3;game.hostileBullets.push({x:b.x,y:b.y+35,vx:Math.sin(angle)*speed*.8,vy:Math.cos(angle)*speed*.8,radius:5,color:'#d7a8ff'});}shootAt(b.x,b.y+48,speed+30,0,[-.15,0,.15],target,'#ffe8ff');}
    } else if(b.variant==='eclipse') {
      const count=b.stage===3?14:10;
      for(let i=0;i<count;i++) {
        const angle=i*TAU/count+b.shots*.27;
        game.hostileBullets.push({x:b.x,y:b.y+35,vx:Math.sin(angle)*speed*.72,vy:Math.cos(angle)*speed*.72,radius:5,color:'#e5a8ff'});
      }
      shootAt(b.x,b.y+47,speed+25,0,[-.16,0,.16],target,'#f6c8ff');
    } else if(b.variant==='chrono') {
      for(const offset of [-90,-45,0,45,90]) game.hostileBullets.push({x:clamp(target.x+offset,20,W-20),y:b.y+43,vx:Math.sin(b.shots*.8)*55,vy:speed+35,radius:6,color:'#93eaff'});
      shootAt(b.x,b.y+48,speed,0,[-.48,-.24,0,.24,.48],target,'#d9f8ff');
    } else if (b.zone===0) {
      shootAt(b.x,b.y+48,speed,0,b.shots%2 ? [-.62,-.42,-.22,0,.22,.42,.62] : [-.4,-.2,0,.2,.4],target);
    } else if (b.zone===1) {
      if(b.enraged && (b.lock || b.shots%2===0)) {
        for(let x=20;x<W-10;x+=34) if(Math.abs(x-b.safeX)>65)
          game.hostileBullets.push({x,y:b.y+44,vx:0,vy:speed+35,radius:5.3,color:'#ffd08c'});
      } else if (b.shots%2) shootAt(b.x,b.y+48,speed,0,[-.48,-.32,-.16,0,.16,.32,.48],target,'#ffd08c');
      else for (const offset of [-44,-22,0,22,44]) game.hostileBullets.push({x:b.x+offset,y:b.y+43,vx:0,vy:speed+30,radius:6,color:'#ffd08c'});
    } else if (b.zone===2) {
      shootAt(b.x,b.y+48,speed,Math.sin(b.shots*1.1)*.3,[-.58,-.39,-.2,0,.2,.39,.58],target,'#d59cff');
    } else if (b.zone===3) {
      if (b.shots%2) shootAt(b.x,b.y+48,speed+20,0,[-.34,-.17,0,.17,.34],target,'#bbf2ff');
      else for (const offset of [-54,-27,0,27,54]) game.hostileBullets.push({x:b.x+offset,y:b.y+42,vx:0,vy:speed+35,radius:5.8,color:'#bbf2ff'});
    } else if (b.zone===4) {
      shootAt(b.x,b.y+48,speed+10,0,[-.46,-.23,0,.23,.46],target,'#8fd6ff');
      for (const bullet of game.hostileBullets.slice(-5)) Object.assign(bullet,{kind:'zigzag',originX:bullet.x,age:0,amplitude:25,frequency:8});
    } else {
      if (b.shots%2) shootAt(b.x,b.y+48,speed+15,0,[-.7,-.52,-.35,-.17,0,.17,.35,.52,.7],target,'#ff986b');
      else for (const offset of [-45,45]) shootAt(b.x+offset,b.y+28,speed+30,0,[-.13,0,.13],target,'#ff986b');
    }
    if (b.enraged && !(b.zone===1 && (b.lock || b.shots%2===0))) {
      const colors=['#b8ffd0','#ffe091','#e6aaff','#c8f7ff','#a4dcff','#ffb18a'];
      const angle=b.shots*.42;
      const count=b.zone===2 || b.zone===4 ? 6 : 4;
      for(let i=0;i<count;i++) {
        const spread=(i-(count-1)/2)*.28+Math.sin(angle)*.32;
        game.hostileBullets.push({x:b.x,y:b.y+47,vx:Math.sin(spread)*speed*.9,vy:Math.cos(spread)*speed*.9,radius:4.2,color:colors[b.zone]});
      }
      if(b.zone===2 && b.shots%3===2 && game.enemies.length<4) spawnEnemy({type:'drone',x:clamp(b.x+rand(-90,90),40,W-40),y:b.y-60});
      if(b.zone===4 && b.shots%3===1 && !game.hazard) spawnHazard();
      if(b.zone===5 && b.shots%4===2 && game.enemies.length<4) spawnEnemy({type:'ambusher'});
    }
    if(b.stage===3) {
      const count=b.variant?8:6;
      for(let i=0;i<count;i++) {
        const angle=TAU*i/count+b.shots*.36;
        game.hostileBullets.push({x:b.x,y:b.y+37,vx:Math.sin(angle)*speed*.78,vy:Math.cos(angle)*speed*.78,radius:4.5,color:b.variant?'#ff9fe3':'#ffe394'});
      }
      if((b.variant==='eclipse'||b.zone===2) && b.shots%3===0 && game.enemies.length<3) spawnEnemy({type:'drone'});
      if((b.variant==='chrono'||b.zone===4) && b.shots%3===1 && !game.hazard) spawnHazard();
    }
    if(b.parts?.some(part=>part.kind==='cannon'&&part.broken)) {
      for(let i=game.hostileBullets.length-1;i>=volleyStart;i--) if((i-volleyStart)%3===0) game.hostileBullets.splice(i,1);
    }
    b.shots++;
    b.fireClock = Math.max(b.stage===3?.8:b.enraged?.95:1.25,(2.05-game.wave*.025)*(b.stage===3?.58:b.enraged?.72:1))*(game.mode==='story'?STORY_DIFFICULTIES[game.storyDifficulty].rate:game.mode==='rush'?DIFFICULTIES[game.difficulty].rate*game.rushRisks.rate:1)*(b.parts?.some(part=>part.kind==='engine'&&part.broken)?1.18:1);
  }

  function checkBossPhase(b) {
    if (!b || b.hp<=0 || b.lock) return;
    const next=b.stage===1 && b.hp<=b.maxHp*.66?2:b.stage===2 && b.hp<=b.maxHp*.33?3:0;
    if(!next) return;
    b.stage=next;b.enraged=true;
    b.warning=Math.max(b.warning,.85);
    game.hostileBullets.length=0;
    game.screenshake=.45;
    game.hitStop=.055;
    if(b.variant!=='story' && b.zone===2 && next===2 && game.enemies.length<4) {
      spawnEnemy({type:'drone',x:clamp(b.x-80,30,W-30),y:b.y-50});
      spawnEnemy({type:'drone',x:clamp(b.x+80,30,W-30),y:b.y-50});
    }
    if(b.zone===3 && b.variant!=='story') b.guard=true;
    if(b.variant==='eclipse') {
      const count=next===2?2:3;
      for(let i=0;i<count;i++) spawnEnemy({type:'generator',x:W*(i+1)/(count+1),y:clamp(b.y+45,85,220),order:i});
    }
    if(b.variant==='chrono' && !game.enemies.some(e=>e.type==='echo'&&e.hp>0)) spawnEnemy({type:'echo',x:W-b.x,y:b.y+12});
    if(b.zone===1 && !b.variant) {
      const left=next===2;
      b.lock={x:clamp(W*(left?.26:.74),70,W-70),y:clamp(H*.76,165,H-65),hold:0,required:game.mode==='rush'&&game.difficulty==='extreme'?1.1:.7,age:0};
      b.safeX=b.lock.x;
    }
    burst(b.x,b.y,'#ffe093',38,190);
    const cue=b.variant==='story'?[['TIDAL CROSSWIND','TWIN CURRENT'],['CANYON WALL','FALLING EMBERS'],['AURORA SWEEP','POLAR SPIRAL'],['FURNACE LINES','CORE MELTDOWN'],['VOID HALO','LAST LIGHT']][b.chapter][next-2]:next===2?['EXPOSED ENGINE','REACH THE SAFE ZONE','DRONES DEPLOYED','SHIELD CYCLING','STORM SURGE','WING AMBUSH'][b.zone]:['ACE CROSSWIND','CROSS TO THE OTHER ZONE','RIFT SWARM','FROST BARRAGE','LIGHTNING SPIRAL','EMBER NOVA'][b.zone];
    toast(`⚠ ${bossName(b)} · PHASE ${next} · ${b.variant==='eclipse'?'DESTROY GENERATORS IN ORDER':b.variant==='chrono'?'DESTROY THE FIRING ECHO':cue}`,2.5);
    playSound('boom');
  }
