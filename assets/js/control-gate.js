// =========================================================
// Unified Control Gate - دوري المذاكراوية
// Phase 1 Patch
// Uses existing window.supabaseClient from /assets/js/supabase.js
// =========================================================
(function () {
  'use strict';

  const DEFAULT_CONTROL = {
    mahmoud: '2026',
    ziad: '9090',
    max_attempts: 5,
    lock_minutes: 10
  };

  const DEFAULT_SUPPORT = {
    url: 'https://t.me/Mahmoud_M_Hassan101BOT'
  };

  const KEYS = {
    attempts: 'control_attempts',
    lockedUntil: 'control_locked_until'
  };

  function qs(selector) {
    return document.querySelector(selector);
  }

  function getDb() {
    return window.supabaseClient || null;
  }

  function safeNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeSettingValue(value, fallback) {
    if (!value) return fallback;
    if (typeof value === 'object') return { ...fallback, ...value };
    if (typeof value === 'string') {
      try {
        return { ...fallback, ...JSON.parse(value) };
      } catch (_) {
        return fallback;
      }
    }
    return fallback;
  }

  async function loadAppSetting(key, fallback) {
    const db = getDb();
    if (!db) return fallback;

    try {
      const { data, error } = await db
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error || !data) return fallback;
      return normalizeSettingValue(data.value, fallback);
    } catch (_) {
      return fallback;
    }
  }

  function nowMs() {
    return Date.now();
  }

  function getAttempts() {
    return safeNumber(localStorage.getItem(KEYS.attempts), 0);
  }

  function setAttempts(value) {
    localStorage.setItem(KEYS.attempts, String(value));
  }

  function resetAttempts() {
    localStorage.removeItem(KEYS.attempts);
    localStorage.removeItem(KEYS.lockedUntil);
  }

  function getLockedUntil() {
    return safeNumber(localStorage.getItem(KEYS.lockedUntil), 0);
  }

  function isLocked() {
    const lockedUntil = getLockedUntil();
    if (!lockedUntil) return false;
    if (lockedUntil <= nowMs()) {
      resetAttempts();
      return false;
    }
    return true;
  }

  function lockForMinutes(minutes) {
    const ms = Math.max(1, safeNumber(minutes, DEFAULT_CONTROL.lock_minutes)) * 60 * 1000;
    localStorage.setItem(KEYS.lockedUntil, String(nowMs() + ms));
  }

  function minutesLeft() {
    const diff = getLockedUntil() - nowMs();
    return Math.max(1, Math.ceil(diff / 60000));
  }

  function showControlError(message) {
    const errorEl = qs('#controlGateError');
    if (errorEl) errorEl.textContent = message || '';
  }

  function setControlLoading(isLoading) {
    const btn = qs('#controlGateSubmit');
    if (!btn) return;
    btn.disabled = Boolean(isLoading);
    btn.textContent = isLoading ? 'جاري التحقق...' : 'دخول';
  }

  function openControlModal() {
    const modal = qs('#controlGateModal');
    const input = qs('#controlGateCode');
    showControlError('');
    if (modal) modal.classList.add('show');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 80);
    }
  }

  function closeControlModal() {
    const modal = qs('#controlGateModal');
    if (modal) modal.classList.remove('show');
    showControlError('');
  }

  async function findDoctorByCode(code) {
    const db = getDb();
    if (!db) return null;

    try {
      const { data, error } = await db
        .from('doctor_groups')
        .select('id, name, display_name, role, login_code, is_active')
        .eq('login_code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch (_) {
      return null;
    }
  }

  function goMahmoud() {
    localStorage.setItem('mahmoudAdminAccess', 'true');
    localStorage.setItem('mahmoud_admin_access', 'true');
    sessionStorage.setItem('admin_mahmoud_auth', 'true');
    window.location.href = '/admin-mahmoud/dashboard.html';
  }

  function goZiad() {
    localStorage.setItem('ziadAccess', 'true');
    window.location.href = '/ziad/dashboard.html';
  }

  function goDoctor(group) {
    localStorage.setItem('currentDoctorGroup', JSON.stringify(group));
    localStorage.setItem('doctor_group', group.name || '');
    window.location.href = '/doctor/dashboard.html';
  }

  async function handleControlLogin() {
    const input = qs('#controlGateCode');
    const code = (input && input.value ? input.value : '').trim();

    const settings = await loadAppSetting('control_codes', DEFAULT_CONTROL);
    const maxAttempts = safeNumber(settings.max_attempts, DEFAULT_CONTROL.max_attempts);
    const lockMinutes = safeNumber(settings.lock_minutes, DEFAULT_CONTROL.lock_minutes);
    const mahmoudCode = String(settings.mahmoud || DEFAULT_CONTROL.mahmoud);
    const ziadCode = String(settings.ziad || DEFAULT_CONTROL.ziad);

    if (isLocked()) {
      showControlError('تم إيقاف المحاولة مؤقتًا. حاول مرة أخرى بعد ' + minutesLeft() + ' دقيقة.');
      return;
    }

    if (!code) {
      showControlError('أدخل رمز الدخول أولًا.');
      return;
    }

    setControlLoading(true);
    showControlError('');

    try {
      if (code === mahmoudCode) {
        resetAttempts();
        goMahmoud();
        return;
      }

      if (code === ziadCode) {
        resetAttempts();
        goZiad();
        return;
      }

      const doctor = await findDoctorByCode(code);
      if (doctor) {
        resetAttempts();
        goDoctor(doctor);
        return;
      }

      const nextAttempts = getAttempts() + 1;
      setAttempts(nextAttempts);

      if (nextAttempts >= maxAttempts) {
        lockForMinutes(lockMinutes);
        showControlError('تم إيقاف المحاولة مؤقتًا بسبب محاولات كثيرة. حاول مرة أخرى بعد ' + lockMinutes + ' دقيقة.');
      } else {
        showControlError('رمز الدخول غير صحيح. المحاولات المتبقية: ' + (maxAttempts - nextAttempts));
      }
    } finally {
      setControlLoading(false);
    }
  }

  async function initSupportButton() {
    const support = await loadAppSetting('support_link', DEFAULT_SUPPORT);
    const url = support.url || DEFAULT_SUPPORT.url;

    document.querySelectorAll('[data-support-link]').forEach(function (link) {
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.title = 'دعم الموقع';
    });
  }

  function bindControlGate() {
    document.querySelectorAll('[data-open-control]').forEach(function (btn) {
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        openControlModal();
      });
    });

    document.querySelectorAll('[data-close-control]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeControlModal();
      });
    });

    const submit = qs('#controlGateSubmit');
    if (submit) submit.addEventListener('click', handleControlLogin);

    const input = qs('#controlGateCode');
    if (input) {
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') handleControlLogin();
        if (event.key === 'Escape') closeControlModal();
      });
    }

    const modal = qs('#controlGateModal');
    if (modal) {
      modal.addEventListener('click', function (event) {
        if (event.target === modal) closeControlModal();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindControlGate();
    initSupportButton();
  });

  window.openControlModal = openControlModal;
  window.closeControlModal = closeControlModal;
  window.handleControlLogin = handleControlLogin;
})();
