/* ===== STUDENT.JS — دوري المذاكراوية ===== */

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
  setEl('metaTrack', student.track || '—');
  setEl('metaDoctor', student.doctor_group || '—');

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
  list.innerHTML = loadingHtml('جاري تحميل المجموعات…');
  try {
    const { data } = await db
      .from('doctor_groups')
      .select('id, name, display_name')
      .eq('is_active', true)
      .eq('is_student_selectable', true)
      .order('sort_order');
    if (!data || !data.length) { list.innerHTML = emptyHtml('مفيش مجموعات متاحة'); return; }
    list.innerHTML = '';
    data.forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'doctor-choice-btn';
      btn.textContent = g.display_name || g.name;
      btn.addEventListener('click', () => chooseDoctorGroup(g.name));
      list.appendChild(btn);
    });
  } catch (err) {
    list.innerHTML = emptyHtml('خطأ في التحميل');
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
    showToast('تم اختيار المجموعة ✅', 'success');
  } catch (err) {
    showToast('خطأ: ' + err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (qs('#studentHomePage')) loadStudentHome();
  initNavToggle();
});
