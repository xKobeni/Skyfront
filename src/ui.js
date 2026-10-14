// Hangar, story selection, HUD, and viewport UI.
  function selectedShip() { return SHIPS[game.selected]; }
  function fighterUnlocked(ship) {return FIGHTER_UNLOCKS[ship]===0 || storyUnlocked>FIGHTER_UNLOCKS[ship];}
  function fighterUnlockText(ship) {return fighterUnlocked(ship)?'READY TO FLY':`LOCKED · CLEAR STORY MISSION ${storyLabel(FIGHTER_UNLOCKS[ship])}`;}
  function setMenuTab(tab) {
    $('menuScreen').classList.toggle('fighter-tab',tab==='fighter');
    $('menuScreen').classList.toggle('mission-tab',tab==='mission');
    document.querySelectorAll('.menu-tab').forEach(button=>{const active=button.dataset.menuTab===tab;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  }
  function showMenuNotice(message) { $('menuNotice').textContent=message;$('menuNotice').classList.remove('hidden');game.menuNoticeClock=7; }
  function gainMomentum(amount) {
    if(game.status!=='playing'||!game.player) return;
    game.player.momentum=clamp(game.player.momentum+amount,0,100);
  }
  function useDash() {
    if(game.status!=='playing'||game.player.dashCooldown>0) return false;
    const p=game.player;
    let dx=Number(pressed.has('ArrowRight')||pressed.has('KeyD'))-Number(pressed.has('ArrowLeft')||pressed.has('KeyA'));
    let dy=Number(pressed.has('ArrowDown')||pressed.has('KeyS'))-Number(pressed.has('ArrowUp')||pressed.has('KeyW'));
    if(!dx&&!dy&&pointerTarget) {dx=pointerTarget.x-p.x;dy=pointerTarget.y-p.y;}
    if(!dx&&!dy) dy=-1;
    const length=Math.hypot(dx,dy);
    p.dashVx=dx/length*760;p.dashVy=dy/length*760;p.dashTime=.19;p.dashCooldown=4.8;p.dashThreaded=false;
    p.invulnerable=Math.max(p.invulnerable,.3);
    burst(p.x,p.y,'#a8f4ff',15,130);playSound('dash');refreshHud();return true;
  }
  function spendMomentum(kind) {
    if(game.status!=='playing'||game.player.momentum<100) return false;
    const p=game.player;p.momentum=0;
    if(kind==='guard') {
      p.shield=Math.min(3,p.shield+2);p.invulnerable=Math.max(p.invulnerable,.8);
      burst(p.x,p.y,'#8cdeff',32,180);toast('MOMENTUM GUARD · +2 SHIELDS',1.5);
    } else {
      game.hostileBullets=game.hostileBullets.filter(b=>distanceSq(b.x,b.y,p.x,p.y)>255**2);
      for(let i=game.enemies.length-1;i>=0;i--) if(distanceSq(game.enemies[i].x,game.enemies[i].y,p.x,p.y)<255**2) {
        damageEnemy(game.enemies[i],14);if(game.enemies[i].hp<=0) destroyEnemy(i);
      }
      if(game.boss && distanceSq(game.boss.x,game.boss.y,p.x,p.y)<315**2) {
        damageBoss(game.boss,22,p.x,p.y);
        if(game.boss.hp<=0) destroyBoss();
      }
      game.screenshake=.35;game.hitStop=.045;
      burst(p.x,p.y,'#ffe69c',50,260);toast('MOMENTUM STRIKE',1.5);
    }
    playSound('impact');refreshHud();return true;
  }
  function zoneIndex() { return game.mode==='story' ? storyChapter(game.wave).zone : game.mode==='endless' ? Math.floor((game.wave-1)/3)%ZONES.length : game.mode==='rush' ? RUSH_ZONES[clamp(game.wave-1,0,RUSH_ZONES.length-1)] : (game.wave-1)%ZONES.length; }
  function currentZone() { return game.mode==='story' ? STORY_ZONES[clamp(Math.floor((game.wave-1)/6),0,4)] : ZONES[zoneIndex()]; }
  function bossName(b) { return b.variant==='story'?STORY_CHAPTERS[b.chapter].boss:b.variant==='eclipse'?'ECLIPSE LEVIATHAN':b.variant==='chrono'?'CHRONO WRAITH':ZONES[b.zone].boss; }
  function rushBest() { return game.mode==='rush'?rushBests[game.difficulty]:modeBests[game.mode]; }
  function rushShipBest() { return game.mode==='rush'?rushShipBests[game.difficulty][game.selected]:shipBests[game.mode][game.selected]; }
  function isBossWave(wave=game.wave) { return game.mode==='story'?storyPart(wave)===5:game.mode==='rush' || (game.mode==='sector' || game.mode==='escort' ? wave===3 || wave===6 : wave%3===0); }
  function cycleShip(direction) {
    if(game.status!=='menu') return;
    const index=SHIP_KEYS.indexOf(game.selected);
    game.selected=SHIP_KEYS[(index+direction+SHIP_KEYS.length)%SHIP_KEYS.length];
    updateHangar();
  }

  function selectStoryChapter(direction) {
    const chapter=clamp(Math.floor((storySelected-1)/6)+direction,0,4);
    const first=chapter*6+1;
    if(first<=storyUnlocked) {storySelected=first;game.wave=first;updateHangar();}
  }

  function updateStorySelect() {
    const chapter=Math.floor((storySelected-1)/6), data=STORY_CHAPTERS[chapter];
    $('storySelect').classList.toggle('hidden',game.mode!=='story');
    $('storyChapterTitle').textContent=`${chapter+1} · ${data.title}`;
    $('storyBrief').textContent=`${data.map} · MISSION ${storyLabel(storySelected)}: ${storyBeat(storySelected)}. ${data.brief}`;
    $('storyStageList').innerHTML=Array.from({length:6},(_,i)=>{const wave=chapter*6+i+1;return `<button type="button" data-story-stage="${wave}" class="${storySelected===wave?'active':''}" ${wave>storyUnlocked?'disabled':''} aria-pressed="${storySelected===wave}">${storyLabel(wave)}</button>`;}).join('');
    $('storyProgress').textContent=`${storyCleared?'CAMPAIGN CLEARED':'UNLOCKED '+storyUnlocked+'/30'} · ${storyPart(storySelected)===3?'MINI-BOSS':storyPart(storySelected)===5?'CHAPTER BOSS':storyPart(storySelected)===2?'HAZARD RUN':storyPart(storySelected)===4?'GAUNTLET':'COMBAT MISSION'}`;
    $('previousChapter').disabled=chapter===0;
    $('nextChapter').disabled=chapter===4 || (chapter+1)*6+1>storyUnlocked;
    document.querySelectorAll('.story-difficulty-card').forEach(button=>{
      const active=button.dataset.storyDifficulty===game.storyDifficulty;
      button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
    });
    $('storyDifficultyDescription').textContent=STORY_DIFFICULTIES[game.storyDifficulty].description;
  }

  function updateHangar() {
    updateStorySelect();
    document.querySelectorAll('.ship-card').forEach((button) => {
      const active = button.dataset.ship === game.selected;
      button.classList.toggle('active', active);
      button.classList.toggle('locked',!fighterUnlocked(button.dataset.ship));
      button.setAttribute('aria-pressed', String(active));
      button.disabled = game.status === 'playing' || game.status === 'paused';
      button.setAttribute('aria-label',`${SHIPS[button.dataset.ship].name}, ${fighterUnlockText(button.dataset.ship)}`);
      const check=button.querySelector?.('.ship-check');if(check)check.textContent=fighterUnlocked(button.dataset.ship)?'✓':'🔒';
    });
    document.querySelectorAll('.mode-card').forEach((button) => {
      const active=button.dataset.mode===game.mode;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
      button.disabled=game.status==='playing' || game.status==='paused';
    });
    $('rushDifficulty').classList.toggle('hidden',game.mode!=='rush');
    document.querySelectorAll('.difficulty-card').forEach(button=>{
      const active=button.dataset.difficulty===game.difficulty;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
      button.disabled=game.status==='playing' || game.status==='paused';
    });
    $('difficultyDescription').textContent=DIFFICULTIES[game.difficulty].description;
    $('selectedShipLabel').textContent = selectedShip().name;
    $('fighterUnlockStatus').textContent=fighterUnlockText(game.selected);
    $('fighterUnlockStatus').classList.toggle('locked',!fighterUnlocked(game.selected));
    $('planePreview').classList.toggle('locked',!fighterUnlocked(game.selected));
    $('shipDescription').textContent = selectedShip().description;
    $('shipMastery').textContent=`ACE MOVE: ${MASTERY_HINTS[game.selected]} Bonus: +125 score and faster ability recharge.`;
    $('shipHull').textContent=String(selectedShip().hull);
    $('shipSpeed').textContent=String(selectedShip().speed);
    $('shipWeapon').textContent=selectedShip().label;
    $('shipAbility').textContent=ABILITY_NAMES[game.selected];
    $('shipPosition').textContent=`${pad(SHIP_KEYS.indexOf(game.selected)+1,2)} / ${pad(SHIP_KEYS.length,2)} · USE LEFT / RIGHT`;
    $('shipBest').innerHTML = `${selectedShip().name} ${MODES[game.mode].name}${game.mode==='rush'?' '+DIFFICULTIES[game.difficulty].name:''} BEST <strong>${pad(rushShipBest())}</strong>`;
    $('modeDescription').textContent=MODES[game.mode].description;
    $('bestLabel').textContent=`${MODES[game.mode].name}${game.mode==='rush'?' '+DIFFICULTIES[game.difficulty].name:''} BEST`;
    $('bestScore').textContent=pad(rushBest());
    $('paintList').innerHTML=Object.entries(PAINTS).map(([id,paint])=>`<button class="paint-card ${selectedPaint===id?'active':''}" type="button" data-paint="${id}" ${unlockedPaints.has(id)?'':'disabled'} aria-pressed="${selectedPaint===id}">${paint.name}${unlockedPaints.has(id)?'':' 🔒'}</button>`).join('');
    const next=Object.entries(PAINTS).find(([id])=>!unlockedPaints.has(id));
    $('paintGoals').textContent=next?`NEXT UNLOCK · ${next[1].goal}`:'ALL PAINTS UNLOCKED';
    $('startButton').disabled=!fighterUnlocked(game.selected);
    $('startLabel').textContent=fighterUnlocked(game.selected)?game.mode==='story'?`LAUNCH MISSION ${storyLabel(storySelected)}`:'LAUNCH MISSION':fighterUnlockText(game.selected);
  }

  function unlockPaint(id) {
    if(unlockedPaints.has(id)) return false;
    unlockedPaints.add(id);
    game.newPaints.push(PAINTS[id].name);
    try {localStorage.setItem('skyfront-epoch-strike-paints',JSON.stringify([...unlockedPaints]));} catch (_) {}
    updateHangar();
    return true;
  }

  function showScreen(which) {
    $('menuScreen').classList.toggle('hidden', which !== 'menu');
    $('pauseScreen').classList.toggle('hidden', which !== 'paused');
    $('gameOverScreen').classList.toggle('hidden', which !== 'over');
    $('upgradeScreen').classList.toggle('hidden', which !== 'upgrade');
    $('gameHud').classList.toggle('hidden', which === 'menu' || which === 'over');
    $('pauseButton').classList.toggle('hidden', which !== 'playing');
    $('abilityButton').classList.toggle('hidden', which !== 'playing');
    $('dashButton').classList.toggle('hidden',which!=='playing');
    $('strikeButton').classList.toggle('hidden',which!=='playing');
    $('guardButton').classList.toggle('hidden',which!=='playing');
    $('zoneName').textContent = currentZone().name;
    $('hudZoneName').textContent = currentZone().name;
    if(which==='menu'||which==='playing') updateHangar();
  }

  function refreshHud() {
    const p = game.player;
    if (!p) return;
    setText('scoreValue',pad(game.score));
    $('comboValue').classList.toggle('hidden',game.combo<2);
    setText('comboValue',`COMBO ${game.combo} · ×${comboMultiplier()}`);
    setText('masteryValue',`ACE MOVES ${game.masteryCount}`);
    setText('waveValue',game.mode==='story'?`MISSION ${storyLabel(game.wave)}`:`WAVE ${pad(game.wave,2)}`);
    setText('hudZoneName',currentZone().name);
    setText('modeHud',MODES[game.mode].name+(game.mode==='rush'?' · '+DIFFICULTIES[game.difficulty].name:game.mode==='story'?' · '+STORY_DIFFICULTIES[game.storyDifficulty].name:''));
    setText('momentumText',`MOMENTUM ${Math.floor(p.momentum)}%`);
    setWidth('momentumBar',`${clamp(p.momentum,0,100)}%`);
    $('dashButton').disabled=p.dashCooldown>0;
    setText('dashButton',p.dashCooldown>0?`${Math.ceil(p.dashCooldown)}s`:'DASH');
    $('strikeButton').disabled=p.momentum<100;
    $('guardButton').disabled=p.momentum<100;
    $('convoyMeter').classList.toggle('hidden',!game.convoy);
    if(game.convoy) {
      setText('convoyText',`${game.convoy.hp} / ${game.convoy.maxHp}`);
      setWidth('convoyBar',`${100*game.convoy.hp/game.convoy.maxHp}%`);
    }
    $('objectiveHud').classList.toggle('hidden',!game.objective&&!game.rescue&&!game.wingmanReady&&!game.wingman);
    if(game.rescue) setText('objectiveHud',`RESCUE WINGMAN · HOLD ${Math.ceil(game.rescue.hold*10)/10}/0.7s · ${Math.ceil(game.rescue.timer)}s LEFT`);
    else if(game.wingman) setText('objectiveHud',`WINGMAN SUPPORT · ${game.wingman.hp}/${game.wingman.maxHp} HP`);
    else if(game.wingmanReady) setText('objectiveHud','WINGMAN READY · NEXT BOSS');
    else if(game.objective) {
      const o=game.objective;
      setText('objectiveHud',o.type==='zone'?`MOVING SAFE ZONE · ${Math.ceil(o.hold||0)}/${o.required}s · ${Math.ceil(o.timer)}s LEFT`:o.type==='missile'?`INTERCEPT MISSILE · ${Math.ceil(o.timer)}s LEFT`:`DESTROY RADAR SHIP · ${Math.ceil(o.timer)}s LEFT`);
    }
    setText('waveTimer',game.boss ? 'DEFEAT COMMANDER' : game.mode==='story'&&[3,5].includes(storyPart(game.wave)) ? game.storyEncounterSpawned?'DEFEAT MINI-BOSS':`ENCOUNTER ${Math.ceil(Math.max(0,game.storyEncounterClock))}s` : game.mode==='rush' ? `NEXT COMMANDER ${Math.ceil(game.intermission)}s` : `${game.mode==='story'?'MISSION CLEAR IN':'NEXT WAVE'} ${Math.ceil(Math.max(0, MODES[game.mode].duration-game.waveTime))}s`);
    setText('hullText',`${Math.max(0,Math.ceil(p.hp))} / ${p.maxHp}`);
    setWidth('hullBar',`${clamp(p.hp/p.maxHp,0,1)*100}%`);
    setText('shieldText',`${p.shield} / 3`);
    setWidth('shieldBar',`${p.shield/3*100}%`);
    setText('weaponLabel',`${selectedShip().label} · LV ${p.weaponLevel}${p.evolution?' · '+EVOLUTIONS[game.selected].find(e=>e.id===p.evolution).name:''}`);
    const ability=ABILITY_NAMES[game.selected];
    setText('abilityLabel',`${ability} · ${p.abilityCooldown > 0 ? `${Math.ceil(p.abilityCooldown)}s` : 'READY'}`);
    setText('abilityButton',p.abilityCooldown > 0 ? `${Math.ceil(p.abilityCooldown)}s` : ABILITY_BUTTON_NAMES[game.selected]);
    $('abilityButton').disabled = p.abilityCooldown > 0;
    $('abilityButton').setAttribute('aria-label', `${ability} ${p.abilityCooldown > 0 ? `ready in ${Math.ceil(p.abilityCooldown)} seconds` : 'ready, use ability'}`);
    const buffs=[];
    if (p.overdrive>0) buffs.push(`OVERDRIVE ${Math.ceil(p.overdrive)}s`);
    if (p.magnet>0) buffs.push(`MAGNET ${Math.ceil(p.magnet)}s`);
    if (p.scoreBoost>0) buffs.push(`2× SCORE ${Math.ceil(p.scoreBoost)}s`);
    setText('upgradeStatus',buffs.join(' · '));
    $('bossHud').classList.toggle('hidden', !game.boss);
    if (game.boss) {
      setText('bossName',bossName(game.boss));
      setText('bossPhase',game.boss.lock?'REACH SAFE ZONE':game.enemies.some(e=>e.type==='generator'&&e.hp>0)?'DESTROY GENERATORS':game.enemies.some(e=>e.type==='echo'&&e.hp>0)?'DESTROY ECHO':game.boss.guard?'SHIELDED':game.boss.stage>1?`PHASE ${game.boss.stage}`:'');
      $('bossHud').classList.toggle('enraged',game.boss.enraged);
      const bossPct = clamp(game.boss.hp / game.boss.maxHp, 0, 1) * 100;
      setWidth('bossHealthBar',`${bossPct}%`);
      setText('bossHealthText',`${Math.ceil(bossPct)}%`);
    }
  }

  function toast(message, seconds = 2.3) {
    $('gameToast').textContent = message;
    $('gameToast').classList.add('show');
    game.toastClock = seconds;
  }

  function resize() {
    const rect = frame.getBoundingClientRect();
    const oldW = W, oldH = H;
    W = Math.max(300, rect.width);
    H = Math.max(360, rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (game.player && oldW > 0 && oldH > 0) {
      game.player.x = clamp(game.player.x * W / oldW, 24, W-24);
      game.player.y = clamp(game.player.y * H / oldH, 100, H-25);
    }
    if (pointerTarget) {
      pointerTarget.x = clamp(pointerTarget.x * W / oldW, 24, W-24);
      pointerTarget.y = clamp(pointerTarget.y * H / oldH, 115, H-27);
    }
    if (!backgroundDecor.length) {
      for (let i = 0; i < 16; i++) backgroundDecor.push(makeDecor(rand(-100, H)));
    }
  }

  function makeDecor(y = -110) {
    return { x:rand(-45, W+45), y, size:rand(13,55), speed:rand(.4,.85), kind:Math.random() < .6 ? 'mist':'terrain', seed:rand(0,1000) };
  }
