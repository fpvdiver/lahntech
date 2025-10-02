const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

/* Reveal / Progress / Counters */
(() => {
  const items = $$('.reveal, [data-progress], [data-count], .progress > i, .stat-num');
  if (!('IntersectionObserver' in window)) { items.forEach(el=>el.classList.add('in')); return; }
  const io = new IntersectionObserver((ents)=>{
    ents.forEach(e=>{
      if(!e.isIntersecting) return;
      e.target.classList.add('in');

      // progress bars
      const p = e.target.getAttribute('data-progress');
      if(p){
        const bar = e.target.querySelector('i'); if(bar){ bar.style.width = Math.min(100, parseInt(p,10)||0) + '%'; }
      }

      // counters
      if(e.target.classList.contains('stat-num')){
        const end = parseInt(e.target.getAttribute('data-count'),10)||0;
        const dur = parseInt(e.target.getAttribute('data-duration'),10)||1400;
        const start = performance.now(); const el = e.target; const fmt = new Intl.NumberFormat();
        const tick = (t)=>{ const k=(t-start)/dur; const p=Math.max(0,Math.min(1,k)); el.textContent = fmt.format(Math.round(end*(1-Math.pow(1-p,3)))); if(p<1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }

      io.unobserve(e.target);
    });
  },{rootMargin:'0px 0px -10% 0px',threshold:0.12});
  items.forEach(el=>io.observe(el));
})();

/* Sticky state (classe para sombra sutil se quiser usar no CSS) */
(() => {
  const onScroll=()=>document.documentElement.classList.toggle('is-scrolled',(window.scrollY||0)>8);
  onScroll(); window.addEventListener('scroll',onScroll,{passive:true});
})();

/* Parallax leve no mock do hero */
(() => {
  const els = $$('[data-parallax]'); if(!els.length) return;
  const parallax = ()=>{ const y=window.scrollY||0; els.forEach(el=>{ const s=parseFloat(el.getAttribute('data-parallax'))||0.18; const r=el.getBoundingClientRect(); el.style.transform=`translate3d(0, ${(r.top+y)*s*-1}px, 0)`; }); };
  parallax(); window.addEventListener('scroll',parallax,{passive:true}); window.addEventListener('resize',parallax);
})();

/* Smooth anchor offset (header) — ignora brand quando centralizada */
(() => {
  $$('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',(ev)=>{
      if (a.matches('.site-nav .brand') && document.body.classList.contains('nav-centered')) return;
      const id=a.getAttribute('href').slice(1); const el=document.getElementById(id); if(!el) return;
      ev.preventDefault(); const y=el.getBoundingClientRect().top+window.scrollY-72; window.scrollTo({top:y,behavior:'smooth'});
    });
  });
})();

/* Mobile offcanvas */
(() => {
  const burger=document.querySelector('[data-burger]'); const offc=document.querySelector('[data-offcanvas]'); const closeBtn=document.querySelector('[data-close-offcanvas]');
  const toggle=(open)=>{ if(!offc) return; offc.classList.toggle('is-open',open); offc.setAttribute('aria-hidden', String(!open)); document.body.style.overflow=open?'hidden':''; };
  burger && burger.addEventListener('click',()=>toggle(true));
  closeBtn && closeBtn.addEventListener('click',()=>toggle(false));
  offc && offc.addEventListener('click',(e)=>{ if(e.target===offc) toggle(false); });
  $$('.offcanvas a').forEach(a=>a.addEventListener('click',()=>toggle(false)));
})();

/* ===== Navbar inteligente (fixa, logo gira 360° e menu compacto abre com efeito "faded") ===== */
(() => {
  const header  = document.querySelector('.site-nav');
  const navWrap = document.querySelector('.site-nav .nav-wrap');
  const brand   = document.querySelector('.site-nav .brand');
  const logoImg = brand?.querySelector('img');
  const mainNav = document.querySelector('.main-nav');
  const actions = document.querySelector('.actions');
  const hero    = document.getElementById('hero');
  if (!header || !navWrap || !brand || !mainNav || !actions || !hero) return;

  /* CSS injetado para estados + painel com efeito faded */
  const style = document.createElement('style');
  style.innerHTML = `
    .site-nav .nav-wrap{ position:relative; min-height:64px; }
    body.nav-fixed .site-nav{ position:fixed; top:0; left:0; right:0; z-index:1000; }
    body.nav-fixed main{ padding-top: var(--header-h, 72px); }

    body.nav-centered .site-nav .nav-wrap{ justify-content:center; }
    body.nav-centered .site-nav .main-nav,
    body.nav-centered .site-nav .actions{
      opacity:0; pointer-events:none; transform:translateY(-6px);
      transition:opacity .2s, transform .2s;
    }
    body.nav-centered .site-nav .brand{
      position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
      z-index:1002;
    }

    @keyframes spin360{ from{transform:rotate(0)} to{transform:rotate(360deg)} }
    .logo-spin{ animation:spin360 .6s ease; }

    /* Overlay para clicar fora (só aparece aberto) */
    .logo-overlay{
      position:fixed; inset:0; background:rgba(3,8,16,.35); backdrop-filter:saturate(120%) blur(3px);
      opacity:0; visibility:hidden; pointer-events:none; transition:opacity .18s, visibility .18s;
      z-index:1001;
    }
    .logo-overlay.show{ opacity:1; visibility:visible; pointer-events:auto; }

    /* Painel "faded" (frosted glass) + grid em escadinha */
    .logo-menu{
      position:absolute; left:50%; transform:translateX(-50%) translateY(-6px) scale(.98);
      top:calc(100% + 12px);
      opacity:0; visibility:hidden; pointer-events:none;
      z-index:1003; padding:14px;
      background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
      border:1px solid #1a2b45; border-radius:16px;
      box-shadow:0 18px 50px rgba(0,0,0,.45);
      backdrop-filter:saturate(140%) blur(10px);
      transition:opacity .18s ease, transform .22s ease, visibility .18s;
    }
    .logo-menu.open{
      opacity:1; visibility:visible; pointer-events:auto;
      transform:translateX(-50%) translateY(0) scale(1);
    }

    /* Layout dos botões (escadinha como seu exemplo) */
    .logo-menu .grid{
      --gap:10px;
      display:grid;
      grid-template-columns: repeat(5, minmax(84px, auto));
      grid-template-rows: repeat(3, auto);
      grid-template-areas:
        "home . . . contact"
        "about . . . blog"
        ". services projects pricing .";
      gap: var(--gap);
      align-items:center; justify-items:center;
    }

    .logo-menu a{
      display:inline-block; padding:8px 12px;
      border-radius:10px; background:#0c1426; border:1px solid #14233b;
      color:#cfe0fb; font-weight:800; font-size:13px; letter-spacing:.2px;
      box-shadow:0 8px 22px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.04) inset;
      white-space:nowrap;
    }
    .logo-menu a:hover{ background:#0f1b34; color:#fff; }

    .logo-menu .k-home{grid-area:home}
    .logo-menu .k-about{grid-area:about}
    .logo-menu .k-services{grid-area:services}
    .logo-menu .k-projects{grid-area:projects}
    .logo-menu .k-pricing{grid-area:pricing}
    .logo-menu .k-blog{grid-area:blog}
    .logo-menu .k-contact{grid-area:contact}

    @media (max-width:1024px){
      .logo-menu{ width:min(92%,560px); }
    }
  `;
  document.head.appendChild(style);

  /* Monta painel + grid de pílulas a partir do menu principal */
  const clsMap = {
    'início':'k-home','inicio':'k-home','home':'k-home',
    'sobre':'k-about','about':'k-about',
    'serviços':'k-services','services':'k-services',
    'projetos':'k-projects','projects':'k-projects',
    'planos':'k-pricing','pricing':'k-pricing',
    'conteúdos':'k-blog','conteudos':'k-blog','blog':'k-blog',
    'contato':'k-contact','contact':'k-contact'
  };

  const overlay = document.createElement('div');
  overlay.className = 'logo-overlay';
  document.body.appendChild(overlay);

  const logoMenu = document.createElement('div');
  logoMenu.className = 'logo-menu';
  const grid = document.createElement('div');
  grid.className = 'grid';
  logoMenu.appendChild(grid);

  Array.from(mainNav.querySelectorAll('.menu > li > a')).forEach(a => {
    const link = document.createElement('a');
    link.href = a.getAttribute('href') || '#';
    const txt = (a.textContent||'').trim();
    link.textContent = txt;
    const key = txt.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const cls = clsMap[key]; if (cls) link.classList.add(cls);
    link.addEventListener('click', () => { closeLogoMenu(); });
    grid.appendChild(link);
  });

  navWrap.appendChild(logoMenu);

  // Estado centralizado baseado no scroll (navbar fixa + logo no centro)
  const isCenteredNow = () => {
    const headerH = header.getBoundingClientRect().height || 72;
    const trigger = hero.offsetHeight - headerH * 0.6;
    return (window.scrollY || 0) > Math.max(0, trigger);
  };

  let centered = false;
  const applyState = (on) => {
    if (centered === on) return;
    centered = on;

    document.body.classList.toggle('nav-fixed', on);
    const h = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--header-h', `${Math.round(h)}px`);

    document.body.classList.toggle('nav-centered', on);
    closeLogoMenu();

    if (on && logoImg) {
      logoImg.classList.remove('logo-spin'); void logoImg.offsetWidth; logoImg.classList.add('logo-spin');
    }
    if (!on) document.documentElement.style.removeProperty('--header-h');
  };

  const updateState = () => applyState(isCenteredNow());
  updateState();
  window.addEventListener('scroll', updateState, { passive:true });
  window.addEventListener('resize', updateState);

  /* Abrir/fechar com clique ESQUERDO na logo (apenas quando centralizada) */
  function openLogoMenu(){
    logoMenu.classList.add('open');
    overlay.classList.add('show');
  }
  function closeLogoMenu(){
    logoMenu.classList.remove('open');
    overlay.classList.remove('show');
  }
  const toggleMenuOnLeftClick = (ev) => {
    if (!isCenteredNow()) return; // no hero: âncora normal
    if (ev.button !== 0) return;   // só botão esquerdo
    ev.preventDefault(); ev.stopPropagation();
    if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
    if (logoMenu.classList.contains('open')) closeLogoMenu(); else openLogoMenu();
  };
  brand.addEventListener('mousedown', toggleMenuOnLeftClick, true);
  brand.addEventListener('click',     toggleMenuOnLeftClick, true);
  brand.addEventListener('contextmenu', (e)=>{ if (isCenteredNow()) e.preventDefault(); });

  /* Fechar ao clicar fora / overlay, rolar, ou ESC */
  overlay.addEventListener('click', closeLogoMenu);
  document.addEventListener('click', (ev) => {
    if (!centered) return;
    if (!logoMenu.contains(ev.target) && !brand.contains(ev.target)) closeLogoMenu();
  }, true);

  window.addEventListener('scroll', () => { if (logoMenu.classList.contains('open')) closeLogoMenu(); }, { passive:true });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLogoMenu(); });

  const ro = new ResizeObserver(() => { logoMenu.style.top = 'calc(100% + 12px)'; });
  ro.observe(navWrap);
})();

/* ===== Glow "fibra óptica" correndo pelos circuitos da LOGO ===== */
(() => {
  const brand = document.querySelector('.site-nav .brand');
  const img = brand?.querySelector('img');
  if (!brand || !img) return;

  if (brand.querySelector('.logo-wrap')) return;

  const wrap = document.createElement('span');
  wrap.className = 'logo-wrap';
  img.replaceWith(wrap);
  wrap.appendChild(img);

  const flow = document.createElement('span');
  flow.className = 'logo-flow';
  wrap.appendChild(flow);

  const setMask = () => {
    const src = img.currentSrc || img.src;
    flow.style.webkitMaskImage = `url("${src}")`;
    flow.style.maskImage = `url("${src}")`;
    flow.style.webkitMaskRepeat = flow.style.maskRepeat = 'no-repeat';
    flow.style.webkitMaskSize = flow.style.maskSize = '100% 100%';
  };
  setMask();
  img.addEventListener('load', setMask, { once:true });

  const glowCSS = document.createElement('style');
  glowCSS.innerHTML = `
    .site-nav .brand{ position:relative; }
    .logo-wrap{ position:relative; display:inline-grid; place-items:center; }
    .logo-wrap img{
      display:block; border-radius:8px;
      filter: drop-shadow(0 0 6px rgba(0,214,255,.35)) drop-shadow(0 0 12px rgba(92,240,255,.25));
      transition: filter .3s ease;
    }
    body.nav-centered .logo-wrap img{
      filter: drop-shadow(0 0 8px rgba(0,214,255,.55)) drop-shadow(0 0 16px rgba(92,240,255,.40));
    }
    .logo-flow{
      position:absolute; inset:0; pointer-events:none; border-radius:8px;
      filter: drop-shadow(0 0 6px rgba(0,214,255,.55));
      background:
        linear-gradient(180deg, rgba(0,214,255,.45), rgba(92,240,255,.55)),
        repeating-linear-gradient(45deg,
          rgba(92,240,255,0) 0 12px,
          rgba(92,240,255,.0) 12px,
          rgba(92,240,255,.95) 16px,
          rgba(92,240,255,0) 20px,
          rgba(92,240,255,0) 36px),
        repeating-linear-gradient(-45deg,
          rgba(0,214,255,0) 0 10px,
          rgba(0,214,255,.0) 10px,
          rgba(0,214,255,.95) 14px,
          rgba(0,214,255,0) 18px,
          rgba(0,214,255,0) 34px);
      background-size: 100% 100%, 260% 260%, 240% 240%;
      background-position: 0 0, 0% 0%, 100% 0%;
      mix-blend-mode: screen;
      animation: flowA 3.4s linear infinite, flowB 3.1s linear infinite;
      animation-composition: accumulate;
    }
    body.nav-centered .logo-flow{
      filter: drop-shadow(0 0 9px rgba(0,214,255,.75));
      animation-duration: 2.2s, 2.0s;
    }
    @keyframes flowA{
      from { background-position: 0 0,   0% 0%,   100% 0%; }
      to   { background-position: 0 0, 200% 200%, 100% 0%; }
    }
    @keyframes flowB{
      from { background-position: 0 0,   0% 0%,  100% 0%; }
      to   { background-position: 0 0,   0% 0%, -180% 200%; }
    }
  `;
  document.head.appendChild(glowCSS);
})();
