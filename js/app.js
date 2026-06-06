/* EyeBody Demo App — app.js */

// ── Constants ─────────────────────────────────────────────
const TODAY = '2026-06-06';
const TODAY_D = new Date(2026, 5, 6);

const TREATMENTS = [
  { key: 'atropine',  name: '아트로핀 점안',  time: '취침 전 1회',  tag: 'atropine',  tagLabel: '' },
  { key: 'dreamlens', name: '드림렌즈 착용',   time: '취침 시',       tag: 'dreamlens', tagLabel: '' }
];

// Demo seed exam records (pre-existing history)
const SEED_EXAMS = [
  { date:'2026-05-12', clinic:'한빛안과의원', axOD:'24.82', axOS:'24.91', serOD:'-3.25', serOS:'-3.50', note:'' },
  { date:'2026-02-18', clinic:'한빛안과의원', axOD:'24.68', axOS:'24.75', serOD:'-3.00', serOS:'-3.25', note:'' },
  { date:'2025-11-05', clinic:'한빛안과의원', axOD:'24.54', axOS:'24.59', serOD:'-2.75', serOS:'-3.00', note:'' },
  { date:'2025-08-12', clinic:'한빛안과의원', axOD:'24.48', axOS:'24.55', serOD:'-2.75', serOS:'-3.00', note:'' },
];

// Demo seed lifestyle data (last 7 days before today)
const SEED_LIFESTYLE = {
  '2026-05-30': { outdoor:1.2, phone:2.5, sleep:9.0 },
  '2026-05-31': { outdoor:2.1, phone:1.8, sleep:8.5 },
  '2026-06-01': { outdoor:1.8, phone:3.0, sleep:9.5 },
  '2026-06-02': { outdoor:0.5, phone:4.2, sleep:8.0 },
  '2026-06-03': { outdoor:2.0, phone:2.0, sleep:9.0 },
  '2026-06-04': { outdoor:1.5, phone:2.8, sleep:9.5 },
  '2026-06-05': { outdoor:1.3, phone:2.6, sleep:9.0 },
};

// Missed days for seeded compliance data
const SEED_MISSED = new Set([
  '2025-09-03','2025-09-15','2025-09-28',
  '2025-10-07','2025-10-19','2025-10-31',
  '2025-11-02','2025-11-21','2025-11-30',
  '2025-12-05','2025-12-12','2025-12-24','2025-12-25',
  '2026-01-01','2026-01-17','2026-01-28',
  '2026-02-08','2026-02-22',
  '2026-03-10','2026-03-27',
  '2026-04-05','2026-04-19',
  '2026-05-08','2026-05-23','2026-05-30',
  '2026-06-02',
]);

// ── Storage ────────────────────────────────────────────────
function load(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function initDemoData() {
  if (load('eb_init')) return;

  // Treatment logs: seed from Sep 2025 to Jun 5 2026
  const logs = {};
  const start = new Date(2025, 8, 1);
  const end   = new Date(2026, 5, 5);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const k = fmtDate(d);
    const missed = SEED_MISSED.has(k);
    logs[k] = { atropine: !missed, dreamlens: !missed };
  }
  save('eb_logs', logs);
  save('eb_exams', SEED_EXAMS);
  save('eb_lifestyle', SEED_LIFESTYLE);
  save('eb_init', true);
}

// ── Date helpers ───────────────────────────────────────────
function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function korDate(d) {
  return d.toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'short' });
}

// ── Navigation ─────────────────────────────────────────────
const PAGES   = ['pageHome','pageRecords','pageAnalytics','pageSettings'];
const NAV_IDS = ['navHome','navRecords','navAnalytics','navSettings'];

function navigate(pageId) {
  PAGES.forEach(id => document.getElementById(id).classList.remove('active'));
  NAV_IDS.forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  document.getElementById(NAV_IDS[PAGES.indexOf(pageId)]).classList.add('active');
  document.querySelector('.page-wrap').scrollTop = 0;

  if (pageId === 'pageAnalytics') initAnalyticsCharts();
  if (pageId === 'pageRecords')   { renderExamList(); initLifestyleCharts(); }
}

function jumpToCalendar() {
  const btn = document.getElementById('tabBtnTreatment');
  if (btn) switchTab(btn, 'tabTreatment');
}

// ── Tab switching ──────────────────────────────────────────
function switchTab(btn, panelId) {
  const bar = btn.closest('.tab-bar');
  bar.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  btn.closest('.page').querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');

  if (panelId === 'tabTreatment')  renderCalendar();
  if (panelId === 'tabLifestyle')  initLifestyleCharts();
  if (panelId === 'tabAxial')      drawAxialChart();
  if (panelId === 'tabSer')        drawSerChart();
  if (panelId === 'tabCompliance') drawComplianceChart();
}

// ── Modals ─────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(el =>
  el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); })
);

// ── Toast ──────────────────────────────────────────────────
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

// ── Today's treatments (Home) ──────────────────────────────
function renderTodayTreatments() {
  const logs = load('eb_logs', {});
  const todayLog = logs[TODAY] || { atropine: false, dreamlens: false };
  const container = document.getElementById('todayTreatments');
  if (!container) return;

  container.innerHTML = TREATMENTS.map(t => {
    const done = todayLog[t.key] || false;
    return `
      <div class="treatment-item ${done ? 'done' : 'pending'}" id="ti-${t.key}">
        <span class="check-circle ${done ? 'done' : 'pending'}" onclick="toggleTodayTreatment('${t.key}')">
          ${done ? '✓' : '○'}
        </span>
        <div>
          <div class="t-name">${t.name}</div>
          <div class="t-time">${t.time}</div>
        </div>
        <span class="t-tag ${t.tag}" id="ttag-${t.key}">${done ? '완료' : '미완료'}</span>
      </div>`;
  }).join('');
}

function toggleTodayTreatment(key) {
  const logs = load('eb_logs', {});
  if (!logs[TODAY]) logs[TODAY] = { atropine: false, dreamlens: false };
  logs[TODAY][key] = !logs[TODAY][key];
  save('eb_logs', logs);
  renderTodayTreatments();
  renderHomeCompliance();
  showToast(logs[TODAY][key] ? '치료 완료로 표시했습니다' : '완료 취소했습니다');
}

// ── Home compliance (streak + week strip + %) ──────────────
function calcCompliance(logs) {
  const start = new Date(2025, 8, 1);
  let done = 0, total = 0;
  for (let d = new Date(start); d <= TODAY_D; d.setDate(d.getDate() + 1)) {
    const k = fmtDate(d);
    const log = logs[k] || {};
    const allDone = TREATMENTS.every(t => log[t.key]);
    if (allDone) done++;
    total++;
  }
  return total > 0 ? Math.round(done / total * 100) : 0;
}

function calcMonthCompliance(logs, year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lastDay = (year === TODAY_D.getFullYear() && month === TODAY_D.getMonth())
    ? TODAY_D.getDate() : daysInMonth;
  let done = 0;
  for (let d = 1; d <= lastDay; d++) {
    const k = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const log = logs[k] || {};
    if (TREATMENTS.every(t => log[t.key])) done++;
  }
  return lastDay > 0 ? Math.round(done / lastDay * 100) : 0;
}

function calcStreak(logs) {
  let streak = 0;
  const d = new Date(TODAY_D);
  while (true) {
    const k = fmtDate(d);
    const log = logs[k] || {};
    if (!TREATMENTS.every(t => log[t.key])) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function renderHomeCompliance() {
  const logs = load('eb_logs', {});
  const streak = calcStreak(logs);
  const monthPct = calcMonthCompliance(logs, TODAY_D.getFullYear(), TODAY_D.getMonth());
  const totalPct = calcCompliance(logs);

  const streakRow = document.getElementById('streakRow');
  if (streakRow) {
    streakRow.innerHTML = `
      <div class="streak-item">
        <div class="streak-num ${streak >= 7 ? 'good' : ''}">${streak}일</div>
        <div class="streak-label">🔥 연속 달성</div>
      </div>
      <div class="streak-divider"></div>
      <div class="streak-item">
        <div class="streak-num">${monthPct}%</div>
        <div class="streak-label">이번 달</div>
      </div>
      <div class="streak-divider"></div>
      <div class="streak-item">
        <div class="streak-num">${totalPct}%</div>
        <div class="streak-label">누적 평균</div>
      </div>`;
  }

  // 7-day strip
  const strip = document.getElementById('weekStrip');
  if (strip) {
    const days = ['일','월','화','수','목','금','토'];
    let html = '';
    for (let i = 6; i >= 0; i--) {
      const d = new Date(TODAY_D);
      d.setDate(d.getDate() - i);
      const k = fmtDate(d);
      const log = logs[k] || {};
      const allDone = TREATMENTS.every(t => log[t.key]);
      const anyDone = TREATMENTS.some(t => log[t.key]);
      const isFuture = d > TODAY_D;
      let cls = isFuture ? 'future' : allDone ? 'done' : anyDone ? 'partial' : 'missed';
      const isToday = k === TODAY;
      html += `<div class="strip-day ${isToday ? 'strip-today' : ''}">
        <div class="strip-label">${days[d.getDay()]}</div>
        <div class="strip-dot ${cls}">${allDone ? '✓' : anyDone ? '△' : isFuture ? '' : '✕'}</div>
        <div class="strip-num">${d.getDate()}</div>
      </div>`;
    }
    strip.innerHTML = html;
  }
}

function renderHomeLifestyle() {
  const lifestyle = load('eb_lifestyle', {});
  const todayLife = lifestyle[TODAY];
  const container = document.getElementById('homeLifestyle');
  if (!container) return;

  if (todayLife) {
    const phoneClass = todayLife.phone <= 2 ? 'good' : todayLife.phone <= 3 ? 'warn' : 'bad';
    const outdoorClass = todayLife.outdoor >= 2 ? 'good' : todayLife.outdoor >= 1 ? 'warn' : 'bad';
    container.innerHTML = `
      <div class="lifestyle-item">
        <div class="life-icon">📱</div>
        <div class="life-label">스마트폰</div>
        <div class="life-value ${phoneClass}">${todayLife.phone}h</div>
      </div>
      <div class="lifestyle-item">
        <div class="life-icon">🌳</div>
        <div class="life-label">야외활동</div>
        <div class="life-value ${outdoorClass}">${todayLife.outdoor}h</div>
      </div>
      <div class="lifestyle-item">
        <div class="life-icon">😴</div>
        <div class="life-label">수면</div>
        <div class="life-value good">${todayLife.sleep}h</div>
      </div>`;
  } else {
    container.innerHTML = `
      <div class="no-data-row">
        <span>오늘 기록이 없습니다</span>
        <button class="small-btn" onclick="openModal('lifeModal')">기록하기</button>
      </div>`;
  }
}

// ── Calendar ───────────────────────────────────────────────
let calYear  = TODAY_D.getFullYear();
let calMonth = TODAY_D.getMonth();

function changeMonth(delta) {
  calMonth += delta;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  renderCalendar();
}

function getDayStatus(logs, dateStr) {
  const d = parseDate(dateStr);
  if (d > TODAY_D) return 'future';
  const log = logs[dateStr] || {};
  const done = TREATMENTS.filter(t => log[t.key]).length;
  if (done === TREATMENTS.length) return 'done';
  if (done > 0) return 'partial';
  return 'missed';
}

function renderCalendar() {
  const logs = load('eb_logs', {});
  const title = document.getElementById('calTitle');
  if (title) title.textContent = `${calYear}년 ${calMonth + 1}월`;

  const grid = document.getElementById('calGrid');
  if (!grid) return;

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  let html = '';
  // empty cells before first day
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const status  = getDayStatus(logs, dateStr);
    const isToday = dateStr === TODAY;
    const isFuture = status === 'future';
    const onclick = isFuture ? '' : `onclick="openDayModal('${dateStr}')"`;
    html += `<div class="cal-day ${status} ${isToday ? 'cal-today' : ''}" ${onclick}>
      <span class="cal-day-num">${d}</span>
      <span class="cal-day-icon">${status==='done'?'✓':status==='partial'?'△':status==='missed'?'✕':''}</span>
    </div>`;
  }

  grid.innerHTML = html;
  renderCalStats(logs);
}

function renderCalStats(logs) {
  const statsEl = document.getElementById('calStats');
  if (!statsEl) return;
  const lastDay = (calYear === TODAY_D.getFullYear() && calMonth === TODAY_D.getMonth())
    ? TODAY_D.getDate() : new Date(calYear, calMonth + 1, 0).getDate();
  let done = 0, partial = 0, missed = 0;
  for (let d = 1; d <= lastDay; d++) {
    const k = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const s = getDayStatus(logs, k);
    if (s === 'done') done++;
    else if (s === 'partial') partial++;
    else if (s === 'missed') missed++;
  }
  const pct = lastDay > 0 ? Math.round(done / lastDay * 100) : 0;
  statsEl.innerHTML = `
    <div class="cal-stat-row">
      <div class="cal-stat"><span class="cst-num good">${done}일</span><span class="cst-label">완료</span></div>
      <div class="cal-stat"><span class="cst-num partial">${partial}일</span><span class="cst-label">부분</span></div>
      <div class="cal-stat"><span class="cst-num missed">${missed}일</span><span class="cst-label">미완료</span></div>
      <div class="cal-stat"><span class="cst-num primary">${pct}%</span><span class="cst-label">순응도</span></div>
    </div>`;
}

function openDayModal(dateStr) {
  const logs  = load('eb_logs', {});
  const log   = logs[dateStr] || {};
  const d     = parseDate(dateStr);
  const title = document.getElementById('dayModalTitle');
  const body  = document.getElementById('dayModalBody');
  if (title) title.textContent = korDate(d);
  if (body) {
    body.innerHTML = TREATMENTS.map(t => {
      const done = log[t.key] || false;
      return `
        <div class="day-modal-row">
          <span class="day-modal-name">${t.name}</span>
          <label class="toggle">
            <input type="checkbox" ${done ? 'checked' : ''} onchange="toggleDayTreatment('${dateStr}','${t.key}',this.checked)" />
            <span class="slider"></span>
          </label>
        </div>`;
    }).join('');
  }
  openModal('dayModal');
}

function toggleDayTreatment(dateStr, key, value) {
  const logs = load('eb_logs', {});
  if (!logs[dateStr]) logs[dateStr] = {};
  logs[dateStr][key] = value;
  save('eb_logs', logs);
  renderCalendar();
  if (dateStr === TODAY) { renderTodayTreatments(); renderHomeCompliance(); }
  showToast('기록이 업데이트되었습니다');
}

// ── Exam records ───────────────────────────────────────────
function renderExamList() {
  const exams = load('eb_exams', []);
  const container = document.getElementById('examList');
  if (!container) return;

  if (!exams.length) {
    container.innerHTML = '<div class="empty-state">검사기록이 없습니다.<br>+ 기록 추가 버튼을 눌러 첫 기록을 입력해보세요.</div>';
    return;
  }

  const sorted = [...exams].sort((a, b) => b.date.localeCompare(a.date));
  container.innerHTML = sorted.map(e => `
    <div class="record-card">
      <div class="rec-header">
        <span class="rec-date">${e.date}</span>
        <span class="rec-clinic">${e.clinic || '—'}</span>
      </div>
      <div class="rec-body">
        ${e.axOD || e.axOS ? `<div class="rec-row"><span class="rec-label">안축장 (OD/OS)</span><span class="rec-val">${e.axOD||'—'} / ${e.axOS||'—'} mm</span></div>` : ''}
        ${e.serOD || e.serOS ? `<div class="rec-row"><span class="rec-label">SER (OD/OS)</span><span class="rec-val">${e.serOD||'—'} / ${e.serOS||'—'} D</span></div>` : ''}
        ${e.note ? `<div class="rec-row"><span class="rec-label">메모</span><span class="rec-val">${e.note}</span></div>` : ''}
      </div>
    </div>`).join('');
}

function saveExamRecord() {
  const date   = document.getElementById('examDate').value;
  const clinic = document.getElementById('examClinic').value;
  const axOD   = document.getElementById('examAxOD').value;
  const axOS   = document.getElementById('examAxOS').value;
  const serOD  = document.getElementById('examSerOD').value;
  const serOS  = document.getElementById('examSerOS').value;
  const note   = document.getElementById('examNote').value;

  if (!date) { showToast('검사일을 입력해주세요'); return; }

  const exams = load('eb_exams', []);
  exams.push({ date, clinic, axOD, axOS, serOD, serOS, note });
  save('eb_exams', exams);
  closeModal('examModal');
  renderExamList();
  showToast('검사기록이 저장되었습니다');

  // clear form
  ['examDate','examClinic','examAxOD','examAxOS','examSerOD','examSerOS','examNote']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

// ── Lifestyle records ──────────────────────────────────────
function saveLifestyleRecord() {
  const date    = document.getElementById('lifeDate').value;
  const outdoor = document.getElementById('lifeOutdoor').value;
  const phone   = document.getElementById('lifePhone').value;
  const sleep   = document.getElementById('lifeSleep').value;

  if (!date) { showToast('날짜를 입력해주세요'); return; }

  const lifestyle = load('eb_lifestyle', {});
  lifestyle[date] = {
    outdoor: parseFloat(outdoor) || 0,
    phone:   parseFloat(phone)   || 0,
    sleep:   parseFloat(sleep)   || 0,
  };
  save('eb_lifestyle', lifestyle);
  closeModal('lifeModal');
  renderHomeLifestyle();
  initLifestyleCharts();
  showToast('생활습관이 저장되었습니다');
}

// ── Lifestyle charts ───────────────────────────────────────
function initLifestyleCharts() {
  const lifestyle = load('eb_lifestyle', {});
  const labels = [], outdoorData = [], phoneData = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(TODAY_D);
    d.setDate(d.getDate() - i);
    const k = fmtDate(d);
    labels.push(`${d.getMonth()+1}/${d.getDate()}`);
    const l = lifestyle[k] || {};
    outdoorData.push(l.outdoor ?? null);
    phoneData.push(l.phone ?? null);
  }

  makeChart('outdoorChart', 'bar', labels, [{
    data: outdoorData,
    backgroundColor: outdoorData.map(v => v === null ? '#E5E7EB' : v >= 2 ? '#10B981' : '#F59E0B'),
    borderRadius: 6, borderSkipped: false
  }], { scales: { x: { grid:{display:false} }, y: { min:0, max:5, ticks:{callback:v=>v+'h'} } } });

  makeChart('phoneChart', 'bar', labels, [{
    data: phoneData,
    backgroundColor: phoneData.map(v => v === null ? '#E5E7EB' : v <= 2 ? '#10B981' : v <= 3 ? '#F59E0B' : '#EF4444'),
    borderRadius: 6, borderSkipped: false
  }], { scales: { x: { grid:{display:false} }, y: { min:0, max:6, ticks:{callback:v=>v+'h'} } } });
}

// ── Analytics charts ───────────────────────────────────────
const examDates = ['2024-08','2024-11','2025-02','2025-05','2025-08','2025-11','2026-02','2026-05'];
const axialOD   = [24.10,24.22,24.36,24.48,24.54,24.61,24.68,24.82];
const axialOS   = [24.18,24.30,24.42,24.55,24.59,24.67,24.75,24.91];
const serOD     = [-2.00,-2.25,-2.50,-2.75,-2.75,-3.00,-3.00,-3.25];
const serOS     = [-2.25,-2.50,-2.75,-3.00,-3.00,-3.25,-3.25,-3.50];

function drawAxialChart() {
  makeChart('axialChart','line', examDates,[
    {label:'우안',data:axialOD,borderColor:'#3B82F6',backgroundColor:'rgba(59,130,246,.1)',tension:.4,fill:true,pointRadius:4},
    {label:'좌안',data:axialOS,borderColor:'#F97316',backgroundColor:'rgba(249,115,22,.08)',tension:.4,fill:true,pointRadius:4}
  ],{ scales:{
    x:{grid:{display:false},ticks:{font:{size:10}}},
    y:{min:23.8,max:25.2,ticks:{callback:v=>v.toFixed(2)+' mm'}}
  }});
}

function drawSerChart() {
  makeChart('serChart','line', examDates,[
    {label:'우안',data:serOD,borderColor:'#3B82F6',tension:.4,fill:false,pointRadius:4},
    {label:'좌안',data:serOS,borderColor:'#F97316',tension:.4,fill:false,pointRadius:4}
  ],{ scales:{
    x:{grid:{display:false},ticks:{font:{size:10}}},
    y:{ticks:{callback:v=>v+' D'}}
  }});
}

function drawComplianceChart() {
  const logs = load('eb_logs', {});
  const labels = [], data = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(TODAY_D.getFullYear(), TODAY_D.getMonth() - i, 1);
    labels.push(`${d.getMonth()+1}월`);
    data.push(calcMonthCompliance(logs, d.getFullYear(), d.getMonth()));
  }

  makeChart('complianceChart','bar', labels,[{
    data,
    backgroundColor: data.map(v => v>=90?'#10B981':v>=80?'#3B82F6':'#F59E0B'),
    borderRadius:6, borderSkipped:false
  }],{ scales:{
    x:{grid:{display:false}},
    y:{min:60,max:100,ticks:{callback:v=>v+'%'}}
  }});

  const summary = document.getElementById('complianceSummary');
  if (summary) {
    const avg3 = Math.round(data.slice(-3).reduce((a,b)=>a+b,0)/3);
    const avgAll = Math.round(data.reduce((a,b)=>a+b,0)/data.length);
    summary.innerHTML = `
      <div class="cs-item"><div class="cs-val">${data[data.length-1]}%</div><div class="cs-label">이번 달</div></div>
      <div class="cs-item"><div class="cs-val">${avg3}%</div><div class="cs-label">3개월 평균</div></div>
      <div class="cs-item"><div class="cs-val">${avgAll}%</div><div class="cs-label">6개월 평균</div></div>`;
  }
}

function initAnalyticsCharts() {
  drawAxialChart();
  drawComplianceChart();
}

// ── Chart factory ──────────────────────────────────────────
const chartInst = {};
function makeChart(id, type, labels, datasets, opts={}) {
  if (chartInst[id]) { chartInst[id].destroy(); delete chartInst[id]; }
  const ctx = document.getElementById(id);
  if (!ctx) return;
  chartInst[id] = new Chart(ctx, {
    type, data: { labels, datasets },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: { grid: { color: '#F3F4F6' }, ticks: { font: { size: 11 } } }
      },
      ...opts
    }
  });
}

// ── Reset demo data ────────────────────────────────────────
function confirmReset() {
  if (confirm('데모 데이터를 초기화하시겠습니까?')) {
    ['eb_logs','eb_exams','eb_lifestyle','eb_init'].forEach(k => localStorage.removeItem(k));
    showToast('초기화되었습니다. 페이지를 새로고침합니다.');
    setTimeout(() => location.reload(), 1500);
  }
}

// ── Init ───────────────────────────────────────────────────
function init() {
  // Set today's date label
  const el = document.getElementById('todayDate');
  if (el) el.textContent = korDate(TODAY_D);

  // Set default dates in modals
  const examDate = document.getElementById('examDate');
  if (examDate) examDate.value = TODAY;
  const lifeDate = document.getElementById('lifeDate');
  if (lifeDate) lifeDate.value = TODAY;

  initDemoData();
  renderTodayTreatments();
  renderHomeCompliance();
  renderHomeLifestyle();
}

init();
