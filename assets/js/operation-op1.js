// =========================================================
// Operation Room OP-1 + OP-2
// Countdown timer + no-fill RTL sliders + task flow
// =========================================================

(function () {
  "use strict";

  const QUESTION_LIMITS = {
    30: 25,
    50: 45,
    60: 60,
    90: 80
  };

  const TASK_LABELS = {
    questions: "حل أسئلة",
    lesson: "درس عادي",
    chapter: "فصل / باب",
    review_video: "فيديو مراجعة",
    comprehensive_exam: "امتحان شامل"
  };

  const TASK_LIMITS_BY_DURATION = {
    30: 1,
    50: 2,
    60: 2,
    90: 4
  };

  let timerInterval = null;
  let breakInterval = null;

  let session = {
    active: false,
    duration: 60,
    breakDuration: 10,
    remainingSeconds: 60 * 60,
    maxTasks: 2,
    tasks: [],
    currentTask: null
  };

  function qs(selector) {
    return document.querySelector(selector);
  }

  function formatTime(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  function formatMinutes(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function show(el) {
    if (el) el.classList.remove("hidden");
  }

  function hide(el) {
    if (el) el.classList.add("hidden");
  }

  function taskLimit(type, duration) {
    if (type === "questions") return QUESTION_LIMITS[duration] || 60;
    if (type === "lesson") return 3;
    if (type === "chapter") return 1;
    if (type === "review_video") return 1;
    if (type === "comprehensive_exam") return 3;
    return 1;
  }

  function taskMin(type) {
    if (type === "lesson") return 1;
    if (type === "chapter") return 1;
    if (type === "review_video") return 1;
    if (type === "comprehensive_exam") return 1;
    return 0;
  }

  function updateProgressRing() {
    const ring = qs("#op1ProgressRing");
    if (!ring) return;

    const totalSeconds = session.duration * 60;
    const percent = Math.max(0, (session.remainingSeconds / totalSeconds) * 100);

    ring.style.setProperty("--progress", percent + "%");
  }

  function updateTimerUI() {
    const timer = qs("#op1Timer");
    if (timer) timer.textContent = formatTime(session.remainingSeconds);
    updateProgressRing();
  }

  function updateTaskSlider() {
    const type = qs("#op1TaskType")?.value;
    const duration = Number(qs("#op1Duration")?.value || 60);

    const box = qs("#op1AmountBox");
    const range = qs("#op1Amount");
    const value = qs("#op1AmountValue");
    const label = qs("#op1AmountLabel");
    const maxText = qs("#op1RangeMaxText");

    if (!type) {
      hide(box);
      return;
    }

    show(box);

    range.className = "op1-range";

    if (type === "questions") {
      range.classList.add("questions");
    }

    if (type === "lesson") {
      range.classList.add("lesson");
    }

    if (type === "chapter" || type === "review_video") {
      range.classList.add("fixed");
    }

    if (type === "comprehensive_exam") {
      range.classList.add("exam");
    }

    const min = taskMin(type);
    const max = taskLimit(type, duration);

    range.min = String(min);
    range.max = String(max);
    range.value = String(min);

    if (type === "chapter" || type === "review_video") {
      range.disabled = true;
    } else {
      range.disabled = false;
    }

    label.textContent = TASK_LABELS[type] + " — الكمية";
    value.textContent = range.value;
    maxText.textContent = "الحد الأقصى: " + max;
  }

  function getCurrentTaskFromForm(isExtra) {
    return {
      subject: qs("#op1Subject")?.value || "",
      type: qs("#op1TaskType")?.value || "",
      amount: Number(qs("#op1Amount")?.value || 0),
      isExtra: Boolean(isExtra)
    };
  }

  function validateTask(task) {
    if (!task.subject) {
      alert("اختار المادة الأول");
      return false;
    }

    if (!task.type) {
      alert("اختار نوع المهمة");
      return false;
    }

    return true;
  }

  function renderCurrentTask(task) {
    const box = qs("#op2CurrentTaskBox");
    if (!box) return;

    box.innerHTML = `
      <h3>${task.isExtra ? "مهمة إضافية" : "المهمة الأساسية"}</h3>
      <p><strong>المادة:</strong> ${task.subject}</p>
      <p><strong>نوع المهمة:</strong> ${TASK_LABELS[task.type]}</p>
      <p><strong>الكمية:</strong> ${task.amount}</p>
    `;
  }

  function lockSetup(locked) {
    ["#op1Duration", "#op1Break", "#op1Subject", "#op1TaskType", "#op1Amount"].forEach((selector) => {
      const el = qs(selector);
      if (el) el.disabled = locked;
    });
  }

  function startCountdown() {
    clearInterval(timerInterval);

    const ring = qs("#op1ProgressRing");
    if (ring) ring.classList.add("running");

    qs("#op1TimerState").textContent = "الجلسة شغالة";

    timerInterval = setInterval(() => {
      session.remainingSeconds -= 1;

      if (session.remainingSeconds <= 0) {
        session.remainingSeconds = 0;
        updateTimerUI();
        pauseCountdown("انتهت المدة");
        return;
      }

      updateTimerUI();
    }, 1000);
  }

  function pauseCountdown(stateText) {
    clearInterval(timerInterval);
    timerInterval = null;

    const ring = qs("#op1ProgressRing");
    if (ring) ring.classList.remove("running");

    qs("#op1TimerState").textContent = stateText || "متوقف مؤقتًا";
  }

  function startSession() {
    const duration = Number(qs("#op1Duration")?.value || 60);
    const breakDuration = Number(qs("#op1Break")?.value || 10);

    const task = getCurrentTaskFromForm(false);

    if (!validateTask(task)) return;

    session.active = true;
    session.duration = duration;
    session.breakDuration = breakDuration;
    session.remainingSeconds = duration * 60;
    session.maxTasks = TASK_LIMITS_BY_DURATION[duration] || 2;
    session.tasks = [];
    session.currentTask = task;

    lockSetup(true);

    hide(qs("#op2SummaryCard"));
    hide(qs("#op2BreakCard"));
    show(qs("#op2ActiveCard"));

    qs("#op2SavedCount").textContent = "0";
    qs("#op2SessionStatus").textContent = "نفّذ المهمة واحفظها عند الانتهاء.";

    hide(qs("#op2MoreTaskBtn"));

    renderCurrentTask(task);
    updateTimerUI();
    startCountdown();
  }

  function saveCurrentTask() {
    if (!session.currentTask) return;

    session.tasks.push({
      ...session.currentTask,
      savedAt: new Date().toISOString()
    });

    session.currentTask = null;

    qs("#op2SavedCount").textContent = String(session.tasks.length);

    const canAddMore = session.tasks.length < session.maxTasks;

    if (canAddMore) {
      show(qs("#op2MoreTaskBtn"));
      qs("#op2SessionStatus").textContent = "تم حفظ المهمة. تقدر تضيف مهمة كمان بعد البريك.";
    } else {
      hide(qs("#op2MoreTaskBtn"));
      qs("#op2SessionStatus").textContent = "تم حفظ كل المهام المتاحة. يمكنك إنهاء الجلسة.";
    }

    qs("#op2CurrentTaskBox").innerHTML = `
      <h3>تم حفظ المهمة ✅</h3>
      <p>يمكنك إنهاء الجلسة أو إضافة مهمة أخرى لو مسموح حسب مدة الجلسة.</p>
    `;
  }

  function startBreak() {
    pauseCountdown("وقت البريك");

    hide(qs("#op2ActiveCard"));
    show(qs("#op2BreakCard"));

    let breakSeconds = session.breakDuration * 60;
    qs("#op2BreakTimer").textContent = formatMinutes(breakSeconds);

    clearInterval(breakInterval);

    breakInterval = setInterval(() => {
      breakSeconds -= 1;
      qs("#op2BreakTimer").textContent = formatMinutes(breakSeconds);

      if (breakSeconds <= 0) {
        clearInterval(breakInterval);
        prepareExtraTask();
      }
    }, 1000);
  }

  function prepareExtraTask() {
    clearInterval(breakInterval);

    hide(qs("#op2BreakCard"));
    hide(qs("#op2ActiveCard"));

    lockSetup(false);

    qs("#op1TimerState").textContent = "جهّز المهمة التالية";

    alert("اختار المهمة الجديدة واضغط بدء الجلسة لاستكمال نفس الجلسة.");

    const startBtn = qs("#op1StartBtn");
    startBtn.textContent = "بدء المهمة الإضافية";
    startBtn.dataset.extraTask = "1";
  }

  function startExtraTask() {
    const task = getCurrentTaskFromForm(true);

    if (!validateTask(task)) return;

    session.currentTask = task;

    lockSetup(true);

    show(qs("#op2ActiveCard"));
    hide(qs("#op2BreakCard"));
    hide(qs("#op2SummaryCard"));
    hide(qs("#op2MoreTaskBtn"));

    qs("#op2SessionStatus").textContent = "نفّذ المهمة الإضافية واحفظها عند الانتهاء.";

    renderCurrentTask(task);

    qs("#op1StartBtn").textContent = "بدء الجلسة";
    qs("#op1StartBtn").dataset.extraTask = "0";

    startCountdown();
  }

  function endSession() {
    if (!confirm("هل أنت متأكد إنك عايز تنهي الجلسة؟")) return;

    pauseCountdown("انتهت الجلسة");
    clearInterval(breakInterval);

    lockSetup(false);

    hide(qs("#op2ActiveCard"));
    hide(qs("#op2BreakCard"));
    show(qs("#op2SummaryCard"));

    renderSummary();
  }

  function renderSummary() {
    const list = qs("#op2SummaryList");

    if (!list) return;

    if (session.tasks.length === 0) {
      list.innerHTML = `<div class="op2-summary-item">لم يتم حفظ أي مهام.</div>`;
      return;
    }

    list.innerHTML = session.tasks.map((task, index) => {
      return `
        <div class="op2-summary-item">
          <strong>${index + 1}. ${TASK_LABELS[task.type]}</strong>
          <span>المادة: ${task.subject}</span>
          <span>الكمية: ${task.amount}</span>
        </div>
      `;
    }).join("");
  }

  function resetAll() {
    clearInterval(timerInterval);
    clearInterval(breakInterval);

    session.active = false;
    session.remainingSeconds = Number(qs("#op1Duration")?.value || 60) * 60;
    session.tasks = [];
    session.currentTask = null;

    lockSetup(false);

    hide(qs("#op2ActiveCard"));
    hide(qs("#op2BreakCard"));
    hide(qs("#op2SummaryCard"));
    hide(qs("#op2MoreTaskBtn"));

    qs("#op1Timer").textContent = "00:00:00";
    qs("#op1TimerState").textContent = "جاهز للبدء";

    const ring = qs("#op1ProgressRing");

    if (ring) {
      ring.classList.remove("running");
      ring.style.setProperty("--progress", "100%");
    }

    qs("#op1StartBtn").textContent = "بدء الجلسة";
    qs("#op1StartBtn").dataset.extraTask = "0";
  }

  function getCurrentStudentSafe() {
    try {
      if (typeof getCurrentStudent === "function") return getCurrentStudent();
      return JSON.parse(localStorage.getItem("currentStudent") || "null");
    } catch {
      return null;
    }
  }

  async function loadSubjects() {
    const select = qs("#op1Subject");
    if (!select) return;

    let subjects = [];
    const student = getCurrentStudentSafe();

    if (
      window.MozakrawyEducationPatch &&
      typeof window.MozakrawyEducationPatch.fallbackSubjects === "function"
    ) {
      subjects = window.MozakrawyEducationPatch.fallbackSubjects(student);
    }

    if (!subjects || subjects.length === 0) {
      subjects = [
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

    select.innerHTML =
      `<option value="">اختر المادة</option>` +
      subjects.map((subject) => `<option value="${subject}">${subject}</option>`).join("");
  }

  function setupSidebarMotion() {
    const navToggle = qs("#navToggle");

    if (navToggle) {
      navToggle.addEventListener("click", function () {
        document.body.classList.toggle("sidebar-open");
      });
    }

    document.addEventListener("click", function (event) {
      if (
        document.body.classList.contains("sidebar-open") &&
        !event.target.closest("#sideNav") &&
        !event.target.closest("#navToggle")
      ) {
        document.body.classList.remove("sidebar-open");
      }
    });
  }

  function bindEvents() {
    qs("#op1Duration")?.addEventListener("change", function () {
      selectedDuration = Number(this.value || 60);
      session.remainingSeconds = selectedDuration * 60;
      updateTaskSlider();
      updateTimerUI();
    });

    qs("#op1TaskType")?.addEventListener("change", updateTaskSlider);

    qs("#op1Amount")?.addEventListener("input", function (event) {
      qs("#op1AmountValue").textContent = event.target.value;
    });

    qs("#op1StartBtn")?.addEventListener("click", function () {
      if (this.dataset.extraTask === "1") {
        startExtraTask();
      } else {
        startSession();
      }
    });

    qs("#op1PauseBtn")?.addEventListener("click", function () {
      if (timerInterval) {
        pauseCountdown("متوقف مؤقتًا");
      } else if (session.active && session.currentTask) {
        startCountdown();
      }
    });

    qs("#op1ResetBtn")?.addEventListener("click", resetAll);
    qs("#op2SaveTaskBtn")?.addEventListener("click", saveCurrentTask);
    qs("#op2MoreTaskBtn")?.addEventListener("click", startBreak);
    qs("#op2SkipBreakBtn")?.addEventListener("click", prepareExtraTask);
    qs("#op2EndBtn")?.addEventListener("click", endSession);
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupSidebarMotion();
    loadSubjects();
    bindEvents();
    updateTaskSlider();

    session.remainingSeconds = Number(qs("#op1Duration")?.value || 60) * 60;

    const ring = qs("#op1ProgressRing");

    if (ring) {
      ring.style.setProperty("--progress", "100%");
    }
  });
})();