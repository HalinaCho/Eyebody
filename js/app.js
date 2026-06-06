/* EyeBody Demo App — app.js */

// ── Constants ─────────────────────────────────────────────
const TODAY   = '2026-06-06';
const TODAY_D = new Date(2026, 5, 6);

const TREATMENTS = [
  { key:'atropine',  name:'아트로핀 점안', time:'취침 전 1회', tag:'atropine'  },
  { key:'dreamlens', name:'드림렌즈 착용',  time:'취침 시',     tag:'dreamlens' }
];

// Seed data (attached to default child c1)
const SEED_EXAMS = [
  { date:'2026-05-12', clinic:'한빛안과의원', axOD:'24.82', axOS:'24.91', serOD:'-3.25', serOS:'-3.50', note:'' },
  { date:'2026-02-18', clinic:'한빛안과의원', axOD:'24.68', axOS:'24.75', serOD:'-3.00', serOS:'-3.25', note:'' },
  { date:'2025-11-05', clinic:'한빛안과의원', axOD:'24.54', axOS:'24.59', serOD:'-2.75', serOS:'-3.00', note:'' },
  { date:'2025-08-12', clinic:'한빛안과의원', axOD:'24.48', axOS:'24.55', serOD:'-2.75', serOS:'-3.00', note:'' },
  { date:'2025-05-08', clinic:'한빛안과의원', axOD:'24.36', axOS:'24.42', serOD:'-2.50', serOS:'-2.75', note:'' },
  { date:'2025-02-15', clinic:'한빛안과의원', axOD:'24.22', axOS:'24.30', serOD:'-2.25', serOS:'-2.50', note:'' },
  { date:'2024-11-10', clinic:'한빛안과의원', axOD:'24.10', axOS:'24.18', serOD:'-2.00', serOS:'-2.25', note:'' },
];
const SEED_LIFESTYLE = {
  '2026-05-30':{ outdoor:1.2, phone:2.5, sleep:9.0 },
  '2026-05-31':{ outdoor:2.1, phone:1.8, sleep:8.5 },
  '2026-06-01':{ outdoor:1.8, phone:3.0, sleep:9.5 },
  '2026-06-02':{ outdoor:0.5, phone:4.2, sleep:8.0 },
  '2026-06-03':{ outdoor:2.0, phone:2.0, sleep:9.0 },
  '2026-06-04':{ outdoor:1.5, phone:2.8, sleep:9.5 },
  '2026-06-05':{ outdoor:1.3, phone:2.6, sleep:9.0 },
};
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

// ── Global storage ─────────────────────────────────────────
function load(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ── Child-namespaced storage ───────────────────────────────
let activeChildId = null;
function loadC(key, fallback = null) { return load(`${key}_${activeChildId}`, fallback); }
function saveC(key, val)             { save(`${key}_${activeChildId}`, val); }

// ── Child management ───────────────────────────────────────
function getChildren()    { return load('eb_children', []); }
function saveChildren(ch) { save('eb_children', ch); }
function getActiveChild() { return getChildren().find(c => c.id === activeChildId) || null; }
function avatar(gender)   { return gender === 'F' ? '👧' : '👦'; }

function calcAgeLabel(birth) {
  const [y, m, d] = birth.split('-').map(Number);
  const ms = TODAY_D - new Date(y, m - 1, d);
  return `만 ${Math.floor(ms / (365.25 * 864e5))}세`;
}

// One-time migration: old flat keys → namespaced under 'c1'
function migrateData() {
  if (load('eb_children')) return;
  const c1 = { id:'c1', name:'김민준', birth:'2017-03-15', gender:'M' };
  ['eb_logs','eb_exams','eb_lifestyle','eb_init'].forEach(k => {
    const v = localStorage.getItem(k);
    if (v !== null) { localStorage.setItem(`${k}_c1`, v); localStorage.removeItem(k); }
  });
  saveChildren([c1]);
  save('eb_active', 'c1');
}

function initDemoData() {
  if (loadC('eb_init')) return;
  const logs = {};
  const start = new Date(2025, 8, 1);
  const end   = new Date(2026, 5, 5);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const k = fmtDate(d);
    const missed = SEED_MISSED.has(k);
    logs[k] = { atropine: !missed, dreamlens: !missed };
  }
  saveC('eb_logs',      logs);
  saveC('eb_exams',     SEED_EXAMS);
  saveC('eb_lifestyle', SEED_LIFESTYLE);
  saveC('eb_init',      true);
}

// ── Child selector UI ──────────────────────────────────────
let dropdownOpen = false;

function toggleChildDropdown() {
  dropdownOpen = !dropdownOpen;
  document.getElementById('childDropdown').classList.toggle('open', dropdownOpen);
  document.getElementById('dropdownBackdrop').classList.toggle('open', dropdownOpen);
}
function closeChildDropdown() {
  dropdownOpen = false;
  document.getElementById('childDropdown').classList.remove('open');
  document.getElementById('dropdownBackdrop').classList.remove('open');
}

function renderChildDropdown() {
  const el = document.getElementById('childDropdown');
  if (!el) return;
  const children = getChildren();
  el.innerHTML = children.map(c => `
    <div class="cd-item ${c.id === activeChildId ? 'cd-active' : ''}" onclick="switchChild('${c.id}')">
      <span class="cd-av">${avatar(c.gender)}</span>
      <div class="cd-info">
        <div class="cd-name">${c.name}</div>
        <div class="cd-age">${calcAgeLabel(c.birth)}</div>
      </div>
      ${c.id === activeChildId ? '<span class="cd-check">✓</span>' : ''}
    </div>`).join('') +
    `<div class="cd-add" onclick="closeChildDropdown();openAddChildModal()">
      <span>➕</span> 자녀 추가
    </div>`;
}

function updateHeaderName() {
  const child = getActiveChild();
  const el = document.getElementById('childSelectorName');
  if (el && child) el.textContent = child.name;
}

function switchChild(id) {
  activeChildId = id;
  save('eb_active', id);
  initDemoData();
  closeChildDropdown();
  updateHeaderName();
  renderChildDropdown();
  renderAll();
  showToast(`${getActiveChild()?.name || ''} 데이터로 전환했습니다`);
}

// ── Child form (add / edit) ────────────────────────────────
let editingChildId = null;

function openAddChildModal() {
  editingChildId = null;
  document.getElementById('childFormTitle').textContent = '자녀 추가';
  document.getElementById('childFormName').value  = '';
  document.getElementById('childFormBirth').value = '';
  document.getElementById('childFormGender').value = 'M';
  openModal('childFormModal');
}

function openEditChildModal(id) {
  const child = getChildren().find(c => c.id === id);
  if (!child) return;
  editingChildId = id;
  document.getElementById('childFormTitle').textContent = '자녀 수정';
  document.getElementById('childFormName').value   = child.name;
  document.getElementById('childFormBirth').value  = child.birth;
  document.getElementById('childFormGender').value = child.gender;
  openModal('childFormModal');
}

function saveChildForm() {
  const name   = document.getElementById('childFormName').value.trim();
  const birth  = document.getElementById('childFormBirth').value;
  const gender = document.getElementById('childFormGender').value;
  if (!name)  { showToast('이름을 입력해주세요'); return; }
  if (!birth) { showToast('생년월일을 입력해주세요'); return; }

  const children = getChildren();
  if (editingChildId) {
    const idx = children.findIndex(c => c.id === editingChildId);
    if (idx >= 0) children[idx] = { ...children[idx], name, birth, gender };
    saveChildren(children);
    if (editingChildId === activeChildId) { updateHeaderName(); renderChildDropdown(); }
    showToast('수정되었습니다');
  } else {
    const id = 'c' + String(Date.now()).slice(-8);
    children.push({ id, name, birth, gender });
    saveChildren(children);
    closeModal('childFormModal');
    switchChild(id);
    showToast(`${name} 등록 완료`);
    renderSettingsChildren();
    return;
  }
  closeModal('childFormModal');
  renderSettingsChildren();
  renderSettingsProfile();
}

function confirmDeleteChild(id, name) {
  if (!confirm(`${name}을(를) 삭제하시겠습니까?\n모든 기록이 함께 삭제됩니다.`)) return;
  const children = getChildren().filter(c => c.id !== id);
  saveChildren(children);
  ['eb_logs','eb_exams','eb_lifestyle','eb_init'].forEach(k => localStorage.removeItem(`${k}_${id}`));
  if (activeChildId === id && children.length > 0) switchChild(children[0].id);
  renderSettingsChildren();
  renderSettingsProfile();
  showToast(`${name} 삭제 완료`);
}

function renderSettingsProfile() {
  const el = document.getElementById('settingsProfile');
  if (!el) return;
  const child = getActiveChild();
  if (!child) return;
  el.innerHTML = `
    <div class="profile-avatar">${avatar(child.gender)}</div>
    <div>
      <div class="profile-name">${child.name}</div>
      <div class="profile-sub">${calcAgeLabel(child.birth)} · ${child.birth}</div>
    </div>
    <button class="small-btn" onclick="openEditChildModal('${child.id}')">편집</button>`;
}

function renderSettingsChildren() {
  const el = document.getElementById('childrenList');
  if (!el) return;
  const children = getChildren();
  el.innerHTML = children.map(c => `
    <div class="sg-item child-list-item">
      <span class="cd-av">${avatar(c.gender)}</span>
      <div style="flex:1">
        <div style="font-weight:700;font-size:14px">${c.name}</div>
        <div style="font-size:12px;color:var(--gray-400)">${calcAgeLabel(c.birth)}</div>
      </div>
      ${c.id === activeChildId ? '<span class="active-badge" style="margin-right:6px">현재</span>' : ''}
      <button class="icon-action" onclick="openEditChildModal('${c.id}')">✏️</button>
      ${children.length > 1
        ? `<button class="icon-action" onclick="confirmDeleteChild('${c.id}','${c.name}')">🗑</button>`
        : ''}
    </div>`).join('');
}

// ── renderAll ──────────────────────────────────────────────
function renderAll() {
  renderTodayTreatments();
  renderHomeCompliance();
  renderHomeLifestyle();
  renderExamList();
  renderSettingsProfile();
  renderSettingsChildren();
  Object.keys(chartInst).forEach(k => { chartInst[k]?.destroy(); delete chartInst[k]; });
}

// ── Date helpers ───────────────────────────────────────────
function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function parseDate(s) { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); }
function korDate(d)   { return d.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short'}); }

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
  if (pageId === 'pageSettings')  { renderSettingsProfile(); renderSettingsChildren(); }
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
  if (panelId === 'tabAxial')      { renderAxialPctCard(); drawAxialChart(); }
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

// ── Today's treatments ─────────────────────────────────────
function renderTodayTreatments() {
  const logs     = loadC('eb_logs', {});
  const todayLog = logs[TODAY] || {};
  const container = document.getElementById('todayTreatments');
  if (!container) return;
  container.innerHTML = TREATMENTS.map(t => {
    const done = !!todayLog[t.key];
    return `<div class="treatment-item ${done ? 'done' : 'pending'}">
      <span class="check-circle ${done ? 'done' : 'pending'}" onclick="toggleTodayTreatment('${t.key}')">
        ${done ? '✓' : '○'}
      </span>
      <div><div class="t-name">${t.name}</div><div class="t-time">${t.time}</div></div>
      <span class="t-tag ${t.tag}">${done ? '완료' : '미완료'}</span>
    </div>`;
  }).join('');
}

function toggleTodayTreatment(key) {
  const logs = loadC('eb_logs', {});
  if (!logs[TODAY]) logs[TODAY] = {};
  logs[TODAY][key] = !logs[TODAY][key];
  saveC('eb_logs', logs);
  renderTodayTreatments();
  renderHomeCompliance();
  showToast(logs[TODAY][key] ? '치료 완료로 표시했습니다' : '완료 취소했습니다');
}

// ── Home compliance ────────────────────────────────────────
function calcMonthCompliance(logs, year, month) {
  const last = (year === TODAY_D.getFullYear() && month === TODAY_D.getMonth())
    ? TODAY_D.getDate() : new Date(year, month + 1, 0).getDate();
  let done = 0;
  for (let d = 1; d <= last; d++) {
    const k = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if (TREATMENTS.every(t => (logs[k] || {})[t.key])) done++;
  }
  return last > 0 ? Math.round(done / last * 100) : 0;
}

function calcStreak(logs) {
  let streak = 0;
  const d = new Date(TODAY_D);
  while (true) {
    const k = fmtDate(d);
    if (!TREATMENTS.every(t => (logs[k] || {})[t.key])) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function calcTotalCompliance(logs) {
  const start = new Date(2025, 8, 1);
  let done = 0, total = 0;
  for (let d = new Date(start); d <= TODAY_D; d.setDate(d.getDate() + 1)) {
    if (TREATMENTS.every(t => (logs[fmtDate(d)] || {})[t.key])) done++;
    total++;
  }
  return total > 0 ? Math.round(done / total * 100) : 0;
}

function renderHomeCompliance() {
  const logs   = loadC('eb_logs', {});
  const streak = calcStreak(logs);
  const mPct   = calcMonthCompliance(logs, TODAY_D.getFullYear(), TODAY_D.getMonth());
  const tPct   = calcTotalCompliance(logs);

  const sr = document.getElementById('streakRow');
  if (sr) sr.innerHTML = `
    <div class="streak-item">
      <div class="streak-num ${streak >= 7 ? 'good' : ''}">${streak}일</div>
      <div class="streak-label">🔥 연속 달성</div>
    </div>
    <div class="streak-divider"></div>
    <div class="streak-item">
      <div class="streak-num">${mPct}%</div>
      <div class="streak-label">이번 달</div>
    </div>
    <div class="streak-divider"></div>
    <div class="streak-item">
      <div class="streak-num">${tPct}%</div>
      <div class="streak-label">누적 평균</div>
    </div>`;

  const ws = document.getElementById('weekStrip');
  if (!ws) return;
  const days = ['일','월','화','수','목','금','토'];
  ws.innerHTML = Array.from({length:7}, (_,i) => {
    const d = new Date(TODAY_D); d.setDate(d.getDate() - (6 - i));
    const k = fmtDate(d);
    const log = logs[k] || {};
    const allDone = TREATMENTS.every(t => log[t.key]);
    const anyDone = TREATMENTS.some(t => log[t.key]);
    const isFuture = d > TODAY_D;
    const cls = isFuture ? 'future' : allDone ? 'done' : anyDone ? 'partial' : 'missed';
    const isToday = k === TODAY;
    return `<div class="strip-day ${isToday ? 'strip-today' : ''}">
      <div class="strip-label">${days[d.getDay()]}</div>
      <div class="strip-dot ${cls}">${allDone?'✓':anyDone?'△':isFuture?'':' '}</div>
      <div class="strip-num">${d.getDate()}</div>
    </div>`;
  }).join('');
}

function renderHomeLifestyle() {
  const lifestyle = loadC('eb_lifestyle', {});
  const todayLife = lifestyle[TODAY];
  const el = document.getElementById('homeLifestyle');
  if (!el) return;
  if (todayLife) {
    const pc = todayLife.phone   <= 2 ? 'good' : todayLife.phone   <= 3 ? 'warn' : 'bad';
    const oc = todayLife.outdoor >= 2 ? 'good' : todayLife.outdoor >= 1 ? 'warn' : 'bad';
    el.innerHTML = `
      <div class="lifestyle-item"><div class="life-icon">📱</div><div class="life-label">스마트폰</div><div class="life-value ${pc}">${todayLife.phone}h</div></div>
      <div class="lifestyle-item"><div class="life-icon">🌳</div><div class="life-label">야외활동</div><div class="life-value ${oc}">${todayLife.outdoor}h</div></div>
      <div class="lifestyle-item"><div class="life-icon">😴</div><div class="life-label">수면</div><div class="life-value good">${todayLife.sleep}h</div></div>`;
  } else {
    el.innerHTML = `<div class="no-data-row"><span>오늘 기록이 없습니다</span><button class="small-btn" onclick="openModal('lifeModal')">기록하기</button></div>`;
  }
}

// ── Calendar ───────────────────────────────────────────────
let calYear = TODAY_D.getFullYear(), calMonth = TODAY_D.getMonth();

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
  const logs  = loadC('eb_logs', {});
  const title = document.getElementById('calTitle');
  if (title) title.textContent = `${calYear}년 ${calMonth + 1}월`;
  const grid = document.getElementById('calGrid');
  if (!grid) return;

  const firstDay     = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth  = new Date(calYear, calMonth + 1, 0).getDate();
  let html = Array(firstDay).fill('<div class="cal-day empty"></div>').join('');
  for (let d = 1; d <= daysInMonth; d++) {
    const ds  = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const st  = getDayStatus(logs, ds);
    const isToday = ds === TODAY;
    const click = st === 'future' ? '' : `onclick="openDayModal('${ds}')"`;
    html += `<div class="cal-day ${st} ${isToday ? 'cal-today' : ''}" ${click}>
      <span class="cal-day-num">${d}</span>
      <span class="cal-day-icon">${st==='done'?'✓':st==='partial'?'△':st==='missed'?'✕':''}</span>
    </div>`;
  }
  grid.innerHTML = html;
  renderCalStats(logs);
}

function renderCalStats(logs) {
  const el = document.getElementById('calStats');
  if (!el) return;
  const last = (calYear === TODAY_D.getFullYear() && calMonth === TODAY_D.getMonth())
    ? TODAY_D.getDate() : new Date(calYear, calMonth + 1, 0).getDate();
  let done = 0, partial = 0, missed = 0;
  for (let d = 1; d <= last; d++) {
    const k = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const s = getDayStatus(logs, k);
    if (s === 'done') done++; else if (s === 'partial') partial++; else if (s === 'missed') missed++;
  }
  const pct = last > 0 ? Math.round(done / last * 100) : 0;
  el.innerHTML = `<div class="cal-stat-row">
    <div class="cal-stat"><span class="cst-num good">${done}일</span><span class="cst-label">완료</span></div>
    <div class="cal-stat"><span class="cst-num partial">${partial}일</span><span class="cst-label">부분</span></div>
    <div class="cal-stat"><span class="cst-num missed">${missed}일</span><span class="cst-label">미완료</span></div>
    <div class="cal-stat"><span class="cst-num primary">${pct}%</span><span class="cst-label">순응도</span></div>
  </div>`;
}

function openDayModal(dateStr) {
  const logs = loadC('eb_logs', {});
  const log  = logs[dateStr] || {};
  document.getElementById('dayModalTitle').textContent = korDate(parseDate(dateStr));
  document.getElementById('dayModalBody').innerHTML = TREATMENTS.map(t => `
    <div class="day-modal-row">
      <span class="day-modal-name">${t.name}</span>
      <label class="toggle">
        <input type="checkbox" ${log[t.key] ? 'checked' : ''} onchange="toggleDayTreatment('${dateStr}','${t.key}',this.checked)" />
        <span class="slider"></span>
      </label>
    </div>`).join('');
  openModal('dayModal');
}

function toggleDayTreatment(dateStr, key, value) {
  const logs = loadC('eb_logs', {});
  if (!logs[dateStr]) logs[dateStr] = {};
  logs[dateStr][key] = value;
  saveC('eb_logs', logs);
  renderCalendar();
  if (dateStr === TODAY) { renderTodayTreatments(); renderHomeCompliance(); }
  showToast('기록이 업데이트되었습니다');
}

// ── Exam records ───────────────────────────────────────────
function renderExamList() {
  const exams = loadC('eb_exams', []);
  const el    = document.getElementById('examList');
  if (!el) return;
  if (!exams.length) {
    el.innerHTML = '<div class="empty-state">검사기록이 없습니다.<br>+ 기록 추가 버튼으로 첫 기록을 입력해보세요.</div>';
    return;
  }
  el.innerHTML = [...exams].sort((a,b) => b.date.localeCompare(a.date)).map(e => `
    <div class="record-card">
      <div class="rec-header"><span class="rec-date">${e.date}</span><span class="rec-clinic">${e.clinic||'—'}</span></div>
      <div class="rec-body">
        ${e.axOD||e.axOS ? `<div class="rec-row"><span class="rec-label">안축장 (OD/OS)</span><span class="rec-val">${e.axOD||'—'} / ${e.axOS||'—'} mm</span></div>` : ''}
        ${e.serOD||e.serOS ? `<div class="rec-row"><span class="rec-label">SER (OD/OS)</span><span class="rec-val">${e.serOD||'—'} / ${e.serOS||'—'} D</span></div>` : ''}
        ${e.note ? `<div class="rec-row"><span class="rec-label">메모</span><span class="rec-val">${e.note}</span></div>` : ''}
      </div>
    </div>`).join('');
}

function saveExamRecord() {
  const date  = document.getElementById('examDate').value;
  if (!date) { showToast('검사일을 입력해주세요'); return; }
  const exams = loadC('eb_exams', []);
  exams.push({
    date,
    clinic: document.getElementById('examClinic').value,
    axOD:   document.getElementById('examAxOD').value,
    axOS:   document.getElementById('examAxOS').value,
    serOD:  document.getElementById('examSerOD').value,
    serOS:  document.getElementById('examSerOS').value,
    note:   document.getElementById('examNote').value,
  });
  saveC('eb_exams', exams);
  closeModal('examModal');
  renderExamList();
  showToast('검사기록이 저장되었습니다');
  ['examDate','examClinic','examAxOD','examAxOS','examSerOD','examSerOS','examNote']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

// ── Lifestyle records ──────────────────────────────────────
function saveLifestyleRecord() {
  const date = document.getElementById('lifeDate').value;
  if (!date) { showToast('날짜를 입력해주세요'); return; }
  const lifestyle = loadC('eb_lifestyle', {});
  lifestyle[date] = {
    outdoor: parseFloat(document.getElementById('lifeOutdoor').value) || 0,
    phone:   parseFloat(document.getElementById('lifePhone').value)   || 0,
    sleep:   parseFloat(document.getElementById('lifeSleep').value)   || 0,
  };
  saveC('eb_lifestyle', lifestyle);
  closeModal('lifeModal');
  renderHomeLifestyle();
  initLifestyleCharts();
  showToast('생활습관이 저장되었습니다');
}

function initLifestyleCharts() {
  const lifestyle = loadC('eb_lifestyle', {});
  const labels = [], outdoorData = [], phoneData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(TODAY_D); d.setDate(d.getDate() - i);
    const k = fmtDate(d);
    labels.push(`${d.getMonth()+1}/${d.getDate()}`);
    const l = lifestyle[k] || {};
    outdoorData.push(l.outdoor ?? null);
    phoneData.push(l.phone   ?? null);
  }
  makeChart('outdoorChart','bar',labels,[{
    data: outdoorData,
    backgroundColor: outdoorData.map(v => v===null?'#E5E7EB':v>=2?'#10B981':'#F59E0B'),
    borderRadius:6, borderSkipped:false
  }],{scales:{x:{grid:{display:false}},y:{min:0,max:5,ticks:{callback:v=>v+'h'}}}});
  makeChart('phoneChart','bar',labels,[{
    data: phoneData,
    backgroundColor: phoneData.map(v => v===null?'#E5E7EB':v<=2?'#10B981':v<=3?'#F59E0B':'#EF4444'),
    borderRadius:6, borderSkipped:false
  }],{scales:{x:{grid:{display:false}},y:{min:0,max:6,ticks:{callback:v=>v+'h'}}}});
}

// ── Axial length percentile norms ──────────────────────────
const NORM_AGES = [6,7,8,9,10,11,12,13];
const NORM = {
  p10: [21.6,21.9,22.1,22.4,22.7,22.9,23.1,23.4],
  p25: [22.0,22.3,22.6,22.9,23.2,23.5,23.8,24.1],
  p50: [22.5,22.8,23.1,23.5,23.8,24.2,24.5,24.8],
  p75: [23.0,23.3,23.7,24.1,24.5,24.8,25.2,25.5],
  p90: [23.5,23.8,24.2,24.7,25.1,25.4,25.8,26.1],
};

function interpNorm(key, age) {
  const a = NORM_AGES, v = NORM[key];
  if (age <= a[0]) return v[0];
  if (age >= a[a.length-1]) return v[v.length-1];
  const i = a.findIndex(x => x > age) - 1;
  const t = (age - a[i]) / (a[i+1] - a[i]);
  return v[i] + (v[i+1] - v[i]) * t;
}

function getActiveBirthDate() {
  const child = getActiveChild();
  if (!child) return new Date(2017, 2, 15);
  const [y,m,d] = child.birth.split('-').map(Number);
  return new Date(y, m-1, d);
}

function ageAt(dateStr) {
  return (parseDate(dateStr) - getActiveBirthDate()) / (365.25 * 864e5);
}

function calcPercentile(al, age) {
  const bands = [
    {pct:3,  val: interpNorm('p10', age) - 0.9},
    {pct:10, val: interpNorm('p10', age)},
    {pct:25, val: interpNorm('p25', age)},
    {pct:50, val: interpNorm('p50', age)},
    {pct:75, val: interpNorm('p75', age)},
    {pct:90, val: interpNorm('p90', age)},
    {pct:97, val: interpNorm('p90', age) + 0.9},
  ];
  if (al <= bands[0].val) return bands[0].pct;
  if (al >= bands[bands.length-1].val) return bands[bands.length-1].pct;
  for (let i = 0; i < bands.length - 1; i++) {
    if (al >= bands[i].val && al < bands[i+1].val) {
      const t = (al - bands[i].val) / (bands[i+1].val - bands[i].val);
      return Math.round(bands[i].pct + (bands[i+1].pct - bands[i].pct) * t);
    }
  }
  return 50;
}

function pctLabel(pct) {
  if (pct >= 90) return { text:`상위 ${100-pct}%`, cls:'pct-high' };
  if (pct >= 75) return { text:`상위 ${100-pct}%`, cls:'pct-watch' };
  if (pct >= 25) return { text:'정상 범위',          cls:'pct-normal' };
  return             { text:`하위 ${pct}%`,          cls:'pct-low' };
}

function renderAxialPctCard() {
  const el = document.getElementById('axialPctCard');
  if (!el) return;
  const exams  = loadC('eb_exams', []);
  const sorted = [...exams].sort((a,b) => b.date.localeCompare(a.date));
  if (!sorted.length) { el.innerHTML = '<div class="empty-state" style="padding:16px">검사기록을 추가하면 백분위가 표시됩니다.</div>'; return; }
  const latest = sorted[0];
  const age    = ageAt(latest.date);
  const lastOD = parseFloat(latest.axOD);
  const lastOS = parseFloat(latest.axOS);
  if (isNaN(lastOD) || isNaN(lastOS)) { el.innerHTML = ''; return; }
  const pOD = calcPercentile(lastOD, age);
  const pOS = calcPercentile(lastOS, age);
  const lOD = pctLabel(pOD), lOS = pctLabel(pOS);
  const child = getActiveChild();
  el.innerHTML = `
    <div class="pct-header">또래 안축장 비교
      <span class="pct-age">${child ? calcAgeLabel(child.birth) : ''} 기준</span>
    </div>
    <div class="pct-panels">
      <div class="pct-panel">
        <div class="pct-eye-label">우안 (OD)</div>
        <div class="pct-mm">${lastOD.toFixed(2)}<span class="pct-unit">mm</span></div>
        <div class="pct-rank ${lOD.cls}">${pOD}번째 백분위</div>
        <div class="pct-sub ${lOD.cls}">${lOD.text}</div>
      </div>
      <div class="pct-divider"></div>
      <div class="pct-panel">
        <div class="pct-eye-label">좌안 (OS)</div>
        <div class="pct-mm">${lastOS.toFixed(2)}<span class="pct-unit">mm</span></div>
        <div class="pct-rank ${lOS.cls}">${pOS}번째 백분위</div>
        <div class="pct-sub ${lOS.cls}">${lOS.text}</div>
      </div>
    </div>
    <div class="pct-interp">
      ${pOD >= 90
        ? `안축장이 또래 상위 ${100-pOD}% 수준입니다. 지속적인 치료와 정기 검진이 권장됩니다.`
        : pOD >= 75
          ? `안축장이 또래 평균보다 높습니다. 정기 검진을 유지하세요.`
          : `안축장이 또래 정상 범위 내에 있습니다.`}
    </div>`;
}

function switchAxialView(view) {
  document.getElementById('axialTrendView').style.display = view==='trend' ? '' : 'none';
  document.getElementById('axialPctView').style.display   = view==='pct'   ? '' : 'none';
  document.getElementById('vtTrend').classList.toggle('active', view==='trend');
  document.getElementById('vtPct').classList.toggle('active',   view==='pct');
  if (view === 'trend') drawAxialChart();
  if (view === 'pct')   { renderAxialPctCard(); drawPercentileChart(); }
}

function drawPercentileChart() {
  const ages = [];
  for (let a = 7; a <= 13; a += 0.25) ages.push(parseFloat(a.toFixed(2)));
  const normPt = key => ages.map(a => ({x:a, y:parseFloat(interpNorm(key,a).toFixed(3))}));

  const exams  = loadC('eb_exams', []);
  const sorted = [...exams].filter(e => e.axOD && e.axOS).sort((a,b) => a.date.localeCompare(b.date));
  const childOD = sorted.map(e => ({x: parseFloat(ageAt(e.date).toFixed(2)), y: parseFloat(e.axOD)}));
  const childOS = sorted.map(e => ({x: parseFloat(ageAt(e.date).toFixed(2)), y: parseFloat(e.axOS)}));

  makeChart('percentileChart','line',[],[
    {label:'P25', data:normPt('p25'), borderColor:'rgba(59,130,246,.25)', borderWidth:1,
     borderDash:[4,4], fill:'+1', backgroundColor:'rgba(59,130,246,.08)', pointRadius:0, tension:.4},
    {label:'P75', data:normPt('p75'), borderColor:'rgba(59,130,246,.25)', borderWidth:1,
     borderDash:[4,4], fill:false, pointRadius:0, tension:.4},
    {label:'P50', data:normPt('p50'), borderColor:'rgba(59,130,246,.5)',  borderWidth:1.5,
     borderDash:[6,3], fill:false, pointRadius:0, tension:.4},
    {label:'P90', data:normPt('p90'), borderColor:'rgba(239,68,68,.45)',  borderWidth:1.5,
     borderDash:[4,3], fill:false, pointRadius:0, tension:.4},
    {label:'P10', data:normPt('p10'), borderColor:'rgba(107,114,128,.3)', borderWidth:1,
     borderDash:[3,3], fill:false, pointRadius:0, tension:.4},
    {label:'우안(OD)', data:childOD, borderColor:'#3B82F6', backgroundColor:'#3B82F6',
     borderWidth:2.5, pointRadius:5, pointHoverRadius:7, fill:false, tension:.3},
    {label:'좌안(OS)', data:childOS, borderColor:'#F97316', backgroundColor:'#F97316',
     borderWidth:2.5, pointRadius:5, pointHoverRadius:7, fill:false, tension:.3},
  ],{
    scales:{
      x:{type:'linear', min:7, max:13,
         title:{display:true,text:'나이 (세)',font:{size:11}},
         ticks:{stepSize:1, callback:v=>v+'세', font:{size:11}},
         grid:{color:'#F3F4F6'}},
      y:{min:21.5, max:26.5,
         title:{display:true,text:'안축장 (mm)',font:{size:11}},
         ticks:{callback:v=>v.toFixed(1), font:{size:11}},
         grid:{color:'#F3F4F6'}}
    },
    plugins:{
      legend:{display:false},
      tooltip:{callbacks:{
        label: ctx => {
          const n = ctx.dataset.label;
          if (['P25','P75','P50','P90','P10'].includes(n))
            return `${n}: ${ctx.parsed.y.toFixed(2)}mm`;
          return `${n}: ${ctx.parsed.y.toFixed(2)}mm (${ctx.parsed.x.toFixed(1)}세)`;
        }
      }}
    }
  });
}

// ── Analytics charts ───────────────────────────────────────
function getExamChartData() {
  const exams  = loadC('eb_exams', []);
  const sorted = [...exams].sort((a,b) => a.date.localeCompare(b.date));
  return {
    dates: sorted.map(e => e.date.slice(0,7)),
    od:    sorted.map(e => parseFloat(e.axOD)  || null),
    os:    sorted.map(e => parseFloat(e.axOS)  || null),
    serOD: sorted.map(e => parseFloat(e.serOD) || null),
    serOS: sorted.map(e => parseFloat(e.serOS) || null),
  };
}

function drawAxialChart() {
  const {dates, od, os} = getExamChartData();
  if (!dates.length) return;
  makeChart('axialChart','line',dates,[
    {label:'우안',data:od,borderColor:'#3B82F6',backgroundColor:'rgba(59,130,246,.1)',tension:.4,fill:true,pointRadius:4},
    {label:'좌안',data:os,borderColor:'#F97316',backgroundColor:'rgba(249,115,22,.08)',tension:.4,fill:true,pointRadius:4}
  ],{scales:{
    x:{grid:{display:false},ticks:{font:{size:10}}},
    y:{ticks:{callback:v=>v?.toFixed(2)+' mm'}}
  }});
}

function drawSerChart() {
  const {dates, serOD, serOS} = getExamChartData();
  if (!dates.length) return;
  makeChart('serChart','line',dates,[
    {label:'우안',data:serOD,borderColor:'#3B82F6',tension:.4,fill:false,pointRadius:4},
    {label:'좌안',data:serOS,borderColor:'#F97316',tension:.4,fill:false,pointRadius:4}
  ],{scales:{
    x:{grid:{display:false},ticks:{font:{size:10}}},
    y:{ticks:{callback:v=>v+' D'}}
  }});
}

function drawComplianceChart() {
  const logs = loadC('eb_logs', {});
  const labels = [], data = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(TODAY_D.getFullYear(), TODAY_D.getMonth() - i, 1);
    labels.push(`${d.getMonth()+1}월`);
    data.push(calcMonthCompliance(logs, d.getFullYear(), d.getMonth()));
  }
  makeChart('complianceChart','bar',labels,[{
    data,
    backgroundColor: data.map(v => v>=90?'#10B981':v>=80?'#3B82F6':'#F59E0B'),
    borderRadius:6, borderSkipped:false
  }],{scales:{x:{grid:{display:false}},y:{min:60,max:100,ticks:{callback:v=>v+'%'}}}});

  const el = document.getElementById('complianceSummary');
  if (el) {
    const avg3   = Math.round(data.slice(-3).reduce((a,b)=>a+b,0)/3);
    const avgAll = Math.round(data.reduce((a,b)=>a+b,0)/data.length);
    el.innerHTML = `
      <div class="cs-item"><div class="cs-val">${data[data.length-1]}%</div><div class="cs-label">이번 달</div></div>
      <div class="cs-item"><div class="cs-val">${avg3}%</div><div class="cs-label">3개월 평균</div></div>
      <div class="cs-item"><div class="cs-val">${avgAll}%</div><div class="cs-label">6개월 평균</div></div>`;
  }
}

function initAnalyticsCharts() {
  renderAxialPctCard();
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
    type, data:{labels, datasets},
    options:{
      responsive:true,
      plugins:{legend:{display:false}},
      scales:{
        x:{grid:{display:false},ticks:{font:{size:11}}},
        y:{grid:{color:'#F3F4F6'},ticks:{font:{size:11}}}
      },
      ...opts
    }
  });
}

// ── Reset demo data ────────────────────────────────────────
function confirmReset() {
  if (!confirm('데모 데이터를 초기화하시겠습니까?')) return;
  const children = getChildren();
  children.forEach(c => {
    ['eb_logs','eb_exams','eb_lifestyle','eb_init'].forEach(k => localStorage.removeItem(`${k}_${c.id}`));
  });
  showToast('초기화되었습니다. 페이지를 새로고침합니다.');
  setTimeout(() => location.reload(), 1500);
}

// ── Init ───────────────────────────────────────────────────
function init() {
  const todayEl = document.getElementById('todayDate');
  if (todayEl) todayEl.textContent = korDate(TODAY_D);
  const ed = document.getElementById('examDate'); if (ed) ed.value = TODAY;
  const ld = document.getElementById('lifeDate'); if (ld) ld.value = TODAY;

  migrateData();

  activeChildId = load('eb_active', null);
  const children = getChildren();
  if (!activeChildId || !children.find(c => c.id === activeChildId)) {
    activeChildId = children[0]?.id || null;
    if (activeChildId) save('eb_active', activeChildId);
  }

  if (activeChildId) initDemoData();

  updateHeaderName();
  renderChildDropdown();
  renderAll();
}

init();
