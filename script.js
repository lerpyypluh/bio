// Dark Neon site interactions: audio control, social injection, canvas particles & subtle parallax
(() => {
  const root = document.body;
  const nameEl = document.getElementById('name');
  const tagEl = document.getElementById('tagline');
  const linksEl = document.getElementById('links');

  // read data- attributes
  const dataName = root.dataset.name || 'YOUR NAME';
  const dataTag = root.dataset.tagline || 'Producer • Designer • Creator';
  const socials = [
    {href: root.dataset.twitter, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 16 3a4.48 4.48 0 0 0-4.47 4.47c0 .35.04.7.12 1.03A12.8 12.8 0 0 1 3 4s-4 9 5 13a13 13 0 0 1-8 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>'},
    {href: root.dataset.instagram, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="12" r="3"/><path d="M17.5 6.5h.01"/></svg>'},
    {href: root.dataset.github, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77A5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77c0 5.42 3.3 6.6 6.44 7A3.37 3.37 0 0 0 10.5 16.5V20"/></svg>'}
  ];

  nameEl.textContent = dataName;
  tagEl.textContent = dataTag;

  socials.forEach(s => {
    if(!s.href) return;
    const a = document.createElement('a');
    a.className = 'link-btn';
    a.href = s.href;
    a.target = '_blank';
    a.innerHTML = s.svg;
    linksEl.appendChild(a);
  });

  // Audio
  const music = document.getElementById('bgMusic');
  const btn = document.getElementById('playPause');
  let playing = false;
  function updateBtn(){ btn.textContent = playing ? '⏸' : '⏵'; }
  btn.addEventListener('click', async () => {
    try{
      if(playing){ music.pause(); playing = false; }
      else{ await music.play(); playing = true; }
    }catch(e){ console.warn('autoplay blocked', e); }
    updateBtn();
  });

  // Canvas background: soft glowing particles with parallax
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  function resize(){ canvas.width = innerWidth * DPR; canvas.height = innerHeight * DPR; canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px'; ctx.setTransform(DPR,0,0,DPR,0,0); }
  addEventListener('resize', resize); resize();

  const particles = [];
  const COUNT = Math.floor((innerWidth * innerHeight) / 12000);
  for(let i=0;i<COUNT;i++) particles.push({ x: Math.random()*innerWidth, y: Math.random()*innerHeight, r: Math.random()*1.8+0.5, vx:(Math.random()*0.6-0.3), vy:(Math.random()*0.4-0.2), hue: Math.random()*360 });

  let mx = innerWidth/2, my = innerHeight/2;
  addEventListener('mousemove', (e)=>{ mx = e.clientX; my = e.clientY; });

  function draw(t){ ctx.clearRect(0,0,innerWidth,innerHeight);
    // soft gradient wash
    const g = ctx.createLinearGradient(0,0,innerWidth,innerHeight);
    g.addColorStop(0,'rgba(6,9,19,0.6)');
    g.addColorStop(1,'rgba(3,6,13,0.6)');
    ctx.fillStyle = g; ctx.fillRect(0,0,innerWidth,innerHeight);

    particles.forEach((p,i)=>{
      p.x += p.vx * (0.2 + Math.sin(t/1000 + i) * 0.3);
      p.y += p.vy * (0.2 + Math.cos(t/1200 + i) * 0.3);
      // parallax based on mouse
      const dx = (mx - innerWidth/2) * 0.02 * (p.r);
      const dy = (my - innerHeight/2) * 0.02 * (p.r);
      const x = p.x + dx, y = p.y + dy;

      // glow
      ctx.beginPath();
      const hue = (200 + Math.sin(t/2000 + i) * 40) % 360;
      ctx.fillStyle = `hsla(${hue},90%,65%,0.08)`;
      ctx.arc(x,y,p.r*6,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.fillStyle = `hsla(${hue},90%,65%,0.18)`; ctx.arc(x,y,p.r*2.4,0,Math.PI*2); ctx.fill();
    });

    // vignette
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0,0,innerWidth,innerHeight);
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

})();
