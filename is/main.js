/* ============================================
   ÖZ EMG İNŞAAT - Ana JavaScript
   ============================================ */

(function() {
  'use strict';

  // ---------- Sticky Navbar ----------
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const onScroll = () => {
      if (window.scrollY > 30) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- Mobile Menu ----------
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
      document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
    });
    navMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ---------- Active Nav Link ----------
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ---------- Scroll Reveal (dinamik içerik eklendiğinde tekrar çağrılabilir) ----------
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal:not(.reveal-bound), .reveal-stagger:not(.reveal-bound)');
    if (reveals.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
      reveals.forEach(el => { el.classList.add('reveal-bound'); observer.observe(el); });
    }
  }
  initScrollReveal();

  // ---------- Number Counter (dinamik içerik eklendiğinde tekrar çağrılabilir) ----------
  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]:not(.counter-bound)');
    if (counters.length > 0) {
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.counter, 10);
            const suffix = el.dataset.suffix || '';
            const duration = 1600;
            const start = performance.now();
            const ease = t => 1 - Math.pow(1 - t, 3);
            const tick = (now) => {
              const t = Math.min((now - start) / duration, 1);
              const value = Math.floor(ease(t) * target);
              el.textContent = value.toLocaleString('tr-TR') + suffix;
              if (t < 1) requestAnimationFrame(tick);
              else el.textContent = target.toLocaleString('tr-TR') + suffix;
            };
            requestAnimationFrame(tick);
            counterObserver.unobserve(el);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(el => { el.classList.add('counter-bound'); counterObserver.observe(el); });
    }
  }
  initCounters();

  // site-render.js API'den veri çekip DOM'u güncelledikten sonra bu fonksiyonu
  // çağırarak yeni eklenen kartların da animasyonlu şekilde görünmesini sağlar.
  window.refreshScrollAnimations = function () {
    initScrollReveal();
    initCounters();
  };

  // ---------- Form Submission ----------
  const form = document.querySelector('#contactForm');
  if (form) {
    const msgEl = form.querySelector('.form-msg');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      
      if (msgEl) {
        msgEl.classList.remove('success', 'error');
        msgEl.style.display = 'none';
      }
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite;width:18px;height:18px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Gönderiliyor...';
      }
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      let savedToBackend = false;
      let sentToEmail = false;

      // 1) Backend API'ye kaydet (admin panelin "Mesajlar" bölümünde görünmesi için)
      try {
        if (window.apiFetch) {
          await window.apiFetch('/messages', {
            method: 'POST',
            body: JSON.stringify({
              name: data.name, phone: data.phone, email: data.email,
              service: data.service, location: data.location, message: data.message,
            }),
          });
          savedToBackend = true;
        }
      } catch (err) {
        console.error('Backend mesaj kaydı başarısız:', err);
      }

      // 2) Formspree üzerinden e-posta ile iletim
      try {
        if (window.FORMSPREE_ENDPOINT && !window.FORMSPREE_ENDPOINT.includes('YOUR_FORM_ID')) {
          const fres = await fetch(window.FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: formData,
          });
          sentToEmail = fres.ok;
        }
      } catch (err) {
        console.error('Formspree gönderimi başarısız:', err);
      }
      
      if (msgEl) {
        if (savedToBackend || sentToEmail) {
          msgEl.className = 'form-msg success';
          msgEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;flex-shrink:0;"><path d="M20 6L9 17l-5-5"/></svg> Mesajınız başarıyla iletildi. 24 saat içinde dönüş yapacağız.';
        } else {
          msgEl.className = 'form-msg error';
          msgEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg> Mesajınız gönderilemedi. Lütfen doğrudan telefon veya WhatsApp ile ulaşın.';
        }
        msgEl.style.display = 'flex';
      }
      if (savedToBackend || sentToEmail) form.reset();
      
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  // ---------- Smooth Anchor Scroll (with offset for fixed nav) ----------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return; // boş çapa — varsayılan davranışa bırak
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ---------- Year in Footer ----------
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Subtle Parallax for Hero ----------
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg && window.matchMedia('(min-width: 768px)').matches) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y < window.innerHeight) {
            heroBg.style.transform = `translateY(${y * 0.3}px) scale(1.05)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

})();
