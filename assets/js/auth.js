/* ===== AUTH.JS — دوري المذاكراوية ===== */

/* SHA-256 via SubtleCrypto */
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---- LOGIN ---- */
async function handleLogin(e) {
  e.preventDefault();
  clearAlert('loginAlert');
  const btn   = qs('#loginBtn');
  const phone = qs('#loginPhone').value.trim();
  const pin   = qs('#loginPin').value.trim();
  if (!phone || !pin) { showAlert('loginAlert', 'ادخل رقم التليفون والـ PIN'); return; }
  btn.disabled = true;
  btn.textContent = 'جاري…';
  try {
    const db = window.supabaseClient;
    const { data, error } = await db
      .from('students')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();
    if (error) throw error;
    if (!data) { showAlert('loginAlert', 'مفيش حساب بالرقم ده'); return; }
    if (data.is_active === false) { showAlert('loginAlert', 'الحساب موقوف. تواصل مع الإدارة.'); return; }
    if (data.is_frozen === true)  { showAlert('loginAlert', 'الحساب متجمد مؤقتاً.'); return; }

    let match = false;
    if (data.pin_hash && data.pin_hash.length === 64) {
      const hashed = await sha256(pin);
      match = hashed === data.pin_hash;
    } else {
      match = pin === data.pin_hash;
    }
    if (!match) { showAlert('loginAlert', 'الـ PIN غلط، حاول تاني'); return; }

    setCurrentStudent(data);
    window.location.href = '/student/home.html';
  } catch (err) {
    showAlert('loginAlert', 'حصل خطأ: ' + (err.message || 'unknown'));
  } finally {
    btn.disabled = false;
    btn.textContent = 'دخول';
  }
}

/* ---- SIGNUP ---- */
async function handleSignup(e) {
  e.preventDefault();
  clearAlert('signupAlert');
  const btn = qs('#signupBtn');

  const name       = qs('#sName').value.trim();
  const phone      = qs('#sPhone').value.trim();
  const grade      = qs('#sGrade').value;
  const edu        = qs('#sEdu').value;
  const track      = qs('#sTrack').value;
  const doctor     = qs('#sDoctor').value;
  const pin        = qs('#sPin').value.trim();
  const pinConf    = qs('#sPinConf').value.trim();

  if (!name || !phone || !grade || !edu || !pin) {
    showAlert('signupAlert', 'اكمل كل الحقول المطلوبة');
    return;
  }
  if (pin !== pinConf) {
    showAlert('signupAlert', 'الـ PIN مش متطابق');
    return;
  }
  if (pin.length < 4) {
    showAlert('signupAlert', 'الـ PIN لازم 4 أرقام على الأقل');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'جاري…';
  try {
    const db = window.supabaseClient;
    // check duplicate phone
    const { data: existing } = await db
      .from('students')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    if (existing) {
      showAlert('signupAlert', 'الرقم ده مسجل قبل كده. ادخل من صفحة الدخول.');
      return;
    }
    const pin_hash = await sha256(pin);
    const now = new Date().toISOString();
    const payload = {
      name, phone, grade_level: grade, edu_system: edu, track: track || null,
      doctor_group: doctor || null,
      doctor_selected_at: doctor ? now : null,
      pin_hash, score: 0, xp: 0, level: 1,
      current_streak: 0, best_streak: 0,
      is_active: true, is_frozen: false,
      created_at: now, updated_at: now,
    };
    const { data: created, error } = await db
      .from('students')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    setCurrentStudent(created);
    showToast('تم إنشاء الحساب بنجاح 🎉', 'success');
    setTimeout(() => window.location.href = '/student/home.html', 1000);
  } catch (err) {
    showAlert('signupAlert', 'خطأ: ' + (err.message || 'unknown'));
  } finally {
    btn.disabled = false;
    btn.textContent = 'إنشاء الحساب';
  }
}

/* ---- LOAD DOCTOR GROUPS for signup select ---- */
async function loadDoctorGroupsSelect(selectId) {
  const sel = qs(`#${selectId}`);
  if (!sel) return;
  try {
    const db = window.supabaseClient;
    const { data } = await db
      .from('doctor_groups')
      .select('id, name, display_name')
      .eq('is_active', true)
      .eq('is_student_selectable', true)
      .order('sort_order');
    if (data) {
      data.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.name;
        opt.textContent = g.display_name || g.name;
        sel.appendChild(opt);
      });
    }
  } catch {}
}

/* ---- EDU/TRACK toggle on signup ---- */
function initSignupForm() {
  const eduSel   = qs('#sEdu');
  const trackWrap = qs('#trackWrap');
  function toggleTrack() {
    if (!trackWrap) return;
    const edu = eduSel ? eduSel.value : '';
    trackWrap.style.display = (edu === 'علمي' || edu === 'أدبي' || edu === 'other') ? 'block' : 'block';
  }
  if (eduSel) { eduSel.addEventListener('change', toggleTrack); toggleTrack(); }
  loadDoctorGroupsSelect('sDoctor');
  const form = qs('#signupForm');
  if (form) form.addEventListener('submit', handleSignup);
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = qs('#loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (qs('#signupForm')) initSignupForm();
});
