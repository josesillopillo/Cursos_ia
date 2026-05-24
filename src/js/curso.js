const API_URL = '/api';

function getAuth() {
  return {
    user: JSON.parse(localStorage.getItem('devops_user')) || null,
    token: localStorage.getItem('devops_token') || null,
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const { user, token } = getAuth();
  updateNavbar(user, token);

  const params = new URLSearchParams(window.location.search);
  const cursoId = params.get('id');
  if (!cursoId) {
    document.getElementById('curso-container').innerHTML = '<div class="empty-msg">Curso no especificado. <a href="index.html#cursos">Volver a cursos</a></div>';
    return;
  }
  cargarCurso(cursoId);
});

function updateNavbar(user, token) {
  const loginBtn = document.getElementById('nav-login-btn');
  const dropdown = document.getElementById('nav-user-dropdown');
  const userName = document.getElementById('nav-user-name');
  const perfilLink = document.getElementById('nav-perfil-link');

  if (user && token) {
    loginBtn.classList.add('hidden');
    dropdown.classList.remove('hidden');
    userName.textContent = user.nombre;
    if (perfilLink) perfilLink.classList.remove('hidden-link');

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
        window.location.href = 'index.html';
      }
    };
  } else {
    loginBtn.classList.remove('hidden');
    dropdown.classList.add('hidden');
    if (perfilLink) perfilLink.classList.add('hidden-link');
  }
}

async function cargarCurso(cursoId) {
  const container = document.getElementById('curso-container');
  if (!container) return;

  try {
    const { user, token } = getAuth();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Try to get enrollment status if logged in
    let inscrito = false;
    let progreso = 0;
    let inscritoEn = null;

    if (token) {
      try {
        const meRes = await fetch(`${API_URL}/me/cursos`, { headers });
        const meData = await meRes.json();
        if (meData.success) {
          const found = meData.cursos.find(c => c.id == cursoId);
          if (found) {
            inscrito = found.inscrito;
            progreso = found.progreso || 0;
            inscritoEn = found.inscrito_en;
          }
        }
      } catch {}
    }

    const res = await fetch(`${API_URL}/cursos`);
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = '<div class="empty-msg">Error al cargar el curso.</div>';
      return;
    }

    const curso = data.cursos.find(c => c.id == cursoId);
    if (!curso) {
      container.innerHTML = '<div class="empty-msg">Curso no encontrado. <a href="index.html#cursos">Volver a cursos</a></div>';
      return;
    }

    const iconMap = {
      brain: '🧠', message: '💬', chart: '📈', shield: '🛡️', bot: '🤖', search: '🔍',
      container: '📦', repeat: '🔄', cloud: '☁️', cpu: '⚡', aws: '🌐', activity: '📡',
      'git-branch': '🌿', terminal: '💻', database: '🗄️', 'bar-chart': '📊', sigma: 'Σ',
      layers: '📚', network: '🔗', book: '📖', camera: '📷', rocket: '🚀', zap: '⚡',
      sparkles: '✨', globe: '🌍', 'code-2': '🔧', server: '🖥️', 'file-type': '📄',
      lock: '🔒', 'shield-off': '🔓', 'cloud-off': '⛅', key: '🔑',
    };
    const iconChar = iconMap[curso.icono] || '📘';
    const nivelClass = curso.nivel.toLowerCase().replace(/[^a-z]/g, '');

    const fechaInscripcion = inscritoEn
      ? new Date(inscritoEn).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
      : null;

    const btnHtml = !user
      ? `<button class="btn-outline" onclick="window.location.href='index.html'">Iniciar sesion para inscribirte</button>`
      : inscrito
        ? `<div><span class="btn-inscrito" style="display:inline-block;margin-bottom:0.5rem">Inscrito ✓</span>
            <div class="progreso-wrapper" style="margin-top:0.5rem">
              <div class="progreso-bar"><div class="progreso-fill" style="width:${progreso}%"></div></div>
              <span class="progreso-texto">${progreso}% completo</span>
            </div>
            <button class="btn-outline btn-small" onclick="cancelarInscripcion(${curso.id})" style="margin-top:0.5rem">Cancelar inscripcion</button>
           </div>`
        : `<button class="btn-primary" onclick="inscribirse(${curso.id})">Inscribirme en este curso</button>`;

    container.innerHTML = `
      <div class="profile-banner" style="align-items:flex-start">
        <div class="profile-avatar" style="width:80px;height:80px;font-size:2.5rem">${iconChar}</div>
        <div class="profile-info">
          <h1>${curso.titulo}</h1>
          <p class="profile-email">${curso.categoria}</p>
          <p class="profile-date" style="margin-top:0.3rem">
            <span class="card-badge nivel-${nivelClass}">${curso.nivel}</span>
            <span style="margin-left:0.5rem">${curso.duracion_semanas} semanas</span>
          </p>
          <p style="margin-top:0.8rem;color:var(--text-secondary);font-size:0.92rem;line-height:1.6">${curso.descripcion}</p>
          ${fechaInscripcion ? `<p style="margin-top:0.5rem;font-size:0.8rem;color:var(--text-secondary)">Inscrito desde ${fechaInscripcion}</p>` : ''}
          <div style="margin-top:1.5rem">${btnHtml}</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <span class="stat-number">${curso.nivel}</span>
          <span class="stat-label">Nivel</span>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <span class="stat-number">${curso.duracion_semanas}</span>
          <span class="stat-label">Semanas</span>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏷️</div>
          <span class="stat-number">${curso.categoria}</span>
          <span class="stat-label">Categoria</span>
        </div>
      </div>

      <div class="edit-panel" style="margin-top:2rem">
        <h3>📖 Descripcion del Curso</h3>
        <p style="color:var(--text-secondary);font-size:0.92rem;line-height:1.8">${curso.descripcion}</p>
      </div>

      ${curso.objetivos ? `
      <div class="edit-panel">
        <h3>🎯 Objetivos del Curso</h3>
        <ul style="color:var(--text-secondary);font-size:0.88rem;line-height:1.8;padding-left:1.2rem">
          ${curso.objetivos.split('.').filter(o => o.trim()).map(o => `<li style="margin-bottom:0.4rem">${o.trim()}.</li>`).join('')}
        </ul>
      </div>` : ''}

      ${curso.requisitos ? `
      <div class="edit-panel">
        <h3>📋 Requisitos Previos</h3>
        <ul style="color:var(--text-secondary);font-size:0.88rem;line-height:1.8;padding-left:1.2rem">
          ${curso.requisitos.split('.').filter(r => r.trim()).map(r => `<li style="margin-bottom:0.4rem">${r.trim()}.</li>`).join('')}
        </ul>
      </div>` : ''}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;font-size:0.88rem">
        <div style="background:var(--glass-bg);padding:0.8rem;border-radius:10px;border:1px solid var(--glass-border)">
          <strong style="color:var(--accent-glow)">Nivel:</strong><br>
          <span style="color:var(--text-secondary)">${curso.nivel}</span>
        </div>
        <div style="background:var(--glass-bg);padding:0.8rem;border-radius:10px;border:1px solid var(--glass-border)">
          <strong style="color:var(--accent-glow)">Duracion:</strong><br>
          <span style="color:var(--text-secondary)">${curso.duracion_semanas} semanas</span>
        </div>
        <div style="background:var(--glass-bg);padding:0.8rem;border-radius:10px;border:1px solid var(--glass-border)">
          <strong style="color:var(--accent-glow)">Categoria:</strong><br>
          <span style="color:var(--text-secondary)">${curso.categoria}</span>
        </div>
        <div style="background:var(--glass-bg);padding:0.8rem;border-radius:10px;border:1px solid var(--glass-border)">
          <strong style="color:var(--accent-glow)">Curso ID:</strong><br>
          <span style="color:var(--text-secondary)">#${curso.id}</span>
        </div>
      </div>
    `;
  } catch {
    container.innerHTML = '<div class="empty-msg">Error de conexion. <a href="index.html#cursos">Volver a cursos</a></div>';
  }
}

async function inscribirse(cursoId) {
  const { token } = getAuth();
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
  try {
    const res = await fetch(`${API_URL}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ curso_id: cursoId }),
    });
    const data = await res.json();
    if (data.success) {
      mostrarToast(data.message, 'success');
      cargarCurso(cursoId);
    } else {
      mostrarToast(data.error, 'error');
      // If user not found in DB, clear session
      if (res.status === 404 || res.status === 500) {
        localStorage.removeItem('devops_user');
        localStorage.removeItem('devops_token');
        window.location.href = 'index.html?session=expired';
      }
    }
  } catch {
    mostrarToast('Error de conexion.', 'error');
  }
}

async function cancelarInscripcion(cursoId) {
  if (!confirm('Cancelar inscripcion en este curso?')) return;
  const { token } = getAuth();
  try {
    const res = await fetch(`${API_URL}/enroll/${cursoId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      mostrarToast('Inscripcion cancelada.', 'info');
      cargarCurso(cursoId);
    } else {
      mostrarToast(data.error, 'error');
    }
  } catch {
    mostrarToast('Error de conexion.', 'error');
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
  .toast { padding: 1rem 1.5rem; border-radius: 12px; font-weight: 600; font-size: 0.9rem;
    transform: translateY(20px); opacity: 0; transition: all 0.3s ease; max-width: 400px; margin-top: 0.5rem; }
  .toast.show { transform: translateY(0); opacity: 1; }
  .toast-success { background: rgba(74, 222, 128, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); }
  .toast-error { background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }
  .toast-info { background: rgba(96, 165, 250, 0.15); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.3); }
  .btn-small { padding: 0.4rem 0.9rem; font-size: 0.82rem; }
`;
document.head.appendChild(style);