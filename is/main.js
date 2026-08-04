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

  // ---------- Scroll Reveal ----------
  const reveals = document.querySelectorAll('.reveal, .reveal-stagger');
  if (reveals.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(el => observer.observe(el));
  }

  // ---------- Number Counter ----------
  const counters = document.querySelectorAll('[data-counter]');
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
    counters.forEach(el => counterObserver.observe(el));
  }

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
      
      // Simulated submission - In production, connect to a real endpoint
      await new Promise(r => setTimeout(r, 1100));
      
      // For demo: store locally and show success
      console.log('Form submission:', data);
      
      if (msgEl) {
        msgEl.className = 'form-msg success';
        msgEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;flex-shrink:0;"><path d="M20 6L9 17l-5-5"/></svg> Mesajınız başarıyla iletildi. 24 saat içinde dönüş yapacağız.';
        msgEl.style.display = 'flex';
      }
      form.reset();
      
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  // ---------- Smooth Anchor Scroll (with offset for fixed nav) ----------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
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
