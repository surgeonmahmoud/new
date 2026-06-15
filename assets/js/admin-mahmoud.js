/* =====================================================
   دوري المذاكراوية — Admin Mahmoud JS (Part 2)
   ===================================================== */

'use strict';

/* ── Config ── */
const ADMIN_MAHMOUD_CODE   = "2026";
const STORAGE_KEY          = "mahmoudAdminAccess";
const ADMIN_ACTOR          = "mahmoud";
const ADMIN_ROLE           = "admin";

/* ── Supabase accessor (never global const db) ── */
function getDB() {
  if (!window.supabaseClient) {
    console.error('supabaseClient not initialised');
    showToast('Supabase غير متصل', 'error');
    return null;
  }
  return window.supabaseClient;
}

/* ══════════════════════════════════════════════
   ACCESS GUARD
══════════════════════════════════════════════ */
function checkAccess() {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function grantAccess() {
  localStorage.setItem(STORAGE_KEY, 'true');
}

function revokeAccess() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function renderLoginGate() {
  const overlay = document.getElementById('admin-login-overlay');
  if (!overlay) return;
  if (checkAccess()) { overlay.remove(); return; }

  const input = overlay.querySelector('#login-code-input');
  const btn   = overlay.querySelector('#login-btn');

  function tryLogin() {
    const val = input ? input.value.trim() : '';
    if (val === ADMIN_MAHMOUD_CODE) {
      grantAccess();
      overlay.remove();
      const initFn = window._adminInitFn;
      if (typeof initFn === 'function') initFn();
    } else {
      showToast('كود غلط', 'error');
      if (input) { input.value = ''; input.focus(); }
    }
  }

  if (btn) btn.addEventListener('click', tryLogin);
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
}

/* ══════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════ */
function showToast(msg, type = 'info', duration = 3200) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

/* ══════════════════════════════════════════════
   NAV RENDERER
══════════════════════════════════════════════ */
const NAV_LINKS = [
  { href: '/admin-mahmoud/dashboard.html',       icon: '📊', label: 'الإحصائيات وإعادة الموقع' },
  { href: '/admin-mahmoud/students.html',        icon: '👥', label: 'إدارة الطلاب' },
  { href: '/admin-mahmoud/reports.html',         icon: '📋', label: 'إدارة التقارير' },
  { href: '/admin-mahmoud/operation.html',       icon: '⚙️', label: 'Operation Room' },
  { href: '/admin-mahmoud/quizzes.html',         icon: '📝', label: 'الكويزات' },
  { href: '/admin-mahmoud/doctor-question.html', icon: '❓', label: 'سؤال الدكتور' },
  { href: '/admin-mahmoud/seasons.html',         icon: '🏆', label: 'المواسم' },
  { href: '/admin-mahmoud/doctors.html',         icon: '👨‍⚕️', label: 'الدكاترة والطلبات' },
  { href: '/admin-mahmoud/logs.html',            icon: '📜', label: 'Logs' },
];

function renderNav(activePath) {
  const el = document.getElementById('admin-nav');
  if (!el) return;
  const current = activePath || window.location.pathname;
  el.innerHTML = NAV_LINKS.map(link => {
    const active = current.includes(link.href.split('/').pop()) ? 'active' : '';
    return `<a href="${link.href}" class="${active}">
      <span class="nav-icon">${link.icon}</span>${link.label}
    </a>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   LOG ACTION HELPER
══════════════════════════════════════════════ */
async function logAction({ table = 'student_logs', action_type, student_id = null, old_value = null, new_value = null, note = '' }) {
  const db = getDB();
  if (!db) return;
  const payload = {
    actor: ADMIN_ACTOR,
    role:  ADMIN_ROLE,
    action_type,
    student_id,
    old_value: old_value !== null ? String(old_value) : null,
    new_value: new_value !== null ? String(new_value) : null,
    note,
    undone: false,
    created_at: new Date().toISOString(),
  };
  try {
    await db.from(table).insert(payload);
  } catch(e) { console.warn('logAction error', e); }
}

/* ══════════════════════════════════════════════
   SAFE SUPABASE WRAPPERS
══════════════════════════════════════════════ */
async function safeSelect(table, queryFn) {
  const db = getDB();
  if (!db) return [];
  try {
    let q = db.from(table).select('*');
    if (typeof queryFn === 'function') q = queryFn(q);
    const { data, error } = await q;
    if (error) { console.error(table, error); return []; }
    return data || [];
  } catch(e) { console.error(e); return []; }
}

async function safeUpdate(table, match, updates) {
  const db = getDB();
  if (!db) return false;
  try {
    const { error } = await db.from(table).update({ ...updates, updated_at: new Date().toISOString() }).match(match);
    if (error) { showToast(error.message, 'error'); return false; }
    return true;
  } catch(e) { showToast(e.message, 'error'); return false; }
}

async function safeInsert(table, data) {
  const db = getDB();
  if (!db) return null;
  try {
    const { data: res, error } = await db.from(table).insert(data).select().single();
    if (error) { showToast(error.message, 'error'); return null; }
    return res;
  } catch(e) { showToast(e.message, 'error'); return null; }
}

async function safeInsertMany(table, rows) {
  const db = getDB();
  if (!db) return false;
  try {
    const { error } = await db.from(table).insert(rows);
    if (error) { showToast(error.message, 'error'); return false; }
    return true;
  } catch(e) { showToast(e.message, 'error'); return false; }
}

/* ══════════════════════════════════════════════
   UTILITY HELPERS
══════════════════════════════════════════════ */
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-EG', { year:'numeric', month:'short', day:'numeric' });
}

function fmtDatetime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
}

function statusBadge(s) {
  const map = {
    approved: '<span class="badge badge-green">مقبول</span>',
    rejected: '<span class="badge badge-red">مرفوض</span>',
    pending:  '<span class="badge badge-yellow">قيد المراجعة</span>',
    frozen:   '<span class="badge badge-blue">مجمد</span>',
    active:   '<span class="badge badge-green">فعّال</span>',
    inactive: '<span class="badge badge-gray">غير فعّال</span>',
    suspicious: '<span class="badge badge-red">مشبوه</span>',
  };
  return map[s] || `<span class="badge badge-gray">${s || '—'}</span>`;
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function loadingRow(cols) {
  return `<tr class="loading-row"><td colspan="${cols}"><div class="spinner"></div></td></tr>`;
}

function emptyRow(cols, msg = 'لا توجد بيانات') {
  return `<tr><td colspan="${cols}" style="text-align:center;padding:2rem;color:var(--text-muted)">${msg}</td></tr>`;
}

function setupModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });
  const close = overlay.querySelectorAll('[data-close-modal]');
  close.forEach(btn => btn.addEventListener('click', () => overlay.classList.add('hidden')));
}

function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('hidden');
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('hidden');
}

function setupTabs(containerSel) {
  const container = document.querySelector(containerSel);
  if (!container) return;
  const btns  = container.querySelectorAll('.tab-btn');
  const panes = container.querySelectorAll('.tab-pane');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

/* ══════════════════════════════════════════════
   INIT: DASHBOARD
══════════════════════════════════════════════ */
async function initMahmoudDashboard() {
  renderNav();
  await loadDashboardStats();
  await loadDashboardSeason();
  await loadMostActiveSubjects();
  await loadMostActiveDoctors();
  await loadTopStudents();
  await loadAchievementSettings();
  setupDateRangeFilter();
}

async function loadDashboardStats() {
  const db = getDB(); if (!db) return;
  try {
    const [studRes, repRes, qRes, opRes, pendRes] = await Promise.all([
      db.from('students').select('id', { count:'exact', head:true }).eq('is_active', true),
      db.from('report_submissions').select('total_study_hours').eq('status','approved'),
      db.from('doctor_questions').select('id', { count:'exact', head:true }),
      db.from('study_sessions').select('duration_minutes').eq('status','completed'),
      db.from('report_submissions').select('id', { count:'exact', head:true }).eq('status','pending'),
    ]);

    const studCount  = studRes.count || 0;
    const totalHours = (repRes.data || []).reduce((s,r) => s + (r.total_study_hours||0), 0);
    const qCount     = qRes.count || 0;
    const opMins     = (opRes.data || []).reduce((s,r) => s + (r.duration_minutes||0), 0);
    const pendCount  = pendRes.count || 0;

    setStatCard('stat-students', studCount,                  '👥');
    setStatCard('stat-hours',    totalHours.toFixed(1)+'h',  '⏱️');
    setStatCard('stat-questions', qCount,                    '❓');
    setStatCard('stat-op-hours', (opMins/60).toFixed(1)+'h','⚙️');
    setStatCard('stat-pending',  pendCount,                  '⏳');
  } catch(e) { console.error(e); }
}

function setStatCard(id, value, icon) {
  const el = document.getElementById(id);
  if (!el) return;
  el.querySelector('.stat-value').textContent = value;
  if (icon) el.querySelector('.stat-icon').textContent = icon;
}

async function loadDashboardSeason() {
  const db = getDB(); if (!db) return;
  const { data: season } = await db.from('seasons').select('*').eq('is_active', true).maybeSingle();
  const el = document.getElementById('current-season-card');
  if (!el) return;
  if (!season) { el.innerHTML = '<p class="text-muted">لا يوجد موسم نشط حالياً</p>'; return; }
  el.innerHTML = `
    <div class="flex-between flex-wrap gap-sm">
      <div>
        <div class="fw-bold">${escHtml(season.name)}</div>
        <div class="text-xs text-muted mt-1">من ${fmtDate(season.starts_at)} — إلى ${fmtDate(season.ends_at) || 'مفتوح'}</div>
      </div>
      <span class="badge badge-green">نشط</span>
    </div>`;
}

async function loadMostActiveSubjects() {
  const db = getDB(); if (!db) return;
  const { data } = await db.from('daily_reports')
    .select('subject')
    .eq('status','approved');
  const counts = {};
  (data||[]).forEach(r => { counts[r.subject] = (counts[r.subject]||0)+1; });
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const el = document.getElementById('top-subjects-list');
  if (!el) return;
  el.innerHTML = sorted.length
    ? sorted.map(([sub,cnt],i)=>`
        <div class="leaderboard-mini"><div class="lb-row">
          <div class="lb-rank ${['gold','silver','bronze'][i]||''}">${i+1}</div>
          <div class="lb-name">${escHtml(sub)}</div>
          <div class="lb-val">${cnt}</div>
        </div></div>`).join('')
    : '<p class="text-muted text-sm">لا توجد بيانات</p>';
}

async function loadMostActiveDoctors() {
  const db = getDB(); if (!db) return;
  const { data } = await db.from('students').select('doctor_group').eq('is_active', true);
  const counts = {};
  (data||[]).forEach(r => { if(r.doctor_group) counts[r.doctor_group] = (counts[r.doctor_group]||0)+1; });
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const el = document.getElementById('top-doctors-list');
  if (!el) return;
  el.innerHTML = sorted.length
    ? sorted.map(([doc,cnt],i)=>`
        <div class="lb-row">
          <div class="lb-rank ${['gold','silver','bronze'][i]||''}">${i+1}</div>
          <div class="lb-name">${escHtml(doc)}</div>
          <div class="lb-val">${cnt} طالب</div>
        </div>`).join('')
    : '<p class="text-muted text-sm">لا توجد بيانات</p>';
}

async function loadTopStudents() {
  const db = getDB(); if (!db) return;
  const { data } = await db.from('students')
    .select('id, name, score, xp')
    .eq('is_active', true)
    .order('score', { ascending: false })
    .limit(5);
  const el = document.getElementById('top-students-list');
  if (!el) return;
  el.innerHTML = (data||[]).length
    ? (data||[]).map((s,i)=>`
        <div class="lb-row">
          <div class="lb-rank ${['gold','silver','bronze'][i]||''}">${i+1}</div>
          <div class="lb-name">${escHtml(s.name)}</div>
          <div class="lb-val">${s.score||0} نقطة</div>
        </div>`).join('')
    : '<p class="text-muted text-sm">لا توجد بيانات</p>';
}

async function loadAchievementSettings() {
  const db = getDB(); if (!db) return;
  const settings = {};
  const keys = ['report_window','open_time','close_time'];
  for (const k of keys) {
    const { data } = await db.from('app_settings').select('value').eq('key', k).maybeSingle();
    settings[k] = data?.value || null;
  }
  const modeEl  = document.getElementById('ach-mode');
  const openEl  = document.getElementById('ach-open');
  const closeEl = document.getElementById('ach-close');
  if (modeEl)  modeEl.value  = settings.report_window || 'always_open';
  if (openEl)  openEl.value  = settings.open_time     || '';
  if (closeEl) closeEl.value = settings.close_time    || '';
}

function setupDateRangeFilter() {
  const btn = document.getElementById('date-filter-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const from = document.getElementById('date-from')?.value;
    const to   = document.getElementById('date-to')?.value;
    showToast(`فلتر من ${from||'البداية'} إلى ${to||'الآن'}`, 'info');
    // Could reload stats with date range — placeholder
  });
}

window.saveAchievementSettings = async function() {
  const db = getDB(); if (!db) return;
  const mode  = document.getElementById('ach-mode')?.value;
  const open  = document.getElementById('ach-open')?.value;
  const close = document.getElementById('ach-close')?.value;
  const upserts = [
    { key:'report_window', value: mode,  updated_at: new Date().toISOString() },
    { key:'open_time',     value: open,  updated_at: new Date().toISOString() },
    { key:'close_time',    value: close, updated_at: new Date().toISOString() },
  ];
  const { error } = await db.from('app_settings').upsert(upserts, { onConflict: 'key' });
  if (error) showToast(error.message, 'error');
  else showToast('تم حفظ الإعدادات ✅', 'success');
};

window.doResetSite = async function() {
  if (!confirm('هذا سيؤرشف الموسم الحالي ويبدأ موسماً جديداً. هل أنت متأكد؟')) return;
  const db = getDB(); if (!db) return;
  const { data: curSeason } = await db.from('seasons').select('*').eq('is_active',true).maybeSingle();
  if (!curSeason) { showToast('لا يوجد موسم نشط', 'warn'); return; }

  // 1) build archive snapshot
  const { data: students } = await db.from('students').select('id,name,score,xp,level');
  const archiveData = { students: students||[], archived_at: new Date().toISOString(), season: curSeason };

  // 2) insert into season_archives
  const { error: archErr } = await db.from('season_archives').insert({
    season_id:    curSeason.id,
    season_name:  curSeason.name,
    archive_data: archiveData,
    created_by:   ADMIN_ACTOR,
    created_at:   new Date().toISOString(),
  });
  if (archErr) { showToast('خطأ في الأرشفة: '+archErr.message, 'error'); return; }

  // 3) mark current season archived
  await db.from('seasons').update({ is_active: false, archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', curSeason.id);

  // 4) create new season
  const newName = `الموسم ${Date.now()}`;
  await db.from('seasons').insert({ name: newName, starts_at: new Date().toISOString(), is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });

  // 5) log
  await logAction({ table:'student_logs', action_type:'season_archive', note:`أرشفة موسم: ${curSeason.name}` });
  showToast('تم إعادة الموقع وبدء موسم جديد ✅', 'success');
  setTimeout(() => location.reload(), 1500);
};

/* ══════════════════════════════════════════════
   INIT: STUDENTS
══════════════════════════════════════════════ */
let _allStudents = [];

async function initMahmoudStudents() {
  renderNav();
  setupModal('student-modal');
  setupModal('points-modal');
  setupModal('profile-modal');
  await loadStudents();
  setupStudentFilters();
  setupStudentForm();
}

async function loadStudents(filters = {}) {
  const db = getDB(); if (!db) return;
  const tbody = document.getElementById('students-tbody');
  if (!tbody) return;
  tbody.innerHTML = loadingRow(10);

  let q = db.from('students').select('*').order('score', { ascending:false });
  if (filters.grade)   q = q.eq('grade_level', filters.grade);
  if (filters.edu)     q = q.eq('edu_system', filters.edu);
  if (filters.track)   q = q.eq('track', filters.track);
  if (filters.doctor)  q = q.eq('doctor_group', filters.doctor);
  if (filters.status === 'active')   q = q.eq('is_active', true).eq('is_frozen', false);
  if (filters.status === 'frozen')   q = q.eq('is_frozen', true);
  if (filters.status === 'inactive') q = q.eq('is_active', false);
  if (filters.search) {
    const s = filters.search.trim();
    q = q.or(`name.ilike.%${s}%,phone.ilike.%${s}%`);
  }

  const { data, error } = await q.limit(200);
  if (error) { tbody.innerHTML = emptyRow(10, error.message); return; }
  _allStudents = data || [];

  if (!_allStudents.length) { tbody.innerHTML = emptyRow(10, 'لا يوجد طلاب'); return; }

  tbody.innerHTML = _allStudents.map(s => {
    const frozen = s.is_frozen ? 'badge-blue' : '';
    const active = s.is_active ? 'badge-green' : 'badge-red';
    const statusLabel = !s.is_active ? 'غير فعّال' : s.is_frozen ? 'مجمد' : 'فعّال';
    const statusClass = !s.is_active ? 'badge-red' : s.is_frozen ? 'badge-blue' : 'badge-green';
    return `<tr>
      <td>${escHtml(s.name)}</td>
      <td class="td-mono">${escHtml(s.phone)}</td>
      <td>${escHtml(s.grade_level||'—')}</td>
      <td>${escHtml(s.edu_system||'—')}</td>
      <td>${escHtml(s.track||'—')}</td>
      <td>${escHtml(s.doctor_group||'—')}</td>
      <td class="td-mono">${s.score||0}</td>
      <td class="td-mono">${s.xp||0}</td>
      <td><span class="badge ${statusClass}">${statusLabel}</span></td>
      <td>
        <div class="action-group">
          <button class="btn btn-teal btn-xs" onclick="openStudentProfile('${s.id}')">👁 ملف</button>
          <button class="btn btn-ghost btn-xs" onclick="openEditStudent('${s.id}')">✏️ تعديل</button>
          <button class="btn btn-yellow btn-xs" onclick="openPointsModal('${s.id}','${escHtml(s.name)}')">💰 نقاط</button>
          ${s.is_frozen
            ? `<button class="btn btn-green btn-xs" onclick="toggleFreeze('${s.id}',false,'${escHtml(s.name)}')">✅ تفعيل</button>`
            : `<button class="btn btn-blue btn-xs" onclick="toggleFreeze('${s.id}',true,'${escHtml(s.name)}')">🧊 تجميد</button>`}
          ${s.is_active
            ? `<button class="btn btn-red btn-xs" onclick="softDeleteStudent('${s.id}','${escHtml(s.name)}')">🚫 تعطيل</button>`
            : `<button class="btn btn-green btn-xs" onclick="restoreStudent('${s.id}','${escHtml(s.name)}')">↩️ استعادة</button>`}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function setupStudentFilters() {
  const btn = document.getElementById('students-filter-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    loadStudents(getStudentFilters());
  });
  document.getElementById('students-search')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') loadStudents(getStudentFilters());
  });
}

function getStudentFilters() {
  return {
    search: document.getElementById('students-search')?.value || '',
    grade:  document.getElementById('filter-grade')?.value || '',
    edu:    document.getElementById('filter-edu')?.value || '',
    track:  document.getElementById('filter-track')?.value || '',
    doctor: document.getElementById('filter-doctor')?.value || '',
    status: document.getElementById('filter-status')?.value || '',
  };
}

function setupStudentForm() {
  const form = document.getElementById('student-edit-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const id = form.dataset.studentId;
    if (!id) return;
    const updates = {
      name:          form.querySelector('[name=name]')?.value?.trim(),
      phone:         form.querySelector('[name=phone]')?.value?.trim(),
      grade_level:   form.querySelector('[name=grade_level]')?.value?.trim(),
      edu_system:    form.querySelector('[name=edu_system]')?.value?.trim(),
      track:         form.querySelector('[name=track]')?.value?.trim(),
      doctor_group:  form.querySelector('[name=doctor_group]')?.value?.trim(),
    };
    const pin = form.querySelector('[name=pin_hash]')?.value?.trim();
    if (pin) updates.pin_hash = pin;

    const ok = await safeUpdate('students', { id }, updates);
    if (ok) {
      await logAction({ action_type:'edit_student', student_id:id, note: JSON.stringify(updates) });
      showToast('تم التعديل ✅', 'success');
      closeModal('student-modal');
      loadStudents(getStudentFilters());
    }
  });
}

window.openEditStudent = function(id) {
  const s = _allStudents.find(x => x.id === id);
  if (!s) return;
  const form = document.getElementById('student-edit-form');
  if (!form) return;
  form.dataset.studentId = id;
  form.querySelector('[name=name]').value        = s.name||'';
  form.querySelector('[name=phone]').value       = s.phone||'';
  form.querySelector('[name=grade_level]').value = s.grade_level||'';
  form.querySelector('[name=edu_system]').value  = s.edu_system||'';
  form.querySelector('[name=track]').value       = s.track||'';
  form.querySelector('[name=doctor_group]').value= s.doctor_group||'';
  form.querySelector('[name=pin_hash]').value    = '';
  document.getElementById('modal-student-name').textContent = s.name;
  openModal('student-modal');
};

window.toggleFreeze = async function(id, freeze, name) {
  const ok = await safeUpdate('students', { id }, { is_frozen: freeze });
  if (ok) {
    await logAction({ action_type: freeze ? 'freeze_student' : 'unfreeze_student', student_id: id, note: name });
    showToast(freeze ? 'تم التجميد 🧊' : 'تم رفع التجميد ✅', freeze ? 'info' : 'success');
    loadStudents(getStudentFilters());
  }
};

window.softDeleteStudent = async function(id, name) {
  if (!confirm(`تعطيل الطالب "${name}"؟ لن يتم حذف البيانات.`)) return;
  const ok = await safeUpdate('students', { id }, { is_active: false });
  if (ok) {
    await logAction({ action_type:'soft_delete_student', student_id:id, note:name });
    showToast('تم التعطيل 🚫', 'warn');
    loadStudents(getStudentFilters());
  }
};

window.restoreStudent = async function(id, name) {
  const ok = await safeUpdate('students', { id }, { is_active: true });
  if (ok) {
    await logAction({ action_type:'restore_student', student_id:id, note:name });
    showToast('تمت الاستعادة ✅', 'success');
    loadStudents(getStudentFilters());
  }
};

window.openPointsModal = function(id, name) {
  const modal = document.getElementById('points-modal');
  if (!modal) return;
  modal.querySelector('#points-student-name').textContent = name;
  modal.querySelector('#points-student-id').value = id;
  modal.querySelector('#points-amount').value = '';
  modal.querySelector('#points-reason').value = '';
  modal.querySelector('#points-op').value = 'add';
  openModal('points-modal');
};

window.submitPoints = async function() {
  const db = getDB(); if (!db) return;
  const modal = document.getElementById('points-modal');
  const id     = modal.querySelector('#points-student-id').value;
  const amount = parseInt(modal.querySelector('#points-amount').value);
  const reason = modal.querySelector('#points-reason').value?.trim();
  const op     = modal.querySelector('#points-op').value;
  if (!amount || amount <= 0) { showToast('أدخل عدد نقاط صحيح', 'error'); return; }

  const s = _allStudents.find(x => x.id === id);
  if (!s) return;
  const oldScore = s.score || 0;
  const delta    = op === 'add' ? amount : -amount;
  const newScore = Math.max(0, oldScore + delta);

  const ok = await safeUpdate('students', { id }, { score: newScore });
  if (!ok) return;

  await db.from('admin_point_logs').insert({ student_id:id, points:delta, reason, created_at: new Date().toISOString() });
  await logAction({ action_type: op==='add'?'add_points':'subtract_points', student_id:id, old_value:oldScore, new_value:newScore, note:reason });
  showToast(`تم ${op==='add'?'إضافة':'خصم'} ${amount} نقطة ✅`, 'success');
  closeModal('points-modal');
  loadStudents(getStudentFilters());
};

window.openStudentProfile = async function(id) {
  const db = getDB(); if (!db) return;
  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  modal.querySelector('#profile-content').innerHTML = '<div class="spinner" style="margin:2rem auto"></div>';
  openModal('profile-modal');

  const { data: s } = await db.from('students').select('*').eq('id', id).single();
  if (!s) { modal.querySelector('#profile-content').innerHTML = '<p class="text-muted">لا توجد بيانات</p>'; return; }

  const [reps, sessions, logs, answers, qgrades] = await Promise.all([
    db.from('report_submissions').select('*').eq('student_id', id).order('created_at', { ascending:false }).limit(20),
    db.from('study_sessions').select('*').eq('student_id', id).order('created_at', { ascending:false }).limit(20),
    db.from('student_logs').select('*').eq('student_id', id).order('created_at', { ascending:false }).limit(20),
    db.from('doctor_answers').select('*').eq('student_id', id).order('created_at', { ascending:false }).limit(10),
    db.from('quiz_grades').select('*, quizzes(title)').eq('student_id', id).order('created_at', { ascending:false }).limit(10),
  ]);

  const statusLabel = !s.is_active ? 'غير فعّال' : s.is_frozen ? 'مجمد' : 'فعّال';
  const statusClass = !s.is_active ? 'badge-red' : s.is_frozen ? 'badge-blue' : 'badge-green';

  modal.querySelector('#profile-content').innerHTML = `
    <div class="grid-2 mb-2">
      <div class="card">
        <div class="card-title">📋 بيانات الطالب</div>
        <table style="font-size:.82rem"><tbody>
          <tr><td class="text-muted">الاسم:</td><td>${escHtml(s.name)}</td></tr>
          <tr><td class="text-muted">الهاتف:</td><td class="td-mono">${escHtml(s.phone)}</td></tr>
          <tr><td class="text-muted">الصف:</td><td>${escHtml(s.grade_level||'—')}</td></tr>
          <tr><td class="text-muted">النظام:</td><td>${escHtml(s.edu_system||'—')}</td></tr>
          <tr><td class="text-muted">التتبع:</td><td>${escHtml(s.track||'—')}</td></tr>
          <tr><td class="text-muted">الدكتور:</td><td>${escHtml(s.doctor_group||'—')}</td></tr>
          <tr><td class="text-muted">الحالة:</td><td><span class="badge ${statusClass}">${statusLabel}</span></td></tr>
        </tbody></table>
      </div>
      <div class="card">
        <div class="card-title">📈 الإحصائيات</div>
        <table style="font-size:.82rem"><tbody>
          <tr><td class="text-muted">النقاط:</td><td class="td-mono text-purple">${s.score||0}</td></tr>
          <tr><td class="text-muted">XP:</td><td class="td-mono text-yellow">${s.xp||0}</td></tr>
          <tr><td class="text-muted">المستوى:</td><td>${s.level||1}</td></tr>
          <tr><td class="text-muted">أفضل streak:</td><td>${s.best_streak||0} يوم</td></tr>
          <tr><td class="text-muted">آخر تقرير:</td><td>${fmtDate(s.last_report_date)}</td></tr>
          <tr><td class="text-muted">تاريخ التسجيل:</td><td>${fmtDate(s.created_at)}</td></tr>
        </tbody></table>
      </div>
    </div>

    <div class="tabs" style="margin-bottom:.75rem">
      <button class="tab-btn active" data-tab="ptab-reports">التقارير</button>
      <button class="tab-btn" data-tab="ptab-sessions">الجلسات</button>
      <button class="tab-btn" data-tab="ptab-answers">إجاباته</button>
      <button class="tab-btn" data-tab="ptab-quizzes">الكويزات</button>
      <button class="tab-btn" data-tab="ptab-logs">السجلات</button>
    </div>

    <div id="ptab-reports" class="tab-pane active">
      <div class="table-wrap"><table>
        <thead><tr><th>التاريخ</th><th>الحالة</th><th>النقاط</th><th>ساعات</th></tr></thead>
        <tbody>${(reps.data||[]).map(r=>`<tr>
          <td>${fmtDate(r.report_date)}</td>
          <td>${statusBadge(r.status)}</td>
          <td class="td-mono">${r.total_points||0}</td>
          <td class="td-mono">${r.total_study_hours||0}</td>
        </tr>`).join('') || emptyRow(4)}</tbody>
      </table></div>
    </div>

    <div id="ptab-sessions" class="tab-pane">
      <div class="table-wrap"><table>
        <thead><tr><th>المادة</th><th>النوع</th><th>الدقائق</th><th>النقاط</th><th>الحالة</th></tr></thead>
        <tbody>${(sessions.data||[]).map(s2=>`<tr>
          <td>${escHtml(s2.subject||'—')}</td>
          <td>${escHtml(s2.session_type||'—')}</td>
          <td class="td-mono">${s2.duration_minutes||0}</td>
          <td class="td-mono">${s2.league_points||0}</td>
          <td>${statusBadge(s2.status)}</td>
        </tr>`).join('') || emptyRow(5)}</tbody>
      </table></div>
    </div>

    <div id="ptab-answers" class="tab-pane">
      ${(answers.data||[]).map(a=>`<div class="answer-card ${a.is_hidden?'hidden-ans':''}">
        <div class="ans-text">${escHtml(a.answer_text)}</div>
        <div class="ans-meta"><span>${fmtDate(a.created_at)}</span>
          ${a.is_featured?'<span class="badge badge-yellow">⭐ مميز</span>':''}
          ${a.is_hidden?'<span class="badge badge-gray">مخفي</span>':''}
        </div>
      </div>`).join('') || '<p class="text-muted text-sm">لا إجابات</p>'}
    </div>

    <div id="ptab-quizzes" class="tab-pane">
      <div class="table-wrap"><table>
        <thead><tr><th>الكويز</th><th>الدرجة</th><th>من</th></tr></thead>
        <tbody>${(qgrades.data||[]).map(q=>`<tr>
          <td>${escHtml(q.quizzes?.title||'—')}</td>
          <td class="td-mono">${q.score||0} / ${q.max_score||0}</td>
          <td>${fmtDate(q.created_at)}</td>
        </tr>`).join('') || emptyRow(3)}</tbody>
      </table></div>
    </div>

    <div id="ptab-logs" class="tab-pane">
      <div class="table-wrap"><table>
        <thead><tr><th>الإجراء</th><th>من</th><th>إلى</th><th>ملاحظة</th><th>وقت</th></tr></thead>
        <tbody>${(logs.data||[]).map(l=>`<tr>
          <td>${escHtml(l.action_type)}</td>
          <td class="td-mono text-sm">${escHtml(l.old_value||'—')}</td>
          <td class="td-mono text-sm">${escHtml(l.new_value||'—')}</td>
          <td>${escHtml(l.note||'—')}</td>
          <td>${fmtDatetime(l.created_at)}</td>
        </tr>`).join('') || emptyRow(5)}</tbody>
      </table></div>
    </div>
  `;
  // activate tabs inside modal
  const modalBox = modal.querySelector('.modal-box');
  const tabBtns  = modalBox.querySelectorAll('.tab-btn');
  const tabPanes = modalBox.querySelectorAll('.tab-pane');
  tabBtns.forEach(btn => btn.addEventListener('click', () => {
    tabBtns.forEach(b=>b.classList.remove('active'));
    tabPanes.forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab)?.classList.add('active');
  }));
};

/* ══════════════════════════════════════════════
   INIT: REPORTS
══════════════════════════════════════════════ */
async function initMahmoudReports() {
  renderNav();
  setupModal('report-detail-modal');
  await loadReports();
  setupReportFilters();
}

async function loadReports(filters = {}) {
  const db = getDB(); if (!db) return;
  const tbody = document.getElementById('reports-tbody');
  if (!tbody) return;
  tbody.innerHTML = loadingRow(8);

  let q = db.from('report_submissions')
    .select('*, students(name, doctor_group)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters.status) q = q.eq('status', filters.status);
  if (filters.date)   q = q.eq('report_date', filters.date);
  if (filters.season) q = q.eq('season_id', filters.season);

  const { data, error } = await q;
  if (error) { tbody.innerHTML = emptyRow(8, error.message); return; }
  const rows = data || [];

  if (!rows.length) { tbody.innerHTML = emptyRow(8, 'لا توجد تقارير'); return; }

  tbody.innerHTML = rows.map(r => `<tr>
    <td>${escHtml(r.students?.name||'—')}</td>
    <td>${escHtml(r.students?.doctor_group||'—')}</td>
    <td>${fmtDate(r.report_date)}</td>
    <td class="td-mono">${r.total_points||0}</td>
    <td class="td-mono">${r.total_study_hours||0}</td>
    <td>${statusBadge(r.status)}</td>
    <td>${escHtml(r.admin_note||'—')}</td>
    <td>
      <div class="action-group">
        <button class="btn btn-green btn-xs" onclick="reviewReport('${r.id}','approved')">✅ قبول</button>
        <button class="btn btn-red btn-xs"   onclick="openRejectReport('${r.id}')">❌ رفض</button>
        <button class="btn btn-ghost btn-xs" onclick="openReportDetail('${r.id}')">🔍 تفاصيل</button>
      </div>
    </td>
  </tr>`).join('');
}

function setupReportFilters() {
  document.getElementById('reports-filter-btn')?.addEventListener('click', () => {
    loadReports({
      status: document.getElementById('rfilter-status')?.value,
      date:   document.getElementById('rfilter-date')?.value,
    });
  });
}

window.reviewReport = async function(id, status, adminNote = '') {
  const db = getDB(); if (!db) return;
  const updates = { status, reviewed_by: ADMIN_ACTOR, reviewed_at: new Date().toISOString() };
  if (adminNote) updates.admin_note = adminNote;
  const ok = await safeUpdate('report_submissions', { id }, updates);
  if (ok) {
    // also update child daily_reports
    await db.from('daily_reports').update({ status, admin_note: adminNote, reviewed_by: ADMIN_ACTOR, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('submission_id', id);
    await logAction({ action_type:`report_${status}`, note:`submission ${id}`, new_value:status });
    showToast(status==='approved'?'تم القبول ✅':'تم الرفض ❌', status==='approved'?'success':'warn');
    loadReports();
  }
};

window.openRejectReport = function(id) {
  const note = prompt('سبب الرفض (اختياري):') || '';
  reviewReport(id, 'rejected', note);
};

window.openReportDetail = async function(id) {
  const db = getDB(); if (!db) return;
  const modal = document.getElementById('report-detail-modal');
  if (!modal) return;
  modal.querySelector('#report-detail-body').innerHTML = '<div class="spinner" style="margin:2rem auto"></div>';
  openModal('report-detail-modal');

  const [subRes, drRes] = await Promise.all([
    db.from('report_submissions').select('*, students(name)').eq('id', id).single(),
    db.from('daily_reports').select('*').eq('submission_id', id).order('created_at'),
  ]);
  const sub = subRes.data;
  const drs = drRes.data || [];

  modal.querySelector('#report-detail-body').innerHTML = `
    <div class="card mb-2">
      <div class="card-title">📋 ملخص الطلب</div>
      <div class="grid-2" style="font-size:.82rem">
        <div><span class="text-muted">الطالب: </span>${escHtml(sub?.students?.name||'—')}</div>
        <div><span class="text-muted">التاريخ: </span>${fmtDate(sub?.report_date)}</div>
        <div><span class="text-muted">النقاط: </span><span class="td-mono">${sub?.total_points||0}</span></div>
        <div><span class="text-muted">الساعات: </span><span class="td-mono">${sub?.total_study_hours||0}</span></div>
        <div><span class="text-muted">الحالة: </span>${statusBadge(sub?.status)}</div>
        <div><span class="text-muted">ملاحظة: </span>${escHtml(sub?.admin_note||'—')}</div>
      </div>
    </div>
    <div class="card-title">📝 التقارير اليومية</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>المادة</th><th>النوع</th><th>الكمية</th><th>الساعات</th><th>النقاط</th><th>ملاحظات</th><th>الحالة</th></tr></thead>
        <tbody>${drs.map(d=>`<tr>
          <td>${escHtml(d.subject||'—')}</td>
          <td>${escHtml(d.activity_type||'—')}</td>
          <td class="td-mono">${d.amount||0}</td>
          <td class="td-mono">${d.study_hours||0}</td>
          <td class="td-mono">${d.points||0}</td>
          <td>${escHtml(d.notes||'—')}</td>
          <td>${statusBadge(d.status)}</td>
        </tr>`).join('') || emptyRow(7)}</tbody>
      </table>
    </div>
    <div class="modal-footer mt-2" style="border:none;padding:0">
      <button class="btn btn-green" onclick="reviewReport('${id}','approved');closeModal('report-detail-modal')">✅ قبول</button>
      <button class="btn btn-red"   onclick="openRejectReport('${id}');closeModal('report-detail-modal')">❌ رفض</button>
    </div>
  `;
};

/* ══════════════════════════════════════════════
   INIT: OPERATION
══════════════════════════════════════════════ */
async function initMahmoudOperation() {
  renderNav();
  setupModal('session-detail-modal');
  await loadSessions();
  setupOperationFilters();
}

async function loadSessions(filters = {}) {
  const db = getDB(); if (!db) return;
  const tbody = document.getElementById('sessions-tbody');
  if (!tbody) return;
  tbody.innerHTML = loadingRow(9);

  let q = db.from('study_sessions')
    .select('*, students(name, doctor_group)')
    .order('created_at', { ascending:false })
    .limit(200);

  if (filters.date)    q = q.gte('created_at', filters.date+'T00:00:00').lte('created_at', filters.date+'T23:59:59');
  if (filters.status)  q = q.eq('status', filters.status);
  if (filters.doctor) {
    // filter via students - approximate
  }

  const { data, error } = await q;
  if (error) { tbody.innerHTML = emptyRow(9, error.message); return; }
  const rows = data || [];

  if (!rows.length) { tbody.innerHTML = emptyRow(9, 'لا توجد جلسات'); return; }

  tbody.innerHTML = rows.map(s => `<tr>
    <td>${escHtml(s.students?.name||'—')}</td>
    <td>${escHtml(s.students?.doctor_group||'—')}</td>
    <td>${escHtml(s.subject||'—')}</td>
    <td>${escHtml(s.session_type||'—')}</td>
    <td class="td-mono">${s.duration_minutes||0}</td>
    <td class="td-mono">${s.league_points||0}</td>
    <td class="td-mono">${s.xp_awarded||0}</td>
    <td>${statusBadge(s.status)}</td>
    <td>
      <div class="action-group">
        <button class="btn btn-teal btn-xs"   onclick="openSessionDetail('${s.id}')">🔍 تفاصيل</button>
        <button class="btn btn-yellow btn-xs" onclick="openAdjustSession('${s.id}','${s.league_points||0}','${s.xp_awarded||0}')">✏️ تعديل</button>
        <button class="btn btn-red btn-xs"    onclick="markSessionStatus('${s.id}','rejected')">🚩 مشبوه</button>
      </div>
    </td>
  </tr>`).join('');
}

function setupOperationFilters() {
  document.getElementById('op-filter-btn')?.addEventListener('click', () => {
    loadSessions({
      date:   document.getElementById('opfilter-date')?.value,
      status: document.getElementById('opfilter-status')?.value,
    });
  });
}

window.markSessionStatus = async function(id, status) {
  const ok = await safeUpdate('study_sessions', { id }, { status });
  if (ok) {
    await logAction({ action_type:`session_${status}`, note:`session ${id}`, new_value:status });
    showToast('تم التحديث', 'warn');
    loadSessions();
  }
};

window.openAdjustSession = function(id, pts, xp) {
  const modal = document.getElementById('session-detail-modal');
  if (!modal) return;
  modal.querySelector('#sdm-body').innerHTML = `
    <div class="form-group"><label class="form-label">النقاط الجديدة</label>
      <input type="number" id="adj-pts" value="${pts}" class="w-full"></div>
    <div class="form-group"><label class="form-label">XP الجديد</label>
      <input type="number" id="adj-xp" value="${xp}" class="w-full"></div>
    <button class="btn btn-primary btn-block" onclick="submitAdjustSession('${id}')">💾 حفظ التعديل</button>
  `;
  openModal('session-detail-modal');
};

window.submitAdjustSession = async function(id) {
  const pts = parseInt(document.getElementById('adj-pts')?.value);
  const xp  = parseInt(document.getElementById('adj-xp')?.value);
  const ok  = await safeUpdate('study_sessions', { id }, { league_points:pts, xp_awarded:xp });
  if (ok) {
    await logAction({ action_type:'adjust_session', note:`session ${id}`, new_value:`pts=${pts} xp=${xp}` });
    showToast('تم التعديل ✅', 'success');
    closeModal('session-detail-modal');
    loadSessions();
  }
};

window.openSessionDetail = async function(id) {
  const db = getDB(); if (!db) return;
  const modal = document.getElementById('session-detail-modal');
  if (!modal) return;
  modal.querySelector('#sdm-body').innerHTML = '<div class="spinner" style="margin:2rem auto"></div>';
  openModal('session-detail-modal');
  const { data: s } = await db.from('study_sessions').select('*, students(name)').eq('id', id).single();
  const { data: tasks } = await db.from('operation_session_tasks').select('*').eq('session_id', id);
  modal.querySelector('#sdm-body').innerHTML = `
    <div class="card mb-2" style="font-size:.82rem">
      <div class="grid-2">
        <div><span class="text-muted">الطالب: </span>${escHtml(s?.students?.name||'—')}</div>
        <div><span class="text-muted">المادة: </span>${escHtml(s?.subject||'—')}</div>
        <div><span class="text-muted">المدة: </span>${s?.duration_minutes||0} دقيقة</div>
        <div><span class="text-muted">النقاط: </span>${s?.league_points||0}</div>
        <div><span class="text-muted">XP: </span>${s?.xp_awarded||0}</div>
        <div><span class="text-muted">الحالة: </span>${statusBadge(s?.status)}</div>
        <div><span class="text-muted">بداية: </span>${fmtDatetime(s?.started_at)}</div>
        <div><span class="text-muted">نهاية: </span>${fmtDatetime(s?.ended_at)}</div>
      </div>
    </div>
    <div class="card-title">المهام</div>
    <div class="table-wrap"><table>
      <thead><tr><th>المادة</th><th>النوع</th><th>الكمية</th><th>الدقائق</th><th>النقاط</th></tr></thead>
      <tbody>${(tasks||[]).map(t=>`<tr>
        <td>${escHtml(t.subject)}</td><td>${escHtml(t.task_type)}</td>
        <td class="td-mono">${t.amount||0}</td><td class="td-mono">${t.duration_minutes||0}</td>
        <td class="td-mono">${t.league_points||0}</td>
      </tr>`).join('') || emptyRow(5)}</tbody>
    </table></div>
  `;
};

/* ══════════════════════════════════════════════
   INIT: QUIZZES
══════════════════════════════════════════════ */
let _quizzes = [];

async function initMahmoudQuizzes() {
  renderNav();
  setupModal('quiz-form-modal');
  setupModal('grades-modal');
  await loadQuizzes();
  setupQuizForm();
  setupTabs('#quizzes-page');
}

async function loadQuizzes() {
  const db = getDB(); if (!db) return;
  const tbody = document.getElementById('quizzes-tbody');
  if (!tbody) return;
  tbody.innerHTML = loadingRow(8);

  const { data, error } = await db.from('quizzes').select('*').order('quiz_date', { ascending:false });
  if (error) { tbody.innerHTML = emptyRow(8, error.message); return; }
  _quizzes = data || [];
  if (!_quizzes.length) { tbody.innerHTML = emptyRow(8, 'لا توجد كويزات'); return; }

  tbody.innerHTML = _quizzes.map(q => `<tr>
    <td>${escHtml(q.title)}</td>
    <td>${escHtml(q.grade_level||'—')}</td>
    <td>${escHtml(q.subject||'—')}</td>
    <td>${fmtDate(q.quiz_date)}</td>
    <td>${fmtDatetime(q.open_at)||'—'}</td>
    <td>${fmtDatetime(q.close_at)||'—'}</td>
    <td>${q.is_visible ? '<span class="badge badge-green">ظاهر</span>' : '<span class="badge badge-gray">مخفي</span>'}</td>
    <td>
      <div class="action-group">
        <button class="btn btn-ghost btn-xs" onclick="openEditQuiz('${q.id}')">✏️ تعديل</button>
        <button class="btn btn-red btn-xs"   onclick="hideQuiz('${q.id}')">🙈 إخفاء</button>
        <button class="btn btn-teal btn-xs"  onclick="openGradesPanel('${q.id}','${escHtml(q.title)}')">📊 درجات</button>
      </div>
    </td>
  </tr>`).join('');
}

function setupQuizForm() {
  document.getElementById('quiz-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const id   = form.dataset.quizId;
    const payload = {
      title:      form.querySelector('[name=title]').value.trim(),
      grade_level:form.querySelector('[name=grade_level]').value.trim(),
      edu_system: form.querySelector('[name=edu_system]').value.trim(),
      track:      form.querySelector('[name=track]').value.trim(),
      subject:    form.querySelector('[name=subject]').value.trim(),
      quiz_date:  form.querySelector('[name=quiz_date]').value,
      open_at:    form.querySelector('[name=open_at]').value || null,
      close_at:   form.querySelector('[name=close_at]').value || null,
      quiz_url:   form.querySelector('[name=quiz_url]').value.trim() || null,
      is_visible: form.querySelector('[name=is_visible]').checked,
      updated_at: new Date().toISOString(),
    };
    if (id) {
      const ok = await safeUpdate('quizzes', { id }, payload);
      if (ok) { showToast('تم تعديل الكويز ✅', 'success'); closeModal('quiz-form-modal'); loadQuizzes(); }
    } else {
      payload.created_at = new Date().toISOString();
      const res = await safeInsert('quizzes', payload);
      if (res) { showToast('تمت إضافة الكويز ✅', 'success'); closeModal('quiz-form-modal'); loadQuizzes(); }
    }
  });
}

window.openAddQuiz = function() {
  const form = document.getElementById('quiz-form');
  if (!form) return;
  form.reset(); delete form.dataset.quizId;
  document.getElementById('quiz-modal-title').textContent = 'إضافة كويز';
  form.querySelector('[name=is_visible]').checked = true;
  openModal('quiz-form-modal');
};

window.openEditQuiz = function(id) {
  const q = _quizzes.find(x => x.id === id);
  if (!q) return;
  const form = document.getElementById('quiz-form');
  if (!form) return;
  form.dataset.quizId = id;
  document.getElementById('quiz-modal-title').textContent = 'تعديل كويز';
  form.querySelector('[name=title]').value       = q.title||'';
  form.querySelector('[name=grade_level]').value = q.grade_level||'';
  form.querySelector('[name=edu_system]').value  = q.edu_system||'';
  form.querySelector('[name=track]').value       = q.track||'';
  form.querySelector('[name=subject]').value     = q.subject||'';
  form.querySelector('[name=quiz_date]').value   = q.quiz_date||'';
  form.querySelector('[name=open_at]').value     = q.open_at?.slice(0,16)||'';
  form.querySelector('[name=close_at]').value    = q.close_at?.slice(0,16)||'';
  form.querySelector('[name=quiz_url]').value    = q.quiz_url||'';
  form.querySelector('[name=is_visible]').checked= q.is_visible;
  openModal('quiz-form-modal');
};

window.hideQuiz = async function(id) {
  const ok = await safeUpdate('quizzes', { id }, { is_visible: false });
  if (ok) { showToast('تم إخفاء الكويز 🙈', 'warn'); loadQuizzes(); }
};

window.openGradesPanel = async function(quizId, title) {
  const db = getDB(); if (!db) return;
  const modal = document.getElementById('grades-modal');
  if (!modal) return;
  modal.querySelector('#grades-modal-title').textContent = `درجات: ${title}`;
  modal.querySelector('#grades-body').innerHTML = '<div class="spinner" style="margin:2rem auto"></div>';
  openModal('grades-modal');
  modal.querySelector('#csv-quiz-id').value = quizId;

  const { data } = await db.from('quiz_grades').select('*').eq('quiz_id', quizId).order('score', { ascending:false });
  const grades   = data || [];
  modal.querySelector('#grades-body').innerHTML = grades.length
    ? `<div class="table-wrap"><table>
        <thead><tr><th>الاسم</th><th>الهاتف</th><th>الدرجة</th><th>من</th></tr></thead>
        <tbody>${grades.map(g=>`<tr>
          <td>${escHtml(g.student_name||'—')}</td>
          <td class="td-mono">${escHtml(g.student_phone||'—')}</td>
          <td class="td-mono">${g.score||0}</td>
          <td class="td-mono">${g.max_score||0}</td>
        </tr>`).join('')}</tbody>
      </table></div>`
    : '<p class="text-muted text-sm empty-state">لا توجد درجات بعد. ارفع ملف CSV.</p>';
};

window.handleGradesCSV = function(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    const text  = e.target.result;
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g,''));
    const quizId  = document.getElementById('csv-quiz-id')?.value;
    if (!quizId) { showToast('لا يوجد quiz ID', 'error'); return; }

    const db = getDB(); if (!db) return;
    const { data: students } = await db.from('students').select('id, phone');
    const phoneMap = {};
    (students||[]).forEach(s => { phoneMap[s.phone] = s.id; });

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/"/g,''));
      if (!cols.some(c=>c)) continue;
      const row = {};
      headers.forEach((h,idx) => { row[h] = cols[idx]||''; });
      const phone     = row.phone || '';
      const studentId = phoneMap[phone] || null;
      rows.push({
        quiz_id:      quizId,
        student_id:   studentId,
        student_phone:phone,
        student_name: row.name  || row.student_name || '',
        score:        parseFloat(row.score)||0,
        max_score:    parseFloat(row.max_score)||0,
        created_at:   new Date().toISOString(),
      });
    }
    const ok = await safeInsertMany('quiz_grades', rows);
    if (ok) {
      showToast(`تم رفع ${rows.length} درجة ✅`, 'success');
      openGradesPanel(quizId, '');
    }
  };
  reader.readAsText(file);
  input.value = '';
};

/* ══════════════════════════════════════════════
   INIT: DOCTOR QUESTION
══════════════════════════════════════════════ */
let _currentQuestion = null;

async function initMahmoudDoctorQuestion() {
  renderNav();
  setupModal('question-form-modal');
  await loadTodayQuestion();
  setupQuestionForm();
}

async function loadTodayQuestion() {
  const db = getDB(); if (!db) return;
  const today = new Date().toISOString().slice(0,10);
  const { data: q } = await db.from('doctor_questions').select('*').eq('question_date', today).maybeSingle();
  _currentQuestion = q || null;

  const el = document.getElementById('question-display');
  if (!el) return;

  if (!q) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">❓</div><p>لا يوجد سؤال اليوم</p>
      <button class="btn btn-primary mt-2" onclick="openAddQuestion()">➕ إضافة سؤال</button></div>`;
    document.getElementById('answers-section').style.display = 'none';
    return;
  }

  el.innerHTML = `
    <div class="card mb-2">
      <div class="flex-between flex-wrap gap-sm mb-1">
        <div class="fw-bold">${escHtml(q.question_text)}</div>
        <div class="flex gap-sm">
          ${q.is_open
            ? '<span class="badge badge-green">مفتوح</span>'
            : '<span class="badge badge-red">مغلق</span>'}
          <button class="btn btn-yellow btn-xs" onclick="openEditQuestion()">✏️ تعديل</button>
          <button class="btn ${q.is_open?'btn-red':'btn-green'} btn-xs"
            onclick="toggleQuestion(${!q.is_open})">
            ${q.is_open?'🔒 إغلاق':'🔓 فتح'}</button>
        </div>
      </div>
      <div class="text-xs text-muted">
        ${escHtml(q.target_grade||'الكل')} — ${escHtml(q.target_edu_system||'')} — ${escHtml(q.target_track||'')}
      </div>
    </div>`;

  document.getElementById('answers-section').style.display = '';
  await loadAnswers(q.id);
}

async function loadAnswers(questionId) {
  const db = getDB(); if (!db) return;
  const el = document.getElementById('answers-list');
  if (!el) return;
  el.innerHTML = '<div class="spinner" style="margin:2rem auto"></div>';

  const { data } = await db.from('doctor_answers').select('*, students(name)').eq('question_id', questionId).order('created_at');
  const answers  = data || [];
  el.innerHTML = answers.length
    ? answers.map(a => `
      <div class="answer-card ${a.is_featured?'featured':''} ${a.is_hidden?'hidden-ans':''}" id="ans-${a.id}">
        <div class="ans-meta">
          <span>${a.show_name ? escHtml(a.students?.name||'—') : 'مجهول'}</span>
          <span>${fmtDatetime(a.created_at)}</span>
          ${a.is_featured ? '<span class="badge badge-yellow">⭐ مميز</span>' : ''}
          ${a.is_hidden   ? '<span class="badge badge-gray">مخفي</span>'    : ''}
          ${a.admin_reaction ? `<span class="badge badge-purple">${escHtml(a.admin_reaction)}</span>` : ''}
        </div>
        <div class="ans-text">${escHtml(a.answer_text)}</div>
        <div class="ans-actions">
          <button class="btn btn-yellow btn-xs" onclick="featureAnswer('${a.id}',${!a.is_featured})">
            ${a.is_featured?'⬇ إلغاء تمييز':'⭐ تمييز'}</button>
          <button class="btn btn-ghost btn-xs" onclick="hideAnswer('${a.id}',${!a.is_hidden})">
            ${a.is_hidden?'👁 إظهار':'🙈 إخفاء'}</button>
          <select onchange="setDisplayMode('${a.id}',this.value)" style="width:auto;padding:.2rem .5rem;font-size:.75rem">
            <option value="student_choice" ${a.admin_display_mode==='student_choice'?'selected':''}>اختيار الطالب</option>
            <option value="show_name"      ${a.admin_display_mode==='show_name'?'selected':''}>عرض الاسم</option>
            <option value="anonymous"      ${a.admin_display_mode==='anonymous'?'selected':''}>مجهول</option>
          </select>
          <input type="text" placeholder="ردّ فعل الأدمن" value="${escHtml(a.admin_reaction||'')}"
            style="width:140px;padding:.25rem .5rem;font-size:.75rem"
            onchange="setReaction('${a.id}',this.value)">
        </div>
      </div>`).join('')
    : '<div class="empty-state"><div class="empty-icon">💬</div><p>لا توجد إجابات بعد</p></div>';
}

function setupQuestionForm() {
  document.getElementById('question-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const id   = form.dataset.questionId;
    const payload = {
      question_text:    form.querySelector('[name=question_text]').value.trim(),
      target_grade:     form.querySelector('[name=target_grade]').value.trim()||null,
      target_edu_system:form.querySelector('[name=target_edu_system]').value.trim()||null,
      target_track:     form.querySelector('[name=target_track]').value.trim()||null,
      updated_at:       new Date().toISOString(),
    };
    if (id) {
      const ok = await safeUpdate('doctor_questions', { id }, payload);
      if (ok) { showToast('تم تعديل السؤال ✅', 'success'); closeModal('question-form-modal'); loadTodayQuestion(); }
    } else {
      payload.question_date = new Date().toISOString().slice(0,10);
      payload.is_open       = true;
      payload.created_at    = new Date().toISOString();
      const res = await safeInsert('doctor_questions', payload);
      if (res) { showToast('تمت إضافة السؤال ✅', 'success'); closeModal('question-form-modal'); loadTodayQuestion(); }
    }
  });
}

window.openAddQuestion = function() {
  const form = document.getElementById('question-form');
  if (!form) return;
  form.reset(); delete form.dataset.questionId;
  document.getElementById('question-modal-title').textContent = 'إضافة سؤال';
  openModal('question-form-modal');
};

window.openEditQuestion = function() {
  if (!_currentQuestion) return;
  const form = document.getElementById('question-form');
  if (!form) return;
  form.dataset.questionId = _currentQuestion.id;
  document.getElementById('question-modal-title').textContent = 'تعديل السؤال';
  form.querySelector('[name=question_text]').value     = _currentQuestion.question_text||'';
  form.querySelector('[name=target_grade]').value      = _currentQuestion.target_grade||'';
  form.querySelector('[name=target_edu_system]').value = _currentQuestion.target_edu_system||'';
  form.querySelector('[name=target_track]').value      = _currentQuestion.target_track||'';
  openModal('question-form-modal');
};

window.toggleQuestion = async function(newOpen) {
  if (!_currentQuestion) return;
  const ok = await safeUpdate('doctor_questions', { id: _currentQuestion.id }, { is_open: newOpen });
  if (ok) { showToast(newOpen?'تم فتح السؤال 🔓':'تم إغلاق السؤال 🔒', newOpen?'success':'warn'); loadTodayQuestion(); }
};

window.featureAnswer = async function(id, featured) {
  const ok = await safeUpdate('doctor_answers', { id }, { is_featured: featured });
  if (ok) { showToast(featured?'تم التمييز ⭐':'تم إلغاء التمييز', featured?'success':'info'); if (_currentQuestion) loadAnswers(_currentQuestion.id); }
};

window.hideAnswer = async function(id, hidden) {
  const ok = await safeUpdate('doctor_answers', { id }, { is_hidden: hidden });
  if (ok) { showToast(hidden?'تم الإخفاء 🙈':'تم الإظهار 👁', 'info'); if (_currentQuestion) loadAnswers(_currentQuestion.id); }
};

window.setDisplayMode = async function(id, mode) {
  await safeUpdate('doctor_answers', { id }, { admin_display_mode: mode });
};

window.setReaction = async function(id, reaction) {
  await safeUpdate('doctor_answers', { id }, { admin_reaction: reaction });
};

/* ══════════════════════════════════════════════
   INIT: SEASONS
══════════════════════════════════════════════ */
async function initMahmoudSeasons() {
  renderNav();
  setupModal('new-season-modal');
  await loadSeasons();
  await loadSeasonArchives();
  setupNewSeasonForm();
}

async function loadSeasons() {
  const db = getDB(); if (!db) return;
  const { data } = await db.from('seasons').select('*').order('created_at', { ascending:false });
  const el = document.getElementById('seasons-list');
  if (!el) return;
  const seasons = data || [];
  el.innerHTML = seasons.length
    ? seasons.map(s => `
      <div class="season-card ${s.is_active?'active-season':''}">
        <div class="season-info">
          <div class="season-name">${escHtml(s.name)}</div>
          <div class="season-dates">من ${fmtDate(s.starts_at)} — إلى ${fmtDate(s.ends_at)||'مفتوح'}</div>
          ${s.archived_at ? `<div class="text-xs text-muted mt-1">أُرشف: ${fmtDate(s.archived_at)}</div>`:''}
        </div>
        <div class="flex flex-wrap gap-sm">
          ${s.is_active ? '<span class="badge badge-green">نشط</span>' : '<span class="badge badge-gray">منتهي</span>'}
          ${s.is_active ? `<button class="btn btn-yellow btn-sm" onclick="archiveSeason('${s.id}','${escHtml(s.name)}')">📦 أرشفة</button>` : ''}
        </div>
      </div>`).join('')
    : '<div class="empty-state"><div class="empty-icon">🏆</div><p>لا توجد مواسم</p></div>';
}

async function loadSeasonArchives() {
  const db = getDB(); if (!db) return;
  const { data } = await db.from('season_archives').select('*').order('created_at', { ascending:false });
  const el = document.getElementById('archives-list');
  if (!el) return;
  const archives = data || [];
  el.innerHTML = archives.length
    ? `<div class="table-wrap"><table>
        <thead><tr><th>الموسم</th><th>بواسطة</th><th>تاريخ الأرشفة</th><th></th></tr></thead>
        <tbody>${archives.map(a => `<tr>
          <td>${escHtml(a.season_name)}</td>
          <td>${escHtml(a.created_by||'—')}</td>
          <td>${fmtDatetime(a.created_at)}</td>
          <td><button class="btn btn-ghost btn-xs" onclick="viewArchive('${a.id}')">👁 عرض</button></td>
        </tr>`).join('')}</tbody>
      </table></div>`
    : '<div class="empty-state"><p class="text-muted">لا توجد أرشيفات</p></div>';
}

function setupNewSeasonForm() {
  document.getElementById('new-season-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form  = e.target;
    const name  = form.querySelector('[name=season_name]').value.trim();
    const start = form.querySelector('[name=starts_at]').value;
    if (!name) { showToast('أدخل اسم الموسم', 'error'); return; }

    const db = getDB(); if (!db) return;
    // deactivate all other
    await db.from('seasons').update({ is_active:false, updated_at: new Date().toISOString() }).eq('is_active', true);
    const res = await safeInsert('seasons', {
      name, starts_at: start || new Date().toISOString(),
      is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    });
    if (res) {
      await logAction({ action_type:'new_season', note:name });
      showToast('تم إنشاء الموسم ✅', 'success');
      closeModal('new-season-modal');
      loadSeasons();
    }
  });
}

window.archiveSeason = async function(id, name) {
  if (!confirm(`أرشفة الموسم "${name}"؟`)) return;
  const db = getDB(); if (!db) return;
  const { data: students } = await db.from('students').select('id,name,score,xp,level');
  const archiveData = { students: students||[], archived_at: new Date().toISOString() };
  await db.from('season_archives').insert({ season_id:id, season_name:name, archive_data:archiveData, created_by:ADMIN_ACTOR, created_at:new Date().toISOString() });
  await safeUpdate('seasons', { id }, { is_active:false, archived_at: new Date().toISOString() });
  await logAction({ action_type:'archive_season', note:name });
  showToast('تم أرشفة الموسم 📦', 'success');
  loadSeasons(); loadSeasonArchives();
};

window.viewArchive = async function(id) {
  const db = getDB(); if (!db) return;
  const { data: a } = await db.from('season_archives').select('*').eq('id', id).single();
  if (!a) return;
  const students = a.archive_data?.students || [];
  alert(`أرشيف: ${a.season_name}\nعدد الطلاب: ${students.length}\nتاريخ: ${fmtDatetime(a.created_at)}`);
};

/* ══════════════════════════════════════════════
   INIT: DOCTORS
══════════════════════════════════════════════ */
let _doctors = [];

async function initMahmoudDoctors() {
  renderNav();
  setupModal('doctor-form-modal');
  setupTabs('#doctors-page');
  await loadDoctorGroups();
  await loadChangeRequests();
  setupDoctorForm();
}

async function loadDoctorGroups() {
  const db = getDB(); if (!db) return;
  const { data } = await db.from('doctor_groups').select('*').order('sort_order');
  _doctors = data || [];

  // get student counts
  const { data: studs } = await db.from('students').select('doctor_group').eq('is_active', true);
  const counts = {};
  (studs||[]).forEach(s => { if(s.doctor_group) counts[s.doctor_group] = (counts[s.doctor_group]||0)+1; });

  const el = document.getElementById('doctor-groups-grid');
  if (!el) return;
  el.innerHTML = _doctors.length
    ? _doctors.map(d => `
      <div class="doctor-card">
        <div class="dc-header">
          <div class="dc-name">${escHtml(d.display_name||d.name)}</div>
          ${d.is_active ? '<span class="badge badge-green">فعّال</span>' : '<span class="badge badge-gray">غير فعّال</span>'}
        </div>
        <div class="dc-code">كود: ${escHtml(d.login_code||'—')}</div>
        <div class="dc-stats">
          ${counts[d.name]||0} طالب |
          ${d.role==='doctor'?'دكتور':'باقة'} |
          ${d.is_student_selectable?'قابل للاختيار':'غير قابل'}
        </div>
        <div class="dc-actions">
          <button class="btn btn-ghost btn-xs" onclick="openEditDoctor('${d.id}')">✏️ تعديل</button>
          <button class="btn ${d.is_active?'btn-red':'btn-green'} btn-xs"
            onclick="toggleDoctorActive('${d.id}',${!d.is_active},'${escHtml(d.name)}')">
            ${d.is_active?'🚫 تعطيل':'✅ تفعيل'}</button>
        </div>
      </div>`).join('')
    : '<div class="empty-state col-span-3"><div class="empty-icon">👨‍⚕️</div><p>لا يوجد دكاترة</p></div>';
}

async function loadChangeRequests() {
  const db = getDB(); if (!db) return;
  const tbody = document.getElementById('change-requests-tbody');
  if (!tbody) return;
  tbody.innerHTML = loadingRow(6);

  const { data, error } = await db.from('doctor_change_requests')
    .select('*, students(name)')
    .order('created_at', { ascending:false })
    .limit(100);

  if (error) { tbody.innerHTML = emptyRow(6, error.message); return; }
  const rows = data || [];
  if (!rows.length) { tbody.innerHTML = emptyRow(6, 'لا توجد طلبات'); return; }

  tbody.innerHTML = rows.map(r => `<tr>
    <td>${escHtml(r.students?.name||'—')}</td>
    <td>${escHtml(r.old_doctor||'—')}</td>
    <td>${escHtml(r.new_doctor||'—')}</td>
    <td>${statusBadge(r.status)}</td>
    <td>${fmtDate(r.created_at)}</td>
    <td>
      ${r.status==='pending' ? `
      <div class="action-group">
        <button class="btn btn-green btn-xs" onclick="approveChangeRequest('${r.id}','${r.student_id}','${escHtml(r.new_doctor)}')">✅ موافقة</button>
        <button class="btn btn-red btn-xs"   onclick="rejectChangeRequest('${r.id}')">❌ رفض</button>
      </div>` : statusBadge(r.status)}
    </td>
  </tr>`).join('');
}

function setupDoctorForm() {
  document.getElementById('doctor-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const id   = form.dataset.doctorId;
    const payload = {
      name:                 form.querySelector('[name=name]').value.trim(),
      display_name:         form.querySelector('[name=display_name]').value.trim()||null,
      login_code:           form.querySelector('[name=login_code]').value.trim()||null,
      role:                 form.querySelector('[name=role]').value,
      is_student_selectable:form.querySelector('[name=is_student_selectable]').checked,
      sort_order:           parseInt(form.querySelector('[name=sort_order]').value)||0,
      updated_at:           new Date().toISOString(),
    };
    if (id) {
      const ok = await safeUpdate('doctor_groups', { id }, payload);
      if (ok) { showToast('تم التعديل ✅', 'success'); closeModal('doctor-form-modal'); loadDoctorGroups(); }
    } else {
      payload.is_active  = true;
      payload.created_at = new Date().toISOString();
      const res = await safeInsert('doctor_groups', payload);
      if (res) { showToast('تمت الإضافة ✅', 'success'); closeModal('doctor-form-modal'); loadDoctorGroups(); }
    }
  });
}

window.openAddDoctor = function() {
  const form = document.getElementById('doctor-form');
  if (!form) return;
  form.reset(); delete form.dataset.doctorId;
  document.getElementById('doctor-modal-title').textContent = 'إضافة دكتور / باقة';
  openModal('doctor-form-modal');
};

window.openEditDoctor = function(id) {
  const d = _doctors.find(x => x.id === id);
  if (!d) return;
  const form = document.getElementById('doctor-form');
  if (!form) return;
  form.dataset.doctorId = id;
  document.getElementById('doctor-modal-title').textContent = 'تعديل دكتور / باقة';
  form.querySelector('[name=name]').value          = d.name||'';
  form.querySelector('[name=display_name]').value  = d.display_name||'';
  form.querySelector('[name=login_code]').value    = d.login_code||'';
  form.querySelector('[name=role]').value          = d.role||'doctor';
  form.querySelector('[name=is_student_selectable]').checked = d.is_student_selectable;
  form.querySelector('[name=sort_order]').value    = d.sort_order||0;
  openModal('doctor-form-modal');
};

window.toggleDoctorActive = async function(id, active, name) {
  const ok = await safeUpdate('doctor_groups', { id }, { is_active: active });
  if (ok) {
    showToast(active?'تم التفعيل ✅':'تم التعطيل 🚫', active?'success':'warn');
    loadDoctorGroups();
  }
};

window.approveChangeRequest = async function(reqId, studentId, newDoctor) {
  const db = getDB(); if (!db) return;
  const { data: s } = await db.from('students').select('doctor_group').eq('id', studentId).single();
  const oldDoctor = s?.doctor_group;
  const ok1 = await safeUpdate('students', { id: studentId }, { doctor_group: newDoctor });
  const ok2 = await safeUpdate('doctor_change_requests', { id: reqId }, { status:'approved', reviewed_at: new Date().toISOString() });
  if (ok1 && ok2) {
    await logAction({ table:'doctor_action_logs', action_type:'doctor_change_approved', student_id:studentId, old_value:oldDoctor, new_value:newDoctor });
    showToast('تمت الموافقة ✅', 'success');
    loadChangeRequests();
  }
};

window.rejectChangeRequest = async function(reqId) {
  const ok = await safeUpdate('doctor_change_requests', { id: reqId }, { status:'rejected', reviewed_at: new Date().toISOString() });
  if (ok) {
    await logAction({ table:'doctor_action_logs', action_type:'doctor_change_rejected', note:`req ${reqId}` });
    showToast('تم الرفض ❌', 'warn');
    loadChangeRequests();
  }
};

/* ══════════════════════════════════════════════
   INIT: LOGS
══════════════════════════════════════════════ */
async function initMahmoudLogs() {
  renderNav();
  setupTabs('#logs-page');
  await loadStudentLogs();
  await loadDoctorLogs();
  await loadPointLogs();
  setupLogFilters();
}

async function loadStudentLogs(filters = {}) {
  const db = getDB(); if (!db) return;
  const tbody = document.getElementById('student-logs-tbody');
  if (!tbody) return;
  tbody.innerHTML = loadingRow(8);

  let q = db.from('student_logs').select('*').order('created_at', { ascending:false }).limit(300);
  if (filters.actor)      q = q.ilike('actor', `%${filters.actor}%`);
  if (filters.action)     q = q.ilike('action_type', `%${filters.action}%`);
  if (filters.student_id) q = q.eq('student_id', filters.student_id);
  if (filters.date)       q = q.gte('created_at', filters.date+'T00:00:00').lte('created_at', filters.date+'T23:59:59');

  const { data, error } = await q;
  if (error) { tbody.innerHTML = emptyRow(8, error.message); return; }
  const logs = data || [];
  tbody.innerHTML = logs.length
    ? logs.map(l => `<tr>
        <td>${escHtml(l.actor||'—')}</td>
        <td>${escHtml(l.role||'—')}</td>
        <td><span class="badge badge-purple">${escHtml(l.action_type||'—')}</span></td>
        <td class="td-mono text-xs">${escHtml(l.student_id?.slice(0,8)||'—')}</td>
        <td class="td-mono text-xs">${escHtml(l.old_value||'—')}</td>
        <td class="td-mono text-xs">${escHtml(l.new_value||'—')}</td>
        <td>${escHtml(l.note||'—')}</td>
        <td>${fmtDatetime(l.created_at)}</td>
      </tr>`).join('')
    : emptyRow(8, 'لا سجلات');
}

async function loadDoctorLogs(filters = {}) {
  const db = getDB(); if (!db) return;
  const tbody = document.getElementById('doctor-logs-tbody');
  if (!tbody) return;
  tbody.innerHTML = loadingRow(7);

  const { data, error } = await db.from('doctor_action_logs').select('*').order('created_at', { ascending:false }).limit(200);
  if (error) { tbody.innerHTML = emptyRow(7, error.message); return; }
  const logs = data || [];
  tbody.innerHTML = logs.length
    ? logs.map(l => `<tr>
        <td>${escHtml(l.actor||'—')}</td>
        <td>${escHtml(l.role||'—')}</td>
        <td><span class="badge badge-teal">${escHtml(l.action_type||'—')}</span></td>
        <td class="td-mono text-xs">${escHtml(l.student_id?.slice(0,8)||'—')}</td>
        <td class="td-mono text-xs">${escHtml(l.old_value||'—')}</td>
        <td class="td-mono text-xs">${escHtml(l.new_value||'—')}</td>
        <td>${fmtDatetime(l.created_at)}</td>
      </tr>`).join('')
    : emptyRow(7, 'لا سجلات');
}

async function loadPointLogs(filters = {}) {
  const db = getDB(); if (!db) return;
  const tbody = document.getElementById('point-logs-tbody');
  if (!tbody) return;
  tbody.innerHTML = loadingRow(4);

  const { data, error } = await db.from('admin_point_logs').select('*, students(name)').order('created_at', { ascending:false }).limit(200);
  if (error) { tbody.innerHTML = emptyRow(4, error.message); return; }
  const logs = data || [];
  tbody.innerHTML = logs.length
    ? logs.map(l => `<tr>
        <td>${escHtml(l.students?.name||l.student_id?.slice(0,8)||'—')}</td>
        <td class="td-mono ${l.points>0?'text-green':'text-red'}">${l.points>0?'+':''}${l.points}</td>
        <td>${escHtml(l.reason||'—')}</td>
        <td>${fmtDatetime(l.created_at)}</td>
      </tr>`).join('')
    : emptyRow(4, 'لا سجلات');
}

function setupLogFilters() {
  document.getElementById('log-filter-btn')?.addEventListener('click', () => {
    const date   = document.getElementById('lfilter-date')?.value;
    const action = document.getElementById('lfilter-action')?.value;
    const actor  = document.getElementById('lfilter-actor')?.value;
    loadStudentLogs({ date, action, actor });
  });
}

/* ══════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // render login gate if present
  renderLoginGate();

  // add logout button handler
  document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
    if (confirm('تسجيل خروج؟')) revokeAccess();
  });
});
