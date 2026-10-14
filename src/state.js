// Shared runtime state, persistence, and math helpers.
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pad = (n, len = 6) => String(Math.max(0, Math.floor(n))).padStart(len, '0');
  const distanceSq = (ax, ay, bx, by) => (ax-bx)**2 + (ay-by)**2;

  let W = 720, H = 750, dpr = 1, lastTime = 0;
  const backgroundCache={zone:null,width:0,height:0,dpr:0,gradient:null,vignette:null};
  let backgroundScroll = 0, ambientTime = 0, nextEnemyId = 1;
  let backgroundDecor = [];
  let pointerHeld = false, pointerTarget = null;
  const pressed = new Set();
  let soundEnabled = true, audio = null, lastShotSound = 0;
  const modeBests=Object.fromEntries(Object.keys(MODES).map(mode=>[mode,0]));
  const shipBests=Object.fromEntries(Object.keys(MODES).map(mode=>[mode,Object.fromEntries(Object.keys(SHIPS).map(ship=>[ship,0]))]));
  const rushBests={easy:0,medium:0,extreme:0};
  const rushShipBests=Object.fromEntries(Object.keys(DIFFICULTIES).map(level=>[level,Object.fromEntries(Object.keys(SHIPS).map(ship=>[ship,0]))]));
  let storyUnlocked=1;
  let storySelected=1;
  let storyCleared=false;
  try { storyUnlocked=clamp(Math.floor(Number(localStorage.getItem('skyfront-story-unlocked'))||1),1,30); storySelected=storyUnlocked; } catch (_) {}
  try {storyCleared=localStorage.getItem('skyfront-story-cleared')==='yes';} catch (_) {}
  const unlockedPaints=new Set(['standard']);
  let selectedPaint='standard';
  try {
    const saved=JSON.parse(localStorage.getItem('skyfront-epoch-strike-paints')||'[]');
    if(Array.isArray(saved)) for(const id of saved) if(PAINTS[id]) unlockedPaints.add(id);
    const choice=localStorage.getItem('skyfront-epoch-strike-selected-paint');
    if(unlockedPaints.has(choice)) selectedPaint=choice;
  } catch (_) {}
  try { modeBests.endless = Math.max(0, Number(localStorage.getItem('skyfront-epoch-strike-best')) || 0); } catch (_) {}
  try {
    const saved = JSON.parse(localStorage.getItem('skyfront-epoch-strike-ship-bests') || '{}');
    for (const ship of Object.keys(SHIPS)) shipBests.endless[ship] = Math.max(0, Number(saved[ship]) || 0);
  } catch (_) {}
  try {
    const saved = JSON.parse(localStorage.getItem('skyfront-epoch-strike-mode-bests') || '{}');
    for (const mode of Object.keys(MODES)) modeBests[mode] = Math.max(modeBests[mode],Number(saved[mode]) || 0);
    const byShip = JSON.parse(localStorage.getItem('skyfront-epoch-strike-mode-ship-bests') || '{}');
    for (const mode of Object.keys(MODES)) for (const ship of Object.keys(SHIPS))
      shipBests[mode][ship] = Math.max(shipBests[mode][ship],Number(byShip[mode]?.[ship]) || 0);
  } catch (_) {}
  rushBests.medium=modeBests.rush;
  for(const ship of Object.keys(SHIPS)) rushShipBests.medium[ship]=shipBests.rush[ship];
  try {
    const saved=JSON.parse(localStorage.getItem('skyfront-epoch-strike-rush-bests')||'{}');
    const byShip=JSON.parse(localStorage.getItem('skyfront-epoch-strike-rush-ship-bests')||'{}');
    for(const level of Object.keys(DIFFICULTIES)) {
      rushBests[level]=Math.max(rushBests[level],Number(saved[level])||0);
      for(const ship of Object.keys(SHIPS)) rushShipBests[level][ship]=Math.max(rushShipBests[level][ship],Number(byShip[level]?.[ship])||0);
    }
  } catch (_) {}

  const game = {
    status:'menu', selected:'warbird', mode:'endless', difficulty:'medium', storyDifficulty:'medium', storyMiniDefeated:false, storyAdvancePending:false, storyEncounterClock:0, storyEncounterSpawned:false, menuNoticeClock:0, player:null, convoy:null, objective:null, objectiveClock:8, objectiveCount:0, rushRisks:{hp:1,rate:1,speed:1}, route:'safe', pendingUpgrade:false, bonusClock:11, bonusCount:0, mapProps:[], rescue:null, rescueWave:0, wingmanReady:false, wingman:null, hitStop:0, score:0, kills:0, wave:1, waveTime:0, intermission:0,
    time:0, spawnClock:0, pickupClock:0, toastClock:0, screenshake:0, hitFlash:0,
    combo:0, comboClock:0, formationClock:0, hazardClock:0, hazard:null, miniBossWave:0, miniBossKills:0,
    masteryClock:0, masteryCount:0,
    upgradeOptions:[], choiceKind:'field', popups:[], newPaints:[],
    bullets:[], beams:[], hostileBullets:[], enemies:[], particles:[], rings:[], pickups:[], boss:null
  };
