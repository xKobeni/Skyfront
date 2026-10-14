// Run lifecycle, story stages, scores, and sound.
  function startGame() {
    if(!fighterUnlocked(game.selected)) {showMenuNotice(fighterUnlockText(game.selected));return false;}
    const ship = selectedShip();
    game.status = 'playing';
    game.score = 0; game.kills = 0; game.wave = game.mode==='story'?storySelected:1; game.waveTime = 0; game.intermission=0; game.time = 0; game.storyMiniDefeated=false;game.storyAdvancePending=false;game.menuNoticeClock=0;$('menuNotice').classList.add('hidden');
    game.spawnClock = 2.4; game.pickupClock = 20; game.screenshake = 0; game.hitFlash=0;
    game.combo=0; game.comboClock=0; game.formationClock=8; game.hazardClock=9;
    game.masteryClock=0;game.masteryCount=0;
    game.convoy=game.mode==='escort'?{x:W/2,y:H-90,hp:8,maxHp:8,invulnerable:0,age:0}:null;
    game.objective=null;game.objectiveClock=8;game.objectiveCount=0;game.rushRisks={hp:1,rate:1,speed:1};
    game.route='safe';game.pendingUpgrade=false;game.bonusClock=11;game.bonusCount=0;game.mapProps=[];game.rescue=null;game.rescueWave=0;game.wingmanReady=false;game.wingman=null;game.hitStop=0;
    game.hazard=null; game.miniBossWave=0; game.miniBossKills=0; game.upgradeOptions=[]; game.popups=[]; game.newPaints=[];
    game.bullets = []; game.beams=[]; game.hostileBullets = []; game.enemies = []; game.particles = []; game.rings=[]; game.pickups = []; game.boss = null;
    game.player = { x: W*.5, y:H*.78, targetX:W*.5, targetY:H*.78, hp:ship.hull,
      maxHp:ship.hull, shield:(game.mode==='rush'&&game.difficulty==='easy')||(game.mode==='story'&&game.storyDifficulty==='easy')?2:0, weaponLevel:1, speed:ship.speed, invulnerable:1.3,
      fireClock:0, exhaustClock:0, radius:18, bank:0, abilityCooldown:0, abilityTime:0,
      overdrive:0, magnet:0, scoreBoost:0, damageBoost:1, rateBoost:1, evolution:null,
      momentum:0,dashCooldown:0,dashTime:0,dashVx:0,dashVy:0,dashThreaded:false };
    if(game.mode==='story' && game.wave>1) {
      const chapter=Math.floor((game.wave-1)/6);
      game.player.weaponLevel=Math.min(4,1+chapter);
      game.player.damageBoost=1+chapter*.12;
      game.player.shield=Math.min(3,game.player.shield+Math.min(2,chapter));
    }
    pressed.clear(); pointerHeld = false; pointerTarget = null;
    setupMapProps();
    showScreen('playing');
    if (game.mode==='story') enterStoryStage();
    else if (game.mode==='rush') spawnBoss();
    else offerRoute();
    refreshHud();
    wakeAudio();
  }

  function enterStoryStage() {
    if(game.mode!=='story') return;
    game.waveTime=0;game.storyMiniDefeated=false;game.storyEncounterClock=12+Math.floor((game.wave-1)/6)*1.5;game.storyEncounterSpawned=false;game.spawnClock=1.15;game.formationClock=9;game.hazardClock=storyPart(game.wave)===2?3.5:10;
    game.enemies=[];game.hostileBullets=[];game.objective=null;game.rescue=null;game.hazard=null;
    setupMapProps();
    const chapter=storyChapter(game.wave),part=storyPart(game.wave);
    $('zoneName').textContent=chapter.map;$('hudZoneName').textContent=chapter.map;
    toast(`MISSION ${storyLabel(game.wave)} · ${storyBeat(game.wave).toUpperCase()}`,3.2);
    refreshHud();
  }

  function launchStoryEncounter() {
    if(game.mode!=='story'||game.storyEncounterSpawned) return;
    game.storyEncounterSpawned=true;
    if(storyPart(game.wave)===3) {
      const e=spawnEnemy({type:'storyMini',x:W/2,y:-95,fireClock:2});
      e.miniVariant=Math.floor((game.wave-1)/6);
      toast(`⚠ ${storyChapter(game.wave).mini} INBOUND`,2.5);
    } else if(storyPart(game.wave)===5) spawnBoss();
  }

  function completeStoryStage() {
    if(game.mode!=='story'||game.status!=='playing') return;
    const completed=game.wave,previousUnlocked=storyUnlocked;
    storyUnlocked=Math.max(storyUnlocked,Math.min(30,completed+1));
    storySelected=storyUnlocked;
    try {localStorage.setItem('skyfront-story-unlocked',String(storyUnlocked));} catch (_) {}
    if(completed===30) {storyCleared=true;try {localStorage.setItem('skyfront-story-cleared','yes');} catch (_) {}}
    endGame(true);
    goToHangar();
    setMenuTab('mission');
    const newFighters=Object.keys(FIGHTER_UNLOCKS).filter(ship=>FIGHTER_UNLOCKS[ship]>=previousUnlocked && FIGHTER_UNLOCKS[ship]<storyUnlocked).map(ship=>SHIPS[ship].name);
    showMenuNotice(`MISSION ${storyLabel(completed)} CLEAR · ${completed===30?'STORY COMPLETE':`MISSION ${storyLabel(storyUnlocked)} UNLOCKED`}${newFighters.length?' · '+newFighters.join(', ')+' UNLOCKED':''}`);
  }

  function endGame(victory=false) {
    if (game.status !== 'playing') return;
    game.status = 'over';
    const convoyLost=game.mode==='escort' && game.convoy?.hp===0;
    $('screenFlash').classList.remove('show');
    burst(convoyLost?game.convoy.x:game.player.x,convoyLost?game.convoy.y:game.player.y,convoyLost?'#ffbc84':selectedShip().color,victory?24:43,230);
    playSound(victory?'pickup':'death');
    const isRecord = game.score > rushBest();
    const isShipRecord = game.score > rushShipBest();
    if(victory && game.mode==='sector' && game.selected==='warbird') unlockPaint('ace');
    if(game.miniBossKills>=3) unlockPaint('chrome');
    if(victory && game.mode==='rush') unlockPaint('ember');
    const newPaints=game.newPaints;
    if (isRecord) {
      if(game.mode==='rush') {
        rushBests[game.difficulty]=game.score;
        try { localStorage.setItem('skyfront-epoch-strike-rush-bests',JSON.stringify(rushBests)); } catch (_) {}
      } else {
        modeBests[game.mode] = game.score;
        try { localStorage.setItem('skyfront-epoch-strike-mode-bests', JSON.stringify(modeBests)); } catch (_) {}
      }
      if (game.mode==='endless') try { localStorage.setItem('skyfront-epoch-strike-best', String(game.score)); } catch (_) {}
    }
    if (isShipRecord) {
      if(game.mode==='rush') {
        rushShipBests[game.difficulty][game.selected]=game.score;
        try { localStorage.setItem('skyfront-epoch-strike-rush-ship-bests',JSON.stringify(rushShipBests)); } catch (_) {}
      } else {
        shipBests[game.mode][game.selected] = game.score;
        try { localStorage.setItem('skyfront-epoch-strike-mode-ship-bests', JSON.stringify(shipBests)); } catch (_) {}
      }
      if (game.mode==='endless') try { localStorage.setItem('skyfront-epoch-strike-ship-bests', JSON.stringify(shipBests.endless)); } catch (_) {}
    }
    $('bestScore').textContent = pad(rushBest());
    $('endScore').textContent = pad(game.score);
    $('endWave').textContent = game.mode==='story'?storyLabel(game.wave):pad(game.wave, 2);
    $('endKills').textContent = String(game.kills);
    $('endEyebrow').textContent=convoyLost?'CONVOY LOST':(game.mode==='rush'?DIFFICULTIES[game.difficulty].name+' ':'')+(victory?`${MODES[game.mode].name} COMPLETE`:'TRANSMISSION LOST');
    $('endTitle').innerHTML=victory?'MISSION <em>CLEAR.</em>':convoyLost?'MISSION <em>FAILED.</em>':'GAME <em>OVER.</em>';
    $('recordText').textContent = newPaints.length?`PAINT UNLOCKED · ${newPaints.join(', ')}`:isRecord ? `✦ NEW ${MODES[game.mode].name} BEST ✦` : isShipRecord ? `✦ NEW ${selectedShip().name} BEST ✦` : victory?'ALL SECTORS CLEARED':'TRY AGAIN. FLY FURTHER.';
    $('gameToast').classList.remove('show');
    showScreen('over');
  }

  function goToHangar() {
    game.status = 'menu';
    game.bullets = []; game.beams=[]; game.hostileBullets = []; game.enemies = []; game.pickups = []; game.particles = []; game.boss = null; game.popups=[]; game.combo=0;
    game.wave = game.mode==='story'?storySelected:1; game.player = null; game.hazard=null;
    $('gameToast').classList.remove('show');
    $('screenFlash').classList.remove('show');
    pressed.clear(); pointerHeld = false; pointerTarget = null;
    showScreen('menu');
  }

  function togglePause() {
    if (game.status === 'playing') {
      game.status = 'paused'; pressed.clear(); pointerHeld = false;
      showScreen('paused');
    } else if (game.status === 'paused') {
      game.status = 'playing';
      showScreen('playing');
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    $('soundButton').innerHTML = soundEnabled ? '♪ <span>SOUND ON</span>' : '♪ <span>SOUND OFF</span>';
    $('soundButton').setAttribute('aria-pressed', String(soundEnabled));
    if (soundEnabled) wakeAudio();
  }

  function wakeAudio() {
    if (!soundEnabled) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audio) audio = new AC();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
    } catch (_) {}
  }

  function playSound(kind) {
    if (!soundEnabled || !audio || audio.state !== 'running') return;
    const now = audio.currentTime;
    if (kind === 'shot' && now-lastShotSound < .075) return;
    if (kind === 'shot') lastShotSound = now;
    const params = SOUND_SETTINGS[kind];
    if (!params) return;
    const [start, end, duration, gainValue, type] = params;
    try {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(start, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1,end), now + duration);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainValue, now+.008);
      gain.gain.exponentialRampToValueAtTime(.0001, now+duration);
      osc.connect(gain); gain.connect(audio.destination);
      osc.start(now); osc.stop(now+duration+.01);
    } catch (_) {}
  }
