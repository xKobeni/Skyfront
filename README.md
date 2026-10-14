# Skyfront: Epoch Strike — playable vanilla JS prototype

Open `index.html` in a current browser. Playing requires no install, framework, network, or server. The browser loads the generated `dist/game.js` bundle so it also works from a local file.

To change the game code, edit the files in `src/`, then run `node scripts/build.cjs`. Node.js is needed only to rebuild the bundle or run the smoke test. Do not edit `dist/game.js` directly.

## Controls
- Move: WASD / arrow keys or click-and-drag / touch inside the playfield
- Fire: automatic
- Pause: P / Escape or pause button
- Mute/unmute: M or SOUND button
- Aircraft ability: Space or the labeled ability button (Aegis, Afterburn, Plasma Pulse, Missile Salvo, or Laser Focus)
- Dash: Shift or DASH button; a close dodge briefly strengthens your weapons and builds momentum
- Spend full momentum: Q / STRIKE clears nearby bullets and damages close enemies; C / GUARD grants shields
- Field upgrade choice: click a card or press 1, 2, or 3
- Weapon evolution: reach weapon level 4, then choose one of two aircraft-specific paths with a card or 1 / 2
- Restart after game over: R or FLY AGAIN

## Current playable features
- Five aircraft: Falcon cannons, Viper spread fire, Nova piercing plasma, Kestrel homing missiles, and Ray pulse lasers. Falcon starts unlocked; clear Story missions 1.2, 1.5, 2.5, and 3.5 to unlock Viper, Nova, Kestrel, and Ray.
- Five modes: 30-mission Story Mode, Endless, six-wave Sector Run, eight-commander Boss Rush, and six-wave Convoy Escort
- Story Mode spans five chapters with missions `1`, `1.1`–`1.5` through `5`, `5.1`–`5.5`. Each launch plays one mission, then returns to the hangar with the next mission selected. Regular missions have a full enemy wave; each `.3` and `.5` mission starts with enemies before its miniboss or three-phase commander. Cleared missions unlock sequentially and are saved locally, so you can replay any unlocked mission.
- Story difficulty is Easy, Normal, or Hard. It scales enemy and boss hull, enemy movement, attack tempo, starting shields, and score.
- Five new campaign maps—Shattered Archipelago, Red Canyon Pass, Aurora Array, Obsidian Foundry, and Eclipse Citadel—have unique scenery, specialists, minibosses, and commanders.
- New Flak, Mine, Hunter, Carrier, and Phase enemy aircraft use radial, lane, tracking, deployment, and shifting attacks.
- Campaign backdrops add island wakes, canyon walls, aurora curtains, foundry structures, and moving citadel rings; explosions, dash afterimages, engine flames, and enemy/boss effects have more motion.
- Convoy Escort has a moving carrier with its own hull; hostile shots and aircraft can damage it, and the mission ends if it is destroyed
- Regular waves rotate through missile interception, radar disruption, and moving safe-zone objectives with success rewards and failure consequences
- Rival Aces dodge incoming player fire and answer with a three-shot volley
- Formation leaders coordinate their wing; destroying one scatters the group and delays its attacks
- Fleeing aces and supply planes appear briefly with rare cargo for pilots willing to chase them
- Before the first wave and at later wave breaks, choose a safe corridor for hull or shields, or a dangerous corridor for a weapon upgrade and higher score
- Rescue a stranded wingman at a timed beacon; it joins the next boss battle and marks targets for weapon combos
- Boss Rush offers a reward paired with a lasting risk after every commander
- Eclipse Leviathan deploys numbered shield generators that must be destroyed in order; Chrono Wraith splits off a firing echo that protects its main body
- Boss Rush threat choice: Easy (slower volleys and two starting shields), Medium, or Extreme (fortified bosses and faster volleys); each has separate records
- Procedurally drawn background, aircraft, bullets, explosions, particles, clouds and terrain
- Scrolling battlefield with calmer opening waves, rising pressure, and short breathers after commanders
- Six maps, each with a specialist enemy and commander; aimed, lane, fan, zigzag, and rotating volleys have visible warnings
- Endless commanders every third wave; longer boss fights, distinct patterns, and a boss health display
- All commanders have three phases, with faster final attacks and distinct second-phase mechanics
- Each commander has a breakable cannon and engine: disabling them reduces its volley or slows its movement and firing
- Lasers mark targets, repeated hits burst marks, plasma detonates marks, and missiles favor marked targets for stronger hits
- Shoot Storm capacitors to chain damage and clear bullets; shoot Ember fuel tanks for a blast that can also hurt you
- Storm lightning and Ember vents damage enemies caught in their marked area
- Heavy impacts, armor breaks, and boss phase changes have stronger visual and audio feedback
- Dust Marshal's second and third phases shield the boss until you dodge through a bullet wall and hold a marked safe zone; the zone shifts if you miss it
- Boss Rush ends with Eclipse Leviathan and Chrono Wraith, two tougher commanders with unique projectile patterns
- V, wall, and pincer enemy formations appear during regular waves
- Shield carriers protect nearby enemies, medics repair allies, and ambushers cut in from the sides
- Mini-bosses appear midway through regular waves from wave 4 and always drop one useful pickup
- Each map has a telegraphed hazard: Pacific crosswind, Dust clouds, Rift pulses, Frost ice lanes, Storm lightning, or Ember vents
- At maximum weapon level, each aircraft can evolve its weapon along one of two branches for the rest of the flight
- Run goals unlock Ace Green, Chrome, and Ember paint schemes, which can be selected in the hangar and are saved locally
- Quick consecutive kills build a score combo; a hit or a 3.5-second gap resets it
- Each aircraft has an Ace Move. Pulling it off grants score and shortens its ability cooldown
- Tactical caches appear near active map hazards, rewarding a risky pickup with score and faster ability recharge
- Choose one of three permanent field upgrades at alternating wave breaks: damage, fire rate, speed, hull, shields, or weapon level
- Damage numbers, enemy hit rings, and a player damage flash make impacts easier to read
- Seven regular pickups plus tactical caches: repair, shield, weapon level, armor, overdrive, magnet, and double score; capped pickups become bonus score
- Full-screen game with a left/right aircraft carousel inside the hangar overlay; locked aircraft show their story unlock requirement. The compact Fighter/Mission tabs keep the hangar within the mobile screen.
- Wave countdown, score, kill count, and per-mode/per-aircraft best scores saved locally; pause and restart
- Keyboard, mouse and touch; synthesised optional sound

## Files
- `index.html`: layout, interface and overlays
- `styles/base.css`: colors, reset, canvas, and shared overlay rules
- `styles/menu.css`: hangar, fighter selection, modes, and story controls
- `styles/hud.css`: in-game meters, controls, and notifications
- `styles/overlays.css`: upgrades, pause, and results screens
- `styles/responsive.css`: viewport and reduced-motion overrides; load this last
- `src/config.js`, `src/state.js`: game definitions, shared state and saved progress
- `src/ui.js`, `src/session.js`: hangar, HUD, run lifecycle and audio
- `src/encounters.js`, `src/weapons.js`, `src/progression.js`, `src/damage.js`, `src/abilities.js`: combat systems
- `src/simulation.js`, `src/renderer.js`, `src/input.js`: frame updates, drawing and controls
- `scripts/build.cjs`: dependency-free bundle builder; `node scripts/build.cjs --check` verifies the bundle is current
- `dist/game.js`: generated browser bundle; keep it alongside `index.html` when sharing the game
- `smoke-node.cjs`: dependency-free logic smoke test (`node smoke-node.cjs`)

## Design intent / roadmap
The source files are assembled in the order listed in `scripts/build.cjs`. They share one private game closure, so existing cross-system calls work while the browser keeps its direct-file launch. Keep functions and data in the file matching their responsibility, then rebuild and run the smoke test.

Use original art/music or assets with appropriate licenses for any public release. Prototype graphics and sounds are generated procedurally.
