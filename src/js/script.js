const API_URL = '/api';
let currentUser = JSON.parse(localStorage.getItem('devops_user')) || null;
let authToken = localStorage.getItem('devops_token') || null;

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimation();
  cargarCategorias();
  cargarCursos();
});

function initNavbar() {
  const loginBtn = document.getElementById('nav-login-btn');
  const dropdown = document.getElementById('nav-user-dropdown');
  const userName = document.getElementById('nav-user-name');
  const perfilLink = document.getElementById('nav-perfil-link');

  if (currentUser && authToken) {
    loginBtn.classList.add('hidden');
    dropdown.classList.remove('hidden');
    userName.textContent = currentUser.nombre;
    if (perfilLink) perfilLink.classList.remove('hidden-link');

    document.getElementById('dropdown-toggle').onclick = (e) => {
      e.stopPropagation();
      document.getElementById('dropdown-menu').classList.toggle('hidden');
    };
    document.addEventListener('click', () => {
      const menu = document.getElementById('dropdown-menu');
      if (menu) menu.classList.add('hidden');
    });

    document.getElementById('nav-logout-link').onclick = () => {
      if (confirm('Cerrar sesion?')) {
        localStorage.removeItem('devops_user');
        localStorage.removeItem('devops_token');
        window.location.reload();
      }
    };
  } else {
    loginBtn.classList.remove('hidden');
    dropdown.classList.add('hidden');
    if (perfilLink) perfilLink.classList.add('hidden-link');
  }
}

function initScrollAnimation() {
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const cards = document.querySelectorAll('.course-card');
  cards.forEach((card, index) => {
    if (!card.style.opacity || card.style.opacity === '0') {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = `all 0.6s ease ${index * 0.05}s`;
    }
    observer.observe(card);
  });
}

// ======== CATEGORIAS ========
async function cargarCategorias() {
  const container = document.getElementById('category-filters');
  if (!container) return;
  try {
    const res = await fetch(`${API_URL}/categorias`);
    const data = await res.json();
    if (data.success) {
      data.categorias.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.categoria = cat.categoria;
        btn.textContent = `${cat.categoria} (${cat.total})`;
        btn.onclick = () => filtrarCursos(cat.categoria);
        container.appendChild(btn);
      });
    }
  } catch {
    // Backend no disponible
  }
}

async function filtrarCursos(categoria) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.filter-btn[data-categoria="${categoria}"]`);
  if (btn) btn.classList.add('active');
  await cargarCursos(categoria === 'todas' ? null : categoria);
}

// ======== CURSOS ========
async function cargarCursos(categoriaFiltro = null) {
  const grid = document.getElementById('courses-grid');
  if (!grid) return;
  grid.innerHTML = crearSkeletonCursos();

  try {
    const url = categoriaFiltro ? `${API_URL}/cursos?categoria=${encodeURIComponent(categoriaFiltro)}` : `${API_URL}/cursos`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      let cursos = data.cursos;

      if (!categoriaFiltro) {
        const categorias = agruparPorCategoria(cursos);
        grid.innerHTML = '';
        categorias.forEach(([cat, cursosCat]) => {
          const section = document.createElement('div');
          section.className = 'category-group';
          section.innerHTML = `
            <h3 class="category-title">${cat} <span class="category-count">${cursosCat.length} cursos</span></h3>
            <div class="category-courses">${cursosCat.map(c => crearCardCurso(c)).join('')}</div>
          `;
          grid.appendChild(section);
        });
      } else {
        grid.innerHTML = `<div class="category-courses">${cursos.map(c => crearCardCurso(c)).join('')}</div>`;
        if (cursos.length === 0) {
          grid.innerHTML = '<div class="empty-msg">No hay cursos en esta categoria.</div>';
        }
      }
      initScrollAnimation();
    } else {
      grid.innerHTML = '<div class="empty-msg">Error al cargar cursos.</div>';
    }
  } catch {
    grid.innerHTML = '<div class="empty-msg">Backend no disponible. Verifica que el servidor este corriendo.</div>';
  }
}

function agruparPorCategoria(cursos) {
  const map = {};
  cursos.forEach(c => {
    if (!map[c.categoria]) map[c.categoria] = [];
    map[c.categoria].push(c);
  });
  return Object.entries(map);
}

function crearCardCurso(c) {
  const inscrito = c.inscrito !== undefined ? c.inscrito : false;
  const nivelClass = c.nivel.toLowerCase().replace(/[^a-z]/g, '');
  const iconMap = {
    brain: '🧠', message: '💬', chart: '📈', shield: '🛡️', bot: '🤖', search: '🔍',
    container: '📦', repeat: '🔄', cloud: '☁️', cpu: '⚡', aws: '🌐', activity: '📡',
    'git-branch': '🌿', terminal: '💻', database: '🗄️', 'bar-chart': '📊', sigma: 'Σ',
    layers: '📚', network: '🔗', book: '📖', camera: '📷', rocket: '🚀', zap: '⚡',
    sparkles: '✨', globe: '🌍', 'code-2': '🔧', server: '🖥️', 'file-type': '📄',
    lock: '🔒', 'shield-off': '🔓', 'cloud-off': '⛅', key: '🔑',
  };
  const iconChar = iconMap[c.icono] || '📘';

  const btnHtml = currentUser
    ? (inscrito
        ? `<button class="btn-inscrito" onclick="event.stopPropagation();alert('Ya estas inscrito en ${c.titulo}')">Inscrito ✓</button>`
        : `<button class="btn-primary" onclick="event.stopPropagation();inscribirse('${c.titulo}', ${c.id})">Inscribirme</button>`)
    : `<button class="btn-outline" onclick="event.stopPropagation();toggleModal()">Iniciar sesion</button>`;

  return `
    <article class="course-card" data-curso-id="${c.id}" onclick="window.location.href='curso.html?id=${c.id}'" style="cursor:pointer">
      <div class="card-header">
        <span class="card-badge nivel-${nivelClass}">${c.nivel}</span>
        <span class="card-icon">${iconChar}</span>
      </div>
      <h3>${c.titulo}</h3>
      <p>${c.descripcion}</p>
      <div class="course-meta">
        <span>${c.duracion_semanas} Semanas</span>
        <span>${c.categoria}</span>
      </div>
      ${btnHtml}
    </article>
  `;
}

// ======== AUTH ========
function toggleModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.toggle('hidden');
    document.getElementById('auth-message').textContent = '';
  }
}

function switchTab(tab) {
  document.getElementById('auth-message').textContent = '';
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
  }
}

function handleAuthSuccess(user, token) {
  currentUser = user;
  authToken = token;
  localStorage.setItem('devops_user', JSON.stringify(currentUser));
  localStorage.setItem('devops_token', authToken);

  const loginBtn = document.getElementById('nav-login-btn');
  const dropdown = document.getElementById('nav-user-dropdown');
  const userName = document.getElementById('nav-user-name');
  const perfilLink = document.getElementById('nav-perfil-link');

  loginBtn.classList.add('hidden');
  dropdown.classList.remove('hidden');
  userName.textContent = user.nombre;
  if (perfilLink) perfilLink.classList.remove('hidden-link');

  document.getElementById('dropdown-toggle').onclick = (e) => {
    e.stopPropagation();
    document.getElementById('dropdown-menu').classList.toggle('hidden');
  };
  document.getElementById('nav-logout-link').onclick = () => {
    if (confirm('Cerrar sesion?')) {
      localStorage.removeItem('devops_user');
      localStorage.removeItem('devops_token');
      window.location.reload();
    }
  };

  toggleModal();
  cargarCursos(document.querySelector('.filter-btn.active')?.dataset.categoria || null);
}

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const msg = document.getElementById('auth-message');

  try {
    const req = await fetch(`${API_URL}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const res = await req.json();
    if (res.success) {
      handleAuthSuccess(res.user, res.token);
    } else {
      msg.textContent = res.error || 'Error de autenticacion.';
    }
  } catch {
    msg.textContent = 'Error: Backend inalcanzable. Verifica que el servidor este corriendo.';
  }
});

document.getElementById('register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const msg = document.getElementById('auth-message');

  try {
    const req = await fetch(`${API_URL}/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password })
    });
    const res = await req.json();
    if (res.success) {
      handleAuthSuccess(res.user, res.token);
    } else {
      const detailMsg = res.details ? res.details.map(d => d.message).join(', ') : res.error;
      msg.textContent = detailMsg || 'Error al registrarse.';
    }
  } catch {
    msg.textContent = 'Error: Backend inalcanzable. Verifica que el servidor este corriendo.';
  }
});

// ======== INSCRIPCION ========
async function inscribirse(nombreCurso, cursoId) {
  if (!currentUser) {
    toggleModal();
    return;
  }
  try {
    const req = await fetch(`${API_URL}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ curso_id: cursoId })
    });
    const res = await req.json();
    if (res.success) {
      mostrarToast(res.message, 'success');
      cargarCursos(document.querySelector('.filter-btn.active')?.dataset.categoria || null);
    } else {
      mostrarToast(res.error || 'Error al inscribirte.', 'error');
    }
  } catch {
    mostrarToast('Error: Backend inalcanzable.', 'error');
  }
}

// ======== TOAST ========
function mostrarToast(mensaje, tipo = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.textContent = mensaje;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function crearSkeletonCursos() {
  const cards = Array(6).fill('').map(() => `
    <div class="course-card skeleton-card">
      <div class="card-header">
        <div class="skeleton skeleton-badge"></div>
        <div class="skeleton skeleton-icon"></div>
      </div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
      <div class="course-meta">
        <div class="skeleton skeleton-meta"></div>
        <div class="skeleton skeleton-meta"></div>
      </div>
      <div class="skeleton skeleton-btn"></div>
    </div>
  `).join('');
  return `<div class="category-courses skeleton-grid">${cards}</div>`;
}

// Add dropdown styles
const style = document.createElement('style');
style.textContent = `
  .user-dropdown { position: relative; display: inline-block; }
  .dropdown-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1.2rem; font-size: 0.85rem; }
  .dropdown-arrow { font-size: 0.7rem; }
  .dropdown-menu { position: absolute; top: 100%; right: 0; margin-top: 0.5rem;
    background: var(--bg-secondary); border: 1px solid var(--glass-border);
    border-radius: 12px; padding: 0.5rem; min-width: 180px; z-index: 200;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  .dropdown-item { display: block; width: 100%; padding: 0.6rem 1rem;
    color: var(--text-secondary); font-family: 'Inter', sans-serif; font-size: 0.88rem;
    border-radius: 8px; transition: all 0.2s ease; cursor: pointer;
    background: none; border: none; text-align: left; text-decoration: none; }
  .dropdown-item:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
  .logout-item { color: #f87171; }
  .logout-item:hover { background: rgba(248,113,113,0.1); color: #f87171; }
  .dropdown-divider { border: none; border-top: 1px solid var(--glass-border); margin: 0.3rem 0; }
  .hidden { display: none !important; }
`;
document.head.appendChild(style);