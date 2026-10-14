// Pickups, score, mastery, upgrade choices, and contracts.
  function spawnPickup(x = rand(50,W-50), y = -28, forceType=null) {
    const r = Math.random();
    const type = forceType || (r < .22 ? 'repair' : r < .43 ? 'shield' : r < .58 ? 'power' :
      r < .72 ? 'overdrive' : r < .83 ? 'magnet' : r < .93 ? 'armor' : 'score');
    game.pickups.push({x:clamp(x,30,W-30),y:clamp(y,-28,H-65),type,age:0,vy:115,radius:15});
  }

  function addScore(points) {
    const awarded=Math.round(points*(game.player && game.player.scoreBoost>0?2:1)*(game.mode==='story'?STORY_DIFFICULTIES[game.storyDifficulty].score:game.mode==='rush'?DIFFICULTIES[game.difficulty].score:game.route==='danger'?1.25:1));
    game.score+=awarded;
    return awarded;
  }

  function comboMultiplier() { return Math.min(3,1+Math.floor(Math.max(0,game.combo-1)/3)*.5); }
  function scoreKill(points,x,y) {
    gainMomentum(points>=1000?14:points>=300?10:6);
    game.combo=game.comboClock>0?game.combo+1:1;
    game.comboClock=3.5;
    const awarded=addScore(Math.round(points*comboMultiplier()));
    game.popups.push({x,y,text:`+${awarded}`,life:.8,maxLife:.8,color:game.combo>=4?'#ffe891':'#d5ffb2'});
    if(game.combo===4 || game.combo===7 || game.combo===10) toast(`${game.combo} HIT COMBO · ×${comboMultiplier()}`,1.1);
    return awarded;
  }

  function awardMastery(label) {
    if(game.masteryClock>0 || game.status!=='playing') return 0;
    game.masteryClock=3.5;game.masteryCount++;
    const bonus=addScore(125);
    game.player.abilityCooldown=Math.max(0,game.player.abilityCooldown-.7);
    game.popups.push({x:game.player.x,y:game.player.y-42,text:`${label} +${bonus}`,life:1,maxLife:1,color:'#c8f56c'});
    toast(`${label} · +${bonus} · ABILITY -0.7s`,1.6);
    return bonus;
  }

  function offerUpgrade() {
    const pool=FIELD_UPGRADES.filter(upgrade=>!(upgrade.id==='weapon' && game.player.weaponLevel>=4) && !(upgrade.id==='shield' && game.player.shield>=3));
    for(let i=pool.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [pool[i],pool[j]]=[pool[j],pool[i]];
    }
    game.upgradeOptions=pool.slice(0,3);
    game.choiceKind='field';
    $('upgradeChoices').classList.remove('evolution');
    $('choiceEyebrow').textContent='FIELD SYSTEMS READY';
    $('choiceTitle').textContent='Choose an upgrade';
    $('choiceDescription').textContent='Pick one permanent boost for this flight. Press 1, 2, or 3.';
    $('upgradeChoices').innerHTML=game.upgradeOptions.map((upgrade,i)=>`<button class="upgrade-choice" type="button" data-upgrade="${i}"><small>0${i+1} / FIELD UPGRADE</small><strong>${upgrade.name}</strong><span>${upgrade.description}</span></button>`).join('');
    game.status='upgrade';
    pressed.clear(); pointerHeld=false;
    showScreen('upgrade');
  }

  function offerEvolution() {
    if(game.player.evolution || game.player.weaponLevel<4) return false;
    game.choiceKind='evolution';
    $('upgradeChoices').classList.add('evolution');
    game.upgradeOptions=EVOLUTIONS[game.selected];
    $('choiceEyebrow').textContent='WEAPON SYSTEM MAXED';
    $('choiceTitle').textContent='Evolve your weapon';
    $('choiceDescription').textContent='Choose one special weapon path for this flight. Press 1 or 2.';
    $('upgradeChoices').innerHTML=game.upgradeOptions.map((choice,i)=>`<button class="upgrade-choice" type="button" data-upgrade="${i}"><small>0${i+1} / WEAPON PATH</small><strong>${choice.name}</strong><span>${choice.description}</span></button>`).join('');
    game.status='upgrade';pressed.clear();pointerHeld=false;showScreen('upgrade');
    return true;
  }

  function offerPact() {
    game.choiceKind='pact';
    game.upgradeOptions=[0,1,2].map(i=>PACTS[(game.wave+i+game.difficulty.length)%PACTS.length]);
    $('upgradeChoices').classList.remove('evolution');
    $('choiceEyebrow').textContent='BOSS RUSH · FIELD CONTRACT';
    $('choiceTitle').textContent='Take a reward. Accept a risk.';
    $('choiceDescription').textContent='Every choice improves your aircraft and strengthens the remaining bosses. Press 1, 2, or 3.';
    $('upgradeChoices').innerHTML=game.upgradeOptions.map((choice,i)=>`<button class="upgrade-choice" type="button" data-upgrade="${i}"><small>0${i+1} / COMBAT CONTRACT</small><strong>${choice.name}</strong><span>+ ${choice.reward}<br>⚠ ${choice.risk}</span></button>`).join('');
    game.status='upgrade';pressed.clear();pointerHeld=false;showScreen('upgrade');
  }
  function offerRoute() {
    game.choiceKind='route';
    game.upgradeOptions=[
      {id:'safe',name:'SAFE CORRIDOR',description:'Repair 1 hull (or gain a shield if you have none). Fewer enemies in the next wave.'},
      {id:'danger',name:'DANGER CORRIDOR',description:'Gain a weapon level (or +6% damage at max level). More and tougher enemies; +25% score this wave.'}
    ];
    $('upgradeChoices').classList.add('evolution');
    $('choiceEyebrow').textContent=`WAVE ${pad(game.wave,2)} · FLIGHT PATH`;
    $('choiceTitle').textContent='Choose your route';
    $('choiceDescription').textContent='Take a safer approach or push through heavier resistance for a stronger reward. Press 1 or 2.';
    $('upgradeChoices').innerHTML=game.upgradeOptions.map((choice,i)=>`<button class="upgrade-choice" type="button" data-upgrade="${i}"><small>0${i+1} / ROUTE</small><strong>${choice.name}</strong><span>${choice.description}</span></button>`).join('');
    game.status='upgrade';pressed.clear();pointerHeld=false;showScreen('upgrade');
  }
  function chooseUpgrade(index) {
    if(game.status!=='upgrade' || !game.upgradeOptions[index]) return;
    const upgrade=game.upgradeOptions[index],p=game.player;
    const evolution=game.choiceKind==='evolution',pact=game.choiceKind==='pact',route=game.choiceKind==='route';
    if(evolution) p.evolution=upgrade.id;
    else if(pact) upgrade.apply(p);
    else if(route) {
      game.route=upgrade.id;
      if(upgrade.id==='safe') {if(p.hp<p.maxHp)p.hp=Math.min(p.maxHp,p.hp+1);else if(p.shield===0)p.shield++;else addScore(150);}
      else if(p.weaponLevel<4)p.weaponLevel++;
      else p.damageBoost*=1.06;
    }
    else if(upgrade.id==='damage') p.damageBoost*=1.15;
    else if(upgrade.id==='rate') p.rateBoost*=.88;
    else if(upgrade.id==='speed') p.speed*=1.10;
    else if(upgrade.id==='hull') {p.maxHp++;p.hp=Math.min(p.maxHp,p.hp+2);}
    else if(upgrade.id==='shield') p.shield=Math.min(3,p.shield+2);
    else if(upgrade.id==='weapon') p.weaponLevel=Math.min(4,p.weaponLevel+1);
    game.upgradeOptions=[]; game.status='playing';
    showScreen('playing');
    toast(`${upgrade.name} INSTALLED`,1.6);
    if(!evolution && (!pact || p.weaponLevel>=4) && offerEvolution()) return;
    if(game.pendingUpgrade) {game.pendingUpgrade=false;offerUpgrade();return;}
    if(game.mode==='rush' && !game.boss && game.intermission===0) spawnBoss();
    else if(game.mode!=='rush' && game.mode!=='story' && isBossWave() && !game.boss) spawnBoss();
    refreshHud();
  }

  function maybeOfferUpgrade() {
    if(game.mode==='rush'||game.mode==='story') return false;
    game.pendingUpgrade=game.wave>1 && (game.wave-1)%2===0;
    offerRoute();return true;
  }
