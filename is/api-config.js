/* ============================================
   ÖZ EMG İNŞAAT — API Yapılandırması
   ============================================
   ÖNEMLİ: Backend'i Render'a (veya başka bir servise) deploy ettikten
   sonra, aşağıdaki API_BASE değerini kendi backend adresinizle
   değiştirin. Örnek: 'https://ozemg-backend.onrender.com/api'
   ============================================ */

window.API_BASE = 'https://YOUR-BACKEND-URL.onrender.com/api';

// Formspree form ID'nizi buraya yazın (https://formspree.io üzerinden
// oluşturduğunuz formun endpoint adresi, örn: 'https://formspree.io/f/xabcdwxy')
window.FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

// ---------- Ortak fetch yardımcı fonksiyonu ----------
window.apiFetch = async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('ozemg_admin_token');
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    options.headers || {}
  );
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(window.API_BASE + path, Object.assign({}, options, { headers }));

  if (res.status === 401) {
    // Oturum geçersiz/süresi dolmuş — admin sayfalarındaysak girişe yönlendir
    localStorage.removeItem('ozemg_admin_token');
    localStorage.removeItem('ozemg_admin_session');
    if (window.location.pathname.includes('/admin/') && !window.location.pathname.includes('admin-login')) {
      window.location.href = window.location.pathname.includes('/admin/')
        ? 'admin-login.html'
        : 'admin/admin-login.html';
    }
  }

  let data = null;
  try { data = await res.json(); } catch (e) { /* boş yanıt olabilir */ }

  if (!res.ok) {
    const err = new Error((data && (data.error || data.msg)) || 'İstek başarısız oldu.');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};
