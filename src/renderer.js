// Canvas scenery, aircraft, effects, and full-frame rendering.
  function polygon(points,fill,stroke,lineWidth=1) {
    ctx.beginPath();
    ctx.moveTo(points[0][0],points[0][1]);
    for (let i=1;i<points.length;i++) ctx.lineTo(points[i][0],points[i][1]);
    ctx.closePath(); ctx.fillStyle=fill; ctx.fill();
    if (stroke) { ctx.strokeStyle=stroke; ctx.lineWidth=lineWidth; ctx.stroke(); }
  }

  function drawBackground() {
    const z=currentZone();
    if(backgroundCache.zone!==z || backgroundCache.width!==W || backgroundCache.height!==H || backgroundCache.dpr!==dpr) {
      const gradient=ctx.createLinearGradient(0,0,W,H);
      gradient.addColorStop(0,z.top);gradient.addColorStop(1,z.bottom);
      const vignette=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.15,W/2,H/2,Math.max(W,H)*.77);
      vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#00000088');
      Object.assign(backgroundCache,{zone:z,width:W,height:H,dpr,gradient,vignette});
    }
    ctx.fillStyle=backgroundCache.gradient; ctx.fillRect(0,0,W,H);
    if(game.mode==='story') drawStoryBackdrop(z);
    // Fine scrolling grid and sea/current lines: the stage is finite; only texture moves.
    ctx.lineWidth=1;
    for (let y=(backgroundScroll*.46%87)-87;y<H;y+=87) {
      ctx.strokeStyle=z.line+'32';
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
      for (let k=0;k<5;k++) {
        const x=(k*179+Math.sin(y*.02+k)*80+W*2)%W;
        ctx.fillStyle=z.line+'25'; ctx.fillRect(x,y+12,randStatic(k,7,33),1);
      }
    }
    ctx.strokeStyle=z.line+'18';
    for(let x=35;x<W;x+=78) { ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke(); }
    for (const o of backgroundDecor) {
      if (o.kind==='mist' && z.kind!=='neon' && z.kind!=='frost' && z.kind!=='ember') {
        ctx.save(); ctx.globalAlpha=.14;
        ctx.fillStyle=z.kind==='storm'?'#b4d3eb':z.kind==='dust'?'#f5d1ad':'#c2f6ed';
        ctx.beginPath(); ctx.ellipse(o.x,o.y,o.size*2.2,o.size*.48,-.24,0,TAU);ctx.fill();
        ctx.beginPath();ctx.ellipse(o.x+o.size*.5,o.y+4,o.size*1.2,o.size*.35,.22,0,TAU);ctx.fill();
        ctx.restore();
      } else if (z.kind==='neon' || z.kind==='frost') {
        ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.seed);
        polygon([[-o.size,-o.size*.27],[0,-o.size],[o.size,o.size*.2],[0,o.size*.8]],z.deco+'2b',z.line+'7b',1);
        if (z.kind==='frost') polygon([[0,-o.size*.8],[o.size*.25,0],[0,o.size*.7],[-o.size*.25,0]],'#ddfaff70',z.line+'9b');
        ctx.restore();
      } else if (z.kind==='storm') {
        ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.seed);
        ctx.strokeStyle='#c3e4ff77';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(-o.size*.25,-o.size);ctx.lineTo(o.size*.15,-o.size*.2);
        ctx.lineTo(-o.size*.1,o.size*.05);ctx.lineTo(o.size*.3,o.size);ctx.stroke();
        ctx.restore();
      } else if (z.kind==='ember') {
        ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.seed);
        polygon([[-o.size,-o.size*.3],[-o.size*.35,-o.size*.8],[o.size*.7,-o.size*.35],[o.size,o.size*.5],[0,o.size*.72]],'#321f29',z.line+'8c');
        ctx.strokeStyle='#ffac61a8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-o.size*.5,0);ctx.lineTo(0,o.size*.2);ctx.lineTo(o.size*.65,-o.size*.05);ctx.stroke();
        ctx.restore();
      } else {
        ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.seed);
        polygon([[-o.size,-o.size*.5],[-o.size*.32,-o.size*.75],[o.size*.7,-o.size*.3],[o.size,o.size*.45],[0,o.size*.7],[-o.size*.85,o.size*.34]],z.deco+'8c',z.line+'50');
        polygon([[-o.size*.4,0],[o.size*.2,-o.size*.38],[o.size*.58,0],[o.size*.2,o.size*.4]],z.line+'30');
        ctx.restore();
      }
    }
    ctx.fillStyle=backgroundCache.vignette;ctx.fillRect(0,0,W,H);
  }
  function drawStoryBackdrop(z) {
    const drift=backgroundScroll*(z.scene==='citadel'?.18:.28);
    ctx.save();
    if(z.scene==='islands') {
      for(let i=0;i<8;i++) {const x=(i*163+65)%Math.max(W,1),y=(i*157+drift)%(H+230)-115;
        ctx.fillStyle='#093b42a8';ctx.beginPath();ctx.ellipse(x,y,65+i%3*18,21+i%3*8,.28,0,TAU);ctx.fill();
        ctx.strokeStyle='#a6f9da55';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,70+i%3*18,25+i%3*8,.28,0,TAU);ctx.stroke();}
      for(let i=0;i<4;i++) {const y=(i*231+drift*.8)%(H+150)-70;ctx.strokeStyle='#ddfff429';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-30,y);ctx.bezierCurveTo(W*.3,y-30,W*.65,y+28,W+30,y-9);ctx.stroke();}
    } else if(z.scene==='canyon') {
      for(const side of [-1,1]) for(let i=0;i<8;i++) {const y=(i*145+drift)%(H+190)-100,w=42+(i*17)%54;
        ctx.fillStyle=i%2?'#5a323aba':'#422e3ab8';ctx.beginPath();ctx.moveTo(side<0?0:W,y-50);ctx.lineTo(side<0?w:W-w,y-25);ctx.lineTo(side<0?w+25:W-w-25,y+65);ctx.lineTo(side<0?0:W,y+85);ctx.closePath();ctx.fill();
        ctx.strokeStyle='#f9b17555';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(side<0?w-6:W-w+6,y-18);ctx.lineTo(side<0?w+17:W-w-17,y+58);ctx.stroke();}
    } else if(z.scene==='aurora') {
      for(let i=0;i<5;i++) {const x=W*(i+.5)/5+Math.sin((game.status==='menu'?ambientTime:game.time)*.4+i)*26;ctx.strokeStyle=['#98ffcc38','#83e7f550','#d1b9ff34'][i%3];ctx.lineWidth=22+i*8;ctx.beginPath();ctx.moveTo(x-90,-50);ctx.bezierCurveTo(x+Math.sin(backgroundScroll*.004+i)*85,H*.3,x-60,H*.65,x+40,H+50);ctx.stroke();}
      for(let i=0;i<10;i++) {const x=(i*109)%W,y=(i*153+drift)%(H+130)-65;polygon([[x-18,y+12],[x,y-28],[x+20,y+12],[x,y+31]],'#9addf022','#d4ffff55');}
    } else if(z.scene==='foundry') {
      for(let i=0;i<9;i++) {const x=(i*107+44)%W,y=(i*137+drift)%(H+170)-85;ctx.fillStyle='#2d222bbb';ctx.fillRect(x-20,y-35,40,70);ctx.fillStyle='#ff9e6655';ctx.fillRect(x-14,y-23,28,7);ctx.fillRect(x-14,y+4,28,6);}
      for(let i=0;i<6;i++) {const y=(i*211+drift*.7)%(H+180)-90;ctx.strokeStyle='#ff854b55';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y+Math.sin(i)*36);ctx.stroke();}
    } else {
      const cx=W/2,cy=H*.35;ctx.strokeStyle='#ddabff55';ctx.lineWidth=3;
      for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(cx,cy,60+i*49,28+i*25,(game.status==='menu'?ambientTime:game.time)*.08*(i%2?-1:1),0,TAU);ctx.stroke();}
      for(let i=0;i<12;i++){const x=(i*139+backgroundScroll*.1)%W,y=(i*97+drift)%(H+100)-50;ctx.fillStyle='#d9beff77';ctx.fillRect(x,y,3,12);}
    }
    ctx.restore();
  }
  function randStatic(seed,min,max) { return min+(Math.sin(seed*91.1)*.5+.5)*(max-min); }

  function drawPlane(x,y,type,size=1,enemy=false,bank=0) {
    ctx.save();ctx.translate(x,y);ctx.rotate(bank);ctx.scale(size,size);
    if (enemy) ctx.rotate(Math.PI);
    if (type==='warbird') {
      polygon([[-6,-28],[0,-36],[6,-28],[9,-6],[31,6],[32,16],[9,12],[7,29],[16,34],[16,39],[0,34],[-16,39],[-16,34],[-7,29],[-9,12],[-32,16],[-31,6],[-9,-6]],'#7eab90','#daffe3',1.6);
      polygon([[-31,6],[-9,-5],[9,-5],[31,6],[31,12],[-31,12]],'#65866f','#a6d9b5',1);
      polygon([[-5,-25],[5,-25],[5,27],[0,34],[-5,27]],'#bcd8b4');
      ctx.fillStyle='#2e555c';ctx.beginPath();ctx.ellipse(0,-9,5,12,0,0,TAU);ctx.fill();
      ctx.strokeStyle='#e4f8ce';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(-18,-29);ctx.lineTo(18,-29);ctx.stroke();
    } else if (type==='jet') {
      polygon([[0,-39],[7,-15],[14,3],[37,25],[37,32],[11,22],[8,33],[16,37],[16,40],[0,35],[-16,40],[-16,37],[-8,33],[-11,22],[-37,32],[-37,25],[-14,3],[-7,-15]],'#4c90b6','#b5edff',1.5);
      polygon([[0,-32],[5,-6],[11,26],[0,32],[-11,26],[-5,-6]],'#94c8dc');
      polygon([[-5,-12],[5,-12],[4,7],[0,12],[-4,7]],'#163f61','#d6ffff');
      ctx.fillStyle='#65d9ff';ctx.fillRect(-9,30,5,8);ctx.fillRect(4,30,5,8);
    } else if (type==='nova') {
      ctx.shadowBlur=12;ctx.shadowColor='#bd83ff';
      polygon([[0,-41],[10,-18],[22,-2],[40,14],[36,25],[13,21],[0,39],[-13,21],[-36,25],[-40,14],[-22,-2],[-10,-18]],'#825cbe','#edcaff',1.7);
      polygon([[0,-28],[9,-2],[14,19],[0,32],[-14,19],[-9,-2]],'#392f73','#bc93f7');
      polygon([[0,-15],[7,4],[0,17],[-7,4]],'#bdfaff');
      ctx.shadowBlur=0;ctx.fillStyle='#81efff';ctx.fillRect(-17,20,6,10);ctx.fillRect(11,20,6,10);
    } else if (type==='kestrel') {
      polygon([[0,-37],[8,-19],[13,-5],[38,8],[40,21],[15,17],[10,31],[20,38],[17,42],[0,35],[-17,42],[-20,38],[-10,31],[-15,17],[-40,21],[-38,8],[-13,-5],[-8,-19]],'#a87952','#ffe0a4',1.7);
      polygon([[0,-28],[7,-7],[8,27],[0,34],[-8,27],[-7,-7]],'#574a46','#ffd48a');
      ctx.fillStyle='#ffe1a8';ctx.fillRect(-32,10,8,4);ctx.fillRect(24,10,8,4);
      ctx.fillStyle='#ff9f59';ctx.fillRect(-11,34,5,7);ctx.fillRect(6,34,5,7);
    } else if (type==='ray') {
      ctx.shadowColor='#73ffe9';ctx.shadowBlur=10;
      polygon([[0,-43],[9,-20],[31,-9],[38,11],[22,25],[7,19],[0,38],[-7,19],[-22,25],[-38,11],[-31,-9],[-9,-20]],'#317f81','#b3fff0',1.8);
      polygon([[0,-32],[7,-8],[11,15],[0,29],[-11,15],[-7,-8]],'#163f58','#b8fff2');
      ctx.fillStyle='#d9fff8';ctx.fillRect(-25,8,8,4);ctx.fillRect(17,8,8,4);
    }
    if(!enemy && selectedPaint!=='standard') {
      ctx.shadowColor=PAINTS[selectedPaint].color;ctx.shadowBlur=10;
      ctx.fillStyle=PAINTS[selectedPaint].color;
      ctx.fillRect(-3,-25,6,42);
      ctx.fillRect(-27,9,12,5);ctx.fillRect(15,9,12,5);
      ctx.shadowBlur=0;
    }
    ctx.restore();
  }

  function drawEnemy(e) {
    ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Math.PI+Math.sin(e.age*(e.type==='hunter'||e.type==='phase'?6:4)+e.phase)*.075);
    const scale=e.type==='mini'||e.type==='echo'||e.type==='storyMini'?1.6:e.type==='bomber'||e.type==='radar'||e.type==='carrier'?1.25:e.type==='interceptor'?.77:e.type==='striker'?1.05:.91;
    ctx.scale(scale,scale);
    const [dark,light,edge]=ENEMY_COLORS[e.type];
    polygon([[0,-33],[7,-13],[27,-2],[31,8],[9,8],[6,26],[13,32],[0,28],[-13,32],[-6,26],[-9,8],[-31,8],[-27,-2],[-7,-13]], dark,edge,1.4);
    polygon([[0,-25],[5,-4],[5,21],[0,28],[-5,21],[-5,-4]],light);
    ctx.fillStyle='#412c43';ctx.fillRect(-5,-12,10,13);
    if (!['scout','interceptor','bomber'].includes(e.type)) {
      ctx.fillStyle=edge; ctx.fillRect(-24,3,8,4);ctx.fillRect(16,3,8,4);
    }
    ctx.restore();
    if(e.type==='storyMini') {ctx.save();ctx.fillStyle='#fff1cf';ctx.textAlign='center';ctx.font='bold 11px sans-serif';ctx.fillText(STORY_CHAPTERS[e.miniVariant].mini,e.x,e.y-e.radius-20);ctx.restore();}
    if(e.type==='mine'||e.type==='phase') {ctx.save();ctx.globalAlpha=.32+Math.sin(e.age*6)*.16;ctx.strokeStyle=e.type==='mine'?'#ffca89':'#dbabff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.radius+6+Math.sin(e.age*4)*3,0,TAU);ctx.stroke();ctx.restore();}
    if(e.type==='generator') {
      const active=!game.enemies.some(other=>other.type==='generator'&&other.hp>0&&other.order<e.order);
      ctx.save();ctx.strokeStyle=active?'#f6de91':'#b7a6dc';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(e.x,e.y,36,0,TAU);ctx.stroke();
      ctx.fillStyle=active?'#fff2b0':'#c9bce1';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText(String(e.order+1),e.x,e.y+5);ctx.restore();
    }
    if(e.leader) {
      ctx.save();ctx.fillStyle='#ffe6a1';ctx.textAlign='center';ctx.font='bold 10px sans-serif';ctx.fillText('★ LEADER',e.x,e.y-e.radius-14);ctx.restore();
    }
    if(e.markTime>0) {
      ctx.save();ctx.strokeStyle='#9bfff0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.radius+9,0,TAU);ctx.stroke();ctx.restore();
    }
    if(['missile','radar','ace','echo','supply','bonusAce'].includes(e.type)) {
      ctx.save();ctx.fillStyle='#fff1c9';ctx.font='bold 10px sans-serif';ctx.textAlign='center';
      ctx.fillText({missile:'MISSILE',radar:'RADAR',ace:'RIVAL ACE',echo:'CHRONO ECHO',supply:'RARE CARGO',bonusAce:'FLEEING ACE'}[e.type],e.x,e.y-e.radius-15);ctx.restore();
    }
    if(e.type==='shield') {
      ctx.save();ctx.strokeStyle='#8beef48c';ctx.lineWidth=2;ctx.setLineDash([7,5]);
      ctx.beginPath();ctx.arc(e.x,e.y,105,0,TAU);ctx.stroke();ctx.restore();
    } else if(e.type==='medic') {
      ctx.save();ctx.strokeStyle='#a8ffc36a';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(e.x,e.y,110,0,TAU);ctx.stroke();ctx.restore();
    }
    if(e.hitTime>0) {
      ctx.save();ctx.globalAlpha=e.hitTime/.14*.8;ctx.strokeStyle='#fff5ce';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(e.x,e.y,e.radius+5,0,TAU);ctx.stroke();ctx.restore();
    }
    if (['bomber','mini','storyMini','carrier','ace','radar','generator','echo'].includes(e.type) && e.hp<e.maxHp) {
      ctx.fillStyle='#421c2b';ctx.fillRect(e.x-25,e.y-e.radius-13,50,3);
      ctx.fillStyle='#ffb38f';ctx.fillRect(e.x-25,e.y-e.radius-13,50*clamp(e.hp/e.maxHp,0,1),3);
    }
  }

  function drawBoss(b) {
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.sin(b.age*2.3)*.025);
    const palette=BOSS_PALETTES[b.zone];
    ctx.shadowColor=palette[2];ctx.shadowBlur=12;
    polygon([[0,-65],[17,-36],[44,-29],[73,-2],[68,25],[34,19],[24,42],[39,54],[17,58],[0,51],[-17,58],[-39,54],[-24,42],[-34,19],[-68,25],[-73,-2],[-44,-29],[-17,-36]],palette[0],palette[1],2);
    ctx.shadowBlur=0;
    polygon([[0,-59],[14,-31],[18,37],[0,53],[-18,37],[-14,-31]],palette[2],palette[1]);
    polygon([[-55,-4],[-20,-20],[-22,23],[-54,14]],'#462938');
    polygon([[55,-4],[20,-20],[22,23],[54,14]],'#462938');
    ctx.fillStyle='#ffdfae';ctx.beginPath();ctx.ellipse(0,-16,9,19,0,0,TAU);ctx.fill();
    ctx.fillStyle=palette[1];ctx.fillRect(-45,15,9,13);ctx.fillRect(36,15,9,13);
    if (b.zone>=3) {
      polygon([[-40,-15],[-25,-34],[-11,-16],[-22,2]],palette[2],palette[1]);
      polygon([[40,-15],[25,-34],[11,-16],[22,2]],palette[2],palette[1]);
    }
    if(b.variant) {
      ctx.strokeStyle=b.variant==='story'?STORY_CHAPTERS[b.chapter].line:b.variant==='eclipse'?'#edaaff':'#a5f4ff';ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(0,0,54,b.age*.8,b.age*.8+Math.PI*1.45);ctx.stroke();
      polygon([[-83,-16],[-49,-35],[-39,4],[-78,18]],palette[2],palette[1]);
      polygon([[83,-16],[49,-35],[39,4],[78,18]],palette[2],palette[1]);
    }
    if(b.variant==='story') {
      ctx.strokeStyle=STORY_CHAPTERS[b.chapter].line;ctx.lineWidth=2.5;ctx.globalAlpha=.6+Math.sin(b.age*5)*.25;
      ctx.beginPath();ctx.arc(0,-9,23+b.stage*4,0,TAU);ctx.stroke();ctx.globalAlpha=1;
      for(let i=0;i<3;i++){const angle=b.age*(i%2?-.9:1)+i*TAU/3;ctx.fillStyle=STORY_CHAPTERS[b.chapter].line;ctx.beginPath();ctx.arc(Math.cos(angle)*69,Math.sin(angle)*32,4,0,TAU);ctx.fill();}
    }
    ctx.restore();
    if(b.markTime>0) {ctx.save();ctx.strokeStyle='#9bfff0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,b.radius+15,0,TAU);ctx.stroke();ctx.restore();}
    if(b.parts) for(const part of b.parts) {
      ctx.save();ctx.fillStyle=part.broken?'#493b3e':'#ffe1ad';ctx.strokeStyle=part.broken?'#a27770':'#ff9f5d';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(b.x+part.dx,b.y+part.dy,part.broken?11:15,0,TAU);ctx.fill();ctx.stroke();
      if(!part.broken) {ctx.fillStyle='#ffe6ad';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText(part.kind.toUpperCase(),b.x+part.dx,b.y+part.dy+30);}
      ctx.restore();
    }
    if(b.enraged || b.hitTime>0) {
      ctx.save();ctx.globalAlpha=b.hitTime>0?.8:.35;ctx.strokeStyle=b.enraged?'#ffba65':'#fff5ce';ctx.lineWidth=b.hitTime>0?4:2;
      ctx.beginPath();ctx.arc(b.x,b.y,b.radius+10+Math.sin(game.time*8)*2,0,TAU);ctx.stroke();ctx.restore();
    }
    if(b.enraged && b.zone===0) {
      const weak=bossWeakPoint(b);
      ctx.save();ctx.strokeStyle='#d7ff85';ctx.fillStyle='#d7ff8566';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(weak.x,weak.y,17+Math.sin(game.time*8)*2,0,TAU);ctx.fill();ctx.stroke();ctx.restore();
    }
    if(b.enraged && b.zone===3 && b.guard) {
      ctx.save();ctx.strokeStyle='#c9f8ff';ctx.lineWidth=4;ctx.setLineDash([10,6]);
      ctx.beginPath();ctx.arc(b.x,b.y,b.radius+17,0,TAU);ctx.stroke();ctx.restore();
    }
  }

  function drawConvoy() {
    const c=game.convoy;if(!c) return;
    ctx.save();ctx.translate(c.x,c.y);ctx.globalAlpha=c.invulnerable>0&&Math.floor(game.time*12)%2?.55:1;
    ctx.shadowColor='#ffd798';ctx.shadowBlur=16;
    polygon([[-56,-14],[-30,-26],[30,-26],[56,-14],[49,18],[26,26],[-26,26],[-49,18]],'#536572','#ffe2a8',3);
    polygon([[-21,-30],[0,-43],[21,-30],[18,18],[-18,18]],'#8193a0','#ffe2a8',2);
    ctx.fillStyle='#ffe9b3';ctx.fillRect(-5,-37,10,29);ctx.restore();
    ctx.save();ctx.fillStyle='#221f25';ctx.fillRect(c.x-48,c.y+38,96,6);
    ctx.fillStyle='#ffdc8d';ctx.fillRect(c.x-48,c.y+38,96*c.hp/c.maxHp,6);
    ctx.fillStyle='#fff2d3';ctx.textAlign='center';ctx.font='bold 11px sans-serif';ctx.fillText('CONVOY',c.x,c.y+58);ctx.restore();
  }
  function drawMapProps() {
    for(const prop of game.mapProps) {
      ctx.save();ctx.translate(prop.x,prop.y);ctx.shadowColor=prop.kind==='ember'?'#ff8b57':'#9ce6ff';ctx.shadowBlur=14;
      ctx.fillStyle=prop.kind==='ember'?'#8a4134':'#385f79';ctx.strokeStyle=prop.kind==='ember'?'#ffb17d':'#b6efff';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(0,0,prop.radius,0,TAU);ctx.fill();ctx.stroke();
      ctx.fillStyle=prop.kind==='ember'?'#ffd99a':'#c5f7ff';ctx.textAlign='center';ctx.font='bold 20px sans-serif';ctx.fillText(prop.kind==='ember'?'✹':'ϟ',0,7);
      ctx.font='bold 9px sans-serif';ctx.fillText(prop.kind==='ember'?'FUEL':'CAPACITOR',0,prop.radius+15);ctx.restore();
    }
  }
  function drawObjective() {
    const o=game.objective;if(!o||o.type!=='zone') return;
    ctx.save();ctx.fillStyle='#c8f56c25';ctx.strokeStyle='#d8ff91';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(o.x,o.y,53,0,TAU);ctx.fill();ctx.stroke();
    ctx.lineWidth=6;ctx.beginPath();ctx.arc(o.x,o.y,60,-Math.PI/2,-Math.PI/2+TAU*clamp(o.hold/o.required,0,1));ctx.stroke();
    ctx.fillStyle='#ecffd0';ctx.textAlign='center';ctx.font='bold 11px sans-serif';ctx.fillText('HOLD SAFE ZONE',o.x,o.y-70);ctx.restore();
  }
  function drawRescue() {
    const r=game.rescue;if(!r) return;
    ctx.save();ctx.strokeStyle='#a9f1ff';ctx.fillStyle='#a9f1ff2d';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(r.x,r.y,52,0,TAU);ctx.fill();ctx.stroke();
    ctx.lineWidth=6;ctx.beginPath();ctx.arc(r.x,r.y,59,-Math.PI/2,-Math.PI/2+TAU*clamp(r.hold/.7,0,1));ctx.stroke();
    ctx.fillStyle='#dffaff';ctx.textAlign='center';ctx.font='bold 11px sans-serif';ctx.fillText('RESCUE WINGMAN',r.x,r.y-70);ctx.restore();
    drawPlane(r.x,r.y,'jet',.48,false,Math.sin(game.time*3)*.12);
  }

  function drawWarnings() {
    ctx.save();
    if(game.boss?.lock) {
      const lock=game.boss.lock;
      ctx.fillStyle='#d7ff8526';ctx.fillRect(lock.x-65,game.boss.y+44,130,H-game.boss.y);
      ctx.strokeStyle='#d7ff85';ctx.lineWidth=3;ctx.setLineDash([8,6]);
      ctx.beginPath();ctx.arc(lock.x,lock.y,45,0,TAU);ctx.stroke();ctx.setLineDash([]);
      ctx.lineWidth=7;ctx.beginPath();ctx.arc(lock.x,lock.y,51,-Math.PI/2,-Math.PI/2+TAU*clamp(lock.hold/lock.required,0,1));ctx.stroke();
      ctx.fillStyle='#eaffb9';ctx.textAlign='center';ctx.font='bold 12px sans-serif';
      ctx.fillText(lock.hold>0?'HOLD POSITION':'MOVE HERE',lock.x,lock.y-60);
    }
    for (const e of [...game.enemies, ...(game.boss?[game.boss]:[])]) {
      if (e.warning<=0) continue;
      const boss=e===game.boss;
      const radius=boss?e.radius+12:e.radius+8;
      ctx.strokeStyle=boss?'#ffdc90':'#ffac83';
      ctx.fillStyle=boss?'#ffdc9070':'#ffac8360';
      ctx.lineWidth=boss?3:2;
      ctx.beginPath();ctx.arc(e.x,e.y,radius,0,TAU);ctx.stroke();
      ctx.setLineDash([5,8]);
      if(boss && e.zone===1 && e.enraged && (e.lock || e.shots%2===0)) {
        ctx.save();ctx.setLineDash([]);ctx.fillStyle='#c8f56c33';ctx.fillRect(e.safeX-65,e.y+44,130,H-e.y);ctx.restore();
        for(let x=20;x<W-10;x+=34) if(Math.abs(x-e.safeX)>65) {
          ctx.beginPath();ctx.moveTo(x,e.y+44);ctx.lineTo(x,H);ctx.stroke();
        }
      } else if (e.type==='striker' || (boss && (e.zone===1 || e.zone===3) && e.shots%2===0)) {
        for (const offset of boss?[-44,-22,0,22,44]:[-18,0,18]) {
          ctx.fillRect(e.x+offset-7,e.y+(boss?43:17),14,H-e.y);
          ctx.beginPath();ctx.moveTo(e.x+offset,e.y+(boss?43:17));ctx.lineTo(e.x+offset,H);ctx.stroke();
        }
      } else if (boss && e.zone===5 && e.shots%2===0) {
        for (const offset of [-45,45]) {
          ctx.beginPath();ctx.moveTo(e.x+offset,e.y+28);ctx.lineTo(e.aimX,e.aimY);ctx.stroke();
        }
        ctx.beginPath();ctx.arc(e.aimX,e.aimY,15,0,TAU);ctx.stroke();
      } else {
        ctx.beginPath();ctx.moveTo(e.x,e.y+(boss?48:16));ctx.lineTo(e.aimX,e.aimY);ctx.stroke();
        ctx.beginPath();ctx.arc(e.aimX,e.aimY,boss?15:8,0,TAU);ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawHazard(overlay=false) {
    const h=game.hazard;
    if(!h || (overlay && h.kind!=='dust') || (!overlay && h.kind==='dust' && h.phase==='active')) return;
    const colors={sea:'#9fe9ea',dust:'#dfbc93',neon:'#df9fff',frost:'#c5f7ff',storm:'#a6daff',ember:'#ffae77'};
    ctx.save();
    const active=h.phase==='active';
    ctx.globalAlpha=overlay?.26:active?.55:.34;
    ctx.fillStyle=colors[h.kind];ctx.strokeStyle=colors[h.kind];ctx.lineWidth=active?4:2;
    if(!active)ctx.setLineDash([10,8]);
    if(h.lane) {
      ctx.fillRect(h.x-h.width/2,0,h.width,H);
      ctx.strokeRect(h.x-h.width/2,0,h.width,H);
      if(h.kind==='sea') {
        ctx.font='bold 32px Arial';ctx.textAlign='center';
        for(let y=90;y<H;y+=130) ctx.fillText(h.direction>0?'→':'←',h.x,y);
      } else if(h.kind==='storm' && active) {
        ctx.beginPath();ctx.moveTo(h.x-15,0);
        for(let y=40;y<H;y+=55)ctx.lineTo(h.x+(Math.floor(y/55)%2?23:-23),y);
        ctx.lineTo(h.x+12,H);ctx.stroke();
      }
    } else {
      ctx.beginPath();ctx.arc(h.x,h.y,h.radius,0,TAU);ctx.fill();ctx.stroke();
      if(active && h.kind==='dust') {
        for(let i=0;i<5;i++) {
          const a=game.time*.7+i*TAU/5;
          ctx.beginPath();ctx.arc(h.x+Math.cos(a)*h.radius*.45,h.y+Math.sin(a)*h.radius*.4,h.radius*.42,0,TAU);ctx.fill();
        }
      }
    }
    ctx.setLineDash([]);ctx.restore();
  }

  function drawPickups() {
    for(const p of game.pickups) {
      ctx.save();ctx.translate(p.x,p.y);
      if(p.type==='cache' && p.life!==undefined) ctx.globalAlpha=clamp(p.life/.45,.25,1);
      const bob=Math.sin(p.age*5)*3;
      ctx.rotate(p.age*.9);
      ctx.shadowColor=PICKUP_COLORS[p.type];ctx.shadowBlur=17;
      polygon([[0,-16+bob],[16,0+bob],[0,16+bob],[-16,0+bob]],'#0a2636',PICKUP_COLORS[p.type],2);
      ctx.rotate(-p.age*.9);ctx.shadowBlur=0;
      ctx.strokeStyle=PICKUP_COLORS[p.type];ctx.lineWidth=3;ctx.beginPath();
      if(p.type==='repair') {ctx.moveTo(-7,bob);ctx.lineTo(7,bob);ctx.moveTo(0,-7+bob);ctx.lineTo(0,7+bob);}
      else if(p.type==='shield') {ctx.arc(0,bob,6,0,TAU);}
      else if(p.type==='power') {ctx.moveTo(-7,6+bob);ctx.lineTo(1,-7+bob);ctx.lineTo(2,2+bob);ctx.lineTo(7,-5+bob);}
      else if(p.type==='armor') {ctx.moveTo(-6,-7+bob);ctx.lineTo(6,-7+bob);ctx.lineTo(5,4+bob);ctx.lineTo(0,8+bob);ctx.lineTo(-5,4+bob);ctx.closePath();}
      else if(p.type==='overdrive') {ctx.moveTo(-7,-5+bob);ctx.lineTo(1,-5+bob);ctx.lineTo(-2,1+bob);ctx.lineTo(7,1+bob);ctx.lineTo(-2,8+bob);}
      else if(p.type==='magnet') {ctx.moveTo(-6,-7+bob);ctx.lineTo(-6,3+bob);ctx.arc(0,3+bob,6,Math.PI,0,true);ctx.lineTo(6,-7+bob);}
      else if(p.type==='cache') {ctx.moveTo(-7,-4+bob);ctx.lineTo(7,-4+bob);ctx.lineTo(7,6+bob);ctx.lineTo(-7,6+bob);ctx.closePath();ctx.moveTo(-3,1+bob);ctx.lineTo(3,1+bob);}
      else {ctx.arc(0,bob,7,0,TAU);ctx.moveTo(-3,bob);ctx.lineTo(3,bob);}
      ctx.stroke();ctx.restore();
    }
  }

  function drawBullets() {
    ctx.save();
    for (const beam of game.beams) {
      ctx.globalAlpha=clamp(beam.life/beam.maxLife,0,1);
      ctx.strokeStyle='#8dfff0';ctx.shadowColor='#68ffee';ctx.shadowBlur=20;
      ctx.lineWidth=beam.width;
      ctx.beginPath();ctx.moveTo(beam.x,beam.y);ctx.lineTo(beam.x,0);ctx.stroke();
      ctx.strokeStyle='#f2fffb';ctx.lineWidth=Math.max(2,beam.width*.28);
      ctx.beginPath();ctx.moveTo(beam.x,beam.y);ctx.lineTo(beam.x,0);ctx.stroke();
    }
    ctx.globalAlpha=1;
    for (const b of game.bullets) {
      if (b.kind==='missile') {
        ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx)+Math.PI/2);
        ctx.shadowColor='#ffb878';ctx.shadowBlur=12;
        polygon([[0,-12],[6,4],[4,11],[-4,11],[-6,4]],'#f2b768','#fff1bf',1.5);
        ctx.fillStyle='#ff814d';ctx.fillRect(-3,10,6,8);
        ctx.restore();
        continue;
      }
      ctx.strokeStyle=b.color;ctx.shadowColor=b.color;ctx.shadowBlur=b.radius*2.3;
      ctx.lineWidth=b.radius*1.4;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(b.x,b.y+9);ctx.lineTo(b.x-b.vx*.013,b.y-13);ctx.stroke();
    }
    for (const b of game.hostileBullets) {
      ctx.fillStyle=b.color;ctx.shadowColor=b.color;ctx.shadowBlur=11;
      ctx.beginPath();ctx.arc(b.x,b.y,b.radius,0,TAU);ctx.fill();
      ctx.shadowBlur=0;ctx.strokeStyle='#091925';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(b.x,b.y,b.radius+1,0,TAU);ctx.stroke();
      ctx.fillStyle='#fff1a9';ctx.beginPath();ctx.arc(b.x,b.y,2,0,TAU);ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    for(const ring of game.rings) {ctx.globalAlpha=clamp(ring.life/ring.maxLife,0,1)*.68;ctx.strokeStyle=ring.color;ctx.lineWidth=3+ring.life/ring.maxLife*3;ctx.beginPath();ctx.arc(ring.x,ring.y,ring.radius,0,TAU);ctx.stroke();}
    for (const p of game.particles) {
      ctx.globalAlpha=clamp(p.life/p.maxLife,0,1);
      ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);
    }
    ctx.textAlign='center';ctx.font='bold 14px Arial, sans-serif';
    for(const p of game.popups) {
      ctx.globalAlpha=clamp(p.life/p.maxLife,0,1);
      ctx.fillStyle=p.color;ctx.fillText(p.text,p.x,p.y);
    }
    ctx.restore();
  }

  function paint() {
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.save();
    if(game.screenshake>0 && game.status==='playing') ctx.translate(rand(-5,5)*game.screenshake*4,rand(-5,5)*game.screenshake*4);
    drawBackground();
    drawHazard();
    if (game.status==='menu') {
      // The hangar preview uses the exact plane renderer used during a sortie.
      const preview=$('planePreview').getBoundingClientRect();
      const field=canvas.getBoundingClientRect();
      const previewX=preview.left-field.left+preview.width/2;
      const previewY=preview.top-field.top+preview.height/2;
      const scale=Math.min(2.5,preview.width/115,preview.height/105);
      ctx.save();
      ctx.shadowColor=selectedShip().color;ctx.shadowBlur=20;
      drawPlane(previewX,previewY,game.selected,scale,false,Math.sin(ambientTime*1.4)*.07);
      ctx.restore();
    } else {
      drawPickups();
      drawMapProps();
      drawConvoy();
      drawObjective();
      drawRescue();
      for (const e of game.enemies) drawEnemy(e);
      if (game.boss) drawBoss(game.boss);
      if(game.wingman) drawPlane(game.wingman.x,game.wingman.y,'jet',.52,false,.1);
      drawWarnings();
      drawBullets();
      if (game.player && game.status!=='over') {
        const blink = game.player.invulnerable>0 && Math.floor(game.time*13)%2;
        if(!blink) {
          if(game.player.dashTime>0) {ctx.save();ctx.globalAlpha=.2;drawPlane(game.player.x-game.player.dashVx*.035,game.player.y-game.player.dashVy*.035,game.selected,.78,false,game.player.bank);ctx.restore();}
          drawPlane(game.player.x,game.player.y,game.selected,.78,false,game.player.bank);
          ctx.save();ctx.fillStyle=game.selected==='nova'?'#c999ff':game.selected==='ray'?'#92ffed':'#ffa662';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=17;
          const flame=8+Math.sin(game.time*35)*4+(game.player.dashTime>0?12:0);
          polygon([[game.player.x-6,game.player.y+25],[game.player.x,game.player.y+25+flame],[game.player.x+6,game.player.y+25]],ctx.fillStyle);
          ctx.restore();
        }
        if(game.player.shield>0) {
          ctx.save();ctx.strokeStyle='#8fe7ff82';ctx.lineWidth=2;
          ctx.beginPath();ctx.arc(game.player.x,game.player.y,31+Math.sin(game.time*5)*1.5,0,TAU);ctx.stroke();ctx.restore();
        }
        if(game.selected==='warbird' && game.player.abilityTime>0) {
          ctx.save();ctx.strokeStyle='#d9ff96';ctx.lineWidth=3;
          ctx.beginPath();ctx.arc(game.player.x,game.player.y,39,0,TAU);ctx.stroke();ctx.restore();
        }
      }
      drawParticles();
      drawHazard(true);
    }
    ctx.restore();
  }
