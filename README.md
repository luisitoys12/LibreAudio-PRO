# LibreAudio PRO 🎵

> Directorio open source para publicar, moderar y descubrir radios, podcasts y audio libre.  
> Stack: **Supabase** (PostgreSQL + Auth) + **Vanilla JS** + **GitHub Pages**. Sin servidor. Sin costos.

[![Deploy](https://img.shields.io/badge/demo-live-6C3EF7?style=flat-square)](https://luisitoys12.github.io/LibreAudio-PRO)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## ✨ Características

| Módulo | Descripción |
|--------|-------------|
| 🏠 **Directorio público** | Navega y busca contenido aprobado sin necesidad de cuenta |
| 🔍 **Filtros avanzados** | Por tipo (radio, podcast, música, stream en vivo), género e idioma |
| 🔐 **Auth con Supabase** | Email/contraseña + Google OAuth |
| 📤 **Envíos de usuarios** | Formulario para enviar contenido con URL externa |
| ✅ **Panel de moderación** | Admin puede aprobar, rechazar y eliminar contenido |
| 👤 **Perfil de usuario** | Edita tu información y ve tus envíos |
| 📱 **PWA instalable** | Funciona en móvil como app nativa |
| 🌙 **Dark mode** | Diseño dark siempre activo |

---

## 🚀 Setup en 10 minutos

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) → **New project**
2. Elige nombre, contraseña y región (ej. `us-east-1`)
3. Espera ~2 min a que inicialice

### 2. Ejecutar el schema SQL

1. En Supabase: **SQL Editor** → **New query**
2. Copia todo el contenido de [`sql/schema.sql`](sql/schema.sql)
3. Haz clic en **Run** ✓

### 3. Configurar credenciales en el frontend

Edita `docs/index.html`, líneas 38-39:

```html
<script>
  window.SUPABASE_URL  = 'https://TU_PROYECTO.supabase.co';  // Settings > API > URL
  window.SUPABASE_ANON = 'TU_ANON_KEY_PUBLICA';              // Settings > API > anon key
</script>
```

> ⚠️ La **anon key** es pública y segura de exponer en el frontend.  
> **Nunca** uses la `service_role` key en el frontend.

### 4. Activar Google OAuth (opcional)

1. Supabase → **Authentication** → **Providers** → **Google**
2. Sigue la guía para crear credenciales en Google Cloud Console
3. Agrega `https://TU_USUARIO.github.io` en las **Authorized redirect URIs** de Supabase

### 5. Hacer el primer admin

Después de registrarte, ejecuta esto en Supabase SQL Editor:

```sql
UPDATE public.profiles SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'TU_EMAIL@ejemplo.com');
```

### 6. Deploy en GitHub Pages

1. En tu repositorio: **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Haz push a `main` → el workflow despliega automáticamente
4. Tu app estará en: `https://TU_USUARIO.github.io/LibreAudio-PRO`

---

## 🗂️ Estructura del proyecto

```
LibreAudio-PRO/
├── docs/                  ← Frontend (servido por GitHub Pages)
│   ├── index.html         ← App shell + configuración Supabase
│   ├── app.js             ← Lógica completa (Router + Supabase)
│   ├── style.css          ← Design system dark
│   └── manifest.json      ← PWA manifest
├── sql/
│   └── schema.sql         ← Schema completo para Supabase
├── .github/
│   └── workflows/
│       └── deploy.yml     ← Auto-deploy a GitHub Pages
└── README.md
```

---

## 🔒 Seguridad (Row Level Security)

Todas las tablas tienen RLS activado con estas políticas:

| Tabla | Anon | Autenticado | Admin |
|-------|------|-------------|-------|
| `content` SELECT | Solo aprobados | Los suyos + aprobados | Todo |
| `content` INSERT | ✗ | Solo propios (pending) | ✓ |
| `content` UPDATE | ✗ | ✗ | ✓ |
| `content` DELETE | ✗ | Solo los suyos | ✓ |
| `profiles` SELECT | ✓ | ✓ | ✓ |
| `profiles` UPDATE | ✗ | Solo el propio | ✓ |

---

## 🛠️ Desarrollo local

No hay servidor que iniciar. Solo abre `docs/index.html` con Live Server (VS Code) o cualquier servidor HTTP estático:

```bash
# Con Python
cd docs && python3 -m http.server 8080

# Con Node.js
npx serve docs
```

---

## 📋 Variables de entorno

No hay `.env`. La configuración de Supabase va directamente en `docs/index.html`:

```html
window.SUPABASE_URL  = 'https://xxxxxxxxxxxx.supabase.co';
window.SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama: `git checkout -b feat/mi-feature`
3. Haz tus cambios y haz commit: `git commit -m "feat: descripción"`
4. Push: `git push origin feat/mi-feature`
5. Abre un Pull Request

---

## 📄 Licencia

MIT — Libre para usar, modificar y distribuir.

---

**LibreAudio PRO** — Democratizando el acceso al audio independiente 🎵
