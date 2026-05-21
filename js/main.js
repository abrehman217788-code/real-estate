(function () {
  'use strict';

  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API = isLocal ? 'http://localhost:5000/api' : '/api';
  const isPageDir = window.location.pathname.includes('/pages/');

  const currentPage = (window.location.pathname.split('/').pop().split('?')[0].split('#')[0]) || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop().split('?')[0].split('#')[0];
    if (href === currentPage) a.classList.add('active-link');
  });

  let toastCount = 0;
  function showToast(message, type) {
    if (toastCount > 4) return;
    if (!document.body) return;
    toastCount++;
    const container = document.getElementById('toastContainer') || (() => {
      const c = document.createElement('div'); c.id = 'toastContainer'; c.className = 'toast-container';
      document.body.appendChild(c); return c;
    })();
    const toast = document.createElement('div'); toast.className = 'toast ' + (type || 'info');
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    toast.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i><span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100px)';
      toast.style.transition = '0.4s ease';
      setTimeout(() => { toast.remove(); if (toastCount > 0) toastCount--; }, 400);
    }, 4000);
  }

  if (document.getElementById('hamburger')) {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', function () {
        this.classList.toggle('active');
        navLinks.classList.toggle('open');
      });
      navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          hamburger.classList.remove('active');
          navLinks.classList.remove('open');
        });
      });
    }
  }

  const nav = document.getElementById('navbar');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });

  const heroSearch = document.getElementById('heroSearch');
  if (heroSearch) {
    heroSearch.addEventListener('submit', function (e) {
      e.preventDefault();
      const loc = this.querySelector('select').value || '';
      const type = this.querySelector('input').value || '';
      const params = new URLSearchParams();
      if (loc) params.set('location', loc);
      if (type) params.set('type', type);
      window.location.href = (isPageDir ? '' : 'pages/') + 'listings.html?' + params.toString();
    });
  }

  const filterForm = document.getElementById('filterForm');
  if (filterForm) {
    filterForm.addEventListener('submit', function (e) { e.preventDefault(); applyFilters(); });
    filterForm.addEventListener('reset', function () { setTimeout(applyFilters, 0); });
    filterForm.querySelectorAll('select, input').forEach(function (el) {
      el.addEventListener('change', applyFilters);
    });
  }
  function applyFilters() {
    const form = document.getElementById('filterForm');
    if (!form) return;
    const data = new FormData(form);
    const cards = document.querySelectorAll('.property-card');
    let visibleCount = 0;
    cards.forEach(function (card) {
      let show = true;
      const type = data.get('type'); if (type && card.dataset.type !== type) show = false;
      const status = data.get('status'); if (show && status && card.dataset.status !== status) show = false;
      const minPrice = data.get('minPrice');
      if (show && minPrice) { const p = parseFloat(card.dataset.price); if (p < parseFloat(minPrice)) show = false; }
      const maxPrice = data.get('maxPrice');
      if (show && maxPrice) { const p = parseFloat(card.dataset.price); if (p > parseFloat(maxPrice)) show = false; }
      const beds = data.get('bedrooms');
      if (show && beds) {
        const cardBeds = parseInt(card.dataset.bedrooms);
        if (beds === '5' ? (cardBeds < 5) : (cardBeds !== parseInt(beds))) show = false;
      }
      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });
    const count = document.querySelector('.result-count strong');
    if (count) count.textContent = visibleCount + (visibleCount === 1 ? ' property' : ' properties');
  }

  document.querySelectorAll('.contact-form-page, .contact-form-side').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = this.querySelector('.btn');
      if (!btn || btn.disabled) return;
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      btn.disabled = true;
      setTimeout(function () {
        btn.innerHTML = '<i class="fas fa-check"></i> Sent!';
        showToast('Message sent! We\'ll get back to you within 24 hours.', 'success');
        setTimeout(function () { btn.innerHTML = orig; btn.disabled = false; }, 2000);
        if (typeof form.reset === 'function') form.reset();
      }, 1200);
    });
  });

  document.querySelectorAll('.property-card-fav').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.toggle('active');
      if (this.classList.contains('active')) {
        this.style.color = '#ef4444';
        this.innerHTML = '<i class="fas fa-heart"></i>';
      } else {
        this.style.color = '';
        this.innerHTML = '<i class="far fa-heart"></i>';
      }
    });
  });

  function attachFormHandler(formId, apiPath, successMsg, redirectUrl) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = this.querySelector('.btn');
      if (!btn || btn.disabled) return;
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
      btn.disabled = true;
      const formData = new FormData(this);
      const body = {};
      formData.forEach(function (v, k) { body[k] = v; });
      fetch(API + apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).then(function (res) {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      }).then(function (data) {
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        showToast(successMsg, 'success');
        btn.innerHTML = '<i class="fas fa-check"></i> Success!';
        setTimeout(function () {
          if (redirectUrl) window.location.href = redirectUrl;
          btn.innerHTML = orig;
          btn.disabled = false;
        }, 1000);
      }).catch(function () {
        showToast('Something went wrong. Please try again.', 'error');
        btn.innerHTML = orig;
        btn.disabled = false;
      });
    });
  }

  attachFormHandler('loginForm', '/auth/login', 'Welcome back!', 'dashboard.html');
  attachFormHandler('registerForm', '/auth/register', 'Account created!', 'dashboard.html');

  const pricingToggle = document.querySelector('.toggle-track');
  if (pricingToggle) {
    pricingToggle.addEventListener('click', function () {
      this.classList.toggle('active');
      const isYearly = this.classList.contains('active');
      document.querySelectorAll('.pricing-card').forEach(function (card) {
        const priceEl = card.querySelector('.price');
        if (!priceEl) return;
        const monthly = priceEl.dataset.monthly;
        const yearly = priceEl.dataset.yearly;
        if (!monthly || !yearly) return;
        const descEl = card.querySelector('.price-desc');
        if (isYearly) {
          priceEl.innerHTML = 'PKR ' + parseInt(yearly.replace(/\D/g, ''), 10).toLocaleString() + '<span>/year</span>';
          if (descEl && descEl.dataset.yearlyDesc) descEl.textContent = descEl.dataset.yearlyDesc;
          else if (descEl) descEl.textContent = 'Billed annually — save up to 20%';
        } else {
          priceEl.innerHTML = 'PKR ' + parseInt(monthly.replace(/\D/g, ''), 10).toLocaleString() + '<span>/month</span>';
          if (descEl && descEl.dataset.monthlyDesc) descEl.textContent = descEl.dataset.monthlyDesc;
          else if (descEl) descEl.textContent = 'Billed monthly — cancel anytime';
        }
      });
    });
  }

  document.querySelectorAll('.faq-question').forEach(function (q) {
    q.addEventListener('click', function () {
      const item = this.parentElement;
      const wasActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('active'); });
      if (!wasActive) item.classList.add('active');
    });
  });

  document.querySelectorAll('.payment-method').forEach(function (m) {
    m.addEventListener('click', function () {
      document.querySelectorAll('.payment-method').forEach(function (p) { p.classList.remove('active'); });
      this.classList.add('active');
    });
  });

  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = this.querySelector('.btn');
      if (!btn || btn.disabled) return;
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Payment...';
      btn.disabled = true;
      setTimeout(function () {
        btn.innerHTML = '<i class="fas fa-check"></i> Payment Successful!';
        showToast('Payment completed! Check your email for the receipt.', 'success');
        setTimeout(function () { btn.innerHTML = orig; btn.disabled = false; window.location.href = 'dashboard.html'; }, 2000);
      }, 2000);
    });
  }

  const mapEl = document.getElementById('propertyMap');
  if (mapEl) {
    const lat = parseFloat(mapEl.dataset.lat) || 33.6844;
    const lng = parseFloat(mapEl.dataset.lng) || 73.0479;
    const bboxLng = Math.max(lng - 0.015, -180);
    const bboxLat = Math.max(lat - 0.015, -90);
    const bboxLngMax = Math.min(lng + 0.015, 180);
    const bboxLatMax = Math.min(lat + 0.015, 90);
    mapEl.innerHTML = '<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=' + bboxLng + ',' + bboxLat + ',' + bboxLngMax + ',' + bboxLatMax + '&layer=mapnik&marker=' + lat + ',' + lng + '" loading="lazy" allowfullscreen title="Property Location Map" style="width:100%;height:100%;border:0;"></iframe>';
  }
})();
