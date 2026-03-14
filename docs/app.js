// ============================================================
// LibreAudio PRO — app.js  v3.0
// Directorio de Radio · TV · Podcasts · Audio · Redes Sociales
// iHeartRadio · TuneIn · YouTube · Twitch · Dailymotion · HLS
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { TuneIn, iHeart, Dailymotion, PlayerResolver, Social, loadHlsJs, Metadata } from './integrations.js';

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
  const meta  = TYPE_META[item.type] || TYPE_META.otro;
  const badge = Social.badge(item.panelType || item.source);
  const isLive = item.type === 'tv_en_vivo' || item.type === 'stream_en_vivo';
  const pt = item.panelType || PlayerResolver.detectType(item.embedUrl || item.streamUrl || '') || 'generic';

  // Determinar la URL real de reproducción
  let playStream = item.streamUrl || '';
  let playEmbed  = item.embedUrl  || item.externalUrl || '';
  // Para Dailymotion: construir embed si no existe
  if (pt === 'dailymotion' && !playEmbed && item.id) {
    playEmbed = `https://www.dailymotion.com/embed/video/${item.id}?autoplay=1`;
  }
  if (!playEmbed && playStream) {
    playEmbed = PlayerResolver.buildEmbed(playStream, pt, true) || playStream;
  }

  const openUrl = item.externalUrl || item.embedUrl || '';

  // Encode for data-attributes (JSON safe)
  const dataObj = JSON.stringify({
    id: `ext-${item.id}`,
    title: item.title || '',
    subtitle: item.subtitle || '',
    cover: item.cover || '',
    streamUrl: playStream,
    panelType: pt,
    embedUrl: playEmbed,
  });

  return `
    <article class="card card-external ${isLive?'card-live':''}" data-play='${dataObj.replace(/'/g,"&apos;")}'>
      <div class="card-cover" style="${item.cover?`background-image:url('${encodeURI(item.cover)}')`:`background:linear-gradient(135deg,${meta.color}22,${meta.color}44)`}">
        ${!item.cover?`<span class="card-icon">${badge.icon}</span>`:''}
        <div class="card-cover-badges">
          <span class="card-type-badge" style="background:${badge.color}22;border-color:${badge.color}44">${badge.label}</span>
          ${isLive?'<span class="live-pill">● EN VIVO</span>':''}
        </div>
        <button class="play-btn" onclick="playExternal(event,this)" aria-label="Reproducir">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
      <div class="card-body">
        <div class="card-meta-row">
          ${item.country?`<span class="country-badge">${getFlagEmoji(item.country)} ${item.country}</span>`:''}
          <span class="panel-badge" style="border-color:${badge.color}44;color:${badge.color}">${badge.label}</span>
        </div>
        <h3 class="card-title">${escapeHTML(item.title)}</h3>
        ${item.subtitle?`<p class="card-subtitle">${escapeHTML(item.subtitle.substring(0,80))}</p>`:''}
        ${item.genre?`<span class="card-genre">${escapeHTML(item.genre)}</span>`:''}
        ${item.nowPlaying?`<div class="now-playing"><span class="np-dot"></span><span class="np-text">${escapeHTML(item.nowPlaying)}</span></div>`:''}
        <div class="card-footer">
          <span class="ext-source-tag">${badge.icon} ${badge.label}</span>
          ${openUrl?`<a href="${openUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-ghost">Abrir</a>`:''}
        </div>
      </div>
    </article>`;
}

// Helper para reproducir tarjetas externas (lee data-play del article padre)
window.playExternal = function(e, btn) {
  e?.stopPropagation();
  const article = btn.closest('[data-play]');
  if (!article) return;
  try {
    const d = JSON.parse(article.dataset.play.replace(/&apos;/g,"'"));
    window.playItem(e, d.id, d.title, d.subtitle, d.cover, d.streamUrl, d.panelType, d.embedUrl);
  } catch(err) { console.warn('playExternal parse error', err); }
};

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
      <p>Busca en millones de estaciones y canales vía iHeartRadio, TuneIn y Dailymotion</p>
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

    <div id="discoverResults">${loadingHTML('Cargando contenido popular…')}</div>
  `);

  let activeTab = 'tunein';
  let debounce;

  // Tab switching
  document.querySelectorAll('.dtab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dtab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      const q = document.getElementById('discoverSearch')?.value.trim();
      if (q) doSearch(q, activeTab);
      else loadDefault(activeTab);
    });
  });

  document.getElementById('discoverSearch').addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = e.target.value.trim();
      if (q.length >= 2) doSearch(q, activeTab);
      else if (q === '') loadDefault(activeTab);
    }, 500);
  });

  document.getElementById('discoverBtn').addEventListener('click', () => {
    const q = document.getElementById('discoverSearch').value.trim();
    if (q) doSearch(q, activeTab);
    else loadDefault(activeTab);
  });

  document.getElementById('discoverSearch').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      if (q) doSearch(q, activeTab); else loadDefault(activeTab);
    }
  });

  // Iniciar con TuneIn
  loadDefault('tunein');

  async function loadDefault(tab) {
    const res = document.getElementById('discoverResults');
    if (!res) return;
    res.innerHTML = loadingHTML(tab === 'dailymotion' ? 'Cargando videos populares…' : 'Cargando estaciones populares…');
    try {
      let items = [];
      if (tab === 'tunein') {
        items = await TuneIn.browse('r0');
        // fallback si el proxy falla
        if (!items.length) items = await TuneIn.search('radio');
      } else if (tab === 'iheart') {
        items = await iHeart.search('pop');
        if (!items.length) items = await iHeart.getFeatured('MX');
      } else if (tab === 'dailymotion') {
        // Videos populares (no solo live — hay pocos live en DM)
        items = await Dailymotion.getPopular(12);
        if (!items.length) items = await Dailymotion.search('noticias', 12);
      }
      renderDiscoverResults(items, res);
    } catch (e) {
      res.innerHTML = `<div class="empty-state"><span class="empty-icon">❌</span><h3>Error al cargar</h3><p>${e.message||'Intenta de nuevo'}</p><button class="btn btn-primary" onclick="document.getElementById('discoverBtn').click()">Reintentar</button></div>`;
    }
  }

  async function doSearch(query, tab) {
    const res = document.getElementById('discoverResults');
    if (!res) return;
    const names = { tunein:'TuneIn', iheart:'iHeartRadio', dailymotion:'Dailymotion' };
    res.innerHTML = loadingHTML(`Buscando en ${names[tab]}…`);
    try {
      let items = [];
      if (tab === 'tunein')           items = await TuneIn.search(query);
      else if (tab === 'iheart')      items = await iHeart.search(query);
      else if (tab === 'dailymotion') items = await Dailymotion.search(query, 12);
      renderDiscoverResults(items, res);
    } catch(e) {
      res.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><h3>Sin resultados</h3><p>${e.message||'Intenta con otra búsqueda.'}</p></div>`;
    }
  }

  function renderDiscoverResults(items, container) {
    if (!items || !items.length) {
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

// ── EXPLORAR ─────────────────────────────────────────────────
async function renderExplorer() {
  setMain(loadingHTML());
  const { data, error } = await supabase.from('content').select('*')
    .eq('status','approved').order('plays',{ascending:false});
  if (error) { showToast('Error al cargar','error'); return; }

  const types   = [...new Set(data.map(d=>d.type).filter(Boolean))];
  const genres  = [...new Set(data.map(d=>d.genre).filter(Boolean))].sort();
  const countries = [...new Set(data.map(d=>d.country).filter(Boolean))].sort();

  const f = state.filters;

  const filtered = data.filter(item =>
    (!f.type    || item.type    === f.type) &&
    (!f.genre   || item.genre   === f.genre) &&
    (!f.country || item.country === f.country) &&
    (!f.query   || item.title.toLowerCase().includes(f.query.toLowerCase()) ||
                   item.subtitle?.toLowerCase().includes(f.query.toLowerCase()))
  );

  setMain(`
    <div class="page-header">
      <h1>Explorar directorio</h1>
      <p>${data.length} contenidos aprobados</p>
    </div>

    <div class="filters-bar">
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/>
        </svg>
        <input type="text" id="searchInput" placeholder="Buscar…" class="search-input" value="${escapeHTML(f.query)}"/>
      </div>
      <select id="typeFilter" class="filter-select">
        <option value="">Todos los tipos</option>
        ${types.map(t=>`<option value="${t}" ${f.type===t?'selected':''}>${TYPE_META[t]?.label||t}</option>`).join('')}
      </select>
      <select id="genreFilter" class="filter-select">
        <option value="">Todos los géneros</option>
        ${genres.map(g=>`<option value="${g}" ${f.genre===g?'selected':''}>${g}</option>`).join('')}
      </select>
      <select id="countryFilter" class="filter-select">
        <option value="">Todos los países</option>
        ${countries.map(c=>`<option value="${c}" ${f.country===c?'selected':''}>${getFlagEmoji(c)} ${c}</option>`).join('')}
      </select>
    </div>

    <div class="grid-cards" id="cardsGrid">
      ${filtered.length
        ? filtered.map(contentCardHTML).join('')
        : `<div class="empty-state"><span class="empty-icon">🔍</span><h3>Sin resultados</h3><p>Intenta con otros filtros.</p></div>`}
    </div>
  `);

  const applyFilters = () => {
    f.query   = document.getElementById('searchInput').value.trim();
    f.type    = document.getElementById('typeFilter').value;
    f.genre   = document.getElementById('genreFilter').value;
    f.country = document.getElementById('countryFilter').value;
    renderExplorer();
  };

  document.getElementById('searchInput').addEventListener('input',  applyFilters);
  document.getElementById('typeFilter').addEventListener('change',  applyFilters);
  document.getElementById('genreFilter').addEventListener('change', applyFilters);
  document.getElementById('countryFilter').addEventListener('change', applyFilters);
}

// ── SUBMIT ───────────────────────────────────────────────────
async function renderSubmit() {
  if (!state.session) { navigate('#/login'); return; }

  // Providers list for panel_type selector
  const PROVIDERS = [
    { id: 'audio',       icon: '🔊', label: 'Audio directo' },
    { id: 'hls',         icon: '📡', label: 'HLS / M3U8' },
    { id: 'youtube',     icon: '▶️',  label: 'YouTube' },
    { id: 'twitch',      icon: '🟣', label: 'Twitch' },
    { id: 'facebook',    icon: '🔵', label: 'Facebook Live' },
    { id: 'instagram',   icon: '📸', label: 'Instagram Live' },
    { id: 'tiktok',      icon: '🎵', label: 'TikTok Live' },
    { id: 'kick',        icon: '🟢', label: 'Kick' },
    { id: 'rumble',      icon: '🔴', label: 'Rumble' },
    { id: 'dailymotion', icon: '🔵', label: 'Dailymotion' },
    { id: 'iheart',      icon: '❤️', label: 'iHeartRadio' },
    { id: 'tunein',      icon: '📻', label: 'TuneIn' },
    { id: 'azuracast',   icon: '⚡', label: 'AzuraCast' },
    { id: 'sonicpanel',  icon: '🎚️', label: 'SonicPanel' },
    { id: 'zenofm',      icon: '🎶', label: 'ZenoFM' },
    { id: 'iframe',      icon: '🖼️', label: 'iFrame embed' },
    { id: 'generic',     icon: '🌐', label: 'Otro / genérico' },
  ];

  setMain(`
    <div class="form-page">
      <div class="form-card form-card-wide">
        <h1>Enviar contenido</h1>
        <p class="form-subtitle">Agrega tu radio, TV, podcast o stream al directorio</p>
        <form id="submitForm" class="form">

          <div class="form-group">
            <label>Tipo de contenido <span class="req">*</span></label>
            <div class="type-grid">
              ${Object.entries(TYPE_META).map(([k,v])=>`
                <label class="type-option">
                  <input type="radio" name="type" value="${k}" ${k==='radio'?'checked':''}>
                  <div class="type-option-inner">
                    <span class="type-opt-icon">${v.icon}</span>
                    <span>${v.label}</span>
                  </div>
                </label>`).join('')}
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Título <span class="req">*</span></label>
              <input type="text" name="title" placeholder="Nombre de la estación…" required maxlength="120">
            </div>
            <div class="form-group">
              <label>Subtítulo / Descripción</label>
              <input type="text" name="subtitle" placeholder="Slogan, descripción breve…" maxlength="200">
            </div>
          </div>

          <div class="form-group">
            <label>Proveedor / Panel <span class="req">*</span></label>
            <div class="provider-grid">
              ${PROVIDERS.map(p=>`
                <label class="provider-option">
                  <input type="radio" name="panel_type" value="${p.id}" ${p.id==='audio'?'checked':''}>
                  <div class="provider-option-inner">
                    <span class="provider-icon">${p.icon}</span>
                    <span class="provider-label">${p.label}</span>
                  </div>
                </label>`).join('')}
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>URL de stream / embed <span class="req">*</span></label>
              <input type="url" name="stream_url" placeholder="https://…" required>
              <span class="field-hint">URL de audio directo, iframe, playlist HLS…</span>
            </div>
            <div class="form-group">
              <label>URL externa (web pública)</label>
              <input type="url" name="external_url" placeholder="https://…">
              <span class="field-hint">Sitio web o perfil de la emisora</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Portada (URL de imagen)</label>
              <input type="url" name="cover_url" placeholder="https://…/imagen.jpg">
            </div>
            <div class="form-group">
              <label>Embed URL (opcional)</label>
              <input type="url" name="embed_url" placeholder="https://…">
              <span class="field-hint">Si el proveedor usa URL de embed diferente</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>País</label>
              <select name="country">
                <option value="">-- Seleccionar --</option>
                ${['MX','US','ES','AR','CO','CL','PE','VE','EC','GT','HN','SV','CR','DO','CU','BO','PY','UY','PA','NI','PR','BR','PT','FR','DE','IT','GB','CA','JP','KR','AU'].map(c=>`<option value="${c}">${getFlagEmoji(c)} ${c}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Género / Categoría</label>
              <input type="text" name="genre" placeholder="Noticias, Música, Deportes…" maxlength="60">
            </div>
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
    const payload = {
      user_id:      state.session.user.id,
      type:         fd.get('type'),
      title:        fd.get('title').trim(),
      subtitle:     fd.get('subtitle').trim() || null,
      panel_type:   fd.get('panel_type'),
      stream_url:   fd.get('stream_url').trim(),
      external_url: fd.get('external_url').trim() || null,
      cover_url:    fd.get('cover_url').trim()    || null,
      embed_url:    fd.get('embed_url').trim()    || null,
      country:      fd.get('country')             || null,
      genre:        fd.get('genre').trim()        || null,
      status:       'pending',
    };

    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true; btn.textContent = 'Enviando…';

    const { error } = await supabase.from('content').insert(payload);
    if (error) {
      showToast('Error: ' + error.message, 'error');
      btn.disabled = false; btn.textContent = 'Enviar para revisión';
    } else {
      showToast('¡Enviado! Revisaremos tu contenido pronto.');
      navigate('#/mis-envios');
    }
  });
}

// ── MIS ENVÍOS ───────────────────────────────────────────────
async function renderMine() {
  if (!state.session) { navigate('#/login'); return; }
  setMain(loadingHTML());
  const { data, error } = await supabase.from('content').select('*')
    .eq('user_id', state.session.user.id).order('created_at', {ascending:false});
  if (error) { showToast('Error','error'); return; }

  setMain(`
    <div class="page-header"><h1>Mis envíos</h1></div>
    ${ !data.length
      ? `<div class="empty-state"><span class="empty-icon">📭</span><h3>Aún no has enviado nada</h3><a href="#/enviar" class="btn btn-primary">Enviar contenido</a></div>`
      : `<div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Título</th><th>Tipo</th><th>Estado</th><th>Plays</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              ${data.map(item=>`
                <tr>
                  <td>${escapeHTML(item.title)}</td>
                  <td>${TYPE_META[item.type]?.icon||''} ${TYPE_META[item.type]?.label||item.type}</td>
                  <td><span class="status-badge status-${item.status}">${item.status}</span>
                    ${item.reject_reason?`<div class="reject-reason">${escapeHTML(item.reject_reason)}</div>`:''}
                  </td>
                  <td>${item.plays||0}</td>
                  <td>
                    <button class="btn btn-sm btn-danger" onclick="window.deleteItem('${item.id}')">Eliminar</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`}
  `);
}

window.deleteItem = async (id) => {
  if (!confirm('¿Eliminar este envío?')) return;
  const { error } = await supabase.from('content').delete().eq('id', id).eq('user_id', state.session.user.id);
  if (error) showToast('Error al eliminar','error');
  else { showToast('Eliminado'); renderMine(); }
};

// ── ADMIN ─────────────────────────────────────────────────────
async function renderAdmin() {
  if (state.profile?.role !== 'admin') { navigate('#/'); return; }
  setMain(loadingHTML());

  const [{ data: pending }, { data: all }] = await Promise.all([
    supabase.from('content').select('*').eq('status','pending').order('created_at',{ascending:true}),
    supabase.from('content').select('*').order('created_at',{ascending:false}),
  ]);

  const counts = { pending:0, approved:0, rejected:0 };
  all?.forEach(r => { if (counts[r.status]!==undefined) counts[r.status]++; });

  setMain(`
    <div class="admin-panel">
      <div class="page-header"><h1>Panel de administración</h1></div>

      <div class="stats-row">
        <div class="stat-card stat-pending"><span class="stat-num">${counts.pending}</span><span class="stat-label">Pendientes</span></div>
        <div class="stat-card stat-approved"><span class="stat-num">${counts.approved}</span><span class="stat-label">Aprobados</span></div>
        <div class="stat-card stat-rejected"><span class="stat-num">${counts.rejected}</span><span class="stat-label">Rechazados</span></div>
        <div class="stat-card"><span class="stat-num">${all?.length||0}</span><span class="stat-label">Total</span></div>
      </div>

      <h2 style="margin-bottom:1rem">Pendientes de revisión</h2>
      ${ !pending?.length
        ? `<div class="empty-state"><span class="empty-icon">✅</span><h3>Todo al día</h3></div>`
        : `<div class="admin-cards">${pending.map(adminCardHTML).join('')}</div>`}

      <h2 style="margin:2rem 0 1rem">Todos los contenidos</h2>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Título</th><th>Tipo</th><th>Usuario</th><th>Estado</th><th>Plays</th><th>Acciones</th></tr></thead>
          <tbody>
            ${all?.map(item=>`
              <tr>
                <td>${escapeHTML(item.title)}</td>
                <td>${TYPE_META[item.type]?.icon||''} ${item.type}</td>
                <td style="font-size:.75rem;color:var(--text3)">${item.user_id?.slice(0,8)}…</td>
                <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                <td>${item.plays||0}</td>
                <td style="display:flex;gap:.3rem;flex-wrap:wrap">
                  ${item.status!=='approved'?`<button class="btn btn-sm btn-success" onclick="window.adminAction('${item.id}','approve')">Aprobar</button>`:''}
                  ${item.status!=='rejected'?`<button class="btn btn-sm btn-danger"  onclick="window.adminAction('${item.id}','reject')">Rechazar</button>`:''}
                  <button class="btn btn-sm" onclick="window.adminAction('${item.id}','delete')" style="background:var(--surface2)">🗑</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `);
}

function adminCardHTML(item) {
  const pt = item.panel_type || 'generic';
  const url = item.stream_url || item.external_url || item.embed_url || '';
  return `
    <div class="admin-card">
      <div class="admin-card-head">
        <span>${TYPE_META[item.type]?.icon||'?'} ${item.type}</span>
        <span>${PANEL_LABELS[pt]||pt}</span>
        ${item.country?`<span>${getFlagEmoji(item.country)} ${item.country}</span>`:''}
      </div>
      <h3>${escapeHTML(item.title)}</h3>
      ${item.subtitle?`<p style="font-size:.8rem;color:var(--text2)">${escapeHTML(item.subtitle)}</p>`:''}
      ${url?`<a href="${url}" target="_blank" rel="noopener" class="ext-link">${url}</a>`:''}
      <div class="admin-actions">
        <button class="btn btn-sm btn-success" onclick="window.adminAction('${item.id}','approve')">✓ Aprobar</button>
        <button class="btn btn-sm btn-danger"  onclick="window.adminAction('${item.id}','reject')">✗ Rechazar</button>
        <button class="btn btn-sm" onclick="window.adminAction('${item.id}','delete')" style="background:var(--surface2)">🗑</button>
      </div>
    </div>`;
}

window.adminAction = async (id, action) => {
  if (action === 'delete' && !confirm('¿Eliminar permanentemente?')) return;
  let op;
  if (action === 'approve') op = supabase.from('content').update({ status:'approved', reject_reason:null }).eq('id',id);
  else if (action === 'reject') {
    const reason = prompt('Motivo del rechazo (opcional):') || '';
    op = supabase.from('content').update({ status:'rejected', reject_reason:reason||null }).eq('id',id);
  } else {
    op = supabase.from('content').delete().eq('id',id);
  }
  const { error } = await op;
  if (error) showToast('Error: '+error.message,'error');
  else { showToast('Acción realizada'); renderAdmin(); }
};

// ── PROFILE ───────────────────────────────────────────────────
async function renderProfile() {
  if (!state.session) { navigate('#/login'); return; }
  setMain(`
    <div class="form-page">
      <div class="form-card">
        <h1>Mi perfil</h1>
        <div class="profile-avatar-wrap">
          <img class="profile-avatar"
            src="${state.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(state.profile?.username||'U')}&background=7C3AED&color=fff&size=96`}"
            alt="Avatar"/>
        </div>
        <form id="profileForm" class="form">
          <div class="form-group">
            <label>Nombre de usuario</label>
            <input type="text" name="username" value="${escapeHTML(state.profile?.username||'')}" maxlength="40">
          </div>
          <div class="form-group">
            <label>URL de avatar</label>
            <input type="url" name="avatar_url" value="${escapeHTML(state.profile?.avatar_url||'')}" placeholder="https://…">
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" style="width:100%">Guardar cambios</button>
          </div>
        </form>
      </div>
    </div>
  `);

  document.getElementById('profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('profiles').update({
      username:   fd.get('username').trim() || null,
      avatar_url: fd.get('avatar_url').trim() || null,
    }).eq('id', state.session.user.id);
    if (error) showToast('Error: '+error.message,'error');
    else { showToast('Perfil actualizado'); await loadProfile(); renderProfile(); }
  });
}

// ── AUTH PAGES ────────────────────────────────────────────────
function renderLogin() {
  setMain(`
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="url(#lg2)"/>
            <defs><linearGradient id="lg2" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#7C3AED"/><stop offset="1" stop-color="#DB2777"/></linearGradient></defs>
            <path d="M10 12a6 6 0 1 1 12 0v8a6 6 0 0 1-12 0V12z" fill="white" opacity=".9"/>
            <circle cx="16" cy="16" r="3.5" fill="#7C3AED"/>
          </svg>
          <span>LibreAudio PRO</span>
        </div>
        <h1>Iniciar sesión</h1>
        <button class="btn btn-google" id="googleBtn" style="width:100%;margin-bottom:.75rem">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continuar con Google
        </button>
        <div class="or-divider">o</div>
        <form id="loginForm" class="form">
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="tu@email.com" required>
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" name="password" placeholder="••••••••" required>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" style="width:100%">Iniciar sesión</button>
          </div>
        </form>
        <div class="auth-switch">
          <a href="#/recuperar">¿Olvidaste tu contraseña?</a> ·
          ¿No tienes cuenta? <a href="#/register">Regístrate</a>
        </div>
      </div>
    </div>
  `);

  document.getElementById('googleBtn').addEventListener('click', async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.origin }
    });
    if (error) showToast(error.message,'error');
  });

  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true; btn.textContent = 'Entrando…';
    const { error } = await supabase.auth.signInWithPassword({
      email: fd.get('email'), password: fd.get('password')
    });
    if (error) { showToast(error.message,'error'); btn.disabled=false; btn.textContent='Iniciar sesión'; }
    else navigate('#/');
  });
}

function renderRegister() {
  setMain(`
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="url(#lg3)"/>
            <defs><linearGradient id="lg3" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#7C3AED"/><stop offset="1" stop-color="#DB2777"/></linearGradient></defs>
            <path d="M10 12a6 6 0 1 1 12 0v8a6 6 0 0 1-12 0V12z" fill="white" opacity=".9"/>
            <circle cx="16" cy="16" r="3.5" fill="#7C3AED"/>
          </svg>
          <span>LibreAudio PRO</span>
        </div>
        <h1>Crear cuenta</h1>
        <button class="btn btn-google" id="googleBtnReg" style="width:100%;margin-bottom:.75rem">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Registrarse con Google
        </button>
        <div class="or-divider">o</div>
        <form id="registerForm" class="form">
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="tu@email.com" required>
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" name="password" placeholder="Mínimo 6 caracteres" required minlength="6">
          </div>
          <div class="form-group">
            <label>Nombre de usuario</label>
            <input type="text" name="username" placeholder="Tu apodo…" maxlength="40">
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" style="width:100%">Crear cuenta</button>
          </div>
        </form>
        <div class="auth-switch">¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></div>
      </div>
    </div>
  `);

  document.getElementById('googleBtnReg').addEventListener('click', async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.origin }
    });
    if (error) showToast(error.message,'error');
  });

  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true; btn.textContent = 'Creando cuenta…';
    const { error } = await supabase.auth.signUp({
      email: fd.get('email'), password: fd.get('password'),
      options: { data: { username: fd.get('username')||'' } }
    });
    if (error) { showToast(error.message,'error'); btn.disabled=false; btn.textContent='Crear cuenta'; }
    else { showToast('¡Cuenta creada! Revisa tu email para confirmar.'); navigate('#/'); }
  });
}

function renderForgotPassword() {
  setMain(`
    <div class="auth-page">
      <div class="auth-card">
        <h1>Recuperar contraseña</h1>
        <form id="forgotForm" class="form">
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="tu@email.com" required>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" style="width:100%">Enviar enlace</button>
          </div>
        </form>
        <div class="auth-switch"><a href="#/login">Volver al inicio de sesión</a></div>
      </div>
    </div>
  `);
  document.getElementById('forgotForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = new FormData(e.target).get('email');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin+'#/nueva-password' });
    if (error) showToast(error.message,'error');
    else showToast('Enlace enviado. Revisa tu email.');
  });
}

function renderNewPassword() {
  setMain(`
    <div class="auth-page">
      <div class="auth-card">
        <h1>Nueva contraseña</h1>
        <form id="newPassForm" class="form">
          <div class="form-group">
            <label>Nueva contraseña</label>
            <input type="password" name="password" placeholder="Mínimo 6 caracteres" required minlength="6">
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" style="width:100%">Actualizar contraseña</button>
          </div>
        </form>
      </div>
    </div>
  `);
  document.getElementById('newPassForm').addEventListener('submit', async e => {
    e.preventDefault();
    const password = new FormData(e.target).get('password');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) showToast(error.message,'error');
    else { showToast('Contraseña actualizada'); navigate('#/'); }
  });
}

function render404() {
  setMain(`<div class="auth-page"><div class="auth-card" style="text-align:center"><div style="font-size:4rem">🔍</div><h1>Página no encontrada</h1><a href="#/" class="btn btn-primary">Ir al inicio</a></div></div>`);
}
