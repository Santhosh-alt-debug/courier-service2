/* Stackly Courier — shared script. Vanilla JS, no libraries. */
'use strict';

/* ===== Shared state (declared first) ===== */
const REAL_PAGES = ["index.html", "services.html", "track.html", "pricing.html", "about.html", "contact.html", "signin.html", "signup.html", "dashboard-customer.html", "dashboard-admin.html", "404.html", "privacy-policy.html", "terms-conditions.html"];
const NAV = [{"href": "index.html", "label": "Home", "header": true}, {"href": "services.html", "label": "Services", "header": true}, {"href": "track.html", "label": "Track", "header": true}, {"href": "pricing.html", "label": "Pricing", "header": true}, {"href": "about.html", "label": "About", "header": true}, {"href": "contact.html", "label": "Contact", "header": true}];
window.REAL_PAGES = REAL_PAGES;
window.NAV = NAV;
const STATE = {
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  finePointer: window.matchMedia('(pointer: fine)').matches,
  fxDone: new WeakSet(),
  page: (location.pathname.split('/').pop() || 'index.html'),
  timers: []
};
const KEYS = { account: 'stk_account', session: 'stk_session', notice: 'stk_notice' };
const COMMON_PASSWORDS = ['password','password1','password123','passw0rd','p@ssw0rd','p@ssword1','12345678','123456789','1234567890','qwerty123','qwertyuiop','iloveyou','admin123','welcome1','welcome@123','letmein1','abc12345','india@123','india123','stackly@123','Password@1','Password@123','Admin@123','Welcome@1','Qwerty@123','Abcd@1234','Test@1234'];
const FX = {};

/* ===== Helpers ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
/* Accounts persist in localStorage so a user can sign in later (also works from file:// and new tabs).
   The signed-in name is mirrored to sessionStorage for the current tab. */
const store = {
  get(k) {
    for (const s of ['localStorage', 'sessionStorage']) { try { const v = window[s].getItem(k); if (v) return JSON.parse(v); } catch (e) { /* blocked */ } }
    return null;
  },
  set(k, v) { ['localStorage', 'sessionStorage'].forEach(s => { try { window[s].setItem(k, JSON.stringify(v)); } catch (e) { /* blocked */ } }); },
  del(k) { ['localStorage', 'sessionStorage'].forEach(s => { try { window[s].removeItem(k); } catch (e) { /* blocked */ } }); }
};
function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ===== Routing: everything not in REAL_PAGES goes to 404 ===== */
function sweepLinks() {
  $$('a[href]').forEach(a => {
    const raw = a.getAttribute('href').trim();
    if (raw === '' || raw === '#' || /^(https?:)?\/\//i.test(raw) || /^javascript:/i.test(raw)) { a.setAttribute('href', '404.html'); return; }
    const page = raw.split('#')[0].split('?')[0] || STATE.page;
    if (!REAL_PAGES.includes(page)) a.setAttribute('href', '404.html');
  });
}

/* ===== Overlays: never left open by back/forward ===== */
function closeOverlays() {
  document.documentElement.classList.remove('menu-open', 'drawer-open', 'leaving');
  $$('.splash.show,.modal.show,.lightbox.show,.pop.show').forEach(el => el.classList.remove('show'));
  $$('[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  const mm = $('.mobile-menu'); if (mm) mm.setAttribute('aria-hidden', 'true');
}
['pageshow', 'popstate', 'pagehide'].forEach(ev => window.addEventListener(ev, closeOverlays));

function initMenu() {
  const burger = $('.burger'); const menu = $('.mobile-menu');
  if (!burger || !menu) return;
  burger.addEventListener('click', () => {
    const open = !document.documentElement.classList.contains('menu-open');
    document.documentElement.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
  });
  menu.addEventListener('click', e => { if (e.target.closest('a')) closeOverlays(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlays(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 1060) closeOverlays(); });
}

function initSplash() {
  $$('[data-home-logo]').forEach(a => a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (STATE.reduced) { location.href = 'index.html'; return; }
    let s = $('.splash');
    if (!s) { s = document.createElement('div'); s.className = 'splash'; s.setAttribute('aria-hidden', 'true'); s.innerHTML = '<img src="logo-light.webp" alt="" width="138" height="40">'; document.body.appendChild(s); }
    requestAnimationFrame(() => s.classList.add('show'));
    setTimeout(() => { location.href = 'index.html'; }, 520);
  }));
}

/* ===== Reveal on scroll ===== */
function initReveals() {
  const items = $$('[data-reveal]');
  const groups = new Map();
  items.forEach(el => {
    const p = el.parentElement; const i = groups.get(p) || 0; groups.set(p, i + 1);
    el.style.setProperty('--d', Math.min(i, 6) * 90 + 'ms');
  });
  const vh = window.innerHeight;
  items.forEach(el => {
    if (STATE.reduced || el.getBoundingClientRect().top < vh) {
      el.style.transition = 'none'; el.classList.add('in');
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transition = ''; }));
    }
  });
  const showVisible = () => items.forEach(el => {
    if (el.classList.contains('in')) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0 && window.scrollY < 4) { el.style.transition = 'none'; el.classList.add('in'); requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transition = ''; })); }
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(showVisible);
  window.addEventListener('load', showVisible);
  if (!('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  items.filter(el => !el.classList.contains('in')).forEach(el => io.observe(el));
  // jump-scroll safety: anything above the fold line is shown
  window.addEventListener('scroll', () => {
    const lim = window.innerHeight;
    items.forEach(el => { if (!el.classList.contains('in') && el.getBoundingClientRect().top < lim) el.classList.add('in'); });
  }, { passive: true });
}

/* ===== Set-pieces dispatched by data-fx ===== */
function runFx(el) {
  if (STATE.fxDone.has(el)) return;
  const name = el.dataset.fx;
  const fn = FX[name];
  STATE.fxDone.add(el);
  if (!fn) { console.error('Unknown data-fx value: "' + name + '"'); return; }
  fn(el);
}
function initFx() {
  const els = $$('[data-fx]');
  if (!els.length) return;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { runFx(en.target); io.unobserve(en.target); }
  }), { threshold: .2 }) : null;
  if (STATE.reduced) { els.forEach(runFx); return; }
  els.forEach(el => io ? io.observe(el) : runFx(el));
  const sweep = () => els.forEach(el => { if (!STATE.fxDone.has(el) && el.getBoundingClientRect().top < window.innerHeight * .9) runFx(el); });
  window.addEventListener('scroll', sweep, { passive: true });
  sweep();
}
function tween(dur, step, done) {
  if (STATE.reduced) { step(1); if (done) done(); return; }
  const t0 = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  (function f(now) {
    const t = Math.min(1, (now - t0) / dur);
    step(ease(t));
    if (t < 1) requestAnimationFrame(f); else if (done) done();
  })(t0);
}
/* 1. route: draws the dashed delivery line and drives the van along it */
FX.route = el => {
  const mp = el.querySelector('.mpath'); const van = el.querySelector('.van');
  if (!mp) return;
  const len = mp.getTotalLength();
  mp.style.strokeDasharray = len; mp.style.strokeDashoffset = len;
  tween(STATE.reduced ? 0 : 2200, k => {
    mp.style.strokeDashoffset = String(len * (1 - k));
    if (van) {
      const p = mp.getPointAtLength(len * k); const q = mp.getPointAtLength(Math.min(len, len * k + 1));
      const a = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
      van.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ') rotate(' + a + ')');
    }
  });
};
/* 2. count: numbers count up from zero */
FX.count = el => {
  $$('[data-count]', el).forEach(n => {
    const end = parseFloat(n.dataset.count); const dec = (n.dataset.count.split('.')[1] || '').length;
    tween(1600, k => { n.textContent = (end * k).toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec }); });
  });
};
/* 3. bars: chart columns grow to their values */
FX.bars = el => {
  $$('.bar i', el).forEach((b, i) => {
    const h = b.dataset.h + '%';
    if (STATE.reduced) { b.style.height = h; return; }
    setTimeout(() => { b.style.height = h; }, i * 70);
  });
};
/* 4. timeline: fills the shipment track as you scroll */
FX.timeline = el => {
  const fill = el.querySelector('.tl-fill'); const items = $$('.tl-item', el);
  const update = () => {
    const r = el.getBoundingClientRect();
    const k = STATE.reduced ? 1 : Math.max(0, Math.min(1, (window.innerHeight * .7 - r.top) / r.height));
    fill.style.height = (k * (r.height - 12)) + 'px';
    items.forEach(it => { it.classList.toggle('on', (it.offsetTop + 10) <= k * r.height); });
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
};

/* ===== Pointer tilt (fine pointers only) ===== */
function initTilt() {
  if (!STATE.finePointer || STATE.reduced) return;
  $$('[data-tilt]').forEach(card => {
    card.style.transition = 'transform .25s ease';
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5; const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = 'perspective(900px) rotateX(' + (-y * 5).toFixed(2) + 'deg) rotateY(' + (x * 6).toFixed(2) + 'deg)';
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

/* ===== Hero 3D service carousel ===== */
function initCarousel3d() {
  $$('.c3d').forEach(c => {
    const ring = $('.c3d-ring', c); const cards = $$('.c3d-card', c);
    const n = cards.length; const step = 360 / n; const r = Math.round(cards[0].offsetWidth * .62 / Math.tan(Math.PI / n)) + 20;
    let i = 0;
    cards.forEach((card, k) => { card.style.transform = 'rotateY(' + (k * step) + 'deg) translateZ(' + r + 'px)'; });
    const set = () => {
      ring.style.transform = 'translateZ(' + (-r) + 'px) rotateY(' + (-i * step) + 'deg)';
      cards.forEach((card, k) => card.setAttribute('aria-hidden', String(((i % n) + n) % n !== k)));
      const live = $('.c3d-live', c.parentElement); if (live) live.textContent = cards[((i % n) + n) % n].querySelector('h3').textContent;
    };
    const wrapEl = c.parentElement;
    $('[data-c3d="prev"]', wrapEl).addEventListener('click', () => { i--; set(); });
    $('[data-c3d="next"]', wrapEl).addEventListener('click', () => { i++; set(); });
    let drag = null;
    c.addEventListener('pointerdown', e => { drag = e.clientX; });
    window.addEventListener('pointerup', e => { if (drag === null) return; const d = e.clientX - drag; drag = null; if (Math.abs(d) > 30) { i += d < 0 ? 1 : -1; set(); } });
    set();
    if (!STATE.reduced) STATE.timers.push(setInterval(() => { if (!c.matches(':hover') && document.visibilityState === 'visible') { i++; set(); } }, 4200));
  });
}

/* ===== Testimonials ===== */
function initTestimonials() {
  $$('.tcar').forEach(car => {
    const track = $('.ttrack', car); const slides = $$('.tslide', car); const dots = $$('.dots button', car.parentElement);
    let i = 0;
    const go = k => {
      i = (k + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-i * 100) + '%)';
      slides.forEach((s, j) => { s.setAttribute('aria-hidden', String(j !== i)); $$('a,button', s).forEach(f => f.tabIndex = j === i ? 0 : -1); });
      dots.forEach((d, j) => d.setAttribute('aria-current', String(j === i)));
    };
    dots.forEach((d, j) => d.addEventListener('click', () => go(j)));
    const p = $('[data-t="prev"]', car.parentElement); const n = $('[data-t="next"]', car.parentElement);
    if (p) p.addEventListener('click', () => go(i - 1));
    if (n) n.addEventListener('click', () => go(i + 1));
    go(0);
    if (!STATE.reduced) STATE.timers.push(setInterval(() => { if (!car.parentElement.matches(':hover') && document.visibilityState === 'visible') go(i + 1); }, 6500));
  });
}

/* ===== Lightbox ===== */
function initLightbox() {
  const lb = $('.lightbox'); if (!lb) return;
  const cap = $('p', lb); let last = null;
  const img = document.createElement('img'); img.alt = ''; $('.lb-stage', lb).prepend(img);
  $$('[data-lightbox]').forEach(b => b.addEventListener('click', () => {
    last = b; const src = b.querySelector('img');
    img.src = src.currentSrc || src.src; img.alt = src.alt; cap.textContent = b.dataset.caption || '';
    lb.classList.add('show'); $('.lb-close', lb).focus();
  }));
  const close = () => { lb.classList.remove('show'); if (last) last.focus(); };
  $('.lb-close', lb).addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('show')) close(); });
}

/* ===== Validation ===== */
const V = {
  name(v) {
    if (!v) return 'Please enter your name.';
    if (!/^[A-Za-z]+$/.test(v)) return 'Only alphabets are allowed.';
    return '';
  },
  phone(v) {
    if (!v) return 'Please enter your phone number.';
    if (!/^\d+$/.test(v)) return 'Only numbers are allowed.';
    if (v.length !== 10) return 'Enter exactly 10 digits.';
    if (!/^[6-9]/.test(v)) return 'Indian mobile numbers start with 6, 7, 8 or 9.';
    return '';
  },
  email(v) {
    if (!v) return 'Please enter your email address.';
    if (/\s/.test(v)) return 'Email must not contain spaces.';
    if (v.length > 64) return 'Email must be 64 characters or fewer.';
    const at = v.split('@');
    if (at.length !== 2) return 'Email must contain exactly one @.';
    const [local, domain] = at;
    if (!local || !domain) return 'Enter a valid email, like name@example.com.';
    if (v.includes('..')) return 'Email cannot contain two dots in a row.';
    if (/^\.|\.$/.test(local) || /^\.|\.$/.test(domain)) return 'Email cannot start or end with a dot.';
    if (!/^[A-Za-z0-9._%+-]+$/.test(local)) return 'Email contains characters that are not allowed.';
    const labels = domain.split('.');
    if (labels.length < 2) return 'Enter a valid domain, like example.com.';
    for (const l of labels) {
      if (!/^[A-Za-z0-9-]+$/.test(l)) return 'Domain contains characters that are not allowed.';
      if (/^-|-$/.test(l)) return 'Domain parts cannot start or end with a hyphen.';
      if (l.length < 2) return 'Domain parts must be at least 2 characters.';
      if (/^\d+$/.test(l)) return 'Domain parts cannot be only numbers.';
    }
    if (!/^[A-Za-z]{2,}$/.test(labels[labels.length - 1])) return 'The ending (like .com or .in) must use letters only.';
    return '';
  },
  password(v) {
    if (!v) return 'Please enter a password.';
    if (COMMON_PASSWORDS.some(p => p.toLowerCase() === v.toLowerCase())) return 'This password is too common. Choose another.';
    if (v.length < 8) return 'Use at least 8 characters.';
    if (!/[A-Z]/.test(v)) return 'Add at least one uppercase letter.';
    if (!/[a-z]/.test(v)) return 'Add at least one lowercase letter.';
    if (!/\d/.test(v)) return 'Add at least one number.';
    if (!/[^A-Za-z0-9]/.test(v)) return 'Add at least one symbol, like @ or #.';
    return '';
  },
  confirm(v, el) {
    if (!v) return 'Please confirm your password.';
    const other = $('#' + el.dataset.match);
    return other && other.value !== v ? 'Passwords do not match.' : '';
  },
  pincode(v) {
    if (!v) return 'Please enter a pincode.';
    if (!/^\d+$/.test(v)) return 'Only numbers are allowed.';
    if (v.length !== 6) return 'Enter exactly 6 digits.';
    if (v[0] === '0') return 'Pincodes cannot start with 0.';
    return '';
  },
  trackid(v) {
    if (!v) return 'Please enter a tracking ID.';
    if (!/^[A-Z]{2}\d{10}$/.test(v)) return 'Use 2 letters + 10 digits, like SK1234567890.';
    if (!v.startsWith('SK')) return 'Stackly tracking IDs start with SK.';
    return '';
  },
  weight(v) {
    if (v === '') return 'Please enter the weight.';
    const n = Number(v);
    if (!isFinite(n)) return 'Only numbers are allowed.';
    return n < 0.1 || n > 50 ? 'Weight must be between 0.1 and 50 kg.' : '';
  },
  dim(v) {
    if (v === '') return 'Required.';
    const n = Number(v);
    if (!isFinite(n)) return 'Only numbers are allowed.';
    return n < 1 || n > 150 ? 'Must be 1–150 cm.' : '';
  },
  money(v) {
    if (v === '') return 'Please enter the declared value.';
    const n = Number(v);
    return !isFinite(n) || n < 100 || n > 500000 ? 'Enter a value from ₹100 to ₹5,00,000.' : '';
  },
  date(v) {
    if (!v) return 'Please pick a pickup date.';
    const d = new Date(v + 'T00:00:00'); const t = new Date(); t.setHours(0, 0, 0, 0);
    return d <= t ? 'Pickup date must be after today.' : '';
  },
  select(v) { return v ? '' : 'Please choose an option.'; },
  radio(v, el) { return $$('input[type=radio]', el).some(r => r.checked) ? '' : 'Please choose an option.'; },
  text(v) {
    if (!v.trim()) return 'Please write your message.';
    return v.trim().length < 10 ? 'Please write at least 10 characters.' : '';
  },
  required(v, el) { return el.checked ? '' : 'Please tick this box to continue.'; },
  plain(v) { return v.trim() ? '' : 'This field is required.'; }
};
function fieldOf(el) { return el.closest('.field'); }
function showErr(field, msg) {
  let b = field.querySelector('.bubble');
  if (!b) { b = document.createElement('span'); b.className = 'bubble'; b.setAttribute('role', 'alert'); b.id = 'err-' + Math.random().toString(36).slice(2, 8); field.appendChild(b); }
  b.textContent = msg; field.classList.add('invalid');
  const ctl = field.querySelector('[data-v]'); if (ctl) { ctl.setAttribute('aria-invalid', 'true'); ctl.setAttribute('aria-describedby', b.id); }
  field.style.marginBottom = (b.offsetHeight + 16) + 'px';
}
function clearErr(field) {
  if (!field) return;
  field.classList.remove('invalid'); field.style.marginBottom = '';
  const ctl = field.querySelector('[data-v]'); if (ctl) { ctl.removeAttribute('aria-invalid'); }
}
function check(el) {
  const kind = el.dataset.v; const fn = V[kind]; if (!fn) return true;
  const val = el.type === 'checkbox' ? '' : (el.value === undefined ? '' : el.value.trim());
  const msg = fn(val, el); const field = fieldOf(el);
  if (msg) { showErr(field, msg); return false; }
  clearErr(field); return true;
}
function initForms() {
  $$('form[data-validate]').forEach(form => {
    form.setAttribute('novalidate', '');
    const ctls = $$('[data-v]', form);
    ctls.forEach(el => {
      const kind = el.dataset.v;
      if (kind === 'radio') {
        $$('input[type=radio]', el).forEach(r => r.addEventListener('change', () => clearErr(fieldOf(el))));
        el.addEventListener('focusout', e => { if (!el.contains(e.relatedTarget)) check(el); });
        return;
      }
      el.addEventListener('blur', () => check(el));
      el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => {
        clearErr(fieldOf(el));
        if (kind === 'password') { const c = $('[data-match="' + el.id + '"]', form); if (c && c.value) clearErr(fieldOf(c)); }
      });
      if (kind === 'name') {
        el.addEventListener('keydown', e => { if (e.key === ' ' || e.code === 'Space') e.preventDefault(); });
        el.addEventListener('paste', e => {
          e.preventDefault();
          const t = (e.clipboardData || window.clipboardData).getData('text').replace(/\s+/g, '');
          const s = el.selectionStart, en = el.selectionEnd;
          el.value = (el.value.slice(0, s) + t + el.value.slice(en)).slice(0, 16);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        el.addEventListener('input', () => { if (/\s/.test(el.value)) el.value = el.value.replace(/\s+/g, ''); });
      }
      if (kind === 'trackid') el.addEventListener('input', () => { const p = el.selectionStart; el.value = el.value.toUpperCase().replace(/\s/g, ''); el.setSelectionRange(p, p); });
      if (kind === 'email') el.addEventListener('input', () => { if (/\s/.test(el.value)) { /* keep visible so the bubble can explain */ } });
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      let first = null;
      ctls.forEach(el => { if (el.closest('[hidden]')) { clearErr(fieldOf(el)); return; } if (!check(el) && !first) first = el; });
      if (first) { (first.matches('[data-v=radio]') ? first.querySelector('input') : (first.matches('select') && first.parentNode.querySelector('.sel-btn')) || first).focus({ preventScroll: true }); fieldOf(first).scrollIntoView({ block: 'center', behavior: STATE.reduced ? 'auto' : 'smooth' }); return; }
      const h = HANDLERS[form.dataset.validate];
      if (h) h(form); else { toast('Sent. We will reply within one working day.'); form.reset(); }
    });
  });
  $$('.pw-toggle').forEach(b => b.addEventListener('click', () => {
    const inp = b.parentElement.querySelector('input'); const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    b.setAttribute('aria-pressed', String(show)); b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    b.innerHTML = show ? ICONS.eyeOff : ICONS.eye;
  }));
}
const ICONS = {
  eye: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>'
};

/* ===== Form handlers ===== */
const HANDLERS = {
  track(form) {
    const id = $('[data-v=trackid]', form).value.trim();
    if (STATE.page === 'track.html') { showShipment(id); }
    else { location.href = 'track.html?id=' + encodeURIComponent(id); }
  },
  signup(form) {
    const terms = $('#terms', form);
    if (!terms.checked) { openModal('terms-modal'); return; }
    const acc = {
      first: $('#su-first', form).value.trim(), last: $('#su-last', form).value.trim(),
      email: $('#su-email', form).value.trim().toLowerCase(), phone: $('#su-phone', form).value.trim(),
      role: $('input[name=role]:checked', form).value, pass: $('#su-pass', form).value
    };
    const all = (store.get('stk_accounts') || []).filter(a => a.email !== acc.email);
    all.push(acc); store.set('stk_accounts', all); store.set(KEYS.account, acc); store.set(KEYS.notice, 1);
    location.href = 'signin.html';
  },
  signin(form) {
    const email = $('#si-email', form).value.trim().toLowerCase();
    const acc = (store.get('stk_accounts') || []).find(a => a.email === email) || store.get(KEYS.account); const pass = $('#si-pass', form).value;
    const role = $('input[name=role]:checked', form).value;
    const emailField = fieldOf($('#si-email', form)); const passField = fieldOf($('#si-pass', form));
    if (!acc || acc.email !== email) { showErr(emailField, 'No account found for this email. Create an account first.'); return; }
    if (acc.pass !== pass) { showErr(passField, 'Email or password is incorrect.'); return; }
    if (acc.role !== role) { showErr(fieldOf($('[data-v=radio]', form)), 'This account is registered as ' + (acc.role === 'staff' ? 'Staff' : 'Customer') + '.'); return; }
    store.set(KEYS.session, { name: acc.first, last: acc.last, role: acc.role, email: acc.email });
    location.href = acc.role === 'staff' ? 'dashboard-admin.html' : 'dashboard-customer.html';
  },
  calc() { const o = $('#calc-out'); if (o) o.scrollIntoView({ block: 'nearest', behavior: STATE.reduced ? 'auto' : 'smooth' }); },
  contact(form) { toast('Thanks — your enquiry is in. Our Salem desk replies within one working day.'); form.reset(); },
  pickup(form) {
    const tb = $('#ship-rows'); const id = 'SK' + String(Date.now()).slice(-10);
    const to = $('#pk-to', form).value.trim(); const type = $('#pk-service', form);
    const tr = document.createElement('tr');
    tr.innerHTML = '<td data-th="Tracking ID">' + id + '</td><td data-th="To">' + to + '</td><td data-th="Service">' + type.options[type.selectedIndex].text + '</td><td data-th="Status"><span class="tag note">Pickup booked</span></td><td data-th="Amount"><span class="price">—</span></td>';
    if (tb) tb.prepend(tr);
    toast('Pickup booked. Tracking ID ' + id + '.'); form.reset();
    location.hash = 'shipments';
  },
  agent(form) {
    const list = $('#agent-rows'); const fn = $('#ag-first', form).value.trim(); const zone = $('#ag-zone', form);
    const tr = document.createElement('tr');
    tr.innerHTML = '<td data-th="Agent">' + fn + '</td><td data-th="Zone">' + zone.options[zone.selectedIndex].text + '</td><td data-th="Status"><span class="tag ok">Active</span></td>';
    if (list) list.prepend(tr);
    toast(fn + ' added as a delivery agent.'); form.reset();
    location.hash = 'agents';
  }
};
function openModal(id) {
  const m = $('#' + id); if (!m) return;
  m.classList.add('show'); const b = $('button', m); if (b) b.focus();
}
function initModals() {
  $$('.modal').forEach(m => {
    $$('[data-close]', m).forEach(b => b.addEventListener('click', () => m.classList.remove('show')));
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal.show').forEach(m => m.classList.remove('show')); });
}

/* ===== Auth pages ===== */
function initAuth() {
  if (STATE.page === 'signin.html' && store.get(KEYS.notice)) {
    const n = $('#notice'); if (n) { n.hidden = false; n.textContent = 'Account created. Sign in to continue.'; }
    store.del(KEYS.notice);
    const acc = store.get(KEYS.account); if (acc) { const e = $('#si-email'); if (e) e.value = acc.email; }
  }
}

/* ===== Dashboards ===== */
function initDashboard() {
  const need = document.body.dataset.role; if (!need) return;
  const s = store.get(KEYS.session);
  if (!s) { location.replace('signin.html'); return; }
  if (s.role !== need) { location.replace(s.role === 'staff' ? 'dashboard-admin.html' : 'dashboard-customer.html'); return; }
  $$('[data-user-name]').forEach(el => { el.textContent = s.name; });
  $$('[data-user-full]').forEach(el => { el.textContent = (s.name + ' ' + (s.last || '')).trim(); });
  $$('[data-user-email]').forEach(el => { el.textContent = s.email || ''; el.title = s.email || ''; });
  $$('[data-user-initial]').forEach(el => { el.textContent = (s.name || '?').charAt(0).toUpperCase(); });
  document.documentElement.classList.add('authed');
  const head = $('.dash-head');
  const setDh = () => { if (head) document.documentElement.style.setProperty('--dh', head.offsetHeight + 'px'); };
  setDh(); window.addEventListener('resize', setDh);
  const views = $$('.view');
  const showView = id => {
    const target = views.find(v => v.id === id) || views[0];
    views.forEach(v => { v.hidden = v !== target; });
    $$('.sidebar a').forEach(a => {
      const on = a.getAttribute('href').split('#')[1] === target.id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $$('[data-fx]', target).forEach(el => { if (!STATE.fxDone.has(el)) runFx(el); });
  };
  STATE.showView = showView;
  showView(location.hash.slice(1));
  window.addEventListener('hashchange', () => { showView(location.hash.slice(1)); window.scrollTo(0, 0); });
  const t = $('.side-toggle');
  if (t) t.addEventListener('click', () => {
    const open = !document.documentElement.classList.contains('drawer-open');
    document.documentElement.classList.toggle('drawer-open', open); t.setAttribute('aria-expanded', String(open));
  });
  const scrim = $('.scrim'); if (scrim) scrim.addEventListener('click', closeOverlays);
  $$('.sidebar a').forEach(a => a.addEventListener('click', () => { document.documentElement.classList.remove('drawer-open'); if (t) t.setAttribute('aria-expanded', 'false'); }));
  window.addEventListener('resize', () => { if (window.innerWidth >= 1000) { document.documentElement.classList.remove('drawer-open'); if (t) t.setAttribute('aria-expanded', 'false'); } });
  const bell = $('.bell'); const pop = $('#notif');
  if (bell && pop) {
    bell.addEventListener('click', e => { e.stopPropagation(); const o = !pop.classList.contains('show'); pop.classList.toggle('show', o); bell.setAttribute('aria-expanded', String(o)); });
    document.addEventListener('click', e => { if (!pop.contains(e.target)) { pop.classList.remove('show'); bell.setAttribute('aria-expanded', 'false'); } });
  }
  $$('[data-logout]').forEach(b => b.addEventListener('click', () => { store.del(KEYS.session); location.href = 'signin.html'; }));
  $$('[data-assign]').forEach(b => b.addEventListener('click', () => {
    const tag = b.closest('tr').querySelector('.tag'); tag.className = 'tag ok'; tag.textContent = 'Assigned'; b.disabled = true; b.textContent = 'Assigned';
  }));
}

/* ===== Services filters / save / compare ===== */
function initServices() {
  const grid = $('#svc-grid'); if (!grid) return;
  const cards = $$('.svc', grid); const sels = $$('[data-filter]');
  const empty = $('#svc-empty'); const count = $('#svc-count');
  const apply = () => {
    let shown = 0;
    cards.forEach(c => {
      const ok = sels.every(s => !s.value || c.dataset[s.dataset.filter].split(' ').includes(s.value));
      c.hidden = !ok; if (ok) shown++;
    });
    empty.hidden = shown !== 0; count.textContent = shown + (shown === 1 ? ' service' : ' services');
  };
  sels.forEach(s => s.addEventListener('change', apply));
  const reset = $('#svc-reset'); if (reset) reset.addEventListener('click', () => { sels.forEach(s => { s.value = ''; if (s._sync) s._sync(); }); apply(); });
  const cmpOut = $('#cmp-out');
  const sync = () => {
    const saved = $$('[data-save][aria-pressed=true]').length; const cmp = $$('[data-compare][aria-pressed=true]').map(b => b.dataset.name);
    cmpOut.textContent = 'Saved: ' + saved + ' · Comparing: ' + (cmp.length ? cmp.join(', ') : 'none');
  };
  $$('[data-save]').forEach(b => b.addEventListener('click', () => { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); b.querySelector('span').textContent = b.getAttribute('aria-pressed') === 'true' ? 'Saved' : 'Save'; sync(); }));
  $$('[data-compare]').forEach(b => b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') === 'true';
    if (!on && $$('[data-compare][aria-pressed=true]').length >= 3) { toast('You can compare up to 3 services.'); return; }
    b.setAttribute('aria-pressed', String(!on)); sync();
  }));
  apply(); sync();
}

/* ===== Track page ===== */
function showShipment(id) {
  const out = $('#shipment'); if (!out) return;
  $$('[data-ship-id]').forEach(el => { el.textContent = id; });
  out.scrollIntoView({ behavior: STATE.reduced ? 'auto' : 'smooth', block: 'start' });
  toast('Showing shipment ' + id + '.');
}
function initTrack() {
  if (STATE.page !== 'track.html') return;
  const id = new URLSearchParams(location.search).get('id');
  if (id && /^SK\d{10}$/.test(id)) { const inp = $('#tr-id'); if (inp) inp.value = id; $$('[data-ship-id]').forEach(el => { el.textContent = id; }); }
}

/* ===== Rate calculator ===== */
const RATES = { // first 0.5 kg, each extra 0.5 kg — by zone
  sameday: { local: [89, 28], regional: [149, 42], national: null, intl: null },
  nextday: { local: [59, 18], regional: [79, 26], national: [119, 38], intl: null },
  standard: { local: [45, 14], regional: [59, 20], national: [89, 30], intl: null },
  intl: { local: null, regional: null, national: null, intl: [1450, 420] }
};
function zoneOf(a, b, svc) {
  if (svc === 'intl') return 'intl';
  if (a.slice(0, 3) === b.slice(0, 3)) return 'local';
  if (a[0] === b[0]) return 'regional';
  return 'national';
}
function initCalc() {
  const f = $('#calc'); if (!f) return;
  const g = id => $('#' + id, f);
  const out = $('#calc-out');
  const ins = g('c-ins'); const insWrap = $('#ins-wrap');
  ins.addEventListener('change', () => { insWrap.hidden = !ins.checked; calc(); });
  const calc = () => {
    const from = g('c-from').value.trim(), to = g('c-to').value.trim(), svc = g('c-svc').value;
    const w = g('c-w').value, l = g('c-l').value, wd = g('c-wd').value, h = g('c-h').value;
    const valid = !V.pincode(from) && !V.pincode(to) && svc && !V.weight(w) && !V.dim(l) && !V.dim(wd) && !V.dim(h) && (!ins.checked || !V.money(g('c-val').value));
    const set = (k, v) => { $('[data-o=' + k + ']', out).textContent = v; };
    if (!valid) { ['zone', 'actual', 'vol', 'charge', 'base', 'cod', 'ins', 'fuel', 'gst'].forEach(k => set(k, '—')); $('#c-total').textContent = '₹—'; $('#c-note').textContent = 'Fill in every field to see your price.'; return; }
    const zone = zoneOf(from, to, svc); const rate = RATES[svc][zone];
    const vol = Number(l) * Number(wd) * Number(h) / 5000; const charge = Math.max(Number(w), vol);
    set('zone', zone[0].toUpperCase() + zone.slice(1)); set('actual', Number(w).toFixed(2) + ' kg'); set('vol', vol.toFixed(2) + ' kg'); set('charge', (Math.ceil(charge * 2) / 2).toFixed(1) + ' kg');
    if (!rate) {
      ['base', 'cod', 'ins', 'fuel', 'gst'].forEach(k => set(k, '—')); $('#c-total').textContent = '₹—';
      $('#c-note').textContent = svc === 'sameday' ? 'Same-day runs within the same region only. Try Next-day for this route.' : 'Pick International for addresses outside India.';
      return;
    }
    const slabs = Math.max(0, Math.ceil(charge * 2) - 1);
    const base = rate[0] + slabs * rate[1];
    const cod = g('c-cod').checked ? 45 : 0;
    const insAmt = ins.checked ? Math.max(25, Number(g('c-val').value) * 0.01) : 0;
    const fuel = base * 0.12; const sub = base + cod + insAmt + fuel; const gst = sub * 0.18;
    set('base', inr(base)); set('cod', inr(cod)); set('ins', inr(insAmt)); set('fuel', inr(fuel)); set('gst', inr(gst));
    $('#c-total').textContent = inr(sub + gst);
    $('#c-note').textContent = 'Estimate for one parcel. Final price is confirmed at pickup after weighing.';
  };
  f.addEventListener('input', calc); f.addEventListener('change', calc);
  f.addEventListener('submit', e => e.preventDefault(), true);
  calc();
}

/* ===== Hero track/ship tabs ===== */
function initTabs() {
  $$('[role=tablist]').forEach(tl => {
    const tabs = $$('[role=tab]', tl);
    const sel = t => tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; });
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => sel(t));
      t.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; sel(n); n.focus(); } });
    });
  });
}

/* ===== Luxury motion: parallax, magnetic buttons, card spotlight, page veil ===== */
function initMotion() {
  const head = $('.site-header');
  const onScroll = () => { document.documentElement.classList.toggle('scrolled', window.scrollY > 40); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  if (STATE.reduced) return;
  const par = $$('.hero-media, .ph-media, .band img.bg');
  if (par.length) {
    let ticking = false;
    const run = () => {
      ticking = false;
      par.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const k = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        el.style.transform = 'translate3d(0,' + (k * -60).toFixed(1) + 'px,0)';
      });
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  }
  if (STATE.finePointer) {
    $$('.btn').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + 'px)'; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
    $$('.card').forEach(c => c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
  }
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]'); if (!a || a.target === '_blank') return;
    const h = a.getAttribute('href'); if (/^(tel:|mailto:|#)/.test(h)) return;
    const page = h.split('#')[0].split('?')[0];
    if (!REAL_PAGES.includes(page) || (page === STATE.page && h.includes('#'))) return;
    e.preventDefault(); document.documentElement.classList.add('leaving');
    setTimeout(() => { location.href = h; }, 320);
  });
  window.addEventListener('pageshow', () => document.documentElement.classList.remove('leaving'));
}

/* ===== Custom dropdowns: the option list always stays inside the field width (no native popup overflowing small screens) ===== */
function initSelects() {
  $$('select.input').forEach((sel, n) => {
    const wrap = document.createElement('div'); wrap.className = 'sel';
    sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel);
    sel.classList.add('sel-native'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    const lab = sel.id ? $('label[for="' + sel.id + '"]') : null;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'input sel-btn';
    btn.id = (sel.id || 'sel' + n) + '-btn'; btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    if (lab) { lab.setAttribute('for', btn.id); btn.setAttribute('aria-labelledby', (lab.id = lab.id || sel.id + '-lbl') + ' ' + btn.id); }
    const list = document.createElement('ul'); list.className = 'sel-list'; list.setAttribute('role', 'listbox'); list.id = btn.id + '-list'; list.tabIndex = -1;
    btn.setAttribute('aria-controls', list.id);
    [...sel.options].forEach((o, i) => {
      const li = document.createElement('li'); li.setAttribute('role', 'option'); li.dataset.value = o.value; li.textContent = o.textContent; li.id = list.id + '-' + i;
      if (!o.value) li.classList.add('placeholder');
      list.appendChild(li);
    });
    wrap.append(btn, list);
    const items = $$('li', list); let idx = Math.max(0, sel.selectedIndex);
    const sync = () => {
      const o = sel.options[sel.selectedIndex]; btn.textContent = o ? o.textContent : '';
      btn.classList.toggle('is-placeholder', !sel.value);
      items.forEach((li, i) => li.setAttribute('aria-selected', String(i === sel.selectedIndex)));
    };
    const hi = i => { idx = (i + items.length) % items.length; items.forEach((li, k) => li.classList.toggle('hi', k === idx)); list.setAttribute('aria-activedescendant', items[idx].id); items[idx].scrollIntoView({ block: 'nearest' }); };
    const open = () => { wrap.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); hi(Math.max(0, sel.selectedIndex)); };
    const close = (validate) => { if (!wrap.classList.contains('open')) return; wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); if (validate) sel.dispatchEvent(new Event('blur')); };
    const choose = i => { sel.selectedIndex = i; sync(); sel.dispatchEvent(new Event('change', { bubbles: true })); sel.dispatchEvent(new Event('input', { bubbles: true })); close(true); btn.focus(); };
    btn.addEventListener('click', () => wrap.classList.contains('open') ? close(true) : open());
    btn.addEventListener('keydown', e => {
      const isOpen = wrap.classList.contains('open');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!isOpen) open(); else hi(idx + (e.key === 'ArrowDown' ? 1 : -1)); }
      else if ((e.key === 'Enter' || e.key === ' ') && isOpen) { e.preventDefault(); choose(idx); }
      else if (e.key === 'Escape' && isOpen) { e.preventDefault(); close(true); }
      else if (e.key === 'Tab') close(true);
    });
    btn.addEventListener('blur', () => setTimeout(() => { if (!wrap.contains(document.activeElement) && !wrap.classList.contains('open')) sel.dispatchEvent(new Event('blur')); }, 0));
    list.addEventListener('mousedown', e => e.preventDefault());
    list.addEventListener('click', e => { const li = e.target.closest('li'); if (li) choose(items.indexOf(li)); });
    document.addEventListener('click', e => { if (!wrap.contains(e.target)) close(true); });
    sel.addEventListener('change', sync);
    const form = sel.form; if (form) form.addEventListener('reset', () => setTimeout(sync, 0));
    sel._sync = sync; sync();
  });
}

/* ===== Boot ===== */
function boot() {
  document.documentElement.classList.add('js');
  sweepLinks();
  initReveals();
  initMenu(); initSplash(); initModals(); initTabs();
  initSelects(); initForms(); initAuth(); initDashboard();
  initServices(); initTrack(); initCalc();
  initCarousel3d(); initTestimonials(); initLightbox(); initTilt();
  initFx(); initMotion();
  closeOverlays();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
