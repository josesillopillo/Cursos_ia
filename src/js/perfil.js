const API_URL = '/api';

function getAuth() {
  return {
    user: JSON.parse(localStorage.getItem('devops_user')) || null,
    token: localStorage.getItem('devops_token') || null,
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const { user, token } = getAuth();
  if (!user || !token) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('nav-user-name').textContent = user.nombre;
  document.getElementById('dropdown-toggle').onclick = (e) => {
    e.stopPropagation();
    document.getElementById('dropdown-menu').classList.toggle('hidden');
  };
  document.addEventListener('click', () => {
    document.getElementById('dropdown-menu').classList.add('hidden');
  });
  document.getElementById('nav-logout-link').onclick = cerrarSesion;

  cargarPerfil();
});

function cerrarSesion() {
  if (confirm('Cerrar sesion?')) {
    localStorage.removeItem('devops_user');
    localStorage.removeItem('devops_token');
    window.location.href = 'index.html';
  }
}

function mostrarToast(mensaje, tipo = 'success') {
  const container = document.getElementById('toast-container') || document.body;
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.textContent = mensaje;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function cargarPerfil() {
  const { token } = getAuth();
  const container = document.getElementById('profile-container');
  if (!container) return;

  try {
    const [perfilRes, cursosRes] = await Promise.all([
      fetch(`${API_URL}/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/me/cursos`, { headers: { 'Authorization': `Bearer ${token}` } }),
    ]);
    const perfilData = await perfilRes.json();
    const cursosData = await cursosRes.json();

    // If user not found in DB (e.g. after DB reset), clear session
    if (perfilRes.status === 404) {
      localStorage.removeItem('devops_user');
      localStorage.removeItem('devops_token');
      window.location.href = 'index.html?session=expired';
      return;
    }

    if (!perfilData.success) throw new Error(perfilData.error);

    const u = perfilData.user;
    const cursos = cursosData.success ? cursosData.cursos : [];
    const inscritos = cursos.filter(c => c.inscrito);
    const completados = inscritos.filter(c => (c.progreso || 0) >= 100);
    const progresoTotal = inscritos.length > 0
      ? Math.round(inscritos.reduce((sum, c) => sum + (c.progreso || 0), 0) / inscritos.length)
      : 0;

    const fecha = u.created_at
      ? new Date(u.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Desconocida';

    // Progress by category
    const catMap = {};
    cursos.forEach(c => {
      if (!catMap[c.categoria]) catMap[c.categoria] = { total: 0, completed: 0 };
      catMap[c.categoria].total++;
      if (c.inscrito) {
        catMap[c.categoria].completed++;
      }
    });

    const catHtml = Object.entries(catMap).map(([cat, stats]) => {
      const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      return `
        <div class="category-progress-card">
          <span class="cat-name">${cat}</span>
          <div class="cat-bar-wrapper">
            <div class="cat-bar">
              <div class="cat-bar-fill" style="width:${pct}%"></div>
            </div>
          </div>
          <span class="cat-pct">${pct}%</span>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <!-- Profile Banner -->
      <div class="profile-banner">
        <div class="profile-avatar">
          <span class="avatar-text">${u.nombre.charAt(0).toUpperCase()}</span>
          <div class="avatar-badge">✓</div>
        </div>
        <div class="profile-info">
          <h1>${u.nombre}</h1>
          <p class="profile-email">${u.email}</p>
          <p class="profile-date">Miembro desde ${fecha}</p>
          <div class="profile-actions">
            <button class="btn-secondary" onclick="togglePanel('edit-panel')">Editar Perfil</button>
            <button class="btn-secondary" onclick="togglePanel('password-panel')">Cambiar Contrasena</button>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <span class="stat-number">${inscritos.length}</span>
          <span class="stat-label">Cursos Inscritos</span>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <span class="stat-number">${completados.length}</span>
          <span class="stat-label">Completados</span>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <span class="stat-number">${progresoTotal}%</span>
          <span class="stat-label">Progreso General</span>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <span class="stat-number">${cursos.length}</span>
          <span class="stat-label">Cursos Disponibles</span>
        </div>
      </div>

      <!-- Progress by Category -->
      <div class="category-progress-section">
        <h2>Progreso por Categoria</h2>
        ${catHtml}
      </div>

      <!-- Edit Panel -->
      <div id="edit-panel" class="edit-panel hidden">
        <h3>✏️ Editar Perfil</h3>
        <form id="edit-form">
          <div class="form-row">
            <div>
              <label>Nombre completo</label>
              <input type="text" id="edit-nombre" value="${u.nombre}" required>
            </div>
            <div>
              <label>Correo electronico</label>
              <input type="email" id="edit-email" value="${u.email}" required>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Guardar Cambios</button>
            <button type="button" class="btn-outline" onclick="togglePanel('edit-panel')">Cancelar</button>
          </div>
        </form>
        <p id="edit-msg" class="edit-msg"></p>
      </div>

      <!-- Password Panel -->
      <div id="password-panel" class="password-panel hidden">
        <h3>🔒 Cambiar Contrasena</h3>
        <form id="password-form">
          <input type="password" id="pass-current" placeholder="Contrasena actual" required>
          <input type="password" id="pass-new" placeholder="Nueva contrasena (min. 8 caracteres)" required>
          <input type="password" id="pass-confirm" placeholder="Confirmar nueva contrasena" required>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Actualizar Contrasena</button>
            <button type="button" class="btn-outline" onclick="togglePanel('password-panel')">Cancelar</button>
          </div>
        </form>
        <p id="pass-msg" class="pass-msg"></p>
      </div>

      <!-- Mis Cursos -->
      <section class="mis-cursos-section">
        <h2>Mis Cursos</h2>
        <div class="cursos-tabs">
          <button class="curso-tab active" data-tab="inscritos" onclick="switchCursosTab('inscritos')">Inscritos (${inscritos.length})</button>
          <button class="curso-tab" data-tab="disponibles" onclick="switchCursosTab('disponibles')">Disponibles (${cursos.length - inscritos.length})</button>
        </div>
        <div id="cursos-grid" class="cursos-grid">
          <div class="loading">Cargando cursos...</div>
        </div>
      </section>

      <!-- Danger Zone -->
      <div class="danger-zone">
        <h3>⚠️ Zona de Peligro</h3>
        <p>Eliminar tu cuenta eliminara permanentemente todos tus datos, inscripciones y progreso. Esta accion no se puede deshacer.</p>
        <button class="btn-outline" style="color:#f87171;border-color:rgba(248,113,113,0.3)" onclick="eliminarCuenta()">Eliminar mi cuenta</button>
      </div>
    `;

    // Event listeners
    document.getElementById('edit-form')?.addEventListener('submit', guardarPerfil);
    document.getElementById('password-form')?.addEventListener('submit', cambiarPassword);

    // Render initial tab
    switchCursosTab('inscritos');
  } catch {
    // If user not found (DB was reset), clear session
    if (perfilData && perfilData.status === 404) {
      localStorage.removeItem('devops_user');
      localStorage.removeItem('devops_token');
      window.location.href = 'index.html?session=expired';
      return;
    }
    container.innerHTML = `<div class="error-msg" style="text-align:center;padding:3rem">Error al cargar el perfil. <a href="index.html">Volver al inicio</a></div>`;
  }
}

function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.toggle('hidden');
    const msg = panel.querySelector('.edit-msg, .pass-msg');
    if (msg) msg.textContent = '';
  }
}

async function guardarPerfil(e) {
  e.preventDefault();
  const { token } = getAuth();
  const nombre = document.getElementById('edit-nombre').value;
  const email = document.getElementById('edit-email').value;
  const msg = document.getElementById('edit-msg');

  try {
    const res = await fetch(`${API_URL}/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ nombre, email }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('devops_user', JSON.stringify(data.user));
      localStorage.setItem('devops_token', data.token);
      msg.textContent = 'Perfil actualizado correctamente.';
      msg.style.color = '#4ade80';
      setTimeout(() => cargarPerfil(), 1000);
    } else {
      const detail = data.details ? data.details.map(d => d.message).join(', ') : data.error;
      msg.textContent = detail || 'Error al actualizar.';
      msg.style.color = '#f87171';
    }
  } catch {
    msg.textContent = 'Error de conexion con el servidor.';
    msg.style.color = '#f87171';
  }
}

async function cambiarPassword(e) {
  e.preventDefault();
  const { token } = getAuth();
  const current = document.getElementById('pass-current').value;
  const newPass = document.getElementById('pass-new').value;
  const confirm = document.getElementById('pass-confirm').value;
  const msg = document.getElementById('pass-msg');

  if (newPass !== confirm) {
    msg.textContent = 'Las contrasenas no coinciden.';
    msg.style.color = '#f87171';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/me/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ current_password: current, new_password: newPass }),
    });
    const data = await res.json();
    if (data.success) {
      msg.textContent = 'Contrasena actualizada correctamente.';
      msg.style.color = '#4ade80';
      document.getElementById('password-form').reset();
      setTimeout(() => togglePanel('password-panel'), 1500);
    } else {
      msg.textContent = data.error || 'Error al cambiar contrasena.';
      msg.style.color = '#f87171';
    }
  } catch {
    msg.textContent = 'Error de conexion.';
    msg.style.color = '#f87171';
  }
}

function switchCursosTab(tab) {
  document.querySelectorAll('.curso-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.curso-tab[data-tab="${tab}"]`)?.classList.add('active');
  renderCursos(tab);
}

async function renderCursos(tab) {
  const { token } = getAuth();
  const grid = document.getElementById('cursos-grid');
  if (!grid) return;

  try {
    const res = await fetch(`${API_URL}/me/cursos`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();

    if (!data.success) {
      grid.innerHTML = '<div class="empty-msg">Error al cargar cursos.</div>';
      return;
    }

    let cursos = tab === 'inscritos'
      ? data.cursos.filter(c => c.inscrito)
      : data.cursos.filter(c => !c.inscrito);

    if (cursos.length === 0) {
      grid.innerHTML = tab === 'inscritos'
        ? '<div class="empty-msg">No estas inscrito en ningun curso aun. <a href="index.html#cursos" class="btn-primary" style="display:inline-block;margin-top:1rem">Explorar Cursos</a></div>'
        : '<div class="empty-msg">Ya estas inscrito en todos los cursos disponibles.</div>';
      return;
    }

    grid.innerHTML = cursos.map(c => {
      if (tab === 'inscritos') return crearCardInscrito(c);
      return crearCardDisponible(c);
    }).join('');
  } catch {
    grid.innerHTML = '<div class="empty-msg">Error de conexion.</div>';
  }
}

function crearCardInscrito(c) {
  const nivelClass = c.nivel.toLowerCase().replace(/[^a-z]/g, '');
  const pct = c.progreso || 0;
  const fecha = c.inscrito_en
    ? new Date(c.inscrito_en).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  return `
    <article class="curso-card">
      <div class="card-top">
        <span class="card-badge nivel-${nivelClass}">${c.nivel}</span>
        <span style="font-size:0.78rem;color:var(--text-secondary)">${c.categoria}</span>
      </div>
      <h4>${c.titulo}</h4>
      <p class="card-desc">${c.descripcion}</p>
      <div class="progreso-wrapper">
        <div class="progreso-bar">
          <div class="progreso-fill" style="width:${pct}%"></div>
        </div>
        <span class="progreso-texto">${pct}% completo</span>
      </div>
      <div class="curso-meta">
        <span class="inscrito-date">${fecha ? 'Desde ' + fecha : ''}</span>
        <button class="btn-outline btn-small" onclick="cancelarInscripcion(${c.id}, '${c.titulo.replace(/'/g, "\\'")}')">Cancelar</button>
      </div>
    </article>
  `;
}

function crearCardDisponible(c) {
  return `
    <article class="curso-card">
      <div class="card-top">
        <span class="card-badge">${c.nivel}</span>
        <span style="font-size:0.78rem;color:var(--text-secondary)">${c.categoria}</span>
      </div>
      <h4>${c.titulo}</h4>
      <p class="card-desc">${c.descripcion}</p>
      <div class="curso-meta">
        <span style="font-size:0.8rem;color:var(--text-secondary)">${c.duracion_semanas} semanas</span>
        <button class="btn-primary btn-small" onclick="inscribirse(${c.id}, '${c.titulo.replace(/'/g, "\\'")}')">Inscribirme</button>
      </div>
    </article>
  `;
}

async function inscribirse(cursoId, titulo) {
  const { token } = getAuth();
  try {
    const res = await fetch(`${API_URL}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ curso_id: cursoId }),
    });
    const data = await res.json();
    if (data.success) {
      mostrarToast(`Inscrito en "${titulo}"`, 'success');
      renderCursos(document.querySelector('.curso-tab.active')?.dataset.tab || 'inscritos');
    } else {
      mostrarToast(data.error || 'Error al inscribir.', 'error');
    }
  } catch {
    mostrarToast('Error de conexion.', 'error');
  }
}

async function cancelarInscripcion(cursoId, titulo) {
  if (!confirm(`Cancelar inscripcion en "${titulo}"?`)) return;
  const { token } = getAuth();
  try {
    const res = await fetch(`${API_URL}/enroll/${cursoId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      mostrarToast(`Inscripcion en "${titulo}" cancelada.`, 'info');
      renderCursos(document.querySelector('.curso-tab.active')?.dataset.tab || 'inscritos');
    } else {
      mostrarToast(data.error || 'Error al cancelar.', 'error');
    }
  } catch {
    mostrarToast('Error de conexion.', 'error');
  }
}

async function eliminarCuenta() {
  if (!confirm('ESTA ACCION ES PERMANENTE. ¿Seguro que deseas eliminar tu cuenta?')) return;
  if (!confirm('Todos tus datos, inscripciones y progreso se perderan. ¿Continuar?')) return;

  const { token } = getAuth();
  try {
    const res = await fetch(`${API_URL}/me`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      localStorage.removeItem('devops_user');
      localStorage.removeItem('devops_token');
      window.location.href = 'index.html';
    } else {
      alert(data.error || 'Error al eliminar cuenta.');
    }
  } catch {
    alert('Error de conexion.');
  }
}

// Add btn-small styles
const style = document.createElement('style');
style.textContent = `
  .btn-small { padding: 0.4rem 0.9rem; font-size: 0.82rem; }
  .btn-outline.btn-small:hover { border-color: var(--accent-glow); color: var(--accent-glow); }
  .curso-card .curso-meta .btn-small { min-width: 90px; }
  .profile-actions .btn-secondary { font-size: 0.85rem; padding: 0.5rem 1.2rem; }
  .danger-zone .btn-outline:hover { background: rgba(248,113,113,0.1); }
`;
document.head.appendChild(style);