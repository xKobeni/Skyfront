# SKYFRONT: EPOCH STRIKE
## Game design + playable specification

**Genre:** Vertical-scrolling 2D arcade air combat  
**Platforms:** Desktop + touch-enabled browsers  
**Technology:** HTML5 Canvas, CSS3, JavaScript ES2020+, Web Audio API  
**Distribution:** Static website; no backend, install step, or package dependencies  
**Design promise:** Fly immediately, shoot automatically, master positioning, collect meaningful upgrades, and survive increasingly intense waves.

## 1. Core game fantasy

Five aircraft share the battlefield, from a robust WWII warbird to missile and laser craft. Each has a distinct primary weapon and ability. Story Mode plays one selected mission per sortie; Endless runs continue until defeat; Sector Run, Boss Rush, and Convoy Escort have a finish line. Each sortie starts with fresh upgrades, and later Story missions grant chapter catch-up power.

### Core loop

1. Choose an aircraft and mode in the hangar.
2. Launch sortie at full hull, level-one weapon and no shields.
3. Move to avoid warned shots and align with enemy formations. Shooting is automatic; use the aircraft ability when it matters.
4. Destroy foes to build a short combo, earn points and potentially drop upgrades.
5. Survive timed waves or commander encounters. Timed modes offer field upgrades at alternating wave breaks; Boss Rush offers a reward and a risk after each commander.
6. Finish the mode or fight until hull drops to zero. Compare mode and aircraft records, then retry.

## 2. Aircraft balance (initial values)

| Aircraft | Hull | Speed | Firing interval | Primary weapon | Ability |
| --- | --- | --- | --- | --- | --- |
| Falcon Mk. I | 6 | 315 px/s | 0.175 s | Twin cannons | Aegis barrier |
| Viper X | 4 | 415 px/s | 0.135 s | Rapid spread | Afterburn |
| Nova Spectre | 5 | 360 px/s | 0.22 s | Piercing plasma | Plasma Pulse |
| Kestrel M-7 | 5 | 335 px/s | 0.58 s | Homing splash missiles | Missile Salvo |
| Ray Specter | 4 | 385 px/s | 0.39 s | Instant pulse laser beams | Laser Focus |

**Active abilities:** Space or the on-screen button activates Aegis (2.5 seconds of protection, 15-second cooldown), Afterburn (2.5 seconds of faster movement and brief invulnerability, 13-second cooldown), Plasma Pulse (nearby bullet clear and area damage, 17-second cooldown), Missile Salvo (five homing rockets, 16-second cooldown), or Laser Focus (three seconds of faster pulses, 16-second cooldown).

**Flight:** Motion is frame-rate-independent. Keyboard axes are normalized to avoid diagonal speed boosts. Pointer/touch steers the player toward the dragged position with a speed cap. The plane is clamped inside the playable field.

## 3. Enemy combat system

| Type | First available | Base HP | Base downward speed | Behavior | Score |
| --- | --- | --- | --- | --- | --- |
| Scout | Wave 1 | 2.7 | 128 px/s | Gentle drift and occasional aimed shots | 100 |
| Interceptor | Wave 2 | 3 | 196 px/s | Weaves horizontally and fires aimed shots | 140 |
| Bomber | Wave 3 | 10.5 | 94 px/s | Heavy hull, launches three-shot spread | 250 |
| Commander (boss) | Mode-specific boss waves | 190 at first encounter; increases later | Enters and patrols top | Zone-specific volleys, health bar, bonus pickups on defeat | 3500+, scaling by later boss wave |

Each zone spawns a specialist: Pacific raiders fire paired shots; Dust strikers fire vertical lanes; Rift drones fire rotating fans; Frost skimmers fire crossing shots; Storm sparkers fire zigzag shots; Ember phoenixes dive and fire hot spreads. Scouts, interceptors, and bombers use different aimed, alternating, and spread volleys. All enemy shots have a short aim warning. Each zone's commander has its own color and attack pattern.

Regular waves also send matching aircraft in V, wall, and pincer formations. At 66% and 33% health, each commander enters a new phase with a warning and stronger attacks. Dust Marshal's phase shifts require the player to cross a telegraphed bullet wall and hold a marked safe zone to break its shield. The target moves if the player misses it.

Phase two also changes the objective of each fight. Pacific Ace exposes a weak engine; Dust Marshal fires a wall with one marked safe lane; Rift Sentinel brings drones; Frost Warden cycles a damage-reducing shield; Tempest Crown calls lightning; Ember Tyrant sends side ambushers. Commander health starts at 190 and increases by 30% per tier. Defeating one clears remaining enemies, grants a short spawn breather, and advances the wave immediately.

Shield carriers reduce damage to nearby allies, medics heal nearby enemies once a second, and ambushers enter from a side and cut across the field. Starting at wave four, regular non-boss waves bring one mini-boss near the midpoint. It uses a five-shot fan and drops one weapon or shield pickup when defeated.

**Scaling:** Regular enemy HP increases by 18% per wave, enemy downward speed grows by 6.5% per wave up to a cap, and spawn intervals shorten gradually. Wave one starts with roughly one enemy every 2.5 seconds; wave two remains lighter, and later waves peak near their end. The on-screen cap begins at six and rises to 28. Only a few support enemies can appear during a boss fight. Enemy warnings are limited to two early or four later so attacks remain readable.

**Damage model:** Bullets subtract weapon damage from enemy HP on collision. Piercing plasma can damage multiple distinct foes once each. Missiles steer toward visible enemies and damage targets in a small explosion. Laser pulses hit every enemy along the beam path. Enemy contact or hostile bullets damage player hull unless a shield charge is present. A brief invulnerability interval prevents instant multi-hit deaths.

## 4. Pickups and progression

| Pickup | Visual | Effect | Limits |
| --- | --- | --- | --- |
| Repair | Green diamond with plus | Restores up to 2 hull | Capped at current maximum hull |
| Shield | Cyan diamond | Adds 1 shield charge | Maximum 3 charges |
| Weapon | Violet diamond | Adds one weapon level | Maximum level 4 |
| Armor | Gold diamond | Adds 1 maximum hull and heals 1 | At most 3 extra hull |
| Overdrive | Orange diamond | Faster fire for 7 seconds | Stacks to 14 seconds |
| Magnet | Mint diamond | Pulls nearby pickups for 12 seconds | Stacks to 24 seconds |
| Double score | Yellow diamond | Doubles earned points for 12 seconds | Stacks to 24 seconds |

A random pickup enters the battlefield approximately every 20–24 seconds. Destroyed ordinary enemies have a 7% chance to drop one. Beating a boss drops one weapon upgrade and one shield upgrade. Regular pickups score 50 points, or 350 points when the benefit is already at its cap. Upgrade levels persist only within the current run.
A tactical cache also appears near an active map hazard and disappears when the hazard ends. Collecting it grants 300 score and removes two seconds from the aircraft ability cooldown; it gives no permanent power. This creates an optional risk during the hazard's active window.

At every second wave break (before waves 3, 5, and so on), the game pauses for a choice among three random field upgrades. Armament boosts damage by 15%; Quick Trigger shortens firing intervals by 12%; Thrusters raise movement speed by 10%; Reinforced Hull adds one maximum hull and repairs up to two; Shield Cell grants up to two shields; Weapon Tune raises weapon level up to four. Capped shield and weapon choices are withheld. These choices last for the current run and can be selected with the mouse, touch, or number keys.

Kills within 3.5 seconds build a combo. Every three kills increase the score multiplier by 0.5, up to 3×. Taking damage or letting the timer expire resets the combo. Pickups retain their normal scoring. Damage numbers, hit rings, and a player-screen flash show when attacks connect.

At weapon level four, the fight pauses for one of two aircraft-specific evolutions. Falcon chooses faster cannons or splash shells; Viper chooses stronger focused shots or extra spread lanes; Nova chooses a heavier piercing lance or side plasma bolts; Kestrel chooses larger blasts or extra missiles; Ray chooses stronger beams or wider beams with extra lanes. The choice lasts until the flight ends.

Each aircraft also has an Ace Move: Falcon earns a close-range kill, Viper dodges a close shot, Nova pierces two targets with one round, Kestrel lands a long-distance missile, and Ray lines up two targets in one beam. An Ace Move grants 125 score and removes 0.7 seconds from the ability cooldown. A 3.5-second reward cooldown prevents repeated farming.

## 5. Modes, waves, and maps

- **Story Mode:** Five chapters, six missions each, labeled `1`, `1.1`–`1.5` through `5`, `5.1`–`5.5`. Each sortie plays exactly one mission and returns to the hangar on success. Opening and middle missions last 42 seconds and bring a sustained enemy mix, formations, hazards, and pickups. Each `.3` and `.5` mission starts with regular enemies, then introduces its named miniboss or three-phase commander after an encounter lead-in. Clearing a mission saves the next unlocked mission in local storage; pilots can replay any unlocked mission. A later-stage replay starts with chapter-appropriate weapon, damage, and shield power.
- **Fighter unlocks:** Falcon is available immediately. Clearing Story 1.2, 1.5, 2.5, and 3.5 unlocks Viper, Nova, Kestrel, and Ray respectively across every mode. Locked craft remain visible in the carousel with their unlock requirement and cannot launch.
- **Story difficulty:** Easy grants two shields and reduces enemy/boss hull, movement, and firing frequency. Normal is the baseline. Hard adds hull, speed, and pressure, with a 1.5× score reward.
- **Story maps:** Shattered Archipelago, Red Canyon Pass, Aurora Array, Obsidian Foundry, and Eclipse Citadel have separate procedural scenery, chapter briefings, specialist enemies, minibosses, and commanders. Flak fires radial bursts, Mines fire a compact aimed fan, Hunters lead with fast volleys, Carriers deploy Mines, and Phase craft shift while firing.
- **Endless:** 19-second waves, with a boss every third wave. Zones change every three waves and cycle through all six maps.
- **Sector Run:** Six 16-second sectors, one map per wave. Bosses appear on waves 3 and 6. Defeating the last boss completes the run.
- **Boss Rush:** Eight commanders: one per map, then Eclipse Leviathan and Chrono Wraith. Each victory offers one combat contract, pairing an aircraft reward with a lasting risk. Easy slows attacks and grants two starting shields; Medium uses standard tuning; Extreme strengthens bosses, speeds attacks, and grants a score bonus. Each difficulty has separate records. Eclipse's numbered shield generators must be destroyed in order. Chrono splits off a firing echo that dampens damage to the main body.
- **Convoy Escort:** Six maps with a moving carrier that has eight hull points. Enemy aircraft and bullets threaten it. Destroying the final commander wins; losing the carrier ends the run.
- **Wave objectives:** Intercept a missile, destroy a radar craft before it calls reinforcements, or hold a moving safe zone. Completion grants score and a pickup; failure adds pressure or damages the carrier.
- **Maps:** Pacific Front, Dust Frontier, Neon Rift, Frost Expanse, Storm Belt, and Ember Wastes. Each has procedural colors and scenery, a specialist enemy, and a commander.
- **Map hazards:** Each map warns before its hazard activates. Pacific crosswinds push the aircraft; Dust clouds obscure and slow it; Neon pulses, Frost lanes, Storm lightning, and Ember vents deal one hit if the player remains in the marked area. A hazard can hit only once per activation.
- **Combat momentum:** Short dashes can thread bullets for momentum and a brief damage bonus. Accurate hits, kills, and near misses fill a meter that can be spent on an area strike or emergency shields. Taking damage removes momentum.
- **Boss parts and weapon combos:** Each commander has a cannon and engine to break. Lasers and wingman shots mark targets; repeated hits or plasma detonate a mark, and missiles seek and hit marked targets harder.
- **Optional risks:** Formation leaders can be picked off to scatter a group. Timed supply planes and fleeing aces carry rare pickups. Launch and later wave breaks offer a safe corridor or a stronger upgrade paired with increased enemy pressure.
- **Interactive maps and rescue:** Storm capacitors clear bullets and chain damage; Ember fuel tanks explode near friend or foe. Storm lightning and Ember vents also damage enemies. A timed rescue beacon can recruit a wingman for the next commander.
- Infinite movement is an illusion: scenery details are recycled after leaving the visible Canvas.

**Reason for environmental cycles:** The hybrid theme is felt through gameplay atmosphere, zone-specific hazards, enemies, and commanders, not only through aircraft selection.

## 6. Game states + screen specification

### Hangar / menu
- Full-viewport battlefield with the aircraft picker, launch control and short instructions inside the menu overlay.
- Selected aircraft preview drawn by the same renderer used in gameplay, local personal best and sound toggle.
- Selection changes the aircraft and mode for the next sortie. The hangar compares hull, speed, weapon, ability, and the relevant best score.
- The paint selector uses saved run goals: clear Sector Run with Falcon for Ace Green, destroy three mini-bosses in one Endless flight for Chrome, and clear Boss Rush for Ember. Paint stripes appear on both the hangar preview and the player's aircraft.

### Gameplay
- Canvas battlefield with player, opponents, bullets, pickups, effects and procedural scenery.
- Top HUD: score and combo, current wave, next-wave countdown, hull and shield meters, boss health and phase (when applicable).
- Bottom HUD: current weapon and level, active upgrade timers, ability readiness.
- Pause control, wave notifications and responsive controls.

### Field upgrade choice
- Freezes the battle at alternating wave breaks while three permanent upgrades are offered.
- Selecting a card resumes the run and starts the next commander when that wave is a boss encounter.

### Pause
- Stops gameplay physics and combat timers.
- Resume or return to hangar. Keyboard shortcut: P or Escape.

### Game over
- Final score, wave reached, total hostiles destroyed, and mode or aircraft record indication. Finite modes display a mission-clear result after the final boss.
- Replay immediately using the selected aircraft or return to hangar to change it.

## 7. Architecture implemented in prototype

```text
index.html
  Static DOM UI and Canvas
        |
style.css
  Responsive layout and overlay presentation
        |
game.js
  requestAnimationFrame loop (dt capped to 33 ms)
  game state machine: menu / playing / upgrade / paused / over
  player movement + weapons
  enemy spawning + AI + wave clock
  boss logic
  projectile simulation + circular collision checks
  pickups + particles + score
  vector canvas rendering + recycled environment
  synthesized SFX (Web Audio)
  local best-score persistence (localStorage)
```

For a larger codebase, extract modules: `core/Game.js`, `core/Input.js`, `entities/Player.js`, `entities/Enemy.js`, `systems/Collision.js`, `systems/Waves.js`, `systems/Weapons.js`, `systems/Audio.js`, `render/Renderer.js`, `ui/HUD.js`.

## 8. MVP acceptance checklist

- [x] Launch without installing packages or downloading textures.
- [x] Select all 5 aircraft and 3 modes before play.
- [x] Move with keyboard, click-and-drag or touch.
- [x] Shoot continuously using cannon, spread, piercing plasma, homing missile, and pulse laser patterns.
- [x] Destroy enemy types with appropriate HP/score behavior.
- [x] Receive damage and game over at zero hull.
- [x] Collect repair, shield, and weapon level upgrades.
- [x] Survive sequential waves and encounter each map's commander; complete finite modes.
- [x] Pause/resume; restart; return to hangar.
- [x] Track current score and store personal best locally.
- [x] Provide mutable audio setting and procedural sounds.
- [x] Scale Canvas for different device sizes and pixel density.
- [x] Headless Chromium desktop + mobile layout checks and menu/pause/hangar interaction checks.
- [ ] Multi-browser hands-on visual/performance QA on physical devices.
- [ ] Longer playtesting to balance weapons and later waves.
- [ ] Automated unit tests and continuous integration (a dependency-free logic smoke test now covers new combat paths).

**Validation performed:** JavaScript syntax check and the dependency-free `smoke-node.cjs` test cover opening-wave density, tactical caches, Ace Moves, dash and momentum, breakable boss parts, weapon marks, bonus targets, formation leaders, map props, route choices, wingman rescue, three boss phases and the safe-zone objective, all six maps and hazards, Escort objectives and win/loss paths, Boss Rush contracts and late-boss mechanics, difficulty rules, enemy roles, mini-boss rewards, both weapon paths for each aircraft, paint unlock goals, mode progression and victory, combat, upgrades, and records. Test the expanded layout, timing, and combat visually on physical devices and other browsers before launch.

## 9. After-MVP roadmap

**Phase 2 — game feel + depth:** Distinct enemy-era families, collectible weapons with duration choices, mini-bosses, camera shake tuning, better art and audio, configurable difficulty. Balance challenge and verify phone performance.

**Phase 3 — replayability:** Aircraft unlocks, campaign missions, achievements, local settings/save profiles, accessible color options and input remapping.

**Phase 4 — online/public launch:** Leaderboard with anti-cheat considerations, optional accounts, cloud progression, telemetry, analytics, privacy notice, performance profiling, cross-browser test suite, offline caching/PWA, original art/licensed music.

**Deliberately out of MVP:** Multiplayer, user accounts, microtransactions, 3D simulation, advanced airplane physics, backend infrastructure and a full item economy.

## 10. Recommended launch target

For MVP, the right measurable goal is **a fun, complete three-minute run** with no broken input, obvious enemy shots, visible damage, meaningful pickup feedback, a defeat/retry loop, and stable frame pacing. Only then expand content. The three-era premise differentiates the project; clear moment-to-moment gameplay makes it worth replaying.
