// Animation loop, controls, event handlers, and startup.
  function frameLoop(timestamp) {
    const dt=Math.min((timestamp-lastTime)/1000 || .016,.033);
    lastTime=timestamp;
    if(game.status==='playing') {
      if(game.hitStop>0) game.hitStop=Math.max(0,game.hitStop-dt);
      else update(dt);
    }
    else if(game.status==='menu' || game.status==='over') {
      ambientTime+=dt;
      backgroundScroll+=dt*70;
      updateDecor(dt*.6);
      if(game.status==='menu' && game.menuNoticeClock>0) {game.menuNoticeClock-=dt;if(game.menuNoticeClock<=0)$('menuNotice').classList.add('hidden');}
      if(game.status==='over') updateParticles(dt);
    }
    paint();
    window.requestAnimationFrame(frameLoop);
  }

  function pointerCoordinates(event) {
    const rect=canvas.getBoundingClientRect();
    return { x:(event.clientX-rect.left)*W/rect.width, y:(event.clientY-rect.top)*H/rect.height };
  }
  canvas.addEventListener('pointerdown',event => {
    if(game.status!=='playing')return;
    pointerHeld=true;
    pointerTarget=pointerCoordinates(event);
    canvas.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  canvas.addEventListener('pointermove',event => {
    if(game.status==='playing' && pointerHeld) {pointerTarget=pointerCoordinates(event);event.preventDefault();}
  });
  const releasePointer=()=>{pointerHeld=false;};
  canvas.addEventListener('pointerup',releasePointer);
  canvas.addEventListener('pointercancel',releasePointer);
  window.addEventListener('blur',()=>{ pressed.clear(); pointerHeld=false; if(game.status==='playing')togglePause(); });
  window.addEventListener('keydown',event=>{
    if(game.status==='menu' && ['ArrowLeft','ArrowRight'].includes(event.code)) {
      if(!event.repeat) cycleShip(event.code==='ArrowLeft'?-1:1);
      event.preventDefault();return;
    }
    if(game.status==='upgrade' && ['Digit1','Digit2','Digit3'].includes(event.code)) {
      chooseUpgrade(Number(event.code.slice(-1))-1);event.preventDefault();return;
    }
    if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','ShiftLeft','ShiftRight'].includes(event.code) && game.status==='playing') event.preventDefault();
    if(event.repeat) {pressed.add(event.code);return;}
    if(event.code==='KeyP'||event.code==='Escape') { if(game.status==='playing'||game.status==='paused') togglePause(); }
    else if(event.code==='Space' && game.status==='playing') useAbility();
    else if((event.code==='ShiftLeft'||event.code==='ShiftRight') && game.status==='playing') useDash();
    else if(event.code==='KeyQ' && game.status==='playing') spendMomentum('strike');
    else if(event.code==='KeyC' && game.status==='playing') spendMomentum('guard');
    else if(event.code==='KeyM') toggleSound();
    else if(event.code==='KeyR' && game.status==='over') startGame();
    pressed.add(event.code);
  });
  window.addEventListener('keyup',event=>pressed.delete(event.code));
  $('upgradeChoices').addEventListener('click',event=>{
    const button=event.target.closest('.upgrade-choice');
    if(button) chooseUpgrade(Number(button.dataset.upgrade));
  });
  $('paintList').addEventListener('click',event=>{
    const button=event.target.closest('.paint-card');
    if(!button || !unlockedPaints.has(button.dataset.paint) || game.status!=='menu') return;
    selectedPaint=button.dataset.paint;
    try {localStorage.setItem('skyfront-epoch-strike-selected-paint',selectedPaint);} catch (_) {}
    updateHangar();
  });
  document.querySelectorAll('.ship-card').forEach(button=>button.addEventListener('click',()=>{
    if(game.status==='playing'||game.status==='paused')return;
    game.selected=button.dataset.ship;
    updateHangar();
  }));
  document.querySelectorAll('.menu-tab').forEach(button=>button.addEventListener('click',()=>setMenuTab(button.dataset.menuTab)));
  $('previousShip').addEventListener('click',()=>cycleShip(-1));
  $('nextShip').addEventListener('click',()=>cycleShip(1));
  document.querySelectorAll('.mode-card').forEach(button=>button.addEventListener('click',()=>{
    if(game.status==='playing'||game.status==='paused')return;
    game.mode=button.dataset.mode;
    game.wave=game.mode==='story'?storySelected:1;
    $('zoneName').textContent=currentZone().name;
    updateHangar();
  }));
  $('previousChapter').addEventListener('click',()=>selectStoryChapter(-1));
  $('nextChapter').addEventListener('click',()=>selectStoryChapter(1));
  $('storyStageList').addEventListener('click',event=>{
    const button=event.target.closest('[data-story-stage]');if(!button||game.status!=='menu')return;
    const wave=Number(button.dataset.storyStage);if(wave<1||wave>storyUnlocked)return;
    storySelected=wave;game.wave=wave;updateHangar();
  });
  document.querySelectorAll('.story-difficulty-card').forEach(button=>button.addEventListener('click',()=>{
    if(game.status!=='menu')return;game.storyDifficulty=button.dataset.storyDifficulty;updateHangar();
  }));
  document.querySelectorAll('.difficulty-card').forEach(button=>button.addEventListener('click',()=>{
    if(game.status!=='menu' || game.mode!=='rush') return;
    game.difficulty=button.dataset.difficulty;
    updateHangar();
  }));
  $('startButton').addEventListener('click',startGame);
  $('retryButton').addEventListener('click',startGame);
  $('hangarButton').addEventListener('click',goToHangar);
  $('pauseHangarButton').addEventListener('click',goToHangar);
  $('resumeButton').addEventListener('click',togglePause);
  $('pauseButton').addEventListener('click',togglePause);
  $('abilityButton').addEventListener('click',useAbility);
  $('dashButton').addEventListener('click',useDash);
  $('strikeButton').addEventListener('click',()=>spendMomentum('strike'));
  $('guardButton').addEventListener('click',()=>spendMomentum('guard'));
  $('soundButton').addEventListener('click',toggleSound);
  window.addEventListener('resize',resize);
  if(typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(frame);
  resize();setMenuTab('fighter');updateHangar();showScreen('menu');
  $('bestScore').textContent=pad(rushBest());
  window.requestAnimationFrame(frameLoop);
})();
