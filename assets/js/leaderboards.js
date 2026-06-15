/* ===== LEADERBOARDS.JS — دوري المذاكراوية ===== */

async function loadLeaderboardTab(tabKey) {
  const student = getCurrentStudent();
  const container = qs(`#lb-${tabKey}`);
  if (!container) return;
  container.innerHTML = loadingHtml();
  const db = window.supabaseClient;

  try {
    let data, nameField, valueField, valueSuffix;
    switch (tabKey) {
      case 'general':
        ({ data } = await db.from('v_leaderboard_general').select('*').order('rank_position').limit(50));
        nameField = 'student_name'; valueField = 'total_score'; valueSuffix = 'نقطة';
        break;
      case 'questions':
        ({ data } = await db.from('v_leaderboard_questions').select('*').order('rank_position').limit(50));
        nameField = 'student_name'; valueField = 'total_questions'; valueSuffix = 'سؤال';
        break;
      case 'focus':
        ({ data } = await db.from('v_leaderboard_focus').select('*').order('rank_position').limit(50));
        nameField = 'student_name'; valueField = 'operation_minutes'; valueSuffix = 'دقيقة';
        break;
      case 'persistent':
        ({ data } = await db.from('v_leaderboard_persistent').select('*').order('rank_position').limit(50));
        nameField = 'student_name'; valueField = 'total_study_hours'; valueSuffix = 'ساعة';
        break;
      case 'quiz':
        ({ data } = await db.from('quiz_grades').select('student_name, score').order('score', { ascending: false }).limit(50));
        nameField = 'student_name'; valueField = 'score'; valueSuffix = 'درجة';
        break;
    }
    if (!data || !data.length) { container.innerHTML = emptyHtml('لا يوجد بيانات بعد'); return; }

    const medals = ['🥇', '🥈', '🥉'];
    container.innerHTML = `<div class="lb-table">` +
      data.map((row, i) => {
        const isMe = student && row.student_id === student.id;
        return `
        <div class="lb-row ${isMe ? 'lb-row-me' : ''}">
          <span class="lb-rank">${medals[i] || (i + 1)}</span>
          <span class="lb-name">${safeText(row[nameField])}</span>
          <span class="lb-value">${formatNumber(row[valueField])} ${valueSuffix}</span>
        </div>`;
      }).join('') + `</div>`;
  } catch (err) {
    container.innerHTML = emptyHtml('خطأ في التحميل: ' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (qs('#leaderboardsPage')) {
    requireStudentAuth();
    setActiveNav('/student/leaderboards.html');
    initNavToggle();
    initTabs('#lbTabs', loadLeaderboardTab);
  }
});
