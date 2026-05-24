const API_URL = '/api';
let allUsers = [];

function getAuth() {
  return {
    user: JSON.parse(localStorage.getItem('devops_user')) || null,
    token: localStorage.getItem('devops_token') || null,
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const { user, token } = getAuth();
  updateNavbar(user, token);
  cargarEstadisticasGlobales();
  cargarUsuarios();
  setupSearch();
});

function updateNavbar(user, token) {
  const loginBtn = document.getElementById('nav-login-btn');
  const dropdown = document.getElementById('nav-user-dropdown');
  const userName = document.getElementById('nav-user-name');

  if (user && token) {
    loginBtn.classList.add('hidden');
    dropdown.classList.remove('hidden');
    userName.textContent = user.nombre;

    document.getElementById('dropdown-toggle').onclick = (e) => {
      e.stopPropagation();
      document.getElementById('dropdown-menu').classList.toggle('hidden');
    };
    document.addEventListener('click', () => {
      document.getElementById('dropdown-menu').classList.add('hidden');
    });

    document.getElementById('nav-logout-link').onclick = () => {
      if (confirm('Cerrar sesion?')) {
        localStorage.removeItem('devops_user');
        localStorage.removeItem('devops_token');
        window.location.reload();
      }
    };

    const perfilLink = document.getElementById('nav-perfil-link');
    if (perfilLink) perfilLink.classList.remove('hidden-link');
  } else {
    loginBtn.classList.remove('hidden');
    dropdown.classList.add('hidden');
    if (perfilLink) perfilLink.classList.add('hidden-link');
  }
}

function setupSearch() {
  const input = document.getElementById('search-user');
  if (!input) return;

  let timeout;
  input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const q = input.value.toLowerCase().trim();
      if (!q) {
        renderUsers(allUsers);
        return;
      }
      const filtered = allUsers.filter(u =>
        u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
      renderUsers(filtered);
    }, 300);
  });
}

async function cargarEstadisticasGlobales() {
  try {
    const [usersRes, cursosRes] = await Promise.all([
      fetch(`${API_URL}/users`),
      fetch(`${API_URL}/cursos`),
    ]);
    const usersData = await usersRes.json();
    const cursosData = await cursosRes.json();

    const totalUsers = usersData.success ? usersData.users.length : 0;
    const totalCursos = cursosData.success ? cursosData.cursos.length : 0;

    // Calcular inscripciones totales de todos los usuarios
    let totalEnrollments = 0;
    if (usersData.success) {
      usersData.users.forEach(u => {
        totalEnrollments += parseInt(u.cursos_inscritos || 0);
      });
    }

    document.getElementById('total-users').textContent = totalUsers;
    document.getElementById('total-enrollments').textContent = totalEnrollments;
    document.getElementById('total-courses').textContent = totalCursos;
  } catch {
    document.getElementById('total-users').textContent = '0';
    document.getElementById('total-enrollments').textContent = '0';
    document.getElementById('total-courses').textContent = '0';
  }
}

async function cargarUsuarios() {
  const grid = document.getElementById('users-grid');
  if (!grid) return;

  try {
    const res = await fetch(`${API_URL}/users`);
    const data = await res.json();

    if (data.success) {
      allUsers = data.users;
      if (allUsers.length === 0) {
        grid.innerHTML = '<div class="empty-msg">Aun no hay estudiantes registrados.</div>';
        return;
      }
      renderUsers(allUsers);
    } else {
      grid.innerHTML = '<div class="empty-msg">Error al cargar usuarios.</div>';
    }
  } catch {
    grid.innerHTML = '<div class="empty-msg">Backend no disponible. Verifica que el servidor este corriendo.</div>';
  }
}

function renderUsers(users) {
  const grid = document.getElementById('users-grid');
  if (!grid) return;

  if (users.length === 0) {
    grid.innerHTML = '<div class="empty-msg">No se encontraron estudiantes con ese criterio.</div>';
    return;
  }

  grid.innerHTML = users.map(u => crearCardUsuario(u)).join('');
}

function crearCardUsuario(u) {
  const inicial = u.nombre.charAt(0).toUpperCase();
  const fecha = u.created_at
    ? new Date(u.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';
  const completados = parseInt(u.cursos_completados || 0);
  const inscritos = parseInt(u.cursos_inscritos || 0);

  return `
    <article class="user-card" onclick="mostrarDetalleUsuario(${u.id})">
      <div class="user-avatar">
        <span class="avatar-text">${inicial}</span>
      </div>
      <h3>${u.nombre}</h3>
      <p class="user-email">${u.email}</p>
      <div class="user-stats">
        <div class="user-stat">
          <span class="num">${inscritos}</span>
          <span class="lbl">Inscritos</span>
        </div>
        <div class="user-stat">
          <span class="num">${completados}</span>
          <span class="lbl">Completados</span>
        </div>
      </div>
      <p class="user-date">Miembro desde ${fecha}</p>
    </article>
  `;
}

async function mostrarDetalleUsuario(userId) {
  try {
    const res = await fetch(`${API_URL}/users/${userId}`);
    const data = await res.json();

    if (!data.success) {
      alert('Error al cargar detalle del usuario.');
      return;
    }

    const u = data.user;
    const cursos = data.cursos || [];
    const inicial = u.nombre.charAt(0).toUpperCase();
    const fecha = u.created_at
      ? new Date(u.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';

    let coursesHtml = '';
    if (cursos.length === 0) {
      coursesHtml = '<p class="empty-modal">Este estudiante aun no esta inscrito en ningun curso.</p>';
    } else {
      coursesHtml = cursos.map(c => {
        const nivelClass = c.nivel.toLowerCase().replace(/[^a-z]/g, '');
        return `
          <div class="modal-course-item">
            <div class="course-info">
              <h4>${c.titulo}</h4>
              <span class="meta">
                <span class="card-badge nivel-${nivelClass}" style="padding:0.15rem 0.5rem;font-size:0.7rem">${c.nivel}</span>
                <span style="margin-left:0.5rem">${c.categoria}</span>
              </span>
            </div>
            <div class="course-progress">
              <span class="pct">${c.progreso || 0}%</span>
              <span class="lbl">progreso</span>
            </div>
          </div>
        `;
      }).join('');
    }

    const modal = document.createElement('div');
    modal.className = 'user-modal';
    modal.innerHTML = `
      <div class="user-modal-content">
        <button class="close-btn" onclick="this.closest('.user-modal').remove()">&times;</button>
        <div class="modal-user-header">
          <div class="user-avatar">
            <span class="avatar-text">${inicial}</span>
          </div>
          <div class="modal-user-info">
            <h2>${u.nombre}</h2>
            <p class="email">${u.email}</p>
            <p class="date">Miembro desde ${fecha} &middot; ${u.cursos_inscritos} cursos inscritos</p>
          </div>
        </div>
        <div class="modal-courses">
          <h3>Cursos (${cursos.length})</h3>
          ${coursesHtml}
        </div>
      </div>
    `;

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);

    // Add the modal styles dynamically
    const style = document.createElement('style');
    style.textContent = `
      .user-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
        display: flex; justify-content: center; align-items: center; z-index: 1000; }
      .user-modal-content { background: var(--bg-secondary); border: 1px solid var(--glass-border);
        border-radius: 20px; padding: 2rem; width: 600px; max-width: 90vw;
        max-height: 80vh; overflow-y: auto; position: relative; }
      .user-modal-content .close-btn { position: absolute; top: 12px; right: 18px;
        font-size: 1.6rem; cursor: pointer; color: var(--text-secondary);
        background: none; border: none; transition: 0.3s; }
      .user-modal-content .close-btn:hover { color: white; transform: scale(1.1); }
      .modal-user-header { display: flex; align-items: center; gap: 1.5rem;
        margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--glass-border); }
      .modal-user-header .user-avatar { width: 72px; height: 72px;
        border-radius: 50%; background: linear-gradient(135deg, var(--accent-color), var(--accent-glow));
        display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .modal-user-header .user-avatar .avatar-text { font-size: 1.8rem; font-weight: 700; color: white; font-family: 'Outfit', sans-serif; }
      .modal-user-header .modal-user-info h2 { font-size: 1.5rem; margin-bottom: 0.2rem; }
      .modal-user-header .modal-user-info .email { color: var(--text-secondary); font-size: 0.9rem; }
      .modal-user-header .modal-user-info .date { color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.3rem; }
      .modal-courses h3 { font-size: 1.1rem; margin-bottom: 1rem; }
      .modal-course-item { display: flex; align-items: center; gap: 1rem; padding: 0.8rem;
        background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 10px; margin-bottom: 0.6rem; }
      .modal-course-item .course-info { flex: 1; }
      .modal-course-item .course-info h4 { font-size: 0.95rem; margin-bottom: 0.2rem; }
      .modal-course-item .course-info .meta { font-size: 0.78rem; color: var(--text-secondary); }
      .modal-course-item .course-progress { text-align: center; min-width: 60px; }
      .modal-course-item .course-progress .pct { font-weight: 700; font-size: 0.9rem;
        color: var(--accent-glow); font-family: 'Outfit', sans-serif; }
      .modal-course-item .course-progress .lbl { font-size: 0.7rem; color: var(--text-secondary); }
      .empty-modal { color: var(--text-secondary); text-align: center; padding: 2rem; }
    `;
    document.head.appendChild(style);
  } catch {
    alert('Error de conexion.');
  }
}