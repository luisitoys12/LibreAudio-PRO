// ============================================================
// LibreAudio PRO — app.js  v3.0
// Directorio de Radio · TV · Podcasts · Audio · Redes Sociales
// iHeartRadio · TuneIn · YouTube · Twitch · Dailymotion · HLS
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { TuneIn, iHeart, Dailymotion, PlayerResolver, Social, loadHlsJs } from './integrations.js';

// ── CONFIG ──────────────────────────────────────────────────
const SUPABASE_URL  = window.SUPABASE_URL  || 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON = window.SUPABASE_ANON || 'TU_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true }
});

// ── ESTADO GLOBAL ───────────────────────────────────────────
export const state = {
  session:  null,
  profile:  null,
  currentPage: '#/',
  filters:  { type: '', query: '', genre: '', country: '' },
  player: {
    active: false, title: '', subtitle: '',
    cover: '', streamUrl: '', panelType: '',
    embedUrl: '', itemId: null,
  },
};

// ── TIPO META ───────────────────────────────────────────────
export const TYPE_META = {
  radio:          { icon: '📻', label: 'Radio',       color: '#7C3AED' },
  podcast:        { icon: '🎙️', label: 'Podcast',     color: '#2563EB' },
  musica:         { icon: '🎵', label: 'Música',       color: '#059669' },
  stream_en_vivo: { icon: '🔴', label: 'En vivo',     color: '#DC2626' },
  tv_en_vivo:     { icon: '📺', label: 'TV en vivo',  color: '#DB2777' },
  tv_grabado:     { icon: '🎬', label: 'TV/Video',    color: '#B45309' },
  otro:           { icon: '🎧', label: 'Otro',         color: '#6B7280' },
};

const PANEL_LABELS = {
  audio:'Audio directo', azuracast:'AzuraCast', sonicpanel:'SonicPanel',
  zenofm:'ZenoFM', iframe:'Embed', hls:'HLS', youtube:'YouTube',
  twitch:'Twitch', iheart:'iHeart', tunein:'TuneIn',
  dailymotion:'Dailymotion', facebook:'Facebook', instagram:'Instagram',
  tiktok:'TikTok', kick:'Kick', rumble:'Rumble', generic:'Stream',
};

// ── INIT ────────────────────────────────────────────────────
export async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  state.session = session;
  if (session) await loadProfile();

  supabase.auth.onAuthStateChange(async (_e, session) => {
    state.session = session;
    if (session) await loadProfile(); else state.profile = null;
    renderNav(); router();
  });

  window.addEventListener('popstate', router);
  router();
  initPlayer();
}

async function loadProfile() {
  const { data } = await supabase.from('profiles').select('*')
    .eq('id', state.session.user.id).single();
  state.profile = data;
}

// ── ROUTER ──────────────────────────────────────────────────
export function router() {
  const hash = location.hash || '#/';
  const routes = {
    '#/':               renderHome,
    '#/explorar':       renderExplorer,
    '#/tv':             renderTV,
    '#/radio':          renderRadio,
    '#/descubrir':      renderDiscover,
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
  renderNav(); handler();
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
            <circle cx="16" cy="16" r="16" fill="url(#navlg)"/>
            <defs><linearGradient id="navlg" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#7C3AED"/><stop offset="1" stop-color="#DB2777"/></linearGradient></defs>
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
        <a href="#/descubrir" class="${cur==='#/descubrir'?'active':''}">🔍 Descubrir</a>
        <a href="#/explorar" class="${cur==='#/explorar'?'active':''}">Explorar</a>
        ${user ? `<a href="#/enviar" class="${cur==='#/enviar'?'active':''}">+ Enviar</a>` : ''}
        ${isAdmin ? `<a href="#/admin" class="badge-admin">Admin</a>` : ''}
      </nav>
      <div class="nav-auth">
        ${user
          ? `<div class="user-menu" id="userMenu">
               <img src="${state.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(state.profile?.username||'U')}&background=7C3AED&color=fff`}" class="avatar"/>
               <span>${state.profile?.username||'Usuario'}</span>
               <div class="dropdown">
                 <a href="#/mis-envios">Mis envíos</a>
                 <a href="#/perfil">Mi perfil</a>
                 <button onclick="window.logout()">Cerrar sesión</button>
               </div>
             </div>`
          : `<a href="#/login" class="btn btn-ghost">Entrar</a>
             <a href="#/register" class="btn btn-primary">Registrarse</a>`}
      </div>
      <button class="hamburger" id="hamburger" aria-label="Menú">
        <span></span><span></span><span></span>
      </button>
    </div>`;

  document.getElementById('hamburger')?.addEventListener('click', () => nav.classList.toggle('open'));
  document.getElementById('userMenu')?.addEventListener('click', e => e.currentTarget.classList.toggle('active'));
}

window.logout = async () => { await supabase.auth.signOut(); navigate('#/'); };

// ── HELPERS ─────────────────────────────────────────────────
function setMain(html) { document.getElementById('main').innerHTML = html; }

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`; t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}

function loadingHTML(msg='Cargando…') {
  return `<div class="loading-screen"><div class="spinner"></div><p>${msg}</p></div>`;
}

function escapeHTML(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getFlagEmoji(c) {
  if (!c || c.length !== 2) return '';
  return c.toUpperCase().replace(/./g, ch => String.fromCodePoint(127397 + ch.charCodeAt(0)));
}

window.trackPlay = async (id) => { await supabase.rpc('increment_plays', { content_id: id }); };

// ── CONTENT CARD (comunidad) ─────────────────────────────────
function contentCardHTML(item) {
  const meta   = TYPE_META[item.type] || TYPE_META.otro;
  const isLive = ['stream_en_vivo','tv_en_vivo'].includes(item.type);
  const isTV   = ['tv_en_vivo','tv_grabado'].includes(item.type);

  // Determinar panelType real
  const pt = item.panel_type || PlayerResolver.detectType(item.embed_url || item.stream_url || item.external_url);
  const socialNet = Social.detectNetwork(item.embed_url || item.external_url);
  const badge = socialNet ? Social.badge(socialNet) : null;

  const encTitle    = escapeHTML(item.title);
  const encSubtitle = escapeHTML(item.subtitle||'');
  const encCover    = escapeHTML(item.cover_url||'');
  const encStream   = escapeHTML(item.stream_url||item.external_url||'');
  const encEmbed    = escapeHTML(item.embed_url||item.external_url||'');

  return `
    <article class="card ${isLive?'card-live':''} ${isTV?'card-tv':''}" data-id="${item.id}">
      <div class="card-cover" style="${item.cover_url?`background-image:url('${item.cover_url}')`:`background:linear-gradient(135deg,${meta.color}22,${meta.color}44)`}">
        ${!item.cover_url?`<span class="card-icon">${badge?badge.icon:meta.icon}</span>`:''}
        <div class="card-cover-badges">
          <span class="card-type-badge">${badge?badge.label:meta.label}</span>
          ${isLive?'<span class="live-pill">● EN VIVO</span>':''}
        </div>
        ${item.current_listeners>0?`<span class="listeners-badge">👥 ${item.current_listeners}</span>`:''}
        <button class="play-btn"
          onclick="playItem(event,'${item.id}','${encTitle}','${encSubtitle}','${encCover}','${encStream}','${pt}','${encEmbed}')"
          aria-label="Reproducir">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
      <div class="card-body">
        <div class="card-meta-row">
          ${item.country?`<span class="country-badge">${getFlagEmoji(item.country)} ${item.country}</span>`:''}
          ${pt&&PANEL_LABELS[pt]?`<span class="panel-badge">${PANEL_LABELS[pt]}</span>`:''}
        </div>
        <h3 class="card-title">${escapeHTML(item.title)}</h3>
        ${item.subtitle?`<p class="card-subtitle">${escapeHTML(item.subtitle)}</p>`:''}
        ${item.genre?`<span class="card-genre">${escapeHTML(item.genre)}</span>`:''}
        ${item.now_playing?`<div class="now-playing"><span class="np-dot"></span><span class="np-text">${escapeHTML(item.now_playing)}</span></div>`:''}
        <div class="card-footer">
          <span class="card-plays">▶ ${item.plays||0}</span>
          <a href="${item.external_url}" target="_blank" rel="noopener noreferrer"
             class="btn btn-sm btn-ghost" onclick="trackPlay('${item.id}')">
            ${isTV?'Ver':'Escuchar'}
          </a>
        </div>
      </div>
    </article>`;
}

// ── EXTERNAL CARD (iHeart / TuneIn / Dailymotion) ───────────
function externalCardHTML(item) {
  const meta = TYPE_META[item.type] || TYPE_META.otro;
  const badge = Social.badge(item.panelType || item.source);
  const isLive = item.type === 'tv_en_vivo' || item.type === 'stream_en_vivo';
  const encTitle = escapeHTML(item.title);
  const encSub   = escapeHTML(item.subtitle||'');
  const encCover = escapeHTML(item.cover||'');
  const encStream = escapeHTML(item.streamUrl||item.embedUrl||item.externalUrl||'');
  const encEmbed  = escapeHTML(item.embedUrl||item.streamUrl||item.externalUrl||'');
  const pt = item.panelType || 'generic';

  return `
    <article class="card card-external ${isLive?'card-live':''}">
      <div class="card-cover" style="${item.cover?`background-image:url('${item.cover}')`:`background:linear-gradient(135deg,${meta.color}22,${meta.color}44)`}">
        ${!item.cover?`<span class="card-icon">${badge.icon}</span>`:''}
        <div class="card-cover-badges">
          <span class="card-type-badge" style="background:${badge.color}22;border-color:${badge.color}44">${badge.label}</span>
          ${isLive?'<span class="live-pill">● EN VIVO</span>':''}
        </div>
        <button class="play-btn"
          onclick="playItem(event,'ext-${escapeHTML(item.id)}','${encTitle}','${encSub}','${encCover}','${encStream}','${pt}','${encEmbed}')"
          aria-label="Reproducir">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
      <div class="card-body">
        <div class="card-meta-row">
          ${item.country?`<span class="country-badge">${getFlagEmoji(item.country)} ${item.country}</span>`:''}
          <span class="panel-badge" style="border-color:${badge.color}44;color:${badge.color}">${badge.label}</span>
        </div>
        <h3 class="card-title">${escapeHTML(item.title)}</h3>
        ${item.subtitle?`<p class="card-subtitle">${escapeHTML(item.subtitle.substring(0,70))}</p>`:''}
        ${item.genre?`<span class="card-genre">${escapeHTML(item.genre)}</span>`:''}
        ${item.nowPlaying?`<div class="now-playing"><span class="np-dot"></span><span class="np-text">${escapeHTML(item.nowPlaying)}</span></div>`:''}
        <div class="card-footer">
          <span class="ext-source-tag">${badge.icon} ${badge.label}</span>
          ${item.externalUrl||item.embedUrl?`<a href="${item.externalUrl||item.embedUrl}" target="_blank" class="btn btn-sm btn-ghost">Abrir</a>`:''}
        </div>
      </div>
    </article>`;
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
        <div class="player-vol-wrap">
          <svg class="vol-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          <input type="range" id="pVolume" min="0" max="1" step="0.05" value="0.8" class="player-volume"/>
        </div>
      </div>
      <div id="pEmbedWrap" class="player-embed-wrap" style="display:none"></div>
    </div>`;

  document.getElementById('pVolume').addEventListener('input', e => {
    const a = document.getElementById('playerAudio');
    if (a) a.volume = e.target.value;
  });
}

window.playItem = async function(e, id, title, subtitle, cover, streamUrl, panelType, embedUrl) {
  e?.stopPropagation();
  if (id && !id.startsWith('ext-')) trackPlay(id);

  state.player = { active:true, title, subtitle, cover, streamUrl, panelType, embedUrl, itemId:id };
  document.getElementById('pTitle').textContent = title;
  document.getElementById('pSub').textContent   = subtitle || '';
  const coverEl = document.getElementById('pCover');
  coverEl.style.backgroundImage = cover ? `url('${cover}')` : '';
  coverEl.textContent = cover ? '' : (TYPE_META[panelType]?.icon || '🎵');

  document.getElementById('playerBar').classList.add('active');

  const embedWrap = document.getElementById('pEmbedWrap');
  document.getElementById('playerAudio')?.remove();

  // Para TuneIn, resolver la URL de stream primero
  if (panelType === 'tunein' && streamUrl?.includes('Tune.ashx')) {
    const resolved = await TuneIn.getStreamUrl(streamUrl);
    if (resolved) streamUrl = resolved;
  }

  // Detectar tipo automáticamente si no está definido
  if (!panelType || panelType === 'generic') {
    panelType = PlayerResolver.detectType(embedUrl || streamUrl);
  }

  const isEmbed = ['youtube','twitch','dailymotion','facebook','azuracast','sonicpanel',
                   'zenofm','iheart','tunein','iframe','kick','rumble'].includes(panelType);

  if (isEmbed) {
    const finalEmbed = embedUrl ||
      PlayerResolver.buildEmbed(streamUrl || embedUrl, panelType, true);
    embedWrap.style.display = 'block';
    embedWrap.innerHTML = PlayerResolver.iframeHTML(finalEmbed, title);
    updatePlayIcon(true);
  } else {
    // Audio directo: MP3, AAC, HLS
    embedWrap.style.display = 'none';
    embedWrap.innerHTML = '';
    const audio = document.createElement('audio');
    audio.id = 'playerAudio';
    audio.volume = parseFloat(document.getElementById('pVolume')?.value || 0.8);
    audio.style.display = 'none';
    document.body.appendChild(audio);

    if (streamUrl?.includes('.m3u8') || panelType === 'hls') {
      const Hls = await loadHlsJs().catch(() => null);
      if (Hls && Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(audio);
        hls.on(Hls.Events.MANIFEST_PARSED, () => { audio.play(); updatePlayIcon(true); });
      } else {
        audio.src = streamUrl;
        audio.play().then(() => updatePlayIcon(true)).catch(() => {});
      }
    } else {
      audio.src = streamUrl || embedUrl;
      audio.play().then(() => updatePlayIcon(true)).catch(() => {
        // Fallback: abrir en nueva pestaña
        showToast('Abriendo en nueva ventana…', 'success');
        window.open(streamUrl || embedUrl, '_blank');
      });
    }
  }
};

function updatePlayIcon(playing) {
  const icon = document.getElementById('pPlayIcon');
  if (!icon) return;
  icon.innerHTML = playing
    ? '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>'
    : '<path d="M8 5v14l11-7z"/>';
}

window.playerToggle = function() {
  const audio = document.getElementById('playerAudio');
  if (audio) {
    if (audio.paused) { audio.play(); updatePlayIcon(true); }
    else { audio.pause(); updatePlayIcon(false); }
  } else { window.playerStop(); }
};

window.playerStop = function() {
  document.getElementById('playerAudio')?.remove();
  const ew = document.getElementById('pEmbedWrap');
  if (ew) { ew.style.display='none'; ew.innerHTML=''; }
  document.getElementById('playerBar')?.classList.remove('active');
  state.player.active = false;
  updatePlayIcon(false);
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
    supabase.from('content').select('*').eq('status','approved').order('plays',{ascending:false}).limit(6),
    supabase.from('content').select('*').eq('status','approved').eq('type','tv_en_vivo').order('plays',{ascending:false}).limit(4),
    supabase.from('content').select('*').eq('status','approved').in('type',['radio','stream_en_vivo']).order('plays',{ascending:false}).limit(6),
    supabase.from('content').select('*',{count:'exact',head:true}).eq('status','approved'),
  ]);

  setMain(`
    <section class="hero-v2">
      <div class="hero-v2-content">
        <div class="hero-v2-eyebrow">🌐 Directorio libre y abierto</div>
        <h1>Radio · TV · Podcasts<br><span class="gradient-text">Todo en un solo lugar</span></h1>
        <p>Descubre estaciones de radio, TV en vivo, podcasts y audio — powered by iHeartRadio, TuneIn y la comunidad.</p>
        <div class="hero-v2-actions">
          <a href="#/radio" class="btn btn-primary btn-lg">📻 Radio en vivo</a>
          <a href="#/tv" class="btn btn-tv btn-lg">📺 TV en vivo</a>
          <a href="#/descubrir" class="btn btn-discover btn-lg">🔍 Descubrir</a>
        </div>
        <div class="hero-v2-stats">
          <div class="hstat"><strong>${total||0}</strong><span>En directorio</span></div>
          <div class="hstat"><strong>∞</strong><span>Via iHeart+TuneIn</span></div>
          <div class="hstat"><strong>100%</strong><span>Gratuito</span></div>
        </div>
      </div>
      <div class="hero-v2-visual">
        <div class="hero-screens">
          <div class="screen screen-tv"><div class="screen-inner">📺</div><span>TV EN VIVO</span></div>
          <div class="screen screen-radio"><div class="screen-inner">📻</div><span>RADIO</span></div>
          <div class="screen screen-pod"><div class="screen-inner">🎙️</div><span>PODCAST</span></div>
        </div>
      </div>
    </section>

    <section class="platforms-bar">
      <div class="platforms-inner">
        <span class="platforms-label">Potenciado por</span>
        <div class="platforms-list">
          <span class="platform-chip chip-iheart">❤️ iHeartRadio</span>
          <span class="platform-chip chip-tunein">📻 TuneIn</span>
          <span class="platform-chip">▶️ YouTube</span>
          <span class="platform-chip chip-twitch">🟣 Twitch</span>
          <span class="platform-chip chip-dm">🔵 Dailymotion</span>
          <span class="platform-chip">🔴 HLS Stream</span>
          <span class="platform-chip">⚡ AzuraCast</span>
        </div>
      </div>
    </section>

    ${liveTV?.length ? `
    <section class="section">
      <div class="section-header">
        <div class="section-title-wrap"><span class="section-icon">📺</span><h2>TV en vivo</h2><span class="live-indicator">● EN VIVO</span></div>
        <a href="#/tv" class="link-more">Ver todos →</a>
      </div>
      <div class="grid-cards grid-tv">${liveTV.map(contentCardHTML).join('')}</div>
    </section>` : ''}

    ${liveRadio?.length ? `
    <section class="section">
      <div class="section-header">
        <div class="section-title-wrap"><span class="section-icon">📻</span><h2>Radio en vivo</h2></div>
        <a href="#/radio" class="link-more">Ver todas →</a>
      </div>
      <div class="grid-cards">${liveRadio.map(contentCardHTML).join('')}</div>
    </section>` : ''}

    <section class="section">
      <div class="section-header">
        <div class="section-title-wrap"><span class="section-icon">🔥</span><h2>Más populares</h2></div>
        <a href="#/explorar" class="link-more">Ver todos →</a>
      </div>
      <div class="grid-cards">
        ${featured?.map(contentCardHTML).join('') || '<p class="empty">Aún no hay contenido aprobado.</p>'}
      </div>
    </section>

    <section class="cta-section">
      <div class="cta-inner">
        <h2>¿Tienes radio, TV o podcast?</h2>
        <p>Agrega tu estación al directorio gratis. Compatible con AzuraCast, ZenoFM, SonicPanel, YouTube Live, Twitch, HLS y más.</p>
        <a href="${state.session?'#/enviar':'#/register'}" class="btn btn-primary btn-lg">Agregar mi estación gratis</a>
      </div>
    </section>
  `);
}

// ── DESCUBRIR (iHeartRadio + TuneIn + Dailymotion) ─────────
async function renderDiscover() {
  setMain(`
    <div class="page-header">
      <h1>🔍 Descubrir</h1>
      <p>Busca en millones de estaciones vía iHeartRadio, TuneIn y Dailymotion</p>
    </div>

    <div class="discover-tabs" id="discoverTabs">
      <button class="dtab active" data-tab="tunein">📻 TuneIn</button>
      <button class="dtab" data-tab="iheart">❤️ iHeartRadio</button>
      <button class="dtab" data-tab="dailymotion">🔵 Dailymotion</button>
    </div>

    <div class="filters-bar">
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/>
        </svg>
        <input type="text" id="discoverSearch" placeholder="Buscar estaciones, canales, podcasts…" class="search-input"/>
      </div>
      <button id="discoverBtn" class="btn btn-primary">Buscar</button>
    </div>

    <div id="discoverResults"></div>
  `);

  let activeTab = 'tunein';
  let debounce;

  // Tab switching
  document.querySelectorAll('.dtab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dtab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      const q = document.getElementById('discoverSearch').value.trim();
      if (q) doSearch(q, activeTab);
      else loadDefault(activeTab);
    });
  });

  // Search
  document.getElementById('discoverSearch').addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = e.target.value.trim();
      if (q.length >= 2) doSearch(q, activeTab);
    }, 500);
  });

  document.getElementById('discoverBtn').addEventListener('click', () => {
    const q = document.getElementById('discoverSearch').value.trim();
    if (q) doSearch(q, activeTab);
  });

  // Enter key
  document.getElementById('discoverSearch').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      if (q) doSearch(q, activeTab);
    }
  });

  // Default content
  loadDefault('tunein');

  async function loadDefault(tab) {
    const res = document.getElementById('discoverResults');
    res.innerHTML = loadingHTML('Cargando estaciones populares…');
    try {
      let items = [];
      if (tab === 'tunein') {
        items = await TuneIn.browse('r0'); // root browse
      } else if (tab === 'iheart') {
        items = await iHeart.search('pop radio'); // popular
      } else if (tab === 'dailymotion') {
        items = await Dailymotion.getLive();
      }
      renderResults(items, res, tab);
    } catch (e) {
      res.innerHTML = `<div class="empty-state"><span class="empty-icon">❌</span><h3>Error al cargar</h3><p>${e.message}</p></div>`;
    }
  }

  async function doSearch(query, tab) {
    const res = document.getElementById('discoverResults');
    res.innerHTML = loadingHTML(`Buscando en ${tab === 'tunein' ? 'TuneIn' : tab === 'iheart' ? 'iHeartRadio' : 'Dailymotion'}…`);
    try {
      let items = [];
      if (tab === 'tunein')       items = await TuneIn.search(query);
      else if (tab === 'iheart')  items = await iHeart.search(query);
      else if (tab === 'dailymotion') items = await Dailymotion.search(query);
      renderResults(items, res, tab);
    } catch(e) {
      res.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><h3>Sin resultados</h3><p>${e.message}</p></div>`;
    }
  }

  function renderResults(items, container, tab) {
    if (!items.length) {
      container.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><h3>Sin resultados</h3><p>Intenta con otra búsqueda.</p></div>`;
      return;
    }
    container.innerHTML = `<div class="grid-cards">${items.map(externalCardHTML).join('')}</div>`;
  }
}

// ── TV EN VIVO ───────────────────────────────────────────────
async function renderTV() {
  setMain(loadingHTML());
  const { data, error } = await supabase.from('content').select('*')
    .eq('status','approved').in('type',['tv_en_vivo','tv_grabado']).order('plays',{ascending:false});
  if (error) { showToast('Error al cargar TV','error'); return; }
  setMain(`
    <div class="page-header page-header-tv"><h1>📺 TV en vivo</h1><p>Canales de televisión y video</p></div>
    <div class="grid-cards grid-tv">
      ${data?.length ? data.map(contentCardHTML).join('') : `
        <div class="empty-state">
          <span class="empty-icon">📺</span><h3>Próximamente</h3>
          <p>Sé el primero en agregar un canal de TV.</p>
          ${state.session?`<a href="#/enviar" class="btn btn-primary">Agregar canal</a>`:''}
        </div>`}
    </div>
  `);
}

// ── RADIO ────────────────────────────────────────────────────
async function renderRadio() {
  setMain(loadingHTML());
  const { data, error } = await supabase.from('content').select('*')
    .eq('status','approved').in('type',['radio','stream_en_vivo']).order('plays',{ascending:false});
  if (error) { showToast('Error al cargar Radio','error'); return; }
  setMain(`
    <div class="page-header"><h1>📻 Radio en vivo</h1><p>Estaciones de radio de todo el mundo</p></div>
    <div class="grid-cards">
      ${data?.length ? data.map(contentCardHTML).join('') : `
        <div class="empty-state">
          <span class="empty-icon">📻</span><h3>Sin estaciones</h3>
          <p>Sé el primero en agregar una estación.</p>
          ${state.session?`<a href="#/enviar" class="btn btn-primary">Agregar estación</a>`:''}
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
    <div class="page-header"><h1>Explorar todo</h1><p>Radio, TV, Podcasts, Música y más</p></div>
    <div class="filters-bar">
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/>
        </svg>
        <input type="text" id="searchInput" placeholder="Buscar estaciones, canales…" class="search-input"/>
      </div>
      <select id="typeFilter" class="filter-select">
        <option value="">Todos los tipos</option>
        <option value="radio">📻 Radio</option>
        <option value="tv_en_vivo">📺 TV en vivo</option>
        <option value="tv_grabado">🎬 TV/Video</option>
        <option value="podcast">🎙️ Podcast</option>
        <option value="musica">🎵 Música</option>
        <option value="stream_en_vivo">🔴 Stream</option>
        <option value="otro">🎧 Otro</option>
      </select>
      <select id="panelFilter" class="filter-select">
        <option value="">Todas las plataformas</option>
        <option value="azuracast">AzuraCast</option>
        <option value="sonicpanel">SonicPanel</option>
        <option value="zenofm">ZenoFM</option>
        <option value="youtube">YouTube</option>
        <option value="twitch">Twitch</option>
        <option value="dailymotion">Dailymotion</option>
        <option value="facebook">Facebook</option>
        <option value="kick">Kick</option>
        <option value="rumble">Rumble</option>
        <option value="iheart">iHeartRadio</option>
        <option value="tunein">TuneIn</option>
        <option value="hls">HLS Stream</option>
      </select>
      <select id="countryFilter" class="filter-select">
        <option value="">Todos los países</option>
        <option value="MX">🇲🇽 México</option>
        <option value="US">🇺🇸 Estados Unidos</option>
        <option value="ES">🇪🇸 España</option>
        <option value="AR">🇦🇷 Argentina</option>
        <option value="CO">🇨🇴 Colombia</option>
        <option value="CL">🇨🇱 Chile</option>
        <option value="VE">🇻🇪 Venezuela</option>
        <option value="PE">🇵🇪 Perú</option>
        <option value="BR">🇧🇷 Brasil</option>
      </select>
      <button id="applyFilters" class="btn btn-primary">Filtrar</button>
    </div>
    <div id="contentGrid" class="grid-cards"></div>
    <div id="loadMoreWrap" style="text-align:center;margin:2rem 0;display:none">
      <button id="loadMoreBtn" class="btn btn-ghost">Cargar más</button>
    </div>
  `);

  async function load(reset=false) {
    if (reset) explorerPage = 0;
    const grid = document.getElementById('contentGrid');
    if (explorerPage === 0) grid.innerHTML = loadingHTML();

    const q     = document.getElementById('searchInput')?.value.trim() || '';
    const type  = document.getElementById('typeFilter')?.value || '';
    const panel = document.getElementById('panelFilter')?.value || '';
    const cntry = document.getElementById('countryFilter')?.value || '';

    let query = supabase.from('content').select('*').eq('status','approved')
      .order('plays',{ascending:false}).range(explorerPage*PAGE_SIZE,(explorerPage+1)*PAGE_SIZE-1);

    if (type)  query = query.eq('type', type);
    if (panel) query = query.eq('panel_type', panel);
    if (cntry) query = query.eq('country', cntry);
    if (q)     query = query.ilike('title', `%${q}%`);

    const { data, error } = await query;
    if (error) { showToast('Error al cargar','error'); return; }

    if (explorerPage === 0) {
      grid.innerHTML = data?.length
        ? data.map(contentCardHTML).join('')
        : `<div class="empty-state"><span class="empty-icon">🔍</span><h3>Sin resultados</h3><p>Intenta con otros filtros.</p></div>`;
    } else {
      grid.insertAdjacentHTML('beforeend', data.map(contentCardHTML).join(''));
    }

    const lmw = document.getElementById('loadMoreWrap');
    lmw.style.display = data?.length === PAGE_SIZE ? 'block' : 'none';
  }

  document.getElementById('applyFilters').addEventListener('click', () => load(true));
  document.getElementById('searchInput').addEventListener('keydown', e => { if(e.key==='Enter') load(true); });
  document.getElementById('loadMoreBtn')?.addEventListener('click', () => { explorerPage++; load(); });
  load();
}

// ── ENVIAR ───────────────────────────────────────────────────
async function renderSubmit() {
  if (!state.session) { navigate('#/login'); return; }
  setMain(`
    <div class="page-header"><h1>+ Agregar contenido</h1><p>Comparte tu radio, TV, podcast o stream con la comunidad.</p></div>
    <form id="submitForm" class="form-card" autocomplete="off">
      <div class="form-group">
        <label>Tipo de contenido *</label>
        <select name="type" required class="form-select">
          <option value="">Selecciona un tipo…</option>
          <option value="radio">📻 Radio en vivo</option>
          <option value="tv_en_vivo">📺 TV en vivo</option>
          <option value="tv_grabado">🎬 TV/Video grabado</option>
          <option value="podcast">🎙️ Podcast</option>
          <option value="musica">🎵 Música</option>
          <option value="stream_en_vivo">🔴 Stream en vivo</option>
          <option value="otro">🎧 Otro</option>
        </select>
      </div>
      <div class="form-group">
        <label>Nombre / Título *</label>
        <input type="text" name="title" required maxlength="120" placeholder="Ej: Radio México 105.3" class="form-input"/>
      </div>
      <div class="form-group">
        <label>Subtítulo / Descripción</label>
        <input type="text" name="subtitle" maxlength="200" placeholder="Descripción breve" class="form-input"/>
      </div>
      <div class="form-group">
        <label>URL de stream (MP3/AAC/HLS) o URL del servicio</label>
        <input type="url" name="stream_url" placeholder="https://…" class="form-input"/>
      </div>
      <div class="form-group">
        <label>URL de embed (YouTube, Twitch, iframe, etc.)</label>
        <input type="url" name="embed_url" placeholder="https://…" class="form-input"/>
      </div>
      <div class="form-group">
        <label>URL externa (web de la estación)</label>
        <input type="url" name="external_url" placeholder="https://…" class="form-input"/>
      </div>
      <div class="form-group">
        <label>Tipo de plataforma</label>
        <select name="panel_type" class="form-select">
          <option value="">Auto-detectar</option>
          <option value="audio">Audio directo (MP3/AAC)</option>
          <option value="hls">HLS (.m3u8)</option>
          <option value="azuracast">AzuraCast</option>
          <option value="sonicpanel">SonicPanel</option>
          <option value="zenofm">ZenoFM</option>
          <option value="youtube">YouTube</option>
          <option value="twitch">Twitch</option>
          <option value="dailymotion">Dailymotion</option>
          <option value="iheart">iHeartRadio</option>
          <option value="tunein">TuneIn</option>
          <option value="facebook">Facebook</option>
          <option value="kick">Kick</option>
          <option value="rumble">Rumble</option>
          <option value="iframe">iFrame embed</option>
        </select>
      </div>
      <div class="form-group">
        <label>País</label>
        <select name="country" class="form-select">
          <option value="">Sin especificar</option>
          <option value="MX">🇲🇽 México</option>
          <option value="US">🇺🇸 Estados Unidos</option>
          <option value="ES">🇪🇸 España</option>
          <option value="AR">🇦🇷 Argentina</option>
          <option value="CO">🇨🇴 Colombia</option>
          <option value="CL">🇨🇱 Chile</option>
          <option value="VE">🇻🇪 Venezuela</option>
          <option value="PE">🇵🇪 Perú</option>
          <option value="BR">🇧🇷 Brasil</option>
          <option value="GT">🇬🇹 Guatemala</option>
          <option value="HN">🇭🇳 Honduras</option>
          <option value="SV">🇸🇻 El Salvador</option>
          <option value="NI">🇳🇮 Nicaragua</option>
          <option value="CR">🇨🇷 Costa Rica</option>
          <option value="PA">🇵🇦 Panamá</option>
          <option value="DO">🇩🇴 República Dominicana</option>
          <option value="CU">🇨🇺 Cuba</option>
          <option value="PR">🇵🇷 Puerto Rico</option>
        </select>
      </div>
      <div class="form-group">
        <label>Género</label>
        <input type="text" name="genre" maxlength="60" placeholder="Ej: Noticias, Pop, Rock…" class="form-input"/>
      </div>
      <div class="form-group">
        <label>URL de logo/portada</label>
        <input type="url" name="cover_url" placeholder="https://…" class="form-input"/>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary btn-lg">Enviar para revisión</button>
      </div>
    </form>
  `);

  document.getElementById('submitForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    // Remove empty strings
    Object.keys(payload).forEach(k => { if (!payload[k]) delete payload[k]; });
    payload.user_id = state.session.user.id;
    payload.status  = 'pending';

    const { error } = await supabase.from('content').insert(payload);
    if (error) { showToast('Error al enviar: ' + error.message, 'error'); return; }
    showToast('¡Enviado! Será revisado pronto.');
    navigate('#/mis-envios');
  });
}

// ── MIS ENVÍOS ───────────────────────────────────────────────
async function renderMine() {
  if (!state.session) { navigate('#/login'); return; }
  setMain(loadingHTML());
  const { data, error } = await supabase.from('content').select('*')
    .eq('user_id', state.session.user.id).order('created_at',{ascending:false});
  if (error) { showToast('Error','error'); return; }

  const statusBadge = s => ({
    pending:  '<span class="status-badge status-pending">⏳ Pendiente</span>',
    approved: '<span class="status-badge status-approved">✅ Aprobado</span>',
    rejected: '<span class="status-badge status-rejected">❌ Rechazado</span>',
  }[s]||s);

  setMain(`
    <div class="page-header"><h1>Mis envíos</h1></div>
    <div class="submissions-list">
      ${!data?.length ? '<div class="empty-state"><span class="empty-icon">📭</span><h3>No has enviado nada aún</h3><a href="#/enviar" class="btn btn-primary">Agregar contenido</a></div>'
        : data.map(item => `
          <div class="submission-item">
            <div class="submission-info">
              <h3>${escapeHTML(item.title)}</h3>
              <p>${escapeHTML(item.subtitle||'')}</p>
              <small>${new Date(item.created_at).toLocaleDateString()}</small>
            </div>
            <div class="submission-actions">
              ${statusBadge(item.status)}
              <button class="btn btn-sm btn-danger" onclick="deleteItem('${item.id}')">Eliminar</button>
            </div>
          </div>`).join('')}
    </div>
  `);
}

window.deleteItem = async (id) => {
  if (!confirm('¿Eliminar este contenido?')) return;
  const { error } = await supabase.from('content').delete().eq('id',id).eq('user_id',state.session.user.id);
  if (error) { showToast('Error','error'); return; }
  showToast('Eliminado'); renderMine();
};

// ── ADMIN ────────────────────────────────────────────────────
async function renderAdmin() {
  if (state.profile?.role !== 'admin') { navigate('#/'); return; }
  setMain(loadingHTML());
  const { data, error } = await supabase.from('content').select('*, profiles(username,email)')
    .order('created_at',{ascending:false});
  if (error) { showToast('Error','error'); return; }

  setMain(`
    <div class="page-header"><h1>Panel de Administración</h1></div>
    <div class="admin-filters">
      <button class="btn btn-sm" onclick="filterAdmin('all')" id="adminAll">Todos (${data.length})</button>
      <button class="btn btn-sm btn-warning" onclick="filterAdmin('pending')">⏳ Pendientes (${data.filter(x=>x.status==='pending').length})</button>
      <button class="btn btn-sm btn-success" onclick="filterAdmin('approved')">✅ Aprobados (${data.filter(x=>x.status==='approved').length})</button>
      <button class="btn btn-sm btn-danger" onclick="filterAdmin('rejected')">❌ Rechazados (${data.filter(x=>x.status==='rejected').length})</button>
    </div>
    <table class="admin-table" id="adminTable">
      <thead><tr><th>Título</th><th>Tipo</th><th>Usuario</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>
        ${data.map(item => `
          <tr data-status="${item.status}">
            <td><strong>${escapeHTML(item.title)}</strong><br><small>${escapeHTML(item.stream_url||item.embed_url||item.external_url||'')}</small></td>
            <td>${TYPE_META[item.type]?.icon||''} ${item.type}</td>
            <td>${escapeHTML(item.profiles?.username||'?')} <small>${escapeHTML(item.profiles?.email||'')}</small></td>
            <td><span class="status-badge status-${item.status}">${item.status}</span></td>
            <td class="admin-actions">
              ${item.status!=='approved'?`<button class="btn btn-xs btn-success" onclick="adminAction('${item.id}','approved')">✅</button>`:''}
              ${item.status!=='rejected'?`<button class="btn btn-xs btn-danger" onclick="adminAction('${item.id}','rejected')">❌</button>`:''}
              <button class="btn btn-xs btn-warning" onclick="adminAction('${item.id}','delete')">🗑</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>
  `);
}

window.filterAdmin = (status) => {
  document.querySelectorAll('#adminTable tbody tr').forEach(row => {
    row.style.display = status==='all' || row.dataset.status===status ? '' : 'none';
  });
};

window.adminAction = async (id, action) => {
  if (action === 'delete') {
    if (!confirm('¿Eliminar permanentemente?')) return;
    await supabase.from('content').delete().eq('id',id);
  } else {
    await supabase.from('content').update({ status: action }).eq('id',id);
  }
  showToast('Acción completada'); renderAdmin();
};

// ── PERFIL ───────────────────────────────────────────────────
async function renderProfile() {
  if (!state.session) { navigate('#/login'); return; }
  setMain(`
    <div class="page-header"><h1>Mi perfil</h1></div>
    <form id="profileForm" class="form-card">
      <div class="form-group">
        <label>Nombre de usuario</label>
        <input type="text" name="username" value="${escapeHTML(state.profile?.username||'')}" class="form-input" maxlength="50"/>
      </div>
      <div class="form-group">
        <label>Avatar URL</label>
        <input type="url" name="avatar_url" value="${escapeHTML(state.profile?.avatar_url||'')}" class="form-input"/>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Guardar cambios</button>
      </div>
    </form>
  `);

  document.getElementById('profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    const { error } = await supabase.from('profiles').update(payload).eq('id', state.session.user.id);
    if (error) { showToast('Error','error'); return; }
    await loadProfile(); showToast('Perfil actualizado');
  });
}

// ── LOGIN ────────────────────────────────────────────────────
function renderLogin() {
  setMain(`
    <div class="auth-container">
      <div class="auth-card">
        <h1>Iniciar sesión</h1>
        <form id="loginForm" class="form-card">
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" required class="form-input" autocomplete="email"/>
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" name="password" required class="form-input" autocomplete="current-password"/>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-full">Entrar</button>
          </div>
        </form>
        <p class="auth-links">
          <a href="#/recuperar">¿Olvidaste tu contraseña?</a> ·
          <a href="#/register">Registrarse</a>
        </p>
      </div>
    </div>`);

  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.auth.signInWithPassword({
      email: fd.get('email'), password: fd.get('password')
    });
    if (error) { showToast(error.message,'error'); return; }
    navigate('#/');
  });
}

// ── REGISTER ─────────────────────────────────────────────────
function renderRegister() {
  setMain(`
    <div class="auth-container">
      <div class="auth-card">
        <h1>Crear cuenta</h1>
        <form id="registerForm" class="form-card">
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" required class="form-input" autocomplete="email"/>
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" name="password" required minlength="6" class="form-input" autocomplete="new-password"/>
          </div>
          <div class="form-group">
            <label>Nombre de usuario</label>
            <input type="text" name="username" required maxlength="30" class="form-input"/>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-full">Registrarse</button>
          </div>
        </form>
        <p class="auth-links"><a href="#/login">Ya tengo cuenta</a></p>
      </div>
    </div>`);

  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { data, error } = await supabase.auth.signUp({
      email: fd.get('email'), password: fd.get('password'),
      options: { data: { username: fd.get('username') } }
    });
    if (error) { showToast(error.message,'error'); return; }
    // Create profile
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: fd.get('email'),
        username: fd.get('username'),
      });
    }
    showToast('¡Cuenta creada! Revisa tu email para confirmar.');
    navigate('#/login');
  });
}

// ── RECUPERAR CONTRASEÑA ─────────────────────────────────────
function renderForgotPassword() {
  setMain(`
    <div class="auth-container">
      <div class="auth-card">
        <h1>Recuperar contraseña</h1>
        <form id="forgotForm" class="form-card">
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" required class="form-input"/>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-full">Enviar enlace</button>
          </div>
        </form>
        <p class="auth-links"><a href="#/login">Volver al login</a></p>
      </div>
    </div>`);

  document.getElementById('forgotForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.auth.resetPasswordForEmail(fd.get('email'), {
      redirectTo: location.origin + location.pathname + '#/nueva-password'
    });
    if (error) { showToast(error.message,'error'); return; }
    showToast('¡Enlace enviado! Revisa tu email.');
  });
}

// ── NUEVA CONTRASEÑA ─────────────────────────────────────────
function renderNewPassword() {
  setMain(`
    <div class="auth-container">
      <div class="auth-card">
        <h1>Nueva contraseña</h1>
        <form id="newPassForm" class="form-card">
          <div class="form-group">
            <label>Nueva contraseña</label>
            <input type="password" name="password" required minlength="6" class="form-input"/>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-full">Actualizar contraseña</button>
          </div>
        </form>
      </div>
    </div>`);

  document.getElementById('newPassForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.auth.updateUser({ password: fd.get('password') });
    if (error) { showToast(error.message,'error'); return; }
    showToast('¡Contraseña actualizada!'); navigate('#/');
  });
}

// ── 404 ──────────────────────────────────────────────────────
function render404() {
  setMain(`<div class="empty-state"><span class="empty-icon">🔍</span><h1>Página no encontrada</h1><a href="#/" class="btn btn-primary">Ir al inicio</a></div></div>`);
}
