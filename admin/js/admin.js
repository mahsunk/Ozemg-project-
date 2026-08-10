/* ============================================
   ÖZ EMG İNŞAAT - Admin Panel JavaScript
   Gerçek backend API'sine bağlı sürüm (localStorage değil)
   ============================================ */

'use strict';

// ==========================
// UTILITIES
// ==========================

// Generate unique ID (yalnızca geçici/istemci-içi kullanım için)
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Date formatter
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'az önce';
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} s. önce`;
  const d = Math.floor(h / 24);
  return `${d} g. önce`;
}

// Initials
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Backend snake_case alan adlarını (created_at, updated_at, sort_order)
// mevcut sayfa kodlarının beklediği camelCase (createdAt, updatedAt,
// sortOrder) biçimine çevirir. API'den gelen her kayıt bu süzgeçten geçer.
function camelizeKeys(value) {
  if (Array.isArray(value)) return value.map(camelizeKeys);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const camelKey = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      out[k] = v;        // orijinal snake_case alanı da koru (geriye dönük uyum)
      out[camelKey] = v; // camelCase karşılığını da ekle
    }
    return out;
  }
  return value;
}

// ==========================
// AUTH
// ==========================
const SESSION_KEY = 'ozemg_admin_session';
const TOKEN_KEY = 'ozemg_admin_token';

async function login(username, password) {
  try {
    const result = await window.apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (result.ok) {
      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
    }
    return result;
  } catch (err) {
    return { ok: false, msg: err.message || 'Giriş başarısız oldu.' };
  }
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'admin-login.html';
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

function requireAuth() {
  const session = getSession();
  const token = localStorage.getItem(TOKEN_KEY);
  if (!session || !token) { window.location.href = 'admin-login.html'; return false; }
  return session;
}

// ==========================
// TOAST NOTIFICATIONS
// ==========================
function toast(msg, type = 'success') {
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>'
  };
  let c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `${icons[type] || icons.success}<span class="toast-msg">${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, 3500);
}

// ==========================
// MODAL
// ==========================
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
}
function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeAllModals();
  if (e.key === 'Escape') closeAllModals();
});

// ==========================
// CONFIRM DIALOG
// ==========================
function adminConfirm(msg) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.style.zIndex = '9998';
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px;">
        <div class="modal-header">
          <span class="modal-title">⚠️ Onay</span>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-secondary);font-size:0.95rem;line-height:1.6;">${msg}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn--outline btn--sm" id="cf-cancel">İptal</button>
          <button class="btn btn--danger btn--sm" id="cf-ok">Sil</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('cf-cancel').onclick = () => { overlay.remove(); resolve(false); };
    document.getElementById('cf-ok').onclick = () => { overlay.remove(); resolve(true); };
  });
}

// ==========================
// LOCAL CACHE
// ==========================
// Sayfa yüklendiğinde initAllData() ile API'den bir kez çekilir.
// Senkron getX() fonksiyonları (mevcut sayfa kodlarıyla uyumlu olması
// için) bu önbellekten okur; addX/updateX/deleteX önbelleği de günceller.
const cache = {
  projects: [],
  services: [],
  testimonials: [],
  messages: [],
  settings: {},
  blog: [],
};

async function initAllData() {
  try {
    const [projects, services, testimonials, messages, settings, blog] = await Promise.all([
      window.apiFetch('/projects'),
      window.apiFetch('/services'),
      window.apiFetch('/testimonials'),
      window.apiFetch('/messages'),
      window.apiFetch('/settings'),
      window.apiFetch('/blog?all=1'),
    ]);
    cache.projects = camelizeKeys(projects || []);
    cache.services = camelizeKeys(services || []);
    cache.testimonials = camelizeKeys(testimonials || []);
    cache.messages = camelizeKeys(messages || []);
    cache.settings = settings || {};
    cache.blog = camelizeKeys(blog || []);
  } catch (err) {
    console.error('Veri yüklenirken hata oluştu:', err);
    toast('Veriler yüklenemedi. İnternet bağlantınızı ve backend adresini kontrol edin.', 'error');
  }
}

// ==========================
// DATA: PROJECTS
// ==========================
function getProjects() { return cache.projects; }

async function addProject(data) {
  const item = await window.apiFetch('/projects', { method: 'POST', body: JSON.stringify(data) });
  const citem = camelizeKeys(item);
  cache.projects.unshift(citem);
  return citem;
}
async function updateProject(id, data) {
  const item = await window.apiFetch(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  const citem = camelizeKeys(item);
  const idx = cache.projects.findIndex(p => String(p.id) === String(id));
  if (idx !== -1) cache.projects[idx] = citem;
  return citem;
}
function deleteProject(id) {
  cache.projects = cache.projects.filter(p => String(p.id) !== String(id));
  window.apiFetch(`/projects/${id}`, { method: 'DELETE' }).catch(err => {
    console.error(err);
    toast('Proje silinirken bir sorun oluştu.', 'error');
  });
}

// ==========================
// DATA: SERVICES
// ==========================
function getServices() { return cache.services; }

async function addService(data) {
  const item = await window.apiFetch('/services', { method: 'POST', body: JSON.stringify(data) });
  const citem = camelizeKeys(item);
  cache.services.push(citem);
  return citem;
}
async function updateService(id, data) {
  const item = await window.apiFetch(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  const citem = camelizeKeys(item);
  const idx = cache.services.findIndex(s => String(s.id) === String(id));
  if (idx !== -1) cache.services[idx] = citem;
  return citem;
}
function deleteService(id) {
  cache.services = cache.services.filter(s => String(s.id) !== String(id));
  window.apiFetch(`/services/${id}`, { method: 'DELETE' }).catch(err => {
    console.error(err);
    toast('Hizmet silinirken bir sorun oluştu.', 'error');
  });
}

// ==========================
// DATA: REFERENCES (testimonials)
// ==========================
function getReferences() { return cache.testimonials; }

async function addReference(data) {
  const item = await window.apiFetch('/testimonials', { method: 'POST', body: JSON.stringify(data) });
  const citem = camelizeKeys(item);
  cache.testimonials.unshift(citem);
  return citem;
}
async function updateReference(id, data) {
  const item = await window.apiFetch(`/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  const citem = camelizeKeys(item);
  const idx = cache.testimonials.findIndex(r => String(r.id) === String(id));
  if (idx !== -1) cache.testimonials[idx] = citem;
  return citem;
}
function deleteReference(id) {
  cache.testimonials = cache.testimonials.filter(r => String(r.id) !== String(id));
  window.apiFetch(`/testimonials/${id}`, { method: 'DELETE' }).catch(err => {
    console.error(err);
    toast('Referans silinirken bir sorun oluştu.', 'error');
  });
}

// ==========================
// DATA: MESSAGES
// ==========================
function getMessages() { return cache.messages; }

function markRead(id) {
  const idx = cache.messages.findIndex(m => String(m.id) === String(id));
  if (idx !== -1) cache.messages[idx].read = true;
  window.apiFetch(`/messages/${id}/read`, { method: 'PUT', body: JSON.stringify({ read: true }) }).catch(err => console.error(err));
}
function setMessageRead(id, read) {
  const idx = cache.messages.findIndex(m => String(m.id) === String(id));
  if (idx !== -1) cache.messages[idx].read = read;
  window.apiFetch(`/messages/${id}/read`, { method: 'PUT', body: JSON.stringify({ read: !!read }) }).catch(err => console.error(err));
}
function deleteMessage(id) {
  cache.messages = cache.messages.filter(m => String(m.id) !== String(id));
  window.apiFetch(`/messages/${id}`, { method: 'DELETE' }).catch(err => {
    console.error(err);
    toast('Mesaj silinirken bir sorun oluştu.', 'error');
  });
}
function unreadCount() { return cache.messages.filter(m => !m.read).length; }

// ==========================
// DATA: SETTINGS
// ==========================
function getSettings() { return cache.settings; }
async function saveSettings(data) {
  const settings = await window.apiFetch('/settings', { method: 'PUT', body: JSON.stringify(data) });
  cache.settings = settings;
  return settings;
}

// ==========================
// DATA: BLOG
// ==========================
function getBlog() { return cache.blog; }

async function addBlogPost(data) {
  const item = await window.apiFetch('/blog', { method: 'POST', body: JSON.stringify(data) });
  const citem = camelizeKeys(item);
  cache.blog.unshift(citem);
  return citem;
}
async function updateBlogPost(id, data) {
  const item = await window.apiFetch(`/blog/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  const citem = camelizeKeys(item);
  const idx = cache.blog.findIndex(p => String(p.id) === String(id));
  if (idx !== -1) cache.blog[idx] = citem;
  return citem;
}
function deleteBlogPost(id) {
  cache.blog = cache.blog.filter(p => String(p.id) !== String(id));
  window.apiFetch(`/blog/${id}`, { method: 'DELETE' }).catch(err => {
    console.error(err);
    toast('Yazı silinirken bir sorun oluştu.', 'error');
  });
}

// ==========================
// PASSWORD CHANGE
// ==========================
async function changePassword(currentPassword, newPassword) {
  return window.apiFetch('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// ==========================
// UPDATE SIDEBAR BADGES
// ==========================
function updateSidebarBadges() {
  const unread = unreadCount();
  const badge = document.getElementById('msgBadge');
  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread > 0 ? '' : 'none';
    badge.className = unread > 0 ? 'nav-badge danger' : 'nav-badge';
  }
}

// ==========================
// RENDER HELPERS
// ==========================
function renderStars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

// Category badge color
function catColor(cat) {
  const map = { konut: 'gold', ticari: 'info', endustriyel: 'warning', tadilat: 'success', danismanlik: 'danger' };
  return map[cat] || 'info';
}
function catLabel(cat) {
  const map = { konut: 'Konut', ticari: 'Ticari', endustriyel: 'Endüstriyel', tadilat: 'Tadilat', danismanlik: 'Danışmanlık' };
  return map[cat] || cat;
}

// Status badge
function statusBadge(status) {
  if (status === 'published') return '<span class="badge badge-success">✓ Yayında</span>';
  if (status === 'draft') return '<span class="badge badge-warning">✎ Taslak</span>';
  return '';
}

// Image preview on file input (base64 data URL — doğrudan sunucuya
// bu haliyle gönderilir ve "image" alanında saklanır)
function bindImagePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) { preview.innerHTML = ''; return; }
    const reader = new FileReader();
    reader.onload = e => { preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`; };
    reader.readAsDataURL(file);
  });
}

// ==========================
// EXPORT
// ==========================
window.Admin = {
  // auth
  login, logout, getSession, requireAuth, changePassword,
  // toast
  toast,
  // modal
  openModal, closeModal, closeAllModals,
  // confirm
  confirm: adminConfirm,
  // data
  getProjects, addProject, updateProject, deleteProject,
  getServices, addService, updateService, deleteService,
  getMessages, markRead, setMessageRead, deleteMessage, unreadCount,
  getReferences, addReference, updateReference, deleteReference,
  getSettings, saveSettings,
  getBlog, addBlogPost, updateBlogPost, deleteBlogPost,
  // helpers
  initAllData, updateSidebarBadges,
  formatDate, formatDateTime, timeAgo, initials, uid,
  renderStars, catColor, catLabel, statusBadge,
  bindImagePreview,
};
