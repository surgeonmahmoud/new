/* ===== UTILS.JS — دوري المذاكراوية ===== */

/* --- DOM helpers --- */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* --- Toast --- */
let _toastTimer;
function showToast(msg, type = 'info', duration = 3500) {
  let t = qs('#globalToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'globalToast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = `toast toast-${type} toast-show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('toast-show'), duration);
}

/* --- Formatters --- */
function formatNumber(n) {
  return Number(n || 0).toLocaleString('ar-EG');
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}
function todayStr() {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
}
function safeText(v) {
  return v == null ? '—' : String(v);
}
function safeNum(v, fallback = 0) {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

/* --- Auth --- */
function getCurrentStudent() {
  try { return JSON.parse(localStorage.getItem('currentStudent') || 'null'); } catch { return null; }
}
function setCurrentStudent(obj) {
  localStorage.setItem('currentStudent', JSON.stringify(obj));
}
function requireStudentAuth() {
  if (!getCurrentStudent()) {
    window.location.href = '/login.html';
    return null;
  }
  return getCurrentStudent();
}
function logoutStudent() {
  localStorage.removeItem('currentStudent');
  window.location.href = '/login.html';
}
/* aliases */
const requireAuth = requireStudentAuth;
const logout      = logoutStudent;

/* --- XP / Level --- */
const XP_LEVELS = [
  { level: 1, name: 'Rookie Intern',          min: 0,   max: 99  },
  { level: 2, name: 'Focus Fighter',           min: 100, max: 199 },
  { level: 3, name: 'Study Warrior',           min: 200, max: 349 },
  { level: 4, name: 'Surgeon Assistant',       min: 350, max: 499 },
  { level: 5, name: 'Elite Surgeon Student',   min: 500, max: Infinity },
];
function getXpLevel(xp) {
  const x = safeNum(xp);
  return XP_LEVELS.find(l => x >= l.min && x <= l.max) || XP_LEVELS[0];
}
function getLevelName(xp) {
  return getXpLevel(xp).name;
}

/* --- Streak calculator --- */
function calcStreak(dates) {
  if (!dates || !dates.length) return { current: 0, best: 0 };
  const unique = [...new Set(dates.map(d => d.slice(0, 10)))].sort().reverse();
  let current = 0, best = 0, streak = 0;
  const today = todayStr();
  for (let i = 0; i < unique.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const exp = expected.toLocaleDateString('en-CA');
    if (unique[i] === exp) {
      streak++;
      best = Math.max(best, streak);
    } else break;
  }
  current = streak;
  // full best streak scan
  let s = 1;
  for (let i = 1; i < unique.length; i++) {
    const a = new Date(unique[i - 1]);
    const b = new Date(unique[i]);
    const diff = (a - b) / 86400000;
    if (Math.round(diff) === 1) { s++; best = Math.max(best, s); }
    else s = 1;
  }
  return { current, best };
}

/* --- Modal --- */
function openModal(id) {
  const m = qs(`#${id}`);
  if (m) { m.classList.add('modal-open'); m.style.display = 'flex'; }
}
function closeModal(id) {
  const m = qs(`#${id}`);
  if (m) { m.classList.remove('modal-open'); m.style.display = 'none'; }
}

/* --- Alert inside a container --- */
function showAlert(containerId, msg, type = 'error') {
  const c = qs(`#${containerId}`);
  if (!c) return;
  c.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  c.style.display = 'block';
}
function clearAlert(containerId) {
  const c = qs(`#${containerId}`);
  if (c) { c.innerHTML = ''; c.style.display = 'none'; }
}

/* --- Loading / Empty HTML snippets --- */
function loadingHtml(msg = 'جاري التحميل…') {
  return `<div class="state-box loading-box"><span class="spinner"></span><p>${msg}</p></div>`;
}
function emptyHtml(msg = 'لا توجد بيانات') {
  return `<div class="state-box empty-box"><p>🫙</p><p>${msg}</p></div>`;
}

/* --- Tabs --- */
function initTabs(containerSel, onSwitch) {
  const container = qs(containerSel);
  if (!container) return;
  const tabs    = qsa('.tab-btn', container);
  const panels  = qsa('.tab-panel', container);
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = qs(`#${btn.dataset.tab}`, container) || qs(`#${btn.dataset.tab}`);
      if (target) target.classList.add('active');
      if (onSwitch) onSwitch(btn.dataset.tab);
    });
  });
  // activate first
  if (tabs[0]) tabs[0].click();
}

/* --- Active Nav --- */
function setActiveNav(href) {
  qsa('nav a').forEach(a => {
    a.classList.toggle('nav-active', a.getAttribute('href') === href);
  });
}

/* --- Mobile nav toggle --- */
function initNavToggle() {
  const toggle = qs('#navToggle');
  const nav    = qs('#sideNav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => nav.classList.toggle('nav-open'));
  document.addEventListener('click', e => {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
      nav.classList.remove('nav-open');
    }
  });
}
