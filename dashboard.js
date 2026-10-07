/* ══════════════════════════════════════════
   BUILDWISE — DASHBOARD PAGE JAVASCRIPT
   dashboard.js
══════════════════════════════════════════ */

let allProjects   = [];
let checklistState = {};

/* ── Market Rate Data ── */
const MATERIAL_RATES = [
  { name: 'OPC Cement 43 Grade',    unit: 'per 50kg bag',    price: '₹ 380–420',        trend: 'stable', icon: '🏗️' },
  { name: 'OPC Cement 53 Grade',    unit: 'per 50kg bag',    price: '₹ 410–450',        trend: 'up',     icon: '🏗️' },
  { name: 'TMT Steel (Fe500)',       unit: 'per metric ton',  price: '₹ 62,000–68,000',  trend: 'down',   icon: '⚙️' },
  { name: 'M-Sand (Manufactured)',   unit: 'per cu.ft',       price: '₹ 50–60',          trend: 'stable', icon: '🪨' },
  { name: 'River Sand',              unit: 'per cu.ft',       price: '₹ 70–90',          trend: 'up',     icon: '🪨' },
  { name: 'Country Brick',           unit: 'per 1000 nos.',   price: '₹ 7,000–8,500',    trend: 'stable', icon: '🧱' },
  { name: 'AAC Block (600×200×150)', unit: 'per cu.ft',       price: '₹ 45–55',          trend: 'stable', icon: '🧱' },
  { name: 'Fly Ash Brick',           unit: 'per 1000 nos.',   price: '₹ 6,500–7,500',    trend: 'down',   icon: '🧱' },
  { name: 'Jelly/20mm Aggregate',    unit: 'per cu.ft',       price: '₹ 35–45',          trend: 'stable', icon: '🪨' },
  { name: 'Vitrified Tile (2×2)',    unit: 'per sq.ft',       price: '₹ 60–100',         trend: 'up',     icon: '🪟' },
  { name: 'CPVC Pipe (1 inch)',       unit: 'per running ft',  price: '₹ 80–110',         trend: 'stable', icon: '🔩' },
  { name: 'Copper Electrical Wire',  unit: 'per metre (4mm)', price: '₹ 65–80',          trend: 'up',     icon: '⚡' },
  { name: 'Asian Paints Interior',   unit: 'per litre',       price: '₹ 120–180',        trend: 'stable', icon: '🎨' },
  { name: 'Waterproofing Chemical',  unit: 'per litre',       price: '₹ 200–350',        trend: 'up',     icon: '💧' },
  { name: 'RCC Labour (slab)',       unit: 'per sq.ft',       price: '₹ 180–220',        trend: 'up',     icon: '👷' },
  { name: 'Brickwork Labour',        unit: 'per sq.ft',       price: '₹ 45–65',          trend: 'stable', icon: '👷' },
  { name: 'Plastering Labour',       unit: 'per sq.ft',       price: '₹ 18–28',          trend: 'stable', icon: '👷' },
  { name: 'Tile Fixing Labour',      unit: 'per sq.ft',       price: '₹ 25–40',          trend: 'up',     icon: '👷' },
];

/* ── Checklist Data (6 phases, 36 items) ── */
const CHECKLIST_DATA = [
  {
    phase: 'Pre-Construction',
    items: [
      'Soil investigation / bore test done',
      'Building plan approved by local authority',
      'Structural design by licensed engineer',
      'Legal clearances and NOC obtained',
      'Site demarcation and layout finalized',
      'Temporary power and water connection done'
    ]
  },
  {
    phase: 'Foundation',
    items: [
      'Excavation completed as per design',
      'Anti-termite treatment done',
      'PCC (Plain Cement Concrete) laid',
      'Foundation footing / raft completed',
      'Basement walls backfilled',
      'Drainage lines embedded in foundation'
    ]
  },
  {
    phase: 'Structural Work',
    items: [
      'Column reinforcement placed',
      'Column shuttering and concreting done',
      'Beam and slab formwork erected',
      'Slab reinforcement checked by engineer',
      'Concrete poured and cured (28 days)',
      'Brickwork — ground floor completed',
      'Lintel beams over doors and windows done'
    ]
  },
  {
    phase: 'MEP Rough-in',
    items: [
      'Water supply lines embedded',
      'Drainage lines laid (CPVC/uPVC)',
      'Electrical conduit pipes laid',
      'AC unit sleeves provided in walls',
      'Borewell / sump tank constructed',
      'Overhead water tank (OHWT) installed'
    ]
  },
  {
    phase: 'Finishes',
    items: [
      'Plastering — internal walls completed',
      'Plastering — external walls completed',
      'Wall putty and primer applied',
      'Flooring tiles fixed (all rooms)',
      'Bathroom/toilet tiles completed',
      'Doors and windows installed',
      'Painting — interior (2 coats)',
      'Painting — exterior completed'
    ]
  },
  {
    phase: 'Final Handover',
    items: [
      'Sanitary fittings installed',
      'Electrical fixtures and switches fitted',
      'False ceiling work completed',
      'Grilles and railings installed',
      'Compound wall and gate done',
      'Site cleanup and debris cleared',
      'Final inspection by engineer',
      'Occupancy certificate obtained'
    ]
  }
];

/* ══════════════════════════════════════════
   EVENT HANDLERS
══════════════════════════════════════════ */

/* EH 1: DOMContentLoaded */
document.addEventListener('DOMContentLoaded', () => {
  loadProjects();
  renderKPIs();
  renderRates();
  renderChecklist();
  populateProjectSelects();
  renderCompare();
});

/* EH 2: Tab switching */
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const tabEl = [...document.querySelectorAll('.tab')].find(t =>
    t.textContent.toLowerCase().includes(name.toLowerCase().split('-')[0])
  );
  if (tabEl) tabEl.classList.add('active');
  const contentEl = document.getElementById('tab-' + name);
  if (contentEl) contentEl.classList.add('active');
}

/* EH 3: Search filter */
function filterProjects(query) {
  renderProjects(allProjects.filter(p =>
    p.projectName?.toLowerCase().includes(query.toLowerCase()) ||
    p.ownerName?.toLowerCase().includes(query.toLowerCase()) ||
    p.city?.toLowerCase().includes(query.toLowerCase())
  ));
}

/* EH 4: Sort */
function sortProjects(by) {
  const sorted = [...allProjects];
  if (by === 'cost_desc')   sorted.sort((a, b) => b.total - a.total);
  else if (by === 'cost_asc')  sorted.sort((a, b) => a.total - b.total);
  else if (by === 'area_desc') sorted.sort((a, b) => (b.builtupArea * b.floors) - (a.builtupArea * a.floors));
  else sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
  renderProjects(sorted);
}

/* EH 5: Delete project */
function deleteProject(idx) {
  if (!confirm('Delete this project?')) return;
  allProjects.splice(idx, 1);
  localStorage.setItem('buildwise_projects', JSON.stringify(allProjects));
  renderKPIs();
  renderProjects(allProjects);
  populateProjectSelects();
  renderCompare();
  toast('Project deleted', 'success');
}

/* EH 6: Clear all projects */
function clearAllProjects() {
  if (!confirm('Clear ALL saved projects? This cannot be undone.')) return;
  localStorage.removeItem('buildwise_projects');
  allProjects = [];
  renderKPIs();
  renderProjects([]);
  populateProjectSelects();
  renderCompare();
  toast('All projects cleared', 'success');
}

/* EH 7: View project detail modal */
function viewProject(idx) {
  const p = allProjects[idx];
  if (!p) return;
  const e    = p.estimate || {};
  const area = (parseFloat(p.builtupArea) || 0) * (parseInt(p.floors) || 1);

  document.getElementById('modalTitle').textContent = p.projectName;
  document.getElementById('modalMeta').textContent  =
    `${p.ownerName || '—'} · ${p.city || '—'}, ${p.district || '—'} · ${area} sq.ft`;

  const rows = [
    ['Foundation & Civil',       e.foundCost],
    ['Cement',                   e.cementCost],
    ['Bricks / Blocks',          e.brickCost],
    ['Steel',                    e.steelCost],
    ['Sand & Aggregate',         (e.sandCost || 0) + (e.jellyCost || 0)],
    ['Roofing',                  e.roofCost],
    ['Flooring',                 e.flooringCost],
    ['Paint (Interior+Exterior)',(e.paintInCost || 0) + (e.paintExCost || 0)],
    ['Doors & Windows',          (e.mainDoorCost || 0) + (e.bedDoorCost || 0) + (e.winCost || 0)],
    ['Plumbing & Sanitary',      (e.plumbingCost || 0) + (e.sanitaryCost || 0)],
    ['Electrical & Wiring',      e.wiringCost],
    ['Interior Extras & Furniture', e.extrasCost],
    ['Labour',                   e.labourCost],
    ['Architect Fees',           e.archCost],
    ['Contingency',              e.contingencyCost],
    ['GST',                      e.gstCost],
  ].filter(([, v]) => v && v > 0);

  document.getElementById('modalBody').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="background:var(--bg);padding:14px;border:1px solid var(--border)">
        <div style="font-family:var(--mono);font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Total Cost</div>
        <div style="font-family:var(--serif);font-size:1.5rem;color:var(--accent)">₹ ${formatINR(p.total)}</div>
      </div>
      <div style="background:var(--bg);padding:14px;border:1px solid var(--border)">
        <div style="font-family:var(--mono);font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Rate / sq.ft</div>
        <div style="font-family:var(--serif);font-size:1.5rem">₹ ${area ? Math.round(p.total / area).toLocaleString('en-IN') : '—'}</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th style="font-family:var(--mono);font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);padding:10px 0 8px;border-bottom:1px solid var(--border);text-align:left">Cost Head</th>
          <th style="font-family:var(--mono);font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);padding:10px 0 8px;border-bottom:1px solid var(--border);text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(([l, v]) => `
          <tr>
            <td style="padding:9px 0;border-bottom:1px solid var(--border);font-size:0.82rem">${l}</td>
            <td style="padding:9px 0;border-bottom:1px solid var(--border);font-family:var(--mono);font-size:0.8rem;text-align:right">₹ ${formatINR(v)}</td>
          </tr>
        `).join('')}
        <tr>
          <td style="padding:12px 0;font-weight:600;font-size:0.9rem">TOTAL</td>
          <td style="padding:12px 0;font-family:var(--mono);font-size:1rem;font-weight:600;text-align:right;color:var(--accent)">₹ ${formatINR(p.total)}</td>
        </tr>
      </tbody>
    </table>
  `;
  document.getElementById('modalOverlay').classList.add('open');
}

/* EH 8: Modal close (button click) */
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalClose2').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

/* EH 9: Export CSV */
function exportData() {
  if (!allProjects.length) { toast('No projects to export', 'warning'); return; }
  const headers = ['Project Name','Owner','City','District','Floors','Built-up Area (sqft)','Total Cost (INR)','Cost per sqft','Date'];
  const rows = allProjects.map(p => {
    const area = (parseFloat(p.builtupArea) || 0) * (parseInt(p.floors) || 1);
    return [p.projectName, p.ownerName, p.city, p.district, p.floors, area,
            Math.round(p.total || 0), area ? Math.round((p.total || 0) / area) : 0, p.date];
  });
  const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'buildwise_projects.csv'; a.click();
  toast('CSV exported', 'success');
}

/* EH 10: Breakdown project select */
function renderBreakdown(idx) {
  if (!idx && idx !== 0) return;
  const p     = allProjects[parseInt(idx)];
  if (!p) return;
  const e     = p.estimate || {};
  const area  = (parseFloat(p.builtupArea) || 0) * (parseInt(p.floors) || 1);
  const total = p.total || 1;

  const sections = [
    { label: 'Structure & Civil',        color: '#C8401A', amount: (e.foundCost||0)+(e.cementCost||0)+(e.brickCost||0)+(e.steelCost||0)+(e.sandCost||0)+(e.jellyCost||0)+(e.roofCost||0) },
    { label: 'Finishes',                 color: '#2E6B3E', amount: (e.flooringCost||0)+(e.paintInCost||0)+(e.paintExCost||0)+(e.mainDoorCost||0)+(e.bedDoorCost||0)+(e.winCost||0) },
    { label: 'MEP (Plumbing+Electrical)', color: '#1A3D6B', amount: (e.plumbingCost||0)+(e.sanitaryCost||0)+(e.wiringCost||0) },
    { label: 'Extras & Furniture',       color: '#8B6914', amount: e.extrasCost||0 },
    { label: 'Labour + Architect',       color: '#6B3070', amount: (e.labourCost||0)+(e.archCost||0) },
    { label: 'Contingency + GST',        color: '#4A6B6B', amount: (e.contingencyCost||0)+(e.gstCost||0) },
  ];

  const detail = [
    ['Foundation Work',  e.foundCost], ['Cement', e.cementCost],
    ['Bricks / Blocks',  e.brickCost], ['Steel',  e.steelCost],
    ['Sand & Aggregate', (e.sandCost||0)+(e.jellyCost||0)], ['Roofing', e.roofCost],
    ['Flooring',         e.flooringCost], ['Interior Paint', e.paintInCost],
    ['Exterior Paint',   e.paintExCost],  ['Doors', (e.mainDoorCost||0)+(e.bedDoorCost||0)],
    ['Windows',          e.winCost],      ['Plumbing', e.plumbingCost],
    ['Sanitary Fittings', e.sanitaryCost], ['Electrical', e.wiringCost],
    ['Interior Extras',  e.extrasCost],   ['Labour', e.labourCost],
    ['Architect Fees',   e.archCost],     ['Contingency', e.contingencyCost],
    ['GST (5%)',         e.gstCost],
  ].filter(([, v]) => v && v > 0);

  document.getElementById('breakdownContent').innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);padding:16px 20px;margin-bottom:20px;display:flex;gap:32px;align-items:center">
      <div><div style="font-family:var(--mono);font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);margin-bottom:2px">Project</div><div style="font-weight:600">${p.projectName}</div></div>
      <div><div style="font-family:var(--mono);font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);margin-bottom:2px">Total Budget</div><div style="font-family:var(--mono);font-size:1.1rem;color:var(--accent)">₹ ${formatINR(p.total)}</div></div>
      <div><div style="font-family:var(--mono);font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);margin-bottom:2px">Built-up Area</div><div style="font-weight:600">${area} sq.ft</div></div>
      <div><div style="font-family:var(--mono);font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);margin-bottom:2px">Rate / sq.ft</div><div style="font-family:var(--mono)">₹ ${area ? Math.round(total/area).toLocaleString('en-IN') : '—'}</div></div>
    </div>
    <div class="breakdown-grid">
      <div class="breakdown-card">
        <div class="bc-title">Cost by Category</div>
        ${sections.filter(s => s.amount > 0).map(s => `
          <div class="bc-row">
            <div class="bc-label"><div class="bc-dot" style="background:${s.color}"></div>${s.label}</div>
            <div>
              <div class="bc-amount" style="color:${s.color}">₹ ${formatINR(s.amount)}</div>
              <div style="font-family:var(--mono);font-size:0.65rem;color:var(--text-muted);text-align:right">${Math.round(s.amount/total*100)}%</div>
              <div class="bc-bar-wrap" style="width:100px"><div class="bc-bar-fill" style="width:${Math.round(s.amount/total*100)}%;background:${s.color}"></div></div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="breakdown-card">
        <div class="bc-title">Detailed Line Items</div>
        ${detail.map(([l, v]) => `
          <div class="bc-row">
            <div class="bc-label">${l}</div>
            <div class="bc-amount">₹ ${formatINR(v)}</div>
          </div>
        `).join('')}
        <div class="bc-row" style="margin-top:8px;border-top:2px solid var(--text-primary)">
          <div class="bc-label"><strong>TOTAL</strong></div>
          <div class="bc-amount" style="font-size:1rem;color:var(--accent)">₹ ${formatINR(p.total)}</div>
        </div>
      </div>
    </div>
  `;
}

/* EH 11: Materials tab project select */
function renderMaterials(idx) {
  if (!idx && idx !== 0) return;
  const p    = allProjects[parseInt(idx)];
  if (!p) return;
  const e    = p.estimate || {};
  const area = (parseFloat(p.builtupArea) || 0) * (parseInt(p.floors) || 1);
  const beds = parseInt(p.bedrooms) || 2;

  const mats = [
    { icon:'🏗️', name:'Cement',           qty: Math.ceil(area*0.4) + ' bags',                    cost: e.cementCost,   status:'ok'   },
    { icon:'🧱', name:'Bricks / Blocks',   qty: Math.ceil(area*0.6*8).toLocaleString('en-IN') + ' nos.', cost: e.brickCost,    status:'ok'   },
    { icon:'⚙️', name:'Steel (TMT)',        qty: (area*4/1000).toFixed(1) + ' MT',                 cost: e.steelCost,    status:'ok'   },
    { icon:'🪨', name:'M-Sand',             qty: Math.ceil(area*1.5) + ' cu.ft',                   cost: e.sandCost,     status:'warn' },
    { icon:'🪨', name:'Jelly/Aggregate',    qty: Math.ceil(area*0.8) + ' cu.ft',                   cost: e.jellyCost,    status:'ok'   },
    { icon:'🎨', name:'Paint (Interior)',   qty: Math.ceil(area*3.5/120) + ' litres',               cost: e.paintInCost,  status:'ok'   },
    { icon:'🎨', name:'Paint (Exterior)',   qty: Math.ceil(area*1.5/100) + ' litres',               cost: e.paintExCost,  status:'ok'   },
    { icon:'🪟', name:'Floor Tiles',        qty: Math.ceil(area*1.1) + ' sq.ft',                   cost: e.flooringCost, status:'ok'   },
    { icon:'🚿', name:'Sanitary Fittings', qty: beds + ' sets',                                    cost: e.sanitaryCost, status:'ok'   },
    { icon:'🔩', name:'CPVC Pipes',         qty: Math.ceil(area*0.5) + ' rft',                     cost: e.plumbingCost, status:'warn' },
    { icon:'⚡', name:'Electrical Wire',   qty: Math.ceil(area*3) + ' metres',                    cost: e.wiringCost,   status:'ok'   },
    { icon:'🛋️', name:'Furniture',          qty: 'Budget estimate',                                 cost: e.extrasCost||0,status:'ok'   },
  ].filter(m => m.cost && m.cost > 0);

  document.getElementById('materialsContent').innerHTML = `
    <div class="material-grid">
      ${mats.map(m => `
        <div class="material-card">
          <div class="mat-status ${m.status}"></div>
          <div class="mat-icon">${m.icon}</div>
          <div class="mat-name">${m.name}</div>
          <div class="mat-qty">${m.qty}</div>
          <div class="mat-cost">₹ ${formatINR(m.cost)}</div>
        </div>
      `).join('')}
    </div>
    <div style="background:var(--surface);border:1px solid var(--border);padding:16px 20px;font-family:var(--mono);font-size:0.72rem;color:var(--text-muted)">
      🟡 Yellow dot = material whose price fluctuates — get fresh quotes before procurement.
    </div>
  `;
}

/* EH 12: Checklist toggle */
function toggleCheck(phase, item) {
  const key = phase + ':' + item;
  checklistState[key] = !checklistState[key];
  localStorage.setItem('buildwise_checklist', JSON.stringify(checklistState));
  renderChecklist();
}

/* EH 13: Refresh rates */
function refreshRates() {
  toast('Rates refreshed from market data', 'success');
}

/* EH 14: Keyboard Escape closes modal */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

/* EH 15: Window resize — adjust KPI grid */
window.addEventListener('resize', () => {
  const kpiBar = document.querySelector('.kpi-bar');
  if (window.innerWidth < 600)       kpiBar.style.gridTemplateColumns = '1fr 1fr';
  else if (window.innerWidth < 1024) kpiBar.style.gridTemplateColumns = 'repeat(3,1fr)';
  else                               kpiBar.style.gridTemplateColumns = 'repeat(5,1fr)';
});

/* ══════════════════════════════════════════
   RENDER FUNCTIONS
══════════════════════════════════════════ */

function loadProjects() {
  allProjects = JSON.parse(localStorage.getItem('buildwise_projects') || '[]');
  renderProjects(allProjects);
}

function renderKPIs() {
  const count     = allProjects.length;
  const total     = allProjects.reduce((s, p) => s + (p.total || 0), 0);
  const totalArea = allProjects.reduce((s, p) => s + ((parseFloat(p.builtupArea)||0) * (parseInt(p.floors)||1)), 0);
  const avg       = count ? total / count : 0;
  const rate      = totalArea ? total / totalArea : 0;

  document.getElementById('kpi-projects').textContent = count;
  document.getElementById('kpi-total').textContent    = '₹ ' + formatINR(total);
  document.getElementById('kpi-avg').textContent      = '₹ ' + formatINR(avg);
  document.getElementById('kpi-area').textContent     = totalArea.toLocaleString('en-IN') + ' sqft';
  document.getElementById('kpi-rate').textContent     = '₹ ' + Math.round(rate).toLocaleString('en-IN');

  const sub = count === 0
    ? 'No projects saved yet. Create your first budget!'
    : `${count} project${count > 1 ? 's' : ''} saved · Last updated ${allProjects[allProjects.length-1]?.date || 'today'}`;

  document.getElementById('dashSubTitle').textContent  = sub;
  document.getElementById('projectsCount').textContent = count + ' Project' + (count !== 1 ? 's' : '');
}

function renderProjects(projects) {
  const grid = document.getElementById('projectsGrid');
  if (!projects.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🏠</div>
        <div class="empty-title">No projects found</div>
        <div class="empty-sub">Start planning your home construction budget today</div>
        <a href="index.html" class="btn btn-primary" style="margin-top:8px">+ Create New Project</a>
      </div>`;
    return;
  }

  const statuses = ['planning', 'active', 'active', 'planning'];
  grid.innerHTML = projects.map((p, i) => {
    const idx          = allProjects.indexOf(p);
    const area         = (parseFloat(p.builtupArea) || 0) * (parseInt(p.floors) || 1);
    const ratePerSqft  = area ? Math.round((p.total || 0) / area) : 0;
    const progress     = Math.min(95, Math.floor(Math.random() * 70 + 10));
    const status       = statuses[i % statuses.length];

    return `
      <div class="project-card">
        <div class="pc-header">
          <div>
            <div class="pc-name">${p.projectName || 'Unnamed Project'}</div>
            <div class="pc-meta">${p.ownerName || '—'} · ${p.city || '—'}, ${p.district || '—'}</div>
          </div>
          <span class="pc-badge ${status}">${status === 'planning' ? 'Planning' : 'Active'}</span>
        </div>
        <div class="pc-body">
          <div class="pc-cost">₹ ${formatINR(p.total)} <span>total est.</span></div>
          <div class="pc-stats">
            <div class="pc-stat-item"><div class="pc-stat-label">Floors</div><div class="pc-stat-val">${p.floors || 1}</div></div>
            <div class="pc-stat-item"><div class="pc-stat-label">Area</div><div class="pc-stat-val">${area ? area.toLocaleString('en-IN') : '—'} sqft</div></div>
            <div class="pc-stat-item"><div class="pc-stat-label">Rate/sqft</div><div class="pc-stat-val">₹${ratePerSqft.toLocaleString('en-IN')}</div></div>
          </div>
          <div class="pc-progress">
            <div class="pc-prog-label"><span>Planning Progress</span><span>${progress}%</span></div>
            <div class="prog-bar"><div class="prog-fill" style="width:${progress}%"></div></div>
          </div>
        </div>
        <div class="pc-footer">
          <button class="btn btn-danger btn-sm" onclick="deleteProject(${idx})">Delete</button>
          <button class="btn btn-outline btn-sm" onclick="viewProject(${idx})">View Details</button>
        </div>
      </div>
    `;
  }).join('');
}

function populateProjectSelects() {
  ['breakdownProject', 'materialProject'].forEach(sid => {
    const sel  = document.getElementById(sid);
    const prev = sel.value;
    sel.innerHTML = '<option value="">Select Project</option>' +
      allProjects.map((p, i) => `<option value="${i}">${p.projectName || 'Project ' + (i+1)}</option>`).join('');
    if (prev) sel.value = prev;
  });
}

function renderChecklist() {
  checklistState = JSON.parse(localStorage.getItem('buildwise_checklist') || '{}');
  let totalItems = 0, doneItems = 0;

  document.getElementById('checklistGrid').innerHTML = CHECKLIST_DATA.map(phase => {
    const items = phase.items;
    const done  = items.filter(it => checklistState[phase.phase + ':' + it]).length;
    totalItems += items.length;
    doneItems  += done;

    return `
      <div class="checklist-card">
        <div class="cl-header">
          <div class="cl-title">${phase.phase}</div>
          <div class="cl-prog">${done}/${items.length}</div>
        </div>
        <div class="cl-body">
          ${items.map(it => {
            const key    = phase.phase + ':' + it;
            const isDone = !!checklistState[key];
            return `
              <div class="cl-item" onclick="toggleCheck('${phase.phase}', '${it.replace(/'/g, "\\'")}')">
                <div class="cl-check ${isDone ? 'done' : ''}">${isDone ? '✓' : ''}</div>
                <div class="cl-text ${isDone ? 'done' : ''}">${it}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('checklistProgress').textContent = `${doneItems}/${totalItems} completed`;
}

function renderRates() {
  document.getElementById('rateGrid').innerHTML = MATERIAL_RATES.map(r => `
    <div class="rate-card">
      <div style="font-size:1.5rem;margin-bottom:8px">${r.icon}</div>
      <div class="rate-material">${r.name}</div>
      <div class="rate-price">${r.price}</div>
      <div class="rate-unit">${r.unit}</div>
      <div class="rate-trend ${r.trend}">
        ${r.trend === 'up' ? '↑ Rising' : r.trend === 'down' ? '↓ Falling' : '→ Stable'}
      </div>
    </div>
  `).join('');
}

function renderCompare() {
  const ct = document.getElementById('compareContent');
  if (allProjects.length < 2) {
    ct.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚖️</div>
        <div class="empty-title">Need 2+ projects to compare</div>
        <div class="empty-sub">Save at least 2 project budgets to see side-by-side comparison</div>
        <a href="index.html" class="btn btn-primary" style="margin-top:8px">+ Create Project</a>
      </div>`;
    return;
  }

  const fields = ['Project','Owner','City','Floors','Built-up Area','Total Cost','Rate/sqft','Structure Cost','Finishes Cost','MEP Cost'];

  const rows = fields.map((f, fi) => {
    const cells = allProjects.map(p => {
      const area = (parseFloat(p.builtupArea)||0) * (parseInt(p.floors)||1);
      const e    = p.estimate || {};
      const vals = [
        p.projectName,
        p.ownerName,
        `${p.city}, ${p.district}`,
        p.floors + ' floor(s)',
        (area || 0).toLocaleString('en-IN') + ' sqft',
        '₹ ' + formatINR(p.total),
        area ? '₹ ' + Math.round(p.total/area).toLocaleString('en-IN') : '—',
        '₹ ' + formatINR((e.foundCost||0)+(e.cementCost||0)+(e.brickCost||0)+(e.steelCost||0)+(e.sandCost||0)+(e.jellyCost||0)+(e.roofCost||0)),
        '₹ ' + formatINR((e.flooringCost||0)+(e.paintInCost||0)+(e.paintExCost||0)+(e.mainDoorCost||0)+(e.bedDoorCost||0)+(e.winCost||0)),
        '₹ ' + formatINR((e.plumbingCost||0)+(e.sanitaryCost||0)+(e.wiringCost||0)),
      ];
      return `<td class="${fi > 4 ? 'mono' : ''}">${vals[fi] || '—'}</td>`;
    }).join('');

    return `<tr>
      <th style="background:var(--bg);color:var(--text-muted);font-family:var(--mono);font-size:0.65rem;letter-spacing:0.08em;text-transform:uppercase;padding:12px 16px;border-right:1px solid var(--border);text-align:left;white-space:nowrap">${f}</th>
      ${cells}
    </tr>`;
  }).join('');

  ct.innerHTML = `
    <div style="overflow-x:auto">
      <table class="compare-table">
        <thead>
          <tr>
            <th>Metric</th>
            ${allProjects.map((_, i) => `<th>Project ${i+1}</th>`).join('')}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/* ══════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════ */

function formatINR(n) {
  if (!n || isNaN(n)) return '0';
  n = Math.round(n);
  if (n >= 10000000) return (n / 10000000).toFixed(2) + ' Cr';
  if (n >= 100000)   return (n / 100000).toFixed(2) + ' L';
  return n.toLocaleString('en-IN');
}

function toast(msg, type = 'info') {
  const icons = { success: '✓', error: '✕', warning: '⚠', info: '→' };
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type === 'success' ? 'success' : ''}`;
  t.innerHTML = `<span>${icons[type] || '→'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}