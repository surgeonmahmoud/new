// =========================================================
// Operation Room V2
// Focus timer + random confirmations + subjects dropdown
// =========================================================

(function () {
  "use strict";

  const MOTIVATION = [
    "كمل يا بطل، أنت ماشي صح 💪",
    "ركز شوية كمان، كل دقيقة بتفرق ⚡",
    "تمام جدًا، اضغط استمرار وكمّل ✅",
    "الالتزام هو اللي هيكسبك الدوري 🏆",
    "شد حيلك، مستواك بيتبني دلوقتي 🔥"
  ];

  let startedAt = null;
  let timerInterval = null;
  let confirmTimeout = null;
  let elapsedSeconds = 0;
  let confirmations = 0;
  let isWaitingConfirm = false;

  function qs(selector) {
    return document.querySelector(selector);
  }

  function qsa(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function db() {
    return window.supabaseClient || null;
  }

  function formatTime(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  function randomDelay() {
    // 18 to 23 minutes
    const minutes = 18 + Math.floor(Math.random() * 6);
    return minutes * 60 * 1000;
  }

  function getStudent() {
    try {
      if (typeof getCurrentStudent === "function") return getCurrentStudent();
      return JSON.parse(localStorage.getItem("currentStudent") || "null");
    } catch {
      return null;
    }
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

  function createFocusPanel() {
    if (qs("#opV2Panel")) return;

    const panel = document.createElement("section");
    panel.id = "opV2Panel";
    panel.className = "op-v2-panel";

    panel.innerHTML = `
      <div class="op-v2-top">
        <div>
          <div class="op-v2-title">جلسة التركيز الحالية</div>
          <div id="opV2Timer" class="op-v2-time">00:00:00</div>
          <div id="opV2Status" class="op-v2-status">
            ابدأ المتابعة وسيظهر تأكيد تركيز كل فترة
          </div>
        </div>

        <div class="op-v2-actions">
          <button id="opV2Start" class="op-v2-btn" type="button">بدء المتابعة</button>
          <button id="opV2Stop" class="op-v2-btn secondary" type="button">إيقاف</button>
        </div>
      </div>

      <div class="op-v2-stats">
        <div class="op-v2-stat">
          <span>التأكيدات</span>
          <strong id="opV2Confirms">0</strong>
        </div>
        <div class="op-v2-stat">
          <span>وقت مؤكد تقريبًا</span>
          <strong id="opV2ConfirmedTime">0 دقيقة</strong>
        </div>
        <div class="op-v2-stat">
          <span>الحالة</span>
          <strong id="opV2State">جاهز</strong>
        </div>
      </div>
    `;

    const main =
      qs("main") ||
      qs(".student-main") ||
      qs(".page-content") ||
      document.body;

    main.prepend(panel);

    const modal = document.createElement("div");
    modal.id = "opV2ConfirmModal";
    modal.className = "op-v2-modal";

    modal.innerHTML = `
      <div class="op-v2-modal-box">
        <h2>تأكيد التركيز</h2>
        <p id="opV2ConfirmText">كمل يا بطل 💪</p>
        <button id="opV2Continue" class="op-v2-btn" type="button">استمرار</button>
      </div>
    `;

    document.body.appendChild(modal);

    qs("#opV2Start").addEventListener("click", startFocus);
    qs("#opV2Stop").addEventListener("click", stopFocus);
    qs("#opV2Continue").addEventListener("click", confirmFocus);
  }

  function updateStats() {
    const confirmsEl = qs("#opV2Confirms");
    const confirmedTimeEl = qs("#opV2ConfirmedTime");
    const stateEl = qs("#opV2State");

    if (confirmsEl) confirmsEl.textContent = String(confirmations);
    if (confirmedTimeEl) {
      confirmedTimeEl.textContent = String(confirmations * 20) + " دقيقة";
    }
    if (stateEl) {
      stateEl.textContent = isWaitingConfirm ? "ينتظر تأكيد" : timerInterval ? "شغال" : "متوقف";
    }

    sessionStorage.setItem("operation_confirmations", String(confirmations));
    sessionStorage.setItem("operation_confirmed_minutes", String(confirmations * 20));
  }

  function startFocus() {
    if (timerInterval) return;

    startedAt = Date.now();
    elapsedSeconds = 0;
    confirmations = Number(sessionStorage.getItem("operation_confirmations") || "0");

    timerInterval = setInterval(() => {
      elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const timer = qs("#opV2Timer");
      if (timer) timer.textContent = formatTime(elapsedSeconds);
    }, 1000);

    scheduleConfirm();

    const status = qs("#opV2Status");
    if (status) status.textContent = "المتابعة شغالة — ركز وسيظهر تأكيد كل فترة";

    updateStats();
  }

  function stopFocus() {
    clearInterval(timerInterval);
    clearTimeout(confirmTimeout);

    timerInterval = null;
    confirmTimeout = null;
    isWaitingConfirm = false;

    const status = qs("#opV2Status");
    if (status) status.textContent = "تم إيقاف المتابعة";

    const modal = qs("#opV2ConfirmModal");
    if (modal) modal.classList.remove("show");

    updateStats();
  }

  function scheduleConfirm() {
    clearTimeout(confirmTimeout);
    confirmTimeout = setTimeout(showConfirm, randomDelay());
  }

  function showConfirm() {
    isWaitingConfirm = true;

    const text = MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)];
    const textEl = qs("#opV2ConfirmText");
    const modal = qs("#opV2ConfirmModal");

    if (textEl) textEl.textContent = text;
    if (modal) modal.classList.add("show");

    const status = qs("#opV2Status");
    if (status) status.textContent = "في انتظار تأكيد التركيز";

    updateStats();
  }

  function confirmFocus() {
    isWaitingConfirm = false;
    confirmations += 1;

    const modal = qs("#opV2ConfirmModal");
    if (modal) modal.classList.remove("show");

    const status = qs("#opV2Status");
    if (status) status.textContent = "تم تأكيد التركيز — استمر يا بطل";

    updateStats();
    scheduleConfirm();
  }

  async function enhanceSubjectInputs() {
    const subjects = await loadSubjects();

    const inputs = qsa("input").filter((input) => {
      const placeholder = input.placeholder || "";
      const name = input.name || "";
      const id = input.id || "";

      return (
        placeholder.includes("المادة") ||
        placeholder.includes("فيزياء") ||
        name.toLowerCase().includes("subject") ||
        id.toLowerCase().includes("subject")
      );
    });

    inputs.forEach((input) => {
      if (input.dataset.subjectEnhanced) return;

      const select = document.createElement("select");
      select.id = input.id;
      select.name = input.name || input.id || "subject";
      select.className = input.className || "op-v2-select";
      select.dataset.subjectEnhanced = "true";

      select.innerHTML =
        `<option value="">اختر المادة</option>` +
        subjects.map((subject) => `<option value="${subject}">${subject}</option>`).join("");

      input.replaceWith(select);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    createFocusPanel();
    enhanceSubjectInputs();

    setTimeout(enhanceSubjectInputs, 700);
  });

  window.OperationRoomV2 = {
    startFocus,
    stopFocus,
    getConfirmations: () => confirmations,
    getConfirmedMinutes: () => confirmations * 20
  };
})();

