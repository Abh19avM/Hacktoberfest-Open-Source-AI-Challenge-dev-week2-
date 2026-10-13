import './style.css';
import confetti from 'canvas-confetti';
import { SAMPLE_INVOICES } from './sampleInvoices.js';
import { checkOllamaStatus, auditInvoiceWithModel } from './ollamaService.js';

// State
const state = {
  invoices: JSON.parse(localStorage.getItem('vault_invoices') || '[]'),
  availableModels: [],
  activeModel: 'llama3.1:8b',
  ollamaOnline: false,
  isAuditing: false,
  filterCategory: 'all',
  searchQuery: '',
  expandedId: null,
  currentInputText: SAMPLE_INVOICES[0].text,
};

// Seed with clean realistic records if empty
if (state.invoices.length === 0) {
  state.invoices = [
    {
      id: 'inv-1',
      vendor: 'Amazon Web Services',
      invoiceNumber: 'INV-AWS-9081248',
      date: 'Oct 01, 2026',
      total: 238.21,
      tax: 0.00,
      taxCategory: 'Software & Cloud Hosting',
      deductiblePercent: 100,
      deductibleAmount: 238.21,
      scheduleCLine: 'Line 18 (Office & Software)',
      auditRisk: 'Low',
      auditReasons: ['100% ordinary & necessary freelance cloud compute infrastructure.'],
      modelUsed: 'llama3.1:8b',
      lineItems: [
        { description: 'EC2 API Cluster', amount: 148.50 },
        { description: 'S3 DB Backups (320 GB)', amount: 7.36 },
        { description: 'RDS PostgreSQL', amount: 68.20 },
        { description: 'Route 53 & CloudFront', amount: 14.15 },
      ],
    },
    {
      id: 'inv-2',
      vendor: 'Apex Digital Design LLC',
      invoiceNumber: 'APX-2026-042',
      date: 'Oct 08, 2026',
      total: 3170.00,
      tax: 0.00,
      taxCategory: 'Contract Labor',
      deductiblePercent: 100,
      deductibleAmount: 3170.00,
      scheduleCLine: 'Line 11 (Contract Labor)',
      auditRisk: 'Low',
      auditReasons: ['Subcontractor fee > $600. File Form 1099-NEC by Jan 31.'],
      modelUsed: 'llama3.1:8b',
      lineItems: [
        { description: 'Mobile UX Wireframes (20 hrs)', amount: 1700.00 },
        { description: 'Design System Library (12 hrs)', amount: 1020.00 },
        { description: 'User Testing Synthesis Report', amount: 450.00 },
      ],
    },
    {
      id: 'inv-3',
      vendor: 'Bistro Voltaire',
      invoiceNumber: 'BV-88410',
      date: 'Oct 09, 2026',
      total: 451.40,
      tax: 30.28,
      taxCategory: 'Business Meals (50%)',
      deductiblePercent: 50,
      deductibleAmount: 225.70,
      scheduleCLine: 'Line 24b (Deductible Meals)',
      auditRisk: 'Low',
      auditReasons: ['50% statutory limitation applied under IRC § 274(n). Attendees documented.'],
      modelUsed: 'llama3.1:8b',
      lineItems: [
        { description: 'Dinner with Enterprise Client CTO', amount: 336.00 },
        { description: 'Tax & SF Mandate', amount: 45.40 },
        { description: 'Gratuity (20%)', amount: 70.00 },
      ],
    },
  ];
  saveInvoices();
}

function saveInvoices() {
  localStorage.setItem('vault_invoices', JSON.stringify(state.invoices));
}

async function init() {
  const status = await checkOllamaStatus();
  state.ollamaOnline = status.online;
  state.availableModels = status.models || [];
  if (state.availableModels.length > 0 && !state.availableModels.includes(state.activeModel)) {
    state.activeModel = state.availableModels[0];
  }
  render();
}

function getTotals() {
  const total = state.invoices.reduce((acc, i) => acc + (i.total || 0), 0);
  const deductible = state.invoices.reduce((acc, i) => acc + (i.deductibleAmount || 0), 0);
  return {
    total: total.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    deductible: deductible.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    count: state.invoices.length,
  };
}

function render() {
  const app = document.getElementById('app');
  const totals = getTotals();

  const filtered = state.invoices.filter((inv) => {
    const matchesCat = state.filterCategory === 'all' || 
      inv.taxCategory.toLowerCase().includes(state.filterCategory.toLowerCase());
    const matchesSearch = !state.searchQuery || 
      inv.vendor.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(state.searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  app.innerHTML = `
    <div class="app-container">
      <!-- Minimalist Header -->
      <header class="app-header">
        <div class="brand">
          <div class="brand-logo">V</div>
          <div class="brand-text">
            <h1>VaultInvoice</h1>
            <p>Local, zero-cloud expense auditor for freelancers</p>
          </div>
        </div>

        <div class="header-right">
          <div class="status-pill" title="Runs on device with zero data leakage">
            <span class="status-dot"></span>
            <select id="modelSelect" class="model-select">
              ${state.availableModels.map((m) => `<option value="${m}" ${m === state.activeModel ? 'selected' : ''}>${m}</option>`).join('')}
              <option value="simulated-local" ${state.activeModel === 'simulated-local' ? 'selected' : ''}>Deterministic Engine (Offline)</option>
            </select>
          </div>

          <button id="exportCsvBtn" class="btn btn-primary btn-sm">
            Export CSV
          </button>
          <button id="clearBtn" class="btn btn-sm">
            Clear
          </button>
        </div>
      </header>

      <!-- 3 Calm Stats -->
      <section class="stats-strip">
        <div class="stat-box">
          <div class="stat-label">Total Incurred</div>
          <div class="stat-num">${totals.total}</div>
          <div class="stat-hint">${totals.count} receipts processed</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Tax Write-Offs</div>
          <div class="stat-num green">${totals.deductible}</div>
          <div class="stat-hint">Calculated per Schedule C limits</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Privacy Guarantee</div>
          <div class="stat-num">100% Local</div>
          <div class="stat-hint">0 bytes sent to 3rd-party cloud</div>
        </div>
      </section>

      <!-- Main Workspace -->
      <main class="main-grid">
        <!-- Left: Receipt Input -->
        <div class="card">
          <div class="card-title">Add Receipt</div>
          <div class="card-subtitle">Paste invoice text, drop a file, or pick a sample:</div>

          <div id="dropzone" class="dropzone">
            <div class="dropzone-text">Drop receipt or invoice</div>
            <div class="dropzone-sub">Accepts .txt, .pdf, .json, or photos</div>
            <input type="file" id="fileInput" style="display:none;" accept=".txt,.json,.csv,.pdf,image/*">
          </div>

          <div class="sample-bar">
            <span class="sample-bar-label">Try sample:</span>
            ${SAMPLE_INVOICES.map((s) => `
              <button class="sample-btn" data-id="${s.id}">${s.name.split(' ')[0]}</button>
            `).join('')}
          </div>

          <textarea id="rawTextarea" class="textarea-input" placeholder="Paste invoice text here...">${state.currentInputText}</textarea>

          <button id="analyzeBtn" class="btn btn-primary analyze-btn" ${state.isAuditing ? 'disabled' : ''}>
            ${state.isAuditing ? 'Auditing receipt with open model...' : 'Analyze Receipt'}
          </button>

          <!-- Streaming telemetry box -->
          <div id="streamBox" class="stream-box ${state.isAuditing ? 'active' : ''}">
            <div class="stream-meta">
              <span>LOCAL INFERENCE STREAM</span>
              <span id="tokenStats">Processing...</span>
            </div>
            <div id="streamContent" class="stream-content">Generating structured output...</div>
          </div>
        </div>

        <!-- Right: Clean Ledger -->
        <div class="card">
          <div class="ledger-header">
            <div>
              <div class="card-title">Expense Ledger</div>
              <div class="card-subtitle">Click any row to expand itemized details</div>
            </div>

            <div class="ledger-filter-row">
              <button class="filter-chip ${state.filterCategory === 'all' ? 'active' : ''}" data-cat="all">All (${state.invoices.length})</button>
              <button class="filter-chip ${state.filterCategory === 'software' ? 'active' : ''}" data-cat="software">Software</button>
              <button class="filter-chip ${state.filterCategory === 'contract' ? 'active' : ''}" data-cat="contract">Contractors</button>
              <button class="filter-chip ${state.filterCategory === 'meal' ? 'active' : ''}" data-cat="meal">Meals</button>
            </div>
          </div>

          ${filtered.length === 0 ? `
            <div class="empty-box">No expenses recorded yet. Drop a receipt to analyze.</div>
          ` : `
            <div class="expense-list">
              ${filtered.map((inv) => {
                const isExpanded = state.expandedId === inv.id;
                const isMeal = inv.taxCategory.toLowerCase().includes('meal');
                const isHighRisk = inv.auditRisk === 'High';

                return `
                  <div class="expense-row ${isExpanded ? 'expanded' : ''}" data-id="${inv.id}">
                    <div class="expense-main">
                      <div class="expense-left">
                        <div>
                          <div class="expense-vendor">${inv.vendor}</div>
                          <div class="expense-meta">${inv.date} · ${inv.invoiceNumber || 'No ID'}</div>
                        </div>
                        <span class="tag ${isMeal ? 'tag-meal' : ''} ${isHighRisk ? 'tag-flag' : ''}">
                          ${inv.taxCategory} (${inv.deductiblePercent}%)
                        </span>
                      </div>

                      <div class="expense-right">
                        <div>
                          <div class="amount-total">$${(inv.total || 0).toFixed(2)}</div>
                          <div class="amount-deductible">$${(inv.deductibleAmount || 0).toFixed(2)} ded.</div>
                        </div>
                      </div>
                    </div>

                    <!-- Expandable details -->
                    <div class="expense-details">
                      <div class="details-grid">
                        <div class="details-box">
                          <div class="details-box-label">IRS Schedule C Line</div>
                          <div>${inv.scheduleCLine || 'Line 18 (Office)'}</div>
                        </div>
                        <div class="details-box">
                          <div class="details-box-label">Compliance Notes</div>
                          <div>${inv.auditReasons ? inv.auditReasons[0] : 'Substantiated receipt.'}</div>
                        </div>
                      </div>

                      ${inv.lineItems && inv.lineItems.length > 0 ? `
                        <div class="details-box-label">Itemized Breakdown</div>
                        <table class="line-items-table">
                          ${inv.lineItems.map((item) => `
                            <tr>
                              <td>${item.description}</td>
                              <td>$${(item.amount || item.rate || 0).toFixed(2)}</td>
                            </tr>
                          `).join('')}
                        </table>
                      ` : ''}

                      <div class="row-actions">
                        <button class="btn-delete" data-delete-id="${inv.id}">Delete</button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </main>
    </div>
  `;

  attachEvents();
}

function attachEvents() {
  // Model Select
  const modelSelect = document.getElementById('modelSelect');
  if (modelSelect) {
    modelSelect.addEventListener('change', (e) => {
      state.activeModel = e.target.value;
      render();
    });
  }

  // Textarea input
  const rawTextarea = document.getElementById('rawTextarea');
  if (rawTextarea) {
    rawTextarea.addEventListener('input', (e) => {
      state.currentInputText = e.target.value;
    });
  }

  // Sample quick buttons
  document.querySelectorAll('.sample-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sample = SAMPLE_INVOICES.find((s) => s.id === btn.dataset.id);
      if (sample) {
        state.currentInputText = sample.text;
        const textarea = document.getElementById('rawTextarea');
        if (textarea) textarea.value = sample.text;
      }
    });
  });

  // Dropzone file handling
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('active');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('active');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('active');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        readFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        readFile(e.target.files[0]);
      }
    });
  }

  // Filter chips
  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.filterCategory = chip.dataset.cat;
      render();
    });
  });

  // Expense row click expansion
  document.querySelectorAll('.expense-row').forEach((row) => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete')) return;
      const id = row.dataset.id;
      state.expandedId = state.expandedId === id ? null : id;
      render();
    });
  });

  // Delete row button
  document.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.deleteId;
      state.invoices = state.invoices.filter((i) => i.id !== id);
      saveInvoices();
      if (state.expandedId === id) state.expandedId = null;
      render();
    });
  });

  // Analyze button
  const analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', runAnalysis);
  }

  // Clear button
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all receipts from ledger?')) {
        state.invoices = [];
        saveInvoices();
        state.expandedId = null;
        render();
      }
    });
  }

  // Export CSV
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportCsv);
  }
}

function readFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    state.currentInputText = e.target.result;
    const textarea = document.getElementById('rawTextarea');
    if (textarea) textarea.value = state.currentInputText;
  };
  reader.readAsText(file);
}

async function runAnalysis() {
  if (!state.currentInputText || state.currentInputText.trim().length === 0) return;

  state.isAuditing = true;
  render();

  const streamContent = document.getElementById('streamContent');
  const tokenStats = document.getElementById('tokenStats');

  let streamAccumulator = '';
  const onToken = ({ text, totalTokens, elapsedMs }) => {
    streamAccumulator += text;
    if (streamContent) {
      streamContent.textContent = streamAccumulator;
      streamContent.scrollTop = streamContent.scrollHeight;
    }
    if (tokenStats) {
      tokenStats.textContent = `${totalTokens} tokens (${elapsedMs}ms)`;
    }
  };

  const useFallback = state.activeModel === 'simulated-local' || !state.ollamaOnline;

  try {
    const res = await auditInvoiceWithModel({
      text: state.currentInputText,
      modelName: state.activeModel,
      onToken,
      useFallback,
    });

    if (res && res.data) {
      const newEntry = {
        id: `inv-${Date.now()}`,
        ...res.data,
        createdAt: new Date().toISOString(),
      };
      state.invoices.unshift(newEntry);
      saveInvoices();
      state.expandedId = newEntry.id;

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f4f4f5'],
      });
    }
  } catch (err) {
    alert(`Audit failed: ${err.message}`);
  } finally {
    state.isAuditing = false;
    render();
  }
}

function exportCsv() {
  if (state.invoices.length === 0) {
    alert('No receipts to export.');
    return;
  }

  const headers = ['Date', 'Vendor', 'Invoice_No', 'Tax_Category', 'Schedule_C_Line', 'Total_Amount', 'Deductible_Amount'];
  const rows = state.invoices.map((i) => [
    `"${i.date || ''}"`,
    `"${(i.vendor || '').replace(/"/g, '""')}"`,
    `"${i.invoiceNumber || ''}"`,
    `"${(i.taxCategory || '').replace(/"/g, '""')}"`,
    `"${(i.scheduleCLine || '').replace(/"/g, '""')}"`,
    (i.total || 0).toFixed(2),
    (i.deductibleAmount || 0).toFixed(2),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `VaultInvoice_Tax_Export_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

// Start
init();
