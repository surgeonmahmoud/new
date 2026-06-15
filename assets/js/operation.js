/* ===== OPERATION.JS — دوري المذاكراوية ===== */

const OP_MAX_Q = { 30: 25, 50: 45, 60: 60, 90: 80 };
const OP_TASKS = { 30: 1, 50: 2, 60: 2, 90: 4 };

function calcTaskPoints(taskType, amount) {
  switch (taskType) {
    case 'حل أسئلة': {
      const q = safeNum(amount);
      if (q < 10)  return 1;
      if (q < 30)  return 2;
      if (q < 60)  return 3;
      if (q < 100) return 4;
      return 5;
    }
    case 'درس عادي':    return safeNum(amount);
    case 'فصل/باب':     return 4;
    case 'فيديو مراجعة': return 4;
    case 'امتحان شامل':  return 6;
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
    <h4 class="task-form-title">مهمة ${i + 1}</h4>
    <div class="form-group">
      <label>المادة</label>
      <input class="form-input task-subject" type="text" placeholder="اسم المادة" />
    </div>
    <div class="form-group">
      <label>نوع المهمة</label>
      <select class="form-select task-type-sel">
        <option value="">اختر</option>
        <option value="حل أسئلة">حل أسئلة</option>
        <option value="درس عادي">درس عادي</option>
        <option value="فصل/باب">فصل/باب</option>
        <option value="فيديو مراجعة">فيديو مراجعة</option>
        <option value="امتحان شامل">امتحان شامل</option>
      </select>
    </div>
    <div class="form-group task-amount-wrap" style="display:none">
      <label>الكمية: <span class="task-amount-val">0</span></label>
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
  if (!type || ['فصل/باب','فيديو مراجعة','امتحان شامل'].includes(type)) {
    amtWrap.style.display = 'none';
    slider.value = 1;
    if (valEl) valEl.textContent = '1';
    return;
  }
  amtWrap.style.display = 'block';
  if (type === 'حل أسئلة') {
    const dur = safeNum(getOpEl('opDuration')?.value || 60);
    slider.max = OP_MAX_Q[dur] || 60;
    slider.min = 0;
  } else if (type === 'درس عادي') {
    slider.min = 1; slider.max = 3; slider.value = 1;
    if (valEl) valEl.textContent = '1';
  }
}

function startSession() {
  const dur = safeNum(getOpEl('opDuration')?.value);
  const brk = safeNum(getOpEl('opBreak')?.value);
  const subject = getOpEl('opSubject')?.value.trim();
  if (!dur || !subject) { showToast('اختر المدة والمادة', 'error'); return; }

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
  if (!valid) { showToast('اختر نوع كل مهمة', 'error'); return; }

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
  if (nameEl) nameEl.textContent = `مهمة ${opState.currentTask + 1}: ${task.task_type}`;

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
  const confirmed = confirm('هل أنت متأكد إنك عايز تنهي الجلسة؟');
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
        <p>⏱ مدة الجلسة الفعلية: <strong>${actualDuration} دقيقة</strong></p>
        <div class="task-summary-list">
          ${opTaskRows.map((t, i) => `
            <div class="task-summary-card">
              <strong>مهمة ${i+1}:</strong> ${t.task_type}
              ${t.amount ? ` — ${t.amount}` : ''}
              — ${t.duration_minutes} دقيقة
            </div>
          `).join('')}
        </div>
        <p class="mt-1">🎯 أتممت ${opTaskRows.length} مهمة بنجاح!</p>
      `;
    }
  } catch (err) {
    showToast('خطأ في حفظ الجلسة: ' + err.message, 'error');
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


// ===== Focus Timer =====

let focusSeconds = 0;
let focusTimer = null;

const timerEl = document.getElementById("focusTimer");
const startBtn = document.getElementById("focusStartBtn");

function formatFocusTime(seconds){
  const h = String(Math.floor(seconds / 3600)).padStart(2,"0");
  const m = String(Math.floor((seconds % 3600)/60)).padStart(2,"0");
  const s = String(seconds % 60).padStart(2,"0");

  return `${h}:${m}:${s}`;
}

if(startBtn){

  startBtn.addEventListener("click",()=>{

    if(focusTimer) return;

    startBtn.innerText = "المتابعة شغالة";

    focusTimer = setInterval(()=>{

      focusSeconds++;

      if(timerEl){
        timerEl.innerText = formatFocusTime(focusSeconds);
      }

    },1000);

  });

}
