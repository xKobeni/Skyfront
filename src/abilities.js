// Aircraft special abilities and their active effects.
  function useAbility() {
    if (game.status!=='playing' || !game.player || game.player.abilityCooldown>0) return;
    const p=game.player;
    if (game.selected==='warbird') {
      p.abilityTime=2.5; p.abilityCooldown=15;
      toast('AEGIS ACTIVE · 2.5s',1.6);
      burst(p.x,p.y,'#c8f56c',18,105);
    } else if (game.selected==='jet') {
      p.abilityTime=2.5; p.abilityCooldown=13;
      p.invulnerable=Math.max(p.invulnerable,.55);
      toast('AFTERBURN ACTIVE · 2.5s',1.6);
      burst(p.x,p.y,'#8bdfff',22,160);
    } else if (game.selected==='nova') {
      p.abilityCooldown=17;
      game.hostileBullets=game.hostileBullets.filter(b=>distanceSq(b.x,b.y,p.x,p.y)>190**2);
      for (let i=game.enemies.length-1;i>=0;i--) {
        const e=game.enemies[i];
        if (distanceSq(e.x,e.y,p.x,p.y)<225**2) {
          damageEnemy(e,8);
          if (e.hp<=0) destroyEnemy(i);
        }
      }
      if (game.boss && distanceSq(game.boss.x,game.boss.y,p.x,p.y)<245**2) {
        damageBoss(game.boss,10,p.x,p.y);
        if (game.boss.hp<=0) destroyBoss();
      }
      toast('PLASMA PULSE',1.6);
      burst(p.x,p.y,'#d6a0ff',40,240);
    } else if (game.selected==='kestrel') {
      p.abilityCooldown=16;
      for (const offset of [-34,-17,0,17,34]) addMissile(p.x+offset,p.y-26,5+p.weaponLevel*.6);
      toast('MISSILE SALVO',1.6);
    } else {
      p.abilityCooldown=16;
      p.abilityTime=3;
      p.fireClock=0;
      toast('LASER FOCUS · 3s',1.6);
      burst(p.x,p.y,'#9bfff0',18,120);
    }
    playSound('pickup');
    refreshHud();
  }
