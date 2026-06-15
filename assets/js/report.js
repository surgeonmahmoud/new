/* ===== REPORT.JS — دوري المذاكراوية ===== */

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
    container.innerHTML = emptyHtml('لم تضف إنجازات بعد');
    qs('#submitReportBtn').disabled = true;
    return;
  }
  qs('#submitReportBtn').disabled = false;
  container.innerHTML = pendingAchievements.map((a, i) => `
    <div class="achievement-card">
      <div class="ach-info">
        <span class="ach-subject">${safeText(a.subject)}</span>
        <span class="ach-type">${safeText(a.activity_type)}</span>
        ${a.amount ? `<span class="ach-amount">الكمية: ${a.amount}</span>` : ''}
        ${a.study_hours ? `<span class="ach-hours">⏱ ${a.study_hours} ساعة</span>` : ''}
        ${a.notes ? `<p class="ach-notes">${safeText(a.notes)}</p>` : ''}
      </div>
      <div class="ach-actions">
        <button class="btn-icon" onclick="removeAchievement(${i})">🗑</button>
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
    showAlert('achAlert', 'اختر المادة ونوع النشاط');
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
  showToast('تمت إضافة الإنجاز', 'success');
}

async function submitReport() {
  const student = getCurrentStudent();
  if (!student) return;
  if (!pendingAchievements.length) {
    showToast('أضف إنجاز الأول', 'error');
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
    showToast('عندك تقرير مُرسَل اليوم بالفعل', 'error');
    return;
  }

  const btn = qs('#submitReportBtn');
  btn.disabled = true;
  btn.textContent = 'جاري الإرسال…';

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
      await addXpTransaction(student.id, 'daily_report', totalPoints * 2, 'تقرير يومي', null);
    }

    pendingAchievements = [];
    renderAchievements();
    showToast(status === 'approved' ? '✅ تم إرسال التقرير وتمت الموافقة!' : '⏳ التقرير مُرسَل وبينتظر المراجعة', 'success', 5000);
  } catch (err) {
    showToast('خطأ: ' + (err.message || 'unknown'), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'إرسال التقرير';
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
      banner.innerHTML = `<div class="alert alert-info">📋 أرسلت تقرير اليوم — الحالة: <strong>${data.status}</strong> | ${data.total_points} نقطة</div>`;
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
