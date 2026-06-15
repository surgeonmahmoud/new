===== MOZAKRAWY BUNDLE 2: STUDENT REPORT XP =====



===== FILE: student.js =====

/* =============================================
   Student Module - Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©
   Home page logic, profile, doctor group modal
   ============================================= */

const db = window.supabaseClient;

/* â”€â”€ Init Home Page â”€â”€ */
async function initHomePage() {
  const student = requireAuth();
  if (!student) return;

  // Render basic info immediately
  renderStudentHeader(student);

  // Check if doctor_group is missing â†’ show modal
  if (!student.doctor_group && !student.doctor_selected_at) {
    await showDoctorModal(student);
  }

  // Load async data
  await Promise.all([
    loadHomeStats(student),
    loadXpBar(student),
    loadStreak(student),
  ]);
}

/* â”€â”€ Render header info â”€â”€ */
function renderStudentHeader(student) {
  setText('studentName',       student.name || 'â€”');
  setText('studentGrade',      gradeLabel(student.grade_level));
  setText('studentEdu',        eduLabel(student.edu_system));
  setText('studentTrack',      trackLabel(student.track));
  setText('studentDoctor',     student.doctor_group || 'Ù„Ù… ÙŠÙØ­Ø¯Ø¯');
}

/* â”€â”€ Load stats â”€â”€ */
async function loadHomeStats(student) {
  const sid = student.id;

  // XP & league points
  const xpData = await getStudentXpTotals(sid);

  // Try leaderboard view for totals
  let totalLeague = 0, totalQuestions = 0;
  try {
    const { data: lb } = await db
      .from('v_student_platform_totals')
      .select('*')
      .eq('student_id', sid)
      .single();
    if (lb) {
      totalLeague    = safeNum(lb.total_league_points || lb.league_points);
      totalQuestions = safeNum(lb.total_questions || lb.questions_count);
    }
  } catch (_) {}

  // Fallback to xp table
  if (!totalLeague) totalLeague = safeNum(xpData?.total_league_points);

  // Study hours from report_submissions / daily_reports
  let reportHours = 0;
  try {
    const { data: reports } = await db
      .from('daily_reports')
      .select('study_hours')
      .eq('student_id', sid);
    if (reports) reportHours = reports.reduce((s, r) => s + safeNum(r.study_hours), 0);
  } catch (_) {}

  // Operation Room hours from study_sessions
  let opHours = 0;
  try {
    const { data: sessions } = await db
      .from('study_sessions')
      .select('actual_duration')
      .eq('student_id', sid);
    if (sessions) {
      opHours = sessions.reduce((s, r) => s + safeNum(r.actual_duration), 0) / 60;
    }
  } catch (_) {}

  const totalHours = reportHours + opHours;

  // Render stats
  setText('statLeague',    totalLeague);
  setText('statQuestions', totalQuestions || 'â€”');
  setText('statReportHrs', reportHours.toFixed(1));
  setText('statOpHrs',     opHours.toFixed(1));
  setText('statTotalHrs',  totalHours.toFixed(1));
}

/* â”€â”€ XP bar â”€â”€ */
async function loadXpBar(student) {
  const xpData = await getStudentXpTotals(student.id);
  const totalXp = safeNum(xpData?.total_xp);
  const lvData  = getXpLevel(totalXp);

  setText('xpLevel',     lvData.level);
  setText('xpLevelName', getLevelName(lvData.level));
  setText('xpCurrent',   totalXp);
  setText('xpNext',      lvData.nextThresh);

  const fill = document.getElementById('xpFill');
  if (fill) fill.style.width = lvData.progress.toFixed(1) + '%';
}

/* â”€â”€ Streak â”€â”€ */
async function loadStreak(student) {
  try {
    const { data } = await db
      .from('report_submissions')
      .select('submission_date')
      .eq('student_id', student.id);

    const dates  = (data || []).map(r => r.submission_date).filter(Boolean);
    const streak = calcStreak(dates);

    const el = document.getElementById('streakBadge');
    if (!el) return;

    if (streak === 0) {
      el.innerHTML = `<span class="streak-icon">â„ï¸</span>
        <div><div class="streak-text">Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø³ØªØ±ÙŠÙƒ</div>
        <div class="streak-sub">Ø§Ø¨Ø¯Ø£ Ø¨ÙƒØ±Ø§!</div></div>`;
    } else {
      el.innerHTML = `<span class="streak-icon">ðŸ”¥</span>
        <div><div class="streak-text">${streak} ÙŠÙˆÙ… Ù…ØªØªØ§Ù„ÙŠ!</div>
        <div class="streak-sub">Ø§Ø³ØªÙ…Ø±!</div></div>`;
    }
  } catch (_) {}
}

/* â”€â”€ Doctor Group Modal â”€â”€ */
async function showDoctorModal(student) {
  const modal = document.getElementById('doctorModal');
  if (!modal) return;

  // Load doctor groups
  await loadDoctorGroupsSelect('doctorModalSelect');

  modal.classList.add('open');

  document.getElementById('doctorModalSkip')?.addEventListener('click', () => {
    modal.classList.remove('open');
  });

  document.getElementById('doctorModalSave')?.addEventListener('click', async () => {
    const sel   = document.getElementById('doctorModalSelect');
    const group = sel?.value;
    if (!group) {
      showAlert('doctorModalError', 'Ø§Ø®ØªØ± Ù…Ø¬Ù…ÙˆØ¹Ø© Ø£ÙˆÙ„Ø§Ù‹');
      return;
    }

    try {
      const { data, error } = await db
        .from('students')
        .update({
          doctor_group: group,
          doctor_selected_at: new Date().toISOString(),
        })
        .eq('id', student.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentStudent(data);
      modal.classList.remove('open');
      renderStudentHeader(data);
    } catch (err) {
      showAlert('doctorModalError', 'Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø­ÙØ¸: ' + (err.message || ''));
    }
  });
}

/* â”€â”€ Label helpers â”€â”€ */
function gradeLabel(g) {
  const map = { '1': 'Ø£ÙˆÙ„Ù‰ Ø«Ø§Ù†ÙˆÙŠ', '2': 'ØªØ§Ù†ÙŠØ© Ø«Ø§Ù†ÙˆÙŠ', '3': 'ØªØ§Ù„ØªØ© Ø«Ø§Ù†ÙˆÙŠ' };
  return map[String(g)] || g || 'â€”';
}

function eduLabel(e) {
  const map = { 'national': 'Ù†Ø¸Ø§Ù… ÙˆØ·Ù†ÙŠ', 'international': 'Ù†Ø¸Ø§Ù… Ø¯ÙˆÙ„ÙŠ', 'azhar': 'Ø£Ø²Ù‡Ø±' };
  return map[e] || e || 'â€”';
}

function trackLabel(t) {
  const map = { 'science': 'Ø¹Ù„Ù…ÙŠ', 'math': 'Ø±ÙŠØ§Ø¶ÙŠØ§Øª', 'literary': 'Ø£Ø¯Ø¨ÙŠ', 'science_math': 'Ø¹Ù„Ù…ÙŠ Ø±ÙŠØ§Ø¶ÙŠØ§Øª' };
  return map[t] || t || 'â€”';
}



===== FILE: report.js =====

/* =============================================
   Report Module - Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©
   Daily report submission logic
   ============================================= */

const db = window.supabaseClient;
let reportAchievements = [];
let existingSubmission = null;

/* â”€â”€ Init â”€â”€ */
async function initReportPage() {
  const student = requireAuth();
  if (!student) return;

  setText('reportStudentName', student.name || '');

  // Check if already submitted today
  await checkTodaySubmission(student);

  // Render achievement form
  renderAchievementRows();

  // Submit button
  document.getElementById('reportSubmitBtn')?.addEventListener('click', () => submitDailyReport(student));

  // Add achievement button
  document.getElementById('addAchievementBtn')?.addEventListener('click', addAchievementRow);
}

/* â”€â”€ Check today's submission â”€â”€ */
async function checkTodaySubmission(student) {
  const today = todayStr();
  const { data, error } = await db
    .from('report_submissions')
    .select('*')
    .eq('student_id', student.id)
    .eq('submission_date', today)
    .limit(1);

  if (error) {
    console.warn('report_submissions check failed:', error);
    return;
  }

  if (data && data.length > 0) {
    existingSubmission = data[0];
    showTodaySubmitted(existingSubmission);
  } else {
    showReportForm();
  }
}

/* â”€â”€ Show already submitted â”€â”€ */
function showTodaySubmitted(submission) {
  hideEl('reportFormSection');
  showEl('reportSubmittedSection');
  const statusBadge = getStatusBadge(submission.status);
  setHtml('submittedStatus', statusBadge);
  setText('submittedDate', formatDate(submission.submission_date));
}

function getStatusBadge(status) {
  if (status === 'approved')
    return '<span class="badge badge-green">âœ… Ù…ÙˆØ§ÙÙ‚ Ø¹Ù„ÙŠÙ‡</span>';
  if (status === 'pending')
    return '<span class="badge badge-orange">â³ Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©</span>';
  if (status === 'rejected')
    return '<span class="badge badge-red">âŒ Ù…Ø±ÙÙˆØ¶</span>';
  return `<span class="badge badge-cyan">${status || 'Ù…Ø¬Ù‡ÙˆÙ„'}</span>`;
}

/* â”€â”€ Show form â”€â”€ */
function showReportForm() {
  showEl('reportFormSection');
  hideEl('reportSubmittedSection');
  // Start with one achievement row
  reportAchievements = [newAchievement()];
  renderAchievementRows();
}

/* â”€â”€ Achievement row factory â”€â”€ */
let achId = 0;
function newAchievement() {
  return {
    id: ++achId,
    subject: '',
    study_hours: 0,
    activity_type: 'questions',
    amount: 0,
    notes: '',
  };
}

/* â”€â”€ Render achievement rows â”€â”€ */
function renderAchievementRows() {
  const container = document.getElementById('achievementsContainer');
  if (!container) return;

  container.innerHTML = '';
  reportAchievements.forEach((ach, idx) => {
    const div = document.createElement('div');
    div.className = 'task-card';
    div.innerHTML = `
      <div class="task-header">
        <span class="task-title">Ø¥Ù†Ø¬Ø§Ø² ${idx + 1}</span>
        ${reportAchievements.length > 1
          ? `<button class="btn btn-danger btn-sm" onclick="removeAchievement(${ach.id})">Ø­Ø°Ù</button>`
          : ''}
      </div>
      <div class="form-group">
        <label class="form-label">Ø§Ù„Ù…Ø§Ø¯Ø©</label>
        <input class="form-control" type="text" placeholder="Ù…Ø«Ù„Ø§Ù‹: Ø±ÙŠØ§Ø¶ÙŠØ§Øª"
          value="${ach.subject}"
          onchange="updateAchievement(${ach.id},'subject',this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Ù†ÙˆØ¹ Ø§Ù„Ù†Ø´Ø§Ø·</label>
        <select class="form-control" onchange="updateAchievement(${ach.id},'activity_type',this.value); updateAmountLabel(${ach.id})">
          <option value="questions"          ${ach.activity_type==='questions'?'selected':''}>Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©</option>
          <option value="lesson"             ${ach.activity_type==='lesson'?'selected':''}>Ø¯Ø±Ø³ Ø¹Ø§Ø¯ÙŠ</option>
          <option value="chapter"            ${ach.activity_type==='chapter'?'selected':''}>ÙØµÙ„ / Ø¨Ø§Ø¨</option>
          <option value="unit"               ${ach.activity_type==='unit'?'selected':''}>ÙˆØ­Ø¯Ø©</option>
          <option value="comprehensive_exam" ${ach.activity_type==='comprehensive_exam'?'selected':''}>Ø§Ù…ØªØ­Ø§Ù† Ø´Ø§Ù…Ù„</option>
          <option value="center_attendance"  ${ach.activity_type==='center_attendance'?'selected':''}>Ø­Ø¶ÙˆØ± Ø³Ù†ØªØ±</option>
          <option value="review_video"       ${ach.activity_type==='review_video'?'selected':''}>ÙÙŠØ¯ÙŠÙˆ Ù…Ø±Ø§Ø¬Ø¹Ø©</option>
        </select>
      </div>
      <div class="form-group" id="amountGroup_${ach.id}">
        <div class="range-wrapper">
          <div class="range-label-row">
            <label class="form-label" id="amountLabel_${ach.id}">${getAmountLabel(ach.activity_type)}</label>
            <span class="range-value" id="amountVal_${ach.id}">${ach.amount}</span>
          </div>
          <input type="range" min="0" max="${getAmountMax(ach.activity_type)}"
            value="${ach.amount}"
            id="amountRange_${ach.id}"
            oninput="updateAchievement(${ach.id},'amount',+this.value); setText('amountVal_${ach.id}',this.value)">
        </div>
      </div>
      <div class="form-group">
        <div class="range-wrapper">
          <div class="range-label-row">
            <label class="form-label">Ø³Ø§Ø¹Ø§Øª Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø©</label>
            <span class="range-value" id="hoursVal_${ach.id}">${ach.study_hours}</span>
          </div>
          <input type="range" min="0" max="12" step="0.5"
            value="${ach.study_hours}"
            oninput="updateAchievement(${ach.id},'study_hours',+this.value); setText('hoursVal_${ach.id}',this.value)">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Ù…Ù„Ø§Ø­Ø¸Ø§Øª (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)</label>
        <input class="form-control" type="text" placeholder="Ø£ÙŠ ØªÙØ§ØµÙŠÙ„ Ø¥Ø¶Ø§ÙÙŠØ©..."
          value="${ach.notes}"
          onchange="updateAchievement(${ach.id},'notes',this.value)">
      </div>
    `;
    container.appendChild(div);
  });
}

function getAmountLabel(type) {
  const labels = {
    questions: 'Ø¹Ø¯Ø¯ Ø§Ù„Ø£Ø³Ø¦Ù„Ø©',
    lesson: 'Ø¹Ø¯Ø¯ Ø§Ù„Ø¯Ø±ÙˆØ³',
    chapter: 'Ø¹Ø¯Ø¯ Ø§Ù„ÙØµÙˆÙ„',
    unit: 'Ø¹Ø¯Ø¯ Ø§Ù„ÙˆØ­Ø¯Ø§Øª',
    comprehensive_exam: 'Ø¹Ø¯Ø¯ Ø§Ù„Ø§Ù…ØªØ­Ø§Ù†Ø§Øª',
    center_attendance: 'Ø¹Ø¯Ø¯ Ø§Ù„Ø­ØµØµ',
    review_video: 'Ø¹Ø¯Ø¯ Ø§Ù„ÙÙŠØ¯ÙŠÙˆÙ‡Ø§Øª',
  };
  return labels[type] || 'Ø§Ù„ÙƒÙ…ÙŠØ©';
}

function getAmountMax(type) {
  const maxes = {
    questions: 200,
    lesson: 10,
    chapter: 5,
    unit: 5,
    comprehensive_exam: 3,
    center_attendance: 5,
    review_video: 10,
  };
  return maxes[type] || 20;
}

function updateAmountLabel(id) {
  const ach = reportAchievements.find(a => a.id === id);
  if (!ach) return;
  setText(`amountLabel_${id}`, getAmountLabel(ach.activity_type));
  const range = document.getElementById(`amountRange_${id}`);
  if (range) {
    range.max   = getAmountMax(ach.activity_type);
    range.value = 0;
    setText(`amountVal_${id}`, '0');
    ach.amount = 0;
  }
}

function updateAchievement(id, field, value) {
  const ach = reportAchievements.find(a => a.id === id);
  if (ach) ach[field] = value;
}

function addAchievementRow() {
  if (reportAchievements.length >= 6) {
    showAlert('reportAlert', 'Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ 6 Ø¥Ù†Ø¬Ø§Ø²Ø§Øª ÙÙŠ ØªÙ‚Ø±ÙŠØ± ÙˆØ§Ø­Ø¯', 'warn');
    return;
  }
  reportAchievements.push(newAchievement());
  renderAchievementRows();
}

function removeAchievement(id) {
  reportAchievements = reportAchievements.filter(a => a.id !== id);
  renderAchievementRows();
}

/* â”€â”€ Submit â”€â”€ */
async function submitDailyReport(student) {
  clearAlert('reportAlert');

  if (reportAchievements.length === 0) {
    showAlert('reportAlert', 'Ø£Ø¶Ù Ø¥Ù†Ø¬Ø§Ø² ÙˆØ§Ø­Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„', 'warn');
    return;
  }

  // Validate subjects
  const missingSub = reportAchievements.find(a => !a.subject.trim());
  if (missingSub) {
    showAlert('reportAlert', 'Ø§ÙƒØªØ¨ Ø§Ø³Ù… Ø§Ù„Ù…Ø§Ø¯Ø© Ù„ÙƒÙ„ Ø¥Ù†Ø¬Ø§Ø²', 'warn');
    return;
  }

  const btn = document.getElementById('reportSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„...'; }

  try {
    // Calculate total day points
    let totalPoints = 0;
    const rows = reportAchievements.map(ach => {
      const pts = calcReportPoints(ach.activity_type, ach.amount);
      totalPoints += pts;
      return {
        student_id:    student.id,
        subject:       ach.subject.trim(),
        study_hours:   ach.study_hours,
        activity_type: ach.activity_type,
        amount:        ach.amount,
        notes:         ach.notes?.trim() || null,
        report_date:   todayStr(),
        points:        pts,
        created_at:    new Date().toISOString(),
      };
    });

    // Determine status
    const status = totalPoints > 20 ? 'pending' : 'approved';

    // Create report_submission first
    const { data: submission, error: subErr } = await db
      .from('report_submissions')
      .insert([{
        student_id:      student.id,
        submission_date: todayStr(),
        total_points:    totalPoints,
        status,
        created_at:      new Date().toISOString(),
      }])
      .select()
      .single();

    if (subErr) throw subErr;

    // Insert daily_reports rows (with submission_id if column exists)
    const enrichedRows = rows.map(r => ({
      ...r,
      ...(submission?.id ? { submission_id: submission.id } : {}),
    }));

    const { error: repErr } = await db.from('daily_reports').insert(enrichedRows);
    if (repErr) throw repErr;

    // XP only if approved
    if (status === 'approved' && totalPoints > 0) {
      await addXpTransaction(student.id, totalPoints * 3, totalPoints, 'daily_report', submission.id);
    }

    showTodaySubmitted(submission);

  } catch (err) {
    showAlert('reportAlert', 'Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„: ' + (err.message || 'Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© ØªØ§Ù†ÙŠØ©'), 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªÙ‚Ø±ÙŠØ±'; }
  }
}



===== FILE: xp.js =====

/* =============================================
   XP Module - Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©
   XP & League Points logic
   ============================================= */

const db = window.supabaseClient;

/* â”€â”€ Add XP transaction â”€â”€ */
async function addXpTransaction(studentId, xpAmount, leaguePoints, source, sourceId = null) {
  if (!xpAmount && !leaguePoints) return;

  const insertObj = {
    student_id: studentId,
    xp_amount: xpAmount || 0,
    league_points: leaguePoints || 0,
    source,
    created_at: new Date().toISOString(),
  };
  if (sourceId) insertObj.source_id = sourceId;

  const { error } = await db.from('xp_transactions').insert([insertObj]);
  if (error) console.warn('XP transaction error:', error.message);

  // Also try to upsert student_xp totals
  try {
    const { data: existing } = await db
      .from('student_xp')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (existing) {
      await db.from('student_xp').update({
        total_xp:          (existing.total_xp || 0) + (xpAmount || 0),
        total_league_points: (existing.total_league_points || 0) + (leaguePoints || 0),
        updated_at: new Date().toISOString(),
      }).eq('student_id', studentId);
    } else {
      await db.from('student_xp').insert([{
        student_id: studentId,
        total_xp: xpAmount || 0,
        total_league_points: leaguePoints || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
    }
  } catch (e) {
    console.warn('student_xp upsert failed:', e);
  }
}

/* â”€â”€ Get student XP totals â”€â”€ */
async function getStudentXpTotals(studentId) {
  const { data, error } = await db
    .from('student_xp')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (error || !data) {
    // Fall back to summing xp_transactions
    const { data: txs } = await db
      .from('xp_transactions')
      .select('xp_amount, league_points')
      .eq('student_id', studentId);

    if (!txs) return { total_xp: 0, total_league_points: 0 };

    return {
      total_xp: txs.reduce((s, t) => s + safeNum(t.xp_amount), 0),
      total_league_points: txs.reduce((s, t) => s + safeNum(t.league_points), 0),
    };
  }
  return data;
}

/* â”€â”€ Daily report points formula â”€â”€ */
function calcReportPoints(activityType, amount) {
  switch (activityType) {
    case 'questions':         return Math.floor(safeNum(amount) / 20);
    case 'lesson':            return safeNum(amount);
    case 'chapter':
    case 'unit':              return safeNum(amount) * 3;
    case 'comprehensive_exam':return 4;
    case 'center_attendance': return 3;
    case 'review_video':      return 3;
    default:                  return 0;
  }
}

/* â”€â”€ Operation Room task points formula â”€â”€ */
function calcTaskPoints(taskType, amount) {
  switch (taskType) {
    case 'Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©': {
      const n = safeNum(amount);
      if (n < 10) return 1;
      if (n < 30) return 2;
      if (n < 60) return 3;
      if (n < 100) return 4;
      return 5;
    }
    case 'Ø¯Ø±Ø³ Ø¹Ø§Ø¯ÙŠ':      return safeNum(amount) * 1;
    case 'ÙØµÙ„/Ø¨Ø§Ø¨':       return 4;
    case 'ÙÙŠØ¯ÙŠÙˆ Ù…Ø±Ø§Ø¬Ø¹Ø©': return 4;
    case 'Ø§Ù…ØªØ­Ø§Ù† Ø´Ø§Ù…Ù„':  return 6;
    default:              return 0;
  }
}

/* â”€â”€ Operation session duration multiplier â”€â”€ */
function calcSessionMultiplier(plannedMins, actualMins) {
  if (actualMins < 10) return 0;
  if (actualMins < plannedMins / 2) return 0.5;
  return 1;
}

/* â”€â”€ Full session league points & XP â”€â”€ */
function calcSessionReward(plannedMins, actualMins, tasks) {
  const multiplier = calcSessionMultiplier(plannedMins, actualMins);
  let rawPoints = 0;
  for (const t of tasks) {
    rawPoints += calcTaskPoints(t.task_type, t.amount);
  }
  const leaguePoints = Math.round(rawPoints * multiplier);
  const xp = leaguePoints * 3;
  return { leaguePoints, xp, multiplier };
}

