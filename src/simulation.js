// Per-frame gameplay simulation and entity movement.
  function update(dt) {
    const p=game.player;
    if(game.storyAdvancePending && game.status==='playing') {game.storyAdvancePending=false;completeStoryStage();return;}
    game.time+=dt; backgroundScroll+=dt*(150+Math.min(game.wave*5,80));
    game.screenshake=Math.max(0,game.screenshake-dt);
    game.hitFlash=Math.max(0,game.hitFlash-dt);
    if(game.hitFlash===0) $('screenFlash').classList.remove('show');
    game.comboClock=Math.max(0,game.comboClock-dt);
    if(game.comboClock===0) game.combo=0;
    game.masteryClock=Math.max(0,game.masteryClock-dt);
    for(let i=game.popups.length-1;i>=0;i--) {game.popups[i].life-=dt;game.popups[i].y-=dt*30;if(game.popups[i].life<=0)game.popups.splice(i,1);}
    p.invulnerable=Math.max(0,p.invulnerable-dt);
    p.dashCooldown=Math.max(0,p.dashCooldown-dt);
    p.dashBoost=Math.max(0,(p.dashBoost||0)-dt);
    p.abilityCooldown=Math.max(0,p.abilityCooldown-dt);
    p.abilityTime=Math.max(0,p.abilityTime-dt);
    p.overdrive=Math.max(0,p.overdrive-dt);
    p.magnet=Math.max(0,p.magnet-dt);
    p.scoreBoost=Math.max(0,p.scoreBoost-dt);
    if (game.toastClock>0) {
      game.toastClock-=dt;
      if (game.toastClock<=0) $('gameToast').classList.remove('show');
    }
    updateDecor(dt);
    updateHazard(dt);
    if(game.status!=='playing') {refreshHud();return;}
    if(game.convoy) {
      const c=game.convoy;c.age+=dt;c.invulnerable=Math.max(0,c.invulnerable-dt);
      c.x=W*.5+Math.sin(c.age*.45)*Math.min(W*.2,135);
      c.y=H-90;
    }

    // Keyboard movement overrides drag-follow while held, allowing either input style.
    let dx=Number(pressed.has('ArrowRight')||pressed.has('KeyD'))-Number(pressed.has('ArrowLeft')||pressed.has('KeyA'));
    let dy=Number(pressed.has('ArrowDown')||pressed.has('KeyS'))-Number(pressed.has('ArrowUp')||pressed.has('KeyW'));
    const inDust=game.hazard?.kind==='dust' && game.hazard.phase==='active' && hazardContains(game.hazard,p);
    const moveSpeed=p.speed*(game.selected==='jet' && p.abilityTime>0 ? 1.7 : 1)*(inDust?.62:1);
    if(p.dashTime>0) {
      p.x+=p.dashVx*dt;p.y+=p.dashVy*dt;p.dashTime=Math.max(0,p.dashTime-dt);
      p.bank+=(clamp(p.dashVx/760,-.4,.4)-p.bank)*Math.min(1,dt*12);
      if(!p.dashThreaded && game.hostileBullets.some(b=>distanceSq(b.x,b.y,p.x,p.y)<95**2)) {
        p.dashThreaded=true;p.dashBoost=2;gainMomentum(22);
        game.popups.push({x:p.x,y:p.y-30,text:'THREAD THE NEEDLE',life:.8,maxLife:.8,color:'#a9f8ff'});
      }
    } else if (dx || dy) {
      const len=Math.hypot(dx,dy);
      p.x+=dx/len*moveSpeed*dt; p.y+=dy/len*moveSpeed*dt;
      pointerTarget=null;
      p.bank += (dx*.3-p.bank)*Math.min(1,dt*9);
    } else if (pointerTarget) {
      const tx=clamp(pointerTarget.x,25,W-25), ty=clamp(pointerTarget.y,115,H-28);
      const ddx=tx-p.x, ddy=ty-p.y, distance=Math.hypot(ddx,ddy);
      const step=Math.min(distance,moveSpeed*1.25*dt);
      if (distance>1) { p.x+=ddx/distance*step; p.y+=ddy/distance*step; }
      p.bank+=(clamp(ddx/250,-.3,.3)-p.bank)*Math.min(1,dt*8);
    } else p.bank += (0-p.bank)*Math.min(1,dt*8);
    p.x=clamp(p.x,24,W-24); p.y=clamp(p.y,110,H-26);
    if(game.hazard?.phase==='active' && hazardContains(game.hazard,p)) {
      if(game.hazard.kind==='sea') p.x=clamp(p.x+game.hazard.direction*175*dt,24,W-24);
      else if(!['dust'].includes(game.hazard.kind) && !game.hazard.hit && p.invulnerable<=0) {
        game.hazard.hit=true;damagePlayer(1);
      }
    }

    p.fireClock-=dt;
    if (p.fireClock<=0) {
      firePlayer();
      p.fireClock=Math.max(.065,selectedShip().rate*p.rateBoost*(p.evolution==='rapid'?.78:1)*(1-.035*(p.weaponLevel-1))*(p.overdrive>0?.78:1)*(game.selected==='ray' && p.abilityTime>0?.58:1));
    }
    if (game.status!=='playing') { refreshHud(); return; }
    p.exhaustClock-=dt;
    if (p.exhaustClock<=0) {
      p.exhaustClock=.043;
      if (game.particles.length<530) game.particles.push({x:p.x+rand(-6,6),y:p.y+23,
        vx:rand(-17,17),vy:rand(65,100),life:rand(.2,.43),maxLife:.43,size:rand(2,5),color:game.selected==='nova'?'#bc85ff':game.selected==='jet'?'#60c4ff':'#ffba65'});
    }

    if (!game.boss && game.mode!=='rush' && !(game.mode==='story'&&[3,5].includes(storyPart(game.wave)))) {
      game.waveTime+=dt;
      if (game.waveTime>=MODES[game.mode].duration) {
        if(game.mode==='story') {completeStoryStage();refreshHud();return;}
        if(game.objective?.enemyId) game.enemies=game.enemies.filter(e=>e.id!==game.objective.enemyId);
        game.objective=null;game.rescue=null;
        game.wave++; game.waveTime=0;
        setupMapProps();
        game.spawnClock=1.4;game.formationClock=8;game.hazardClock=Math.max(game.hazardClock,3);
        $('zoneName').textContent=currentZone().name;
        if (!maybeOfferUpgrade()) {
          if (isBossWave()) spawnBoss();
          else toast(`WAVE ${pad(game.wave,2)}  ·  HOSTILES INBOUND`);
        }
      }
    }
    if(game.status!=='playing') {refreshHud();return;}
    if(game.mode==='story' && [3,5].includes(storyPart(game.wave)) && !game.storyEncounterSpawned) {
      game.waveTime+=dt;game.storyEncounterClock-=dt;
      if(game.storyEncounterClock<=0) launchStoryEncounter();
    }
    if(game.mode!=='story' && game.mode!=='rush' && game.mode!=='escort' && game.wave>=4 && !isBossWave() && !game.boss && game.waveTime>=MODES[game.mode].duration*.55) spawnMiniBoss();
    if (!game.boss && game.mode==='rush' && game.intermission>0) {
      game.intermission=Math.max(0,game.intermission-dt);
      if (game.intermission===0) spawnBoss();
    }
    game.spawnClock-=dt;
    if(game.mode!=='rush' && !game.boss && game.wave>=2) {
      game.bonusClock-=dt;
      if(game.bonusClock<=0) game.bonusClock=spawnBonusTarget()?18:1.5;
    }
    if(game.mode!=='rush' && game.mode!=='story' && !game.boss) {
      game.objectiveClock-=dt;
      if(game.objectiveClock<=0 && !game.objective) spawnObjective();
      if((game.wave===2||game.wave===5) && game.rescueWave!==game.wave && game.waveTime>6 && !game.objective) spawnRescue();
    }
    if (game.mode!=='rush' && game.spawnClock<=0) {
      const cap=game.boss?4:game.mode==='story'?storyPart(game.wave)===3?8:storyPart(game.wave)===0?8:storyPart(game.wave)===4?Math.min(14,10+Math.floor((game.wave-1)/6)):Math.min(12,9+Math.floor((game.wave-1)/6)):game.mode==='escort'?Math.min(14,5+game.wave*2):Math.min(28,game.wave===1?6:8+game.wave*2);
      if (game.enemies.length<cap) spawnEnemy();
      const basic=game.mode==='story'?Math.max(1.25,(storyPart(game.wave)===0?1.85:storyPart(game.wave)===4?1.45:1.65)-Math.floor((game.wave-1)/6)*.06):game.wave===1?2.5:game.wave===2?1.9:Math.max(.76,1.55-(game.wave-3)*.095);
      const progress=game.mode==='rush'?0:game.waveTime/MODES[game.mode].duration;
      const pacing=progress<.25?1.35:progress>.75?.8:1;
      game.spawnClock=basic*pacing*rand(.9,1.15)*(game.boss?2.4:1)*(game.mode==='story'?1:game.route==='danger'?.76:1.17);
    }
    if(game.mode!=='rush' && game.wave>=3 && !game.boss && (game.mode!=='story'||storyPart(game.wave)!==5) && game.waveTime>(game.mode==='story'?5:MODES[game.mode].duration*.3)) {
      game.formationClock-=dt;
      if(game.formationClock<=0) {
        if(game.enemies.length<(game.mode==='story'?10:20)) spawnFormation();
        game.formationClock=rand(11,14);
      }
    }
    game.pickupClock-=dt;
    if (game.pickupClock<=0) { spawnPickup(); game.pickupClock=rand(20,24); }

    let activeWarnings=game.enemies.filter(e=>e.warning>0).length;
    const warningLimit=game.boss?2:game.wave<=2?2:4;
    for (let i=game.enemies.length-1;i>=0;i--) {
      const e=game.enemies[i];
      e.hitTime=Math.max(0,(e.hitTime||0)-dt);
      e.markTime=Math.max(0,(e.markTime||0)-dt);
      if(e.markTime===0) e.markStacks=0;
      e.age+=dt;
      if(e.ttl!==undefined) {
        e.ttl-=dt;
        if(e.ttl<=0) {game.enemies.splice(i,1);toast('BONUS TARGET ESCAPED',1.2);continue;}
      }
      if(e.type==='radar') e.y=Math.min(145,e.y+e.speed*dt);
      else if(e.type==='generator') {e.y=Math.min(220,e.y);}
      else if(e.type==='echo' && game.boss) {e.x=clamp(W-game.boss.x,50,W-50);e.y=game.boss.y+15;}
      else if(e.type==='supply'||e.type==='bonusAce') {e.x+=e.side*95*dt;e.y+=Math.sin(e.age*2.4)*12*dt;}
      else if(e.type==='storyMini') e.y=Math.min(150,e.y+e.speed*dt);
      else e.y+=e.speed*dt;
      if(e.type==='missile' && game.convoy) e.x+=(game.convoy.x-e.x)*Math.min(1,dt*.8);
      if(e.type==='ace') {
        e.dodgeClock=Math.max(0,e.dodgeClock-dt);
        if(e.dodgeClock===0 && game.bullets.some(b=>b.y<e.y+115 && b.y>e.y-35 && Math.abs(b.x-e.x)<52)) {
          e.x=clamp(e.x+(e.x<W*.5?75:-75),35,W-35);e.x0=e.x;e.dodgeClock=1.35;
          burst(e.x,e.y,'#ffe5a2',9,70);
        }
      }
      if(e.type==='medic') {
        e.healClock=(e.healClock||1)-dt;
        if(e.healClock<=0) {
          e.healClock=1;
          for(const ally of game.enemies) if(ally!==e && distanceSq(e.x,e.y,ally.x,ally.y)<110**2)
            ally.hp=Math.min(ally.maxHp,ally.hp+Math.max(1,ally.maxHp*.08));
          burst(e.x,e.y,'#a4ffbc',5,45);
        }
      }
      if(e.formation) {
        const drift=e.formation==='PINCER'?Math.sign(e.formationOffset)*Math.min(38,e.age*18):Math.sin(e.age*1.5)*11;
        e.x=e.formationAnchor+e.formationOffset+drift;
      } else
      if(e.type==='ambusher') e.x+=e.side*130*dt;
      else if(e.type==='mini'||e.type==='storyMini') e.x=(e.type==='storyMini'?e.x0:W/2)+Math.sin(e.age*(e.type==='storyMini'?1.15+e.miniVariant*.18:1.5))*Math.min(W*.22,130);
      else if (['interceptor','raider','drone','skimmer','phoenix','ace','hunter','phase'].includes(e.type)) {
        const frequency=e.type==='raider'?2.7:e.type==='drone'?4.2:e.type==='skimmer'?5:e.type==='phoenix'?2.2:e.type==='ace'?3.3:e.type==='phase'?4.1:3.6;
        e.x=e.x0+Math.sin(e.age*frequency+e.phase)*e.amplitude;
      }
      else if (e.type==='scout') e.x+=Math.sin(e.age*2.2+e.phase)*18*dt;
      else if (e.type==='sparker') e.x+=Math.sin(e.age*3+e.phase)*32*dt;
      e.x=clamp(e.x,22,W-22);
      if (e.warning>0) {
        e.warning-=dt;
        if (e.warning<=0) { e.warning=0; fireEnemy(e); }
      } else {
        e.fireClock-=dt;
        if (e.fireClock<=0 && e.y>15 && e.y<H*.72 && !['radar','missile','generator','supply'].includes(e.type)) {
          if(activeWarnings<warningLimit && game.hostileBullets.length<85) {
            const aim=game.convoy && e.shots%2===0?game.convoy:p;
            e.aimX=aim.x; e.aimY=aim.y;
            e.warning=e.type==='scout' ? .24 : e.type==='interceptor' ? .34 : e.type==='ace'?.38:.55;
            activeWarnings++;
          } else e.fireClock=.4;
        }
      }
      if(e.type==='missile' && e.y>(game.convoy?.y??H*.8)-25) {
        game.enemies.splice(i,1);finishObjective(false);continue;
      }
      if (e.y>H+75) { game.enemies.splice(i,1); continue; }
      if(game.convoy && !['generator','echo','radar'].includes(e.type) && distanceSq(e.x,e.y,game.convoy.x,game.convoy.y)<(e.radius+33)**2) {
        game.enemies.splice(i,1);
        if(game.objective?.enemyId===e.id) finishObjective(false);
        else damageConvoy(e.type==='bomber'?2:1);
        continue;
      }
      if (distanceSq(e.x,e.y,p.x,p.y)<(e.radius+p.radius-4)**2) {
        if(e.type==='storyMini') {damagePlayer(1);e.y=Math.max(105,e.y-30);continue;}
        game.enemies.splice(i,1); burst(e.x,e.y,'#ffb172',18,125); damagePlayer(1);
        if(game.objective?.enemyId===e.id) finishObjective(false);
      }
    }
    updateObjective(dt);
    updateRescue(dt);
    updateWingman(dt);
    if(game.status!=='playing') {refreshHud();return;}

    if (game.boss) {
      const b=game.boss;
      b.hitTime=Math.max(0,(b.hitTime||0)-dt);
      b.markTime=Math.max(0,(b.markTime||0)-dt);
      if(b.markTime===0) b.markStacks=0;
      checkBossPhase(b);
      b.age+=dt;
      if(b.lock) {
        const lock=b.lock;
        lock.age+=dt;
        const inside=distanceSq(p.x,p.y,lock.x,lock.y)<45**2;
        lock.hold=inside?lock.hold+dt:Math.max(0,lock.hold-dt*1.5);
        if(lock.hold>=lock.required) {
          b.lock=null;b.warning=0;b.fireClock=1.2;
          game.hostileBullets.length=0;
          game.hazard=null;
          burst(lock.x,lock.y,'#d7ff85',28,120);
          toast('SAFE ZONE SECURED · BOSS SHIELD BROKEN',2);
          playSound('pickup');
        } else if(lock.age>8) {
          lock.age=0;lock.hold=0;lock.x=clamp(W-lock.x,70,W-70);b.safeX=lock.x;
          game.hostileBullets.length=0;
          toast('SAFE ZONE SHIFTED · CROSS THE SKY',2);
        }
      }
      if(b.enraged && b.zone===3) b.guard=b.age%4.6<1.4;
      b.y+=(Math.min(123,H*.2)-b.y)*Math.min(1,dt*1.3);
      b.x=W*.5+Math.sin(b.age*(b.stage===3?1.85:b.enraged?1.45:.91)+b.phase)*Math.min(W*.3,b.stage===3?240:b.enraged?210:160)*(b.parts?.some(part=>part.kind==='engine'&&part.broken)?.52:1);
      if (b.warning>0) {
        b.warning-=dt;
        if (b.warning<=0) { b.warning=0; fireBoss(b); }
      } else {
        b.fireClock-=dt;
        if (b.fireClock<=0 && b.y>35) {
          const aim=game.convoy && b.shots%3===0?game.convoy:p;
          b.aimX=aim.x; b.aimY=aim.y; b.warning=(b.stage===3?.48:b.enraged?.6:.75)*(game.mode==='rush'?DIFFICULTIES[game.difficulty].rate*game.rushRisks.rate:1);
          if(b.zone===1 && b.enraged) b.safeX=b.lock?b.lock.x:W*(b.shots%4===0?.27:.73);
        }
      }
      if (distanceSq(b.x,b.y,p.x,p.y)<(b.radius+p.radius-6)**2) damagePlayer(2);
    }
    if (game.status!=='playing') { refreshHud(); return; }

    for (let i=game.bullets.length-1;i>=0;i--) {
      const bullet=game.bullets[i];
      if (bullet.kind==='missile') { steerMissile(bullet,dt); bullet.life-=dt; }
      bullet.x+=bullet.vx*dt; bullet.y+=bullet.vy*dt;
      if (bullet.y < -50 || bullet.y>H+50 || bullet.x< -50 || bullet.x>W+50 || bullet.life<=0) { game.bullets.splice(i,1); continue; }
      if (bullet.kind==='missile') {
        const hitBoss=game.boss && distanceSq(bullet.x,bullet.y,game.boss.x,game.boss.y)<(game.boss.radius+bullet.radius)**2;
        const hitEnemy=game.enemies.some(e=>distanceSq(bullet.x,bullet.y,e.x,e.y)<(e.radius+bullet.radius)**2);
        const hitProp=game.mapProps.some(prop=>distanceSq(bullet.x,bullet.y,prop.x,prop.y)<(prop.radius+bullet.radius)**2);
        if (hitBoss || hitEnemy || hitProp) { explodeMissile(bullet); game.bullets.splice(i,1); }
        continue;
      }
      let collided=false;
      const prop=game.mapProps.find(item=>distanceSq(bullet.x,bullet.y,item.x,item.y)<(item.radius+bullet.radius)**2);
      if(prop) {damageMapProp(prop,bullet.damage);collided=true;}
      if (!collided && game.boss && !bullet.hits.has(game.boss.id) && distanceSq(bullet.x,bullet.y,game.boss.x,game.boss.y)<(game.boss.radius+bullet.radius-5)**2) {
        const boss=game.boss;
        bullet.hits.add(boss.id);
        if(bullet.kind==='plasma') plasmaImpact(boss);
        damageBoss(boss,bullet.damage,bullet.x,bullet.y);
        burst(bullet.x,bullet.y,'#ffa88e',2,55);
        if (boss.hp<=0) destroyBoss();
        collided=true;
      }
      if (!collided) {
        for (let j=game.enemies.length-1;j>=0;j--) {
          const e=game.enemies[j];
          if (!bullet.hits.has(e.id) && distanceSq(bullet.x,bullet.y,e.x,e.y)<(e.radius+bullet.radius-3)**2) {
            bullet.hits.add(e.id);
            if(bullet.kind==='plasma') plasmaImpact(e);
            damageEnemy(e,bullet.damage); collided=true;
            burst(bullet.x,bullet.y,'#ffc38b',2,55);
            if (e.hp<=0 && game.enemies.includes(e)) destroyEnemy(game.enemies.indexOf(e));
            break;
          }
        }
      }
      if (collided) {
        if(game.selected==='nova' && bullet.hits.size>=2 && !bullet.mastered) {
          bullet.mastered=true;awardMastery('PIERCE CHAIN');
        }
        if(bullet.kind==='shell') explodeShell(bullet);
        if (bullet.pierce>0) bullet.pierce--;
        else game.bullets.splice(i,1);
      }
    }
    if (game.status!=='playing') { refreshHud(); return; }

    for (let i=game.hostileBullets.length-1;i>=0;i--) {
      const b=game.hostileBullets[i];
      if (b.kind==='zigzag') {
        b.age+=dt; b.originX+=b.vx*dt;
        b.x=b.originX+Math.sin(b.age*b.frequency)*b.amplitude;
      } else b.x+=b.vx*dt;
      b.y+=b.vy*dt;
      if (b.y>H+30 || b.y<-60 || b.x<-40 || b.x>W+40) { game.hostileBullets.splice(i,1); continue; }
      const dist=distanceSq(b.x,b.y,p.x,p.y);
      if (dist < (b.radius+p.radius-4)**2) {
        game.hostileBullets.splice(i,1);
        damagePlayer(1);
        continue;
      } else if(!b.nearMissed && b.y>p.y+9 && b.y<p.y+37 && dist<65**2) {
        b.nearMissed=true;gainMomentum(10);
        if(game.selected==='jet') awardMastery('NEAR MISS');
      }
      if(game.convoy && distanceSq(b.x,b.y,game.convoy.x,game.convoy.y)<(b.radius+34)**2) {
        game.hostileBullets.splice(i,1);damageConvoy(1);
        continue;
      }
      if(game.wingman && distanceSq(b.x,b.y,game.wingman.x,game.wingman.y)<(b.radius+15)**2) {
        game.hostileBullets.splice(i,1);game.wingman.hp--;
        burst(game.wingman.x,game.wingman.y,'#a7eaff',14,100);
        if(game.wingman.hp<=0) {game.wingman=null;toast('WINGMAN LOST',1.4);}
      }
    }
    for (let i=game.beams.length-1;i>=0;i--) {
      game.beams[i].life-=dt;
      if (game.beams[i].life<=0) game.beams.splice(i,1);
    }

    for (let i=game.pickups.length-1;i>=0;i--) {
      const pickup=game.pickups[i];
      pickup.age+=dt; pickup.y+=pickup.vy*dt;
      if(pickup.life!==undefined) {
        pickup.life-=dt;
        if(pickup.life<=0) {game.pickups.splice(i,1);continue;}
      }
      if (p.magnet>0) {
        const mx=p.x-pickup.x, my=p.y-pickup.y, distance=Math.hypot(mx,my);
        if (distance<180 && distance>1) {
          const pull=Math.min(distance,290*dt);
          pickup.x+=mx/distance*pull; pickup.y+=my/distance*pull;
        }
      }
      if (pickup.y>H+40) { game.pickups.splice(i,1); continue; }
      if (distanceSq(pickup.x,pickup.y,p.x,p.y)<(pickup.radius+p.radius+5)**2) {
        let capped=false;
        if (pickup.type==='repair') {
          capped=p.hp>=p.maxHp;
          if (!capped) { p.hp=Math.min(p.maxHp,p.hp+2); toast('+2 HULL RESTORED',1.5); }
        } else if (pickup.type==='shield') {
          capped=p.shield>=3;
          if (!capped) { p.shield++; toast('+1 ENERGY SHIELD',1.5); }
        } else if (pickup.type==='power') {
          capped=p.weaponLevel>=4;
          if (!capped) { p.weaponLevel++; toast(`WEAPON SYSTEM LV ${p.weaponLevel}`,1.5); }
        } else if (pickup.type==='armor') {
          capped=p.maxHp>=selectedShip().hull+3;
          if (!capped) { p.maxHp++; p.hp++; toast('ARMOR PLATING · +1 MAX HULL',1.5); }
        } else if (pickup.type==='overdrive') {
          capped=p.overdrive>=14;
          if (!capped) { p.overdrive=Math.min(14,p.overdrive+7); toast('OVERDRIVE · FASTER FIRE',1.5); }
        } else if (pickup.type==='magnet') {
          capped=p.magnet>=24;
          if (!capped) { p.magnet=Math.min(24,p.magnet+12); toast('MAGNET · ATTRACT PICKUPS',1.5); }
        } else if (pickup.type==='score') {
          capped=p.scoreBoost>=24;
          if (!capped) { p.scoreBoost=Math.min(24,p.scoreBoost+12); toast('DOUBLE SCORE ACTIVE',1.5); }
        } else if (pickup.type==='cache') {
          p.abilityCooldown=Math.max(0,p.abilityCooldown-2);
          toast('TACTICAL CACHE · ABILITY -2s',1.5);
        }
        const awarded=addScore(pickup.type==='cache'?300:capped?350:50);
        if (capped) toast(`MAXED PICKUP · +${awarded} SCORE`,1.5);
        burst(pickup.x,pickup.y,'#efffb0',15,105);
        playSound('pickup');
        game.pickups.splice(i,1);
      }
    }
    if(game.status==='playing') offerEvolution();
    updateParticles(dt);
    refreshHud();
  }

  function updateParticles(dt) {
    for (let i=game.particles.length-1;i>=0;i--) {
      const p=game.particles[i]; p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt;
      p.vx*=Math.max(0,1-dt*.9); p.vy*=Math.max(0,1-dt*.8);
      if (p.life<=0) game.particles.splice(i,1);
    }
    for(let i=game.rings.length-1;i>=0;i--) {const ring=game.rings[i];ring.life-=dt;ring.radius+=dt*240;if(ring.life<=0)game.rings.splice(i,1);}
  }

  function updateDecor(dt) {
    for (const o of backgroundDecor) {
      o.y+=dt*(155*o.speed);
      if (o.y>H+110) Object.assign(o,makeDecor(-rand(45,210)));
    }
  }
