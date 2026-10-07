/* ══════════════════════════════════════════
   BUILDWISE — LIVE PRICE FETCHER JS
   prices.js
   Requires: jQuery 3.7.1
══════════════════════════════════════════ */

/* ── State variables ── */
let fetchedData      = null;
let savedPrices      = {};
let autoRefreshTimer = null;
let countdownTimer   = null;
let countdownVal     = 30;
let logCount         = 2; /* 2 system lines already in HTML */
let activeCategory   = 'all';
let activeTrend      = 'all';
let searchQuery      = '';

/* ── Category config ── */
const CATEGORIES = {
  cement_43:      { cat: 'cement', color: '#C8401A', icon: '🏗️' },
  cement_53:      { cat: 'cement', color: '#C8401A', icon: '🏗️' },
  cement_33:      { cat: 'cement', color: '#C8401A', icon: '🏗️' },
  brick_country:  { cat: 'brick',  color: '#8B6914', icon: '🧱' },
  brick_flyash:   { cat: 'brick',  color: '#8B6914', icon: '🧱' },
  brick_aac:      { cat: 'brick',  color: '#8B6914', icon: '🧱' },
  brick_red:      { cat: 'brick',  color: '#8B6914', icon: '🧱' },
  brick_concrete: { cat: 'brick',  color: '#8B6914', icon: '🧱' },
  steel_fe500:    { cat: 'steel',  color: '#1A3D6B', icon: '⚙️' },
  steel_fe415:    { cat: 'steel',  color: '#1A3D6B', icon: '⚙️' },
  steel_fe550:    { cat: 'steel',  color: '#1A3D6B', icon: '⚙️' },
  sand_msand:     { cat: 'sand',   color: '#2E6B3E', icon: '🪨' },
  sand_river:     { cat: 'sand',   color: '#2E6B3E', icon: '🪨' },
  sand_psand:     { cat: 'sand',   color: '#2E6B3E', icon: '🪨' },
  jelly:          { cat: 'sand',   color: '#2E6B3E', icon: '🪨' }
};

/* ══════════════════════════════════════════
   JQUERY DOCUMENT READY
══════════════════════════════════════════ */
$(document).ready(function () {

  /* EH 1: Fetch button click */
  $('#btnFetch').on('click', function () {
    fetchPrices();
  });

  /* EH 2: Auto-refresh toggle */
  $('#btnAutoRefresh').on('click', function () {
    if (autoRefreshTimer) {
      stopAutoRefresh();
    } else {
      startAutoRefresh();
    }
  });

  /* EH 3: Clear log */
  $('#btnClearLog').on('click', function () {
    $('#ajaxLog').empty();
    logCount = 0;
    updateLogCount();
    addLog('info', 'Log cleared.');
    toast('Log cleared', 'info');
  });

  /* EH 4: Apply all to project */
  $('#btnApplyAll').on('click', function () {
    if (!fetchedData) return;
    applyAllToProject();
  });

  /* EH 5: Search input */
  $('#searchInput').on('input', function () {
    searchQuery = $(this).val().toLowerCase();
    applyFilters();
  });

  /* EH 6: Category filter dropdown */
  $('#categoryFilter').on('change', function () {
    activeCategory = $(this).val();
    syncCatTabs(activeCategory);
    applyFilters();
  });

  /* EH 7: Trend filter dropdown */
  $('#trendFilter').on('change', function () {
    activeTrend = $(this).val();
    applyFilters();
  });

  /* EH 8: Keyboard shortcut — press F to fetch */
  $(document).on('keydown', function (e) {
    if (e.key === 'f' && !$(e.target).is('input, select, textarea')) {
      fetchPrices();
    }
  });

  /* EH 9: beforeunload warning if prices not saved */
  $(window).on('beforeunload', function () {
    if (fetchedData && Object.keys(savedPrices).length === 0) {
      return 'You have fetched prices but not applied them to your project.';
    }
  });

  /* Init log */
  addLog('info', 'jQuery ' + $.fn.jquery + ' loaded.');
  addLog('info', 'Press F or click Fetch to begin.');
});

/* ══════════════════════════════════════════
   CORE AJAX FETCH
══════════════════════════════════════════ */
function fetchPrices() {
  const $btn = $('#btnFetch');

  /* Loading state */
  $btn.prop('disabled', true);
  $('#fetchSpinner').show();
  $('#fetchBtnText').text('Fetching...');
  $('#statusDot').removeClass('live error').addClass('loading');
  $('#statusText').html('<strong>Fetching</strong> — AJAX request in progress...');

  addLog('info', '─────────────────────────');
  addLog('info', '→ $.ajax() GET prices.json');
  addLog('info', '→ timeout: 8000ms');

  /* EH 10: jQuery $.ajax() call */
  $.ajax({
    url: 'prices.json',
    type: 'GET',
    dataType: 'json',
    timeout: 8000,

    /* EH 11: beforeSend */
    beforeSend: function () {
      addLog('info', '→ Request sent. Awaiting response...');
    },

    /* EH 12: success */
    success: function (data, textStatus) {
      fetchedData = data;
      const keys  = Object.keys(data.prices);

      addLog('success', '✓ HTTP 200 OK — ' + textStatus);
      addLog('info',    '→ Records: ' + keys.length);
      addLog('info',    '→ Source: ' + data.source);
      addLog('info',    '→ Rendering cards...');

      renderCards(data.prices);

      /* Update status bar */
      $('#statusDot').removeClass('loading error').addClass('live');
      $('#statusText').html('<strong>Live</strong> — ' + keys.length + ' prices loaded');
      $('#statusMeta').text('Fetched at ' + new Date().toLocaleTimeString('en-IN') + ' | ' + data.source);

      /* Update summary sidebar */
      const up     = keys.filter(k => data.prices[k].trend === 'up').length;
      const down   = keys.filter(k => data.prices[k].trend === 'down').length;
      const stable = keys.filter(k => data.prices[k].trend === 'stable').length;

      $('#sum-status').text('✓ Loaded').css('color', 'var(--success)');
      $('#sum-count').text(keys.length + ' / ' + keys.length);
      $('#sum-up').text(up + ' materials');
      $('#sum-down').text(down + ' materials');
      $('#sum-stable').text(stable + ' materials');
      $('#sum-time').text(new Date().toLocaleTimeString('en-IN'));
      $('#btnApplyAll').prop('disabled', false);

      addLog('success', '✓ Done — prices are live');
      toast(keys.length + ' prices loaded!', 'blue');
    },

    /* EH 13: error */
    error: function (jqXHR, textStatus, errorThrown) {
      addLog('error', '✕ AJAX failed: ' + textStatus);
      addLog('error', '✕ ' + (errorThrown || 'Unknown'));
      addLog('warn',  '⚠ Run via Live Server — not file://');

      $('#statusDot').removeClass('loading live').addClass('error');
      $('#statusText').html('<strong>Error</strong> — Could not fetch prices');
      $('#sum-status').text('✕ Failed').css('color', 'var(--accent)');

      toast('AJAX failed — open with Live Server in VS Code', 'error');
    },

    /* EH 14: complete */
    complete: function (jqXHR, textStatus) {
      $('#fetchSpinner').hide();
      $('#fetchBtnText').text('⬇ Fetch Live Prices');
      $btn.prop('disabled', false);
      addLog('info', '→ complete() fired | ' + textStatus);
    }
  });
}

/* ══════════════════════════════════════════
   RENDER CARDS
══════════════════════════════════════════ */
function renderCards(prices) {
  /* Remove skeletons */
  $('#pricesGrid').empty();

  const trendLabel = { up: '↑ Rising', down: '↓ Falling', stable: '→ Stable' };

  $.each(prices, function (key, item) {
    const cfg    = CATEGORIES[key] || { cat: 'other', color: '#9C9389', icon: '📦' };
    const change = item.change !== 0
      ? (item.change > 0 ? '+' : '') + '₹' + Math.abs(item.change) + ' this week'
      : 'No change this week';

    const card = `
      <div class="price-card"
           id="card-${key}"
           data-category="${cfg.cat}"
           data-trend="${item.trend}"
           data-name="${item.name.toLowerCase()}">
        <div class="card-category">
          <div class="cat-dot" style="background:${cfg.color}"></div>
          ${cfg.cat.toUpperCase()} &nbsp;${cfg.icon}
        </div>
        <div class="card-name">${item.name}</div>
        <div class="card-price">₹ ${item.price.toLocaleString('en-IN')}</div>
        <div class="card-unit">${item.unit}</div>
        <div class="card-trend ${item.trend}">${trendLabel[item.trend]}</div>
        <div class="card-change ${item.trend}">${change}</div>
        <button class="card-apply" id="apply-${key}"
                onclick="saveSinglePrice('${key}', ${item.price}, '${item.name}')">
          + Save to Project
        </button>
      </div>
    `;

    $('#pricesGrid').append(card);

    /* Staggered flash animation */
    const delay = Object.keys(prices).indexOf(key) * 50;
    setTimeout(function () {
      $('#card-' + key).addClass('updated');
      setTimeout(function () { $('#card-' + key).removeClass('updated'); }, 600);
    }, delay);
  });

  applyFilters();
}

/* ══════════════════════════════════════════
   FILTERS
══════════════════════════════════════════ */

/* EH 15: Filter by search text */
function filterCards(query) {
  searchQuery = query.toLowerCase();
  applyFilters();
}

/* EH 16: Filter by category (tab click) */
function filterByCategory(cat) {
  activeCategory = cat;
  $('#categoryFilter').val(cat);
  applyFilters();
}

/* EH 17: Set active category tab */
function setActiveTab(el) {
  $('.cat-tab').removeClass('active');
  $(el).addClass('active');
}

function syncCatTabs(cat) {
  $('.cat-tab').removeClass('active');
  $('.cat-tab').each(function () {
    const txt = $(this).text().trim().toLowerCase();
    if (cat === 'all' && txt === 'all') $(this).addClass('active');
    else if (cat !== 'all' && txt.startsWith(cat.substring(0, 3))) $(this).addClass('active');
  });
}

function applyFilters() {
  let visible = 0;

  $('.price-card').each(function () {
    const cat    = $(this).data('category') || '';
    const trend  = $(this).data('trend')    || '';
    const name   = $(this).data('name')     || '';

    const matchCat    = activeCategory === 'all' || cat === activeCategory;
    const matchTrend  = activeTrend    === 'all' || trend === activeTrend;
    const matchSearch = searchQuery    === ''    || name.includes(searchQuery);

    if (matchCat && matchTrend && matchSearch) {
      $(this).show();
      visible++;
    } else {
      $(this).hide();
    }
  });

  $('#noResults').remove();
  if (visible === 0 && fetchedData) {
    $('#pricesGrid').append(`
      <div class="no-results" id="noResults">
        <h3>No materials found</h3>
        <p>Try clearing the search or changing the filter.</p>
      </div>
    `);
  }
}

/* ══════════════════════════════════════════
   SAVE PRICES TO localStorage
══════════════════════════════════════════ */

/* EH 18: Save single price */
function saveSinglePrice(key, price, name) {
  savedPrices[key] = { price: price, name: name };
  $('#apply-' + key).text('✓ Saved').addClass('saved');
  const count = Object.keys(savedPrices).length;
  $('#sum-saved').text(count + ' price' + (count !== 1 ? 's' : ''));
  localStorage.setItem('buildwise_live_prices', JSON.stringify(savedPrices));
  addLog('success', '✓ Saved: ' + name + ' → ₹' + price);
  toast(name + ' saved!', 'success');
}

/* EH 19: Apply all prices */
function applyAllToProject() {
  if (!fetchedData) return;
  $.each(fetchedData.prices, function (key, item) {
    savedPrices[key] = { price: item.price, name: item.name };
    $('#apply-' + key).text('✓ Saved').addClass('saved');
  });
  const count = Object.keys(savedPrices).length;
  $('#sum-saved').text(count + ' prices');
  localStorage.setItem('buildwise_live_prices', JSON.stringify(savedPrices));
  addLog('success', '✓ All ' + count + ' prices saved to localStorage');
  addLog('info', '→ Key: buildwise_live_prices');
  toast('All ' + count + ' prices saved to project!', 'success');
}

/* ══════════════════════════════════════════
   AUTO-REFRESH
══════════════════════════════════════════ */

/* EH 20: Start auto refresh */
function startAutoRefresh() {
  countdownVal = 30;
  $('#btnAutoRefresh').text('⏹ Stop Auto-Refresh');
  $('#countdownWrap').css('display', 'flex');
  addLog('info', '→ Auto-refresh ON — every 30 seconds');
  fetchPrices();
  updateCountdownUI();

  countdownTimer = setInterval(function () {
    countdownVal--;
    updateCountdownUI();
    if (countdownVal <= 0) {
      countdownVal = 30;
      fetchPrices();
    }
  }, 1000);

  autoRefreshTimer = true;
  toast('Auto-refresh enabled', 'blue');
}

function stopAutoRefresh() {
  clearInterval(countdownTimer);
  autoRefreshTimer = null;
  countdownTimer   = null;
  $('#btnAutoRefresh').text('⏱ Enable Auto-Refresh (30s)');
  $('#countdownWrap').hide();
  addLog('warn', '⚠ Auto-refresh stopped');
  toast('Auto-refresh stopped', 'warning');
}

function updateCountdownUI() {
  const offset = 69.1 - ((30 - countdownVal) / 30) * 69.1;
  $('#countdownRing').css('stroke-dashoffset', offset);
  $('#countdownNum').text(countdownVal + 's');
}

/* ══════════════════════════════════════════
   LOG & TOAST HELPERS
══════════════════════════════════════════ */

function addLog(type, text) {
  const time = new Date().toLocaleTimeString('en-IN', { hour12: false });
  $('#ajaxLog').append(
    $('<div>').addClass('log-line ' + type).text('[' + time + '] ' + text)
  );
  const el = document.getElementById('ajaxLog');
  el.scrollTop = el.scrollHeight;
  logCount++;
  updateLogCount();
}

function updateLogCount() {
  $('#logCount').text(logCount + ' entr' + (logCount === 1 ? 'y' : 'ies'));
}

function toast(msg, type) {
  type = type || 'info';
  const icons = { success: '✓', error: '✕', warning: '⚠', info: '→', blue: '📡' };
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = '<span>' + (icons[type] || '→') + '</span> ' + msg;
  c.appendChild(t);
  setTimeout(function () { t.remove(); }, 3500);
}