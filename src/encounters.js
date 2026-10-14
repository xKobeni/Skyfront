// Enemy spawning, objectives, hazards, formations, and boss setup.
  function spawnEnemy(options={}) {
    const wave = game.wave;
    const choice = Math.random();
    let type = options.type || 'scout';
    if (!options.type) {
      if(game.mode==='story') {
        const chapter=Math.floor((wave-1)/6);
        const pool=STORY_ENEMY_POOLS[chapter];
        type=pool[Math.floor(choice*pool.length)];
        if(storyPart(wave)===4 && choice>.55) type=storyChapter(wave).enemy;
        if(storyPart(wave)===0 && type==='bomber') type='scout';
      } else if (wave>=3 && choice>.965) type='ace';
      else if (wave>=2 && choice>.93) type='ambusher';
      else if (wave>=3 && choice>.88) type='medic';
      else if (wave>=2 && choice>.83) type='shield';
      else if (choice>.70) type = currentZone().specialist;
      else if (wave >= 3 && choice > .56) type = 'bomber';
      else if (wave >= 2 && choice > .35) type = 'interceptor';
    }
    const [base,radius,speed,score] = ENEMY_STATS[type];
    const chapterTier=Math.floor((wave-1)/6);
    const danger=game.route==='danger'&&game.mode!=='rush';
    const hpScale=(1+(game.mode==='story'?chapterTier*.22:(wave-1)*.18))*(game.mode==='story'?STORY_DIFFICULTIES[game.storyDifficulty].hp:danger?1.16:1);
    const speedScale=(1+Math.min((game.mode==='story'?chapterTier*3:wave)*.065,.9))*(game.mode==='story'?STORY_DIFFICULTIES[game.storyDifficulty].speed:danger?1.12:1);
    game.enemies.push({
      id: nextEnemyId++, type, x: options.x ?? (type==='ambusher'?(Math.random()<.5?28:W-28):rand(48,Math.max(49,W-48))), y:options.y ?? (type==='mini'||type==='storyMini'?-110:-65),
      radius, hp:base*hpScale, maxHp:base*hpScale,
      speed:speed*speedScale, phase:rand(0,TAU),
      score, fireClock:options.fireClock ?? rand(1,2.8), warning:0, aimX:0, aimY:0,
      amplitude:rand(32,76), age:0, x0:0, shots:0, dodgeClock:0, order:options.order??0
    });
    const e = game.enemies[game.enemies.length-1]; e.x0 = e.x;
    if(type==='ambusher') e.side=e.x<W/2?1:-1;
    if(type==='supply'||type==='bonusAce') {e.side=e.x<W/2?1:-1;e.ttl=7;e.fireClock=1.4;}
    if(type==='generator'||type==='echo') {e.hp=base;e.maxHp=base;e.y=options.y??110;e.fireClock=1.5;}
    if (options.formation) { e.formation=options.formation; e.formationOffset=options.offset; e.formationAnchor=options.anchor; }
    return e;
  }

  function spawnMiniBoss() {
    if(game.mode==='rush' || game.miniBossWave===game.wave || game.boss) return;
    game.miniBossWave=game.wave;
    const e=spawnEnemy({type:'mini',x:W/2,y:-105,fireClock:1.5});
    e.hp*=1+Math.min(game.wave*.04,.5);e.maxHp=e.hp;
    toast('⚠ MINI-BOSS INBOUND',2);
  }

  function damageConvoy(amount) {
    const c=game.convoy;
    if(!c || c.invulnerable>0 || game.status!=='playing') return;
    c.hp=Math.max(0,c.hp-amount);c.invulnerable=.8;
    burst(c.x,c.y,'#ffbc84',22,150);game.screenshake=.32;
    toast(`CONVOY HIT · ${c.hp}/${c.maxHp} HULL`,1.5);
    if(c.hp===0) endGame();
  }
  function finishObjective(success) {
    const o=game.objective;
    if(!o) return;
    game.objective=null;game.objectiveClock=game.mode==='escort'?6:10;
    if(success) {
      const points=addScore(700);
      spawnPickup(o.x,Math.min(H-170,o.y),o.type==='zone'?'shield':'power');
      toast(`MISSION COMPLETE · +${points}`,1.8);
    } else {
      if(o.type==='missile') {
        if(game.convoy) damageConvoy(2);
        else for(const offset of [-.45,0,.45]) game.hostileBullets.push({x:o.x,y:H*.35,vx:Math.sin(offset)*190,vy:Math.cos(offset)*190,radius:6,color:'#ffb173'});
      }
      if(o.type==='radar') for(let i=0;i<3;i++) spawnEnemy({type:'interceptor',x:clamp(W*.25+i*W*.25,40,W-40),y:-50});
      if(o.type==='zone') spawnEnemy({type:'ambusher'});
      toast('MISSION FAILED · THREAT ESCALATING',1.8);
    }
  }
  function spawnObjective() {
    if(game.objective || game.rescue || game.boss || game.mode==='rush') return;
    const type=['missile','radar','zone'][game.objectiveCount++%3];
    const o={type,timer:type==='zone'?7:type==='radar'?10:9,required:2.4,hold:0,x:W*(game.objectiveCount%2?.25:.75),y:H*.65};
    if(type!=='zone') o.enemyId=spawnEnemy({type,x:o.x,y:-55}).id;
    game.objective=o;
    toast(type==='missile'?'⚠ INTERCEPT THE MISSILE':type==='radar'?'⚠ DESTROY RADAR BEFORE REINFORCEMENTS':'⚠ HOLD THE MOVING SAFE ZONE',2.5);
  }
  function spawnBonusTarget() {
    if(game.mode==='rush'||game.boss||game.objective||game.rescue||game.enemies.some(e=>e.type==='supply'||e.type==='bonusAce')) return false;
    const type=game.bonusCount++%2===0?'supply':'bonusAce';
    const left=Math.random()<.5;
    const e=spawnEnemy({type,x:left?W*.2:W*.8,y:H*.3});
    e.side=left?1:-1;e.ttl=7;
    toast(type==='supply'?'SUPPLY PLANE · RARE UPGRADE ABOARD':'FLEEING ACE · CATCH IT FOR A REWARD',2);
    return true;
  }
  function updateObjective(dt) {
    const o=game.objective;
    if(!o) return;
    o.timer-=dt;
    if(o.type==='zone') {
      o.x=clamp(o.x+Math.sin(game.time*1.8)*55*dt,70,W-70);
      o.hold=distanceSq(game.player.x,game.player.y,o.x,o.y)<53**2?o.hold+dt:Math.max(0,o.hold-dt*.6);
      if(o.hold>=o.required) {finishObjective(true);return;}
    } else if(!game.enemies.some(e=>e.id===o.enemyId)) {finishObjective(true);return;}
    if(o.timer<=0) {
      if(o.enemyId) game.enemies=game.enemies.filter(e=>e.id!==o.enemyId);
      finishObjective(false);
    }
  }
  function spawnRescue() {
    game.rescue={x:game.wave%2?W*.75:W*.25,y:H*.58,timer:8,hold:0};
    game.rescueWave=game.wave;
    toast('ALLY DOWN · FLY TO THE BEACON TO RESCUE',2.4);
  }
  function updateRescue(dt) {
    const r=game.rescue;if(!r) return;
    r.timer-=dt;r.x=clamp(r.x+Math.sin(game.time*1.5)*22*dt,65,W-65);
    r.hold=distanceSq(game.player.x,game.player.y,r.x,r.y)<52**2?r.hold+dt:Math.max(0,r.hold-dt);
    if(r.hold>=.7) {
      game.rescue=null;game.wingmanReady=true;
      addScore(450);gainMomentum(12);
      burst(r.x,r.y,'#b7f5ff',25,110);toast('WINGMAN RESCUED · SUPPORT AT NEXT BOSS',2);
    } else if(r.timer<=0) {game.rescue=null;toast('RESCUE WINDOW CLOSED',1.3);}
  }
  function updateWingman(dt) {
    const w=game.wingman;if(!w) return;
    const p=game.player;
    w.x+=(clamp(p.x+65,35,W-35)-w.x)*Math.min(1,dt*4);
    w.y+=(clamp(p.y+30,130,H-35)-w.y)*Math.min(1,dt*4);
    w.fireClock-=dt;
    if(w.fireClock>0) return;
    w.fireClock=.82;
    const target=game.boss||game.enemies.find(e=>e.y>0);
    if(!target) return;
    markTarget(target);
    if(target===game.boss) {damageBoss(target,2.2,target.x,target.y);if(target.hp<=0) destroyBoss();}
    else {damageEnemy(target,2.2);if(target.hp<=0) destroyEnemy(game.enemies.indexOf(target));}
    game.beams.push({x:w.x,y:w.y-18,life:.14,maxLife:.14,width:5});
    burst(target.x,target.y,'#a9efff',4,40);
  }

  function spawnRiskPickup(hazard) {
    if(game.pickups.length>=8) return;
    const side=hazard.direction;
    const x=hazard.lane?hazard.x+side*hazard.width*.3:hazard.x+side*hazard.radius*.62;
    const y=hazard.lane?game.player.y-70:hazard.y-55;
    spawnPickup(x,clamp(y,130,H-100),'cache');
    game.pickups[game.pickups.length-1].vy=78;
    game.pickups[game.pickups.length-1].life=hazard.timer;
  }

  function spawnHazard() {
    const kind=currentZone().kind,p=game.player;
    const lane=['sea','frost','storm'].includes(kind);
    game.hazard={kind,x:clamp(p.x+rand(-100,100),65,W-65),y:clamp(p.y+rand(-65,35),150,H-85),
      lane,radius:kind==='dust'?105:kind==='neon'?82:75,width:kind==='sea'?95:kind==='storm'?65:72,
      phase:'warning',timer:1.15,hit:false,direction:Math.random()<.5?-1:1};
    toast({sea:'CROSSWIND INBOUND',dust:'DUST CLOUD INBOUND',neon:'RIFT PULSE INBOUND',
      frost:'ICE LANE INBOUND',storm:'LIGHTNING STRIKE INBOUND',ember:'HEAT VENT INBOUND'}[kind],1.2);
  }
  function setupMapProps() {
    game.mapProps=[];
    const kind=currentZone().kind;
    if(!['storm','ember'].includes(kind)) return;
    for(const [i,x] of [W*.3,W*.7].entries()) game.mapProps.push({x,y:H*(i?.48:.34),kind,hp:3,radius:23});
  }
  function triggerMapProp(prop) {
    const radius=prop.kind==='ember'?155:185;
    burst(prop.x,prop.y,prop.kind==='ember'?'#ffad72':'#a8e6ff',42,220);
    game.screenshake=.3;game.hitStop=.045;playSound('impact');
    for(let i=game.enemies.length-1;i>=0;i--) if(distanceSq(game.enemies[i].x,game.enemies[i].y,prop.x,prop.y)<radius**2) {
      damageEnemy(game.enemies[i],prop.kind==='ember'?9:6);
      if(game.enemies[i].hp<=0) destroyEnemy(i);
    }
    if(game.boss && distanceSq(game.boss.x,game.boss.y,prop.x,prop.y)<radius**2) {
      damageBoss(game.boss,prop.kind==='ember'?12:8,prop.x,prop.y);
      if(game.boss.hp<=0) destroyBoss();
    }
    if(prop.kind==='storm') game.hostileBullets=game.hostileBullets.filter(b=>distanceSq(b.x,b.y,prop.x,prop.y)>radius**2);
    else if(game.player && distanceSq(game.player.x,game.player.y,prop.x,prop.y)<100**2) damagePlayer(1);
    toast(prop.kind==='storm'?'CAPACITOR CHAIN · BULLETS CLEARED':'FUEL TANK DETONATED',1.5);
  }
  function damageMapProp(prop,amount) {
    prop.hp-=amount;
    if(prop.hp<=0) {game.mapProps.splice(game.mapProps.indexOf(prop),1);triggerMapProp(prop);}
  }

  function updateHazard(dt) {
    if(!game.hazard) {
      if(game.boss) return;
      game.hazardClock-=dt;
      if(game.hazardClock<=0) spawnHazard();
      return;
    }
    const hazard=game.hazard;
    hazard.timer-=dt;
    if(hazard.timer<=0 && hazard.phase==='warning') {
      hazard.phase='active';hazard.timer=hazard.kind==='dust'?2.5:1.5;
      game.screenshake=Math.max(game.screenshake,.12);
      spawnRiskPickup(hazard);
      if(['storm','ember'].includes(hazard.kind)) {
        for(let i=game.enemies.length-1;i>=0;i--) if(hazardContains(hazard,game.enemies[i])) {
          damageEnemy(game.enemies[i],hazard.kind==='storm'?6:5);
          if(game.enemies[i].hp<=0) destroyEnemy(i);
        }
        if(game.boss && hazardContains(hazard,game.boss)) {
          damageBoss(game.boss,7,hazard.x,hazard.y);
          if(game.boss.hp<=0) destroyBoss();
        }
      }
    } else if(hazard.timer<=0) {
      game.hazard=null;game.hazardClock=rand(8,12);
    }
  }

  function hazardContains(hazard,p) {
    return hazard.lane?Math.abs(p.x-hazard.x)<hazard.width/2+p.radius:
      distanceSq(p.x,p.y,hazard.x,hazard.y)<(hazard.radius+p.radius)**2;
  }

  function spawnFormation() {
    const shape=['V','WALL','PINCER'][Math.floor(Math.random()*3)];
    const count=shape==='WALL'?4:3;
    const anchor=rand(110,Math.max(111,W-110));
    const spacing=Math.min(65,W/(count+2));
    const type=game.wave>=3 && Math.random()>.45 ? currentZone().specialist : game.wave>=2?'interceptor':'scout';
    const members=[];
    for (let i=0;i<count;i++) {
      const offset=(i-(count-1)/2)*spacing;
      const y=shape==='V'?-70-Math.abs(offset)*.55:shape==='PINCER'?-70-Math.abs(offset)*.8:-70;
      const enemy=spawnEnemy({type,x:clamp(anchor+offset,40,W-40),y,fireClock:1.3+i*.28,formation:shape,offset,anchor});
      enemy.amplitude=Math.min(enemy.amplitude,28);
      members.push(enemy);
    }
    const leader=members[Math.floor(count/2)];leader.leader=true;leader.hp*=1.6;leader.maxHp=leader.hp;
    for(const member of members) member.leaderId=leader.id;
    toast(`${shape} FORMATION · TAKE OUT THE LEADER`,1.5);
  }

  function spawnBoss() {
    const tier=game.mode==='endless' ? Math.floor((game.wave-1)/3) : game.mode==='story'?Math.floor((game.wave-1)/6)*2:game.wave-1;
    const variant=game.mode==='story'?'story':game.mode==='rush'&&game.wave===7?'eclipse':game.mode==='rush'&&game.wave===8?'chrono':null;
    const health=190*(1+.3*tier)*(game.mode==='story'?STORY_DIFFICULTIES[game.storyDifficulty].hp:game.mode==='rush'?DIFFICULTIES[game.difficulty].hp*game.rushRisks.hp:game.route==='danger'?1.16:1)*(variant?1.3:1);
    game.boss = { id:nextEnemyId++, x:W/2, y:-130, hp:health, maxHp:health, radius:61,
      age:0, fireClock:2.2, warning:0, aimX:0, aimY:0, shots:0,
      zone:zoneIndex(), variant, chapter:game.mode==='story'?Math.floor((game.wave-1)/6):null, stage:1, phase:rand(0,6.28), enraged:false, safeX:W/2, lock:null,
      parts:[{kind:'cannon',dx:-53,dy:-5,hp:Math.max(18,health*.07),broken:false},{kind:'engine',dx:53,dy:-5,hp:Math.max(18,health*.07),broken:false}] };
    game.hostileBullets.length = 0;
    game.enemies.length=0;
    game.objective=null;
    game.hazard=null;game.hazardClock=10;
    setupMapProps();
    if(game.wingmanReady) {game.wingman={x:game.player.x+65,y:game.player.y+30,hp:3,maxHp:3,fireClock:.7};game.wingmanReady=false;toast('WINGMAN JOINED THE FIGHT',2);}
    game.screenshake = .33;
    toast(`⚠  ${bossName(game.boss)} INBOUND`, 3);
    playSound('boom');
  }
