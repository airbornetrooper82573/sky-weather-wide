(function(){
'use strict';
if(!window.LEDMatrixWidgets)return;
const widgets=window.LEDMatrixWidgets;
widgets.register('sky-weather-live',{
 name:'Animated Sky Weather Preview',version:'1.1.4',
 render:function(container,config,value,options){
  const key=String(options.fieldId||container.id).replace(/[^\w-]/g,'_');
  const style='padding:4px;border:1px solid #5d7185;border-radius:5px;background:#0b1726;color:#eff8ff';
  container.innerHTML='<div style="padding:12px;background:#111e2e;color:#edf6ff;border:1px solid #42556c;border-radius:12px">'+
   '<strong>Animated Sky Weather preview</strong><p style="font-size:12px;margin:6px 0;color:#b8c8dc">Animated weather, day/night sky, moon, clouds and precipitation. Updates without saving.</p>'+
   '<div style="display:flex;flex-wrap:wrap;gap:9px;margin:8px 0">'+
   '<label>Pixels <select data-size style="'+style+'"><option value="320x32">5 × P5 (320×32)</option><option value="320x64">320×64</option><option value="256x32">256×32</option><option value="128x32">128×32</option></select></label>'+
   '<label>Scene <select data-scene style="'+style+'"><option value="auto">Automatic</option><option value="sunny">Sunny</option><option value="partlycloudy">Cloudy</option><option value="rainy">Rain</option><option value="snowy">Snow</option><option value="lightning-rainy">Storm</option><option value="clear-night">Night</option></select></label>'+
   '<label>Time <input data-hour type="range" min="0" max="23" value="15" style="vertical-align:middle"></label>'+
   '<button type="button" data-download style="'+style+'">Save PNG</button></div>'+
   '<canvas data-screen width="320" height="32" style="image-rendering:pixelated;width:100%;height:auto;background:#111;border:1px solid #304459;border-radius:4px"></canvas>'+
   '<div data-info style="font-size:11px;margin-top:7px;color:#a7bdd3"></div></div>'+
   '<input type="hidden" id="'+key+'_input" value="preview">';
  const canvas=container.querySelector('[data-screen]'),ctx=canvas.getContext('2d'),root=container.closest('.plugin-config-container')||document;
  const $=s=>container.querySelector(s);
  let raf=0,last=0,clouds=Array.from({length:10},(_,i)=>({x:i*38-35,y:3+(i*7)%12,v:3+(i*3)%7})),
   drops=Array.from({length:100},(_,i)=>({x:(i*79)%320,y:(i*23)%32,spd:8+(i%8)*3})),stopped=false;
  const get=(name,fallback)=>{for(const el of root.querySelectorAll('input,select,textarea')){if(container.contains(el))continue;
   if(el.name===name||el.name?.endsWith('['+name+']')||el.id==='plugin-'+name||el.id?.endsWith('_'+name))return el.type==='checkbox'?el.checked:el.value;
  }return fallback};
  function frame(time){
    if(!container.isConnected){stopped=true;cancelAnimationFrame(raf);return}
    if(time-last<48){raf=requestAnimationFrame(frame);return}let dt=Math.min(.08,(time-last)/1000||.05);last=time;
    const size=$('[data-size]').value.split('x').map(Number),w=size[0],h=size[1],hour=+$('[data-hour]').value;
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
    ctx.imageSmoothingEnabled=false;
    const lay=get('wide_layout','dashboard'),s0=$('[data-scene]').value,scene=s0==='auto'?(hour<6||hour>=20?'clear-night':'partlycloudy'):s0,night=scene==='clear-night'||(s0==='auto'&&(hour<6||hour>=20));
    let pages=get('pages',''),page='now';try{let a=typeof pages==='string'?JSON.parse(pages):pages;if(Array.isArray(a)&&a.length)page=a[0]}catch(e){}
    const rect=(x,y,a,b,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))};
    const txt=(v,x,y,c='#e5f3ff')=>{ctx.fillStyle=c;ctx.font='8px monospace';ctx.fillText(String(v),Math.round(x),Math.round(y))};
    let dawn=hour===6||hour===7||hour===18||hour===19;
    let bg=night?'#0e1937':dawn?(hour<12?'#96556c':'#784966'):'#2d77aa';
    rect(0,0,w,h,bg);
    const x=Math.floor((w-128)/2),y=Math.floor((h-32)/2), ox=lay==='dashboard'&&w>=192?x:0;
    rect(x,y,128,32,bg);
    if(night){for(let i=0;i<32;i++)rect(x+(i*37)%128,y+(i*17)%23,1,1,i%3?'#a9cbe4':'#fcfcdf')}
    const sunX=x+Math.round(12+(hour-6)/13*107),sunY=y+Math.round(21-15*Math.sin(Math.max(0,Math.min(1,(hour-6)/13))*Math.PI));
    if(!night){rect(sunX-3,sunY-3,8,8,'#ffe09a');if(scene==='sunny')for(let q=0;q<8;q++)rect(sunX+Math.round(Math.cos(q*Math.PI/4)*7),sunY+Math.round(Math.sin(q*Math.PI/4)*7),2,2,'#ffd479')}
    else{let mx=x+103,my=y+6;rect(mx,my,12,12,'#e0e2df');rect(mx+5,my-2,11,13,bg)}
    for(let i=0;i<clouds.length;i++){let c=clouds[i];c.x=(c.x+c.v*dt)%(w+65);if(scene!=='sunny'&&scene!=='clear-night'){let cx=(c.x+w)%(w+65)-25;rect(cx,y+c.y,22,4,scene==='lightning-rainy'?'#647383':'#bad2df');rect(cx+4,y+c.y-2,12,3,scene==='lightning-rainy'?'#718394':'#d9e8ed')}}
    rect(x,y+26,128,6,night?'#101b2a':'#214b57');for(let i=0;i<7;i++){rect(x+2+i*19,y+23+i%3,13,9,night?'#1b273e':'#315167');if(night)rect(x+5+i*19,y+26,2,2,'#ffd18b')}
    if(['rainy','lightning-rainy','snowy'].includes(scene)){for(const d of drops){d.y=(d.y+d.spd*dt)%34;let px=x+((d.x+w)%128),py=y+d.y;
       if(scene==='snowy')rect(px,py,2,2,'#e7f5ff');else rect(px,py,1,3,'#a7d7f4')}}
    if(scene==='lightning-rainy'&&Math.sin(time/180)>0.97){rect(x,y,128,32,'#c9d9eb');rect(x+66,y+6,3,19,'#fff3bb')}
    if(page==='radar'&&get('radar',true)){rect(0,0,w,h,'#152e39');for(let i=0;i<30;i++){let px=(i*41+Math.floor(time/280))%w,py=(i*11)%h;rect(px,py,13,3,i%3?'#286a60':'#407e9e')}txt('RADAR (DEMO, NOT LIVE RAINVIEWER)',5,Math.max(10,h-5))}
    else if(page==='now'){txt('SKY WEATHER',x+4,y+9);txt(scene.replace('-',' '),x+4,y+20);txt(night?'MOON':'SUN',x+100,y+28)}
    else if(page==='sun'){txt('SUNRISE  /  SUNSET',x+5,y+10);txt('06:45     18:34',x+5,y+22)}
    else if(page==='moon'){txt('MOON PHASE',x+5,y+11);txt('WAXING CRESCENT',x+5,y+22)}
    else if(page==='hourly'||page==='daily'){txt((page==='hourly'?'HOURLY':'DAILY')+' FORECAST',x+4,y+10);for(let i=0;i<5;i++)txt((72-i*3)+'°',x+i*25,y+24)}
    else txt('WIND  HUMIDITY  UV',x+5,y+12);
    if(ox){rect(0,y,x-4,32,'#172d46');rect(x+132,y,w-x-132,32,'#172d46');if(x>=60){txt('CURRENT',4,y+10,'#ffcf82');txt('72 F',4,y+20);txt(scene.slice(0,Math.floor((x-6)/5)),4,y+30,'#b5d4e7')}if(w-x-132>=54){txt('FORECAST',x+132,y+10,'#ffcf82');txt('NEXT 70F',x+132,y+20);txt('RAIN 20%',x+132,y+30,'#b5d4e7')}}
    $('[data-info]').textContent=w+'×'+h+' • '+lay+' • '+scene+' • '+page+' • animated preview (sample data)';
    raf=requestAnimationFrame(frame);
  }
  const invalidation=()=>{last=0};root.addEventListener('input',invalidation);root.addEventListener('change',invalidation);
  $('[data-download]').addEventListener('click',()=>{const a=document.createElement('a');a.download='sky-weather-wide.png';a.href=canvas.toDataURL('image/png');a.click()});
  raf=requestAnimationFrame(frame);
  const obs=new MutationObserver(()=>{if(!container.isConnected){cancelAnimationFrame(raf);root.removeEventListener('input',invalidation);root.removeEventListener('change',invalidation);obs.disconnect()}});
  obs.observe(document.body,{subtree:true,childList:true});
 },
 getValue:()=> 'preview',setValue:()=>{}
});
})();