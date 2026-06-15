/* ===== XP.JS — دوري المذاكراوية ===== */

async function addXpTransaction(studentId, source, amount, note, seasonId) {
  if (!amount || amount <= 0) return;
  try {
    const db = window.supabaseClient;
    await db.from('xp_transactions').insert({
      student_id: studentId,
      source,
      amount,
      note: note || null,
      season_id: seasonId || null,
      created_at: new Date().toISOString(),
    });
    // upsert student_xp
    const { data: xpRow } = await db
      .from('student_xp')
      .select('xp_total')
      .eq('student_id', studentId)
      .maybeSingle();
    const current = safeNum(xpRow?.xp_total);
    const newTotal = current + amount;
    const lvl = getXpLevel(newTotal);
    await db.from('student_xp').upsert({
      student_id: studentId,
      xp_total: newTotal,
      level: lvl.level,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_id' });
  } catch (err) {
    console.warn('XP transaction failed', err);
  }
}

async function getStudentXp(studentId) {
  try {
    const db = window.supabaseClient;
    const { data } = await db
      .from('student_xp')
      .select('xp_total, level')
      .eq('student_id', studentId)
      .maybeSingle();
    return data || { xp_total: 0, level: 1 };
  } catch {
    return { xp_total: 0, level: 1 };
  }
}

function renderXpBar(xp, containerId) {
  const c = qs(`#${containerId}`);
  if (!c) return;
  const lvl = getXpLevel(xp);
  const range = lvl.max === Infinity ? xp - lvl.min : lvl.max - lvl.min;
  const progress = lvl.max === Infinity ? 100 : Math.min(100, ((xp - lvl.min) / range) * 100);
  c.innerHTML = `
    <div class="xp-label">
      <span class="xp-level-name">${lvl.name}</span>
      <span class="xp-total">${formatNumber(xp)} XP</span>
    </div>
    <div class="xp-bar-track">
      <div class="xp-bar-fill" style="width:${progress}%"></div>
    </div>
    <div class="xp-sublabel">مستوى ${lvl.level} / 5</div>
  `;
}
