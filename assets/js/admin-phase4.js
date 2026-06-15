// =========================================================
// Mahmoud Admin Phase 4 Patch
// Settings + Student Edit Dropdown Helpers + Subjects Config
// دوري المذاكراوية
// =========================================================
(function () {
  'use strict';

  const DEFAULT_CONTROL = {
    mahmoud: '2026',
    ziad: '9090',
    max_attempts: 5,
    lock_minutes: 10
  };

  const DEFAULT_SUPPORT = {
    url: 'https://t.me/Mahmoud_M_Hassan101BOT'
  };

  const GRADES = [
    'السادس الابتدائي',
    'الأول الإعدادي',
    'الثاني الإعدادي',
    'الثالث الإعدادي',
    'الأول الثانوي',
    'الثاني الثانوي',
    'الثالث الثانوي'
  ];

  const LANG_SYSTEMS = ['عربي', 'لغات'];
  const SECONDARY_SYSTEMS = ['ثانوي عام', 'ثانوي بكالوريا', 'ثانوي أزهري', 'STEM', 'أخرى'];
  const BASIC_TRACKS = ['عربي', 'لغات'];
  const NO_TRACK = ['بدون مسار'];
  const GENERAL_2_TRACKS = ['علمي', 'أدبي'];
  const GENERAL_3_TRACKS = ['علمي علوم', 'علمي رياضة', 'أدبي'];
  const AZHAR_TRACKS = ['علمي', 'أدبي'];
  const BAC_TRACKS = ['مسار الطب وعلوم الحياة', 'مسار الهندسة وعلوم الحاسب', 'مسار الأعمال', 'مسار الآداب والفنون'];
  const STEM_TRACKS = ['STEM'];
  const STEM_3_TRACKS = ['علمي علوم', 'علمي رياضة'];

  const DOCTOR_FALLBACK = ['أفنان', 'ٳسراء', 'هاجر', 'أميرة', 'راما', 'منار', 'ماهيتاب', 'مي', 'آخر', 'باقة بيزك'];

  function db() { return window.supabaseClient || null; }
  function id(x) { return document.getElementById(x); }
  function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
  function toast(msg) { if (window.showToast) window.showToast(msg); else alert(msg); }

  function isPrimaryPrep(grade) {
    return grade === 'السادس الابتدائي' || String(grade || '').includes('الإعدادي');
  }

  function systemsForGrade(grade) {
    return isPrimaryPrep(grade) ? LANG_SYSTEMS : SECONDARY_SYSTEMS;
  }

  function tracksFor(grade, system) {
    if (isPrimaryPrep(grade)) return BASIC_TRACKS;
    if (grade === 'الأول الثانوي') {
      if (system === 'ثانوي أزهري') return AZHAR_TRACKS;
      if (system === 'STEM') return STEM_TRACKS;
      return NO_TRACK;
    }
    if (grade === 'الثاني الثانوي') {
      if (system === 'ثانوي بكالوريا') return BAC_TRACKS;
      if (system === 'ثانوي عام') return GENERAL_2_TRACKS;
      if (system === 'ثانوي أزهري') return AZHAR_TRACKS;
      if (system === 'STEM') return STEM_TRACKS;
      return NO_TRACK;
    }
    if (grade === 'الثالث الثانوي') {
      if (system === 'ثانوي بكالوريا') return BAC_TRACKS;
      if (system === 'ثانوي عام') return GENERAL_3_TRACKS;
      if (system === 'ثانوي أزهري') return AZHAR_TRACKS;
      if (system === 'STEM') return STEM_3_TRACKS;
      return NO_TRACK;
    }
    return NO_TRACK;
  }

  function setOptions(select, values, placeholder, selected) {
    if (!select) return;
    const old = selected ?? select.value;
    select.innerHTML = `<option value="">${esc(placeholder || 'اختر')}</option>` +
      Array.from(new Set(values || [])).map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
    if (old && Array.from(new Set(values || [])).includes(old)) select.value = old;
  }

  async function loadSetting(key, fallback) {
    const client = db();
    if (!client) return fallback;
    try {
      const { data, error } = await client.from('app_settings').select('value').eq('key', key).maybeSingle();
      if (error || !data) return fallback;
      const value = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      return { ...fallback, ...(value || {}) };
    } catch (_) {
      return fallback;
    }
  }

  async function saveSetting(key, value) {
    const client = db();
    if (!client) return false;
    const { error } = await client.from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    return !error;
  }

  async function initAdminSettingsPatch() {
    const box = id('mahmoud-settings-box');
    if (!box) return;
    const control = await loadSetting('control_codes', DEFAULT_CONTROL);
    const support = await loadSetting('support_link', DEFAULT_SUPPORT);
    id('set-code-mahmoud').value = control.mahmoud || DEFAULT_CONTROL.mahmoud;
    id('set-code-ziad').value = control.ziad || DEFAULT_CONTROL.ziad;
    id('set-max-attempts').value = control.max_attempts || DEFAULT_CONTROL.max_attempts;
    id('set-lock-minutes').value = control.lock_minutes || DEFAULT_CONTROL.lock_minutes;
    id('set-support-link').value = support.url || DEFAULT_SUPPORT.url;
  }

  async function saveMahmoudControlSettings() {
    const value = {
      mahmoud: (id('set-code-mahmoud').value || DEFAULT_CONTROL.mahmoud).trim(),
      ziad: (id('set-code-ziad').value || DEFAULT_CONTROL.ziad).trim(),
      max_attempts: Number(id('set-max-attempts').value || DEFAULT_CONTROL.max_attempts),
      lock_minutes: Number(id('set-lock-minutes').value || DEFAULT_CONTROL.lock_minutes)
    };
    const ok = await saveSetting('control_codes', value);
    toast(ok ? 'تم حفظ رموز الدخول' : 'تعذر حفظ رموز الدخول');
  }

  async function saveMahmoudSupportLink() {
    const url = (id('set-support-link').value || DEFAULT_SUPPORT.url).trim();
    const ok = await saveSetting('support_link', { url });
    toast(ok ? 'تم حفظ رابط الدعم' : 'تعذر حفظ رابط الدعم');
  }

  async function loadDoctorOptions(selected) {
    const client = db();
    let doctors = DOCTOR_FALLBACK.map(name => ({ value: name, label: name }));
    if (client) {
      try {
        const { data } = await client.from('doctor_groups').select('name, display_name').eq('is_active', true).order('sort_order', { ascending: true });
        if (data && data.length) doctors = data.map(d => ({ value: d.name, label: d.display_name || d.name }));
      } catch (_) {}
    }
    return doctors;
  }

  async function enhanceStudentEditModal() {
    const grade = id('edit-grade_level') || id('edit-grade') || id('editGrade');
    const system = id('edit-edu_system') || id('edit-system') || id('editSystem');
    const track = id('edit-track') || id('editTrack');
    const doctor = id('edit-doctor_group') || id('edit-doctor') || id('editDoctor');

    if (!grade && !system && !track && !doctor) return;

    function replaceWithSelect(el, newId) {
      if (!el) return null;
      if (el.tagName === 'SELECT') return el;
      const s = document.createElement('select');
      s.id = el.id || newId;
      s.name = el.name || newId;
      s.className = el.className || 'form-select';
      if (!s.className.includes('form-select')) s.className += ' form-select';
      s.dataset.oldValue = el.value || '';
      el.replaceWith(s);
      return s;
    }

    const g = replaceWithSelect(grade, 'edit-grade_level');
    const sys = replaceWithSelect(system, 'edit-edu_system');
    const tr = replaceWithSelect(track, 'edit-track');
    const doc = replaceWithSelect(doctor, 'edit-doctor_group');

    function updateSystems() {
      const selectedSystem = sys?.dataset.oldValue || sys?.value || '';
      setOptions(sys, systemsForGrade(g?.value), 'اختر النظام', selectedSystem);
      if (sys) sys.dataset.oldValue = '';
      updateTracks();
    }

    function updateTracks() {
      const selectedTrack = tr?.dataset.oldValue || tr?.value || '';
      setOptions(tr, tracksFor(g?.value, sys?.value), 'اختر المسار / الشعبة', selectedTrack);
      if (tr) tr.dataset.oldValue = '';
    }

    setOptions(g, GRADES, 'اختر الصف', g?.dataset.oldValue || g?.value);
    if (g) g.dataset.oldValue = '';
    updateSystems();

    if (g) g.addEventListener('change', updateSystems);
    if (sys) sys.addEventListener('change', updateTracks);

    if (doc) {
      const doctors = await loadDoctorOptions(doc.dataset.oldValue || doc.value);
      setOptions(doc, doctors.map(d => d.value), 'اختر الدكتورة / الباقة', doc.dataset.oldValue || doc.value);
      // Replace labels with display labels
      Array.from(doc.options).forEach(opt => {
        const match = doctors.find(d => d.value === opt.value);
        if (match) opt.textContent = match.label;
      });
      doc.dataset.oldValue = '';
    }
  }

  function initFilterDropdowns() {
    const gradeFilters = ['filter-grade', 'filterGrade', 'students-filter-grade'];
    const systemFilters = ['filter-system', 'filterSystem', 'students-filter-system'];
    const trackFilters = ['filter-track', 'filterTrack', 'students-filter-track'];
    gradeFilters.forEach(fid => { const el = id(fid); if (el) setOptions(el, GRADES, 'كل الصفوف'); });
    systemFilters.forEach(fid => { const el = id(fid); if (el) setOptions(el, [...LANG_SYSTEMS, ...SECONDARY_SYSTEMS], 'كل الأنظمة'); });
    trackFilters.forEach(fid => { const el = id(fid); if (el) setOptions(el, [...BASIC_TRACKS, ...NO_TRACK, ...GENERAL_2_TRACKS, ...GENERAL_3_TRACKS, ...BAC_TRACKS, ...STEM_TRACKS], 'كل المسارات'); });
  }

  async function loadSubjectsConfig() {
    const tbody = id('subjects-config-body');
    if (!tbody) return;
    const client = db();
    if (!client) { tbody.innerHTML = '<tr><td colspan="6">تعذر الاتصال بقاعدة البيانات</td></tr>'; return; }
    const { data, error } = await client.from('subjects_config').select('*').order('sort_order', { ascending: true });
    if (error) { tbody.innerHTML = '<tr><td colspan="6">تعذر تحميل المواد</td></tr>'; return; }
    if (!data || !data.length) { tbody.innerHTML = '<tr><td colspan="6">لا توجد مواد مضافة</td></tr>'; return; }
    tbody.innerHTML = data.map(row => `
      <tr>
        <td>${esc(row.name)}</td>
        <td>${esc(row.grade_level)}</td>
        <td>${esc(row.edu_system)}</td>
        <td>${esc(row.track || '')}</td>
        <td>${esc(row.sort_order || 0)}</td>
        <td><button class="btn btn-sm ${row.is_active ? 'btn-warning' : 'btn-success'}" onclick="toggleSubjectConfig('${row.id}', ${!row.is_active})">${row.is_active ? 'إيقاف' : 'تفعيل'}</button></td>
      </tr>`).join('');
  }

  async function addSubjectConfig() {
    const client = db();
    if (!client) return toast('تعذر الاتصال بقاعدة البيانات');
    const payload = {
      name: (id('subject-name').value || '').trim(),
      grade_level: id('subject-grade').value || null,
      edu_system: id('subject-system').value || null,
      track: id('subject-track').value || null,
      sort_order: Number(id('subject-sort').value || 0),
      is_active: true,
      updated_at: new Date().toISOString()
    };
    if (!payload.name) return toast('اكتب اسم المادة');
    const { error } = await client.from('subjects_config').insert(payload);
    if (error) return toast('تعذر إضافة المادة');
    toast('تمت إضافة المادة');
    id('subject-name').value = '';
    loadSubjectsConfig();
  }

  async function toggleSubjectConfig(subjectId, active) {
    const client = db();
    if (!client) return;
    const { error } = await client.from('subjects_config').update({ is_active: active, updated_at: new Date().toISOString() }).eq('id', subjectId);
    if (error) return toast('تعذر تحديث المادة');
    loadSubjectsConfig();
  }

  function initSubjectsForm() {
    const g = id('subject-grade');
    const sys = id('subject-system');
    const tr = id('subject-track');
    if (!g || !sys || !tr) return;
    setOptions(g, GRADES, 'اختر الصف');
    function updateSys() { setOptions(sys, systemsForGrade(g.value), 'اختر النظام'); updateTrack(); }
    function updateTrack() { setOptions(tr, tracksFor(g.value, sys.value), 'اختر المسار'); }
    g.addEventListener('change', updateSys);
    sys.addEventListener('change', updateTrack);
    updateSys();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initAdminSettingsPatch();
    enhanceStudentEditModal();
    initFilterDropdowns();
    initSubjectsForm();
    loadSubjectsConfig();
  });

  window.saveMahmoudControlSettings = saveMahmoudControlSettings;
  window.saveMahmoudSupportLink = saveMahmoudSupportLink;
  window.loadSubjectsConfig = loadSubjectsConfig;
  window.addSubjectConfig = addSubjectConfig;
  window.toggleSubjectConfig = toggleSubjectConfig;
  window.MahmoudAdminPhase4 = { GRADES, systemsForGrade, tracksFor };
})();
