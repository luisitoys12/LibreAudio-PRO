// ============================================================
// LibreAudio PRO — app.js  v3.2
// Fix completo: reproductor, botones, Dailymotion, iHeart, TuneIn
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
  filters:  { type: '', query: '', panel: '', country: '' },
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

const PAGE_SIZE = 20;
let explorerPage = 0;

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
  initPlayer();
  router();
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
  if (!nav) return;
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
function setMain(html) {
  const main = document.getElementById('main');
  if (main) main.innerHTML = html;
  // Bind play buttons via event delegation after render
  setTimeout(bindPlayButtons, 0);
}

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

window.trackPlay = async (id) => {
  if (id && !id.startsWith('ext-')) {
    await supabase.rpc('increment_plays', { content_id: id }).catch(()=>{});
  }
};

// ── EVENT DELEGATION — todos los botones de play ────────────
function bindPlayButtons() {
  const main = document.getElementById('main');
  if (!main || main._playBound) return;
  main._playBound = true;
  main.addEventListener('click', e => {
    const btn = e.target.closest('.play-btn');
    if (!btn) return;
    e.stopPropagation();
    const article = btn.closest('[data-play]');
    if (!article) return;
    try {
      const raw = article.getAttribute('data-play');
      const d = JSON.parse(raw);
      window.playItem(null, d.id, d.title, d.subtitle, d.cover, d.streamUrl, d.panelType, d.embedUrl);
    } catch(err) {
      console.warn('play-btn parse error', err);
    }
  });
}

// ── CONTENT CARD (comunidad Supabase) ───────────────────────
function contentCardHTML(item) {
  const meta   = TYPE_META[item.type] || TYPE_META.otro;
  const isLive = ['stream_en_vivo','tv_en_vivo'].includes(item.type);
  const isTV   = ['tv_en_vivo','tv_grabado'].includes(item.type);

  const pt = item.panel_type || PlayerResolver.detectType(item.embed_url || item.stream_url || item.external_url || '');
  const socialNet = Social.detectNetwork(item.embed_url || item.external_url || '');
  const badge = socialNet ? Social.badge(socialNet) : null;

  // Build embed URL
  let playStream = item.stream_url || item.external_url || '';
  let playEmbed  = item.embed_url  || '';
  if (!playEmbed && playStream) {
    playEmbed = PlayerResolver.buildEmbed(playStream, pt, true) || playStream;
  }
  if (!playEmbed) playEmbed = item.external_url || '';

  // Store all play data safely in JSON data-attribute
  const playData = JSON.stringify({
    id:        item.id,
    title:     item.title     || '',
    subtitle:  item.subtitle  || '',
    cover:     item.cover_url || '',
    streamUrl: playStream,
    panelType: pt,
    embedUrl:  playEmbed,
  });

  const coverStyle = item.cover_url
    ? `background-image:url('${encodeURI(item.cover_url)}')`
    : `background:linear-gradient(135deg,${meta.color}22,${meta.color}44)`;

  return `
    <article class="card ${isLive?'card-live':''} ${isTV?'card-tv':''}" data-id="${item.id}" data-play='${playData.replace(/'/g,"&#39;")}'>
      <div class="card-cover" style="${coverStyle}">
        ${!item.cover_url?`<span class="card-icon">${badge?badge.icon:meta.icon}</span>`:''}
        <div class="card-cover-badges">
          <span class="card-type-badge">${badge?badge.label:meta.label}</span>
          ${isLive?'<span class="live-pill">● EN VIVO</span>':''}
        </div>
        ${item.current_listeners>0?`<span class="listeners-badge">👥 ${item.current_listeners}</span>`:''}
        <button class="play-btn" aria-label="Reproducir">
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
          ${item.external_url?`<a href="${encodeURI(item.external_url)}" target="_blank" rel="noopener noreferrer"
             class="btn btn-sm btn-ghost" onclick="window.trackPlay('${item.id}')">
            ${isTV?'Ver':'Escuchar'}
          </a>`:''}
        </div>
      </div>
    </article>`;
}

// ── EXTERNAL CARD (iHeart / TuneIn / Dailymotion) ───────────
function externalCardHTML(item) {
  const meta    = TYPE_META[item.type] || TYPE_META.otro;
  const srcKey  = item.panelType || item.source || 'generic';
  const badge   = Social.badge(srcKey);
  const isLive  = item.type === 'tv_en_vivo' || item.type === 'stream_en_vivo';
  const pt      = item.panelType || PlayerResolver.detectType(item.embedUrl || item.streamUrl || '') || 'generic';

  let playStream = item.streamUrl  || '';
  let playEmbed  = item.embedUrl   || '';

  // Dailymotion: siempre construir embed desde id
  if (pt === 'dailymotion' && item.id) {
    playEmbed = `https://www.dailymotion.com/embed/video/${item.id}?autoplay=1`;
  }
  // TuneIn embed
  if (pt === 'tunein' && item.id) {
    const stId = item.id.replace(/^s/,'');
    playEmbed = `https://tunein.com/embed/player/?stationId=s${stId}&partnerId=RadioTime`;
  }
  // iHeart embed
  if (pt === 'iheart' && item.id) {
    playEmbed = `https://www.iheart.com/live/${item.id}/?embed=true`;
  }
  // Generic fallback
  if (!playEmbed && playStream) {
    playEmbed = PlayerResolver.buildEmbed(playStream, pt, true) || playStream;
  }
  if (!playEmbed) playEmbed = item.externalUrl || '';

  const openUrl = item.externalUrl || item.embedUrl || '';

  const playData = JSON.stringify({
    id:        `ext-${item.id}`,
    title:     item.title    || '',
    subtitle:  item.subtitle || '',
    cover:     item.cover    || '',
    streamUrl: playStream,
    panelType: pt,
    embedUrl:  playEmbed,
  });

  const coverStyle = item.cover
    ? `background-image:url('${encodeURI(item.cover)}')`
    : `background:linear-gradient(135deg,${meta.color}22,${meta.color}44)`;

  return `
    <article class="card card-external ${isLive?'card-live':''}" data-play='${playData.replace(/'/g,"&#39;")}'>
      <div class="card-cover" style="${coverStyle}">
        ${!item.cover?`<span class="card-icon">${badge.icon}</span>`:''}
        <div class="card-cover-badges">
          <span class="card-type-badge" style="background:${badge.color}22;border-color:${badge.color}44">${badge.label}</span>
          ${isLive?'<span class="live-pill">● EN VIVO</span>':''}
        </div>
        <button class="play-btn" aria-label="Reproducir">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
      <div class="card-body">
        <div class="card-meta-row">
          ${item.country?`<span class="country-badge">${getFlagEmoji(item.country)} ${item.country}</span>`:''}
          <span class="panel-badge" style="border-color:${badge.color}44;color:${badge.color}">${badge.label}</span>
        </div>
        <h3 class="card-title">${escapeHTML(item.title)}</h3>
        ${item.subtitle?`<p class="card-subtitle">${escapeHTML(String(item.subtitle).substring(0,80))}</p>`:''}
        ${item.genre?`<span class="card-genre">${escapeHTML(item.genre)}</span>`:''}
        ${item.nowPlaying?`<div class="now-playing"><span class="np-dot"></span><span class="np-text">${escapeHTML(item.nowPlaying)}</span></div>`:''}
        <div class="card-footer">
          <span class="ext-source-tag">${badge.icon} ${badge.label}</span>
          ${openUrl?`<a href="${encodeURI(openUrl)}" target="_blank" rel="noopener" class="btn btn-sm btn-ghost">Abrir</a>`:''}
        </div>
      </div>
    </article>`;
}

// ── GLOBAL PLAYER ───────────────────────────────────────────
function initPlayer() {
  let bar = document.getElementById('playerBar');
  // Crear playerBar si no existe en el HTML
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'playerBar';
    document.body.appendChild(bar);
  }
  bar.innerHTML = `
    <div class="player-inner">
      <div class="player-cover" id="pCover">🎵</div>
      <div class="player-info">
        <div class="player-title" id="pTitle">LibreAudio PRO</div>
        <div class="player-sub" id="pSub">Selecciona una estación para reproducir</div>
      </div>
      <div class="player-controls">
        <button class="player-btn" id="pPlayPause" onclick="window.playerToggle()" aria-label="Play/Pause">
          <svg id="pPlayIcon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button class="player-btn player-stop" onclick="window.playerStop()" aria-label="Stop" title="Detener">
          <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
        </button>
        <div class="player-vol-wrap">
          <svg class="vol-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          <input type="range" id="pVolume" min="0" max="1" step="0.05" value="0.8" class="player-volume"/>
        </div>
        <button class="player-btn player-expand-btn" id="pExpandBtn" onclick="window.playerToggleEmbed()" aria-label="Ver reproductor" title="Ver/ocultar video">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/><rect x="18" y="5" width="2" height="14" rx="1"/></svg>
        </button>
      </div>
    </div>
    <div id="pEmbedWrap" class="player-embed-wrap" style="display:none"></div>`;

  document.getElementById('pVolume')?.addEventListener('input', e => {
    const a = document.getElementById('playerAudio');
    if (a) a.volume = parseFloat(e.target.value);
  });
}

// ── PLAY ITEM — función central del reproductor ─────────────
window.playItem = async function(e, id, title, subtitle, cover, streamUrl, panelType, embedUrl) {
  if (e) e.stopPropagation();
  window.trackPlay(id);

  // Actualizar estado
  state.player = { active:true, title, subtitle, cover, streamUrl, panelType, embedUrl, itemId:id };

  // Actualizar UI del player bar
  const pTitle = document.getElementById('pTitle');
  const pSub   = document.getElementById('pSub');
  const pCover = document.getElementById('pCover');
  const pBar   = document.getElementById('playerBar');

  if (pTitle) pTitle.textContent = title || 'Sin título';
  if (pSub)   pSub.textContent   = subtitle || '';
  if (pCover) {
    if (cover) {
      pCover.style.backgroundImage = `url('${encodeURI(cover)}')`;
      pCover.textContent = '';
    } else {
      pCover.style.backgroundImage = '';
      pCover.textContent = TYPE_META[panelType]?.icon || '🎵';
    }
  }
  if (pBar) pBar.classList.add('active');

  // Limpiar reproductor anterior
  document.getElementById('playerAudio')?.remove();
  const embedWrap = document.getElementById('pEmbedWrap');
  if (embedWrap) { embedWrap.style.display = 'none'; embedWrap.innerHTML = ''; }

  // Normalizar panelType
  let pt = panelType || '';
  if (!pt || pt === 'generic') {
    pt = PlayerResolver.detectType(embedUrl || streamUrl || '');
  }

  // Para TuneIn: resolver stream URL desde Tune.ashx
  if (pt === 'tunein' && streamUrl && streamUrl.includes('Tune.ashx')) {
    try {
      const resolved = await TuneIn.getStreamUrl(streamUrl);
      if (resolved) { streamUrl = resolved; pt = PlayerResolver.detectType(resolved); }
    } catch(e) {}
  }

  // Construir embedUrl si no existe
  let finalEmbed = embedUrl || '';
  if (!finalEmbed || finalEmbed === streamUrl) {
    finalEmbed = PlayerResolver.buildEmbed(streamUrl || embedUrl || '', pt, true) || '';
  }

  // Tipos que usan iframe embed
  const EMBED_TYPES = ['youtube','twitch','dailymotion','facebook','azuracast','sonicpanel',
                       'zenofm','iheart','tunein','iframe','kick','rumble','instagram','tiktok'];

  if (EMBED_TYPES.includes(pt) && (finalEmbed || embedUrl)) {
    const src = finalEmbed || embedUrl;
    if (embedWrap) {
      embedWrap.innerHTML = `<iframe
        src="${src}"
        frameborder="0"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowfullscreen
        referrerpolicy="no-referrer-when-downgrade"
        style="width:100%;height:100%;border:none;display:block;">
      </iframe>`;
      embedWrap.style.display = 'block';
    }
    updatePlayIcon(true);
    showToast(`▶ Reproduciendo: ${title || 'stream'}`, 'success');
  } else {
    // Audio directo: MP3 / AAC / OGG / HLS
    const src = streamUrl || embedUrl || finalEmbed;
    if (!src) { showToast('No hay URL de stream disponible', 'error'); return; }

    const audio = document.createElement('audio');
    audio.id = 'playerAudio';
    audio.crossOrigin = 'anonymous';
    audio.volume = parseFloat(document.getElementById('pVolume')?.value || 0.8);
    audio.style.display = 'none';
    document.body.appendChild(audio);

    if (src.includes('.m3u8') || pt === 'hls') {
      try {
        const Hls = await loadHlsJs();
        if (Hls && Hls.isSupported()) {
          const hls = new Hls({ enableWorker: false });
          hls.loadSource(src);
          hls.attachMedia(audio);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            audio.play().then(() => updatePlayIcon(true)).catch(() => {
              showToast('No se pudo reproducir. Abriendo en nueva pestaña...', 'error');
              window.open(src, '_blank');
            });
          });
          hls.on(Hls.Events.ERROR, (ev, data) => {
            if (data.fatal) { showToast('Error HLS: ' + data.type, 'error'); }
          });
        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
          audio.src = src;
          audio.play().then(() => updatePlayIcon(true)).catch(() => window.open(src, '_blank'));
        }
      } catch(e) {
        audio.src = src;
        audio.play().then(() => updatePlayIcon(true)).catch(() => window.open(src, '_blank'));
      }
    } else {
      audio.src = src;
      audio.play().then(() => {
        updatePlayIcon(true);
        showToast(`▶ Reproduciendo: ${title || 'stream'}`, 'success');
      }).catch(err => {
        console.warn('Audio play error:', err);
        showToast('Abriendo en nueva pestaña…', 'success');
        window.open(src, '_blank');
      });
    }

    audio.addEventListener('ended', () => updatePlayIcon(false));
    audio.addEventListener('error', () => {
      showToast('Error al cargar audio. Abriendo en nueva pestaña...', 'error');
      window.open(src, '_blank');
    });
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
  } else {
    // Si hay embed activo, nada que togglear
    const ew = document.getElementById('pEmbedWrap');
    if (ew && ew.style.display !== 'none') return;
  }
};

window.playerStop = function() {
  document.getElementById('playerAudio')?.remove();
  const ew = document.getElementById('pEmbedWrap');
  if (ew) { ew.style.display='none'; ew.innerHTML=''; }
  document.getElementById('playerBar')?.classList.remove('active');
  state.player.active = false;
  updatePlayIcon(false);
  document.getElementById('pTitle').textContent = 'LibreAudio PRO';
  document.getElementById('pSub').textContent   = 'Selecciona una estación para reproducir';
  document.getElementById('pCover').textContent = '🎵';
  document.getElementById('pCover').style.backgroundImage = '';
};

window.playerToggleEmbed = function() {
  const ew = document.getElementById('pEmbedWrap');
  if (!ew) return;
  const isHidden = ew.style.display === 'none' || !ew.style.display;
  ew.style.display = isHidden ? 'block' : 'none';
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
        ${featured?.map(contentCardHTML).join('') || '<p class="empty">Sé el primero en agregar contenido.</p>'}
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

// ── DESCUBRIR ───────────────────────────────────────────────
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

  loadDefault('tunein');

  async function loadDefault(tab) {
    const res = document.getElementById('discoverResults');
    if (!res) return;
    res.innerHTML = loadingHTML(tab === 'dailymotion' ? 'Cargando videos populares…' : 'Cargando estaciones populares…');
    try {
      let items = [];
      if (tab === 'tunein') {
        items = await TuneIn.browse('r0');
        if (!items.length) items = await TuneIn.search('radio');
      } else if (tab === 'iheart') {
        items = await iHeart.search('pop');
        if (!items.length) items = await iHeart.getFeatured('MX');
      } else if (tab === 'dailymotion') {
        items = await Dailymotion.getPopular(12);
        if (!items.length) items = await Dailymotion.search('noticias', 12);
      }
      renderDiscoverResults(items, res);
    } catch (err) {
      res.innerHTML = `<div class="empty-state">
        <span class="empty-icon">❌</span>
        <h3>Error al cargar</h3>
        <p>${escapeHTML(err.message||'Intenta de nuevo')}</p>
        <button class="btn btn-primary" onclick="document.getElementById('discoverBtn').click()">Reintentar</button>
      </div>`;
    }
  }

  async function doSearch(query, tab) {
    const res = document.getElementById('discoverResults');
    if (!res) return;
    const names = { tunein:'TuneIn', iheart:'iHeartRadio', dailymotion:'Dailymotion' };
    res.innerHTML = loadingHTML(`Buscando en ${names[tab]||tab}…`);
    try {
      let items = [];
      if (tab === 'tunein')           items = await TuneIn.search(query);
      else if (tab === 'iheart')      items = await iHeart.search(query);
      else if (tab === 'dailymotion') items = await Dailymotion.search(query, 12);
      renderDiscoverResults(items, res);
    } catch(err) {
      res.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><h3>Sin resultados</h3><p>${escapeHTML(err.message||'Intenta con otra búsqueda.')}</p></div>`;
    }
  }

  function renderDiscoverResults(items, container) {
    if (!items || !items.length) {
      container.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><h3>Sin resultados</h3><p>Intenta con otra búsqueda.</p></div>`;
      return;
    }
    container.innerHTML = `<div class="grid-cards">${items.map(externalCardHTML).join('')}</div>`;
    bindPlayButtons();
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
        <option value="hls">HLS</option>
        <option value="audio">Audio MP3</option>
      </select>
      <select id="countryFilter" class="filter-select">
        <option value="">Todos los países</option>
        ${['MX','US','ES','AR','CO','CL','PE','VE','GT','HN','SV','CR','PA','EC','BO','DO','BR'].map(c=>`<option value="${c}">${getFlagEmoji(c)} ${c}</option>`).join('')}
      </select>
    </div>
    <div id="contentGrid" class="grid-cards"></div>
    <div id="loadMoreWrap" class="load-more-wrap"><button id="loadMoreBtn" class="btn btn-ghost" style="display:none">Cargar más</button></div>
    <div id="emptyState" class="empty-state" style="display:none"><span class="empty-icon">🔍</span><h3>Sin resultados</h3></div>
  `);

  await fetchContent(true);

  let debounce;
  document.getElementById('searchInput').addEventListener('input', e => {
    state.filters.query = e.target.value.trim();
    clearTimeout(debounce);
    debounce = setTimeout(() => { explorerPage=0; fetchContent(true); }, 400);
  });
  document.getElementById('typeFilter').addEventListener('change', e => { state.filters.type=e.target.value; explorerPage=0; fetchContent(true); });
  document.getElementById('panelFilter').addEventListener('change', e => { state.filters.panel=e.target.value; explorerPage=0; fetchContent(true); });
  document.getElementById('countryFilter').addEventListener('change', e => { state.filters.country=e.target.value; explorerPage=0; fetchContent(true); });
  document.getElementById('loadMoreBtn').addEventListener('click', () => fetchContent(false));
}

async function fetchContent(reset=false) {
  const grid        = document.getElementById('contentGrid');
  const emptyState  = document.getElementById('emptyState');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (!grid) return;
  if (reset) { explorerPage=0; grid.innerHTML=loadingHTML(); }

  let q = supabase.from('content').select('*').eq('status','approved')
    .order('plays',{ascending:false})
    .range(explorerPage*PAGE_SIZE,(explorerPage+1)*PAGE_SIZE-1);
  if (state.filters.type)    q = q.eq('type',state.filters.type);
  if (state.filters.panel)   q = q.eq('panel_type',state.filters.panel);
  if (state.filters.country) q = q.eq('country',state.filters.country);
  if (state.filters.query)   q = q.or(`title.ilike.%${state.filters.query}%,description.ilike.%${state.filters.query}%`);

  const { data, error } = await q;
  if (error) { showToast('Error al cargar','error'); return; }
  if (reset) grid.innerHTML='';
  if (!data.length && explorerPage===0) {
    grid.innerHTML='';
    if(emptyState) emptyState.style.display='flex';
    if(loadMoreBtn) loadMoreBtn.style.display='none';
    return;
  }
  if(emptyState) emptyState.style.display='none';
  data.forEach(item => {
    const el = document.createElement('div');
    el.innerHTML = contentCardHTML(item);
    if (el.firstElementChild) grid.appendChild(el.firstElementChild);
  });
  if(loadMoreBtn) loadMoreBtn.style.display = data.length < PAGE_SIZE ? 'none' : 'block';
  if (data.length === PAGE_SIZE) explorerPage++;
  bindPlayButtons();
}

// ── ENVIAR ───────────────────────────────────────────────────
const PROVIDER_CONFIG = {
  azuracast: {
    label: '⚡ AzuraCast', icon: '⚡',
    fields: [
      { name:'stream_url',   label:'URL del stream (MP3/AAC/HLS)', required:true,  placeholder:'https://radio.tudominio.com:8000/stream.mp3', hint:'URL directa del stream — visible en AzuraCast → Publicar → Puntos de montaje' },
      { name:'embed_url',    label:'URL embed del player (Now Playing)', required:false, placeholder:'https://radio.tudominio.com/public/turadio/embed', hint:'AzuraCast → Público → Embed Player. Muestra metadatos en tiempo real.' },
      { name:'external_url', label:'URL pública de la estación', required:true,  placeholder:'https://radio.tudominio.com/public/turadio' },
      { name:'metadata_url', label:'URL de metadatos Now Playing (JSON)', required:false, placeholder:'https://radio.tudominio.com/api/nowplaying/turadio', hint:'Endpoint JSON de AzuraCast para mostrar canción actual (opcional)' },
    ]
  },
  sonicpanel: {
    label: '🎵 SonicPanel', icon: '🎵',
    fields: [
      { name:'stream_url',   label:'URL del stream (MP3/AAC)',  required:true,  placeholder:'https://serverXX.sonicpanel.com:PORT/;', hint:'URL de transmisión visible en tu panel SonicPanel → Detalles del servidor' },
      { name:'embed_url',    label:'URL del player embed',      required:false, placeholder:'https://serverXX.sonicpanel.com:PORT/player/', hint:'Player HTML5 de SonicPanel' },
      { name:'external_url', label:'URL pública de la radio',   required:true,  placeholder:'https://turadio.com' },
      { name:'metadata_url', label:'URL de metadatos (JSON)',   required:false, placeholder:'https://serverXX.sonicpanel.com:PORT/stats?json=1', hint:'Para mostrar canción actual en el reproductor' },
    ]
  },
  zenofm: {
    label: '📡 ZenoFM', icon: '📡',
    fields: [
      { name:'stream_url',   label:'URL del stream de ZenoFM', required:true,  placeholder:'https://stream.zeno.fm/XXXXXXXX', hint:'Copia el link directo del stream en tu panel ZenoFM' },
      { name:'embed_url',    label:'URL embed del player',     required:false, placeholder:'https://zeno.fm/radio/NOMBRE/embed', hint:'Opcional — se genera automáticamente del stream_url si lo dejas vacío' },
      { name:'external_url', label:'URL del canal ZenoFM',    required:true,  placeholder:'https://zeno.fm/radio/NOMBRE' },
    ]
  },
  youtube: {
    label: '▶️ YouTube / YouTube Live', icon: '▶️',
    fields: [
      { name:'embed_url',    label:'URL del video o live', required:true, placeholder:'https://www.youtube.com/watch?v=XXXXX  ó  https://youtube.com/@tucanal/live', hint:'Para un live usa la URL del video de transmisión en vivo' },
      { name:'external_url', label:'URL del canal',        required:true, placeholder:'https://www.youtube.com/@tucanal' },
    ]
  },
  twitch: {
    label: '🟣 Twitch', icon: '🟣',
    fields: [
      { name:'embed_url',    label:'URL de tu canal Twitch', required:true, placeholder:'https://www.twitch.tv/NOMBRECANAL', hint:'El reproductor se incrustará automáticamente' },
      { name:'external_url', label:'URL del canal Twitch',  required:true, placeholder:'https://www.twitch.tv/NOMBRECANAL' },
    ]
  },
  dailymotion: {
    label: '🔵 Dailymotion', icon: '🔵',
    fields: [
      { name:'embed_url',    label:'URL del video o canal', required:true, placeholder:'https://www.dailymotion.com/video/XXXXX', hint:'URL del video o canal de Dailymotion' },
      { name:'external_url', label:'URL del canal',         required:true, placeholder:'https://www.dailymotion.com/TUCANAL' },
    ]
  },
  facebook: {
    label: '👥 Facebook Live', icon: '👥',
    fields: [
      { name:'embed_url',    label:'URL del video/live de Facebook', required:true, placeholder:'https://www.facebook.com/watch?v=XXXXX' },
      { name:'external_url', label:'URL de tu página Facebook',      required:true, placeholder:'https://www.facebook.com/tupagina' },
    ]
  },
  kick: {
    label: '🟢 Kick', icon: '🟢',
    fields: [
      { name:'embed_url',    label:'URL de tu canal Kick', required:true, placeholder:'https://kick.com/NOMBRECANAL' },
      { name:'external_url', label:'URL del canal Kick',  required:true, placeholder:'https://kick.com/NOMBRECANAL' },
    ]
  },
  rumble: {
    label: '🔴 Rumble', icon: '🔴',
    fields: [
      { name:'embed_url',    label:'URL del video/canal Rumble', required:true, placeholder:'https://rumble.com/c/CANAL  ó  https://rumble.com/v-XXXXX' },
      { name:'external_url', label:'URL del canal Rumble',       required:true, placeholder:'https://rumble.com/c/CANAL' },
    ]
  },
  hls: {
    label: '🔴 HLS Stream', icon: '🔴',
    fields: [
      { name:'stream_url',   label:'URL del stream HLS (.m3u8)', required:true,  placeholder:'https://tuservidor.com/stream/index.m3u8' },
      { name:'external_url', label:'URL del sitio web',          required:false, placeholder:'https://turadio.com' },
    ]
  },
  audio: {
    label: '🎧 Audio directo (MP3/AAC)', icon: '🎧',
    fields: [
      { name:'stream_url',   label:'URL del stream MP3/AAC', required:true, placeholder:'https://tuservidor.com:8000/stream.mp3', hint:'URL directa al stream de audio' },
      { name:'external_url', label:'URL del sitio web',      required:false, placeholder:'https://turadio.com' },
    ]
  },
  iframe: {
    label: '🔗 Embed genérico (iFrame)', icon: '🔗',
    fields: [
      { name:'embed_url',    label:'URL del embed / iFrame', required:true, placeholder:'https://plataforma.com/embed/XXXXX', hint:'URL que se cargará dentro de un iFrame en el reproductor' },
      { name:'external_url', label:'URL del sitio web',      required:false, placeholder:'https://tucanal.com' },
    ]
  },
};

function renderSubmit() {
  if (!state.session) { navigate('#/login'); return; }

  const GENRES = ['Noticias','Deportes','Entretenimiento','Música','Rock','Pop','Electrónica','Regional Mexicano','Salsa','Jazz','Clásica','Hip-Hop','Norteño','Cumbia','Cultura','Educación','Tecnología','Religioso'];
  const COUNTRIES = [['MX','México'],['US','EE.UU.'],['ES','España'],['AR','Argentina'],['CO','Colombia'],['CL','Chile'],['PE','Perú'],['VE','Venezuela'],['GT','Guatemala'],['HN','Honduras'],['SV','El Salvador'],['CR','Costa Rica'],['PA','Panamá'],['DO','Rep. Dominicana'],['BR','Brasil'],['EC','Ecuador'],['UY','Uruguay']];

  setMain(`
    <div class="form-page"><div class="form-card form-card-wide">
      <h1>Agregar estación o canal</h1>
      <p class="form-subtitle">Radio, TV, Podcast, YouTube, Twitch, AzuraCast, SonicPanel, ZenoFM y más.</p>
      <form id="submitForm" class="form">

        <div class="form-group">
          <label>1. Tipo de contenido <span class="req">*</span></label>
          <div class="type-grid">
            ${Object.entries(TYPE_META).map(([val,m])=>`
              <label class="type-option">
                <input type="radio" name="type" value="${val}" required/>
                <div class="type-option-inner">
                  <span class="type-opt-icon">${m.icon}</span><span>${m.label}</span>
                </div>
              </label>`).join('')}
          </div>
        </div>

        <div class="form-group">
          <label>2. Proveedor / Plataforma <span class="req">*</span></label>
          <div class="provider-grid" id="providerGrid">
            ${Object.entries(PROVIDER_CONFIG).map(([val,p])=>`
              <label class="provider-option">
                <input type="radio" name="panel_type" value="${val}"/>
                <div class="provider-option-inner">
                  <span class="provider-icon">${p.icon}</span>
                  <span class="provider-label">${p.label}</span>
                </div>
              </label>`).join('')}
          </div>
        </div>

        <div class="form-group">
          <label>3. Nombre / Título <span class="req">*</span></label>
          <input type="text" name="title" required minlength="3" maxlength="120" placeholder="Nombre de la estación, canal o programa…"/>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Subtítulo / Eslogan</label>
            <input type="text" name="subtitle" maxlength="80" placeholder="Descripción corta…"/>
          </div>
          <div class="form-group">
            <label>Género / Categoría</label>
            <input type="text" name="genre" maxlength="60" placeholder="Noticias, Rock…" list="genresList"/>
            <datalist id="genresList">${GENRES.map(g=>`<option value="${g}">`).join('')}</datalist>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>País</label>
            <select name="country">
              <option value="">Seleccionar…</option>
              ${COUNTRIES.map(([c,n])=>`<option value="${c}">${getFlagEmoji(c)} ${n}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Ciudad</label>
            <input type="text" name="city" maxlength="60" placeholder="Ciudad de emisión"/>
          </div>
          <div class="form-group">
            <label>Idioma</label>
            <select name="language">
              <option value="es">Español</option><option value="en">Inglés</option>
              <option value="pt">Portugués</option><option value="fr">Francés</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>

        <div id="providerFields" style="display:none;border-top:1px solid var(--border);padding-top:1.25rem;margin-top:.5rem">
          <p id="providerFieldsTitle" style="font-size:.85rem;font-weight:700;color:var(--purple-light);margin-bottom:1rem"></p>
        </div>

        <div class="form-group">
          <label>URL de portada / logo</label>
          <input type="url" name="cover_url" placeholder="https://… (imagen cuadrada recomendada)"/>
          <p class="field-hint">URL directa a imagen JPG/PNG.</p>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary btn-lg" id="submitBtn" disabled>Enviar para revisión</button>
          <p class="field-hint" style="margin-top:.5rem">Tu contenido será revisado antes de aparecer en el directorio.</p>
        </div>
      </form>
    </div></div>
  `);

  function checkEnableSubmit() {
    const hasType     = !!document.querySelector('input[name="type"]:checked');
    const hasProvider = !!document.querySelector('input[name="panel_type"]:checked');
    document.getElementById('submitBtn').disabled = !(hasType && hasProvider);
  }

  function renderProviderFields(pt) {
    const cfg = PROVIDER_CONFIG[pt];
    if (!cfg) return;
    const wrap  = document.getElementById('providerFields');
    const title = document.getElementById('providerFieldsTitle');
    if (!wrap || !title) return;
    title.textContent = `4. Configura ${cfg.label}`;
    wrap.querySelectorAll('.dynamic-field').forEach(el => el.remove());
    cfg.fields.forEach(f => {
      const div = document.createElement('div');
      div.className = 'form-group dynamic-field';
      div.innerHTML = `
        <label>${f.label}${f.required?'<span class="req"> *</span>':''}</label>
        <input type="url" name="${f.name}" ${f.required?'required':''} placeholder="${f.placeholder||''}"/>
        ${f.hint?`<p class="field-hint">${f.hint}</p>`:''}
      `;
      wrap.appendChild(div);
    });
    wrap.style.display = 'block';
    checkEnableSubmit();
  }

  document.querySelectorAll('input[name="panel_type"]').forEach(radio => {
    radio.addEventListener('change', () => renderProviderFields(radio.value));
  });
  document.querySelectorAll('input[name="type"]').forEach(r => r.addEventListener('change', checkEnableSubmit));

  document.getElementById('submitForm').addEventListener('input', e => {
    const val = e.target.value.trim();
    if (!val || e.target.type !== 'url') return;
    const alreadyPicked = !!document.querySelector('input[name="panel_type"]:checked');
    if (!alreadyPicked) {
      const detected = PlayerResolver.detectType(val);
      const radio = document.querySelector(`input[name="panel_type"][value="${detected}"]`);
      if (radio && !radio.checked) { radio.checked = true; renderProviderFields(detected); }
    }
    if (e.target.name === 'stream_url') {
      const pt = document.querySelector('input[name="panel_type"]:checked')?.value;
      const embedInput = document.querySelector('input[name="embed_url"]');
      if (pt === 'zenofm' && embedInput && !embedInput.value) {
        const m = val.match(/zeno\.fm\/radio\/([^/?]+)/);
        if (m) embedInput.value = `https://zeno.fm/radio/${m[1]}/embed`;
      }
    }
  });

  document.getElementById('submitForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled=true; btn.textContent='Enviando…';
    const fd = new FormData(e.target);

    let embedUrl    = fd.get('embed_url')?.trim()     || null;
    const streamUrl = fd.get('stream_url')?.trim()    || null;
    const extUrl    = fd.get('external_url')?.trim()  || '';
    const pt        = fd.get('panel_type') || 'generic';

    if (!embedUrl) {
      const src = streamUrl || extUrl;
      if (src) embedUrl = PlayerResolver.buildEmbed(src, pt, false) || null;
    }

    const { error } = await supabase.from('content').insert({
      user_id:      state.profile.id,
      title:        fd.get('title').trim(),
      subtitle:     fd.get('subtitle')?.trim()||null,
      description:  fd.get('description')?.trim()||null,
      type:         fd.get('type'),
      genre:        fd.get('genre')?.trim()||null,
      country:      fd.get('country')||null,
      city:         fd.get('city')?.trim()||null,
      language:     fd.get('language')||'es',
      panel_type:   pt,
      stream_url:   streamUrl,
      embed_url:    embedUrl,
      external_url: extUrl,
      cover_url:    fd.get('cover_url')?.trim()||null,
      status:       'pending',
    });
    if (error) {
      showToast('Error: '+error.message,'error');
      btn.disabled=false; btn.textContent='Enviar para revisión';
    } else {
      showToast('¡Enviado! Tu estación está en revisión ✨');
      navigate('#/mis-envios');
    }
  });
}

// ── MIS ENVÍOS ──────────────────────────────────────────────
async function renderMine() {
  if (!state.session) { navigate('#/login'); return; }
  setMain(loadingHTML());
  const { data } = await supabase.from('content').select('*').eq('user_id',state.profile.id).order('created_at',{ascending:false});
  const sl={pending:'⏳ Pendiente',approved:'✅ Aprobado',rejected:'❌ Rechazado'};
  const sc={pending:'status-pending',approved:'status-approved',rejected:'status-rejected'};
  setMain(`
    <div class="page-header"><h1>Mis envíos</h1><a href="#/enviar" class="btn btn-primary">+ Nuevo</a></div>
    ${!data?.length?`<div class="empty-state"><span class="empty-icon">📭</span><h3>Aún no has enviado nada</h3><a href="#/enviar" class="btn btn-primary">Agregar mi primera estación</a></div>`:
    `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Título</th><th>Tipo</th><th>Panel</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
      <tbody>${data.map(item=>`
        <tr>
          <td><strong>${escapeHTML(item.title)}</strong>${item.subtitle?`<br><small>${escapeHTML(item.subtitle)}</small>`:''}</td>
          <td>${TYPE_META[item.type]?.icon||''} ${item.type}</td>
          <td>${PANEL_LABELS[item.panel_type]||''}</td>
          <td><span class="status-badge ${sc[item.status]}">${sl[item.status]}</span>${item.reject_reason?`<br><small class="reject-reason">${escapeHTML(item.reject_reason)}</small>`:''}</td>
          <td>${new Date(item.created_at).toLocaleDateString('es-MX')}</td>
          <td><a href="${item.external_url}" target="_blank" class="btn btn-sm btn-ghost">Ver</a>
              <button onclick="window.deleteContent('${item.id}')" class="btn btn-sm btn-danger">Eliminar</button></td>
        </tr>`).join('')}
      </tbody></table></div>`}
  `);
}
window.deleteContent = async id => {
  if (!confirm('¿Eliminar?')) return;
  const { error } = await supabase.from('content').delete().eq('id',id);
  if (error) showToast('Error','error'); else { showToast('Eliminado'); renderMine(); }
};

// ── ADMIN ────────────────────────────────────────────────────
async function renderAdmin() {
  if (!state.session || state.profile?.role!=='admin') { navigate('#/'); showToast('Sin permisos','error'); return; }
  setMain(loadingHTML());
  const [{data:pending},{data:all}] = await Promise.all([
    supabase.from('content').select('*, profiles(username)').eq('status','pending').order('created_at'),
    supabase.from('content').select('*, profiles(username)').order('created_at',{ascending:false}).limit(50),
  ]);
  const sq = await supabase.from('content').select('status');
  const stats={pending:0,approved:0,rejected:0};
  sq.data?.forEach(r=>stats[r.status]=(stats[r.status]||0)+1);

  setMain(`
    <div class="admin-panel">
      <div class="page-header"><h1>Panel de Administración</h1></div>
      <div class="stats-row">
        <div class="stat-card stat-pending"><span class="stat-num">${stats.pending}</span><span class="stat-label">Pendientes</span></div>
        <div class="stat-card stat-approved"><span class="stat-num">${stats.approved}</span><span class="stat-label">Aprobados</span></div>
        <div class="stat-card stat-rejected"><span class="stat-num">${stats.rejected}</span><span class="stat-label">Rechazados</span></div>
        <div class="stat-card"><span class="stat-num">${stats.pending+stats.approved+stats.rejected}</span><span class="stat-label">Total</span></div>
      </div>
      <h2>⏳ Pendientes (${pending?.length||0})</h2>
      ${!pending?.length?`<p class="empty">No hay pendientes ✨</p>`:`
      <div class="admin-cards">${pending.map(item=>`
        <div class="admin-card" id="ac-${item.id}">
          <div class="admin-card-head">
            <span>${TYPE_META[item.type]?.icon||''} ${item.type}</span>
            <span>@${escapeHTML(item.profiles?.username||'anon')}</span>
            <span class="panel-badge">${PANEL_LABELS[item.panel_type]||''}</span>
          </div>
          <h3>${escapeHTML(item.title)}</h3>
          ${item.country?`<span>${getFlagEmoji(item.country)} ${item.country}</span>`:''}
          <p>${escapeHTML(item.description||'')}</p>
          <a href="${item.external_url}" target="_blank" class="ext-link">🔗 ${item.external_url}</a>
          <div class="admin-actions">
            <button onclick="window.adminApprove('${item.id}')" class="btn btn-success">✓ Aprobar</button>
            <button onclick="window.adminRejectPrompt('${item.id}')" class="btn btn-danger">✗ Rechazar</button>
          </div>
        </div>`).join('')}
      </div>`}
      <h2 style="margin-top:3rem">Todos los contenidos</h2>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Título</th><th>Tipo</th><th>Panel</th><th>Usuario</th><th>Estado</th><th>Plays</th><th></th></tr></thead>
        <tbody>${all?.map(item=>`
          <tr id="row-${item.id}">
            <td><strong>${escapeHTML(item.title)}</strong></td>
            <td>${TYPE_META[item.type]?.icon||''}</td>
            <td>${PANEL_LABELS[item.panel_type]||''}</td>
            <td>@${escapeHTML(item.profiles?.username||'anon')}</td>
            <td><span class="status-badge status-${item.status}">${item.status}</span></td>
            <td>${item.plays}</td>
            <td><button onclick="window.adminDelete('${item.id}')" class="btn btn-sm btn-danger">✕</button></td>
          </tr>`).join('')}
        </tbody></table></div>
    </div>
  `);
}
window.adminApprove = async id => {
  const {error}=await supabase.from('content').update({status:'approved'}).eq('id',id);
  if(error) showToast('Error','error'); else { showToast('¡Aprobado!'); document.getElementById(`ac-${id}`)?.remove(); }
};
window.adminRejectPrompt = async id => {
  const reason=prompt('Motivo del rechazo:');
  const {error}=await supabase.from('content').update({status:'rejected',reject_reason:reason||null}).eq('id',id);
  if(error) showToast('Error','error'); else { showToast('Rechazado'); document.getElementById(`ac-${id}`)?.remove(); }
};
window.adminDelete = async id => {
  if(!confirm('¿Eliminar permanentemente?')) return;
  await supabase.from('content').delete().eq('id',id);
  document.getElementById(`row-${id}`)?.remove();
  showToast('Eliminado');
};

// ── PERFIL ───────────────────────────────────────────────────
async function renderProfile() {
  if (!state.session) { navigate('#/login'); return; }
  setMain(loadingHTML());
  const {data:profile} = await supabase.from('profiles').select('*').eq('id',state.session.user.id).single();
  setMain(`
    <div class="form-page"><div class="form-card">
      <h1>Mi perfil</h1>
      <div class="profile-avatar-wrap">
        <img src="${profile.avatar_url||`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}&size=128&background=7C3AED&color=fff`}" class="profile-avatar"/>
      </div>
      <form id="profileForm" class="form">
        <div class="form-group"><label>Nombre de usuario</label><input type="text" name="username" value="${escapeHTML(profile.username||'')}" required/></div>
        <div class="form-group"><label>Nombre completo</label><input type="text" name="full_name" value="${escapeHTML(profile.full_name||'')}"/></div>
        <div class="form-group"><label>URL de avatar</label><input type="url" name="avatar_url" value="${escapeHTML(profile.avatar_url||'')}" placeholder="https://…"/></div>
        <div class="form-group"><label>Correo electrónico</label><input type="email" value="${escapeHTML(state.session.user.email)}" disabled/></div>
        <div class="form-actions"><button type="submit" class="btn btn-primary">Guardar cambios</button></div>
      </form>
    </div></div>
  `);
  document.getElementById('profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd=new FormData(e.target);
    const {error}=await supabase.from('profiles').update({
      username:fd.get('username').trim(), full_name:fd.get('full_name').trim(),
      avatar_url:fd.get('avatar_url').trim()||null,
    }).eq('id',state.session.user.id);
    if(error) showToast('Error: '+error.message,'error');
    else { showToast('Perfil actualizado'); await loadProfile(); renderNav(); }
  });
}

// ── AUTH ──────────────────────────────────────────────────────
function authLogo() {
  return `<div class="auth-logo">
    <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="url(#alg2)"/>
      <defs><linearGradient id="alg2" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#7C3AED"/><stop offset="1" stop-color="#DB2777"/></linearGradient></defs>
      <path d="M10 12a6 6 0 1 1 12 0v8a6 6 0 0 1-12 0V12z" fill="white" opacity=".9"/>
      <circle cx="16" cy="16" r="3.5" fill="#7C3AED"/>
    </svg>
    <span>LibreAudio PRO</span>
  </div>`;
}

function googleBtn(id='googleBtn') {
  return `<button id="${id}" class="btn btn-google btn-lg">
    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
    Continuar con Google
  </button>`;
}

function renderLogin() {
  if (state.session) { navigate('#/'); return; }
  setMain(`
    <div class="auth-page"><div class="auth-card">
      ${authLogo()}<h1>Bienvenido de vuelta</h1>
      ${googleBtn()}
      <div class="or-divider"><span>o</span></div>
      <form id="loginForm" class="form">
        <div class="form-group"><label>Correo</label><input type="email" name="email" required placeholder="tu@email.com"/></div>
        <div class="form-group">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <label>Contraseña</label>
            <a href="#/recuperar" style="font-size:.8rem;color:var(--purple-light)">¿Olvidaste tu contraseña?</a>
          </div>
          <input type="password" name="password" required placeholder="••••••••"/>
        </div>
        <button type="submit" class="btn btn-primary btn-lg" id="loginBtn">Entrar</button>
      </form>
      <p class="auth-switch">¿No tienes cuenta? <a href="#/register">Regístrate gratis</a></p>
    </div></div>
  `);
  document.getElementById('googleBtn').addEventListener('click', async () => {
    await supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo:location.origin+location.pathname }});
  });
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn=document.getElementById('loginBtn');
    btn.disabled=true; btn.textContent='Entrando…';
    const fd=new FormData(e.target);
    const {error}=await supabase.auth.signInWithPassword({email:fd.get('email'),password:fd.get('password')});
    if(error){
      let msg='Error al iniciar sesión';
      if(error.message.includes('Invalid login credentials')) msg='Correo o contraseña incorrectos.';
      else if(error.message.includes('Email not confirmed')) msg='Confirma tu correo antes de entrar.';
      else msg=error.message;
      showToast(msg,'error'); btn.disabled=false; btn.textContent='Entrar';
    }
  });
}

function renderRegister() {
  if (state.session) { navigate('#/'); return; }
  setMain(`
    <div class="auth-page"><div class="auth-card">
      ${authLogo()}<h1>Crear cuenta gratis</h1>
      ${googleBtn('googleRegBtn')}
      <div class="or-divider"><span>o</span></div>
      <form id="registerForm" class="form">
        <div class="form-group"><label>Nombre de usuario <span class="req">*</span></label>
          <input type="text" name="username" required minlength="3" maxlength="30" pattern="[a-zA-Z0-9_]+" placeholder="mi_usuario"/>
          <p class="field-hint">Solo letras, números y guión bajo</p></div>
        <div class="form-group"><label>Correo <span class="req">*</span></label><input type="email" name="email" required placeholder="tu@email.com"/></div>
        <div class="form-group"><label>Contraseña <span class="req">*</span></label><input type="password" name="password" required minlength="8" placeholder="Mínimo 8 caracteres"/></div>
        <button type="submit" class="btn btn-primary btn-lg" id="registerBtn">Crear cuenta</button>
      </form>
      <p class="auth-switch">¿Ya tienes cuenta? <a href="#/login">Entrar</a></p>
    </div></div>
  `);
  document.getElementById('googleRegBtn').addEventListener('click', async () => {
    await supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo:location.origin+location.pathname }});
  });
  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn=document.getElementById('registerBtn');
    btn.disabled=true; btn.textContent='Creando…';
    const fd=new FormData(e.target);
    const {error}=await supabase.auth.signUp({email:fd.get('email'),password:fd.get('password'),options:{data:{username:fd.get('username').trim()}}});
    if(error){ showToast(error.message,'error'); btn.disabled=false; btn.textContent='Crear cuenta'; }
    else { showToast('¡Cuenta creada! Revisa tu correo.'); navigate('#/login'); }
  });
}

function renderForgotPassword() {
  if (state.session) { navigate('#/'); return; }
  setMain(`
    <div class="auth-page"><div class="auth-card">
      ${authLogo()}<h1>Restablecer contraseña</h1>
      <p class="form-subtitle">Te enviaremos un enlace para crear una nueva contraseña.</p>
      <form id="forgotForm" class="form">
        <div class="form-group"><label>Correo</label><input type="email" name="email" required placeholder="tu@email.com" id="forgotEmail"/></div>
        <button type="submit" class="btn btn-primary btn-lg" id="forgotBtn">Enviar enlace</button>
      </form>
      <p class="auth-switch"><a href="#/login">← Volver al login</a></p>
    </div></div>
  `);
  document.getElementById('forgotForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn=document.getElementById('forgotBtn');
    btn.disabled=true; btn.textContent='Enviando…';
    const email=document.getElementById('forgotEmail').value.trim();
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}${location.pathname}#/nueva-password`});
    if(error){ showToast('Error: '+error.message,'error'); btn.disabled=false; btn.textContent='Enviar enlace'; }
    else { setMain(`<div class="auth-page"><div class="auth-card" style="text-align:center"><div style="font-size:3rem;margin-bottom:1rem">📧</div><h1>¡Correo enviado!</h1><p>Revisa <strong>${email}</strong> y haz clic en el enlace.</p><a href="#/login" class="btn btn-primary" style="margin-top:1.5rem">Volver al login</a></div></div>`); }
  });
}

async function renderNewPassword() {
  setMain(`
    <div class="auth-page"><div class="auth-card">
      ${authLogo()}<h1>Nueva contraseña</h1>
      <form id="newPassForm" class="form">
        <div class="form-group"><label>Nueva contraseña <span class="req">*</span></label><input type="password" id="newPass" required minlength="8" placeholder="Mínimo 8 caracteres"/></div>
        <div class="form-group"><label>Confirmar <span class="req">*</span></label><input type="password" id="newPass2" required minlength="8" placeholder="Repite la contraseña"/></div>
        <button type="submit" class="btn btn-primary btn-lg" id="newPassBtn">Guardar contraseña</button>
      </form>
    </div></div>
  `);
  document.getElementById('newPassForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn=document.getElementById('newPassBtn');
    const p1=document.getElementById('newPass').value;
    const p2=document.getElementById('newPass2').value;
    if(p1!==p2){ showToast('Las contraseñas no coinciden','error'); return; }
    btn.disabled=true; btn.textContent='Guardando…';
    const {error}=await supabase.auth.updateUser({password:p1});
    if(error){ showToast('Error: '+error.message,'error'); btn.disabled=false; btn.textContent='Guardar contraseña'; }
    else { showToast('¡Contraseña actualizada!'); await supabase.auth.signOut(); navigate('#/login'); }
  });
}

function render404() {
  setMain(`<div class="auth-page"><div class="auth-card" style="text-align:center"><div style="font-size:4rem">🔍</div><h1>Página no encontrada</h1><a href="#/" class="btn btn-primary">Ir al inicio</a></div></div>`);
}
