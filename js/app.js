/* EyeBody Demo App — app.js */

// ── Navigation ────────────────────────────────────────────
const pages  = ['pageHome','pageRecords','pageAnalytics','pageSettings'];
const navBtns = ['navHome','navRecords','navAnalytics','navSettings'];

function navigate(targetId) {
  pages.forEach(id => document.getElementById(id).classList.remove('active'));
  navBtns.forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById(targetId).classList.add('active');
  const idx = pages.indexOf(targetId);
  document.getElementById(navBtns[idx]).classList.add('active');
  document.querySelector('.page-wrap').scrollTop = 0;

  if (targetId === 'pageAnalytics') initAnalyticsCharts();
  if (targetId === 'pageRecords')   initLifestyleCharts();
}

// ── Tab switching ──────────────────────────────────────────
function switchTab(btn, panelId) {
  const bar = btn.closest('.tab-bar');
  bar.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  const page = btn.closest('.page');
  page.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');

  if (panelId === 'tabAxial') drawAxialChart();
  if (panelId === 'tabSer')   drawSerChart();
  if (panelId === 'tabCompliance') drawComplianceChart();
  if (panelId === 'tabLifestyle') initLifestyleCharts();
}

// ── Modals ─────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
function saveRecord(id) {
  closeModal(id);
  showToast('저장되었습니다');
}

// ── Toast ──────────────────────────────────────────────────
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

// ── Treatment toggle ───────────────────────────────────────
function toggleTreatment(el) {
  const item = el.closest('.treatment-item');
  const tag  = item.querySelector('.t-tag');
  if (el.classList.contains('pending')) {
    el.classList.replace('pending', 'done');
    el.textContent = '✓';
    item.classList.replace('pending', 'done');
    tag.textContent = '완료';
    showToast('치료 완료로 표시되었습니다');
  } else {
    el.classList.replace('done', 'pending');
    el.textContent = '○';
    item.classList.replace('done', 'pending');
    tag.textContent = '미완료';
  }
}

// ── Date setup ─────────────────────────────────────────────
function setupDate() {
  const now = new Date(2026, 5, 6);
  const opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
  document.getElementById('todayDate').textContent = now.toLocaleDateString('ko-KR', opts);

  const examDate = document.getElementById('examDate');
  if (examDate) examDate.valueAsDate = now;
}

// ── Chart data ─────────────────────────────────────────────
const examDates   = ['2024-08','2024-11','2025-02','2025-05','2025-08','2025-11','2026-02','2026-05'];
const axialOD     = [24.10, 24.22, 24.36, 24.48, 24.54, 24.61, 24.68, 24.82];
const axialOS     = [24.18, 24.30, 24.42, 24.55, 24.59, 24.67, 24.75, 24.91];
const serOD       = [-2.00, -2.25, -2.50, -2.75, -2.75, -3.00, -3.00, -3.25];
const serOS       = [-2.25, -2.50, -2.75, -3.00, -3.00, -3.25, -3.25, -3.50];

const months      = ['1월','2월','3월','4월','5월','6월','7월'];
const outdoorH    = [1.2, 2.1, 1.8, 0.5, 2.0, 1.5, 1.3];
const phoneH      = [2.5, 1.8, 3.0, 4.2, 2.0, 2.8, 2.6];
const compMonths  = ['12월','1월','2월','3월','4월','5월','6월'];
const compData    = [88, 92, 85, 91, 89, 93, 86];

// chart instances (prevent re-init)
const chartInst = {};

function makeChart(id, type, labels, datasets, opts = {}) {
  if (chartInst[id]) { chartInst[id].destroy(); }
  const ctx = document.getElementById(id);
  if (!ctx) return;
  chartInst[id] = new Chart(ctx, {
    type,
    data: { labels, datasets },
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

function drawAxialChart() {
  makeChart('axialChart', 'line', examDates, [
    { label: '우안(OD)', data: axialOD, borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,.1)', tension: .4, fill: true, pointRadius: 4, pointHoverRadius: 6 },
    { label: '좌안(OS)', data: axialOS, borderColor: '#F97316', backgroundColor: 'rgba(249,115,22,.08)', tension: .4, fill: true, pointRadius: 4, pointHoverRadius: 6 }
  ], {
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { min: 23.8, max: 25.2, grid: { color: '#F3F4F6' }, ticks: { font: { size: 11 }, callback: v => v.toFixed(2) + ' mm' } }
    }
  });
}

function drawSerChart() {
  makeChart('serChart', 'line', examDates, [
    { label: '우안(OD)', data: serOD, borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,.1)', tension: .4, fill: false, pointRadius: 4 },
    { label: '좌안(OS)', data: serOS, borderColor: '#F97316', backgroundColor: 'rgba(249,115,22,.08)', tension: .4, fill: false, pointRadius: 4 }
  ], {
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: '#F3F4F6' }, ticks: { font: { size: 11 }, callback: v => v + ' D' } }
    }
  });
}

function drawComplianceChart() {
  makeChart('complianceChart', 'bar', compMonths, [
    { label: '순응도(%)', data: compData, backgroundColor: compData.map(v => v >= 90 ? '#10B981' : v >= 80 ? '#3B82F6' : '#F59E0B'), borderRadius: 6, borderSkipped: false }
  ], {
    scales: {
      x: { grid: { display: false } },
      y: { min: 60, max: 100, grid: { color: '#F3F4F6' }, ticks: { callback: v => v + '%' } }
    }
  });
}

function initLifestyleCharts() {
  makeChart('outdoorChart', 'bar', months, [
    { data: outdoorH, backgroundColor: outdoorH.map(v => v >= 2 ? '#10B981' : '#F59E0B'), borderRadius: 6, borderSkipped: false }
  ], {
    scales: {
      x: { grid: { display: false } },
      y: { min: 0, max: 4, grid: { color: '#F3F4F6' }, ticks: { callback: v => v + 'h' } }
    },
    plugins: {
      legend: { display: false },
      annotation: {}
    }
  });

  makeChart('phoneChart', 'bar', months, [
    { data: phoneH, backgroundColor: phoneH.map(v => v <= 2 ? '#10B981' : v <= 3 ? '#F59E0B' : '#EF4444'), borderRadius: 6, borderSkipped: false }
  ], {
    scales: {
      x: { grid: { display: false } },
      y: { min: 0, max: 6, grid: { color: '#F3F4F6' }, ticks: { callback: v => v + 'h' } }
    }
  });
}

function initAnalyticsCharts() {
  drawAxialChart();
  drawSerChart();
  drawComplianceChart();
}

// ── Close modal on overlay click ───────────────────────────
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ── Init ───────────────────────────────────────────────────
setupDate();
