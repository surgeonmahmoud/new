// =========================================================
// Operation Room V3 — Individual Study Session
// =========================================================

(function () {
  "use strict";

  const SESSION_TASK_LIMITS = {
    30: 1,
    50: 2,
    60: 2,
    90: 4
  };

  const QUESTION_LIMITS = {
    30: 25,
    50: 45,
    60: 60,
    90: 80
  };

  const TASK_TYPES = {
    questions: "حل أسئلة",
    lesson: "درس عادي",
    chapter: "فصل / باب",
    review_video: "فيديو مراجعة",
    comprehensive_exam: "امتحان شامل"
  };

  let session = {
    startedAt: null,
    duration: 60,
    breakDuration: 10,
    maxTasks: 2,
    tasks: [],
    currentTask: null,
    timer: null,
    breakTimer: null,
    elapsedSeconds: 0,
    isRunning: false
  };

  function qs(selector) {
    return document.querySelector(selector);
  }

  function db() {
    return window.supabaseClient || null;
  }

  function getStudent() {
    try {
      if (typeof getCurrentStudent === "function") return getCurrentStudent();
      return JSON.parse(localStorage.getItem("currentStudent") || "null");
    } catch {
      return null;
    }
  }

  function formatSeconds(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  function formatMinutesSeconds(totalSeconds) {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function fallbackSubjects() {
    if (
      window.MozakrawyEducationPatch &&
      typeof window.MozakrawyEducationPatch.fallbackSubjects === "function"
    ) {
      return window.MozakrawyEducationPatch.fallbackSubjects(getStudent());
    }

    return [
      "اللغة العربية",
      "اللغة الأجنبية الأولى",
      "الرياضيات",
      "العلوم",
      "الفيزياء",
      "الكيمياء",
      "الأحياء",
      "التاريخ",
      "الجغرافيا",
      "التربية الدينية"
    ];
  }

  async function loadSubjects() {
    const student = getStudent();
    const client = db();

    if (!client) return fallbackSubjects();

    try {
      let query = client
        .from("subjects_config")
        .select("name, grade_level, edu_system, track, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (student && student.grade_level) {
        query = query.eq("grade_level", student.grade_level);
      }

      if (student && student.edu_system) {
        query = query.eq("edu_system", student.edu_system);
      }

      if (student && student.track) {
        query = query.or("track.is.null,track.eq." + student.track);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) return fallbackSubjects();

      return data.map((item) => item.name).filter(Boolean);
    } catch {
      return fallbackSubjects();
    }
  }

  function setSelectOptions(select, items, placeholder) {
    if (!select) return;

    select.innerHTML =
      `<option value="">${placeholder}</option>` +
      items.map((item) => `<option value="${item}">${item}</option>`).join("");
  }

  function updateAllowedTasks() {
    const duration = Number(qs("#sessionDuration").value || 60);
    const maxTasks = SESSION_TASK_LIMITS[duration] || 2;

    qs("#allowedTasksCount").textContent = String(maxTasks);
  }

  function taskMaxAmount(taskType, duration) {
    if (taskType === "questions") return QUESTION_LIMITS[duration] || 60;
    if (taskType === "lesson") return 3;
    if (taskType === "chapter") return 1;
    if (taskType === "review_video") return 1;
    if (taskType === "comprehensive_exam") return 1;
    return 1;
  }

  function taskMinAmount(taskType) {
    if (taskType === "lesson") return 1;
    if (taskType === "chapter") return 1;
    if (taskType === "review_video") return 1;
    if (taskType === "comprehensive_exam") return 1;
    return 0;
  }

  function updateRangeFill(input) {
    const min = Number(input.min || 0);
    const max = Number(input.max || 1);
    const val = Number(input.value || 0);
    const percent = ((val - min) / (max - min)) * 100;

    let color = "#06b6d4";
    if (input.classList.contains("lesson")) color = "#3b82f6";
    if (input.classList.contains("fixed")) color = "#8b5cf6";

    input.style.background =
      `linear-gradient(to left, ${color} ${percent}%, #1e293b ${percent}%)`;
  }

  function setupMainSlider() {
    const type = qs("#mainTaskType").value;
    const duration = Number(qs("#sessionDuration").value || 60);
    const sliderWrap = qs("#mainTaskSliderWrap");
    const slider = qs("#mainTaskAmount");
    const label = qs("#mainTaskAmountLabel");
    const value = qs("#mainTaskAmountValue");

    if (!type) {
      sliderWrap.classList.add("hidden");
      return;
    }

    sliderWrap.classList.remove("hidden");

    slider.className = "rtl-range";
    slider.classList.add(type === "questions" ? "questions" : "");
    slider.classList.add(type === "lesson" ? "lesson" : "");
    slider.classList.add(
      type === "chapter" || type === "review_video" || type === "comprehensive_exam"
        ? "fixed"
        : ""
    );

    const min = taskMinAmount(type);
    const max = taskMaxAmount(type, duration);

    slider.min = String(min);
    slider.max = String(max);
    slider.value = String(min);

    if (type === "chapter" || type === "review_video") {
      slider.disabled = true;
    } else {
      slider.disabled = false;
    }

    label.textContent = TASK_TYPES[type] + " — الكمية";
    value.textContent = slider.value;

    updateRangeFill(slider);
  }

  function calculateTaskBasePoints(task) {
    const amount = Number(task.amount || 0);

    if (task.type === "questions") {
      if (amount < 10) return 1;
      if (amount < 30) return 2;
      if (amount < 60) return 3;
      if (amount < 100) return 4;
      return 5;
    }

    if (task.type === "lesson") return amount;

    if (task.type === "chapter") return 4;

    if (task.type === "review_video") return 4;

    if (task.type === "comprehensive_exam") return 6;

    return 0;
  }

  function timeMultiplier() {
    const elapsedMinutes = session.elapsedSeconds / 60;
    const half = session.duration / 2;

    if (elapsedMinutes < 10) return 0;
    if (elapsedMinutes < half) return 0.5;
    return 1;
  }

  function calculateTaskPoints(task) {
    const base = calculateTaskBasePoints(task);
    const multiplier = timeMultiplier();

    const leaguePoints = Math.floor(base * multiplier);
    const xp = leaguePoints * 3;

    return {
      leaguePoints,
      xp
    };
  }

  function startTimer() {
    session.startedAt = Date.now();
    session.elapsedSeconds = 0;
    session.isRunning = true;

    clearInterval(session.timer);

    session.timer = setInterval(() => {
      session.elapsedSeconds = Math.floor((Date.now() - session.startedAt) / 1000);
      qs("#opTimer").textContent = formatSeconds(session.elapsedSeconds);
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(session.timer);
    session.isRunning = false;
  }

  function resumeTimer() {
    session.startedAt = Date.now() - session.elapsedSeconds * 1000;
    session.isRunning = true;

    clearInterval(session.timer);

    session.timer = setInterval(() => {
      session.elapsedSeconds = Math.floor((Date.now() - session.startedAt) / 1000);
      qs("#opTimer").textContent = formatSeconds(session.elapsedSeconds);
    }, 1000);
  }

  function buildCurrentTask(task) {
    qs("#currentTaskBox").innerHTML = `
      <h3>${task.isExtra ? "مهمة إضافية" : "المهمة الأساسية"}</h3>
      <p><strong>المادة:</strong> ${task.subject}</p>
      <p><strong>نوع المهمة:</strong> ${TASK_TYPES[task.type]}</p>
      <p><strong>الكمية:</strong> ${task.amount}</p>
    `;
  }

  function startSession() {
    const duration = Number(qs("#sessionDuration").value || 60);
    const breakDuration = Number(qs("#breakDuration").value || 10);
    const subject = qs("#mainSubject").value;
    const type = qs("#mainTaskType").value;
    const amount = Number(qs("#mainTaskAmount").value || 0);

    if (!subject) {
      alert("اختار المادة الأول");
      return;
    }

    if (!type) {
      alert("اختار نوع المهمة");
      return;
    }

    session.duration = duration;
    session.breakDuration = breakDuration;
    session.maxTasks = SESSION_TASK_LIMITS[duration] || 2;
    session.tasks = [];

    session.currentTask = {
      subject,
      type,
      amount,
      isExtra: false
    };

    qs("#sessionSetupCard").classList.add("hidden");
    qs("#activeSessionCard").classList.remove("hidden");
    qs("#summaryCard").classList.add("hidden");
    qs("#breakCard").classList.add("hidden");

    qs("#allowedTasksCount").textContent = String(session.maxTasks);
    qs("#savedTasksCount").textContent = "0";

    buildCurrentTask(session.currentTask);
    startTimer();
  }

  function saveCurrentTask() {
    if (!session.currentTask) return;

    const calculated = calculateTaskPoints(session.currentTask);

    session.tasks.push({
      ...session.currentTask,
      durationMinutes: Math.floor(session.elapsedSeconds / 60),
      leaguePoints: calculated.leaguePoints,
      xp: calculated.xp
    });

    qs("#savedTasksCount").textContent = String(session.tasks.length);

    session.currentTask = null;

    const canAddMore = session.tasks.length < session.maxTasks;

    if (canAddMore) {
      qs("#addAnotherTaskBtn").classList.remove("hidden");
      qs("#sessionStatusText").textContent = "تم حفظ المهمة. تقدر تضيف مهمة كمان بعد البريك.";
    } else {
      qs("#addAnotherTaskBtn").classList.add("hidden");
      qs("#sessionStatusText").textContent = "تم حفظ كل المهام المتاحة. يمكنك إنهاء الجلسة.";
    }

    qs("#currentTaskBox").innerHTML = `
      <h3>تم حفظ المهمة ✅</h3>
      <p>استمر أو أنهِ الجلسة عند الانتهاء.</p>
    `;
  }

  function startBreakThenNewTask() {
    pauseTimer();

    qs("#activeSessionCard").classList.add("hidden");
    qs("#breakCard").classList.remove("hidden");

    let remaining = session.breakDuration * 60;
    qs("#breakTimer").textContent = formatMinutesSeconds(remaining);

    clearInterval(session.breakTimer);

    session.breakTimer = setInterval(() => {
      remaining -= 1;
      qs("#breakTimer").textContent = formatMinutesSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(session.breakTimer);
        showExtraTaskForm();
      }
    }, 1000);
  }

  function showExtraTaskForm() {
    clearInterval(session.breakTimer);

    qs("#breakCard").classList.add("hidden");
    qs("#activeSessionCard").classList.remove("hidden");

    resumeTimer();

    session.currentTask = {
      subject: qs("#mainSubject").value,
      type: qs("#mainTaskType").value,
      amount: Number(qs("#mainTaskAmount").value || 0),
      isExtra: true
    };

    buildCurrentTask(session.currentTask);

    qs("#addAnotherTaskBtn").classList.add("hidden");
    qs("#sessionStatusText").textContent = "نفّذ المهمة الإضافية واحفظها عند الانتهاء.";
  }

  function endSession() {
    if (!confirm("هل أنت متأكد إنك عايز تنهي الجلسة؟")) return;

    pauseTimer();
    clearInterval(session.breakTimer);

    qs("#activeSessionCard").classList.add("hidden");
    qs("#breakCard").classList.add("hidden");
    qs("#summaryCard").classList.remove("hidden");

    renderSummary();
    saveSessionToSupabase();
  }

  function renderSummary() {
    const list = qs("#sessionSummaryList");

    if (session.tasks.length === 0) {
      list.innerHTML = `<div class="summary-item">لم يتم حفظ أي مهام.</div>`;
      return;
    }

    list.innerHTML = session.tasks
      .map((task, index) => {
        return `
          <div class="summary-item">
            <strong>${index + 1}. ${TASK_TYPES[task.type]}</strong>
            <span>المادة: ${task.subject}</span>
            <span>الكمية: ${task.amount}</span>
            <span>وقت التنفيذ التقريبي: ${task.durationMinutes} دقيقة</span>
          </div>
        `;
      })
      .join("");
  }

  async function saveSessionToSupabase() {
    const client = db();
    const student = getStudent();

    if (!client || !student || !student.id) return;

    const totalLeaguePoints = session.tasks.reduce((sum, task) => sum + task.leaguePoints, 0);
    const totalXp = session.tasks.reduce((sum, task) => sum + task.xp, 0);
    const totalDuration = Math.floor(session.elapsedSeconds / 60);

    try {
      const { data: sessionRow, error: sessionError } = await client
        .from("study_sessions")
        .insert({
          student_id: student.id,
          subject: qs("#mainSubject").value,
          session_type: "operation_room",
          duration_minutes: totalDuration,
          break_minutes: session.breakDuration,
          task_type: "multi_task",
          amount: session.tasks.length,
          league_points: totalLeaguePoints,
          xp_awarded: totalXp,
          status: "completed",
          started_at: new Date(Date.now() - session.elapsedSeconds * 1000).toISOString(),
          ended_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError || !sessionRow) return;

      const taskRows = session.tasks.map((task) => ({
        session_id: sessionRow.id,
        student_id: student.id,
        subject: task.subject,
        task_type: task.type,
        amount: task.amount,
        duration_minutes: task.durationMinutes,
        league_points: task.leaguePoints,
        xp_awarded: task.xp,
        created_at: new Date().toISOString()
      }));

      await client.from("operation_session_tasks").insert(taskRows);

      if (totalXp > 0) {
        await client.from("xp_transactions").insert({
          student_id: student.id,
          source: "operation_room",
          amount: totalXp,
          note: "Operation Room session",
          created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Operation Room save error", error);
    }
  }

  async function init() {
    const subjects = await loadSubjects();
    setSelectOptions(qs("#mainSubject"), subjects, "اختر المادة");

    updateAllowedTasks();
    setupMainSlider();

    qs("#sessionDuration").addEventListener("change", () => {
      updateAllowedTasks();
      setupMainSlider();
    });

    qs("#mainTaskType").addEventListener("change", setupMainSlider);

    qs("#mainTaskAmount").addEventListener("input", (event) => {
      qs("#mainTaskAmountValue").textContent = event.target.value;
      updateRangeFill(event.target);
    });

    qs("#startSessionBtn").addEventListener("click", startSession);
    qs("#saveTaskBtn").addEventListener("click", saveCurrentTask);
    qs("#addAnotherTaskBtn").addEventListener("click", startBreakThenNewTask);
    qs("#skipBreakBtn").addEventListener("click", showExtraTaskForm);
    qs("#endSessionBtn").addEventListener("click", endSession);
  }

  document.addEventListener("DOMContentLoaded", init);
})();