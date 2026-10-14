// Hit effects, damage, destruction, and missile impacts.
  function burst(x,y,color,count=13,force=145) {
    if(count>=30 && game.rings.length<18) game.rings.push({x,y,radius:8,life:.48,maxLife:.48,color});
    const remaining = Math.max(0, 550-game.particles.length);
    for (let i=0;i<Math.min(count,remaining);i++) {
      const angle=rand(0,TAU), speed=rand(force*.2,force);
      game.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
        life:rand(.22,.8), maxLife:.8, size:rand(1.5,4.7),color});
    }
  }

  function markHit(target,damage) {
    target.hitTime=.14;
    if(target===game.boss) checkBossPhase(target);
    if(target.lastHitPopup===undefined || game.time-target.lastHitPopup>.14) {
      game.popups.push({x:target.x+rand(-12,12),y:target.y-18,text:`-${Math.ceil(damage)}`,life:.55,maxLife:.55,color:'#fff2bf'});
      target.lastHitPopup=game.time;
    }
  }

  function damageEnemy(e,amount) {
    if(e.markBurstPending) {amount+=3;e.markBurstPending=false;}
    if(e.type==='generator' && game.enemies.some(other=>other.type==='generator' && other.hp>0 && other.order<e.order)) return 0;
    const protectedBy=game.enemies.some(other=>other!==e && other.type==='shield' && other.hp>0 && distanceSq(other.x,other.y,e.x,e.y)<105**2);
    const dealt=protectedBy?amount*.55:amount;
    const before=e.hp;
    e.hp-=dealt;
    if(!e.armorBroken && e.maxHp>=10 && before>e.maxHp*.5 && e.hp<=e.maxHp*.5) {
      e.armorBroken=true;game.hitStop=Math.max(game.hitStop,.035);
      burst(e.x,e.y,'#c8f5ff',17,100);playSound('armor');
      game.popups.push({x:e.x,y:e.y-28,text:'ARMOR BREAK',life:.65,maxLife:.65,color:'#c8f5ff'});
    }
    if(game.player && (game.player.lastMomentumHit??-1)<game.time-.13) {gainMomentum(1.5);game.player.lastMomentumHit=game.time;}
    markHit(e,dealt);
    return dealt;
  }

  function bossWeakPoint(b) { return {x:b.x+Math.sin(b.age*1.8)*31,y:b.y+18}; }
  function damageBoss(b,amount,x=b.x,y=b.y) {
    if(b.lock) return 0;
    if(b.variant==='eclipse' && game.enemies.some(e=>e.type==='generator' && e.hp>0)) return 0;
    if(b.markBurstPending) {amount+=3;b.markBurstPending=false;}
    const part=b.parts?.find(part=>!part.broken && distanceSq(x,y,b.x+part.dx,b.y+part.dy)<22**2);
    if(part) {
      part.hp-=amount;
      burst(b.x+part.dx,b.y+part.dy,'#ffe1a1',4,60);
      if(part.hp<=0) {
        part.broken=true;game.hitStop=.07;game.screenshake=.5;
        burst(b.x+part.dx,b.y+part.dy,'#ffb16e',35,180);
        const awarded=addScore(300);gainMomentum(18);
        toast(`${part.kind.toUpperCase()} BROKEN · +${awarded}`,2);
        playSound('impact');
      }
      return amount;
    }
    let multiplier=1;
    if(b.enraged && b.zone===0) {
      const weak=bossWeakPoint(b);
      if(distanceSq(x,y,weak.x,weak.y)<27**2) multiplier=1.65;
    }
    if(b.enraged && b.zone===3 && b.guard) multiplier*=.45;
    if(b.variant==='chrono' && game.enemies.some(e=>e.type==='echo' && e.hp>0)) multiplier*=.42;
    let dealt=amount*multiplier;
    if(b.stage<3) {
      const threshold=b.maxHp*(b.stage===1?.66:.33);
      dealt=Math.min(dealt,Math.max(0,b.hp-threshold));
    }
    b.hp-=dealt;
    if(game.player && (game.player.lastMomentumHit??-1)<game.time-.13) {gainMomentum(2);game.player.lastMomentumHit=game.time;}
    markHit(b,dealt);
    return dealt;
  }

  function damagePlayer(amount=1) {
    const p = game.player;
    if (p.invulnerable > 0) return;
    if (game.selected==='warbird' && p.abilityTime>0) {
      burst(p.x,p.y,'#c8f56c',10,95);
      p.invulnerable=.25;
      return;
    }
    p.momentum=Math.max(0,p.momentum-25);
    const shielded=p.shield>0;
    if (shielded) { p.shield--; burst(p.x,p.y,'#89dfff',15,160); }
    else { p.hp-=amount; burst(p.x,p.y,'#ffb981',18,180); }
    game.combo=0;game.comboClock=0;
    game.hitFlash=.2;
    $('screenFlash').classList.add('show');
    game.popups.push({x:p.x,y:p.y-25,text:shielded?'SHIELD HIT':`-${amount} HULL`,life:.9,maxLife:.9,color:'#ffbc9b'});
    game.screenshake = .2;
    p.invulnerable = 1.1;
    playSound(shielded?'armor':'hit');
    if (p.hp <= 0) endGame();
  }

  function destroyEnemy(index) {
    const e = game.enemies[index];
    if(!e) return;
    scoreKill(e.score,e.x,e.y);
    game.kills++;
    if(game.selected==='warbird' && distanceSq(e.x,e.y,game.player.x,game.player.y)<180**2) awardMastery('CLOSE PASS');
    burst(e.x,e.y,e.type==='mini'||e.type==='storyMini'?'#ffe197':e.type==='bomber' ? '#ffcf82' : '#ff9676',e.type==='mini'||e.type==='storyMini'?38:e.type==='bomber'?25:14,e.type==='mini'||e.type==='storyMini'?240:e.type==='bomber'?190:135);
    if(e.type==='mini') {
      game.miniBossKills++;
      spawnPickup(e.x,e.y,game.player.weaponLevel<3?'power':'shield');
      toast(game.miniBossKills>=3 && unlockPaint('chrome')?'CHROME PAINT UNLOCKED':'MINI-BOSS DOWN · REWARDS DROPPED',2);
    } else if(e.type==='supply'||e.type==='bonusAce') {
      spawnPickup(e.x,e.y,'power');spawnPickup(e.x+28,e.y,'shield');
      addScore(650);gainMomentum(14);toast('BONUS TARGET DOWN · RARE CARGO',2);
    } else if (Math.random()<.07) spawnPickup(e.x,e.y);
    playSound('boom');
    game.enemies.splice(index,1);
    if(e.type==='storyMini') {game.storyMiniDefeated=true;game.storyAdvancePending=true;game.rings.push({x:e.x,y:e.y,radius:20,life:.75,maxLife:.75,color:'#ffe0a0'});return;}
    if(e.leader) {
      for(const member of game.enemies) if(member.leaderId===e.id) {member.formation=null;member.warning=0;member.fireClock=Math.max(member.fireClock,1.6);}
      gainMomentum(12);addScore(250);
      game.hitStop=.035;toast('LEADER DOWN · FORMATION BROKEN',1.6);
    }
    if(game.objective?.enemyId===e.id) finishObjective(true);
  }

  function destroyBoss() {
    const b = game.boss;
    if (!b) return;
    const bonus = (3500 + Math.max(0,game.wave-3)*140)*(b.variant?1.5:1);
    const awarded=scoreKill(bonus,b.x,b.y);
    if(game.wingman?.hp>0) {addScore(500);toast('WINGMAN SURVIVED · +500',1.5);}
    game.wingman=null;
    game.kills++;
    game.screenshake=.65;
    for (let i=0;i<7;i++) burst(b.x+rand(-65,65),b.y+rand(-45,45),'#ffb37c',24,240);
    spawnPickup(b.x-37,b.y,'power'); spawnPickup(b.x+37,b.y,'shield');
    game.boss=null; game.waveTime=0;
    game.hostileBullets.length = 0;
    game.enemies.length=0;
    game.hazard=null;game.hazardClock=6;
    playSound('death');
    if(game.mode==='story') {completeStoryStage();return;}
    if (game.mode!=='endless' && game.wave>=MODES[game.mode].waves) {
      endGame(true);
    } else if (game.mode==='rush') {
      game.wave++;
      $('zoneName').textContent=currentZone().name;
      $('hudZoneName').textContent=currentZone().name;
      game.intermission=2.5;
      offerPact();
    } else {
      game.wave++;game.spawnClock=2.5;game.formationClock=8;
      setupMapProps();
      $('zoneName').textContent=currentZone().name;
      $('hudZoneName').textContent=currentZone().name;
      if(!maybeOfferUpgrade()) toast(`COMMANDER DOWN · WAVE ${pad(game.wave,2)} INBOUND`,2);
    }
  }

  function steerMissile(b,dt) {
    let target=game.boss && game.boss.y+game.boss.radius>0 ? game.boss : null;
    let nearest=target?distanceSq(b.x,b.y,target.x,target.y):Infinity;
    for (const e of game.enemies) {
      if (e.y+e.radius<=0) continue;
      const distance=distanceSq(b.x,b.y,e.x,e.y)*(e.markTime>0?.45:1);
      if (distance<nearest) { nearest=distance; target=e; }
    }
    if (!target) return;
    const dx=target.x-b.x, dy=target.y-b.y, length=Math.hypot(dx,dy)||1;
    const turn=Math.min(1,dt*3.7), speed=360;
    b.vx+=(dx/length*speed-b.vx)*turn;
    b.vy+=(dy/length*speed-b.vy)*turn;
    const velocity=Math.hypot(b.vx,b.vy)||1;
    b.vx=b.vx/velocity*speed; b.vy=b.vy/velocity*speed;
  }

  function explodeMissile(b) {
    burst(b.x,b.y,'#ffc77b',22,150);
    game.screenshake=Math.max(game.screenshake,.1);
    let hit=false;
    for(const prop of [...game.mapProps]) if(distanceSq(b.x,b.y,prop.x,prop.y)<(prop.radius+b.blastRadius)**2) damageMapProp(prop,b.damage);
    if (game.boss && distanceSq(b.x,b.y,game.boss.x,game.boss.y)<(game.boss.radius+b.blastRadius)**2) {
      hit=true;
      const marked=game.boss.markTime>0;
      if(marked) detonateMark(game.boss);
      damageBoss(game.boss,b.damage*(marked?1.5:1),b.x,b.y);
      if (game.boss.hp<=0) destroyBoss();
    }
    for (let i=game.enemies.length-1;i>=0;i--) {
      const e=game.enemies[i];
      if (distanceSq(b.x,b.y,e.x,e.y)<(e.radius+b.blastRadius)**2) {
        hit=true;
        const marked=e.markTime>0;
        if(marked) detonateMark(e);
        damageEnemy(e,b.damage*(marked?1.5:1));
        if (e.hp<=0) destroyEnemy(i);
      }
    }
    if(hit && game.selected==='kestrel' && distanceSq(b.x,b.y,b.startX,b.startY)>210**2) awardMastery('LONG LOCK');
    playSound('boom');
  }

  function explodeShell(b) {
    burst(b.x,b.y,'#ffe19a',8,80);
    const splash=b.damage*.5;
    if(game.boss && !b.hits.has(game.boss.id) && distanceSq(b.x,b.y,game.boss.x,game.boss.y)<(game.boss.radius+36)**2) {
      damageBoss(game.boss,splash,b.x,b.y);
      if(game.boss.hp<=0) destroyBoss();
    }
    for(let i=game.enemies.length-1;i>=0;i--) {
      const e=game.enemies[i];
      if(!b.hits.has(e.id) && distanceSq(b.x,b.y,e.x,e.y)<(e.radius+36)**2) {
        damageEnemy(e,splash);
        if(e.hp<=0) destroyEnemy(i);
      }
    }
  }
