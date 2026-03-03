// LibreAudio PRO - Aplicación principal

const STORAGE_KEY = 'libreaudio_pwa_content_v1';
const VERSION = '1.0.0';

// Datos de ejemplo por defecto
const defaultData = [
  {
    id: 'demo-1',
    name: 'EstacionKusFM',
    type: 'radio',
    category: 'Variedad',
    description: 'Radio con música variada y programación en vivo desde México',
    url: 'https://example.com/stream1',
    createdAt: Date.now()
  },
  {
    id: 'demo-2',
    name: 'Podcast Tech México',
    type: 'podcast',
    category: 'Tecnología',
    description: 'Conversaciones sobre tecnología, desarrollo y cultura digital',
    url: 'https://example.com/podcast1',
    createdAt: Date.now() - 86400000
  },
  {
    id: 'demo-3',
    name: 'Hits del Momento',
    type: 'musica',
    category: 'Pop / Hits',
    description: 'Las canciones más populares del momento en una sola lista',
    url: 'https://example.com/playlist1',
    createdAt: Date.now() - 172800000
  }
];

// Estado de la aplicación
let items = [];
let filteredItems = [];

// ============================================
// INICIALIZACIÓN
// ============================================

function init() {
  loadData();
  setupEventListeners();
  registerServiceWorker();
  renderContent();
  
  console.log(`LibreAudio PRO v${VERSION} inicializado`);
}

function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
}

// ============================================
// SERVICE WORKER
// ============================================

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('sw.js')
        .then((registration) => {
          console.log('[App] Service Worker registrado:', registration.scope);
        })
        .catch((error) => {
          console.error('[App] Error al registrar Service Worker:', error);
        });
    });
  }
}

// ============================================
// ALMACENAMIENTO DE DATOS
// ============================================

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        items = parsed;
      } else {
        items = [...defaultData];
        saveData();
      }
    } else {
      items = [...defaultData];
      saveData();
    }
  } catch (error) {
    console.error('[App] Error cargando datos:', error);
    items = [...defaultData];
  }
  filteredItems = [...items];
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('[App] Error guardando datos:', error);
  }
}

// ============================================
// RENDERIZADO
// ============================================

function renderContent() {
  const container = document.getElementById('contentList');
  if (!container) return;

  container.innerHTML = '';

  if (filteredItems.length === 0) {
    renderEmptyState(container);
    return;
  }

  const sortedItems = [...filteredItems].sort((a, b) => {
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  sortedItems.forEach((item) => {
    const itemElement = createItemElement(item);
    container.appendChild(itemElement);
  });
}

function renderEmptyState(container) {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.innerHTML = `
    <div class="empty-icon">📻</div>
    <p>No se encontraron resultados</p>
    <p style="font-size: 0.75rem; margin-top: 0.5rem;">Intenta ajustar tu búsqueda o agrega nuevo contenido</p>
  `;
  container.appendChild(empty);
}

function createItemElement(item) {
  const article = document.createElement('article');
  article.className = 'content-item';

  const header = document.createElement('div');
  header.className = 'item-header';

  const titleSection = document.createElement('div');
  titleSection.style.flex = '1';

  const title = document.createElement('div');
  title.className = 'item-title';
  title.textContent = item.name;

  const meta = document.createElement('div');
  meta.className = 'item-meta';
  meta.textContent = item.category
    ? `${item.category} · ${formatType(item.type)}`
    : formatType(item.type);

  titleSection.appendChild(title);
  titleSection.appendChild(meta);

  const typePill = document.createElement('span');
  typePill.className = `pill ${getPillClass(item.type)}`;
  typePill.textContent = getPillLabel(item.type);

  header.appendChild(titleSection);
  header.appendChild(typePill);

  const description = document.createElement('p');
  description.className = 'item-description';
  description.textContent = item.description || 'Sin descripción disponible';

  const actions = document.createElement('div');
  actions.className = 'item-actions';

  const openBtn = document.createElement('button');
  openBtn.className = 'btn btn-primary';
  openBtn.innerHTML = '<span class="btn-icon">▶</span> Abrir';
  openBtn.onclick = () => window.open(item.url, '_blank', 'noopener,noreferrer');

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-danger';
  deleteBtn.innerHTML = '<span class="btn-icon">🗑</span> Eliminar';
  deleteBtn.onclick = () => deleteItem(item.id);

  actions.appendChild(openBtn);
  actions.appendChild(deleteBtn);

  article.appendChild(header);
  article.appendChild(description);
  article.appendChild(actions);

  return article;
}

// ============================================
// UTILIDADES
// ============================================

function formatType(type) {
  const types = {
    radio: 'Radio en vivo',
    podcast: 'Podcast',
    musica: 'Música',
    audiolibro: 'Audiolibro'
  };
  return types[type] || 'Audio';
}

function getPillClass(type) {
  const classes = {
    radio: 'pill-live',
    podcast: 'pill-podcast',
    musica: 'pill-music',
    audiolibro: 'pill-audiobook'
  };
  return classes[type] || '';
}

function getPillLabel(type) {
  const labels = {
    radio: 'LIVE',
    podcast: 'PODCAST',
    musica: 'MÚSICA',
    audiolibro: 'LIBRO'
  };
  return labels[type] || 'AUDIO';
}

// ============================================
// BÚSQUEDA Y FILTRADO
// ============================================

function handleSearch(event) {
  const term = event.target.value.toLowerCase().trim();
  
  if (!term) {
    filteredItems = [...items];
  } else {
    filteredItems = items.filter((item) => {
      const searchableText = [
        item.name,
        item.category,
        item.description,
        formatType(item.type)
      ].join(' ').toLowerCase();
      
      return searchableText.includes(term);
    });
  }
  
  renderContent();
}

function resetFilter() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
  }
  filteredItems = [...items];
  renderContent();
}

// ============================================
// AGREGAR CONTENIDO
// ============================================

function openAddDialog() {
  const dialog = document.getElementById('addDialog');
  if (!dialog) return;

  // Limpiar formulario
  document.getElementById('addName').value = '';
  document.getElementById('addUrl').value = '';
  document.getElementById('addType').value = 'radio';
  document.getElementById('addCategory').value = '';
  document.getElementById('addDescription').value = '';

  dialog.showModal();
}

function saveNewItem(event) {
  event.preventDefault();

  const name = document.getElementById('addName').value.trim();
  const url = document.getElementById('addUrl').value.trim();
  const type = document.getElementById('addType').value;
  const category = document.getElementById('addCategory').value.trim();
  const description = document.getElementById('addDescription').value.trim();

  if (!name || !url) {
    alert('Por favor completa los campos obligatorios (Nombre y URL)');
    return;
  }

  const newItem = {
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    url,
    type,
    category,
    description,
    createdAt: Date.now()
  };

  items.unshift(newItem);
  saveData();
  resetFilter();

  const dialog = document.getElementById('addDialog');
  if (dialog) dialog.close();

  console.log('[App] Nuevo contenido agregado:', newItem);
}

// ============================================
// ELIMINAR CONTENIDO
// ============================================

function deleteItem(id) {
  if (!confirm('¿Estás seguro de eliminar este contenido?')) {
    return;
  }

  items = items.filter((item) => item.id !== id);
  saveData();
  resetFilter();

  console.log('[App] Contenido eliminado:', id);
}

// ============================================
// IMPORTAR / EXPORTAR
// ============================================

function exportData() {
  try {
    const dataStr = JSON.stringify(items, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `libreaudio-export-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log('[App] Datos exportados exitosamente');
  } catch (error) {
    console.error('[App] Error al exportar:', error);
    alert('Error al exportar los datos');
  }
}

function importData() {
  const input = document.getElementById('importFile');
  if (!input) return;

  input.value = '';
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        
        if (!Array.isArray(parsed)) {
          alert('Formato inválido. El archivo debe contener un array JSON.');
          return;
        }

        if (!confirm(`¿Importar ${parsed.length} elementos? Esto reemplazará los datos actuales.`)) {
          return;
        }

        items = parsed;
        saveData();
        resetFilter();
        
        console.log('[App] Datos importados exitosamente:', parsed.length, 'elementos');
      } catch (error) {
        console.error('[App] Error al importar:', error);
        alert('Error al leer el archivo. Verifica que sea un JSON válido.');
      }
    };
    
    reader.readAsText(file);
  };

  input.click();
}

// ============================================
// INICIAR APLICACIÓN
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
