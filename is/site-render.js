/* ============================================
   ÖZ EMG İNŞAAT - Site Render Engine
   API'den gelen veriyi (ayarlar, projeler, hizmetler,
   referanslar) sayfadaki ilgili alanlara yerleştirir.
   ============================================ */

(function () {
  'use strict';

  const ICONS = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;color:var(--gold-primary);flex-shrink:0;"><path d="M20 6L9 17l-5-5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  };

  const CATEGORY_LABELS = { konut: 'Konut', ticari: 'Ticari', endustriyel: 'Endüstriyel', tadilat: 'Tadilat', danismanlik: 'Danışmanlık' };

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // ==========================
  // SETTINGS BINDING
  // ==========================
  function applySettings(settings) {
    if (!settings) return;

    document.querySelectorAll('[data-site-text]').forEach(el => {
      const key = el.getAttribute('data-site-text');
      if (settings[key] !== undefined && settings[key] !== '') el.textContent = settings[key];
    });

    document.querySelectorAll('[data-site-html]').forEach(el => {
      const key = el.getAttribute('data-site-html');
      if (settings[key] !== undefined && settings[key] !== '') {
        el.innerHTML = escapeHtml(settings[key]).replace(/\n/g, '<br>');
      }
    });

    document.querySelectorAll('[data-site-href]').forEach(el => {
      const key = el.getAttribute('data-site-href');
      if (key === 'phone') {
        if (settings.phone) el.setAttribute('href', 'tel:' + settings.phone.replace(/[^\d+]/g, ''));
      } else if (key === 'email') {
        if (settings.email) el.setAttribute('href', 'mailto:' + settings.email);
      } else if (key === 'whatsapp-link') {
        if (settings.whatsapp) el.setAttribute('href', 'https://wa.me/' + settings.whatsapp.replace(/[^\d]/g, ''));
      } else if (['instagram', 'facebook', 'linkedin', 'youtube', 'twitter'].includes(key)) {
        if (settings[key]) el.setAttribute('href', settings[key]);
      }
    });

    document.querySelectorAll('[data-site-counter]').forEach(el => {
      const key = el.getAttribute('data-site-counter');
      const val = parseInt(settings[key], 10);
      if (!isNaN(val)) el.setAttribute('data-counter', String(val));
    });

    if (settings.metaDescription) {
      const metaTag = document.querySelector('meta[name="description"]');
      if (metaTag) metaTag.setAttribute('content', settings.metaDescription);
    }
  }

  // ==========================
  // PROJECTS
  // ==========================
  function projectCardHtml(p) {
    const catLabel = CATEGORY_LABELS[p.category] || p.category || '';
    const img = p.image && p.image.trim() ? p.image : 'images/project-commercial.webp';
    return `
      <article class="project" data-category="${escapeHtml(p.category)}">
        <div class="project-img">
          <span class="project-tag">${escapeHtml(catLabel)}</span>
          <img src="${escapeHtml(img)}" alt="${escapeHtml(p.title)}" loading="lazy">
          <div class="project-info">
            <h3>${escapeHtml(p.title)}</h3>
            <p>${escapeHtml(p.description || '')}</p>
          </div>
        </div>
        <div class="project-meta">
          <span>${ICONS.pin} ${escapeHtml(p.location || '')}</span>
          <span>${ICONS.clock} ${escapeHtml(p.year || '')}${p.duration ? ' · ' + escapeHtml(p.duration) : ''}</span>
        </div>
      </article>`;
  }

  function renderProjects(container, allProjects) {
    const limitAttr = container.getAttribute('data-limit');
    const featuredOnly = container.getAttribute('data-featured-only') === 'true';

    let list = allProjects.slice();
    if (featuredOnly) list = list.filter(p => p.featured);
    // En yeni projeler üstte (backend zaten created_at DESC ile döndürüyor)
    if (limitAttr && limitAttr !== 'all') {
      const n = parseInt(limitAttr, 10);
      if (!isNaN(n)) list = list.slice(0, n);
    }

    if (list.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:2rem 0;">Henüz proje eklenmemiş.</p>';
      return;
    }

    container.innerHTML = list.map(projectCardHtml).join('\n');

    // Kategori filtre butonlarını (varsa) yeniden bağla — projeler.html'de kullanılır
    const filterBtns = document.querySelectorAll('.project-filter');
    if (filterBtns.length) {
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const filter = btn.dataset.filter;
          container.querySelectorAll('.project').forEach(p => {
            if (filter === 'all' || p.dataset.category === filter) {
              p.classList.remove('hide');
              p.style.animation = 'fadeUp 500ms var(--ease) both';
            } else {
              p.classList.add('hide');
            }
          });
        });
      });
    }
  }

  // ==========================
  // SERVICES — SUMMARY CARDS (index.html)
  // ==========================
  function serviceCardHtml(s, index) {
    const num = String(index + 1).padStart(2, '0');
    const img = s.image && s.image.trim() ? s.image : 'images/service-industrial.webp';
    return `
      <a href="hizmetler.html#${escapeHtml(s.slug)}" class="service-card">
        <div class="service-img">
          <span class="service-num">${num}</span>
          <img src="${escapeHtml(img)}" alt="${escapeHtml(s.title)}" loading="lazy">
        </div>
        <div class="service-body">
          <h3>${escapeHtml(s.title)}</h3>
          <p>${escapeHtml(s.description || '')}</p>
          <span class="service-link">Detayları Gör ${ICONS.arrow}</span>
        </div>
      </a>`;
  }

  function renderServicesSummary(container, services) {
    const limitAttr = container.getAttribute('data-limit');
    let list = services.slice();
    if (limitAttr) {
      const n = parseInt(limitAttr, 10);
      if (!isNaN(n)) list = list.slice(0, n);
    }
    if (list.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:2rem 0;">Henüz hizmet eklenmemiş.</p>';
      return;
    }
    container.innerHTML = list.map(serviceCardHtml).join('\n');
  }

  // ==========================
  // SERVICES — FULL DETAIL BLOCKS (hizmetler.html)
  // Orijinal tasarımı (sol/sağ dönüşümlü görsel yerleşimi) korur.
  // ==========================
  function serviceDetailHtml(s, index) {
    const num = String(index + 1).padStart(2, '0');
    const imageFirst = index % 2 === 1; // 0=text-left, 1=image-left, dönüşümlü
    const img = s.image && s.image.trim() ? s.image : 'images/service-industrial.webp';
    const features = (s.features || '').split('|').map(f => f.trim()).filter(Boolean);

    const textBlock = `
        <div>
          <span class="eyebrow">${num} · ${escapeHtml(CATEGORY_LABELS[s.slug] || s.title)}</span>
          <h2 style="font-size:clamp(1.8rem, 3.5vw, 2.8rem); margin-bottom:1.2rem;">${escapeHtml(s.title)}</h2>
          <p style="font-size:1.05rem; line-height:1.8; margin-bottom:1.5rem;">${escapeHtml(s.description || '')}</p>
          ${features.length ? `<ul style="display:flex; flex-direction:column; gap:0.6rem; margin-bottom:2rem;">
            ${features.map(f => `<li style="display:flex; align-items:center; gap:0.7rem; color:var(--text-secondary);">${ICONS.check} ${escapeHtml(f)}</li>`).join('\n')}
          </ul>` : ''}
          <a href="iletisim.html#teklif" class="btn btn--gold">Bu Hizmet İçin Teklif Al ${ICONS.arrow}</a>
        </div>`;

    const imageBlock = `
        <div style="position:relative; border-radius:var(--radius-lg); overflow:hidden; aspect-ratio:4/3; border:1px solid var(--border-subtle);">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(s.title)}" style="width:100%; height:100%; object-fit:cover;">
        </div>`;

    const cols = imageFirst ? '1fr 1.1fr' : '1.1fr 1fr';
    const inner = imageFirst ? imageBlock + textBlock : textBlock + imageBlock;

    return `
      <div id="${escapeHtml(s.slug)}" class="service-detail reveal" style="display:grid; grid-template-columns:${cols}; gap:4rem; align-items:center; padding:4rem 0;">${inner}
      </div>
      <div class="glow-line"></div>`;
  }

  function renderServicesDetail(container, services) {
    if (services.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem 0;">Henüz hizmet eklenmemiş.</p>';
      return;
    }
    const blocks = services.map(serviceDetailHtml);
    // Son glow-line'ı kaldır (son bloktan sonra ayraç gerekmiyor)
    let html = blocks.join('\n');
    html = html.replace(/\s*<div class="glow-line"><\/div>\s*$/, '');
    container.innerHTML = html;
  }

  // ==========================
  // TESTIMONIALS
  // ==========================
  function initialsOf(name) {
    return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function testimonialCardHtml(t) {
    const rating = parseInt(t.rating, 10) || 5;
    return `
        <div class="testimonial">
          <span class="testimonial-quote">"</span>
          <p>${escapeHtml(t.text)}</p>
          <div class="testimonial-stars">${'★'.repeat(rating)}${'☆'.repeat(Math.max(0, 5 - rating))}</div>
          <div class="testimonial-author">
            <div class="testimonial-avatar">${escapeHtml(initialsOf(t.name))}</div>
            <div>
              <div class="testimonial-name">${escapeHtml(t.name)}</div>
              <div class="testimonial-role">${escapeHtml(t.role || '')}${t.role && t.location ? ' · ' : ''}${escapeHtml(t.location || '')}</div>
            </div>
          </div>
        </div>`;
  }

  function renderTestimonials(container, testimonials) {
    const limitAttr = container.getAttribute('data-limit');
    let list = testimonials.slice();
    if (limitAttr) {
      const n = parseInt(limitAttr, 10);
      if (!isNaN(n)) list = list.slice(0, n);
    }
    if (list.length === 0) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = list.map(testimonialCardHtml).join('\n');
  }

  // ==========================
  // INIT
  // ==========================
  async function init() {
    if (!window.apiFetch) {
      console.error('site-render.js: apiFetch bulunamadı. api-config.js dosyasının önce yüklendiğinden emin olun.');
      return;
    }

    // Ayarları önce ve hızlıca uygula (istatistik sayaçları için önemli)
    try {
      const settings = await window.apiFetch('/settings');
      applySettings(settings);
    } catch (err) {
      console.error('Ayarlar yüklenemedi:', err);
    }

    const needsProjects = document.querySelector('[data-render="projects"]');
    const needsServices = document.querySelector('[data-render="services"]');
    const needsServicesDetail = document.querySelector('[data-render="services-detail"]');
    const needsTestimonials = document.querySelector('[data-render="testimonials"]');

    const tasks = [];
    if (needsProjects) tasks.push(window.apiFetch('/projects').then(data => {
      document.querySelectorAll('[data-render="projects"]').forEach(c => renderProjects(c, data));
    }).catch(err => console.error('Projeler yüklenemedi:', err)));

    if (needsServices) tasks.push(window.apiFetch('/services').then(data => {
      document.querySelectorAll('[data-render="services"]').forEach(c => renderServicesSummary(c, data));
    }).catch(err => console.error('Hizmetler yüklenemedi:', err)));

    if (needsServicesDetail) tasks.push(window.apiFetch('/services').then(data => {
      document.querySelectorAll('[data-render="services-detail"]').forEach(c => renderServicesDetail(c, data));
    }).catch(err => console.error('Hizmet detayları yüklenemedi:', err)));

    if (needsTestimonials) tasks.push(window.apiFetch('/testimonials').then(data => {
      document.querySelectorAll('[data-render="testimonials"]').forEach(c => renderTestimonials(c, data));
    }).catch(err => console.error('Referanslar yüklenemedi:', err)));

    await Promise.all(tasks);

    // Yeni eklenen kartların scroll-reveal ve sayaç animasyonlarına dahil olması için
    if (window.refreshScrollAnimations) window.refreshScrollAnimations();

    // Sayfa yüklendiğinde URL'de #hash varsa (örn. hizmetler.html#konut), ilgili
    // bölüme kaydır (içerik artık DOM'da olduğu için tekrar denemek gerekiyor)
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
