===== MOZAKRAWY PART 1 STUDENT APP =====



===== FILE: assets\js\supabase.js =====

const SUPABASE_URL = "PASTE_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = "PASTE_SUPABASE_ANON_KEY_HERE";
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



===== FILE: assets\js\utils.js =====

/* ===== UTILS.JS â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ© ===== */

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
  if (!d) return 'â€”';
  return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}
function todayStr() {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
}
function safeText(v) {
  return v == null ? 'â€”' : String(v);
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
function loadingHtml(msg = 'Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„â€¦') {
  return `<div class="state-box loading-box"><span class="spinner"></span><p>${msg}</p></div>`;
}
function emptyHtml(msg = 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª') {
  return `<div class="state-box empty-box"><p>ðŸ«™</p><p>${msg}</p></div>`;
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



===== FILE: assets\js\auth.js =====

/* ===== AUTH.JS â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ© ===== */

/* SHA-256 via SubtleCrypto */
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---- LOGIN ---- */
async function handleLogin(e) {
  e.preventDefault();
  clearAlert('loginAlert');
  const btn   = qs('#loginBtn');
  const phone = qs('#loginPhone').value.trim();
  const pin   = qs('#loginPin').value.trim();
  if (!phone || !pin) { showAlert('loginAlert', 'Ø§Ø¯Ø®Ù„ Ø±Ù‚Ù… Ø§Ù„ØªÙ„ÙŠÙÙˆÙ† ÙˆØ§Ù„Ù€ PIN'); return; }
  btn.disabled = true;
  btn.textContent = 'Ø¬Ø§Ø±ÙŠâ€¦';
  try {
    const db = window.supabaseClient;
    const { data, error } = await db
      .from('students')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();
    if (error) throw error;
    if (!data) { showAlert('loginAlert', 'Ù…ÙÙŠØ´ Ø­Ø³Ø§Ø¨ Ø¨Ø§Ù„Ø±Ù‚Ù… Ø¯Ù‡'); return; }
    if (data.is_active === false) { showAlert('loginAlert', 'Ø§Ù„Ø­Ø³Ø§Ø¨ Ù…ÙˆÙ‚ÙˆÙ. ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©.'); return; }
    if (data.is_frozen === true)  { showAlert('loginAlert', 'Ø§Ù„Ø­Ø³Ø§Ø¨ Ù…ØªØ¬Ù…Ø¯ Ù…Ø¤Ù‚ØªØ§Ù‹.'); return; }

    let match = false;
    if (data.pin_hash && data.pin_hash.length === 64) {
      const hashed = await sha256(pin);
      match = hashed === data.pin_hash;
    } else {
      match = pin === data.pin_hash;
    }
    if (!match) { showAlert('loginAlert', 'Ø§Ù„Ù€ PIN ØºÙ„Ø·ØŒ Ø­Ø§ÙˆÙ„ ØªØ§Ù†ÙŠ'); return; }

    setCurrentStudent(data);
    window.location.href = '/student/home.html';
  } catch (err) {
    showAlert('loginAlert', 'Ø­ØµÙ„ Ø®Ø·Ø£: ' + (err.message || 'unknown'));
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ø¯Ø®ÙˆÙ„';
  }
}

/* ---- SIGNUP ---- */
async function handleSignup(e) {
  e.preventDefault();
  clearAlert('signupAlert');
  const btn = qs('#signupBtn');

  const name       = qs('#sName').value.trim();
  const phone      = qs('#sPhone').value.trim();
  const grade      = qs('#sGrade').value;
  const edu        = qs('#sEdu').value;
  const track      = qs('#sTrack').value;
  const doctor     = qs('#sDoctor').value;
  const pin        = qs('#sPin').value.trim();
  const pinConf    = qs('#sPinConf').value.trim();

  if (!name || !phone || !grade || !edu || !pin) {
    showAlert('signupAlert', 'Ø§ÙƒÙ…Ù„ ÙƒÙ„ Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©');
    return;
  }
  if (pin !== pinConf) {
    showAlert('signupAlert', 'Ø§Ù„Ù€ PIN Ù…Ø´ Ù…ØªØ·Ø§Ø¨Ù‚');
    return;
  }
  if (pin.length < 4) {
    showAlert('signupAlert', 'Ø§Ù„Ù€ PIN Ù„Ø§Ø²Ù… 4 Ø£Ø±Ù‚Ø§Ù… Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Ø¬Ø§Ø±ÙŠâ€¦';
  try {
    const db = window.supabaseClient;
    // check duplicate phone
    const { data: existing } = await db
      .from('students')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    if (existing) {
      showAlert('signupAlert', 'Ø§Ù„Ø±Ù‚Ù… Ø¯Ù‡ Ù…Ø³Ø¬Ù„ Ù‚Ø¨Ù„ ÙƒØ¯Ù‡. Ø§Ø¯Ø®Ù„ Ù…Ù† ØµÙØ­Ø© Ø§Ù„Ø¯Ø®ÙˆÙ„.');
      return;
    }
    const pin_hash = await sha256(pin);
    const now = new Date().toISOString();
    const payload = {
      name, phone, grade_level: grade, edu_system: edu, track: track || null,
      doctor_group: doctor || null,
      doctor_selected_at: doctor ? now : null,
      pin_hash, score: 0, xp: 0, level: 1,
      current_streak: 0, best_streak: 0,
      is_active: true, is_frozen: false,
      created_at: now, updated_at: now,
    };
    const { data: created, error } = await db
      .from('students')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    setCurrentStudent(created);
    showToast('ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨ Ø¨Ù†Ø¬Ø§Ø­ ðŸŽ‰', 'success');
    setTimeout(() => window.location.href = '/student/home.html', 1000);
  } catch (err) {
    showAlert('signupAlert', 'Ø®Ø·Ø£: ' + (err.message || 'unknown'));
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨';
  }
}

/* ---- LOAD DOCTOR GROUPS for signup select ---- */
async function loadDoctorGroupsSelect(selectId) {
  const sel = qs(`#${selectId}`);
  if (!sel) return;
  try {
    const db = window.supabaseClient;
    const { data } = await db
      .from('doctor_groups')
      .select('id, name, display_name')
      .eq('is_active', true)
      .eq('is_student_selectable', true)
      .order('sort_order');
    if (data) {
      data.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.name;
        opt.textContent = g.display_name || g.name;
        sel.appendChild(opt);
      });
    }
  } catch {}
}

/* ---- EDU/TRACK toggle on signup ---- */
function initSignupForm() {
  const eduSel   = qs('#sEdu');
  const trackWrap = qs('#trackWrap');
  function toggleTrack() {
    if (!trackWrap) return;
    const edu = eduSel ? eduSel.value : '';
    trackWrap.style.display = (edu === 'Ø¹Ù„Ù…ÙŠ' || edu === 'Ø£Ø¯Ø¨ÙŠ' || edu === 'other') ? 'block' : 'block';
  }
  if (eduSel) { eduSel.addEventListener('change', toggleTrack); toggleTrack(); }
  loadDoctorGroupsSelect('sDoctor');
  const form = qs('#signupForm');
  if (form) form.addEventListener('submit', handleSignup);
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = qs('#loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (qs('#signupForm')) initSignupForm();
});



===== FILE: assets\js\xp.js =====

/* ===== XP.JS â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ© ===== */

async function addXpTransaction(studentId, source, amount, note, seasonId) {
  if (!amount || amount <= 0) return;
  try {
    const db = window.supabaseClient;
    await db.from('xp_transactions').insert({
      student_id: studentId,
      source,
      amount,
      note: note || null,
      season_id: seasonId || null,
      created_at: new Date().toISOString(),
    });
    // upsert student_xp
    const { data: xpRow } = await db
      .from('student_xp')
      .select('xp_total')
      .eq('student_id', studentId)
      .maybeSingle();
    const current = safeNum(xpRow?.xp_total);
    const newTotal = current + amount;
    const lvl = getXpLevel(newTotal);
    await db.from('student_xp').upsert({
      student_id: studentId,
      xp_total: newTotal,
      level: lvl.level,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_id' });
  } catch (err) {
    console.warn('XP transaction failed', err);
  }
}

async function getStudentXp(studentId) {
  try {
    const db = window.supabaseClient;
    const { data } = await db
      .from('student_xp')
      .select('xp_total, level')
      .eq('student_id', studentId)
      .maybeSingle();
    return data || { xp_total: 0, level: 1 };
  } catch {
    return { xp_total: 0, level: 1 };
  }
}

function renderXpBar(xp, containerId) {
  const c = qs(`#${containerId}`);
  if (!c) return;
  const lvl = getXpLevel(xp);
  const range = lvl.max === Infinity ? xp - lvl.min : lvl.max - lvl.min;
  const progress = lvl.max === Infinity ? 100 : Math.min(100, ((xp - lvl.min) / range) * 100);
  c.innerHTML = `
    <div class="xp-label">
      <span class="xp-level-name">${lvl.name}</span>
      <span class="xp-total">${formatNumber(xp)} XP</span>
    </div>
    <div class="xp-bar-track">
      <div class="xp-bar-fill" style="width:${progress}%"></div>
    </div>
    <div class="xp-sublabel">Ù…Ø³ØªÙˆÙ‰ ${lvl.level} / 5</div>
  `;
}



===== FILE: assets\js\student.js =====

/* ===== STUDENT.JS â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ© ===== */

async function loadStudentHome() {
  const student = requireStudentAuth();
  if (!student) return;
  const db = window.supabaseClient;

  // Fill name header
  const nameEl = qs('#studentName');
  if (nameEl) nameEl.textContent = student.name;

  // Fill meta
  const setEl = (id, val) => { const el = qs(`#${id}`); if (el) el.textContent = safeText(val); };
  setEl('metaGrade', student.grade_level);
  setEl('metaEdu', student.edu_system);
  setEl('metaTrack', student.track || 'â€”');
  setEl('metaDoctor', student.doctor_group || 'â€”');

  // Platform totals
  try {
    const { data: totals } = await db
      .from('v_student_platform_totals')
      .select('*')
      .eq('student_id', student.id)
      .maybeSingle();
    if (totals) {
      setEl('statScore',   formatNumber(totals.total_score));
      setEl('statQuestions', formatNumber(totals.total_questions));
      setEl('statReportHours', formatNumber(totals.report_study_hours));
      setEl('statOpHours', (safeNum(totals.operation_minutes) / 60).toFixed(1));
      setEl('statTotalHours', formatNumber(totals.total_study_hours));
      setEl('statXp', formatNumber(totals.total_xp));
      renderXpBar(safeNum(totals.total_xp), 'xpBarContainer');
    }
  } catch (err) { console.warn('totals error', err); }

  // Streak from daily_reports
  try {
    const { data: reports } = await db
      .from('daily_reports')
      .select('report_date')
      .eq('student_id', student.id);
    if (reports) {
      const dates = reports.map(r => r.report_date);
      const { current, best } = calcStreak(dates);
      setEl('statStreak', current);
      setEl('statBestStreak', best);
    }
  } catch {}

  // Doctor group modal
  if (!student.doctor_group) {
    openModal('doctorModal');
    loadDoctorModalGroups();
  }

  // Set active nav
  setActiveNav('/student/home.html');
}

async function loadDoctorModalGroups() {
  const db  = window.supabaseClient;
  const list = qs('#doctorModalList');
  if (!list) return;
  list.innerHTML = loadingHtml('Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø§Øªâ€¦');
  try {
    const { data } = await db
      .from('doctor_groups')
      .select('id, name, display_name')
      .eq('is_active', true)
      .eq('is_student_selectable', true)
      .order('sort_order');
    if (!data || !data.length) { list.innerHTML = emptyHtml('Ù…ÙÙŠØ´ Ù…Ø¬Ù…ÙˆØ¹Ø§Øª Ù…ØªØ§Ø­Ø©'); return; }
    list.innerHTML = '';
    data.forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'doctor-choice-btn';
      btn.textContent = g.display_name || g.name;
      btn.addEventListener('click', () => chooseDoctorGroup(g.name));
      list.appendChild(btn);
    });
  } catch (err) {
    list.innerHTML = emptyHtml('Ø®Ø·Ø£ ÙÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„');
  }
}

async function chooseDoctorGroup(groupName) {
  const student = getCurrentStudent();
  if (!student) return;
  const db = window.supabaseClient;
  try {
    const now = new Date().toISOString();
    const { error } = await db
      .from('students')
      .update({ doctor_group: groupName, doctor_selected_at: now, updated_at: now })
      .eq('id', student.id);
    if (error) throw error;
    student.doctor_group = groupName;
    student.doctor_selected_at = now;
    setCurrentStudent(student);
    closeModal('doctorModal');
    const el = qs('#metaDoctor');
    if (el) el.textContent = groupName;
    showToast('ØªÙ… Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© âœ…', 'success');
  } catch (err) {
    showToast('Ø®Ø·Ø£: ' + err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (qs('#studentHomePage')) loadStudentHome();
  initNavToggle();
});



===== FILE: assets\js\report.js =====

/* ===== REPORT.JS â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ© ===== */

const ACTIVITY_POINTS = {
  questions:           (amt) => Math.floor(amt / 20),
  lesson:              (amt) => amt,
  chapter:             (amt) => amt * 3,
  unit:                (amt) => amt * 3,
  comprehensive_exam:  ()    => 4,
  center_attendance:   ()    => 3,
  review_video:        ()    => 3,
  study_hours:         ()    => 0,
};

let pendingAchievements = [];
let editingIndex = null;

function calcPoints(actType, amount) {
  const fn = ACTIVITY_POINTS[actType];
  return fn ? fn(safeNum(amount)) : 0;
}

function renderAchievements() {
  const container = qs('#achievementsList');
  if (!container) return;
  if (!pendingAchievements.length) {
    container.innerHTML = emptyHtml('Ù„Ù… ØªØ¶Ù Ø¥Ù†Ø¬Ø§Ø²Ø§Øª Ø¨Ø¹Ø¯');
    qs('#submitReportBtn').disabled = true;
    return;
  }
  qs('#submitReportBtn').disabled = false;
  container.innerHTML = pendingAchievements.map((a, i) => `
    <div class="achievement-card">
      <div class="ach-info">
        <span class="ach-subject">${safeText(a.subject)}</span>
        <span class="ach-type">${safeText(a.activity_type)}</span>
        ${a.amount ? `<span class="ach-amount">Ø§Ù„ÙƒÙ…ÙŠØ©: ${a.amount}</span>` : ''}
        ${a.study_hours ? `<span class="ach-hours">â± ${a.study_hours} Ø³Ø§Ø¹Ø©</span>` : ''}
        ${a.notes ? `<p class="ach-notes">${safeText(a.notes)}</p>` : ''}
      </div>
      <div class="ach-actions">
        <button class="btn-icon" onclick="removeAchievement(${i})">ðŸ—‘</button>
      </div>
    </div>
  `).join('');
}

function removeAchievement(i) {
  pendingAchievements.splice(i, 1);
  renderAchievements();
}

function addAchievement(e) {
  e.preventDefault();
  clearAlert('achAlert');
  const subject      = qs('#achSubject').value.trim();
  const study_hours  = safeNum(qs('#achHours').value);
  const activity_type = qs('#achType').value;
  const amount       = safeNum(qs('#achAmount').value);
  const notes        = qs('#achNotes').value.trim();

  if (!subject || !activity_type) {
    showAlert('achAlert', 'Ø§Ø®ØªØ± Ø§Ù„Ù…Ø§Ø¯Ø© ÙˆÙ†ÙˆØ¹ Ø§Ù„Ù†Ø´Ø§Ø·');
    return;
  }

  pendingAchievements.push({ subject, study_hours, activity_type, amount, notes });
  renderAchievements();

  // reset form
  qs('#achSubject').value = '';
  qs('#achHours').value = '0';
  qs('#achHoursVal').textContent = '0';
  qs('#achType').value = '';
  qs('#achAmount').value = '0';
  qs('#achNotes').value = '';
  showToast('ØªÙ…Øª Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²', 'success');
}

async function submitReport() {
  const student = getCurrentStudent();
  if (!student) return;
  if (!pendingAchievements.length) {
    showToast('Ø£Ø¶Ù Ø¥Ù†Ø¬Ø§Ø² Ø§Ù„Ø£ÙˆÙ„', 'error');
    return;
  }
  const db = window.supabaseClient;
  const today = todayStr();

  // Check existing submission
  const { data: existing } = await db
    .from('report_submissions')
    .select('id')
    .eq('student_id', student.id)
    .eq('report_date', today)
    .maybeSingle();
  if (existing) {
    showToast('Ø¹Ù†Ø¯Ùƒ ØªÙ‚Ø±ÙŠØ± Ù…ÙØ±Ø³ÙŽÙ„ Ø§Ù„ÙŠÙˆÙ… Ø¨Ø§Ù„ÙØ¹Ù„', 'error');
    return;
  }

  const btn = qs('#submitReportBtn');
  btn.disabled = true;
  btn.textContent = 'Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„â€¦';

  try {
    const now = new Date().toISOString();
    let totalPoints = 0;
    let totalHours  = 0;
    const rows = pendingAchievements.map(a => {
      const pts = calcPoints(a.activity_type, a.amount);
      totalPoints += pts;
      totalHours  += safeNum(a.study_hours);
      return { pts, a };
    });

    const status = totalPoints > 20 ? 'pending' : 'approved';

    // Insert report_submissions
    const { data: sub, error: subErr } = await db
      .from('report_submissions')
      .insert({
        student_id: student.id,
        report_date: today,
        total_points: totalPoints,
        total_study_hours: totalHours,
        status,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
    if (subErr) throw subErr;

    // Insert daily_reports
    const drRows = rows.map(({ pts, a }) => ({
      student_id: student.id,
      subject: a.subject,
      activity_type: a.activity_type,
      amount: a.amount,
      notes: a.notes || null,
      report_date: today,
      status,
      points: pts,
      submission_id: sub.id,
      study_hours: a.study_hours,
      created_at: now,
      updated_at: now,
    }));
    const { error: drErr } = await db.from('daily_reports').insert(drRows);
    if (drErr) throw drErr;

    // XP if approved
    if (status === 'approved' && totalPoints > 0) {
      await addXpTransaction(student.id, 'daily_report', totalPoints * 2, 'ØªÙ‚Ø±ÙŠØ± ÙŠÙˆÙ…ÙŠ', null);
    }

    pendingAchievements = [];
    renderAchievements();
    showToast(status === 'approved' ? 'âœ… ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªÙ‚Ø±ÙŠØ± ÙˆØªÙ…Øª Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø©!' : 'â³ Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ù…ÙØ±Ø³ÙŽÙ„ ÙˆØ¨ÙŠÙ†ØªØ¸Ø± Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©', 'success', 5000);
  } catch (err) {
    showToast('Ø®Ø·Ø£: ' + (err.message || 'unknown'), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªÙ‚Ø±ÙŠØ±';
  }
}

async function checkTodayReport() {
  const student = getCurrentStudent();
  if (!student) return;
  const db = window.supabaseClient;
  const { data } = await db
    .from('report_submissions')
    .select('id, status, total_points, total_study_hours')
    .eq('student_id', student.id)
    .eq('report_date', todayStr())
    .maybeSingle();
  if (data) {
    const banner = qs('#todayReportBanner');
    if (banner) {
      banner.innerHTML = `<div class="alert alert-info">ðŸ“‹ Ø£Ø±Ø³Ù„Øª ØªÙ‚Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ… â€” Ø§Ù„Ø­Ø§Ù„Ø©: <strong>${data.status}</strong> | ${data.total_points} Ù†Ù‚Ø·Ø©</div>`;
      banner.style.display = 'block';
    }
    qs('#submitReportBtn').disabled = true;
  }
}

// Hours slider live update
function initReportPage() {
  requireStudentAuth();
  setActiveNav('/student/report.html');
  initNavToggle();

  const hoursSlider = qs('#achHours');
  const hoursVal    = qs('#achHoursVal');
  if (hoursSlider && hoursVal) {
    hoursSlider.addEventListener('input', () => { hoursVal.textContent = hoursSlider.value; });
  }

  const form = qs('#achForm');
  if (form) form.addEventListener('submit', addAchievement);

  const submitBtn = qs('#submitReportBtn');
  if (submitBtn) submitBtn.addEventListener('click', submitReport);

  renderAchievements();
  checkTodayReport();
}

document.addEventListener('DOMContentLoaded', () => {
  if (qs('#reportPage')) initReportPage();
});



===== FILE: assets\js\operation.js =====

/* ===== OPERATION.JS â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ© ===== */

const OP_MAX_Q = { 30: 25, 50: 45, 60: 60, 90: 80 };
const OP_TASKS = { 30: 1, 50: 2, 60: 2, 90: 4 };

function calcTaskPoints(taskType, amount) {
  switch (taskType) {
    case 'Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©': {
      const q = safeNum(amount);
      if (q < 10)  return 1;
      if (q < 30)  return 2;
      if (q < 60)  return 3;
      if (q < 100) return 4;
      return 5;
    }
    case 'Ø¯Ø±Ø³ Ø¹Ø§Ø¯ÙŠ':    return safeNum(amount);
    case 'ÙØµÙ„/Ø¨Ø§Ø¨':     return 4;
    case 'ÙÙŠØ¯ÙŠÙˆ Ù…Ø±Ø§Ø¬Ø¹Ø©': return 4;
    case 'Ø§Ù…ØªØ­Ø§Ù† Ø´Ø§Ù…Ù„':  return 6;
    default: return 0;
  }
}

let opState = {
  phase: 'setup',       // setup | session | break | done
  plannedDuration: 60,
  breakMinutes: 10,
  subject: '',
  tasks: [],
  currentTask: 0,
  startedAt: null,
  taskStartedAt: null,
  breakStartedAt: null,
  timerInterval: null,
  completedTasks: [],
};

function getOpEl(id) { return qs(`#${id}`); }

/* ---- SETUP ---- */
function initOpSetup() {
  const dur    = getOpEl('opDuration');
  const brk    = getOpEl('opBreak');
  const taskCount = () => OP_TASKS[safeNum(dur?.value)] || 1;

  function buildTaskForms() {
    const n = taskCount();
    const container = getOpEl('taskForms');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < n; i++) {
      container.insertAdjacentHTML('beforeend', buildTaskForm(i));
    }
    // attach slider listeners
    container.querySelectorAll('.task-type-sel').forEach(sel => {
      sel.addEventListener('change', () => updateAmountField(sel));
    });
    container.querySelectorAll('.task-amount-slider').forEach(sl => {
      sl.addEventListener('input', e => {
        const wrap = e.target.closest('.task-form');
        const valEl = wrap?.querySelector('.task-amount-val');
        if (valEl) valEl.textContent = e.target.value;
      });
    });
  }

  if (dur) dur.addEventListener('change', buildTaskForms);
  buildTaskForms();

  const startBtn = getOpEl('startOpBtn');
  if (startBtn) startBtn.addEventListener('click', startSession);
}

function buildTaskForm(i) {
  return `
  <div class="task-form card" data-task-index="${i}">
    <h4 class="task-form-title">Ù…Ù‡Ù…Ø© ${i + 1}</h4>
    <div class="form-group">
      <label>Ø§Ù„Ù…Ø§Ø¯Ø©</label>
      <input class="form-input task-subject" type="text" placeholder="Ø§Ø³Ù… Ø§Ù„Ù…Ø§Ø¯Ø©" />
    </div>
    <div class="form-group">
      <label>Ù†ÙˆØ¹ Ø§Ù„Ù…Ù‡Ù…Ø©</label>
      <select class="form-select task-type-sel">
        <option value="">Ø§Ø®ØªØ±</option>
        <option value="Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©">Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©</option>
        <option value="Ø¯Ø±Ø³ Ø¹Ø§Ø¯ÙŠ">Ø¯Ø±Ø³ Ø¹Ø§Ø¯ÙŠ</option>
        <option value="ÙØµÙ„/Ø¨Ø§Ø¨">ÙØµÙ„/Ø¨Ø§Ø¨</option>
        <option value="ÙÙŠØ¯ÙŠÙˆ Ù…Ø±Ø§Ø¬Ø¹Ø©">ÙÙŠØ¯ÙŠÙˆ Ù…Ø±Ø§Ø¬Ø¹Ø©</option>
        <option value="Ø§Ù…ØªØ­Ø§Ù† Ø´Ø§Ù…Ù„">Ø§Ù…ØªØ­Ø§Ù† Ø´Ø§Ù…Ù„</option>
      </select>
    </div>
    <div class="form-group task-amount-wrap" style="display:none">
      <label>Ø§Ù„ÙƒÙ…ÙŠØ©: <span class="task-amount-val">0</span></label>
      <input type="range" class="rtl-slider task-amount-slider" min="0" max="25" value="0" />
    </div>
  </div>`;
}

function updateAmountField(sel) {
  const wrap   = sel.closest('.task-form');
  const amtWrap = wrap?.querySelector('.task-amount-wrap');
  const slider  = wrap?.querySelector('.task-amount-slider');
  const valEl   = wrap?.querySelector('.task-amount-val');
  if (!amtWrap || !slider) return;
  const type = sel.value;
  if (!type || ['ÙØµÙ„/Ø¨Ø§Ø¨','ÙÙŠØ¯ÙŠÙˆ Ù…Ø±Ø§Ø¬Ø¹Ø©','Ø§Ù…ØªØ­Ø§Ù† Ø´Ø§Ù…Ù„'].includes(type)) {
    amtWrap.style.display = 'none';
    slider.value = 1;
    if (valEl) valEl.textContent = '1';
    return;
  }
  amtWrap.style.display = 'block';
  if (type === 'Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©') {
    const dur = safeNum(getOpEl('opDuration')?.value || 60);
    slider.max = OP_MAX_Q[dur] || 60;
    slider.min = 0;
  } else if (type === 'Ø¯Ø±Ø³ Ø¹Ø§Ø¯ÙŠ') {
    slider.min = 1; slider.max = 3; slider.value = 1;
    if (valEl) valEl.textContent = '1';
  }
}

function startSession() {
  const dur = safeNum(getOpEl('opDuration')?.value);
  const brk = safeNum(getOpEl('opBreak')?.value);
  const subject = getOpEl('opSubject')?.value.trim();
  if (!dur || !subject) { showToast('Ø§Ø®ØªØ± Ø§Ù„Ù…Ø¯Ø© ÙˆØ§Ù„Ù…Ø§Ø¯Ø©', 'error'); return; }

  const taskForms = qsa('.task-form');
  const tasks = [];
  let valid = true;
  taskForms.forEach((tf, i) => {
    const type   = tf.querySelector('.task-type-sel')?.value;
    const amt    = safeNum(tf.querySelector('.task-amount-slider')?.value || 1);
    const subj   = tf.querySelector('.task-subject')?.value.trim() || subject;
    if (!type) { valid = false; }
    tasks.push({ subject: subj, task_type: type, amount: amt });
  });
  if (!valid) { showToast('Ø§Ø®ØªØ± Ù†ÙˆØ¹ ÙƒÙ„ Ù…Ù‡Ù…Ø©', 'error'); return; }

  opState.plannedDuration = dur;
  opState.breakMinutes    = brk;
  opState.subject         = subject;
  opState.tasks           = tasks;
  opState.currentTask     = 0;
  opState.startedAt       = new Date();
  opState.completedTasks  = [];

  showPhase('session');
  startTaskTimer();
}

/* ---- TIMER ---- */
function showPhase(phase) {
  opState.phase = phase;
  qsa('.op-phase').forEach(el => el.style.display = 'none');
  const el = getOpEl(`phase-${phase}`);
  if (el) el.style.display = 'block';
}

function startTaskTimer() {
  const task = opState.tasks[opState.currentTask];
  if (!task) { finishSession(); return; }
  opState.taskStartedAt = new Date();
  clearInterval(opState.timerInterval);

  const nameEl = getOpEl('currentTaskName');
  if (nameEl) nameEl.textContent = `Ù…Ù‡Ù…Ø© ${opState.currentTask + 1}: ${task.task_type}`;

  opState.timerInterval = setInterval(() => {
    const elapsed = Math.floor((new Date() - opState.taskStartedAt) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    const el = getOpEl('sessionTimer');
    if (el) el.textContent = `${m}:${s}`;
  }, 1000);
}

function nextTask() {
  // save current task
  const task = opState.tasks[opState.currentTask];
  const taskDur = Math.floor((new Date() - opState.taskStartedAt) / 60000);
  opState.completedTasks.push({ ...task, duration_minutes: taskDur });
  opState.currentTask++;

  if (opState.currentTask >= opState.tasks.length) {
    clearInterval(opState.timerInterval);
    finishSession();
    return;
  }
  // start break
  clearInterval(opState.timerInterval);
  showPhase('break');
  opState.breakStartedAt = new Date();
  let breakLeft = opState.breakMinutes * 60;
  const breakEl = getOpEl('breakTimer');
  opState.timerInterval = setInterval(() => {
    breakLeft--;
    const m = String(Math.floor(breakLeft / 60)).padStart(2, '0');
    const s = String(breakLeft % 60).padStart(2, '0');
    if (breakEl) breakEl.textContent = `${m}:${s}`;
    if (breakLeft <= 0) {
      clearInterval(opState.timerInterval);
      showPhase('session');
      startTaskTimer();
    }
  }, 1000);
}

function skipBreak() {
  clearInterval(opState.timerInterval);
  showPhase('session');
  startTaskTimer();
}

async function confirmEndSession() {
  const confirmed = confirm('Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ø¥Ù†Ùƒ Ø¹Ø§ÙŠØ² ØªÙ†Ù‡ÙŠ Ø§Ù„Ø¬Ù„Ø³Ø©ØŸ');
  if (!confirmed) return;
  // save current task as partial
  const task = opState.tasks[opState.currentTask];
  if (task && opState.taskStartedAt) {
    const dur = Math.floor((new Date() - opState.taskStartedAt) / 60000);
    opState.completedTasks.push({ ...task, duration_minutes: dur });
  }
  clearInterval(opState.timerInterval);
  await finishSession();
}

async function finishSession() {
  const student = getCurrentStudent();
  if (!student) return;
  const db = window.supabaseClient;

  const endedAt = new Date();
  const actualDuration = Math.floor((endedAt - opState.startedAt) / 60000);
  const planned = opState.plannedDuration;

  let pointsMulti = 1;
  if (actualDuration < 10) pointsMulti = 0;
  else if (actualDuration < planned / 2) pointsMulti = 0.5;

  let totalLeaguePoints = 0;
  let totalXp = 0;
  const taskRows = opState.completedTasks.map(t => {
    const lp  = Math.floor(calcTaskPoints(t.task_type, t.amount) * pointsMulti);
    const xpa = lp * 3;
    totalLeaguePoints += lp;
    totalXp += xpa;
    return { ...t, league_points: lp, xp_awarded: xpa };
  });

  try {
    const now = endedAt.toISOString();
    const { data: sess, error: sessErr } = await db.from('study_sessions').insert({
      student_id: student.id,
      subject: opState.subject,
      session_type: 'operation_room',
      duration_minutes: actualDuration,
      break_minutes: opState.breakMinutes,
      task_type: 'multi',
      amount: taskRows.reduce((s, t) => s + safeNum(t.amount), 0),
      league_points: totalLeaguePoints,
      xp_awarded: totalXp,
      status: 'completed',
      started_at: opState.startedAt.toISOString(),
      ended_at: now,
      created_at: now,
      updated_at: now,
    }).select().single();
    if (sessErr) throw sessErr;

    const opTaskRows = taskRows.map(t => ({
      session_id: sess.id,
      student_id: student.id,
      subject: t.subject || opState.subject,
      task_type: t.task_type,
      amount: t.amount,
      duration_minutes: t.duration_minutes,
      league_points: t.league_points,
      xp_awarded: t.xp_awarded,
      created_at: now,
    }));
    await db.from('operation_session_tasks').insert(opTaskRows);

    if (totalXp > 0) {
      await addXpTransaction(student.id, 'operation_room', totalXp, 'Operation Room', null);
    }

    // show summary
    showPhase('done');
    const summaryEl = getOpEl('sessionSummary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <p>â± Ù…Ø¯Ø© Ø§Ù„Ø¬Ù„Ø³Ø© Ø§Ù„ÙØ¹Ù„ÙŠØ©: <strong>${actualDuration} Ø¯Ù‚ÙŠÙ‚Ø©</strong></p>
        <div class="task-summary-list">
          ${opTaskRows.map((t, i) => `
            <div class="task-summary-card">
              <strong>Ù…Ù‡Ù…Ø© ${i+1}:</strong> ${t.task_type}
              ${t.amount ? ` â€” ${t.amount}` : ''}
              â€” ${t.duration_minutes} Ø¯Ù‚ÙŠÙ‚Ø©
            </div>
          `).join('')}
        </div>
        <p class="mt-1">ðŸŽ¯ Ø£ØªÙ…Ù…Øª ${opTaskRows.length} Ù…Ù‡Ù…Ø© Ø¨Ù†Ø¬Ø§Ø­!</p>
      `;
    }
  } catch (err) {
    showToast('Ø®Ø·Ø£ ÙÙŠ Ø­ÙØ¸ Ø§Ù„Ø¬Ù„Ø³Ø©: ' + err.message, 'error');
  }
}

function resetOperation() {
  opState = {
    phase: 'setup', plannedDuration: 60, breakMinutes: 10,
    subject: '', tasks: [], currentTask: 0,
    startedAt: null, taskStartedAt: null, breakStartedAt: null,
    timerInterval: null, completedTasks: [],
  };
  showPhase('setup');
}

document.addEventListener('DOMContentLoaded', () => {
  if (qs('#operationPage')) {
    requireStudentAuth();
    setActiveNav('/student/operation.html');
    initNavToggle();
    initOpSetup();

    const nextBtn  = qs('#nextTaskBtn');
    const endBtn   = qs('#endSessionBtn');
    const skipBtn  = qs('#skipBreakBtn');
    const resetBtn = qs('#resetOpBtn');
    if (nextBtn)  nextBtn.addEventListener('click', nextTask);
    if (endBtn)   endBtn.addEventListener('click', confirmEndSession);
    if (skipBtn)  skipBtn.addEventListener('click', skipBreak);
    if (resetBtn) resetBtn.addEventListener('click', resetOperation);
  }
});



===== FILE: assets\js\leaderboards.js =====

/* ===== LEADERBOARDS.JS â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ© ===== */

async function loadLeaderboardTab(tabKey) {
  const student = getCurrentStudent();
  const container = qs(`#lb-${tabKey}`);
  if (!container) return;
  container.innerHTML = loadingHtml();
  const db = window.supabaseClient;

  try {
    let data, nameField, valueField, valueSuffix;
    switch (tabKey) {
      case 'general':
        ({ data } = await db.from('v_leaderboard_general').select('*').order('rank_position').limit(50));
        nameField = 'student_name'; valueField = 'total_score'; valueSuffix = 'Ù†Ù‚Ø·Ø©';
        break;
      case 'questions':
        ({ data } = await db.from('v_leaderboard_questions').select('*').order('rank_position').limit(50));
        nameField = 'student_name'; valueField = 'total_questions'; valueSuffix = 'Ø³Ø¤Ø§Ù„';
        break;
      case 'focus':
        ({ data } = await db.from('v_leaderboard_focus').select('*').order('rank_position').limit(50));
        nameField = 'student_name'; valueField = 'operation_minutes'; valueSuffix = 'Ø¯Ù‚ÙŠÙ‚Ø©';
        break;
      case 'persistent':
        ({ data } = await db.from('v_leaderboard_persistent').select('*').order('rank_position').limit(50));
        nameField = 'student_name'; valueField = 'total_study_hours'; valueSuffix = 'Ø³Ø§Ø¹Ø©';
        break;
      case 'quiz':
        ({ data } = await db.from('quiz_grades').select('student_name, score').order('score', { ascending: false }).limit(50));
        nameField = 'student_name'; valueField = 'score'; valueSuffix = 'Ø¯Ø±Ø¬Ø©';
        break;
    }
    if (!data || !data.length) { container.innerHTML = emptyHtml('Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ø¨Ø¹Ø¯'); return; }

    const medals = ['ðŸ¥‡', 'ðŸ¥ˆ', 'ðŸ¥‰'];
    container.innerHTML = `<div class="lb-table">` +
      data.map((row, i) => {
        const isMe = student && row.student_id === student.id;
        return `
        <div class="lb-row ${isMe ? 'lb-row-me' : ''}">
          <span class="lb-rank">${medals[i] || (i + 1)}</span>
          <span class="lb-name">${safeText(row[nameField])}</span>
          <span class="lb-value">${formatNumber(row[valueField])} ${valueSuffix}</span>
        </div>`;
      }).join('') + `</div>`;
  } catch (err) {
    container.innerHTML = emptyHtml('Ø®Ø·Ø£ ÙÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„: ' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (qs('#leaderboardsPage')) {
    requireStudentAuth();
    setActiveNav('/student/leaderboards.html');
    initNavToggle();
    initTabs('#lbTabs', loadLeaderboardTab);
  }
});



===== FILE: assets\css\main.css =====

/* ===== MAIN.CSS â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ© ===== */
@import url('https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800&family=Readex+Pro:wght@300;400;500;600;700&display=swap');

/* ===================== TOKENS ===================== */
:root {
  --bg:           #0a0a12;
  --bg2:          #10101e;
  --bg3:          #16162a;
  --bg4:          #1e1e36;
  --border:       #2a2a4a;
  --border2:      #3a3a60;

  --purple:       #6c3fc5;
  --purple-light: #9b6bff;
  --purple-dim:   #2d1f5e;

  --green:        #00ff88;
  --green-dim:    #003322;
  --cyan:         #00d4ff;
  --cyan-dim:     #002233;
  --gold:         #ffd700;
  --gold-dim:     #332a00;

  --text:         #e8e8f0;
  --text-muted:   #7a7a9a;
  --text-dim:     #4a4a6a;

  --danger:       #ff4466;
  --warning:      #ffaa00;
  --success:      #00ff88;
  --info:         #00d4ff;

  --radius:       12px;
  --radius-sm:    8px;
  --radius-lg:    18px;
  --shadow:       0 4px 24px rgba(0,0,0,0.5);
  --shadow-glow:  0 0 20px rgba(108,63,197,0.3);

  --font-display: 'Alexandria', sans-serif;
  --font-body:    'Readex Pro', sans-serif;

  --nav-width:    240px;
  --header-h:     60px;
}

/* ===================== RESET ===================== */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; scroll-behavior: smooth; }
body {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text);
  direction: rtl;
  min-height: 100vh;
  line-height: 1.6;
}
a { color: var(--purple-light); text-decoration: none; }
a:hover { color: var(--green); }
img { max-width: 100%; display: block; }
button { cursor: pointer; font-family: inherit; }
input, select, textarea { font-family: inherit; }

/* ===================== SCROLLBAR ===================== */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg2); }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

/* ===================== LAYOUT ===================== */
.app-shell {
  display: flex;
  min-height: 100vh;
}

/* ---- Sidebar Nav ---- */
.side-nav {
  width: var(--nav-width);
  background: var(--bg2);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; right: 0; bottom: 0;
  z-index: 100;
  transition: transform 0.25s ease;
  overflow-y: auto;
}
.nav-brand {
  padding: 20px 16px;
  border-bottom: 1px solid var(--border);
  text-align: center;
}
.nav-brand .brand-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 800;
  color: var(--gold);
  letter-spacing: -0.02em;
}
.nav-brand .brand-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 2px;
}
.nav-links {
  list-style: none;
  padding: 12px 0;
  flex: 1;
}
.nav-links li a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 20px;
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 500;
  border-radius: 0;
  transition: all 0.18s;
}
.nav-links li a:hover,
.nav-links li a.nav-active {
  color: var(--text);
  background: var(--bg3);
  border-right: 3px solid var(--green);
  padding-right: 17px;
}
.nav-links li a .nav-icon { width: 18px; text-align: center; }
.nav-logout a { color: var(--danger) !important; }
.nav-logout a:hover { background: rgba(255,68,102,0.1) !important; border-color: var(--danger) !important; }

/* ---- Main content ---- */
.main-content {
  margin-right: var(--nav-width);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.page-header {
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
  height: var(--header-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
}
.page-header .page-title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
}
.page-body {
  padding: 24px;
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}

/* ---- Hamburger ---- */
.nav-toggle {
  display: none;
  background: none;
  border: none;
  color: var(--text);
  font-size: 1.4rem;
  padding: 4px;
}

/* ===================== CARD ===================== */
.card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}
.card-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 14px;
}
.card-sm { padding: 14px 16px; }

/* ===================== STAT CARDS ===================== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}
.stat-card {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  text-align: center;
  transition: border-color 0.2s;
}
.stat-card:hover { border-color: var(--purple-light); }
.stat-value {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--gold);
  line-height: 1.2;
}
.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 4px;
}
.stat-card.accent-green .stat-value { color: var(--green); }
.stat-card.accent-cyan  .stat-value { color: var(--cyan); }
.stat-card.accent-purple .stat-value { color: var(--purple-light); }
.stat-card.accent-gold .stat-value { color: var(--gold); }

/* ===================== XP BAR ===================== */
.xp-bar-container {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 20px;
}
.xp-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.xp-level-name {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--purple-light);
}
.xp-total {
  font-size: 0.8rem;
  color: var(--gold);
  font-weight: 600;
}
.xp-bar-track {
  background: var(--bg4);
  border-radius: 99px;
  height: 10px;
  overflow: hidden;
}
.xp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--purple), var(--green));
  border-radius: 99px;
  transition: width 0.6s ease;
}
.xp-sublabel {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 6px;
  text-align: left;
}

/* ===================== FORM ELEMENTS ===================== */
.form-group { margin-bottom: 16px; }
.form-group label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.form-input,
.form-select,
.form-textarea {
  width: 100%;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  padding: 10px 14px;
  font-size: 0.9rem;
  transition: border-color 0.18s;
  outline: none;
  direction: rtl;
}
.form-input:focus,
.form-select:focus,
.form-textarea:focus { border-color: var(--purple-light); box-shadow: 0 0 0 2px rgba(155,107,255,0.15); }
.form-select option { background: var(--bg3); }
.form-textarea { resize: vertical; min-height: 80px; }

/* ---- Sliders ---- */
input[type=range] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: var(--bg4);
  border-radius: 99px;
  outline: none;
  direction: ltr; /* RTL sliders */
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: var(--purple-light);
  cursor: pointer;
  border: 2px solid var(--bg);
  box-shadow: 0 0 6px rgba(155,107,255,0.5);
}
.rtl-slider { direction: ltr; }

/* ===================== BUTTONS ===================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  transition: all 0.18s;
  cursor: pointer;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary {
  background: var(--purple);
  color: #fff;
}
.btn-primary:hover:not(:disabled) { background: var(--purple-light); box-shadow: 0 0 14px rgba(155,107,255,0.4); }
.btn-success {
  background: var(--green);
  color: var(--bg);
}
.btn-success:hover:not(:disabled) { filter: brightness(1.1); }
.btn-danger {
  background: var(--danger);
  color: #fff;
}
.btn-danger:hover:not(:disabled) { filter: brightness(1.1); }
.btn-ghost {
  background: transparent;
  border: 1px solid var(--border2);
  color: var(--text-muted);
}
.btn-ghost:hover:not(:disabled) { border-color: var(--purple-light); color: var(--text); }
.btn-gold {
  background: var(--gold);
  color: var(--bg);
  font-weight: 800;
}
.btn-gold:hover:not(:disabled) { filter: brightness(1.1); }
.btn-full { width: 100%; }
.btn-icon {
  background: none;
  border: none;
  font-size: 1.1rem;
  padding: 4px 8px;
  color: var(--text-muted);
}
.btn-icon:hover { color: var(--danger); }
.btn-sm { padding: 6px 14px; font-size: 0.8rem; }
.btn-lg { padding: 14px 28px; font-size: 1rem; }

/* ===================== ALERTS & TOASTS ===================== */
.alert {
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  margin-bottom: 14px;
}
.alert-error   { background: rgba(255,68,102,0.12); border: 1px solid rgba(255,68,102,0.3); color: #ff9aaa; }
.alert-success { background: rgba(0,255,136,0.1);   border: 1px solid rgba(0,255,136,0.3); color: var(--green); }
.alert-info    { background: rgba(0,212,255,0.1);   border: 1px solid rgba(0,212,255,0.3); color: var(--cyan); }
.alert-warning { background: rgba(255,170,0,0.1);   border: 1px solid rgba(255,170,0,0.3); color: var(--warning); }

#globalToast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(80px);
  background: var(--bg4);
  border: 1px solid var(--border2);
  color: var(--text);
  padding: 12px 24px;
  border-radius: var(--radius);
  font-size: 0.88rem;
  z-index: 9999;
  opacity: 0;
  transition: all 0.3s ease;
  white-space: nowrap;
  max-width: 90vw;
  text-align: center;
}
#globalToast.toast-show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
#globalToast.toast-success { border-color: var(--green); color: var(--green); }
#globalToast.toast-error   { border-color: var(--danger); color: #ff9aaa; }
#globalToast.toast-info    { border-color: var(--cyan); color: var(--cyan); }

/* ===================== MODAL ===================== */
.modal-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  z-index: 500;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-overlay.modal-open { display: flex; }
.modal-box {
  background: var(--bg2);
  border: 1px solid var(--border2);
  border-radius: var(--radius-lg);
  padding: 28px;
  width: 100%;
  max-width: 440px;
  box-shadow: var(--shadow), var(--shadow-glow);
  position: relative;
}
.modal-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 18px;
  text-align: center;
}
.modal-close {
  position: absolute;
  top: 14px;
  left: 14px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.1rem;
  cursor: pointer;
}
.modal-close:hover { color: var(--danger); }

/* ===================== STATE BOXES ===================== */
.state-box {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}
.state-box p { font-size: 0.9rem; margin-top: 8px; }
.spinner {
  display: inline-block;
  width: 28px; height: 28px;
  border: 3px solid var(--border2);
  border-top-color: var(--purple-light);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===================== TABS ===================== */
.tabs-header {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 10px;
}
.tab-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  padding: 7px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}
.tab-btn:hover { border-color: var(--purple-light); color: var(--text); }
.tab-btn.active {
  background: var(--purple);
  border-color: var(--purple);
  color: #fff;
}
.tab-panel { display: none; }
.tab-panel.active { display: block; }

/* ===================== LEADERBOARD ===================== */
.lb-table { display: flex; flex-direction: column; gap: 8px; }
.lb-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: border-color 0.18s;
}
.lb-row:hover { border-color: var(--border2); }
.lb-row.lb-row-me { border-color: var(--gold); background: var(--gold-dim); }
.lb-rank { font-size: 1.1rem; min-width: 30px; text-align: center; }
.lb-name { flex: 1; font-weight: 600; font-size: 0.9rem; }
.lb-value { font-size: 0.82rem; color: var(--gold); font-weight: 700; }

/* ===================== ACHIEVEMENT CARDS ===================== */
.achievement-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-bottom: 10px;
}
.ach-info { flex: 1; }
.ach-subject { font-weight: 700; font-size: 0.9rem; display: block; color: var(--text); }
.ach-type { font-size: 0.78rem; color: var(--purple-light); }
.ach-amount { font-size: 0.78rem; color: var(--cyan); margin-right: 8px; }
.ach-hours  { font-size: 0.78rem; color: var(--green); margin-right: 8px; }
.ach-notes  { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }

/* ===================== OPERATION ROOM ===================== */
.op-timer-display {
  font-family: var(--font-display);
  font-size: 4rem;
  font-weight: 800;
  color: var(--green);
  text-align: center;
  letter-spacing: 0.05em;
  text-shadow: 0 0 30px rgba(0,255,136,0.4);
  margin: 20px 0;
}
.op-break-timer {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 800;
  color: var(--cyan);
  text-align: center;
  margin: 16px 0;
  text-shadow: 0 0 20px rgba(0,212,255,0.4);
}
.op-phase { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.task-form { margin-bottom: 16px; }
.task-form-title { font-size: 0.88rem; font-weight: 700; color: var(--purple-light); margin-bottom: 10px; }
.task-summary-card {
  padding: 10px 14px;
  background: var(--bg3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  margin-bottom: 8px;
  font-size: 0.88rem;
}
.task-amount-wrap { margin-top: 10px; }
.duration-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
.dur-btn {
  flex: 1;
  min-width: 60px;
  padding: 8px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}
.dur-btn:hover, .dur-btn.selected {
  background: var(--purple-dim);
  border-color: var(--purple-light);
  color: var(--text);
}

/* ===================== QUIZ PAGE ===================== */
.quiz-card {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px;
  margin-bottom: 14px;
}
.quiz-title { font-family: var(--font-display); font-weight: 700; font-size: 1rem; margin-bottom: 6px; }
.quiz-meta { font-size: 0.78rem; color: var(--text-muted); margin-bottom: 10px; }
.quiz-grade-chip {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 99px;
  background: var(--green-dim);
  border: 1px solid var(--green);
  color: var(--green);
  font-size: 0.78rem;
  font-weight: 700;
}

/* ===================== DOCTOR QUESTION ===================== */
.dq-card {
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 16px;
}
.dq-question {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--cyan);
  margin-bottom: 14px;
}
.dq-answer-card {
  background: var(--bg4);
  border-radius: var(--radius-sm);
  padding: 12px;
  margin-bottom: 8px;
  border-right: 3px solid var(--purple);
  font-size: 0.88rem;
}
.dq-answer-name { font-size: 0.75rem; color: var(--text-muted); margin-top: 6px; }
.dq-featured { border-right-color: var(--gold); }
.dq-featured .dq-answer-name::before { content: 'â­ '; }

/* ===================== HALL OF FAME ===================== */
.hof-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}
.hof-card {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  text-align: center;
  transition: border-color 0.2s;
}
.hof-card:hover { border-color: var(--gold); }
.hof-badge { font-size: 2.5rem; margin-bottom: 8px; }
.hof-category { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; }
.hof-name { font-family: var(--font-display); font-weight: 800; font-size: 1rem; color: var(--gold); }
.hof-value { font-size: 0.82rem; color: var(--text-muted); margin-top: 4px; }

/* ===================== DOCTOR CHOICE MODAL ===================== */
.doctor-choice-btn {
  display: block;
  width: 100%;
  padding: 12px 16px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 600;
  text-align: right;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.18s;
}
.doctor-choice-btn:hover { border-color: var(--purple-light); background: var(--purple-dim); }

/* ===================== INDEX / LANDING ===================== */
.landing-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at 60% 30%, rgba(108,63,197,0.18) 0%, transparent 60%),
              radial-gradient(ellipse at 20% 80%, rgba(0,255,136,0.08) 0%, transparent 50%),
              var(--bg);
  padding: 24px;
}
.landing-box {
  text-align: center;
  max-width: 420px;
  width: 100%;
}
.landing-logo {
  font-family: var(--font-display);
  font-size: 2.4rem;
  font-weight: 800;
  color: var(--gold);
  letter-spacing: -0.03em;
  text-shadow: 0 0 40px rgba(255,215,0,0.3);
  margin-bottom: 8px;
}
.landing-tagline {
  font-size: 1.05rem;
  color: var(--text-muted);
  margin-bottom: 36px;
  font-weight: 400;
}
.landing-tagline strong { color: var(--green); }
.landing-btns { display: flex; flex-direction: column; gap: 12px; }
.landing-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 6px 0;
  color: var(--text-dim);
  font-size: 0.8rem;
}
.landing-divider::before,
.landing-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

/* ===================== AUTH PAGES ===================== */
.auth-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 24px;
}
.auth-box {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px 28px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow);
}
.auth-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text);
  text-align: center;
  margin-bottom: 4px;
}
.auth-sub {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 24px;
}
.auth-link {
  text-align: center;
  margin-top: 18px;
  font-size: 0.84rem;
  color: var(--text-muted);
}
.auth-link a { color: var(--purple-light); font-weight: 600; }
.auth-link a:hover { color: var(--green); }

/* ===================== STUDENT HOME â€” Quick Cards ===================== */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 20px;
}
.quick-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 12px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}
.quick-card:hover { border-color: var(--purple-light); background: var(--purple-dim); color: var(--text); transform: translateY(-2px); box-shadow: var(--shadow-glow); }
.quick-card .qc-icon { font-size: 1.8rem; }

/* ===================== STUDENT META STRIP ===================== */
.student-meta-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}
.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 99px;
  background: var(--bg3);
  border: 1px solid var(--border);
  font-size: 0.78rem;
  color: var(--text-muted);
}
.meta-chip strong { color: var(--text); }

/* ===================== SECTION TITLE ===================== */
.section-title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
.section-title .title-accent { color: var(--green); }

/* ===================== UTILITY ===================== */
.mt-1  { margin-top: 8px; }
.mt-2  { margin-top: 16px; }
.mt-3  { margin-top: 24px; }
.mb-1  { margin-bottom: 8px; }
.mb-2  { margin-bottom: 16px; }
.mb-3  { margin-bottom: 24px; }
.flex  { display: flex; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.gap-1 { gap: 8px; }
.gap-2 { gap: 16px; }
.text-center { text-align: center; }
.text-muted { color: var(--text-muted); font-size: 0.85rem; }
.text-green { color: var(--green); }
.text-gold  { color: var(--gold); }
.text-cyan  { color: var(--cyan); }
.text-danger { color: var(--danger); }
.fw-bold { font-weight: 700; }
.hidden { display: none !important; }

/* ===================== RESPONSIVE ===================== */
@media (max-width: 768px) {
  .side-nav {
    transform: translateX(100%);
  }
  .side-nav.nav-open {
    transform: translateX(0);
    box-shadow: -8px 0 40px rgba(0,0,0,0.6);
  }
  .main-content {
    margin-right: 0;
  }
  .nav-toggle {
    display: block;
  }
  .page-body {
    padding: 16px;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .op-timer-display {
    font-size: 3rem;
  }
  .landing-logo {
    font-size: 1.9rem;
  }
  .auth-box {
    padding: 24px 18px;
  }
}
@media (max-width: 400px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  .quick-grid {
    grid-template-columns: 1fr 1fr;
  }
}



===== FILE: index.html =====

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</title>
  <link rel="stylesheet" href="/assets/css/main.css" />
</head>
<body>
  <div class="landing-wrap">
    <div class="landing-box">
      <div class="landing-logo">âš½ Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</div>
      <p class="landing-tagline">Ø§Ù„Ø¹Ø¨Ù‡Ø§ ØµØ­â€¦ <strong>Ø°Ø§ÙƒØ± ÙˆØ§ÙƒØ³Ø¨ Ø§Ù„Ø¯ÙˆØ±ÙŠ</strong></p>

      <div class="landing-btns">
        <a href="/login.html" class="btn btn-gold btn-lg">
          ðŸŽ® Ø¯Ø®ÙˆÙ„ Ù„Ø§Ø¹Ø¨
        </a>
        <a href="/signup.html" class="btn btn-primary btn-lg">
          âœ¨ Ø¥Ù†Ø´Ø§Ø¡ Ù„Ø§Ø¹Ø¨
        </a>
        <div class="landing-divider">Ø¥Ø¯Ø§Ø±Ø©</div>
        <a href="/admin-mahmoud/dashboard.html" class="btn btn-ghost">
          ðŸ” Ø¯Ø®ÙˆÙ„ Ø§Ù„ÙƒÙ†ØªØ±ÙˆÙ„
        </a>
      </div>
    </div>
  </div>
</body>
</html>



===== FILE: login.html =====

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ø¯Ø®ÙˆÙ„ Ù„Ø§Ø¹Ø¨ â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</title>
  <link rel="stylesheet" href="/assets/css/main.css" />
</head>
<body>
  <div class="auth-wrap">
    <div class="auth-box">
      <div class="auth-title">âš½ Ø¯Ø®ÙˆÙ„ Ù„Ø§Ø¹Ø¨</div>
      <p class="auth-sub">Ø§Ø¯Ø®Ù„ Ø¨ÙŠØ§Ù†Ø§ØªÙƒ ÙˆØ§Ø¨Ø¯Ø£ Ø§Ù„ØªØ°ÙƒÙŠØ±</p>

      <div id="loginAlert" style="display:none"></div>

      <form id="loginForm" novalidate>
        <div class="form-group">
          <label for="loginPhone">Ø±Ù‚Ù… Ø§Ù„ØªÙ„ÙŠÙÙˆÙ†</label>
          <input id="loginPhone" class="form-input" type="tel" placeholder="01XXXXXXXXX" autocomplete="tel" />
        </div>
        <div class="form-group">
          <label for="loginPin">Ø§Ù„Ù€ PIN</label>
          <input id="loginPin" class="form-input" type="password" placeholder="â€¢â€¢â€¢â€¢" autocomplete="current-password" />
        </div>
        <button id="loginBtn" type="submit" class="btn btn-gold btn-full btn-lg">Ø¯Ø®ÙˆÙ„</button>
      </form>

      <div class="auth-link">
        Ù…Ø§ Ø¹Ù†Ø¯ÙƒØ´ Ø­Ø³Ø§Ø¨ØŸ <a href="/signup.html">Ø¥Ù†Ø´Ø§Ø¡ Ù„Ø§Ø¹Ø¨</a>
      </div>
      <div class="auth-link" style="margin-top:8px">
        <a href="/index.html">â† Ø§Ù„Ø±Ø¬ÙˆØ¹ Ù„Ù„Ø±Ø¦ÙŠØ³ÙŠØ©</a>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="/assets/js/supabase.js"></script>
  <script src="/assets/js/utils.js"></script>
  <script src="/assets/js/auth.js"></script>
</body>
</html>



===== FILE: signup.html =====

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ø¥Ù†Ø´Ø§Ø¡ Ù„Ø§Ø¹Ø¨ â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</title>
  <link rel="stylesheet" href="/assets/css/main.css" />
</head>
<body>
  <div class="auth-wrap" style="padding: 32px 24px;">
    <div class="auth-box" style="max-width:480px">
      <div class="auth-title">âœ¨ Ø¥Ù†Ø´Ø§Ø¡ Ù„Ø§Ø¹Ø¨</div>
      <p class="auth-sub">Ø³Ø¬Ù„ Ø¨ÙŠØ§Ù†Ø§ØªÙƒ ÙˆØ§Ù†Ø¶Ù… Ù„Ù„Ø¯ÙˆØ±ÙŠ</p>

      <div id="signupAlert" style="display:none"></div>

      <form id="signupForm" novalidate>
        <div class="form-group">
          <label for="sName">Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„ <span class="text-danger">*</span></label>
          <input id="sName" class="form-input" type="text" placeholder="Ø§Ø³Ù…Ùƒ Ù‡Ù†Ø§" />
        </div>
        <div class="form-group">
          <label for="sPhone">Ø±Ù‚Ù… Ø§Ù„ØªÙ„ÙŠÙÙˆÙ† <span class="text-danger">*</span></label>
          <input id="sPhone" class="form-input" type="tel" placeholder="01XXXXXXXXX" />
        </div>
        <div class="form-group">
          <label for="sGrade">Ø§Ù„ØµÙ <span class="text-danger">*</span></label>
          <select id="sGrade" class="form-select">
            <option value="">Ø§Ø®ØªØ± Ø§Ù„ØµÙ</option>
            <option value="Ø§Ù„Ø«Ø§Ù„Ø« Ø§Ù„Ø«Ø§Ù†ÙˆÙŠ">Ø§Ù„Ø«Ø§Ù„Ø« Ø§Ù„Ø«Ø§Ù†ÙˆÙŠ</option>
            <option value="Ø§Ù„Ø«Ø§Ù†ÙŠ Ø§Ù„Ø«Ø§Ù†ÙˆÙŠ">Ø§Ù„Ø«Ø§Ù†ÙŠ Ø§Ù„Ø«Ø§Ù†ÙˆÙŠ</option>
            <option value="Ø§Ù„Ø£ÙˆÙ„ Ø§Ù„Ø«Ø§Ù†ÙˆÙŠ">Ø§Ù„Ø£ÙˆÙ„ Ø§Ù„Ø«Ø§Ù†ÙˆÙŠ</option>
          </select>
        </div>
        <div class="form-group">
          <label for="sEdu">Ø§Ù„Ù†Ø¸Ø§Ù… Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠ <span class="text-danger">*</span></label>
          <select id="sEdu" class="form-select">
            <option value="">Ø§Ø®ØªØ±</option>
            <option value="Ù…ØµØ±ÙŠ">Ù…ØµØ±ÙŠ</option>
            <option value="Ø£Ø²Ù‡Ø±ÙŠ">Ø£Ø²Ù‡Ø±ÙŠ</option>
            <option value="Ø¯ÙˆÙ„ÙŠ">Ø¯ÙˆÙ„ÙŠ</option>
          </select>
        </div>
        <div class="form-group" id="trackWrap">
          <label for="sTrack">Ø§Ù„Ø´Ø¹Ø¨Ø© / Ø§Ù„ØªØ®ØµØµ</label>
          <select id="sTrack" class="form-select">
            <option value="">Ø§Ø®ØªØ± (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)</option>
            <option value="Ø¹Ù„Ù…ÙŠ Ø¹Ù„ÙˆÙ…">Ø¹Ù„Ù…ÙŠ Ø¹Ù„ÙˆÙ…</option>
            <option value="Ø¹Ù„Ù…ÙŠ Ø±ÙŠØ§Ø¶Ø©">Ø¹Ù„Ù…ÙŠ Ø±ÙŠØ§Ø¶Ø©</option>
            <option value="Ø£Ø¯Ø¨ÙŠ">Ø£Ø¯Ø¨ÙŠ</option>
          </select>
        </div>
        <div class="form-group">
          <label for="sDoctor">Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© / Ø§Ù„Ø¯ÙƒØªÙˆØ±</label>
          <select id="sDoctor" class="form-select">
            <option value="">Ø§Ø®ØªØ± (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="sPin">Ø§Ù„Ù€ PIN <span class="text-danger">*</span></label>
          <input id="sPin" class="form-input" type="password" placeholder="4 Ø£Ø±Ù‚Ø§Ù… Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„" autocomplete="new-password" />
        </div>
        <div class="form-group">
          <label for="sPinConf">ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ù€ PIN <span class="text-danger">*</span></label>
          <input id="sPinConf" class="form-input" type="password" placeholder="Ø£Ø¹Ø¯ ÙƒØªØ§Ø¨Ø© Ø§Ù„Ù€ PIN" autocomplete="new-password" />
        </div>
        <button id="signupBtn" type="submit" class="btn btn-success btn-full btn-lg">Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨</button>
      </form>

      <div class="auth-link">
        Ø¹Ù†Ø¯Ùƒ Ø­Ø³Ø§Ø¨ØŸ <a href="/login.html">Ø¯Ø®ÙˆÙ„</a>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="/assets/js/supabase.js"></script>
  <script src="/assets/js/utils.js"></script>
  <script src="/assets/js/auth.js"></script>
</body>
</html>



===== FILE: student\home.html =====

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</title>
  <link rel="stylesheet" href="/assets/css/main.css" />
</head>
<body>
<div id="studentHomePage" class="app-shell">

  <!-- Sidebar Nav -->
  <nav class="side-nav" id="sideNav">
    <div class="nav-brand">
      <div class="brand-title">âš½ Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</div>
      <div class="brand-sub">Ù…Ù†ØµØ© Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø© Ø§Ù„ØªÙ†Ø§ÙØ³ÙŠØ©</div>
    </div>
    <ul class="nav-links">
      <li><a href="/student/home.html" class="nav-active"><span class="nav-icon">ðŸ </span> Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©</a></li>
      <li><a href="/student/report.html"><span class="nav-icon">ðŸ“‹</span> ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²</a></li>
      <li><a href="/student/operation.html"><span class="nav-icon">âš¡</span> Operation Room</a></li>
      <li><a href="/student/quiz.html"><span class="nav-icon">ðŸ“</span> ÙƒÙˆÙŠØ² 9</a></li>
      <li><a href="/student/doctor-question.html"><span class="nav-icon">ðŸ’¬</span> Ø³Ø¤Ø§Ù„ Ø§Ù„Ø¯ÙƒØªÙˆØ±</a></li>
      <li><a href="/student/hall-of-fame.html"><span class="nav-icon">ðŸ†</span> Hall of Fame</a></li>
      <li><a href="/student/leaderboards.html"><span class="nav-icon">ðŸ“Š</span> Ø¬Ø¯Ø§ÙˆÙ„ Ø§Ù„Ø¯ÙˆØ±ÙŠ</a></li>
      <li class="nav-logout"><a href="#" onclick="logoutStudent();return false;"><span class="nav-icon">ðŸšª</span> Ø®Ø±ÙˆØ¬</a></li>
    </ul>
  </nav>

  <!-- Main Content -->
  <div class="main-content">
    <header class="page-header">
      <button class="nav-toggle" id="navToggle">â˜°</button>
      <div class="page-title">Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©</div>
      <span class="text-muted" style="font-size:0.8rem">Ù…Ø±Ø­Ø¨Ø§Ù‹ØŒ <strong id="studentName">â€”</strong></span>
    </header>

    <main class="page-body">

      <!-- Meta Strip -->
      <div class="student-meta-strip">
        <span class="meta-chip">ðŸŽ“ <strong id="metaGrade">â€”</strong></span>
        <span class="meta-chip">ðŸ“š <strong id="metaEdu">â€”</strong></span>
        <span class="meta-chip">ðŸ”¬ <strong id="metaTrack">â€”</strong></span>
        <span class="meta-chip">ðŸ‘¨â€âš•ï¸ <strong id="metaDoctor">â€”</strong></span>
      </div>

      <!-- XP Bar -->
      <div class="xp-bar-container">
        <div id="xpBarContainer"></div>
      </div>

      <!-- Stats Grid -->
      <div class="section-title">ðŸ“ˆ Ø¥Ø­ØµØ§Ø¦ÙŠØ§ØªÙƒ</div>
      <div class="stats-grid">
        <div class="stat-card accent-gold">
          <div class="stat-value" id="statScore">â€”</div>
          <div class="stat-label">Ù†Ù‚Ø§Ø· Ø§Ù„Ø¯ÙˆØ±ÙŠ</div>
        </div>
        <div class="stat-card accent-cyan">
          <div class="stat-value" id="statQuestions">â€”</div>
          <div class="stat-label">Ø£Ø³Ø¦Ù„Ø© Ø­ÙÙ„Ù‘Øª</div>
        </div>
        <div class="stat-card accent-green">
          <div class="stat-value" id="statReportHours">â€”</div>
          <div class="stat-label">Ø³Ø§Ø¹Ø§Øª Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±</div>
        </div>
        <div class="stat-card accent-purple">
          <div class="stat-value" id="statOpHours">â€”</div>
          <div class="stat-label">Ø³Ø§Ø¹Ø§Øª Operation</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="statTotalHours">â€”</div>
          <div class="stat-label">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø³Ø§Ø¹Ø§Øª</div>
        </div>
        <div class="stat-card accent-purple">
          <div class="stat-value" id="statXp">â€”</div>
          <div class="stat-label">XP Ù…ÙƒØªØ³Ø¨Ø©</div>
        </div>
        <div class="stat-card accent-green">
          <div class="stat-value" id="statStreak">â€”</div>
          <div class="stat-label">ðŸ”¥ Streak Ø­Ø§Ù„ÙŠ</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="statBestStreak">â€”</div>
          <div class="stat-label">ðŸ… Ø£ÙØ¶Ù„ Streak</div>
        </div>
      </div>

      <!-- Quick Cards -->
      <div class="section-title">âš¡ ÙˆØµÙˆÙ„ Ø³Ø±ÙŠØ¹</div>
      <div class="quick-grid">
        <a href="/student/report.html" class="quick-card">
          <span class="qc-icon">ðŸ“‹</span>
          ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²
        </a>
        <a href="/student/operation.html" class="quick-card">
          <span class="qc-icon">âš¡</span>
          Operation Room
        </a>
        <a href="/student/hall-of-fame.html" class="quick-card">
          <span class="qc-icon">ðŸ†</span>
          Hall of Fame
        </a>
        <a href="/student/leaderboards.html" class="quick-card">
          <span class="qc-icon">ðŸ“Š</span>
          Ø¬Ø¯Ø§ÙˆÙ„ Ø§Ù„Ø¯ÙˆØ±ÙŠ
        </a>
        <a href="/student/quiz.html" class="quick-card">
          <span class="qc-icon">ðŸ“</span>
          ÙƒÙˆÙŠØ² 9
        </a>
        <a href="/student/doctor-question.html" class="quick-card">
          <span class="qc-icon">ðŸ’¬</span>
          Ø³Ø¤Ø§Ù„ Ø§Ù„Ø¯ÙƒØªÙˆØ±
        </a>
      </div>
    </main>
  </div>
</div>

<!-- Doctor Group Modal -->
<div class="modal-overlay" id="doctorModal">
  <div class="modal-box">
    <div class="modal-title">ðŸ‘¨â€âš•ï¸ Ø¨ØªØªØ§Ø¨Ø¹ Ù…Ø¹ Ø¯ÙƒØªÙˆØ±Ø©ØŸ</div>
    <p class="text-muted mb-2" style="text-align:center;font-size:0.85rem">Ø§Ø®ØªØ± Ù…Ø¬Ù…ÙˆØ¹ØªÙƒ Ø¹Ø´Ø§Ù† ØªØ¸Ù‡Ø± ÙÙŠ Ø§Ù„Ù…ÙƒØ§Ù† Ø§Ù„ØµØ­</p>
    <div id="doctorModalList"></div>
    <button class="btn btn-ghost btn-full mt-2" onclick="closeModal('doctorModal')">Ù…Ø´ Ø¯Ù„ÙˆÙ‚ØªÙŠ</button>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/assets/js/supabase.js"></script>
<script src="/assets/js/utils.js"></script>
<script src="/assets/js/xp.js"></script>
<script src="/assets/js/student.js"></script>
</body>
</html>



===== FILE: student\report.html =====

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø¥Ù†Ø¬Ø§Ø² â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</title>
  <link rel="stylesheet" href="/assets/css/main.css" />
</head>
<body>
<div id="reportPage" class="app-shell">

  <nav class="side-nav" id="sideNav">
    <div class="nav-brand">
      <div class="brand-title">âš½ Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</div>
      <div class="brand-sub">Ù…Ù†ØµØ© Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø© Ø§Ù„ØªÙ†Ø§ÙØ³ÙŠØ©</div>
    </div>
    <ul class="nav-links">
      <li><a href="/student/home.html"><span class="nav-icon">ðŸ </span> Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©</a></li>
      <li><a href="/student/report.html" class="nav-active"><span class="nav-icon">ðŸ“‹</span> ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²</a></li>
      <li><a href="/student/operation.html"><span class="nav-icon">âš¡</span> Operation Room</a></li>
      <li><a href="/student/quiz.html"><span class="nav-icon">ðŸ“</span> ÙƒÙˆÙŠØ² 9</a></li>
      <li><a href="/student/doctor-question.html"><span class="nav-icon">ðŸ’¬</span> Ø³Ø¤Ø§Ù„ Ø§Ù„Ø¯ÙƒØªÙˆØ±</a></li>
      <li><a href="/student/hall-of-fame.html"><span class="nav-icon">ðŸ†</span> Hall of Fame</a></li>
      <li><a href="/student/leaderboards.html"><span class="nav-icon">ðŸ“Š</span> Ø¬Ø¯Ø§ÙˆÙ„ Ø§Ù„Ø¯ÙˆØ±ÙŠ</a></li>
      <li class="nav-logout"><a href="#" onclick="logoutStudent();return false;"><span class="nav-icon">ðŸšª</span> Ø®Ø±ÙˆØ¬</a></li>
    </ul>
  </nav>

  <div class="main-content">
    <header class="page-header">
      <button class="nav-toggle" id="navToggle">â˜°</button>
      <div class="page-title">ðŸ“‹ ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø¥Ù†Ø¬Ø§Ø² Ø§Ù„ÙŠÙˆÙ…ÙŠ</div>
    </header>

    <main class="page-body">
      <div id="todayReportBanner" style="display:none"></div>

      <!-- Add Achievement Form -->
      <div class="card mb-3">
        <div class="card-title">âž• Ø£Ø¶Ù Ø¥Ù†Ø¬Ø§Ø²</div>
        <div id="achAlert" style="display:none"></div>
        <form id="achForm" novalidate>
          <div class="form-group">
            <label for="achSubject">Ø§Ù„Ù…Ø§Ø¯Ø© <span class="text-danger">*</span></label>
            <input id="achSubject" class="form-input" type="text" placeholder="Ù…Ø«Ø§Ù„: ÙÙŠØ²ÙŠØ§Ø¡ØŒ ÙƒÙŠÙ…ÙŠØ§Ø¡ØŒ Ø±ÙŠØ§Ø¶Ø©â€¦" />
          </div>
          <div class="form-group">
            <label for="achType">Ù†ÙˆØ¹ Ø§Ù„Ù†Ø´Ø§Ø· <span class="text-danger">*</span></label>
            <select id="achType" class="form-select">
              <option value="">Ø§Ø®ØªØ± Ù†ÙˆØ¹ Ø§Ù„Ù†Ø´Ø§Ø·</option>
              <option value="questions">Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©</option>
              <option value="lesson">Ø¯Ø±Ø³ Ø¹Ø§Ø¯ÙŠ</option>
              <option value="chapter">ÙØµÙ„ / Ø¨Ø§Ø¨</option>
              <option value="unit">ÙˆØ­Ø¯Ø© / ÙŠÙˆÙ†Øª</option>
              <option value="comprehensive_exam">Ø§Ù…ØªØ­Ø§Ù† Ø´Ø§Ù…Ù„</option>
              <option value="center_attendance">Ø­Ø¶ÙˆØ± Ø³Ù†ØªØ±</option>
              <option value="review_video">ÙÙŠØ¯ÙŠÙˆ Ù…Ø±Ø§Ø¬Ø¹Ø©</option>
              <option value="study_hours">Ø³Ø§Ø¹Ø§Øª Ù…Ø°Ø§ÙƒØ±Ø©</option>
            </select>
          </div>
          <div class="form-group">
            <label for="achAmount">Ø§Ù„ÙƒÙ…ÙŠØ© (Ø£Ø³Ø¦Ù„Ø© / Ø¯Ø±ÙˆØ³ / â€¦)</label>
            <input id="achAmount" class="form-input" type="number" min="0" value="0" placeholder="0" />
          </div>
          <div class="form-group">
            <label for="achHours">Ø³Ø§Ø¹Ø§Øª Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø©: <span id="achHoursVal">0</span> Ø³Ø§Ø¹Ø©</label>
            <input id="achHours" type="range" class="rtl-slider" min="0" max="12" step="0.5" value="0" />
          </div>
          <div class="form-group">
            <label for="achNotes">Ù…Ù„Ø§Ø­Ø¸Ø§Øª (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)</label>
            <textarea id="achNotes" class="form-textarea" placeholder="Ø£ÙŠ ØªÙØ§ØµÙŠÙ„ Ø¥Ø¶Ø§ÙÙŠØ©â€¦"></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full">+ Ø¥Ø¶Ø§ÙØ© Ù„Ù„ØªÙ‚Ø±ÙŠØ±</button>
        </form>
      </div>

      <!-- Pending Achievements -->
      <div class="section-title">ðŸ“¦ Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²Ø§Øª Ø§Ù„Ù…Ø¶Ø§ÙØ©</div>
      <div id="achievementsList"></div>

      <button id="submitReportBtn" class="btn btn-gold btn-full btn-lg mt-2" disabled>
        ðŸ“¤ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªÙ‚Ø±ÙŠØ±
      </button>

      <div class="card mt-3" style="background:var(--bg3)">
        <div class="card-title" style="font-size:0.85rem;color:var(--text-muted)">ðŸ“Œ Ù†Ø¸Ø§Ù… Ø§Ù„Ù†Ù‚Ø§Ø·</div>
        <div style="font-size:0.8rem;color:var(--text-muted);line-height:2">
          Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©: floor(Ø§Ù„Ø¹Ø¯Ø¯ Ã· 20) &nbsp;|&nbsp;
          Ø¯Ø±Ø³ Ø¹Ø§Ø¯ÙŠ: Ø¹Ø¯Ø¯ Ø§Ù„Ø¯Ø±ÙˆØ³ &nbsp;|&nbsp;
          ÙØµÙ„/ÙˆØ­Ø¯Ø©: Ø§Ù„Ø¹Ø¯Ø¯ Ã— 3 &nbsp;|&nbsp;
          Ø§Ù…ØªØ­Ø§Ù† Ø´Ø§Ù…Ù„: 4 &nbsp;|&nbsp;
          Ø³Ù†ØªØ±: 3 &nbsp;|&nbsp;
          ÙÙŠØ¯ÙŠÙˆ Ù…Ø±Ø§Ø¬Ø¹Ø©: 3 &nbsp;|&nbsp;
          Ø³Ø§Ø¹Ø§Øª: 0 Ù†Ù‚Ø·Ø©
        </div>
      </div>
    </main>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/assets/js/supabase.js"></script>
<script src="/assets/js/utils.js"></script>
<script src="/assets/js/xp.js"></script>
<script src="/assets/js/report.js"></script>
</body>
</html>



===== FILE: student\operation.html =====

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Operation Room â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</title>
  <link rel="stylesheet" href="/assets/css/main.css" />
  <style>
    .op-setup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media(max-width:600px){ .op-setup-grid { grid-template-columns:1fr; } }
    .session-header { text-align:center; margin-bottom:16px; }
    .session-task-label { font-size:0.95rem; font-weight:700; color:var(--cyan); text-align:center; margin-bottom:8px; }
    .break-msg { text-align:center; color:var(--text-muted); margin-bottom:8px; font-size:0.9rem; }
    .done-hero { text-align:center; padding:32px 16px; }
    .done-hero .done-icon { font-size:4rem; margin-bottom:12px; }
    .done-hero .done-title { font-family:var(--font-display); font-size:1.6rem; font-weight:800; color:var(--green); }
  </style>
</head>
<body>
<div id="operationPage" class="app-shell">

  <nav class="side-nav" id="sideNav">
    <div class="nav-brand">
      <div class="brand-title">âš½ Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</div>
      <div class="brand-sub">Ù…Ù†ØµØ© Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø© Ø§Ù„ØªÙ†Ø§ÙØ³ÙŠØ©</div>
    </div>
    <ul class="nav-links">
      <li><a href="/student/home.html"><span class="nav-icon">ðŸ </span> Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©</a></li>
      <li><a href="/student/report.html"><span class="nav-icon">ðŸ“‹</span> ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²</a></li>
      <li><a href="/student/operation.html" class="nav-active"><span class="nav-icon">âš¡</span> Operation Room</a></li>
      <li><a href="/student/quiz.html"><span class="nav-icon">ðŸ“</span> ÙƒÙˆÙŠØ² 9</a></li>
      <li><a href="/student/doctor-question.html"><span class="nav-icon">ðŸ’¬</span> Ø³Ø¤Ø§Ù„ Ø§Ù„Ø¯ÙƒØªÙˆØ±</a></li>
      <li><a href="/student/hall-of-fame.html"><span class="nav-icon">ðŸ†</span> Hall of Fame</a></li>
      <li><a href="/student/leaderboards.html"><span class="nav-icon">ðŸ“Š</span> Ø¬Ø¯Ø§ÙˆÙ„ Ø§Ù„Ø¯ÙˆØ±ÙŠ</a></li>
      <li class="nav-logout"><a href="#" onclick="logoutStudent();return false;"><span class="nav-icon">ðŸšª</span> Ø®Ø±ÙˆØ¬</a></li>
    </ul>
  </nav>

  <div class="main-content">
    <header class="page-header">
      <button class="nav-toggle" id="navToggle">â˜°</button>
      <div class="page-title">âš¡ Operation Room</div>
    </header>

    <main class="page-body">

      <!-- PHASE: Setup -->
      <div class="op-phase" id="phase-setup">
        <div class="card mb-3">
          <div class="card-title">ðŸ›  Ø¥Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ø¬Ù„Ø³Ø©</div>
          <div class="op-setup-grid">
            <div class="form-group">
              <label for="opDuration">Ù…Ø¯Ø© Ø§Ù„Ø¬Ù„Ø³Ø©</label>
              <select id="opDuration" class="form-select">
                <option value="30">30 Ø¯Ù‚ÙŠÙ‚Ø© â€” Ù…Ù‡Ù…Ø© ÙˆØ§Ø­Ø¯Ø©</option>
                <option value="50">50 Ø¯Ù‚ÙŠÙ‚Ø© â€” Ù…Ù‡Ù…ØªØ§Ù†</option>
                <option value="60" selected>60 Ø¯Ù‚ÙŠÙ‚Ø© â€” Ù…Ù‡Ù…ØªØ§Ù†</option>
                <option value="90">90 Ø¯Ù‚ÙŠÙ‚Ø© â€” 4 Ù…Ù‡Ø§Ù…</option>
              </select>
            </div>
            <div class="form-group">
              <label for="opBreak">ÙˆÙ‚Øª Ø§Ù„Ø§Ø³ØªØ±Ø§Ø­Ø©</label>
              <select id="opBreak" class="form-select">
                <option value="5">5 Ø¯Ù‚Ø§Ø¦Ù‚</option>
                <option value="10" selected>10 Ø¯Ù‚Ø§Ø¦Ù‚</option>
                <option value="15">15 Ø¯Ù‚ÙŠÙ‚Ø©</option>
                <option value="20">20 Ø¯Ù‚ÙŠÙ‚Ø©</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="opSubject">Ø§Ù„Ù…Ø§Ø¯Ø© Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©</label>
            <input id="opSubject" class="form-input" type="text" placeholder="Ù…Ø«Ø§Ù„: ÙÙŠØ²ÙŠØ§Ø¡" />
          </div>
        </div>

        <div class="section-title">ðŸ“ Ø§Ù„Ù…Ù‡Ø§Ù…</div>
        <div id="taskForms"></div>

        <button id="startOpBtn" class="btn btn-success btn-full btn-lg mt-2">ðŸš€ Ø§Ø¨Ø¯Ø£ Ø§Ù„Ø¬Ù„Ø³Ø©</button>
      </div>

      <!-- PHASE: Session -->
      <div class="op-phase" id="phase-session" style="display:none">
        <div class="card text-center">
          <div class="session-task-label" id="currentTaskName">â€”</div>
          <div class="op-timer-display" id="sessionTimer">00:00</div>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap" class="mt-2">
            <button id="nextTaskBtn" class="btn btn-primary">Ù…Ù‡Ù…Ø© ÙƒÙ…Ø§Ù† â†</button>
            <button id="endSessionBtn" class="btn btn-danger">Ø¥Ù†Ù‡Ø§Ø¡ Ø§Ù„Ø¬Ù„Ø³Ø©</button>
          </div>
        </div>
      </div>

      <!-- PHASE: Break -->
      <div class="op-phase" id="phase-break" style="display:none">
        <div class="card text-center">
          <div class="card-title" style="color:var(--cyan)">â˜• Ø§Ø³ØªØ±Ø§Ø­Ø©</div>
          <p class="break-msg">Ø®Ø¯ Ù†ÙØ³Ùƒâ€¦ Ø§Ù„Ù…Ù‡Ù…Ø© Ø§Ù„Ø¬Ø§ÙŠØ© Ø´ØºØ§Ù„Ø©</p>
          <div class="op-break-timer" id="breakTimer">00:00</div>
          <button id="skipBreakBtn" class="btn btn-ghost mt-2">ØªØ®Ø·ÙŠ Ø§Ù„Ø§Ø³ØªØ±Ø§Ø­Ø© â†</button>
        </div>
      </div>

      <!-- PHASE: Done -->
      <div class="op-phase" id="phase-done" style="display:none">
        <div class="card">
          <div class="done-hero">
            <div class="done-icon">ðŸ…</div>
            <div class="done-title">Ø£ØªÙ…Ù…Øª Ø§Ù„Ø¬Ù„Ø³Ø©!</div>
            <p class="text-muted mt-1">Ø´ØºÙ„ ØªÙ…Ø§Ù… ÙŠØ§ Ø¨Ø·Ù„ â€” Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²Ø§Øª Ø§ØªØ³Ø¬Ù„Øª</p>
          </div>
          <div id="sessionSummary" class="mt-2"></div>
          <button id="resetOpBtn" class="btn btn-primary btn-full mt-3">Ø¬Ù„Ø³Ø© Ø¬Ø¯ÙŠØ¯Ø© ðŸ”„</button>
        </div>
      </div>

    </main>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/assets/js/supabase.js"></script>
<script src="/assets/js/utils.js"></script>
<script src="/assets/js/xp.js"></script>
<script src="/assets/js/operation.js"></script>
</body>
</html>



===== FILE: student\quiz.html =====

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ÙƒÙˆÙŠØ² 9 â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</title>
  <link rel="stylesheet" href="/assets/css/main.css" />
</head>
<body>
<div id="quizPage" class="app-shell">

  <nav class="side-nav" id="sideNav">
    <div class="nav-brand">
      <div class="brand-title">âš½ Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</div>
      <div class="brand-sub">Ù…Ù†ØµØ© Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø© Ø§Ù„ØªÙ†Ø§ÙØ³ÙŠØ©</div>
    </div>
    <ul class="nav-links">
      <li><a href="/student/home.html"><span class="nav-icon">ðŸ </span> Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©</a></li>
      <li><a href="/student/report.html"><span class="nav-icon">ðŸ“‹</span> ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²</a></li>
      <li><a href="/student/operation.html"><span class="nav-icon">âš¡</span> Operation Room</a></li>
      <li><a href="/student/quiz.html" class="nav-active"><span class="nav-icon">ðŸ“</span> ÙƒÙˆÙŠØ² 9</a></li>
      <li><a href="/student/doctor-question.html"><span class="nav-icon">ðŸ’¬</span> Ø³Ø¤Ø§Ù„ Ø§Ù„Ø¯ÙƒØªÙˆØ±</a></li>
      <li><a href="/student/hall-of-fame.html"><span class="nav-icon">ðŸ†</span> Hall of Fame</a></li>
      <li><a href="/student/leaderboards.html"><span class="nav-icon">ðŸ“Š</span> Ø¬Ø¯Ø§ÙˆÙ„ Ø§Ù„Ø¯ÙˆØ±ÙŠ</a></li>
      <li class="nav-logout"><a href="#" onclick="logoutStudent();return false;"><span class="nav-icon">ðŸšª</span> Ø®Ø±ÙˆØ¬</a></li>
    </ul>
  </nav>

  <div class="main-content">
    <header class="page-header">
      <button class="nav-toggle" id="navToggle">â˜°</button>
      <div class="page-title">ðŸ“ ÙƒÙˆÙŠØ² 9</div>
    </header>

    <main class="page-body">
      <div id="quizList">
        <div class="state-box loading-box"><span class="spinner"></span><p>Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ÙƒÙˆÙŠØ²Ø§Øªâ€¦</p></div>
      </div>

      <div class="section-title mt-3">ðŸŽ¯ Ø¯Ø±Ø¬Ø§ØªÙƒ</div>
      <div id="gradesList">
        <div class="state-box loading-box"><span class="spinner"></span><p>Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¯Ø±Ø¬Ø§Øªâ€¦</p></div>
      </div>
    </main>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/assets/js/supabase.js"></script>
<script src="/assets/js/utils.js"></script>
<script>
document.addEventListener('DOMContentLoaded', async () => {
  const student = requireStudentAuth();
  if (!student) return;
  initNavToggle();
  const db = window.supabaseClient;

  // Load quizzes
  const quizList = qs('#quizList');
  try {
    let query = db.from('quizzes').select('*').eq('is_visible', true).order('quiz_date', { ascending: false });
    if (student.grade_level) query = query.eq('grade_level', student.grade_level);
    const { data: quizzes } = await query;
    if (!quizzes || !quizzes.length) {
      quizList.innerHTML = emptyHtml('Ù…ÙÙŠØ´ ÙƒÙˆÙŠØ²Ø§Øª Ù…ØªØ§Ø­Ø© Ø¯Ù„ÙˆÙ‚ØªÙŠ');
    } else {
      quizList.innerHTML = quizzes.map(q => `
        <div class="quiz-card">
          <div class="quiz-title">${safeText(q.title)}</div>
          <div class="quiz-meta">${q.subject ? q.subject + ' Â· ' : ''}${formatDate(q.quiz_date)}</div>
          ${q.quiz_url ? `<a href="${q.quiz_url}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">ÙØªØ­ Ø§Ù„ÙƒÙˆÙŠØ² ðŸ”—</a>` : '<span class="text-muted">Ø§Ù„Ø±Ø§Ø¨Ø· Ù‚Ø±ÙŠØ¨Ø§Ù‹</span>'}
        </div>
      `).join('');
    }
  } catch (err) {
    quizList.innerHTML = emptyHtml('Ø®Ø·Ø£ ÙÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ÙƒÙˆÙŠØ²Ø§Øª');
  }

  // Load grades
  const gradesList = qs('#gradesList');
  try {
    const { data: grades } = await db
      .from('quiz_grades')
      .select('quiz_id, student_name, score, max_score, created_at, quizzes(title)')
      .or(`student_id.eq.${student.id},student_phone.eq.${student.phone}`)
      .order('created_at', { ascending: false });
    if (!grades || !grades.length) {
      gradesList.innerHTML = emptyHtml('Ù…ÙÙŠØ´ Ø¯Ø±Ø¬Ø§Øª Ù…Ø³Ø¬Ù„Ø© Ø¨Ø¹Ø¯');
    } else {
      gradesList.innerHTML = `<div class="lb-table">` + grades.map(g => {
        const pct = g.max_score ? Math.round((g.score / g.max_score) * 100) : null;
        return `
        <div class="lb-row">
          <span class="lb-name">${safeText(g.quizzes?.title || 'ÙƒÙˆÙŠØ²')}</span>
          <span class="lb-value">
            <span class="quiz-grade-chip">${formatNumber(g.score)}${g.max_score ? ' / ' + g.max_score : ''}${pct ? ' (' + pct + '%)' : ''}</span>
          </span>
        </div>`;
      }).join('') + `</div>`;
    }
  } catch {
    gradesList.innerHTML = emptyHtml('Ø®Ø·Ø£ ÙÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¯Ø±Ø¬Ø§Øª');
  }
});
</script>
</body>
</html>



===== FILE: student\doctor-question.html =====

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ø³Ø¤Ø§Ù„ Ø§Ù„Ø¯ÙƒØªÙˆØ± â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</title>
  <link rel="stylesheet" href="/assets/css/main.css" />
</head>
<body>
<div id="doctorQuestionPage" class="app-shell">

  <nav class="side-nav" id="sideNav">
    <div class="nav-brand">
      <div class="brand-title">âš½ Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</div>
      <div class="brand-sub">Ù…Ù†ØµØ© Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø© Ø§Ù„ØªÙ†Ø§ÙØ³ÙŠØ©</div>
    </div>
    <ul class="nav-links">
      <li><a href="/student/home.html"><span class="nav-icon">ðŸ </span> Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©</a></li>
      <li><a href="/student/report.html"><span class="nav-icon">ðŸ“‹</span> ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²</a></li>
      <li><a href="/student/operation.html"><span class="nav-icon">âš¡</span> Operation Room</a></li>
      <li><a href="/student/quiz.html"><span class="nav-icon">ðŸ“</span> ÙƒÙˆÙŠØ² 9</a></li>
      <li><a href="/student/doctor-question.html" class="nav-active"><span class="nav-icon">ðŸ’¬</span> Ø³Ø¤Ø§Ù„ Ø§Ù„Ø¯ÙƒØªÙˆØ±</a></li>
      <li><a href="/student/hall-of-fame.html"><span class="nav-icon">ðŸ†</span> Hall of Fame</a></li>
      <li><a href="/student/leaderboards.html"><span class="nav-icon">ðŸ“Š</span> Ø¬Ø¯Ø§ÙˆÙ„ Ø§Ù„Ø¯ÙˆØ±ÙŠ</a></li>
      <li class="nav-logout"><a href="#" onclick="logoutStudent();return false;"><span class="nav-icon">ðŸšª</span> Ø®Ø±ÙˆØ¬</a></li>
    </ul>
  </nav>

  <div class="main-content">
    <header class="page-header">
      <button class="nav-toggle" id="navToggle">â˜°</button>
      <div class="page-title">ðŸ’¬ Ø³Ø¤Ø§Ù„ Ø§Ù„Ø¯ÙƒØªÙˆØ±</div>
      <button class="btn btn-ghost btn-sm" onclick="openModal('changeDoctorModal')">ØªØºÙŠÙŠØ± Ø§Ù„Ø¯ÙƒØªÙˆØ±Ø© ðŸ”„</button>
    </header>

    <main class="page-body">
      <div id="dqContainer">
        <div class="state-box loading-box"><span class="spinner"></span><p>Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„â€¦</p></div>
      </div>
    </main>
  </div>
</div>

<!-- Change Doctor Modal -->
<div class="modal-overlay" id="changeDoctorModal">
  <div class="modal-box">
    <button class="modal-close" onclick="closeModal('changeDoctorModal')">âœ•</button>
    <div class="modal-title">ðŸ”„ ØªØºÙŠÙŠØ± Ø§Ù„Ø¯ÙƒØªÙˆØ±Ø©</div>
    <p class="text-muted mb-2" style="text-align:center;font-size:0.83rem">Ø§Ù„Ø·Ù„Ø¨ Ù‡ÙŠØªØ±Ø§Ø¬Ø¹ Ù…Ù† Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ù‚Ø¨Ù„ Ø§Ù„ØªØºÙŠÙŠØ±</p>
    <div id="changeDoctorList">
      <div class="state-box loading-box"><span class="spinner"></span></div>
    </div>
    <button class="btn btn-ghost btn-full mt-2" onclick="closeModal('changeDoctorModal')">Ø¥Ù„ØºØ§Ø¡</button>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/assets/js/supabase.js"></script>
<script src="/assets/js/utils.js"></script>
<script>
let _currentQuestion = null;
let _student = null;

document.addEventListener('DOMContentLoaded', async () => {
  _student = requireStudentAuth();
  if (!_student) return;
  initNavToggle();
  await loadTodayQuestion();
  loadChangeDoctorList();
});

async function loadTodayQuestion() {
  const db = window.supabaseClient;
  const container = qs('#dqContainer');
  const today = todayStr();
  try {
    // Get open question for today
    let q = await db.from('doctor_questions')
      .select('*')
      .eq('is_open', true)
      .eq('question_date', today)
      .maybeSingle();
    if (!q.data) {
      // fallback: latest open
      const fb = await db.from('doctor_questions')
        .select('*')
        .eq('is_open', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      q = fb;
    }
    const question = q.data;
    if (!question) {
      container.innerHTML = emptyHtml('Ù…ÙÙŠØ´ Ø³Ø¤Ø§Ù„ Ù…ÙØªÙˆØ­ Ø§Ù„Ù†Ù‡Ø§Ø±Ø¯Ù‡');
      return;
    }
    _currentQuestion = question;

    // Check if student already answered
    const { data: myAns } = await db
      .from('doctor_answers')
      .select('id, answer_text')
      .eq('question_id', question.id)
      .eq('student_id', _student.id)
      .maybeSingle();

    // Load featured visible answers
    const { data: answers } = await db
      .from('doctor_answers')
      .select('*')
      .eq('question_id', question.id)
      .eq('is_hidden', false)
      .order('is_featured', { ascending: false })
      .order('created_at');

    let html = `<div class="dq-card">
      <div class="dq-question">â“ ${safeText(question.question_text)}</div>`;

    if (myAns) {
      html += `<div class="alert alert-success mb-2">âœ… Ø±Ø¯Ùƒ: ${safeText(myAns.answer_text)}</div>`;
    } else {
      html += `
      <div id="ansAlert" style="display:none"></div>
      <div class="form-group">
        <label>Ø±Ø¯Ùƒ Ø¹Ù„Ù‰ Ø§Ù„Ø³Ø¤Ø§Ù„</label>
        <textarea id="ansText" class="form-textarea" placeholder="Ø§ÙƒØªØ¨ Ø¥Ø¬Ø§Ø¨ØªÙƒ Ù‡Ù†Ø§â€¦" rows="3"></textarea>
      </div>
      <div class="form-group" style="display:flex;align-items:center;gap:10px">
        <input type="checkbox" id="showName" checked />
        <label for="showName" style="margin:0;font-size:0.85rem">Ø§Ø¸Ù‡Ø± Ø§Ø³Ù…ÙŠ Ù…Ø¹ Ø§Ù„Ø¥Ø¬Ø§Ø¨Ø©</label>
      </div>
      <button onclick="submitAnswer()" class="btn btn-primary btn-full">Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¥Ø¬Ø§Ø¨Ø© ðŸ“¤</button>`;
    }
    html += `</div>`;

    if (answers && answers.length) {
      html += `<div class="section-title mt-3">ðŸ’¡ Ø¥Ø¬Ø§Ø¨Ø§Øª Ù…Ø®ØªØ§Ø±Ø©</div>`;
      html += answers.map(a => `
        <div class="dq-answer-card ${a.is_featured ? 'dq-featured' : ''}">
          ${safeText(a.answer_text)}
          ${a.show_name ? `<div class="dq-answer-name">${safeText(a.student_id === _student.id ? 'â€” Ø£Ù†Øª' : '')}</div>` : ''}
        </div>
      `).join('');
    }
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = emptyHtml('Ø®Ø·Ø£: ' + err.message);
  }
}

async function submitAnswer() {
  clearAlert('ansAlert');
  const text = qs('#ansText')?.value.trim();
  if (!text) { showAlert('ansAlert', 'Ø§ÙƒØªØ¨ Ø¥Ø¬Ø§Ø¨ØªÙƒ Ø§Ù„Ø£ÙˆÙ„'); return; }
  const showName = qs('#showName')?.checked ?? true;
  const db = window.supabaseClient;
  try {
    const { error } = await db.from('doctor_answers').insert({
      question_id: _currentQuestion.id,
      student_id: _student.id,
      answer_text: text,
      show_name: showName,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
    showToast('ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø¥Ø¬Ø§Ø¨ØªÙƒ âœ…', 'success');
    await loadTodayQuestion();
  } catch (err) {
    showAlert('ansAlert', 'Ø®Ø·Ø£: ' + err.message);
  }
}

async function loadChangeDoctorList() {
  const db = window.supabaseClient;
  const list = qs('#changeDoctorList');
  try {
    const { data } = await db.from('doctor_groups')
      .select('id, name, display_name')
      .eq('is_active', true)
      .eq('is_student_selectable', true)
      .order('sort_order');
    if (!data || !data.length) { list.innerHTML = emptyHtml('Ù…ÙÙŠØ´ Ù…Ø¬Ù…ÙˆØ¹Ø§Øª'); return; }
    list.innerHTML = data.map(g => `
      <button class="doctor-choice-btn" onclick="requestDoctorChange('${g.name}')">
        ${safeText(g.display_name || g.name)}
      </button>
    `).join('');
  } catch { list.innerHTML = emptyHtml('Ø®Ø·Ø£ ÙÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„'); }
}

async function requestDoctorChange(newDoctor) {
  if (!_student) return;
  const db = window.supabaseClient;
  try {
    const { error } = await db.from('doctor_change_requests').insert({
      student_id: _student.id,
      old_doctor: _student.doctor_group || null,
      new_doctor: newDoctor,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
    closeModal('changeDoctorModal');
    showToast('ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„ØªØºÙŠÙŠØ± Ù„Ù„Ø¥Ø¯Ø§Ø±Ø© âœ…', 'success');
  } catch (err) {
    showToast('Ø®Ø·Ø£: ' + err.message, 'error');
  }
}
</script>
</body>
</html>



===== FILE: student\hall-of-fame.html =====

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hall of Fame â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</title>
  <link rel="stylesheet" href="/assets/css/main.css" />
</head>
<body>
<div id="hofPage" class="app-shell">

  <nav class="side-nav" id="sideNav">
    <div class="nav-brand">
      <div class="brand-title">âš½ Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</div>
      <div class="brand-sub">Ù…Ù†ØµØ© Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø© Ø§Ù„ØªÙ†Ø§ÙØ³ÙŠØ©</div>
    </div>
    <ul class="nav-links">
      <li><a href="/student/home.html"><span class="nav-icon">ðŸ </span> Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©</a></li>
      <li><a href="/student/report.html"><span class="nav-icon">ðŸ“‹</span> ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²</a></li>
      <li><a href="/student/operation.html"><span class="nav-icon">âš¡</span> Operation Room</a></li>
      <li><a href="/student/quiz.html"><span class="nav-icon">ðŸ“</span> ÙƒÙˆÙŠØ² 9</a></li>
      <li><a href="/student/doctor-question.html"><span class="nav-icon">ðŸ’¬</span> Ø³Ø¤Ø§Ù„ Ø§Ù„Ø¯ÙƒØªÙˆØ±</a></li>
      <li><a href="/student/hall-of-fame.html" class="nav-active"><span class="nav-icon">ðŸ†</span> Hall of Fame</a></li>
      <li><a href="/student/leaderboards.html"><span class="nav-icon">ðŸ“Š</span> Ø¬Ø¯Ø§ÙˆÙ„ Ø§Ù„Ø¯ÙˆØ±ÙŠ</a></li>
      <li class="nav-logout"><a href="#" onclick="logoutStudent();return false;"><span class="nav-icon">ðŸšª</span> Ø®Ø±ÙˆØ¬</a></li>
    </ul>
  </nav>

  <div class="main-content">
    <header class="page-header">
      <button class="nav-toggle" id="navToggle">â˜°</button>
      <div class="page-title">ðŸ† Hall of Fame</div>
    </header>

    <main class="page-body">
      <div id="hofContainer">
        <div class="state-box loading-box"><span class="spinner"></span><p>Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„â€¦</p></div>
      </div>
    </main>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/assets/js/supabase.js"></script>
<script src="/assets/js/utils.js"></script>
<script>
const HOF_CATEGORIES = [
  { key: 'general',    label: 'Ø¨Ø·Ù„ Ø§Ù„Ø¯ÙˆØ±ÙŠ',      badge: 'ðŸ¥‡', field: 'total_score',     suffix: 'Ù†Ù‚Ø·Ø©',   view: 'v_leaderboard_general' },
  { key: 'questions',  label: 'Ù‡Ø¯Ø§Ù Ø§Ù„Ø¯ÙˆØ±ÙŠ',     badge: 'ðŸŽ¯', field: 'total_questions',  suffix: 'Ø³Ø¤Ø§Ù„',  view: 'v_leaderboard_questions' },
  { key: 'focus',      label: 'Ø¨Ø·Ù„ Ø§Ù„ØªØ±ÙƒÙŠØ²',     badge: 'âš¡', field: 'operation_minutes',suffix: 'Ø¯Ù‚ÙŠÙ‚Ø©', view: 'v_leaderboard_focus' },
  { key: 'persistent', label: 'Ø§Ù„Ù…Ø«Ø§Ø¨Ø±',          badge: 'ðŸ“š', field: 'total_study_hours',suffix: 'Ø³Ø§Ø¹Ø©', view: 'v_leaderboard_persistent' },
  { key: 'streak',     label: 'Ø­Ø§Ø±Ø³ Ø§Ù„Ø³Ù„Ø³Ù„Ø©',    badge: 'ðŸ”¥', field: 'current_streak',   suffix: 'ÙŠÙˆÙ…',  view: null },
];

document.addEventListener('DOMContentLoaded', async () => {
  requireStudentAuth();
  initNavToggle();
  const db = window.supabaseClient;
  const container = qs('#hofContainer');

  const results = [];

  for (const cat of HOF_CATEGORIES) {
    try {
      let top = null;
      if (cat.view) {
        const { data } = await db.from(cat.view)
          .select('student_name,' + cat.field)
          .order(cat.field, { ascending: false })
          .limit(1)
          .maybeSingle();
        top = data;
      } else if (cat.key === 'streak') {
        const { data } = await db.from('students')
          .select('name, current_streak')
          .order('current_streak', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) top = { student_name: data.name, current_streak: data.current_streak };
      }
      results.push({ cat, top });
    } catch {
      results.push({ cat, top: null });
    }
  }

  if (results.every(r => !r.top)) {
    container.innerHTML = emptyHtml('Hall of Fame ÙØ§Ø¶Ù„â€¦ Ø§Ø¨Ø¯Ø£ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø© ÙˆØ§Ù…Ù„Ø§Ù‡! ðŸ’ª');
    return;
  }

  container.innerHTML = `
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-family:var(--font-display);font-size:1.3rem;font-weight:800;color:var(--gold)">Ø£Ø¨Ø·Ø§Ù„ Ø§Ù„Ø¯ÙˆØ±ÙŠ</div>
      <p class="text-muted" style="font-size:0.85rem;margin-top:4px">Ø£ÙƒØ«Ø± Ø§Ù„Ø·Ù„Ø§Ø¨ ØªÙ…ÙŠØ²Ø§Ù‹ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù†ØµØ©</p>
    </div>
    <div class="hof-grid">
      ${results.map(({ cat, top }) => {
        if (!top) return `
          <div class="hof-card">
            <div class="hof-badge">${cat.badge}</div>
            <div class="hof-category">${cat.label}</div>
            <div class="hof-name" style="color:var(--text-muted);font-size:0.85rem">Ù…Ø§ Ø§ØªØ­Ø¯Ø¯Ø´ Ø¨Ø¹Ø¯</div>
          </div>`;
        const val = top[cat.field] ?? 0;
        return `
          <div class="hof-card">
            <div class="hof-badge">${cat.badge}</div>
            <div class="hof-category">${cat.label}</div>
            <div class="hof-name">${safeText(top.student_name)}</div>
            <div class="hof-value">${formatNumber(val)} ${cat.suffix}</div>
          </div>`;
      }).join('')}
    </div>`;
});
</script>
</body>
</html>



===== FILE: student\leaderboards.html =====

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ø¬Ø¯Ø§ÙˆÙ„ Ø§Ù„Ø¯ÙˆØ±ÙŠ â€” Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</title>
  <link rel="stylesheet" href="/assets/css/main.css" />
</head>
<body>
<div id="leaderboardsPage" class="app-shell">

  <nav class="side-nav" id="sideNav">
    <div class="nav-brand">
      <div class="brand-title">âš½ Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©</div>
      <div class="brand-sub">Ù…Ù†ØµØ© Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø© Ø§Ù„ØªÙ†Ø§ÙØ³ÙŠØ©</div>
    </div>
    <ul class="nav-links">
      <li><a href="/student/home.html"><span class="nav-icon">ðŸ </span> Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©</a></li>
      <li><a href="/student/report.html"><span class="nav-icon">ðŸ“‹</span> ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²</a></li>
      <li><a href="/student/operation.html"><span class="nav-icon">âš¡</span> Operation Room</a></li>
      <li><a href="/student/quiz.html"><span class="nav-icon">ðŸ“</span> ÙƒÙˆÙŠØ² 9</a></li>
      <li><a href="/student/doctor-question.html"><span class="nav-icon">ðŸ’¬</span> Ø³Ø¤Ø§Ù„ Ø§Ù„Ø¯ÙƒØªÙˆØ±</a></li>
      <li><a href="/student/hall-of-fame.html"><span class="nav-icon">ðŸ†</span> Hall of Fame</a></li>
      <li><a href="/student/leaderboards.html" class="nav-active"><span class="nav-icon">ðŸ“Š</span> Ø¬Ø¯Ø§ÙˆÙ„ Ø§Ù„Ø¯ÙˆØ±ÙŠ</a></li>
      <li class="nav-logout"><a href="#" onclick="logoutStudent();return false;"><span class="nav-icon">ðŸšª</span> Ø®Ø±ÙˆØ¬</a></li>
    </ul>
  </nav>

  <div class="main-content">
    <header class="page-header">
      <button class="nav-toggle" id="navToggle">â˜°</button>
      <div class="page-title">ðŸ“Š Ø¬Ø¯Ø§ÙˆÙ„ Ø§Ù„Ø¯ÙˆØ±ÙŠ</div>
    </header>

    <main class="page-body">
      <div id="lbTabs">
        <div class="tabs-header">
          <button class="tab-btn" data-tab="lb-general">ðŸ¥‡ Ø¨Ø·Ù„ Ø§Ù„Ø¬ÙˆÙ„Ø©</button>
          <button class="tab-btn" data-tab="lb-questions">ðŸŽ¯ Ù‡Ø¯Ø§Ù Ø§Ù„Ø¯ÙˆØ±ÙŠ</button>
          <button class="tab-btn" data-tab="lb-focus">âš¡ Ø£Ø¨Ø·Ø§Ù„ Ø§Ù„ØªØ±ÙƒÙŠØ²</button>
          <button class="tab-btn" data-tab="lb-persistent">ðŸ“š Ø§Ù„Ù…Ø«Ø§Ø¨Ø±</button>
          <button class="tab-btn" data-tab="lb-quiz">ðŸ“ ÙƒÙˆÙŠØ² 9</button>
        </div>
        <div id="lb-general"    class="tab-panel"></div>
        <div id="lb-questions"  class="tab-panel"></div>
        <div id="lb-focus"      class="tab-panel"></div>
        <div id="lb-persistent" class="tab-panel"></div>
        <div id="lb-quiz"       class="tab-panel"></div>
      </div>
    </main>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/assets/js/supabase.js"></script>
<script src="/assets/js/utils.js"></script>
<script src="/assets/js/leaderboards.js"></script>
</body>
</html>

