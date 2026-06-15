// =========================================================
// Education + Subjects + Report Sliders Patch
// دوري المذاكراوية - Phase 3
// =========================================================
(function () {
  'use strict';

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
  const NO_TRACK = ['بدون مسار'];
  const BASIC_LANG_TRACKS = ['عربي', 'لغات'];
  const GENERAL_2_TRACKS = ['علمي', 'أدبي'];
  const GENERAL_3_TRACKS = ['علمي علوم', 'علمي رياضة', 'أدبي'];
  const AZHAR_TRACKS = ['علمي', 'أدبي'];
  const BAC_TRACKS = [
    'مسار الطب وعلوم الحياة',
    'مسار الهندسة وعلوم الحاسب',
    'مسار الأعمال',
    'مسار الآداب والفنون'
  ];
  const STEM_TRACKS = ['STEM'];
  const STEM_3_TRACKS = ['علمي علوم', 'علمي رياضة'];

  const ACTIVITY_CONFIG = {
    questions: { label: 'حل أسئلة', max: 300 },
    lesson: { label: 'درس عادي', max: 5 },
    chapter: { label: 'فصل / باب', max: 3 },
    unit: { label: 'وحدة / يونت', max: 3 },
    comprehensive_exam: { label: 'امتحان شامل', max: 5 },
    center_attendance: { label: 'حضور سنتر', max: 3 },
    review_video: { label: 'فيديو مراجعة', max: 3 }
  };

  function qs(selector, root = document) { return root.querySelector(selector); }
  function qsa(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }
  function db() { return window.supabaseClient || null; }

  function unique(items) {
    return Array.from(new Set((items || []).filter(Boolean)));
  }

  function setOptions(select, options, placeholder) {
    if (!select) return;
    const current = select.value;
    select.innerHTML = '';
    const first = document.createElement('option');
    first.value = '';
    first.textContent = placeholder || 'اختر';
    select.appendChild(first);
    unique(options).forEach(function (value) {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = value;
      select.appendChild(opt);
    });
    if (current && unique(options).includes(current)) select.value = current;
  }

  function isPrimaryOrPrep(grade) {
    return grade === 'السادس الابتدائي' || String(grade || '').includes('الإعدادي');
  }

  function getSystemOptionsForGrade(grade) {
    if (isPrimaryOrPrep(grade)) return LANG_SYSTEMS;
    if (String(grade || '').includes('الثانوي')) return SECONDARY_SYSTEMS;
    return SECONDARY_SYSTEMS;
  }

  function getTrackOptions(grade, system) {
    if (isPrimaryOrPrep(grade)) return BASIC_LANG_TRACKS;

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

  function initSignupEducation() {
    const grade = qs('#sGrade');
    const system = qs('#sEdu');
    const track = qs('#sTrack');
    if (!grade || !system || !track) return;

    setOptions(grade, GRADES, 'اختر الصف');

    function updateSystem() {
      const systems = getSystemOptionsForGrade(grade.value);
      setOptions(system, systems, 'اختر النظام');
      updateTrack();
    }

    function updateTrack() {
      const tracks = getTrackOptions(grade.value, system.value);
      setOptions(track, tracks, 'اختر المسار / الشعبة');
      const wrap = qs('#trackWrap');
      if (wrap) wrap.style.display = 'block';
    }

    grade.addEventListener('change', updateSystem);
    system.addEventListener('change', updateTrack);
    updateSystem();
  }

  function getCurrentStudentSafe() {
    try {
      if (typeof getCurrentStudent === 'function') return getCurrentStudent();
      return JSON.parse(localStorage.getItem('currentStudent') || 'null');
    } catch (_) {
      return null;
    }
  }

  function fallbackSubjects(student) {
    const grade = student?.grade_level || '';
    const system = student?.edu_system || '';
    const track = student?.track || '';

    if (grade === 'السادس الابتدائي') {
      return ['اللغة العربية', 'اللغة الأجنبية الأولى', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية', 'تكنولوجيا المعلومات والاتصالات', 'المهارات المهنية', 'التربية الدينية'];
    }

    if (String(grade).includes('الإعدادي')) {
      return ['اللغة العربية', 'اللغة الأجنبية الأولى', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية', 'التربية الدينية', 'الكمبيوتر وتكنولوجيا المعلومات والاتصالات', 'اللغة الأجنبية الثانية', 'الأنشطة'];
    }

    if (system === 'STEM') {
      if (grade === 'الأول الثانوي') {
        return ['اللغة العربية', 'التاريخ', 'الجغرافيا', 'Biology', 'Physics', 'Chemistry', 'Geology', 'Mathematics', 'Mechanics', 'English Language', 'German', 'French', 'Computer', 'التربية الدينية'];
      }
      if (grade === 'الثاني الثانوي') {
        return ['اللغة العربية', 'المواطنة وحقوق الإنسان', 'Biology', 'Physics', 'Chemistry', 'Geology', 'Mathematics', 'Mechanics', 'English Language', 'German', 'French', 'Computer', 'التربية الدينية'];
      }
      if (grade === 'الثالث الثانوي') {
        const common = ['اللغة العربية', 'Physics', 'Chemistry', 'English Language', 'German', 'French', 'Computer', 'التربية الدينية'];
        if (track === 'علمي علوم') return common.concat(['Biology', 'Geology']);
        if (track === 'علمي رياضة') return common.concat(['Mathematics', 'Mechanics']);
        return common.concat(['Biology', 'Geology', 'Mathematics', 'Mechanics']);
      }
    }

    if (system === 'ثانوي أزهري') {
      const common = ['القرآن الكريم', 'الفقه', 'الحديث', 'التفسير', 'التوحيد', 'الثقافة الإسلامية', 'النحو', 'الصرف', 'البلاغة', 'الأدب والنصوص', 'المطالعة', 'الإنشاء'];
      if (track === 'علمي') return common.concat(['إنجليزي', 'فيزياء', 'كيمياء', 'أحياء', 'رياضيات']);
      if (track === 'أدبي') return common.concat(['إنجليزي', 'لغة فرنسية', 'تاريخ', 'جغرافيا', 'علم نفس', 'منطق', 'فلسفة', 'العروض والقافية']);
      return common;
    }

    if (system === 'ثانوي بكالوريا') {
      if (grade === 'الأول الثانوي') return ['اللغة العربية', 'اللغة الأجنبية الأولى', 'التاريخ', 'الرياضيات', 'العلوم المتكاملة', 'البرمجة والذكاء الاصطناعي'];
      return ['اللغة العربية', 'اللغة الأجنبية الأولى', 'التاريخ', 'المادة التخصصية للمسار'];
    }

    if (system === 'ثانوي عام' || system === 'ثانوي نظام قديم' || String(grade).includes('الثانوي')) {
      if (grade === 'الأول الثانوي') {
        return ['اللغة العربية', 'اللغة الأجنبية الأولى', 'الرياضيات', 'العلوم المتكاملة', 'التاريخ', 'الفلسفة والمنطق', 'التربية الدينية', 'اللغة الأجنبية الثانية', 'البرمجة والذكاء الاصطناعي'];
      }
      if (grade === 'الثاني الثانوي') {
        if (track === 'أدبي') return ['اللغة العربية', 'اللغة الأجنبية الأولى', 'التاريخ', 'جغرافيا التنمية', 'علم النفس والاجتماع', 'التربية الدينية', 'اللغة الأجنبية الثانية', 'المواطنة وحقوق الإنسان', 'الكمبيوتر وتكنولوجيا المعلومات'];
        return ['اللغة العربية', 'اللغة الأجنبية الأولى', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'التربية الدينية', 'اللغة الأجنبية الثانية', 'المواطنة وحقوق الإنسان', 'الكمبيوتر وتكنولوجيا المعلومات'];
      }
      if (grade === 'الثالث الثانوي') {
        if (track === 'علمي علوم') return ['اللغة العربية', 'اللغة الأجنبية الأولى', 'الفيزياء', 'الكيمياء', 'الأحياء', 'التربية الدينية', 'التربية الوطنية', 'اللغة الأجنبية الثانية'];
        if (track === 'علمي رياضة') return ['اللغة العربية', 'اللغة الأجنبية الأولى', 'الفيزياء', 'الكيمياء', 'الرياضيات', 'التربية الدينية', 'التربية الوطنية', 'اللغة الأجنبية الثانية'];
        if (track === 'أدبي') return ['اللغة العربية', 'اللغة الأجنبية الأولى', 'التاريخ', 'الجغرافيا السياسية', 'الإحصاء', 'التربية الدينية', 'التربية الوطنية', 'اللغة الأجنبية الثانية'];
      }
    }

    return ['اللغة العربية', 'اللغة الأجنبية الأولى', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية', 'التربية الدينية'];
  }

  async function loadSubjectsFromDb(student) {
    const client = db();
    if (!client) return [];
    try {
      let query = client
        .from('subjects_config')
        .select('id, name, grade_level, edu_system, track, is_active, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (student?.grade_level) query = query.eq('grade_level', student.grade_level);
      if (student?.edu_system) query = query.eq('edu_system', student.edu_system);
      if (student?.track) query = query.or('track.is.null,track.eq.' + student.track);

      const { data, error } = await query;
      if (error || !data) return [];
      return data.map(function (row) { return row.name; }).filter(Boolean);
    } catch (_) {
      return [];
    }
  }

  async function initReportSubjects() {
    const subjectEl = qs('#achSubject');
    if (!subjectEl) return;

    let select = subjectEl;
    if (subjectEl.tagName !== 'SELECT') {
      select = document.createElement('select');
      select.id = subjectEl.id;
      select.className = subjectEl.className || 'form-select';
      if (!select.className.includes('form-select')) select.className += ' form-select';
      subjectEl.replaceWith(select);
    }

    select.innerHTML = '<option value="">جاري تحميل المواد...</option>';

    const student = getCurrentStudentSafe();
    let subjects = await loadSubjectsFromDb(student);
    if (!subjects.length) subjects = fallbackSubjects(student);

    setOptions(select, subjects, 'اختر المادة');
  }

  function setupActivityOptions() {
    const activity = qs('#achType');
    if (!activity) return;

    activity.innerHTML = '<option value="">اختر نوع النشاط</option>';
    Object.keys(ACTIVITY_CONFIG).forEach(function (key) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = ACTIVITY_CONFIG[key].label;
      activity.appendChild(opt);
    });
  }

  function setupAmountSlider() {
    const activity = qs('#achType');
    const amount = qs('#achAmount');
    if (!activity || !amount) return;

    amount.type = 'range';
    amount.min = '0';
    amount.value = '0';
    amount.classList.add('rtl-slider');

    const label = document.querySelector('label[for="achAmount"]');
    let valueSpan = qs('#achAmountVal');
    if (!valueSpan) {
      valueSpan = document.createElement('span');
      valueSpan.id = 'achAmountVal';
      valueSpan.textContent = '0';
      if (label) label.append(' ', valueSpan);
    }

    function update() {
      const config = ACTIVITY_CONFIG[activity.value];
      if (!config) {
        amount.max = '0';
        amount.value = '0';
        amount.disabled = true;
        if (label) label.childNodes[0].textContent = 'الكمية: ';
        valueSpan.textContent = '0';
        return;
      }
      amount.disabled = false;
      amount.max = String(config.max);
      amount.value = '0';
      if (label) label.childNodes[0].textContent = config.label + ' - الكمية: ';
      valueSpan.textContent = '0';
    }

    amount.addEventListener('input', function () {
      valueSpan.textContent = amount.value;
    });
    activity.addEventListener('change', update);
    update();
  }

  function setupHoursSlider() {
    const hours = qs('#achHours');
    if (!hours) return;
    hours.classList.add('rtl-slider');
    hours.min = hours.min || '0';
    hours.max = hours.max || '12';
    hours.step = hours.step || '0.5';
  }

  function hidePointsCard() {
    qsa('.card, .admin-card, div').forEach(function (node) {
      const text = node.textContent || '';
      if (text.includes('نظام النقاط') && text.includes('حل أسئلة')) {
        node.style.display = 'none';
      }
    });
  }

  function initReportPatch() {
    initReportSubjects();
    setupActivityOptions();
    setupHoursSlider();
    setupAmountSlider();
    hidePointsCard();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSignupEducation();
    initReportPatch();
  });

  window.MozakrawyEducationPatch = {
    GRADES,
    getSystemOptionsForGrade,
    getTrackOptions,
    fallbackSubjects
  };
})();
