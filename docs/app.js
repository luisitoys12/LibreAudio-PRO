// ============================================================
// LibreAudio PRO — app.js
// Supabase JS v2 CDN · No bundler needed
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── CONFIG — Reemplaza con tus valores de Supabase ─────────
const SUPABASE_URL  = window.SUPABASE_URL  || 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON = window.SUPABASE_ANON || 'TU_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true }
});

// ── ESTADO GLOBAL ──────────────────────────────────────────
export const state = {
  session: null,
  profile: null,
  currentPage: 'home',
  filters: { type: '', query: '', genre: '' },
  isLoading: false,
};

// ── INICIALIZACIÓN ─────────────────────────────────────────
export async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  state.session = session;
  if (session) await loadProfile();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    state.session = session;
    if (session) {
      await loadProfile();
    } else {
      state.profile = null;
    }
    renderNav();
    router();
  });

  window.addEventListener('popstate', router);
  router();
}

// ── CARGAR PERFIL ──────────────────────────────────────────
async function loadProfile() {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', state.session.user.id)
    .single();
  state.profile = data;
}

// ── ROUTER SPA ─────────────────────────────────────────────
export function router() {
  const hash = location.hash || '#/';
  const routes = {
    '#/':          renderHome,
    '#/explorar':  renderExplorer,
    '#/enviar':    renderSubmit,
    '#/mis-envios':renderMine,
    '#/admin':     renderAdmin,
    '#/perfil':    renderProfile,
    '#/login':     renderLogin,
    '#/register':  renderRegister,
  };

  const handler = routes[hash] || render404;
  state.currentPage = hash;
  renderNav();
  handler();
}

function navigate(hash) {
  location.hash = hash;
}

// ── RENDER NAV ─────────────────────────────────────────────
function renderNav() {
  const nav = document.getElementById('nav');
  const isAdmin = state.profile?.role === 'admin';
  const user = state.session?.user;

  nav.innerHTML = `
    <div class="nav-inner">
      <a href="#/" class="nav-logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="14" fill="#6C3EF7"/>
          <path d="M9 10a5 5 0 1 1 10 0v8a5 5 0 0 1-10 0V10z" fill="white" opacity=".9"/>
          <circle cx="14" cy="14" r="3" fill="#6C3EF7"/>
        </svg>
        <span>LibreAudio<b>PRO</b></span>
      </a>
      <nav class="nav-links">
        <a href="#/explorar">Explorar</a>
        ${user ? `<a href="#/enviar">Enviar</a>` : ''}
        ${user ? `<a href="#/mis-envios">Mis envíos</a>` : ''}
        ${isAdmin ? `<a href="#/admin" class="badge-admin">Admin</a>` : ''}
      </nav>
      <div class="nav-auth">
        ${user
          ? `<div class="user-menu" id="userMenu">
               <img src="${state.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(state.profile?.username || 'U')}&background=6C3EF7&color=fff`}" class="avatar" />
               <span>${state.profile?.username || 'Usuario'}</span>
               <div class="dropdown">
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

  document.getElementById('hamburger')?.addEventListener('click', () => {
    nav.classList.toggle('open');
  });

  document.getElementById('userMenu')?.addEventListener('click', (e) => {
    e.currentTarget.classList.toggle('active');
  });
}

// ── LOGOUT ─────────────────────────────────────────────────
window.logout = async () => {
  await supabase.auth.signOut();
  navigate('#/');
};

// ── RENDER HELPERS ─────────────────────────────────────────
function setMain(html) {
  document.getElementById('main').innerHTML = html;
}

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

function contentCardHTML(item) {
  const icons = {
    radio: '📻', podcast: '🎤️', musica: '🎵',
    stream_en_vivo: '🔴', otro: '🎧'
  };
  const typeLabels = {
    radio: 'Radio', podcast: 'Podcast', musica: 'Música',
    stream_en_vivo: 'En vivo', otro: 'Otro'
  };

  return `
    <article class="card" data-id="${item.id}">
      <div class="card-cover" style="background-image:url('${item.cover_url || ''}')">
        ${!item.cover_url ? `<span class="card-icon">${icons[item.type] || '🎧'}</span>` : ''}
        <span class="card-type-badge">${typeLabels[item.type] || item.type}</span>
        ${item.type === 'stream_en_vivo' ? '<span class="live-dot">● EN VIVO</span>' : ''}
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHTML(item.title)}</h3>
        ${item.genre ? `<span class="card-genre">${escapeHTML(item.genre)}</span>` : ''}
        <p class="card-desc">${escapeHTML(item.description || '')}</p>
        <div class="card-footer">
          <span class="card-plays">▶ ${item.plays} plays</span>
          <a href="${item.external_url}" target="_blank" rel="noopener noreferrer"
             class="btn btn-sm btn-primary" onclick="trackPlay('${item.id}')">
            Escuchar
          </a>
        </div>
      </div>
    </article>
  `;
}

window.trackPlay = async (id) => {
  await supabase.rpc('increment_plays', { content_id: id });
};

function escapeHTML(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── HOME ───────────────────────────────────────────────────
async function renderHome() {
  setMain(loadingHTML());

  const [{ data: featured }, { data: recent }, { count: total }] = await Promise.all([
    supabase.from('content').select('*, profiles(username, avatar_url)')
      .eq('status','approved').order('plays', { ascending: false }).limit(6),
    supabase.from('content').select('*, profiles(username, avatar_url)')
      .eq('status','approved').order('created_at', { ascending: false }).limit(8),
    supabase.from('content').select('*', { count: 'exact', head: true }).eq('status','approved'),
  ]);

  setMain(`
    <section class="hero">
      <div class="hero-content">
        <h1>El directorio libre de<br><span class="gradient-text">radio, podcasts y audio</span></h1>
        <p>Descubre contenido independiente compartido por la comunidad. Gratuito, abierto y sin algoritmos.</p>
        <div class="hero-actions">
          <a href="#/explorar" class="btn btn-primary btn-lg">Explorar contenido</a>
          ${!state.session ? `<a href="#/register" class="btn btn-ghost btn-lg">Publicar gratis</a>` : ''}
        </div>
        <div class="hero-stats">
          <div class="stat"><strong>${total || 0}</strong><span>contenidos</span></div>
          <div class="stat"><strong>100%</strong><span>gratuito</span></div>
          <div class="stat"><strong>∞</strong><span>géneros</span></div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="audio-rings">
          <div class="ring r1"></div>
          <div class="ring r2"></div>
          <div class="ring r3"></div>
          <div class="ring-center">🎵</div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>🔥 Más populares</h2>
        <a href="#/explorar" class="link-more">Ver todos →</a>
      </div>
      <div class="grid-cards">
        ${featured?.map(contentCardHTML).join('') || '<p class="empty">Aún no hay contenido aprobado.</p>'}
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>🆕 Recién llegados</h2>
        <a href="#/explorar" class="link-more">Ver todos →</a>
      </div>
      <div class="grid-cards">
        ${recent?.map(contentCardHTML).join('') || ''}
      </div>
    </section>

    <section class="cta-section">
      <h2>¿Tienes una radio o podcast?</h2>
      <p>Comparte tu contenido con la comunidad. Solo necesitas un enlace externo de Drive, Dropbox, SoundCloud o cualquier plataforma.</p>
      <a href="${state.session ? '#/enviar' : '#/register'}" class="btn btn-primary btn-lg">
        Publicar mi contenido
      </a>
    </section>
  `);
}

// ── EXPLORAR ───────────────────────────────────────────────
let explorerPage = 0;
const PAGE_SIZE  = 12;

async function renderExplorer() {
  explorerPage = 0;
  setMain(`
    <div class="page-header">
      <h1>Explorar</h1>
      <p>Descubre radios, podcasts y audio libre</p>
    </div>

    <div class="filters-bar">
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/>
        </svg>
        <input type="text" id="searchInput" placeholder="Buscar por título, descripción…" class="search-input" />
      </div>
      <select id="typeFilter" class="filter-select">
        <option value="">Todos los tipos</option>
        <option value="radio">📻 Radio</option>
        <option value="podcast">🎤️ Podcast</option>
        <option value="musica">🎵 Música</option>
        <option value="stream_en_vivo">🔴 En vivo</option>
        <option value="otro">🎧 Otro</option>
      </select>
      <select id="genreFilter" class="filter-select">
        <option value="">Todos los géneros</option>
        ${['Electrónica','Regional Mexicano','Pop','Rock','Salsa','Jazz','Clásica','Hip-Hop','Norteño','Cumbia','Noticias','Deportes','Cultura','Educación'].map(g=>`<option value="${g}">${g}</option>`).join('')}
      </select>
    </div>

    <div id="contentGrid" class="grid-cards"></div>
    <div id="loadMoreWrap" class="load-more-wrap">
      <button id="loadMoreBtn" class="btn btn-ghost" style="display:none">Cargar más</button>
    </div>
    <div id="emptyState" class="empty-state" style="display:none">
      <span class="empty-icon">🔍</span>
      <h3>Sin resultados</h3>
      <p>Intenta con otros filtros o sé el primero en publicar este tipo de contenido.</p>
      ${state.session ? `<a href="#/enviar" class="btn btn-primary">Publicar ahora</a>` : ''}
    </div>
  `);

  await fetchContent(true);

  let debounceTimer;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.filters.query = e.target.value.trim();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { explorerPage = 0; fetchContent(true); }, 400);
  });
  document.getElementById('typeFilter').addEventListener('change', (e) => {
    state.filters.type = e.target.value;
    explorerPage = 0; fetchContent(true);
  });
  document.getElementById('genreFilter').addEventListener('change', (e) => {
    state.filters.genre = e.target.value;
    explorerPage = 0; fetchContent(true);
  });
  document.getElementById('loadMoreBtn').addEventListener('click', () => fetchContent(false));
}

async function fetchContent(reset = false) {
  const grid = document.getElementById('contentGrid');
  const emptyState = document.getElementById('emptyState');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (!grid) return;

  if (reset) {
    explorerPage = 0;
    grid.innerHTML = loadingHTML();
  }

  let query = supabase.from('content')
    .select('*, profiles(username)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(explorerPage * PAGE_SIZE, (explorerPage + 1) * PAGE_SIZE - 1);

  if (state.filters.type)  query = query.eq('type', state.filters.type);
  if (state.filters.genre) query = query.eq('genre', state.filters.genre);
  if (state.filters.query) {
    query = query.or(
      `title.ilike.%${state.filters.query}%,description.ilike.%${state.filters.query}%`
    );
  }

  const { data, error } = await query;

  if (error) { showToast('Error al cargar contenido', 'error'); return; }

  if (reset) grid.innerHTML = '';

  if (data.length === 0 && explorerPage === 0) {
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

// ── ENVIAR CONTENIDO ───────────────────────────────────────
function renderSubmit() {
  if (!state.session) { navigate('#/login'); return; }

  setMain(`
    <div class="form-page">
      <div class="form-card">
        <h1>Enviar contenido</h1>
        <p class="form-subtitle">Tu envío será revisado por un moderador antes de publicarse.</p>

        <form id="submitForm" class="form">
          <div class="form-group">
            <label>Título <span class="req">*</span></label>
            <input type="text" name="title" required minlength="3" maxlength="120"
                   placeholder="Nombre de la radio, podcast o emisión…" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Tipo <span class="req">*</span></label>
              <select name="type" required>
                <option value="">Seleccionar…</option>
                <option value="radio">📻 Radio</option>
                <option value="podcast">🎤️ Podcast</option>
                <option value="musica">🎵 Música</option>
                <option value="stream_en_vivo">🔴 Stream en vivo</option>
                <option value="otro">🎧 Otro</option>
              </select>
            </div>
            <div class="form-group">
              <label>Género / Categoría</label>
              <input type="text" name="genre" maxlength="60"
                     placeholder="Rock, Noticias, Tecnología…" list="genresList" />
              <datalist id="genresList">
                ${['Electrónica','Regional Mexicano','Pop','Rock','Salsa','Jazz','Clásica','Hip-Hop','Norteño','Cumbia','Noticias','Deportes','Cultura','Educación'].map(g=>`<option value="${g}">`).join('')}
              </datalist>
            </div>
          </div>

          <div class="form-group">
            <label>Descripción</label>
            <textarea name="description" rows="3" maxlength="1000"
                      placeholder="Cuéntanos de qué trata…"></textarea>
          </div>

          <div class="form-group">
            <label>URL externa <span class="req">*</span></label>
            <input type="url" name="external_url" required
                   placeholder="https://drive.google.com/… o SoundCloud, Dropbox, etc." />
            <p class="field-hint">Enlace a tu archivo en Drive, Dropbox, SoundCloud, Spotify, YouTube, etc.</p>
          </div>

          <div class="form-group">
            <label>URL de portada / imagen</label>
            <input type="url" name="cover_url"
                   placeholder="https://… (opcional)" />
          </div>

          <div class="form-group">
            <label>Idioma</label>
            <select name="language">
              <option value="es">Español</option>
              <option value="en">Inglés</option>
              <option value="pt">Portugués</option>
              <option value="fr">Francés</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-lg" id="submitBtn">
              Enviar para revisión
            </button>
          </div>
        </form>
      </div>
    </div>
  `);

  document.getElementById('submitForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true; btn.textContent = 'Enviando…';

    const fd = new FormData(e.target);
    const payload = {
      user_id:      state.profile.id,
      title:        fd.get('title').trim(),
      description:  fd.get('description').trim() || null,
      type:         fd.get('type'),
      genre:        fd.get('genre').trim() || null,
      external_url: fd.get('external_url').trim(),
      cover_url:    fd.get('cover_url').trim() || null,
      language:     fd.get('language'),
      status:       'pending',
    };

    const { error } = await supabase.from('content').insert(payload);

    if (error) {
      showToast('Error: ' + error.message, 'error');
      btn.disabled = false; btn.textContent = 'Enviar para revisión';
    } else {
      showToast('¡Enviado! Tu contenido está en revisión.');
      navigate('#/mis-envios');
    }
  });
}

// ── MIS ENVÍOS ─────────────────────────────────────────────
async function renderMine() {
  if (!state.session) { navigate('#/login'); return; }
  setMain(loadingHTML());

  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('user_id', state.profile.id)
    .order('created_at', { ascending: false });

  if (error) { showToast('Error al cargar tus envíos', 'error'); return; }

  const statusLabel = { pending: '⏳ Pendiente', approved: '✅ Aprobado', rejected: '❌ Rechazado' };
  const statusClass = { pending: 'status-pending', approved: 'status-approved', rejected: 'status-rejected' };

  setMain(`
    <div class="page-header">
      <h1>Mis envíos</h1>
      <a href="#/enviar" class="btn btn-primary">+ Nuevo envío</a>
    </div>

    ${!data || data.length === 0
      ? `<div class="empty-state">
           <span class="empty-icon">💭</span>
           <h3>Aún no has enviado nada</h3>
           <a href="#/enviar" class="btn btn-primary">Enviar mi primer contenido</a>
         </div>`
      : `<div class="table-wrap">
           <table class="data-table">
             <thead>
               <tr>
                 <th>Título</th>
                 <th>Tipo</th>
                 <th>Estado</th>
                 <th>Fecha</th>
                 <th>Acciones</th>
               </tr>
             </thead>
             <tbody>
               ${data.map(item => `
                 <tr>
                   <td><strong>${escapeHTML(item.title)}</strong></td>
                   <td>${item.type}</td>
                   <td><span class="status-badge ${statusClass[item.status]}">${statusLabel[item.status]}</span>
                       ${item.reject_reason ? `<p class="reject-reason">${escapeHTML(item.reject_reason)}</p>` : ''}
                   </td>
                   <td>${new Date(item.created_at).toLocaleDateString('es-MX')}</td>
                   <td>
                     <a href="${item.external_url}" target="_blank" class="btn btn-sm btn-ghost">Ver</a>
                     <button onclick="deleteContent('${item.id}')" class="btn btn-sm btn-danger">Eliminar</button>
                   </td>
                 </tr>
               `).join('')}
             </tbody>
           </table>
         </div>`
    }
  `);
}

window.deleteContent = async (id) => {
  if (!confirm('¿Eliminar este contenido?')) return;
  const { error } = await supabase.from('content').delete().eq('id', id);
  if (error) showToast('Error al eliminar', 'error');
  else { showToast('Eliminado correctamente'); renderMine(); }
};

// ── PANEL ADMIN ────────────────────────────────────────────
async function renderAdmin() {
  if (!state.session || state.profile?.role !== 'admin') {
    navigate('#/'); showToast('Sin permisos de administrador', 'error'); return;
  }
  setMain(loadingHTML());

  const [{ data: pending }, { data: all }] = await Promise.all([
    supabase.from('content').select('*, profiles(username)').eq('status','pending').order('created_at'),
    supabase.from('content').select('*, profiles(username)').order('created_at', { ascending: false }).limit(30),
  ]);

  const statsQ = await supabase.from('content').select('status');
  const stats = { pending: 0, approved: 0, rejected: 0 };
  statsQ.data?.forEach(r => stats[r.status] = (stats[r.status] || 0) + 1);

  setMain(`
    <div class="admin-panel">
      <div class="page-header">
        <h1>Panel de Administración</h1>
      </div>

      <div class="stats-row">
        <div class="stat-card stat-pending">
          <span class="stat-num">${stats.pending}</span>
          <span class="stat-label">Pendientes</span>
        </div>
        <div class="stat-card stat-approved">
          <span class="stat-num">${stats.approved}</span>
          <span class="stat-label">Aprobados</span>
        </div>
        <div class="stat-card stat-rejected">
          <span class="stat-num">${stats.rejected}</span>
          <span class="stat-label">Rechazados</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${stats.pending + stats.approved + stats.rejected}</span>
          <span class="stat-label">Total</span>
        </div>
      </div>

      <h2>⏳ Pendientes de revisión (${pending?.length || 0})</h2>
      ${!pending || pending.length === 0
        ? `<p class="empty">No hay envíos pendientes. ✨</p>`
        : `<div class="admin-cards">
             ${pending.map(item => `
               <div class="admin-card" id="ac-${item.id}">
                 <div class="admin-card-head">
                   <span class="admin-card-type">${item.type}</span>
                   <span class="admin-card-user">por @${escapeHTML(item.profiles?.username || 'anon')}</span>
                   <span class="admin-card-date">${new Date(item.created_at).toLocaleDateString('es-MX')}</span>
                 </div>
                 <h3>${escapeHTML(item.title)}</h3>
                 ${item.genre ? `<span class="card-genre">${escapeHTML(item.genre)}</span>` : ''}
                 <p>${escapeHTML(item.description || '')}</p>
                 <a href="${item.external_url}" target="_blank" class="ext-link">🔗 ${item.external_url}</a>
                 <div class="admin-actions">
                   <button onclick="adminApprove('${item.id}')" class="btn btn-success">✓ Aprobar</button>
                   <button onclick="adminRejectPrompt('${item.id}')" class="btn btn-danger">✗ Rechazar</button>
                 </div>
               </div>
             `).join('')}
           </div>`
      }

      <h2 style="margin-top:3rem">Todos los contenidos</h2>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Título</th><th>Tipo</th><th>Usuario</th><th>Estado</th><th>Plays</th><th>Acciones</th></tr></thead>
          <tbody>
            ${all?.map(item => `
              <tr id="row-${item.id}">
                <td><strong>${escapeHTML(item.title)}</strong></td>
                <td>${item.type}</td>
                <td>@${escapeHTML(item.profiles?.username || 'anon')}</td>
                <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                <td>${item.plays}</td>
                <td>
                  <a href="${item.external_url}" target="_blank" class="btn btn-sm btn-ghost">Ver</a>
                  <button onclick="adminDelete('${item.id}')" class="btn btn-sm btn-danger">Eliminar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `);
}

window.adminApprove = async (id) => {
  const { error } = await supabase.from('content').update({ status: 'approved' }).eq('id', id);
  if (error) showToast('Error: ' + error.message, 'error');
  else { showToast('¡Contenido aprobado!'); document.getElementById(`ac-${id}`)?.remove(); document.getElementById(`row-${id}`)?.querySelector('.status-badge')?.setAttribute('class','status-badge status-approved'); }
};

window.adminRejectPrompt = async (id) => {
  const reason = prompt('Motivo del rechazo (opcional):');
  const { error } = await supabase.from('content').update({ status: 'rejected', reject_reason: reason || null }).eq('id', id);
  if (error) showToast('Error: ' + error.message, 'error');
  else { showToast('Contenido rechazado'); document.getElementById(`ac-${id}`)?.remove(); }
};

window.adminDelete = async (id) => {
  if (!confirm('¿Eliminar permanentemente?')) return;
  await supabase.from('content').delete().eq('id', id);
  document.getElementById(`row-${id}`)?.remove();
  showToast('Eliminado');
};

// ── PERFIL ─────────────────────────────────────────────────
async function renderProfile() {
  if (!state.session) { navigate('#/login'); return; }
  setMain(loadingHTML());

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', state.session.user.id).single();

  setMain(`
    <div class="form-page">
      <div class="form-card">
        <h1>Mi perfil</h1>
        <div class="profile-avatar-wrap">
          <img src="${profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}&size=128&background=6C3EF7&color=fff`}"
               class="profile-avatar" />
        </div>
        <form id="profileForm" class="form">
          <div class="form-group">
            <label>Nombre de usuario</label>
            <input type="text" name="username" value="${escapeHTML(profile.username || '')}" required />
          </div>
          <div class="form-group">
            <label>Nombre completo</label>
            <input type="text" name="full_name" value="${escapeHTML(profile.full_name || '')}" />
          </div>
          <div class="form-group">
            <label>URL de avatar</label>
            <input type="url" name="avatar_url" value="${escapeHTML(profile.avatar_url || '')}" placeholder="https://…" />
          </div>
          <div class="form-group">
            <label>Correo electrónico</label>
            <input type="email" value="${escapeHTML(state.session.user.email)}" disabled />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Guardar cambios</button>
          </div>
        </form>
      </div>
    </div>
  `);

  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('profiles').update({
      username:   fd.get('username').trim(),
      full_name:  fd.get('full_name').trim(),
      avatar_url: fd.get('avatar_url').trim() || null,
    }).eq('id', state.session.user.id);

    if (error) showToast('Error: ' + error.message, 'error');
    else { showToast('Perfil actualizado'); await loadProfile(); renderNav(); }
  });
}

// ── LOGIN ──────────────────────────────────────────────────
function renderLogin() {
  if (state.session) { navigate('#/'); return; }

  setMain(`
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="#6C3EF7"/>
            <path d="M9 10a5 5 0 1 1 10 0v8a5 5 0 0 1-10 0V10z" fill="white" opacity=".9"/>
            <circle cx="14" cy="14" r="3" fill="#6C3EF7"/>
          </svg>
          <span>LibreAudio PRO</span>
        </div>
        <h1>Bienvenido de vuelta</h1>

        <button id="googleBtn" class="btn btn-google btn-lg">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continuar con Google
        </button>

        <div class="or-divider"><span>o</span></div>

        <form id="loginForm" class="form">
          <div class="form-group">
            <label>Correo electrónico</label>
            <input type="email" name="email" required placeholder="tu@email.com" />
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" name="password" required placeholder="••••••••" />
          </div>
          <button type="submit" class="btn btn-primary btn-lg" id="loginBtn">Entrar</button>
        </form>

        <p class="auth-switch">¿No tienes cuenta? <a href="#/register">Regístrate gratis</a></p>
      </div>
    </div>
  `);

  document.getElementById('googleBtn').addEventListener('click', async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname }
    });
  });

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    btn.disabled = true; btn.textContent = 'Entrando…';
    const fd = new FormData(e.target);

    const { error } = await supabase.auth.signInWithPassword({
      email: fd.get('email'), password: fd.get('password')
    });

    if (error) {
      showToast('Credenciales incorrectas', 'error');
      btn.disabled = false; btn.textContent = 'Entrar';
    }
    // el listener onAuthStateChange maneja el redirect
  });
}

// ── REGISTER ───────────────────────────────────────────────
function renderRegister() {
  if (state.session) { navigate('#/'); return; }

  setMain(`
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="#6C3EF7"/>
            <path d="M9 10a5 5 0 1 1 10 0v8a5 5 0 0 1-10 0V10z" fill="white" opacity=".9"/>
            <circle cx="14" cy="14" r="3" fill="#6C3EF7"/>
          </svg>
          <span>LibreAudio PRO</span>
        </div>
        <h1>Crea tu cuenta</h1>

        <button id="googleBtn" class="btn btn-google btn-lg">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Registrarse con Google
        </button>

        <div class="or-divider"><span>o</span></div>

        <form id="registerForm" class="form">
          <div class="form-group">
            <label>Nombre de usuario <span class="req">*</span></label>
            <input type="text" name="username" required minlength="3" maxlength="30"
                   placeholder="miradio2025" pattern="[a-zA-Z0-9_]+" />
            <p class="field-hint">Solo letras, números y guiones bajos</p>
          </div>
          <div class="form-group">
            <label>Correo electrónico <span class="req">*</span></label>
            <input type="email" name="email" required placeholder="tu@email.com" />
          </div>
          <div class="form-group">
            <label>Contraseña <span class="req">*</span></label>
            <input type="password" name="password" required minlength="8" placeholder="Mínimo 8 caracteres" />
          </div>
          <button type="submit" class="btn btn-primary btn-lg" id="regBtn">Crear cuenta</button>
        </form>

        <p class="auth-switch">¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></p>
      </div>
    </div>
  `);

  document.getElementById('googleBtn').addEventListener('click', async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname }
    });
  });

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('regBtn');
    btn.disabled = true; btn.textContent = 'Creando cuenta…';
    const fd = new FormData(e.target);

    const { error } = await supabase.auth.signUp({
      email: fd.get('email'),
      password: fd.get('password'),
      options: { data: { username: fd.get('username').trim() } }
    });

    if (error) {
      showToast('Error: ' + error.message, 'error');
      btn.disabled = false; btn.textContent = 'Crear cuenta';
    } else {
      showToast('¡Cuenta creada! Revisa tu correo para confirmar.');
      navigate('#/login');
    }
  });
}

// ── 404 ────────────────────────────────────────────────────
function render404() {
  setMain(`
    <div class="empty-state" style="margin-top:4rem">
      <span class="empty-icon">🔊</span>
      <h2>Página no encontrada</h2>
      <a href="#/" class="btn btn-primary">Ir al inicio</a>
    </div>
  `);
}
