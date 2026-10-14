'use strict';

/* SKYFRONT: EPOCH STRIKE — dependency-free canvas arcade prototype. */
// Game data: aircraft, maps, modes, enemies, upgrades, and constants.
(() => {
  const elements=new Map();
  const $ = id => {
    if(!elements.has(id)) elements.set(id,document.getElementById(id));
    return elements.get(id);
  };
  const setText=(id,value)=>{const element=$(id);if(element.textContent!==value) element.textContent=value;};
  const setWidth=(id,value)=>{const element=$(id);if(element.style.width!==value) element.style.width=value;};
  const canvas = $('gameCanvas');
  const frame = $('gameFrame');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) { alert('This browser does not support HTML5 Canvas.'); return; }

  const SHIPS = {
    warbird: { name: 'FALCON MK. I', hull: 6, speed: 315, rate: .175, color: '#b7e6ab', label: 'TWIN CANNONS', description: 'Reinforced prop fighter. Twin cannons and six hull points make it a forgiving choice for new pilots.' },
    jet: { name: 'VIPER X', hull: 4, speed: 415, rate: .135, color: '#84d4ff', label: 'MULTI-LAUNCH GUNS', description: 'A fast interceptor with quick three-way fire. High mobility, but a smaller hull health reserve.' },
    nova: { name: 'NOVA SPECTRE', hull: 5, speed: 360, rate: .22, color: '#dbacff', label: 'PIERCING PLASMA', description: 'Futuristic assault craft. Slower, high-impact plasma rounds pierce multiple enemies.' },
    kestrel: { name: 'KESTREL M-7', hull: 5, speed: 335, rate: .58, color: '#ffca83', label: 'HOMING MISSILES', description: 'Missile hunter. Rockets track targets and detonate in a small blast. Its ability launches an instant salvo.' },
    ray: { name: 'RAY SPECTER', hull: 4, speed: 385, rate: .39, color: '#9bfff0', label: 'PULSE LASERS', description: 'Precision laser craft. Beams strike enemies along their full path. Focus mode rapidly pulses the beam.' }
  };
  const MASTERY_HINTS={
    warbird:'CLOSE PASS · Defeat an enemy nearby.',
    jet:'NEAR MISS · Let a hostile shot pass close by.',
    nova:'PIERCE CHAIN · Hit two targets with one round.',
    kestrel:'LONG LOCK · Land a missile after a long chase.',
    ray:'LINE BREAK · Hit two targets with one beam.'
  };
  const ZONES = [
    { name:'PACIFIC FRONT', kind:'sea', boss:'PACIFIC ACE', specialist:'raider', top:'#09243a', bottom:'#0c5364', line:'#3a8e92', deco:'#276a65' },
    { name:'DUST FRONTIER', kind:'dust', boss:'DUST MARSHAL', specialist:'striker', top:'#292736', bottom:'#766050', line:'#ba9584', deco:'#ac7960' },
    { name:'NEON RIFT', kind:'neon', boss:'RIFT SENTINEL', specialist:'drone', top:'#151532', bottom:'#3a235f', line:'#9563cb', deco:'#8f5de1' },
    { name:'FROST EXPANSE', kind:'frost', boss:'FROST WARDEN', specialist:'skimmer', top:'#102b3b', bottom:'#668ba1', line:'#b7e8f0', deco:'#a2d9df' },
    { name:'STORM BELT', kind:'storm', boss:'TEMPEST CROWN', specialist:'sparker', top:'#0d192d', bottom:'#34475d', line:'#82a8c4', deco:'#455e79' },
    { name:'EMBER WASTES', kind:'ember', boss:'EMBER TYRANT', specialist:'phoenix', top:'#311a26', bottom:'#8a3429', line:'#e78353', deco:'#843e36' }
  ];
  const MODES = {
    story:{name:'STORY MODE',description:'Play one mission at a time across five chapters. Clear missions to unlock fighters, minibosses, and commanders.',waves:30,duration:42},
    endless:{name:'ENDLESS',description:'Survive as long as you can. A new commander appears every third wave.',waves:Infinity,duration:19},
    sector:{name:'SECTOR RUN',description:'Cross all six maps in six waves. Defeat commanders on waves 3 and 6.',waves:6,duration:16},
    rush:{name:'BOSS RUSH',description:'Eight commanders, including two final nightmares. Choose your threat level below.',waves:8,duration:0},
    escort:{name:'CONVOY ESCORT',description:'Guard a moving carrier through six maps. Lose the convoy, lose the run.',waves:6,duration:20}
  };
  const PACTS=[
    {name:'HOT SHOT',reward:'Weapon level +1',risk:'Boss attacks 12% faster',apply(p){p.weaponLevel=Math.min(4,p.weaponLevel+1);game.rushRisks.rate*=.88;}},
    {name:'IRON WING',reward:'Repair 2 hull',risk:'Future bosses gain 14% hull',apply(p){p.hp=Math.min(p.maxHp,p.hp+2);game.rushRisks.hp*=1.14;}},
    {name:'FLASH BURN',reward:'Damage +18%',risk:'Boss shots travel 12% faster',apply(p){p.damageBoost*=1.18;game.rushRisks.speed*=1.12;}},
    {name:'GUARD BREAK',reward:'Gain 1 shield',risk:'Boss attacks 10% faster',apply(p){p.shield=Math.min(3,p.shield+1);game.rushRisks.rate*=.9;}},
    {name:'OVERCHARGE',reward:'Fire 12% faster',risk:'Future bosses gain 12% hull',apply(p){p.rateBoost*=.88;game.rushRisks.hp*=1.12;}}
  ];
  const DIFFICULTIES={
    easy:{name:'EASY',description:'Training sortie · weaker bosses, slower volleys, and two starting shields.',hp:.78,rate:1.28,speed:.82,score:1},
    medium:{name:'MEDIUM',description:'Standard sortie · escalating phases and a fair fight.',hp:1,rate:1,speed:1,score:1},
    extreme:{name:'EXTREME',description:'No mercy · fortified bosses, faster attacks, extra phase-three pressure, 1.5× score.',hp:1.5,rate:.76,speed:1.2,score:1.5}
  };
  const RUSH_ZONES=[0,1,2,3,4,5,2,4];
  const STORY_CHAPTERS=[
    {title:'THE BROKEN HORIZON',map:'SHATTERED ARCHIPELAGO',brief:'Find the missing signal above the flooded islands.',boss:'TIDAL SOVEREIGN',mini:'REEF BREAKER',enemy:'flak',zone:0,kind:'sea',top:'#092a3b',bottom:'#167887',line:'#75dad0',deco:'#318b82',scene:'islands'},
    {title:'ASHES OF THE FRONT',map:'RED CANYON PASS',brief:'Break the blockade before the convoy reaches the gorge.',boss:'CANYON COLOSSUS',mini:'DUNE LANCER',enemy:'mine',zone:1,kind:'dust',top:'#332538',bottom:'#ba694a',line:'#ffc18c',deco:'#b76e4d',scene:'canyon'},
    {title:'GHOST FREQUENCY',map:'AURORA ARRAY',brief:'Trace the false distress calls through the frozen array.',boss:'AURORA PHANTOM',mini:'POLAR HUNTER',enemy:'hunter',zone:3,kind:'frost',top:'#102c48',bottom:'#377d9b',line:'#9df9e5',deco:'#7dc4dd',scene:'aurora'},
    {title:'THE ENGINE BELOW',map:'OBSIDIAN FOUNDRY',brief:'Disable the war factory and its living heat shield.',boss:'FORGE TITAN',mini:'FURNACE CARRIER',enemy:'carrier',zone:5,kind:'ember',top:'#261924',bottom:'#a94132',line:'#ffad6f',deco:'#7c3834',scene:'foundry'},
    {title:'LAST LIGHT',map:'ECLIPSE CITADEL',brief:'Reach the core and end the signal that started the war.',boss:'NULL EMPEROR',mini:'PHASE WRAITH',enemy:'phase',zone:2,kind:'neon',top:'#10112d',bottom:'#493260',line:'#d9a7ff',deco:'#8f6fcb',scene:'citadel'}
  ];
  const STORY_ZONES=STORY_CHAPTERS.map(chapter=>({...chapter,name:chapter.map,specialist:chapter.enemy}));
  const STORY_ENEMY_POOLS=[
    ['scout','scout','interceptor','raider','flak'],
    ['scout','interceptor','striker','mine','bomber'],
    ['interceptor','skimmer','hunter','drone','shield'],
    ['interceptor','phoenix','carrier','mine','bomber'],
    ['interceptor','drone','phase','ace','shield']
  ];
  const ENEMY_STATS={
    scout:[2.7,19,128,100],interceptor:[3,17,196,140],bomber:[10.5,29,94,250],
    raider:[3.5,19,158,170],striker:[5.5,21,122,210],drone:[3.8,18,175,190],
    skimmer:[4.2,18,184,195],sparker:[4.6,19,145,205],phoenix:[5.2,21,165,230],
    shield:[8,22,112,240],medic:[5.5,20,106,235],ambusher:[3.8,18,205,185],mini:[30,37,80,900],
    ace:[8,21,145,420],missile:[7,18,185,500],radar:[14,27,110,600],generator:[19,24,0,500],echo:[26,34,0,650],
    supply:[12,24,0,750],bonusAce:[13,20,0,900],flak:[5,21,115,215],mine:[6,19,85,225],
    hunter:[5,19,175,240],carrier:[11,29,82,320],phase:[6,20,155,270],storyMini:[55,39,82,1250]
  };
  const ENEMY_COLORS={
    scout:['#a44e5c','#e78a70','#ffc19c'],interceptor:['#be6c66','#f3a080','#ffd0a8'],
    bomber:['#8f4854','#d3746d','#ffbd9d'],raider:['#537a62','#a2bf83','#dcffa9'],
    striker:['#966a44','#d29a65','#ffe1a3'],drone:['#694eaa','#ac83e8','#ecc9ff'],
    skimmer:['#4a8e9d','#8bd7e4','#d1faff'],sparker:['#3d6884','#8bbce4','#c8edff'],
    phoenix:['#a34738','#ec8454','#ffd69b'],shield:['#326d78','#75cdd4','#b6fff8'],
    medic:['#45785e','#8cdba4','#d4ffdd'],ambusher:['#8f6637','#e2ae69','#ffe2a7'],
    mini:['#794245','#e48e75','#ffe0ad'],ace:['#9d6937','#ffdc93','#fff2c0'],
    supply:['#496d60','#b4e7b7','#e6ffe4'],bonusAce:['#966246','#ffd297','#fff1c0'],
    missile:['#9a483d','#ff785e','#ffe19d'],radar:['#40667c','#87d3e5','#d9fbff'],
    generator:['#574182','#be9bff','#ead8ff'],echo:['#315e7a','#9ce5ff','#e4fbff'],
    flak:['#406e68','#88d6bd','#d3ffdf'],mine:['#8f6042','#dda473','#ffe5b2'],
    hunter:['#47748a','#8dd8ee','#d0ffff'],carrier:['#7d4546','#d28171','#ffd0a6'],
    phase:['#64468c','#ae8cde','#efc9ff'],storyMini:['#69425d','#d497ad','#ffe8c3']
  };
  const PICKUP_COLORS={repair:'#bdf86a',shield:'#79e6ff',power:'#edb3ff',armor:'#ffd994',overdrive:'#ffab6e',magnet:'#8af4cd',score:'#ffe87e',cache:'#fff2a1'};
  const BOSS_PALETTES=[
    ['#426f69','#c3f3cd','#a7e6d2'],['#916346','#ffcf9c','#efae79'],['#62468d','#e1c0ff','#b98bea'],
    ['#3d7189','#d6f7ff','#93deed'],['#365472','#c0defb','#7ba9dc'],['#8c3f37','#ffd2a0','#f29961']
  ];
  const ABILITY_NAMES={warbird:'AEGIS',jet:'AFTERBURN',nova:'PLASMA PULSE',kestrel:'MISSILE SALVO',ray:'LASER FOCUS'};
  const ABILITY_BUTTON_NAMES={warbird:'AEGIS',jet:'BOOST',nova:'PULSE',kestrel:'SALVO',ray:'FOCUS'};
  const SHIP_KEYS=Object.keys(SHIPS);
  const SOUND_SETTINGS={
    shot:[420,200,.035,.022,'triangle'],hit:[210,90,.11,.055,'square'],
    boom:[110,35,.19,.09,'sawtooth'],pickup:[500,1080,.25,.07,'sine'],
    dash:[650,240,.11,.045,'triangle'],impact:[160,55,.24,.12,'sawtooth'],
    armor:[310,80,.14,.07,'square'],death:[280,34,.55,.15,'sawtooth']
  };
  const STORY_DIFFICULTIES={easy:{name:'EASY',description:'More room to learn: softer enemies, slower volleys, and two starting shields.',hp:.8,rate:1.25,speed:.84,score:1},medium:{name:'NORMAL',description:'The intended campaign pace and threat level.',hp:1,rate:1,speed:1,score:1},extreme:{name:'HARD',description:'Tougher enemies, faster attacks, and 1.5× score.',hp:1.3,rate:.8,speed:1.16,score:1.5}};
  const STORY_BEATS=[
    ['The missing patrol','A signal breaks through','The harbor is under fire','Reef Breaker blocks the route','The fleet below','Tidal Sovereign rises'],
    ['Into the canyon','Ambush at the pass','The mine corridor','Dune Lancer attacks','Break the blockade','Canyon Colossus falls'],
    ['A false distress call','Shadows in the ice','The aurora maze','Polar Hunter closes in','Find the true frequency','Aurora Phantom revealed'],
    ['The factory gate','Heat from below','The assembly lines','Furnace Carrier deployed','Destroy the power core','Forge Titan awakens'],
    ['The last approach','Citadel defense','The fractured sky','Phase Wraith intercepts','The core is exposed','End the signal']
  ];
  const storyLabel=wave=>`${Math.floor((wave-1)/6)+1}${(wave-1)%6?'.'+(wave-1)%6:''}`;
  const storyChapter=wave=>STORY_CHAPTERS[clamp(Math.floor((wave-1)/6),0,4)];
  const storyPart=wave=>(wave-1)%6;
  const storyBeat=wave=>STORY_BEATS[Math.floor((wave-1)/6)][storyPart(wave)];
  const FIGHTER_UNLOCKS={warbird:0,jet:3,nova:6,kestrel:12,ray:18};
  const FIELD_UPGRADES = [
    {id:'damage',name:'ARMAMENT',description:'Deal 15% more damage with every weapon.'},
    {id:'rate',name:'QUICK TRIGGER',description:'Fire 12% faster.'},
    {id:'speed',name:'THRUSTERS',description:'Move 10% faster.'},
    {id:'hull',name:'REINFORCED HULL',description:'Gain 1 maximum hull and restore 2 hull.'},
    {id:'shield',name:'SHIELD CELL',description:'Gain 2 shield charges, up to 3.'},
    {id:'weapon',name:'WEAPON TUNE',description:'Raise weapon level by 1, up to level 4.'}
  ];
  const PAINTS = {
    standard:{name:'ORIGINAL',color:null,goal:'Available from the start'},
    ace:{name:'ACE GREEN',color:'#baff88',goal:'Clear Sector Run with Falcon Mk. I'},
    chrome:{name:'CHROME',color:'#c8efff',goal:'Destroy 3 mini-bosses in one Endless flight'},
    ember:{name:'EMBER',color:'#ff9d68',goal:'Clear Boss Rush'}
  };
  const EVOLUTIONS = {
    warbird:[{id:'rapid',name:'RAPID CANNONS',description:'Twin cannons fire 25% faster.'},{id:'shell',name:'BURST SHELLS',description:'Cannon hits splash nearby enemies.'}],
    jet:[{id:'focus',name:'FOCUSED BURST',description:'Spread shots hit 30% harder.'},{id:'wide',name:'WIDE ARRAY',description:'Add two outer firing lanes.'}],
    nova:[{id:'lance',name:'HEAVY LANCE',description:'Main plasma round hits harder and pierces further.'},{id:'split',name:'SPLIT PLASMA',description:'Add two side plasma bolts.'}],
    kestrel:[{id:'cluster',name:'CLUSTER WARHEADS',description:'Missile blast radius grows by 60%.'},{id:'swarm',name:'SWARM LAUNCHER',description:'Launch two additional homing missiles.'}],
    ray:[{id:'overcharge',name:'OVERCHARGE',description:'Laser beams hit 35% harder.'},{id:'prism',name:'PRISM BEAM',description:'Laser beams grow wider and add two outer beams.'}]
  };
