// ============================================================
// LibreAudio PRO — app.js  v2.0
// Directorio de Radio · TV · Podcasts · Audio
// Supabase JS v2 CDN · No bundler needed
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── CONFIG ──────────────────────────────────────────────────
const SUPABASE_URL  = window.SUPABASE_URL  || 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON = window.SUPABASE_ANON || 'TU_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true }
});

// ── ESTADO GLOBAL ───────────────────────────────────────────
export const state = {
  session: null,
  profile: null,
  currentPage: '#/',
  filters: { type: '', query: '', genre: '', country: '' },
  player: {
    active: false,
    title: '',
    subtitle: '',
    cover: '',
    streamUrl: '',
    panelType: '',   // 'audio' | 'azuracast' | 'sonicpanel' | 'zenofm' | 'iframe' | 'hls'
    embedUrl: '',
    itemId: null,
  },
};

// ── INIT ────────────────────────────────────────────────────
export async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  state.session = session;
  if (session) await loadProfile();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    state.session = session;
    if (session) await loadProfile();
    else state.profile = null;
    renderNav();
    router();
  });

  window.addEventListener('popstate', router);
  router();
  initPlayer();
}

// ── CARGAR PERFIL ───────────────────────────────────────────
async function loadProfile() {
  const { data } = await supabase
    .from('profiles').select('*')
    .eq('id', state.session.user.id).single();
  state.profile = data;
}

// ── ROUTER SPA ──────────────────────────────────────────────
export function router() {
  const hash = location.hash || '#/';
  const routes = {
    '#/':               renderHome,
    '#/explorar':       renderExplorer,
    '#/tv':             renderTV,
    '#/radio':          renderRadio,
    '#/enviar':         renderSubmit,
    '#/mis-envios':     renderMine,
    '#/admin':          renderAdmin,
    '#/perfil':         renderProfile,
    '#/login':          renderLogin,
    '#/register':       renderRegister,
    '#/recuperar':      renderForgotPassword,
    '#/nueva-password': renderNewPassword,
  };
  const handler = routes[hash] || render404;
  state.currentPage = hash;
  renderNav();
  handler();
  window.scrollTo({ top: 0 });
}

function navigate(hash) { location.hash = hash; }

// ── NAV ─────────────────────────────────────────────────────
function renderNav() {
  const nav = document.getElementById('nav');
  const isAdmin = state.profile?.role === 'admin';
  const user = state.session?.user;
  const cur = location.hash || '#/';

  nav.innerHTML = `
    <div class="nav-inner">
      <a href="#/" class="nav-logo">
        <div class="nav-logo-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="url(#lg)"/>
            <defs><linearGradient id="lg" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#7C3AED"/><stop offset="1" stop-color="#DB2777"/></linearGradient></defs>
            <path d="M10 12a6 6 0 1 1 12 0v8a6 6 0 0 1-12 0V12z" fill="white" opacity=".9"/>
            <circle cx="16" cy="16" r="3.5" fill="#7C3AED"/>
            <rect x="6" y="14" width="3" height="4" rx="1.5" fill="white" opacity=".7"/>
            <rect x="23" y="14" width="3" height="4" rx="1.5" fill="white" opacity=".7"/>
          </svg>
        </div>
        <div class="nav-logo-text">
          <span class="nav-brand">LibreAudio</span>
          <span class="nav-badge">PRO</span>
        </div>
      </a>

      <nav class="nav-links">
        <a href="#/" class="${cur==='#/'?'active':''}">Inicio</a>
        <a href="#/radio" class="${cur==='#/radio'?'active':''}">📻 Radio</a>
        <a href="#/tv" class="${cur==='#/tv'?'active':''}">📺 TV</a>
        <a href="#/explorar" class="${cur==='#/explorar'?'active':''}">Explorar</a>
        ${user ? `<a href="#/enviar" class="${cur==='#/enviar'?'active':''}">+ Enviar</a>` : ''}
        ${isAdmin ? `<a href="#/admin" class="badge-admin ${cur==='#/admin'?'active':''}">Admin</a>` : ''}
      </nav>

      <div class="nav-auth">
        ${user
          ? `<div class="user-menu" id="userMenu">
               <img src="${state.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(state.profile?.username||'U')}&background=7C3AED&color=fff`}" class="avatar" />
               <span>${state.profile?.username || 'Usuario'}</span>
               <div class="dropdown">
                 <a href="#/mis-envios">Mis envíos</a>
                 <a href="#/perfil">Mi perfil</a>
                 <button onclick="window.logout()">Cerrar sesión</button>
               </div>
             </div>`
          : `<a href="#/login" class="btn btn-ghost">Entrar</a>
             <a href="#/register" class="btn btn-primary">Registrarse</a>`
        }
      </div>
      <button class="hamburger" id="hamburger" aria-label="Menú">
        <span></span><span></span><span></span>
      </button>
    </div>
  `;

  document.getElementById('hamburger')?.addEventListener('click', () => nav.classList.toggle('open'));
  document.getElementById('userMenu')?.addEventListener('click', e => e.currentTarget.classList.toggle('active'));
}

// ── LOGOUT ──────────────────────────────────────────────────
window.logout = async () => { await supabase.auth.signOut(); navigate('#/'); };

// ── HELPERS ─────────────────────────────────────────────────
function setMain(html) { document.getElementById('main').innerHTML = html; }

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}

function loadingHTML() {
  return `<div class="loading-screen"><div class="spinner"></div><p>Cargando…</p></div>`;
}

function escapeHTML(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const TYPE_META = {
  radio:          { icon: '📻', label: 'Radio',         color: '#7C3AED' },
  podcast:        { icon: '🎙️', label: 'Podcast',       color: '#2563EB' },
  musica:         { icon: '🎵', label: 'Música',         color: '#059669' },
  stream_en_vivo: { icon: '🔴', label: 'En vivo',       color: '#DC2626' },
  tv_en_vivo:     { icon: '📺', label: 'TV en vivo',    color: '#DB2777' },
  tv_grabado:     { icon: '🎬', label: 'TV/Video',      color: '#B45309' },
  otro:           { icon: '🎧', label: 'Otro',           color: '#6B7280' },
};

const PANEL_LABELS = {
  audio:      'Audio directo',
  azuracast:  'AzuraCast',
  sonicpanel: 'SonicPanel',
  zenofm:     'ZenoFM',
  iframe:     'Embed',
  hls:        'HLS Stream',
  youtube:    'YouTube',
  twitch:     'Twitch',
  generic:    'Stream',
};

// ── CONTENT CARD ────────────────────────────────────────────
function contentCardHTML(item, featured = false) {
  const meta   = TYPE_META[item.type] || TYPE_META.otro;
  const isLive = item.type === 'stream_en_vivo' || item.type === 'tv_en_vivo';
  const isTV   = item.type === 'tv_en_vivo' || item.type === 'tv_grabado';
  const panelLabel = PANEL_LABELS[item.panel_type] || '';

  const listeners = item.current_listeners > 0
    ? `<span class="listeners-badge">👥 ${item.current_listeners}</span>` : '';

  const nowPlaying = item.now_playing
    ? `<div class="now-playing"><span class="np-dot"></span><span class="np-text">${escapeHTML(item.now_playing)}</span></div>` : '';

  const countryBadge = item.country
    ? `<span class="country-badge">${getFlagEmoji(item.country)} ${escapeHTML(item.country)}</span>` : '';

  return `
    <article class="card ${featured?'card-featured':''} ${isLive?'card-live':''} ${isTV?'card-tv':''}" data-id="${item.id}">
      <div class="card-cover" style="${item.cover_url ? `background-image:url('${item.cover_url}')` : `background:linear-gradient(135deg,${meta.color}22,${meta.color}44)`}">
        ${!item.cover_url ? `<span class="card-icon">${meta.icon}</span>` : ''}
        <div class="card-cover-badges">
          <span class="card-type-badge" style="--badge-color:${meta.color}">${meta.label}</span>
          ${isLive ? '<span class="live-pill">● EN VIVO</span>' : ''}
        </div>
        ${listeners}
        <button class="play-btn" onclick="playItem(event,'${item.id}','${escapeHTML(item.title)}','${escapeHTML(item.subtitle||'')}','${escapeHTML(item.cover_url||'')}','${escapeHTML(item.stream_url||item.external_url||'')}','${item.panel_type||'generic'}','${escapeHTML(item.embed_url||item.external_url||'')}')" aria-label="Reproducir">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
      <div class="card-body">
        <div class="card-meta-row">
          ${countryBadge}
          ${panelLabel ? `<span class="panel-badge">${panelLabel}</span>` : ''}
        </div>
        <h3 class="card-title">${escapeHTML(item.title)}</h3>
        ${item.subtitle ? `<p class="card-subtitle">${escapeHTML(item.subtitle)}</p>` : ''}
        ${item.genre ? `<span class="card-genre">${escapeHTML(item.genre)}</span>` : ''}
        ${nowPlaying}
        <div class="card-footer">
          <span class="card-plays">▶ ${item.plays||0}</span>
          <a href="${item.external_url}" target="_blank" rel="noopener noreferrer"
             class="btn btn-sm btn-ghost" onclick="trackPlay('${item.id}')">
            ${isTV ? 'Ver' : 'Escuchar'}
          </a>
        </div>
      </div>
    </article>
  `;
}

function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '';
  return countryCode.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(127397 + c.charCodeAt(0))
  );
}

// ── GLOBAL PLAYER ───────────────────────────────────────────
function initPlayer() {
  const bar = document.getElementById('playerBar');
  if (!bar) return;
  bar.innerHTML = `
    <div class="player-inner">
      <div class="player-cover" id="pCover"></div>
      <div class="player-info">
        <div class="player-title" id="pTitle">Selecciona una estación</div>
        <div class="player-sub" id="pSub"></div>
      </div>
      <div class="player-controls">
        <button class="player-btn" id="pPlayPause" onclick="window.playerToggle()" aria-label="Play/Pause">
          <svg id="pPlayIcon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button class="player-btn player-stop" onclick="window.playerStop()" aria-label="Stop">
          <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
        </button>
        <input type="range" id="pVolume" min="0" max="1" step="0.05" value="0.8" class="player-volume" aria-label="Volumen" />
      </div>
      <div id="pEmbedWrap" class="player-embed-wrap" style="display:none"></div>
    </div>
  `;

  // Volume
  document.getElementById('pVolume').addEventListener('input', e => {
    const audio = document.getElementById('playerAudio');
    if (audio) audio.volume = e.target.value;
  });
}

window.playItem = function(e, id, title, subtitle, cover, streamUrl, panelType, embedUrl) {
  e?.stopPropagation();
  trackPlay(id);

  state.player = { active: true, title, subtitle, cover, streamUrl, panelType, embedUrl, itemId: id };

  document.getElementById('pTitle').textContent = title;
  document.getElementById('pSub').textContent = subtitle || '';
  const coverEl = document.getElementById('pCover');
  coverEl.style.backgroundImage = cover ? `url('${cover}')` : '';
  coverEl.textContent = cover ? '' : (TYPE_META[panelType]?.icon || '🎵');

  const bar = document.getElementById('playerBar');
  bar.classList.add('active');

  const embedWrap = document.getElementById('pEmbedWrap');
  const existingAudio = document.getElementById('playerAudio');
  if (existingAudio) existingAudio.remove();

  // Determine how to play
  if (panelType === 'youtube') {
    const ytId = extractYouTubeId(streamUrl || embedUrl);
    if (ytId) {
      embedWrap.style.display = 'block';
      embedWrap.innerHTML = `<iframe id="pIframe" src="https://www.youtube.com/embed/${ytId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
      updatePlayIcon(true);
    }
  } else if (panelType === 'twitch') {
    const channel = extractTwitchChannel(streamUrl || embedUrl);
    embedWrap.style.display = 'block';
    embedWrap.innerHTML = `<iframe id="pIframe" src="https://player.twitch.tv/?channel=${channel}&parent=${location.hostname}" frameborder="0" allowfullscreen></iframe>`;
    updatePlayIcon(true);
  } else if (panelType === 'azuracast') {
    embedWrap.style.display = 'block';
    embedWrap.innerHTML = `<iframe id="pIframe" src="${embedUrl}" frameborder="0" style="border-radius:8px"></iframe>`;
    updatePlayIcon(true);
  } else if (panelType === 'zenofm') {
    embedWrap.style.display = 'block';
    embedWrap.innerHTML = `<iframe id="pIframe" src="${embedUrl}" frameborder="0" style="border-radius:8px"></iframe>`;
    updatePlayIcon(true);
  } else if (panelType === 'sonicpanel') {
    embedWrap.style.display = 'block';
    embedWrap.innerHTML = `<iframe id="pIframe" src="${embedUrl}" frameborder="0" style="border-radius:8px"></iframe>`;
    updatePlayIcon(true);
  } else if (panelType === 'iframe') {
    embedWrap.style.display = 'block';
    embedWrap.innerHTML = `<iframe id="pIframe" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
    updatePlayIcon(true);
  } else {
    // Direct audio (MP3, HLS, etc.)
    embedWrap.style.display = 'none';
    embedWrap.innerHTML = '';
    const audio = document.createElement('audio');
    audio.id = 'playerAudio';
    audio.src = streamUrl || embedUrl;
    audio.volume = parseFloat(document.getElementById('pVolume')?.value || 0.8);
    audio.style.display = 'none';
    document.body.appendChild(audio);
    audio.play().then(() => updatePlayIcon(true)).catch(() => {
      // HLS fallback
      if (streamUrl?.includes('.m3u8') && window.Hls) {
        const hls = new window.Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(audio);
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => { audio.play(); updatePlayIcon(true); });
      } else {
        // Open externally as last resort
        window.open(streamUrl || embedUrl, '_blank');
      }
    });
  }
};

function updatePlayIcon(playing) {
  const icon = document.getElementById('pPlayIcon');
  if (!icon) return;
  if (playing) {
    icon.innerHTML = '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>';
  } else {
    icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
  }
}

window.playerToggle = function() {
  const audio = document.getElementById('playerAudio');
  const iframe = document.getElementById('pIframe');
  if (audio) {
    if (audio.paused) { audio.play(); updatePlayIcon(true); }
    else { audio.pause(); updatePlayIcon(false); }
  } else if (iframe) {
    // For iframes we can only reload or remove
    window.playerStop();
  }
};

window.playerStop = function() {
  const audio = document.getElementById('playerAudio');
  if (audio) { audio.pause(); audio.src = ''; audio.remove(); }
  const embedWrap = document.getElementById('pEmbedWrap');
  if (embedWrap) { embedWrap.style.display = 'none'; embedWrap.innerHTML = ''; }
  document.getElementById('playerBar')?.classList.remove('active');
  state.player.active = false;
  updatePlayIcon(false);
};

function extractYouTubeId(url) {
  const m = url?.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
function extractTwitchChannel(url) {
  const m = url?.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
  return m ? m[1] : (url || '');
}

window.trackPlay = async (id) => {
  await supabase.rpc('increment_plays', { content_id: id });
};

// ── HOME ────────────────────────────────────────────────────
async function renderHome() {
  setMain(loadingHTML());

  const [
    { data: featured },
    { data: liveTV },
    { data: liveRadio },
    { count: total },
  ] = await Promise.all([
    supabase.from('content').select('*').eq('status','approved')
      .order('plays', { ascending: false }).limit(6),
    supabase.from('content').select('*').eq('status','approved')
      .eq('type','tv_en_vivo').order('plays', { ascending: false }).limit(4),
    supabase.from('content').select('*').eq('status','approved')
      .eq('type','radio').order('plays', { ascending: false }).limit(6),
    supabase.from('content').select('*', { count: 'exact', head: true }).eq('status','approved'),
  ]);

  setMain(`
    <!-- HERO -->
    <section class="hero-v2">
      <div class="hero-v2-content">
        <div class="hero-v2-eyebrow">🌐 Directorio libre y abierto</div>
        <h1>Radio · TV · Podcasts<br><span class="gradient-text">Todo en un solo lugar</span></h1>
        <p>Descubre miles de estaciones de radio, canales de TV en vivo, podcasts y audio independiente compartido por la comunidad.</p>
        <div class="hero-v2-actions">
          <a href="#/radio" class="btn btn-primary btn-lg">📻 Explorar Radio</a>
          <a href="#/tv" class="btn btn-tv btn-lg">📺 Ver TV en vivo</a>
        </div>
        <div class="hero-v2-stats">
          <div class="hstat"><strong>${total||0}</strong><span>Contenidos</span></div>
          <div class="hstat"><strong>100%</strong><span>Gratuito</span></div>
          <div class="hstat"><strong>∞</strong><span>Géneros</span></div>
          <div class="hstat"><strong>🌎</strong><span>Global</span></div>
        </div>
      </div>
      <div class="hero-v2-visual">
        <div class="hero-screens">
          <div class="screen screen-tv">
            <div class="screen-inner">📺</div>
            <span>TV EN VIVO</span>
          </div>
          <div class="screen screen-radio">
            <div class="screen-inner">📻</div>
            <span>RADIO</span>
          </div>
          <div class="screen screen-pod">
            <div class="screen-inner">🎙️</div>
            <span>PODCAST</span>
          </div>
        </div>
      </div>
    </section>

    <!-- PLATAFORMAS SOPORTADAS -->
    <section class="platforms-bar">
      <div class="platforms-inner">
        <span class="platforms-label">Compatible con</span>
        <div class="platforms-list">
          <span class="platform-chip">⚡ AzuraCast</span>
          <span class="platform-chip">🎵 SonicPanel</span>
          <span class="platform-chip">📻 ZenoFM</span>
          <span class="platform-chip">▶️ YouTube Live</span>
          <span class="platform-chip">🟣 Twitch</span>
          <span class="platform-chip">🔊 HLS Stream</span>
          <span class="platform-chip">🎧 MP3 Directo</span>
        </div>
      </div>
    </section>

    ${liveTV && liveTV.length > 0 ? `
    <!-- TV EN VIVO -->
    <section class="section">
      <div class="section-header">
        <div class="section-title-wrap">
          <span class="section-icon">📺</span>
          <h2>TV en vivo</h2>
          <span class="live-indicator">● EN VIVO</span>
        </div>
        <a href="#/tv" class="link-more">Ver todos →</a>
      </div>
      <div class="grid-cards grid-tv">
        ${liveTV.map(i => contentCardHTML(i)).join('')}
      </div>
    </section>` : ''}

    ${liveRadio && liveRadio.length > 0 ? `
    <!-- RADIO DESTACADA -->
    <section class="section">
      <div class="section-header">
        <div class="section-title-wrap">
          <span class="section-icon">📻</span>
          <h2>Radio en vivo</h2>
        </div>
        <a href="#/radio" class="link-more">Ver todas →</a>
      </div>
      <div class="grid-cards">
        ${liveRadio.map(i => contentCardHTML(i)).join('')}
      </div>
    </section>` : ''}

    <!-- MÁS POPULARES -->
    <section class="section">
      <div class="section-header">
        <div class="section-title-wrap">
          <span class="section-icon">🔥</span>
          <h2>Más populares</h2>
        </div>
        <a href="#/explorar" class="link-more">Ver todos →</a>
      </div>
      <div class="grid-cards">
        ${featured?.map(i => contentCardHTML(i)).join('') || '<p class="empty">Aún no hay contenido aprobado.</p>'}
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="cta-inner">
        <h2>¿Tienes una radio, TV o podcast?</h2>
        <p>Agrega tu estación al directorio gratis. Compatible con AzuraCast, SonicPanel, ZenoFM, YouTube Live, Twitch y más.</p>
        <a href="${state.session ? '#/enviar' : '#/register'}" class="btn btn-primary btn-lg">
          Agregar mi estación gratis
        </a>
      </div>
    </section>
  `);
}

// ── TV EN VIVO ───────────────────────────────────────────────
async function renderTV() {
  setMain(loadingHTML());
  const { data, error } = await supabase.from('content').select('*')
    .eq('status','approved')
    .in('type', ['tv_en_vivo', 'tv_grabado'])
    .order('plays', { ascending: false });

  if (error) { showToast('Error al cargar TV', 'error'); return; }

  setMain(`
    <div class="page-header page-header-tv">
      <h1>📺 TV en vivo</h1>
      <p>Canales de televisión en vivo y contenido de video</p>
    </div>
    <div class="grid-cards grid-tv">
      ${data?.length ? data.map(i => contentCardHTML(i)).join('') : `
        <div class="empty-state">
          <span class="empty-icon">📺</span>
          <h3>Próximamente</h3>
          <p>Sé el primero en agregar un canal de TV.</p>
          ${state.session ? `<a href="#/enviar" class="btn btn-primary">Agregar canal</a>` : ''}
        </div>`}
    </div>
  `);
}

// ── RADIO ────────────────────────────────────────────────────
async function renderRadio() {
  setMain(loadingHTML());
  const { data, error } = await supabase.from('content').select('*')
    .eq('status','approved')
    .in('type', ['radio', 'stream_en_vivo'])
    .order('plays', { ascending: false });

  if (error) { showToast('Error al cargar Radio', 'error'); return; }

  setMain(`
    <div class="page-header">
      <h1>📻 Radio en vivo</h1>
      <p>Estaciones de radio en vivo de todo el mundo</p>
    </div>
    <div class="grid-cards">
      ${data?.length ? data.map(i => contentCardHTML(i)).join('') : `
        <div class="empty-state">
          <span class="empty-icon">📻</span>
          <h3>Sin estaciones aún</h3>
          <p>Sé el primero en agregar una estación de radio.</p>
          ${state.session ? `<a href="#/enviar" class="btn btn-primary">Agregar estación</a>` : ''}
        </div>`}
    </div>
  `);
}

// ── EXPLORAR ────────────────────────────────────────────────
let explorerPage = 0;
const PAGE_SIZE  = 12;

async function renderExplorer() {
  explorerPage = 0;
  setMain(`
    <div class="page-header">
      <h1>Explorar todo</h1>
      <p>Radio, TV, Podcasts, Música y más</p>
    </div>

    <div class="filters-bar">
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/>
        </svg>
        <input type="text" id="searchInput" placeholder="Buscar estaciones, canales, podcasts…" class="search-input" />
      </div>
      <select id="typeFilter" class="filter-select">
        <option value="">Todos los tipos</option>
        <option value="radio">📻 Radio</option>
        <option value="tv_en_vivo">📺 TV en vivo</option>
        <option value="tv_grabado">🎬 TV/Video</option>
        <option value="podcast">🎙️ Podcast</option>
        <option value="musica">🎵 Música</option>
        <option value="stream_en_vivo">🔴 Stream en vivo</option>
        <option value="otro">🎧 Otro</option>
      </select>
      <select id="panelFilter" class="filter-select">
        <option value="">Todas las plataformas</option>
        <option value="azuracast">AzuraCast</option>
        <option value="sonicpanel">SonicPanel</option>
        <option value="zenofm">ZenoFM</option>
        <option value="youtube">YouTube</option>
        <option value="twitch">Twitch</option>
        <option value="audio">Audio directo</option>
      </select>
      <select id="countryFilter" class="filter-select">
        <option value="">Todos los países</option>
        ${['MX','US','ES','AR','CO','CL','PE','VE','GT','HN','SV','CR','PA','EC','BO','PY','UY','DO','PR','CU'].map(c=>`<option value="${c}">${getFlagEmoji(c)} ${c}</option>`).join('')}
      </select>
    </div>

    <div id="contentGrid" class="grid-cards"></div>
    <div id="loadMoreWrap" class="load-more-wrap">
      <button id="loadMoreBtn" class="btn btn-ghost" style="display:none">Cargar más</button>
    </div>
    <div id="emptyState" class="empty-state" style="display:none">
      <span class="empty-icon">🔍</span>
      <h3>Sin resultados</h3>
      <p>Intenta con otros filtros.</p>
    </div>
  `);

  await fetchContent(true);

  let debounce;
  document.getElementById('searchInput').addEventListener('input', e => {
    state.filters.query = e.target.value.trim();
    clearTimeout(debounce);
    debounce = setTimeout(() => { explorerPage = 0; fetchContent(true); }, 400);
  });
  document.getElementById('typeFilter').addEventListener('change', e => {
    state.filters.type = e.target.value; explorerPage = 0; fetchContent(true);
  });
  document.getElementById('panelFilter').addEventListener('change', e => {
    state.filters.panel = e.target.value; explorerPage = 0; fetchContent(true);
  });
  document.getElementById('countryFilter').addEventListener('change', e => {
    state.filters.country = e.target.value; explorerPage = 0; fetchContent(true);
  });
  document.getElementById('loadMoreBtn').addEventListener('click', () => fetchContent(false));
}

async function fetchContent(reset = false) {
  const grid = document.getElementById('contentGrid');
  const emptyState = document.getElementById('emptyState');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (!grid) return;

  if (reset) { explorerPage = 0; grid.innerHTML = loadingHTML(); }

  let q = supabase.from('content').select('*')
    .eq('status','approved')
    .order('plays', { ascending: false })
    .range(explorerPage * PAGE_SIZE, (explorerPage + 1) * PAGE_SIZE - 1);

  if (state.filters.type)    q = q.eq('type', state.filters.type);
  if (state.filters.panel)   q = q.eq('panel_type', state.filters.panel);
  if (state.filters.country) q = q.eq('country', state.filters.country);
  if (state.filters.query)   q = q.or(`title.ilike.%${state.filters.query}%,description.ilike.%${state.filters.query}%,subtitle.ilike.%${state.filters.query}%`);

  const { data, error } = await q;
  if (error) { showToast('Error al cargar', 'error'); return; }

  if (reset) grid.innerHTML = '';

  if (!data.length && explorerPage === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'flex';
    loadMoreBtn.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  data.forEach(item => {
    const el = document.createElement('div');
    el.innerHTML = contentCardHTML(item);
    grid.appendChild(el.firstElementChild);
  });

  loadMoreBtn.style.display = data.length < PAGE_SIZE ? 'none' : 'block';
  if (data.length === PAGE_SIZE) explorerPage++;
}

// ── ENVIAR CONTENIDO ────────────────────────────────────────
function renderSubmit() {
  if (!state.session) { navigate('#/login'); return; }

  setMain(`
    <div class="form-page">
      <div class="form-card form-card-wide">
        <h1>Agregar estación o contenido</h1>
        <p class="form-subtitle">Agrega tu radio, canal de TV, podcast o cualquier contenido de audio/video.</p>

        <form id="submitForm" class="form">
          <!-- TIPO -->
          <div class="form-group">
            <label>Tipo de contenido <span class="req">*</span></label>
            <div class="type-grid" id="typeGrid">
              ${Object.entries(TYPE_META).map(([val, m]) => `
                <label class="type-option">
                  <input type="radio" name="type" value="${val}" required />
                  <div class="type-option-inner">
                    <span class="type-opt-icon">${m.icon}</span>
                    <span>${m.label}</span>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- PLATAFORMA -->
          <div class="form-group" id="panelTypeGroup">
            <label>Plataforma / Panel</label>
            <select name="panel_type" id="panelTypeSelect" class="filter-select" style="width:100%">
              <option value="generic">URL genérica / otro</option>
              <option value="audio">Audio directo (MP3, AAC, OGG)</option>
              <option value="hls">HLS Stream (.m3u8)</option>
              <option value="azuracast">AzuraCast</option>
              <option value="sonicpanel">SonicPanel</option>
              <option value="zenofm">ZenoFM</option>
              <option value="youtube">YouTube / YouTube Live</option>
              <option value="twitch">Twitch</option>
              <option value="iframe">Embed personalizado (iframe)</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:2">
              <label>Nombre / Título <span class="req">*</span></label>
              <input type="text" name="title" required minlength="3" maxlength="120"
                     placeholder="Nombre de la estación, canal o programa…" />
            </div>
            <div class="form-group">
              <label>Subtítulo / Frecuencia</label>
              <input type="text" name="subtitle" maxlength="80" placeholder="Ej: 98.5 FM, Canal 7…" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>País (código ISO)</label>
              <select name="country" class="filter-select" style="width:100%">
                <option value="">Sin especificar</option>
                ${['MX','US','ES','AR','CO','CL','PE','VE','GT','HN','SV','CR','PA','EC','BO','PY','UY','DO','PR','CU'].map(c=>`<option value="${c}">${getFlagEmoji(c)} ${c}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Ciudad</label>
              <input type="text" name="city" maxlength="60" placeholder="Ciudad de emisión…" />
            </div>
          </div>

          <div class="form-group">
            <label>Descripción</label>
            <textarea name="description" rows="3" maxlength="500"
                      placeholder="Describe tu estación o contenido…"></textarea>
          </div>

          <div class="form-group">
            <label>Género / Formato</label>
            <input type="text" name="genre" maxlength="60" placeholder="Pop, Noticias, Deportes, Variado…" />
          </div>

          <div class="form-group">
            <label>URL externa (sitio web o página) <span class="req">*</span></label>
            <input type="url" name="external_url" required
                   placeholder="https://miradio.com" />
          </div>

          <div class="form-group" id="streamUrlGroup">
            <label>URL de stream directo</label>
            <input type="url" name="stream_url"
                   placeholder="https://stream.miradio.com/live.mp3" />
            <span class="field-hint">MP3, AAC, OGG, M3U8, RTMP, etc.</span>
          </div>

          <div class="form-group" id="embedUrlGroup">
            <label>URL del panel / embed</label>
            <input type="url" name="embed_url"
                   placeholder="https://azuracast.miradio.com/public/mi-estacion" />
            <span class="field-hint">URL del panel de AzuraCast, ZenoFM, widget de YouTube, etc.</span>
          </div>

          <div class="form-group">
            <label>URL de portada / logo</label>
            <input type="url" name="cover_url" placeholder="https://…/logo.jpg" />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" style="width:100%">Enviar para revisión</button>
          </div>
        </form>
      </div>
    </div>
  `);

  document.getElementById('submitForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd);
    payload.user_id = state.session.user.id;
    payload.status = 'pending';
    payload.plays  = 0;

    // Clean up empty strings
    Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });

    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true; btn.textContent = 'Enviando…';

    const { error } = await supabase.from('content').insert(payload);
    if (error) {
      showToast('Error al enviar: ' + error.message, 'error');
      btn.disabled = false; btn.textContent = 'Enviar para revisión';
    } else {
      showToast('¡Enviado! Tu contenido está en revisión.');
      navigate('#/mis-envios');
    }
  });
}

// ── MIS ENVIOS ──────────────────────────────────────────────
async function renderMine() {
  if (!state.session) { navigate('#/login'); return; }
  setMain(loadingHTML());

  const { data, error } = await supabase.from('content').select('*')
    .eq('user_id', state.session.user.id)
    .order('created_at', { ascending: false });

  if (error) { showToast('Error', 'error'); return; }

  setMain(`
    <div class="page-header">
      <h1>Mis envíos</h1>
      <p>${data?.length || 0} contenidos enviados</p>
    </div>
    ${!data?.length
      ? `<div class="empty-state"><span class="empty-icon">📭</span><h3>Sin envíos aún</h3><p>¡Comparte tu radio, TV o podcast!</p><a href="#/enviar" class="btn btn-primary">Agregar contenido</a></div>`
      : `<div class="table-wrap">
           <table class="data-table">
             <thead><tr>
               <th>Título</th><th>Tipo</th><th>Plataforma</th><th>Estado</th><th>Plays</th><th>Fecha</th>
             </tr></thead>
             <tbody>
               ${data.map(item => `
                 <tr>
                   <td>${escapeHTML(item.title)}</td>
                   <td>${TYPE_META[item.type]?.icon || ''} ${TYPE_META[item.type]?.label || item.type}</td>
                   <td>${PANEL_LABELS[item.panel_type] || item.panel_type || '—'}</td>
                   <td><span class="status-badge status-${item.status}">${item.status}</span>
                       ${item.reject_reason ? `<div class="reject-reason">${escapeHTML(item.reject_reason)}</div>` : ''}</td>
                   <td>${item.plays || 0}</td>
                   <td>${new Date(item.created_at).toLocaleDateString()}</td>
                 </tr>
               `).join('')}
             </tbody>
           </table>
         </div>`
    }
  `);
}

// ── ADMIN ────────────────────────────────────────────────────
async function renderAdmin() {
  if (state.profile?.role !== 'admin') {
    setMain('<div class="empty-state"><h3>Acceso denegado</h3></div>');
    return;
  }
  setMain(loadingHTML());

  const [
    { data: pending },
    { data: approved },
    { data: rejected },
    { data: all },
  ] = await Promise.all([
    supabase.from('content').select('*').eq('status','pending').order('created_at',{ascending:false}),
    supabase.from('content').select('*').eq('status','approved').order('plays',{ascending:false}).limit(20),
    supabase.from('content').select('*').eq('status','rejected').order('created_at',{ascending:false}).limit(10),
    supabase.from('content').select('*').order('created_at',{ascending:false}).limit(50),
  ]);

  setMain(`
    <div class="page-header">
      <h1>Panel Admin</h1>
      <p>Gestión de contenido de LibreAudio PRO</p>
    </div>
    <div class="admin-panel">
      <div class="stats-row">
        <div class="stat-card stat-pending"><span class="stat-num">${pending?.length||0}</span><span class="stat-label">Pendientes</span></div>
        <div class="stat-card stat-approved"><span class="stat-num">${approved?.length||0}</span><span class="stat-label">Aprobados</span></div>
        <div class="stat-card stat-rejected"><span class="stat-num">${rejected?.length||0}</span><span class="stat-label">Rechazados</span></div>
        <div class="stat-card"><span class="stat-num">${all?.length||0}</span><span class="stat-label">Total</span></div>
      </div>

      <!-- PENDIENTES -->
      <h2 style="margin-bottom:1rem">🕐 Pendientes de revisión</h2>
      ${!pending?.length
        ? '<p class="empty">No hay contenido pendiente.</p>'
        : `<div class="admin-cards">
             ${pending.map(item => `
               <div class="admin-card">
                 <div class="admin-card-head">
                   <span>${TYPE_META[item.type]?.icon||''} ${TYPE_META[item.type]?.label||item.type}</span>
                   <span>·</span>
                   <span>${PANEL_LABELS[item.panel_type]||item.panel_type||'—'}</span>
                   ${item.country ? `<span>· ${getFlagEmoji(item.country)} ${item.country}</span>` : ''}
                 </div>
                 <h3>${escapeHTML(item.title)}</h3>
                 ${item.subtitle ? `<p style="font-size:.85rem;color:var(--text2)">${escapeHTML(item.subtitle)}</p>` : ''}
                 ${item.description ? `<p style="font-size:.82rem;color:var(--text3);margin:.4rem 0">${escapeHTML(item.description.slice(0,120))}…</p>` : ''}
                 <a href="${item.external_url}" target="_blank" class="ext-link">🔗 ${escapeHTML(item.external_url)}</a>
                 ${item.stream_url ? `<a href="${item.stream_url}" target="_blank" class="ext-link">🎵 ${escapeHTML(item.stream_url)}</a>` : ''}
                 <div class="admin-actions">
                   <button class="btn btn-success btn-sm" onclick="adminAction('approve','${item.id}')">✓ Aprobar</button>
                   <button class="btn btn-danger btn-sm" onclick="adminReject('${item.id}')">✗ Rechazar</button>
                   <button class="btn btn-ghost btn-sm" onclick="adminDelete('${item.id}')">🗑</button>
                 </div>
               </div>
             `).join('')}
           </div>`
      }

      <!-- APROBADOS -->
      <h2 style="margin:2rem 0 1rem">✅ Aprobados recientes</h2>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Título</th><th>Tipo</th><th>País</th><th>Plays</th><th>Acciones</th></tr></thead>
          <tbody>
            ${approved?.map(item => `
              <tr>
                <td>${escapeHTML(item.title)}</td>
                <td>${TYPE_META[item.type]?.icon||''} ${TYPE_META[item.type]?.label||item.type}</td>
                <td>${item.country ? getFlagEmoji(item.country)+' '+item.country : '—'}</td>
                <td>${item.plays||0}</td>
                <td>
                  <button class="btn btn-danger btn-sm" onclick="adminAction('reject','${item.id}')">Rechazar</button>
                  <button class="btn btn-ghost btn-sm" onclick="adminDelete('${item.id}')">🗑</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `);

  // Admin action handlers
  window.adminAction = async (action, id) => {
    const status = action === 'approve' ? 'approved' : 'rejected';
    const { error } = await supabase.from('content').update({ status }).eq('id', id);
    if (error) showToast('Error: ' + error.message, 'error');
    else { showToast(action === 'approve' ? 'Aprobado ✓' : 'Rechazado'); renderAdmin(); }
  };

  window.adminReject = async (id) => {
    const reason = prompt('Razón del rechazo (opcional):');
    const { error } = await supabase.from('content').update({ status: 'rejected', reject_reason: reason || null }).eq('id', id);
    if (error) showToast('Error: ' + error.message, 'error');
    else { showToast('Rechazado'); renderAdmin(); }
  };

  window.adminDelete = async (id) => {
    if (!confirm('¿Eliminar permanentemente?')) return;
    const { error } = await supabase.from('content').delete().eq('id', id);
    if (error) showToast('Error: ' + error.message, 'error');
    else { showToast('Eliminado'); renderAdmin(); }
  };
}

// ── PROFILE ──────────────────────────────────────────────────
async function renderProfile() {
  if (!state.session) { navigate('#/login'); return; }

  setMain(`
    <div class="form-page">
      <div class="form-card">
        <h1>Mi perfil</h1>
        <div class="profile-avatar-wrap">
          <img src="${state.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(state.profile?.username||'U')}&background=7C3AED&color=fff&size=128`}" class="profile-avatar" />
        </div>
        <form id="profileForm" class="form">
          <div class="form-group">
            <label>Nombre de usuario</label>
            <input type="text" name="username" value="${escapeHTML(state.profile?.username||'')}" maxlength="30" />
          </div>
          <div class="form-group">
            <label>Bio</label>
            <textarea name="bio" rows="3" maxlength="200">${escapeHTML(state.profile?.bio||'')}</textarea>
          </div>
          <div class="form-group">
            <label>URL de avatar</label>
            <input type="url" name="avatar_url" value="${escapeHTML(state.profile?.avatar_url||'')}" placeholder="https://…/avatar.jpg" />
          </div>
          <button type="submit" class="btn btn-primary">Guardar cambios</button>
        </form>
        <div style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--border);">
          <p style="font-size:.85rem;color:var(--text2);">Email: ${escapeHTML(state.session.user.email)}</p>
        </div>
      </div>
    </div>
  `);

  document.getElementById('profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updates = Object.fromEntries(fd);
    Object.keys(updates).forEach(k => { if (updates[k] === '') delete updates[k]; });
    const { error } = await supabase.from('profiles').update(updates).eq('id', state.session.user.id);
    if (error) showToast('Error: ' + error.message, 'error');
    else { await loadProfile(); showToast('Perfil actualizado ✓'); }
  });
}

// ── AUTH PAGES ───────────────────────────────────────────────
function renderLogin() {
  if (state.session) { navigate('#/'); return; }
  setMain(`
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="url(#lg2)"/>
            <defs><linearGradient id="lg2" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#7C3AED"/><stop offset="1" stop-color="#DB2777"/></linearGradient></defs>
            <path d="M10 12a6 6 0 1 1 12 0v8a6 6 0 0 1-12 0V12z" fill="white" opacity=".9"/>
            <circle cx="16" cy="16" r="3.5" fill="#7C3AED"/>
          </svg>
          <span>LibreAudio PRO</span>
        </div>
        <h1>Iniciar sesión</h1>
        <form id="loginForm" class="form">
          <div class="form-group"><label>Email</label><input type="email" name="email" required /></div>
          <div class="form-group"><label>Contraseña</label><input type="password" name="password" required /></div>
          <a href="#/recuperar" style="font-size:.82rem;color:var(--purple-light)">¿Olvidaste tu contraseña?</a>
          <button type="submit" class="btn btn-primary" style="width:100%">Entrar</button>
        </form>
        <div class="auth-switch">¿No tienes cuenta? <a href="#/register">Regístrate</a></div>
      </div>
    </div>
  `);
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const { email, password } = Object.fromEntries(new FormData(e.target));
    const btn = e.target.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Entrando…';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { showToast(error.message, 'error'); btn.disabled = false; btn.textContent = 'Entrar'; }
  });
}

function renderRegister() {
  if (state.session) { navigate('#/'); return; }
  setMain(`
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="url(#lg3)"/>
            <defs><linearGradient id="lg3" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#7C3AED"/><stop offset="1" stop-color="#DB2777"/></linearGradient></defs>
            <path d="M10 12a6 6 0 1 1 12 0v8a6 6 0 0 1-12 0V12z" fill="white" opacity=".9"/>
            <circle cx="16" cy="16" r="3.5" fill="#7C3AED"/>
          </svg>
          <span>LibreAudio PRO</span>
        </div>
        <h1>Crear cuenta</h1>
        <form id="registerForm" class="form">
          <div class="form-group"><label>Nombre de usuario</label><input type="text" name="username" required minlength="3" maxlength="30" /></div>
          <div class="form-group"><label>Email</label><input type="email" name="email" required /></div>
          <div class="form-group"><label>Contraseña</label><input type="password" name="password" required minlength="6" /></div>
          <button type="submit" class="btn btn-primary" style="width:100%">Crear cuenta</button>
        </form>
        <div class="auth-switch">¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></div>
      </div>
    </div>
  `);
  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(fd);
    const btn = e.target.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Creando…';
    const { data, error } = await supabase.auth.signUp({ email, password,
      options: { data: { username } }
    });
    if (error) { showToast(error.message, 'error'); btn.disabled = false; btn.textContent = 'Crear cuenta'; }
    else {
      // Create profile
      if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, username, email });
      }
      showToast('¡Cuenta creada! Revisa tu email para confirmar.');
      navigate('#/login');
    }
  });
}

function renderForgotPassword() {
  setMain(`
    <div class="auth-page">
      <div class="auth-card">
        <h1>Recuperar contraseña</h1>
        <form id="forgotForm" class="form">
          <div class="form-group"><label>Email</label><input type="email" name="email" required /></div>
          <button type="submit" class="btn btn-primary" style="width:100%">Enviar enlace</button>
        </form>
        <div class="auth-switch"><a href="#/login">← Volver al login</a></div>
      </div>
    </div>
  `);
  document.getElementById('forgotForm').addEventListener('submit', async e => {
    e.preventDefault();
    const { email } = Object.fromEntries(new FormData(e.target));
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) showToast(error.message, 'error');
    else showToast('Enlace enviado a tu email ✓');
  });
}

function renderNewPassword() {
  setMain(`
    <div class="auth-page">
      <div class="auth-card">
        <h1>Nueva contraseña</h1>
        <form id="newPwForm" class="form">
          <div class="form-group"><label>Nueva contraseña</label><input type="password" name="password" required minlength="6" /></div>
          <button type="submit" class="btn btn-primary" style="width:100%">Actualizar contraseña</button>
        </form>
      </div>
    </div>
  `);
  document.getElementById('newPwForm').addEventListener('submit', async e => {
    e.preventDefault();
    const { password } = Object.fromEntries(new FormData(e.target));
    const { error } = await supabase.auth.updateUser({ password });
    if (error) showToast(error.message, 'error');
    else { showToast('Contraseña actualizada ✓'); navigate('#/'); }
  });
}

function render404() {
  setMain(`
    <div class="empty-state" style="min-height:60vh">
      <span class="empty-icon">🔍</span>
      <h3>Página no encontrada</h3>
      <p>La ruta <code>${location.hash}</code> no existe.</p>
      <a href="#/" class="btn btn-primary">Ir al inicio</a>
    </div>
  `);
}

// ── BOOT ────────────────────────────────────────────────────
init();
