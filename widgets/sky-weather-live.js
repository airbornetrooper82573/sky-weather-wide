(function () {
'use strict';
if (!window.LEDMatrixWidgets) return;
window.LEDMatrixWidgets.register('sky-weather-live', {
  name: 'Sky Weather Interactive Preview', version:'1.0.0',
  render: function(container,config,value,options) {
    const fieldId=String(options.fieldId||container.id).replace(/[^a-zA-Z0-9_-]/g,'_');
    container.innerHTML='<div class="sky-preview" style="background:#111b2a;color:#e7f0ff;border:1px solid #41536b;border-radius:12px;padding:12px">'+
      '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:9px"><strong>Live LEDMatrix preview</strong><label>Display width <input data-pw type="number" min="128" max="1024" value="320" style="width:75px;color:#111"></label><label>Height <input data-ph type="number" min="32" max="128" value="32" style="width:65px;color:#111"></label>'+
      '<button data-png type="button" style="border:1px solid #99bbd8;padding:3px 9px;border-radius:5px">Save PNG</button></div>'+
      '<canvas data-canvas width="320" height="32" style="width:100%;height:auto;image-rendering:pixelated;background:#080f20;border-radius:3px"></canvas>'+
      '<p data-status style="color:#b9cee0;font-size:12px;margin-top:7px">Preview updates as you change weather settings; no save needed. Uses simulated weather rather than your HA token.</p></div>'+
      '<input type="hidden" id="'+fieldId+'_value" value="preview">';
    const root=container.closest('.plugin-config-container')||document;
    const canvas=container.querySelector('[data-canvas]'),ctx=canvas.getContext('2d');
    const q=(name)=>{const nodes=root.querySelectorAll('input,select,textarea');for(const n of nodes)if(n.name===name||n.name?.endsWith('['+name+']')||n.id==='plugin-'+name||n.id?.endsWith('_'+name))return n;return null};
    const val=(name,fallback)=>{const n=q(name);return n?(n.type==='checkbox'?n.checked:n.value):fallback};
    const draw=()=>{
      if(!container.isConnected)return;
      const w=Math.min(1024,Math.max(128,+container.querySelector('[data-pw]').value||320));
      const h=Math.min(128,Math.max(32,+container.querySelector('[data-ph]').value||32));
      canvas.width=w;canvas.height=h;ctx.imageSmoothingEnabled=false;
      const box=(x,y,a,b,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(0,Math.round(a)),Math.max(0,Math.round(b)))};
      const txt=(t,x,y,c='#e7f0ff')=>{ctx.fillStyle=c;ctx.font='8px monospace';ctx.fillText(String(t),Math.round(x),Math.round(y))};
      const layout=val('wide_layout','dashboard'),radar=val('radar',true);
      let pages=val('pages',null);let p='now';if(typeof pages==='string')try{let a=JSON.parse(pages);if(Array.isArray(a))p=a[0]||'now'}catch(e){}
      const sky='#2c689a',x=Math.floor((w-128)/2),y=Math.floor((h-32)/2);
      box(0,0,w,h,'#12243a');box(x,y,128,32,sky);
      box(x,y+26,128,6,'#243c51');box(x+98,y+5,11,11,'#ffd080');
      for(let i=0;i<5;i++)box(x+4+i*27,y+21+i%3,18,7,'#35536b');
      const tick=Math.floor(Date.now()/650);
      for(let i=0;i<3;i++)box(x+((i*43+tick)%125),y+((i*7+3)%17),13,2,'#9ab8cc');
      txt('SKY WEATHER',x+5,y+10);
      txt(p==='now'?'SUN / MOON':String(p).toUpperCase(),x+5,y+22);
      if(layout==='dashboard'&&w>=192){
        box(0,y,x-4,32,'#192f4b');box(x+132,y,w-x-132,32,'#192f4b');
        if(x>=60){txt('CURRENT',4,y+10,'#ffda93');txt('72 F',4,y+21);txt('PART CLOUD',4,y+30,'#b4cee2')}
        if(w-x-132>=54){txt('FORECAST',x+132,y+10,'#ffda93');txt('NEXT 70 F',x+132,y+21);txt('RAIN 20%',x+132,y+30,'#b4cee2')}
      }
      if(p==='radar'&&radar){box(0,0,w,h,'#152e36');txt('RADAR • RAINVIEWER DATA ON DEVICE',8,Math.floor(h/2),'#b6dce9')}
      container.querySelector('[data-status]').textContent=w+' × '+h+' px • '+layout+' • '+p+' • simulated layout (not live HA)';
    };
    const handler=(e)=>{if(container.contains(e.target)||e.target.closest('.plugin-config-container')===root)draw()};
    root.addEventListener('input',handler);root.addEventListener('change',handler);
    container.querySelector('[data-png]').addEventListener('click',()=>{const a=document.createElement('a');a.download='sky-weather-settings-preview.png';a.href=canvas.toDataURL('image/png');a.click()});
    draw();
    const obs=new MutationObserver(()=>{if(!container.isConnected){obs.disconnect();root.removeEventListener('input',handler);root.removeEventListener('change',handler)}});
    obs.observe(document.documentElement,{childList:true,subtree:true});
    const timer=setInterval(()=>{if(!container.isConnected){clearInterval(timer);return}draw()},750);
  },
  getValue:function(fieldId){return 'preview'},
  setValue:function(fieldId,value){}
});
})();