/* ══════════════════════════════════════════
   BUILDWISE — INDEX PAGE JAVASCRIPT
   index.js
   Requires: jQuery 3.7.1 (loaded in HTML)
══════════════════════════════════════════ */

/* ── DEFAULT PRICES (fallback) ── */
const DEFAULT_PRICES = {
  cementPrice: 380,
  brickPrice: 7500,
  steelPrice: 65000,
  sandPrice: 55,
  jellyPrice: 40
};

let pricesFetched = false;
let currentStep = 1;
const TOTAL_STEPS = 5;

/* ══════════════════════════════════════════
   JQUERY AJAX — LIVE PRICE FETCHER
══════════════════════════════════════════ */

$(document).ready(function () {

  /* ── Fetch Live Prices via AJAX ── */
  $('#btnFetchPrices').on('click', function () {
    const $btn = $(this);

    /* Update UI to loading state */
    $('#fetchSpinner').show();
    $('#fetchBtnText').text('Fetching...');
    $btn.prop('disabled', true);
    $('#pfDot').removeClass('live error').addClass('loading');
    $('#pfStatusText').text('Connecting...');
    $('#logToggle').show();
    $('#ajaxLog').addClass('show');

    addLog('info', '→ jQuery $.ajax() — GET prices.json');
    addLog('info', '→ dataType: json | timeout: 8000ms');

    /* jQuery AJAX call */
    $.ajax({
      url: 'prices.json',
      type: 'GET',
      dataType: 'json',
      timeout: 8000,

      beforeSend: function () {
        addLog('info', '→ Request sent. Awaiting response...');
      },

      success: function (data) {
        addLog('success', '✓ HTTP 200 OK — JSON parsed successfully');
        addLog('info', '→ ' + Object.keys(data.prices).length + ' price records received');

        const p = data.prices;

        /* Cement — match by selected grade */
        const cGrade = $('#cementGrade').val();
        const cKey   = cGrade === '53' ? 'cement_53' : cGrade === '33' ? 'cement_33' : 'cement_43';
        if (p[cKey]) {
          $('#cementPrice').val(p[cKey].price).addClass('valid');
          updateChip('cement', '₹' + p[cKey].price, p[cKey].trend);
          addLog('success', '✓ Cement: ₹' + p[cKey].price + '/bag');
        }

        /* Brick — match by selected wall material */
        const bMap = {
          country_brick: 'brick_country',
          fly_ash: 'brick_flyash',
          aac_block: 'brick_aac',
          concrete_block: 'brick_concrete',
          red_brick: 'brick_red'
        };
        const bKey = bMap[$('#wallMaterial').val()] || 'brick_country';
        if (p[bKey]) {
          $('#brickPrice').val(p[bKey].price).addClass('valid');
          updateChip('brick', '₹' + p[bKey].price.toLocaleString('en-IN'), p[bKey].trend);
          addLog('success', '✓ Bricks: ₹' + p[bKey].price + '/1000');
        }

        /* Steel — match by selected grade */
        const sMap = { Fe415: 'steel_fe415', Fe500: 'steel_fe500', Fe550: 'steel_fe550' };
        const sKey = sMap[$('#steelGrade').val()] || 'steel_fe500';
        if (p[sKey]) {
          $('#steelPrice').val(p[sKey].price).addClass('valid');
          updateChip('steel', '₹' + p[sKey].price.toLocaleString('en-IN'), p[sKey].trend);
          addLog('success', '✓ Steel: ₹' + p[sKey].price + '/MT');
        }

        /* Sand — match by selected sand type */
        const sandMap = { msand: 'sand_msand', river: 'sand_river', psand: 'sand_psand' };
        const sandKey = sandMap[$('#sandType').val()] || 'sand_msand';
        if (p[sandKey]) {
          $('#sandPrice').val(p[sandKey].price).addClass('valid');
          updateChip('sand', '₹' + p[sandKey].price, p[sandKey].trend);
          addLog('success', '✓ Sand: ₹' + p[sandKey].price + '/cu.ft');
        }

        /* Jelly */
        if (p.jelly) {
          $('#jellyPrice').val(p.jelly.price).addClass('valid');
          updateChip('jelly', '₹' + p.jelly.price, p.jelly.trend);
          addLog('success', '✓ Jelly: ₹' + p.jelly.price + '/cu.ft');
        }

        /* Show chips and update status */
        $('#fetchedPricesGrid').addClass('show');
        $('#pfDot').removeClass('loading error').addClass('live');
        $('#pfStatusText').text('Live — Updated');
        $('#lastUpdatedText').text('Synced at ' + new Date().toLocaleTimeString('en-IN') + ' | ' + data.source);
        $('#lastUpdatedBadge').addClass('show');
        addLog('success', '✓ All 5 fields updated. Recalculating estimate...');

        pricesFetched = true;
        updateEstimate();
        toast('Live prices fetched and applied!', 'blue');
      },

      error: function (xhr, status, error) {
        addLog('error', '✕ AJAX failed: ' + status + ' — ' + (error || 'Unknown'));
        addLog('warn', '⚠ Using default prices as fallback');
        $('#pfDot').removeClass('loading live').addClass('error');
        $('#pfStatusText').text('Error — Using defaults');
        toast('Could not fetch prices. Using default values.', 'warning');
      },

      complete: function () {
        $('#fetchSpinner').hide();
        $('#fetchBtnText').text('⬇ Fetch Live Prices');
        $btn.prop('disabled', false);
      }
    });
  });

  /* ── Reset Prices to Default ── */
  $('#btnResetPrices').on('click', function () {
    $.each(DEFAULT_PRICES, function (id, val) {
      $('#' + id).val(val).removeClass('valid error');
    });
    $('#fetchedPricesGrid').removeClass('show');
    $('#lastUpdatedBadge').removeClass('show');
    $('#pfDot').removeClass('live error loading');
    $('#pfStatusText').text('Reset to defaults');
    pricesFetched = false;
    addLog('warn', '⚠ All prices reset to system defaults');
    updateEstimate();
    toast('Prices reset to default values', 'warning');
  });

  /* ── Toggle AJAX Log ── */
  $('#logToggle').on('click', function () {
    const log = $('#ajaxLog');
    if (log.hasClass('show')) {
      log.removeClass('show');
      $(this).text('▶ Show AJAX Log');
    } else {
      log.addClass('show');
      $(this).text('▼ Hide AJAX Log');
    }
  });

  /* ── Warn when material grade changes after fetch ── */
  $('#cementGrade, #wallMaterial, #steelGrade, #sandType').on('change', function () {
    if (pricesFetched) {
      addLog('warn', '⚠ Material changed — re-fetch for accurate prices');
      $('#pfDot').removeClass('live').addClass('loading');
      $('#pfStatusText').text('Re-fetch recommended');
      toast('Material changed — re-fetch prices', 'warning');
    }
  });

});

/* ── Update price chip display ── */
function updateChip(key, val, trend) {
  $('#chip-' + key + '-val').text(val);
  const map = { up: '↑ UP', down: '↓ DOWN', stable: '→ STABLE' };
  $('#chip-' + key + '-trend').text(map[trend] || '').attr('class', 'pc-trend ' + trend);
  $('#chip-' + key).addClass('updated');
  setTimeout(() => $('#chip-' + key).removeClass('updated'), 600);
}

/* ── Add a line to the AJAX log ── */
function addLog(type, text) {
  const t = new Date().toLocaleTimeString('en-IN', { hour12: false });
  $('#ajaxLog').append($('<div>').addClass('log-line ' + type).text('[' + t + '] ' + text));
  const el = document.getElementById('ajaxLog');
  el.scrollTop = el.scrollHeight;
}

/* ══════════════════════════════════════════
   VANILLA JS — CORE FORM LOGIC
══════════════════════════════════════════ */

/* ── DOMContentLoaded init ── */
document.addEventListener('DOMContentLoaded', () => {
  setMinDate();
  autoCalculateMaterials();
  updateEstimate();
  initRadioGroups();
  initCheckItems();
});

/* ── Radio group visual selection ── */
function initRadioGroups() {
  document.querySelectorAll('.radio-group').forEach(g => {
    g.querySelectorAll('.radio-item').forEach(item => {
      item.addEventListener('click', () => {
        g.querySelectorAll('.radio-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        const r = item.querySelector('input[type="radio"]');
        if (r) r.checked = true;
        updateEstimate();
      });
    });
  });
}

/* ── Checkbox visual toggle ── */
function initCheckItems() {
  document.querySelectorAll('.check-item').forEach(item => {
    const cb = item.querySelector('input[type="checkbox"]');
    if (cb && cb.checked) item.classList.add('checked');
    item.addEventListener('click', e => {
      if (e.target !== cb) cb.checked = !cb.checked;
      item.classList.toggle('checked', cb.checked);
      updateEstimate();
    });
  });
}

function handleCheckbox(cb) {
  const i = cb.closest('.check-item');
  if (i) i.classList.toggle('checked', cb.checked);
  updateEstimate();
}

/* ── Blur validation ── */
document.addEventListener('blur', e => {
  if (e.target?.id) validateField(e.target.id);
}, true);

/* ── Input: live estimate + textarea resize ── */
document.addEventListener('input', e => {
  const liveFields = ['plotArea','builtupArea','cementPrice','brickPrice','steelPrice','sandPrice','jellyPrice','flooringRate'];
  if (liveFields.includes(e.target?.id)) {
    autoCalculateMaterials();
    updateEstimate();
  }
  if (e.target?.tagName === 'TEXTAREA') {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }
}, true);

/* ── Scroll: live bar shadow ── */
window.addEventListener('scroll', () => {
  document.getElementById('liveEstimate').style.boxShadow =
    window.scrollY > 200 ? '0 -4px 24px rgba(0,0,0,0.3)' : 'none';
});

/* ── Warn before leaving mid-form ── */
window.addEventListener('beforeunload', e => {
  if (currentStep > 1 && currentStep < 5) {
    e.preventDefault();
    e.returnValue = '';
  }
});

/* ── Ctrl+Enter to advance step ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.ctrlKey && currentStep < 5) nextStep(currentStep);
});

/* ── Number field clamping + estimate trigger ── */
document.addEventListener('change', e => {
  if (e.target?.type === 'number' && !e.target.readOnly) {
    const min = parseFloat(e.target.min), max = parseFloat(e.target.max), val = parseFloat(e.target.value);
    if (!isNaN(min) && val < min) e.target.value = min;
    if (!isNaN(max) && val > max) e.target.value = max;
  }
  if (e.target?.id) {
    autoCalculateMaterials();
    updateEstimate();
    validateField(e.target.id);
  }
}, true);

/* ── Modal close handlers ── */
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOk').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

/* ── Counter +/− ── */
function changeCounter(f, d) {
  const el = document.getElementById(f);
  if (!el) return;
  el.value = Math.max(parseInt(el.min) || 1, Math.min(parseInt(el.max) || 99, parseInt(el.value) + d));
  autoCalculateMaterials();
  updateEstimate();
}

/* ══════════════════════════════════════════
   VALIDATION
══════════════════════════════════════════ */

const validators = {
  ownerName:    v => v.trim().length >= 3,
  ownerPhone:   v => /^[6-9]\d{9}$/.test(v.trim()),
  ownerEmail:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  projectName:  v => v.trim().length >= 2,
  city:         v => v.trim().length >= 2,
  district:     v => v !== '',
  plotArea:     v => v >= 100 && v <= 50000,
  builtupArea:  v => v >= 200 && v <= 10000,
  startDate:    v => v !== '' && new Date(v) > new Date(),
  cementGrade:  v => v !== '',
  cementPrice:  v => v >= 200 && v <= 700,
  wallMaterial: v => v !== '',
  roofType:     v => v !== '',
  flooringType: v => v !== '',
  paintInterior: v => v !== '',
  paintExterior: v => v !== '',
  mainDoorType: v => v !== '',
  windowType:   v => v !== '',
  pipeType:     v => v !== '',
  wiringType:   v => v !== ''
};

function validateField(id) {
  const el  = document.getElementById(id);
  const err = document.getElementById('err-' + id);
  if (!el || !validators[id]) return true;
  const v = validators[id](el.value);
  el.classList.toggle('error', !v);
  el.classList.toggle('valid',  v);
  if (err) err.classList.toggle('show', !v);
  return v;
}

function validateStep(step) {
  const sf = {
    1: ['ownerName','ownerPhone','ownerEmail','projectName','city','district','plotArea','builtupArea','startDate'],
    2: ['cementGrade','cementPrice','wallMaterial','roofType'],
    3: ['flooringType','paintInterior','paintExterior','mainDoorType','windowType'],
    4: ['pipeType','wiringType'],
    5: []
  };
  let ok = true;
  (sf[step] || []).forEach(id => { if (!validateField(id)) ok = false; });
  return ok;
}

/* ══════════════════════════════════════════
   STEP NAVIGATION
══════════════════════════════════════════ */

function nextStep(step) {
  if (!validateStep(step)) {
    toast('Fill all required fields correctly', 'error');
    const e = document.querySelector('.error');
    if (e) e.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (step < TOTAL_STEPS) {
    goToStep(step + 1);
    if (step + 1 === 5) buildSummaryUI();
  }
}

function prevStep(step) {
  if (step > 1) goToStep(step - 1);
}

function goToStep(n) {
  document.querySelectorAll('.form-card').forEach(c => c.classList.remove('active'));
  document.getElementById('form-step-' + n).classList.add('active');

  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const num   = document.getElementById('step-num-' + i);
    const title = document.getElementById('step-title-' + i);
    num.classList.remove('active', 'done');
    if (title) title.classList.remove('active');

    if (i < n)      { num.classList.add('done');   num.textContent = '✓'; }
    else if (i === n) { num.classList.add('active'); num.textContent = i; if (title) title.classList.add('active'); }
    else              { num.textContent = i; }
  }

  currentStep = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ══════════════════════════════════════════
   AUTO CALCULATE MATERIAL QUANTITIES
══════════════════════════════════════════ */

function autoCalculateMaterials() {
  const b = parseFloat(document.getElementById('builtupArea')?.value) || 0;
  const f = parseInt(document.getElementById('floors')?.value) || 1;
  const a = b * f;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set('cementBags', Math.ceil(a * 0.4));
  set('brickCount', Math.ceil(a * 0.6 * 8));
  set('steelMT',    (a * 4 / 1000).toFixed(2));
  set('sandQty',    Math.ceil(a * 1.5));
}

/* ══════════════════════════════════════════
   COST ESTIMATION ENGINE
══════════════════════════════════════════ */

const RATES = {
  paintInterior: { economy: 25, standard: 40, premium: 65, luxury: 90 },
  paintExterior: { cement_primer: 30, standard: 50, premium: 75 },
  flooring:      { vitrified: 85, ceramic: 55, marble: 180, granite: 160, wooden: 120, kota: 45 },
  mainDoor:      { teak: 45000, hardwood: 28000, engineered: 18000, steel: 12000, fibre: 8000 },
  bedroomDoor:   { plywood: 6000, hollow: 4000, solid: 12000 },
  window:        { aluminum: 4500, upvc: 6000, wood: 5500, steel: 3500 },
  sanitary:      { economy: 25000, standard: 55000, premium: 120000 },
  wiring:        { standard: 35, concealed: 50, premium: 65 },
  furniture:     { none: 0, basic: 200000, standard: 700000, premium: 1500000, luxury: 2500000 },
  pipe:          { cpvc: 40, upvc: 30, ppr: 55, gi: 35 }
};

const EXTRAS = {
  false_ceiling: 50000, modular_kitchen: 250000, wardrobes: 80000,
  staircase_railing: 60000, grilles: 40000, sunshade: 30000,
  solar: 180000, inverter: 35000, cctv: 25000, intercom: 15000,
  home_theater: 80000, smart_home: 150000,
  compound_wall: 150000, gate: 50000, driveway: 80000,
  garden: 100000, parking_shade: 60000, septic_tank: 40000
};

function updateEstimate() {
  const b     = parseFloat(document.getElementById('builtupArea')?.value) || 0;
  const f     = parseInt(document.getElementById('floors')?.value) || 1;
  const a     = b * f;
  const beds  = parseInt(document.getElementById('bedrooms')?.value) || 2;
  const baths = parseInt(document.getElementById('bathrooms')?.value) || 2;

  if (!a) { document.getElementById('totalAmt').textContent = '0'; return; }

  const g = id => parseFloat(document.getElementById(id)?.value) || 0;
  const s = id => document.getElementById(id)?.value || '';

  /* Structure costs */
  const cC   = a * 0.4 * (g('cementPrice') || 380);
  const bC   = a * 0.6 * 8 / 1000 * (g('brickPrice') || 7500);
  const stC  = a * 4 / 1000 * (g('steelPrice') || 65000);
  const sC   = a * 1.5 * (g('sandPrice') || 55);
  const jC   = a * 0.8 * (g('jellyPrice') || 40);
  const rR   = { rcc_slab: 180, mangalore: 120, sheet: 80, concrete_tile: 140 };
  const rC   = b * (rR[s('roofType')] || 180);
  const fndC = a * 450;
  const stru = cC + bC + stC + sC + jC + rC + fndC;

  /* Finishes costs */
  const flR = g('flooringRate') || (RATES.flooring[s('flooringType')] || 85);
  const flC = a * flR;
  const piC = (a * 3.5) * (RATES.paintInterior[s('paintInterior')] || 40) * ((parseInt(document.getElementById('paintCoats')?.value) || 2) / 2);
  const peC = (a * 1.5) * (RATES.paintExterior[s('paintExterior')] || 50);
  const mdC = RATES.mainDoor[s('mainDoorType')] || 28000;
  const bdC = beds * (RATES.bedroomDoor[s('bedroomDoorType')] || 6000);
  const wC  = (parseInt(document.getElementById('windowCount')?.value) || 8) * (RATES.window[s('windowType')] || 4500);
  const fin = flC + piC + peC + mdC + bdC + wC;

  /* MEP costs */
  const plC    = a * (RATES.pipe[s('pipeType')] || 40);
  const sanC   = baths * (RATES.sanitary[s('sanitaryQuality')] || 55000);
  const wiring = a * (RATES.wiring[s('wiringType')] || 35) +
                 ((parseInt(document.getElementById('lightPoints')?.value) || 20) +
                  (parseInt(document.getElementById('powerPoints')?.value) || 15)) * 800;
  const mep = plC + sanC + wiring;

  /* Extras */
  let ext = 0;
  document.querySelectorAll('.check-item input[type="checkbox"]:checked').forEach(cb => { ext += EXTRAS[cb.value] || 0; });
  ext += RATES.furniture[s('furnitureBudget')] || 0;

  /* Overheads */
  const lM  = { daily: 1.15, contract: 1.0, full_turnkey: 1.25 };
  const lC  = (stru + fin + mep) * ((lM[s('labourType') || 'contract']) - 1);
  const aF  = document.getElementById('archFees')?.querySelector('.radio-item.selected')?.dataset.val === 'yes'
              ? (stru + fin + mep) * 0.04 : 0;

  let sub   = stru + fin + mep + ext + lC + aF;
  const cont = g('contingency') || 0.1;
  sub += sub * cont;

  const gst   = document.getElementById('gstRadio')?.querySelector('.radio-item.selected')?.dataset.val === 'yes'
                ? sub * 0.05 : 0;
  const total = sub + gst;

  /* Update DOM */
  document.getElementById('totalAmt').textContent        = formatINR(total);
  document.getElementById('est-structure').textContent   = '₹' + formatINR(stru);
  document.getElementById('est-finishes').textContent    = '₹' + formatINR(fin);
  document.getElementById('est-mep').textContent         = '₹' + formatINR(mep);
  document.getElementById('est-extras').textContent      = '₹' + formatINR(ext);

  /* Store breakdown globally for summary use */
  window._buildEstimate = {
    structureCost: stru, finishesCost: fin, mepCost: mep, extrasCost: ext,
    labourCost: lC, archCost: aF,
    contingencyCost: sub * cont / (1 + cont),
    gstCost: gst, total,
    cementCost: cC, brickCost: bC, steelCost: stC,
    sandCost: sC, jellyCost: jC, roofCost: rC, foundCost: fndC,
    flooringCost: flC, paintInCost: piC, paintExCost: peC,
    mainDoorCost: mdC, bedDoorCost: bdC, winCost: wC,
    plumbingCost: plC, sanitaryCost: sanC, wiringCost: wiring
  };
}

/* ══════════════════════════════════════════
   SUMMARY (STEP 5)
══════════════════════════════════════════ */

function buildSummaryUI() {
  updateEstimate();
  const e       = window._buildEstimate || {};
  const name    = document.getElementById('ownerName')?.value || '—';
  const project = document.getElementById('projectName')?.value || '—';
  const city    = document.getElementById('city')?.value || '—';
  const area    = (parseFloat(document.getElementById('builtupArea')?.value) || 0) *
                  (parseInt(document.getElementById('floors')?.value) || 1);

  const rows = [
    ['Foundation',  e.foundCost],
    ['Cement',      e.cementCost],
    ['Bricks',      e.brickCost],
    ['Steel',       e.steelCost],
    ['Sand & Jelly',(e.sandCost || 0) + (e.jellyCost || 0)],
    ['Roofing',     e.roofCost],
    ['Flooring',    e.flooringCost],
    ['Interior Paint', e.paintInCost],
    ['Exterior Paint', e.paintExCost],
    ['Doors',       (e.mainDoorCost || 0) + (e.bedDoorCost || 0)],
    ['Windows',     e.winCost],
    ['Plumbing',    e.plumbingCost],
    ['Sanitary',    e.sanitaryCost],
    ['Electrical',  e.wiringCost],
    ['Extras & Furniture', e.extrasCost],
    ['Labour',      e.labourCost],
    ['Architect Fees', e.archCost],
    ['Contingency', e.contingencyCost],
    ['GST (5%)',    e.gstCost]
  ].filter(([, v]) => v && v > 0);

  document.getElementById('summaryBody').innerHTML = `
    <div style="background:var(--success-light);border:1px solid #A3D4AE;border-left:4px solid var(--success);padding:16px 20px;margin-bottom:24px;font-size:0.85rem;color:var(--success)">
      ✓ <strong>${project}</strong> — ${name} — ${city} | Area: <strong>${area} sq.ft</strong>
      ${pricesFetched ? ' | 📡 <em>Live prices via AJAX</em>' : ''}
    </div>
    <table class="summary-table">
      <thead><tr><th>Cost Head</th><th style="text-align:right">Amount (₹)</th></tr></thead>
      <tbody>
        ${rows.map(([l, v]) => `<tr><td>${l}</td><td class="amount">₹ ${formatINR(v)}</td></tr>`).join('')}
      </tbody>
      <tfoot>
        <tr><td>TOTAL CONSTRUCTION COST</td><td class="amount">₹ ${formatINR(e.total)}</td></tr>
      </tfoot>
    </table>
    <div style="margin-top:20px;padding:16px;background:var(--bg);border:1px solid var(--border);font-size:0.78rem;color:var(--text-muted);font-family:var(--mono)">
      Note: Estimates are approximate. Actual costs may vary ±10–15%.
    </div>
  `;
}

/* ══════════════════════════════════════════
   SAVE TO DASHBOARD
══════════════════════════════════════════ */

function saveDashboard() {
  const e = window._buildEstimate || {};
  const s = {
    projectName: document.getElementById('projectName')?.value || 'My Project',
    ownerName:   document.getElementById('ownerName')?.value,
    city:        document.getElementById('city')?.value,
    district:    document.getElementById('district')?.value,
    floors:      document.getElementById('floors')?.value,
    builtupArea: document.getElementById('builtupArea')?.value,
    plotArea:    document.getElementById('plotArea')?.value,
    date:        new Date().toLocaleDateString('en-IN'),
    estimate: e,
    total: e.total || 0
  };

  const ex  = JSON.parse(localStorage.getItem('buildwise_projects') || '[]');
  const idx = ex.findIndex(p => p.projectName === s.projectName);
  if (idx >= 0) ex[idx] = s; else ex.push(s);
  localStorage.setItem('buildwise_projects', JSON.stringify(ex));
  toast('Saved! Redirecting to Dashboard...', 'success');
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
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

function setMinDate() {
  const el = document.getElementById('startDate');
  if (el) el.min = new Date().toISOString().split('T')[0];
}

function updateRangeLabel(inputId, labelId, suffix) {
  document.getElementById(labelId).textContent = document.getElementById(inputId).value + suffix;
}

function toast(msg, type = 'info') {
  const icons = { success: '✓', error: '✕', warning: '⚠', info: '→', blue: '📡' };
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'blue' ? 'blue' : ''}`;
  t.innerHTML = `<span>${icons[type] || '→'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function showInfo() {
  document.getElementById('modalTitle').textContent = 'About BuildWise Estimates';
  document.getElementById('modalSubtitle').textContent = 'AJAX + jQuery price fetching';
  document.getElementById('modalBody').innerHTML = `
    <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.8">
      BuildWise uses <strong>jQuery \$.ajax()</strong> to fetch live material prices from <code>prices.json</code>.<br><br>
      Prices auto-fill cement, brick, steel, sand, and jelly fields based on your selected grades.
      An AJAX log shows the full request lifecycle.<br><br>
      <strong>Norms:</strong> Cement 0.4 bags/sqft · Steel 4 kg/sqft · Sand 1.5 cu.ft/sqft
    </p>
  `;
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}