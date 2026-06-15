===== MOZAKRAWY BUNDLE 3: OPERATION LEADERBOARDS =====



===== FILE: operation.js =====

/* =============================================
   Operation Room Module - Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©
   Study session with timer, tasks, and saving
   ============================================= */

const db = window.supabaseClient;

/* â”€â”€ State â”€â”€ */
let opState = {
  phase: 'setup',         // setup | active | break | done
  plannedDuration: 0,
  breakDuration: 0,
  subject: '',
  tasks: [],
  sessionStartTime: null,
  taskStartTime: null,
  breakStartTime: null,
  timerInterval: null,
  completedTasks: [],
  currentTask: null,
  maxTasks: 1,
};

const TASK_LIMITS = {
  'Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©':     { 30: 25, 50: 45, 60: 60, 90: 80 },
  'Ø¯Ø±Ø³ Ø¹Ø§Ø¯ÙŠ':     { 30: 3, 50: 3, 60: 3, 90: 3 },
  'ÙØµÙ„/Ø¨Ø§Ø¨':      { 30: 1, 50: 1, 60: 1, 90: 1 },
  'ÙÙŠØ¯ÙŠÙˆ Ù…Ø±Ø§Ø¬Ø¹Ø©': { 30: 1, 50: 1, 60: 1, 90: 1 },
  'Ø§Ù…ØªØ­Ø§Ù† Ø´Ø§Ù…Ù„':  { 30: 1, 50: 1, 60: 1, 90: 1 },
};

const MAX_TASKS_BY_DURATION = { 30: 1, 50: 2, 60: 2, 90: 4 };

/* â”€â”€ Init â”€â”€ */
function initOperationPage() {
  const student = requireAuth();
  if (!student) return;

  opState.student = student;
  showPhase('setup');

  // Duration buttons
  document.querySelectorAll('.duration-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      opState.plannedDuration = parseInt(btn.dataset.mins);
      opState.maxTasks = MAX_TASKS_BY_DURATION[opState.plannedDuration] || 1;
      updateTaskTypeOptions();
    });
  });

  // Break buttons
  document.querySelectorAll('.break-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.break-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      opState.breakDuration = parseInt(btn.dataset.mins);
    });
  });

  // Task type change
  document.getElementById('taskType')?.addEventListener('change', () => {
    updateAmountControl();
  });

  // Start session
  document.getElementById('startSessionBtn')?.addEventListener('click', () => startSession());

  // More task
  document.getElementById('moreTaskBtn')?.addEventListener('click', () => startBreak());

  // End session
  document.getElementById('endSessionBtn')?.addEventListener('click', () => confirmEndSession());

  // Confirm end
  document.getElementById('confirmEndBtn')?.addEventListener('click', () => finishSession());
  document.getElementById('cancelEndBtn')?.addEventListener('click', () => closeModal('confirmModal'));
}

/* â”€â”€ Phase management â”€â”€ */
function showPhase(phase) {
  ['setup','active','break','summary'].forEach(p => {
    const el = document.getElementById(`phase_${p}`);
    if (el) el.classList.toggle('hidden', p !== phase);
  });
  opState.phase = phase;
}

/* â”€â”€ Task type options â”€â”€ */
function updateTaskTypeOptions() {
  const sel = document.getElementById('taskType');
  if (!sel) return;
  // All types always available; limits applied on input
  updateAmountControl();
}

/* â”€â”€ Amount control â”€â”€ */
function updateAmountControl() {
  const type = document.getElementById('taskType')?.value;
  const dur  = opState.plannedDuration || 30;
  const amountSection = document.getElementById('amountSection');
  const amountGroup   = document.getElementById('amountGroup');

  if (!amountSection) return;

  if (type === 'Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©') {
    amountSection.classList.remove('hidden');
    amountGroup.classList.remove('hidden');
    const max = TASK_LIMITS['Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©'][dur] || 25;
    const range = document.getElementById('taskAmount');
    const valEl = document.getElementById('taskAmountVal');
    if (range) { range.max = max; range.value = Math.min(range.value, max); }
    if (valEl)  valEl.textContent = range?.value || 0;
    setText('amountLabel', 'Ø¹Ø¯Ø¯ Ø§Ù„Ø£Ø³Ø¦Ù„Ø©');
    hideEl('fixedLabel');
  } else if (type === 'Ø¯Ø±Ø³ Ø¹Ø§Ø¯ÙŠ') {
    amountSection.classList.remove('hidden');
    amountGroup.classList.remove('hidden');
    const range = document.getElementById('taskAmount');
    if (range) { range.min = 1; range.max = 3; range.value = 1; }
    setText('taskAmountVal', '1');
    setText('amountLabel', 'Ø¹Ø¯Ø¯ Ø§Ù„Ø¯Ø±ÙˆØ³ (1-3)');
    hideEl('fixedLabel');
  } else {
    // Fixed: 1
    amountSection.classList.remove('hidden');
    hideEl('amountGroup');
    showEl('fixedLabel');
    if (type === 'ÙØµÙ„/Ø¨Ø§Ø¨')       setText('fixedLabel', 'ðŸ“š ÙØµÙ„ / Ø¨Ø§Ø¨ ÙˆØ§Ø­Ø¯');
    else if (type === 'ÙÙŠØ¯ÙŠÙˆ Ù…Ø±Ø§Ø¬Ø¹Ø©') setText('fixedLabel', 'ðŸŽ¬ ÙÙŠØ¯ÙŠÙˆ Ù…Ø±Ø§Ø¬Ø¹Ø© ÙˆØ§Ø­Ø¯');
    else if (type === 'Ø§Ù…ØªØ­Ø§Ù† Ø´Ø§Ù…Ù„')  setText('fixedLabel', 'ðŸ“ Ø§Ù…ØªØ­Ø§Ù† Ø´Ø§Ù…Ù„ ÙˆØ§Ø­Ø¯');
  }
}

/* â”€â”€ Start session â”€â”€ */
function startSession() {
  if (!opState.plannedDuration) {
    showAlert('setupAlert', 'Ø§Ø®ØªØ± Ù…Ø¯Ø© Ø§Ù„Ø¬Ù„Ø³Ø© Ø£ÙˆÙ„Ø§Ù‹', 'warn');
    return;
  }

  const subject = document.getElementById('sessionSubject')?.value?.trim();
  if (!subject) {
    showAlert('setupAlert', 'Ø§ÙƒØªØ¨ Ø§Ø³Ù… Ø§Ù„Ù…Ø§Ø¯Ø©', 'warn');
    return;
  }

  opState.subject        = subject;
  opState.sessionStartTime = Date.now();
  opState.completedTasks   = [];
  opState.tasks            = [];

  showPhase('active');
  startTaskUI();
}

/* â”€â”€ Active task UI â”€â”€ */
function startTaskUI() {
  opState.taskStartTime = Date.now();
  opState.currentTask   = {
    task_type: document.getElementById('activeTaskType')?.value || 'Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©',
    amount: 0,
  };

  // Populate active task type from setup
  const setupType = document.getElementById('taskType')?.value || 'Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©';
  const activeTypeSel = document.getElementById('activeTaskType');
  if (activeTypeSel) activeTypeSel.value = setupType;

  updateActiveAmountControl();
  startActiveTimer();
  updateMoreTaskBtn();
}

/* â”€â”€ Active phase amount control â”€â”€ */
function updateActiveAmountControl() {
  const type = document.getElementById('activeTaskType')?.value || 'Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©';
  const dur  = opState.plannedDuration || 30;
  const amountRow = document.getElementById('activeAmountRow');
  const fixedRow  = document.getElementById('activeFixedRow');

  if (type === 'Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©' || type === 'Ø¯Ø±Ø³ Ø¹Ø§Ø¯ÙŠ') {
    showEl('activeAmountRow');
    hideEl('activeFixedRow');
    const range  = document.getElementById('activeTaskAmount');
    const valEl  = document.getElementById('activeTaskAmountVal');
    const label  = document.getElementById('activeAmountLabel');
    if (type === 'Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©') {
      const max = TASK_LIMITS['Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©'][dur] || 25;
      if (range) { range.min = 0; range.max = max; range.value = 0; }
      if (label) label.textContent = 'Ø¹Ø¯Ø¯ Ø§Ù„Ø£Ø³Ø¦Ù„Ø©';
    } else {
      if (range) { range.min = 1; range.max = 3; range.value = 1; }
      if (label) label.textContent = 'Ø¹Ø¯Ø¯ Ø§Ù„Ø¯Ø±ÙˆØ³';
    }
    if (valEl && range) valEl.textContent = range.value;
  } else {
    hideEl('activeAmountRow');
    showEl('activeFixedRow');
    const labels = { 'ÙØµÙ„/Ø¨Ø§Ø¨': 'ðŸ“š ÙØµÙ„ / Ø¨Ø§Ø¨', 'ÙÙŠØ¯ÙŠÙˆ Ù…Ø±Ø§Ø¬Ø¹Ø©': 'ðŸŽ¬ ÙÙŠØ¯ÙŠÙˆ Ù…Ø±Ø§Ø¬Ø¹Ø©', 'Ø§Ù…ØªØ­Ø§Ù† Ø´Ø§Ù…Ù„': 'ðŸ“ Ø§Ù…ØªØ­Ø§Ù† Ø´Ø§Ù…Ù„' };
    setText('activeFixedRow', labels[type] || type);
  }
}

document.getElementById?.('activeTaskType')?.addEventListener?.('change', updateActiveAmountControl);

/* â”€â”€ Timer â”€â”€ */
function startActiveTimer() {
  clearInterval(opState.timerInterval);
  const displayEl = document.getElementById('activeTimerDisplay');

  opState.timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - opState.taskStartTime) / 1000);
    const remaining = (opState.plannedDuration * 60) - elapsed;
    if (displayEl) {
      if (remaining > 0) {
        displayEl.textContent = formatTime(remaining);
        displayEl.className = 'timer-display timer-green';
      } else {
        displayEl.textContent = '+' + formatTime(Math.abs(remaining));
        displayEl.className = 'timer-display timer-red';
      }
    }
  }, 1000);
}

function startBreakTimer() {
  clearInterval(opState.timerInterval);
  const displayEl = document.getElementById('breakTimerDisplay');
  opState.breakStartTime = Date.now();

  opState.timerInterval = setInterval(() => {
    const elapsed   = Math.floor((Date.now() - opState.breakStartTime) / 1000);
    const remaining = (opState.breakDuration * 60) - elapsed;
    if (displayEl) {
      displayEl.textContent = remaining > 0 ? formatTime(remaining) : '00:00';
      displayEl.className = 'timer-display timer-cyan';
    }
    if (remaining <= 0) {
      clearInterval(opState.timerInterval);
      // Auto proceed to next task
      proceedNextTask();
    }
  }, 1000);
}

/* â”€â”€ More task â†’ break â”€â”€ */
function startBreak() {
  // Save current task
  saveCurrentTask();

  if (opState.completedTasks.length >= opState.maxTasks) {
    showAlert('activeAlert', `Ø§Ù„Ø¬Ù„Ø³Ø© Ø¯ÙŠ ØªØ³Ù…Ø­ Ø¨Ù€ ${opState.maxTasks} Ù…Ù‡Ø§Ù… Ø¨Ø³`, 'warn');
    return;
  }

  if (!opState.breakDuration) {
    // No break defined â†’ go directly to next task
    proceedNextTask();
    return;
  }

  clearInterval(opState.timerInterval);
  showPhase('break');
  startBreakTimer();

  document.getElementById('skipBreakBtn')?.addEventListener('click', () => {
    clearInterval(opState.timerInterval);
    proceedNextTask();
  });
}

function proceedNextTask() {
  showPhase('active');
  startTaskUI();
}

/* â”€â”€ Save current task â”€â”€ */
function saveCurrentTask() {
  const type  = document.getElementById('activeTaskType')?.value || 'Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©';
  let amount  = 1;

  if (type === 'Ø­Ù„ Ø£Ø³Ø¦Ù„Ø©' || type === 'Ø¯Ø±Ø³ Ø¹Ø§Ø¯ÙŠ') {
    amount = parseInt(document.getElementById('activeTaskAmount')?.value || '0');
  }

  opState.completedTasks.push({ task_type: type, amount });
}

/* â”€â”€ Update more task button â”€â”€ */
function updateMoreTaskBtn() {
  const btn = document.getElementById('moreTaskBtn');
  if (!btn) return;
  const remaining = opState.maxTasks - opState.completedTasks.length - 1;
  if (remaining <= 0) {
    btn.disabled = true;
    btn.textContent = 'Ø§ÙƒØªÙ…Ù„ Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ù„Ù…Ù‡Ø§Ù…';
  } else {
    btn.disabled = false;
    btn.textContent = `Ù…Ù‡Ù…Ø© ÙƒÙ…Ø§Ù† (Ù…ØªØ¨Ù‚ÙŠ ${remaining})`;
  }
}

/* â”€â”€ Confirm end â”€â”€ */
function confirmEndSession() {
  openModal('confirmModal');
}

/* â”€â”€ Finish session â”€â”€ */
async function finishSession() {
  closeModal('confirmModal');

  // Save last active task
  saveCurrentTask();

  clearInterval(opState.timerInterval);

  const actualDuration = Math.floor((Date.now() - opState.sessionStartTime) / 60000);

  const { leaguePoints, xp } = calcSessionReward(
    opState.plannedDuration,
    actualDuration,
    opState.completedTasks
  );

  try {
    // Insert study_session
    const { data: session, error: sessErr } = await db
      .from('study_sessions')
      .insert([{
        student_id:        opState.student.id,
        subject:           opState.subject,
        planned_duration:  opState.plannedDuration,
        actual_duration:   actualDuration,
        started_at:        new Date(opState.sessionStartTime).toISOString(),
        ended_at:          new Date().toISOString(),
        league_points:     leaguePoints,
        xp_earned:         xp,
        created_at:        new Date().toISOString(),
      }])
      .select()
      .single();

    if (sessErr) throw sessErr;

    // Insert operation_session_tasks
    if (opState.completedTasks.length > 0) {
      const taskRows = opState.completedTasks.map((t, i) => ({
        session_id:  session.id,
        student_id:  opState.student.id,
        task_type:   t.task_type,
        amount:      t.amount,
        order:       i + 1,
        created_at:  new Date().toISOString(),
      }));
      await db.from('operation_session_tasks').insert(taskRows);
    }

    // XP
    if (leaguePoints > 0 || xp > 0) {
      await addXpTransaction(opState.student.id, xp, leaguePoints, 'operation_room', session.id);
    }

    showSummary(actualDuration);
  } catch (err) {
    showAlert('activeAlert', 'Ø®Ø·Ø£ ÙÙŠ Ø­ÙØ¸ Ø§Ù„Ø¬Ù„Ø³Ø©: ' + (err.message || ''), 'error');
    // Still show summary
    showSummary(actualDuration);
  }
}

/* â”€â”€ Show summary â”€â”€ */
function showSummary(actualDuration) {
  showPhase('summary');

  setText('summaryDuration', minutesToDisplay(actualDuration));
  setText('summaryPlanned',  minutesToDisplay(opState.plannedDuration));
  setText('summarySubject',  opState.subject);

  const taskList = document.getElementById('summaryTaskList');
  if (taskList && opState.completedTasks.length > 0) {
    taskList.innerHTML = opState.completedTasks.map((t, i) => `
      <div class="answer-card">
        <div class="flex items-center gap-1">
          <span class="text-cyan fw-bold">Ù…Ù‡Ù…Ø© ${i+1}</span>
          <span class="badge badge-cyan">${t.task_type}</span>
          ${t.amount ? `<span class="text-muted">â€” ${t.amount}</span>` : ''}
        </div>
      </div>
    `).join('');
  } else if (taskList) {
    taskList.innerHTML = emptyHtml('ðŸ“‹', 'Ù„Ù… ØªÙÙ†Ø¬Ø² Ù…Ù‡Ø§Ù…');
  }

  // New session button
  document.getElementById('newSessionBtn')?.addEventListener('click', () => {
    opState = { phase: 'setup', plannedDuration: 0, breakDuration: 0, subject: '', tasks: [],
      sessionStartTime: null, taskStartTime: null, breakStartTime: null,
      timerInterval: null, completedTasks: [], currentTask: null, maxTasks: 1,
      student: opState.student };
    showPhase('setup');
  });
}



===== FILE: leaderboards.js =====

/* =============================================
   Leaderboards Module - Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø§ÙˆÙŠØ©
   ============================================= */

const db = window.supabaseClient;

async function initLeaderboardsPage() {
  requireAuth();

  initTabs('leaderboardTabs');

  // Load first tab immediately
  await loadGeneralLeaderboard();
}

/* â”€â”€ General (Ø¨Ø·Ù„ Ø§Ù„Ø¬ÙˆÙ„Ø©) â”€â”€ */
async function loadGeneralLeaderboard() {
  const container = document.getElementById('lbGeneral');
  if (!container) return;
  container.innerHTML = loadingHtml();

  try {
    const { data, error } = await db
      .from('v_leaderboard_general')
      .select('*')
      .order('league_points', { ascending: false })
      .limit(50);

    if (error) throw error;
    container.innerHTML = renderLeaderboardRows(data, 'league_points', 'Ù†Ù‚Ø·Ø©');
  } catch (e) {
    container.innerHTML = `<div class="alert alert-error">Ø®Ø·Ø£ ÙÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØªØ±ØªÙŠØ¨: ${e.message}</div>`;
  }
}

/* â”€â”€ Questions (Ù‡Ø¯Ø§Ù Ø§Ù„Ø¯ÙˆØ±ÙŠ) â”€â”€ */
async function loadQuestionsLeaderboard() {
  const container = document.getElementById('lbQuestions');
  if (!container || container.dataset.loaded) return;
  container.innerHTML = loadingHtml();

  try {
    const { data, error } = await db
      .from('v_leaderboard_questions')
      .select('*')
      .order('total_questions', { ascending: false })
      .limit(50);

    if (error) throw error;
    container.innerHTML = renderLeaderboardRows(data, 'total_questions', 'Ø³Ø¤Ø§Ù„');
    container.dataset.loaded = '1';
  } catch (e) {
    container.innerHTML = `<div class="alert alert-error">Ø®Ø·Ø£: ${e.message}</div>`;
  }
}

/* â”€â”€ Focus (Ø£Ø¨Ø·Ø§Ù„ Ø§Ù„ØªØ±ÙƒÙŠØ²) â”€â”€ */
async function loadFocusLeaderboard() {
  const container = document.getElementById('lbFocus');
  if (!container || container.dataset.loaded) return;
  container.innerHTML = loadingHtml();

  try {
    const { data, error } = await db
      .from('v_leaderboard_focus')
      .select('*')
      .order('focus_score', { ascending: false })
      .limit(50);

    if (error) throw error;
    container.innerHTML = renderLeaderboardRows(data, 'focus_score', 'Ù†Ù‚Ø·Ø© ØªØ±ÙƒÙŠØ²');
    container.dataset.loaded = '1';
  } catch (e) {
    container.innerHTML = `<div class="alert alert-error">Ø®Ø·Ø£: ${e.message}</div>`;
  }
}

/* â”€â”€ Persistent (Ø§Ù„Ù…Ø«Ø§Ø¨Ø±) â”€â”€ */
async function loadPersistentLeaderboard() {
  const container = document.getElementById('lbPersistent');
  if (!container || container.dataset.loaded) return;
  container.innerHTML = loadingHtml();

  try {
    const { data, error } = await db
      .from('v_leaderboard_persistent')
      .select('*')
      .order('streak', { ascending: false })
      .limit(50);

    if (error) throw error;
    container.innerHTML = renderLeaderboardRows(data, 'streak', 'ÙŠÙˆÙ…');
    container.dataset.loaded = '1';
  } catch (e) {
    container.innerHTML = `<div class="alert alert-error">Ø®Ø·Ø£: ${e.message}</div>`;
  }
}

/* â”€â”€ Quiz leaderboard (ÙƒÙˆÙŠØ² 9) â”€â”€ */
async function loadQuizLeaderboard() {
  const container = document.getElementById('lbQuiz');
  if (!container || container.dataset.loaded) return;
  container.innerHTML = loadingHtml();

  try {
    // Get quiz grades with student names
    const { data, error } = await db
      .from('quiz_grades')
      .select('student_id, grade, quiz_id, students(name)')
      .order('grade', { ascending: false })
      .limit(50);

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = emptyHtml('ðŸŽ¯', 'Ù…ÙÙŠØ´ Ù†ØªØ§Ø¦Ø¬ ÙƒÙˆÙŠØ² Ø¯Ù„ÙˆÙ‚ØªÙŠ');
      return;
    }

    // Group by student, take highest grade
    const byStu = {};
    data.forEach(row => {
      const name = row.students?.name || `Ø·Ø§Ù„Ø¨ ${row.student_id}`;
      const grade = safeNum(row.grade);
      if (!byStu[row.student_id] || grade > byStu[row.student_id].grade) {
        byStu[row.student_id] = { name, grade };
      }
    });

    const sorted = Object.values(byStu).sort((a, b) => b.grade - a.grade);
    container.innerHTML = renderLeaderboardRows(sorted, 'grade', 'Ø¯Ø±Ø¬Ø©');
    container.dataset.loaded = '1';
  } catch (e) {
    container.innerHTML = `<div class="alert alert-error">Ø®Ø·Ø£: ${e.message}</div>`;
  }
}

/* â”€â”€ Render helper â”€â”€ */
function renderLeaderboardRows(data, scoreField, unit) {
  if (!data || data.length === 0) return emptyHtml('ðŸ†', 'Ù…ÙÙŠØ´ Ø¨ÙŠØ§Ù†Ø§Øª Ø¯Ù„ÙˆÙ‚ØªÙŠ');

  const currentStudent = getCurrentStudent();

  return data.map((row, i) => {
    const rank     = i + 1;
    const name     = row.name || row.student_name || `Ø·Ø§Ù„Ø¨ ${rank}`;
    const score    = safeNum(row[scoreField]);
    const isMe     = currentStudent && (row.student_id === currentStudent.id || row.id === currentStudent.id);

    return `
      <div class="lb-row ${isMe ? 'card-green' : ''}">
        <div class="lb-rank ${rankClass(rank)}">${rankIcon(rank)}</div>
        <div class="lb-name">${name}${isMe ? ' <span class="badge badge-green">Ø£Ù†Øª</span>' : ''}</div>
        <div>
          <div class="lb-score">${score.toLocaleString('ar-EG')}</div>
          <div class="lb-detail">${unit}</div>
        </div>
      </div>
    `;
  }).join('');
}

/* â”€â”€ Tab load dispatcher â”€â”€ */
window.onLeaderboardTab = function(tabId) {
  if (tabId === 'lbQuestions') loadQuestionsLeaderboard();
  else if (tabId === 'lbFocus') loadFocusLeaderboard();
  else if (tabId === 'lbPersistent') loadPersistentLeaderboard();
  else if (tabId === 'lbQuiz') loadQuizLeaderboard();
};

