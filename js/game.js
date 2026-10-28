#game{position:fixed;inset:0;z-index:100;display:none;background:radial-gradient(ellipse at 50% 40%,#0b1a3a,#03050c);touch-action:none;user-select:none}
#game.on{display:block}
#gc{position:absolute;inset:0;touch-action:none}
#gHud{position:absolute;left:0;right:0;top:0;height:64px;display:flex;align-items:center;gap:8px;padding:6px 10px;padding-top:max(6px,env(safe-area-inset-top))}
.gp{min-width:120px;padding:6px 12px;border-radius:12px;border:2px solid rgba(245,192,74,.35);background:rgba(8,14,30,.85);display:flex;flex-direction:column;font-size:15px}
.gp small{color:#8fd4ff;font-size:12px}.gp.act{border-color:#f5c04a;box-shadow:0 0 14px rgba(245,192,74,.6)}
#gMsg{flex:1;text-align:center;font-size:15px;font-weight:700;color:#ffe9a6;line-height:1.2}
.gb{min-height:48px;min-width:48px;padding:0 18px;border-radius:12px;border:2px solid #f5c04a;background:linear-gradient(180deg,#101a34,#070b18);color:#eaf2ff;font-weight:800;font-size:16px;cursor:pointer}
.gb.gold{background:linear-gradient(180deg,#ffe9a6,#f5c04a 55%,#b97a10);color:#1a1206;border-color:#ffe9a6}
#gBar{position:absolute;left:0;right:0;bottom:0;height:76px;display:flex;align-items:center;gap:12px;padding:8px 14px;padding-bottom:max(8px,env(safe-area-inset-bottom))}
#gBar label{font-weight:800;color:#ffe9a6}#gPow{flex:1;height:36px;accent-color:#f5c04a}#gShoot{min-width:130px;min-height:56px;font-size:20px}
.gov{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(2,4,10,.8)}
.gov.on{display:flex}.gcard{display:flex;flex-direction:column;gap:12px;min-width:260px;padding:24px;border-radius:18px;border:2px solid #f5c04a;background:#080d1c;text-align:center}
.gcard h2{color:#ffe9a6;font-size:28px}.gcard p{color:#8fd4ff}
