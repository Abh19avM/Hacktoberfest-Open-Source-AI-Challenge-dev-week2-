import './style.css';
import confetti from 'canvas-confetti';
import { createIcons, Shield, Cpu, Lock, Download, Trash2, Search, AlertTriangle, CheckCircle, FileText, ArrowRight, X, ExternalLink, HelpCircle, RefreshCw } from 'lucide';
import { SAMPLE_INVOICES } from './sampleInvoices.js';
import { checkOllamaStatus, auditInvoiceWithModel } from './ollamaService.js';

// Application State
const state = {
  invoices: JSON.parse(localStorage.getItem('vault_invoices') || '[]'),
  availableModels: [],
  activeModel: 'llama3.1:8b',
  ollamaOnline: false,
  ollamaLatency: 0,
  isAuditing: false,
  filterCategory: 'all',
  searchQuery: '',
  selectedInvoice: null,
  isWhyOpenModalOpen: false,
  isExportModalOpen: false,
  currentInputText: SAMPLE_INVOICES[0].text,
};

// Seed initial invoices if empty
if (state.invoices.length === 0) {
  state.invoices = [
    {
      id: 'inv-seed-1',
      vendor: 'Amazon Web Services, Inc.',
      invoiceNumber: 'INV-AWS-9081248',
      date: '2026-10-01',
      total: 238.21,
      tax: 0.00,
      currency: 'USD',
      taxCategory: 'Software & Cloud Hosting',
      deductiblePercent: 100,
      deductibleAmount: 238.21,
      scheduleCLine: 'Line 18 (Office & Software Expenses)',
      auditRisk: 'Low',
      auditReasons: ['100% ordinary & necessary freelance cloud compute infrastructure.'],
      modelUsed: 'llama3.1:8b (Local Open-Weight)',
      lineItems: [
        { description: 'Amazon EC2 API Cluster', qty: 1, rate: 148.50, amount: 148.50 },
        { description: 'Amazon S3 DB Backups (320 GB)', qty: 1, rate: 7.36, amount: 7.36 },
        { description: 'Amazon RDS PostgreSQL db.t4g.medium', qty: 1, rate: 68.20, amount: 68.20 },
        { description: 'Route 53 DNS & CloudFront', qty: 1, rate: 14.15, amount: 14.15 }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'inv-seed-2',
      vendor: 'Apex Digital Design LLC',
      invoiceNumber: 'APX-2026-042',
      date: '2026-10-08',
      total: 3170.00,
      tax: 0.00,
      currency: 'USD',
      taxCategory: 'Professional & Legal Services',
      deductiblePercent: 100,
      deductibleAmount: 3170.00,
      scheduleCLine: 'Line 11 (Contract Labor)',
      auditRisk: 'Low',
      auditReasons: ['EIN verified. Form 1099-NEC required by Jan 31 for contractor payment > $600.'],
      modelUsed: 'llama3.1:8b (Local Open-Weight)',
      lineItems: [
        { description: 'Mobile UX Wireframes & Prototype (20 hrs @ $85)', qty: 20, rate: 85, amount: 1700.00 },
        { description: 'Design System & Component Library (12 hrs @ $85)', qty: 12, rate: 85, amount: 1020.00 },
        { description: 'Client User Testing & Synthesis Report', qty: 1, rate: 450, amount: 450.00 }
      ],
      createdAt: new Date().toISOString()
    }
  ];
  saveInvoices();
}

function saveInvoices() {
  localStorage.setItem('vault_invoices', JSON.stringify(state.invoices));
}

// Initial Mount
async function initApp() {
  await refreshOllamaHealth();
  renderApp();
}

async function refreshOllamaHealth() {
  const status = await checkOllamaStatus();
  state.ollamaOnline = status.online;
  state.ollamaLatency = status.latencyMs;
  state.availableModels = status.models || [];

  if (state.availableModels.length > 0 && !state.availableModels.includes(state.activeModel)) {
    state.activeModel = state.availableModels[0];
  }
}

// Calculate Financial & Privacy KPIs
function getKPIs() {
  const totalSpend = state.invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
  const totalDeductible = state.invoices.reduce((acc, inv) => acc + (inv.deductibleAmount || 0), 0);
  const highRiskCount = state.invoices.filter((inv) => inv.auditRisk === 'High').length;
  const estimatedTaxSaved = totalDeductible * 0.30; // ~30% marginal freelance tax bracket (federal + self-employment)

  return {
    totalSpend: totalSpend.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    totalDeductible: totalDeductible.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    estimatedTaxSaved: estimatedTaxSaved.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    count: state.invoices.length,
    highRiskCount,
  };
}

// Categorized Breakdown for Schedule C
function getScheduleCBreakdown() {
  const breakdown = {};
  for (const inv of state.invoices) {
    const key = inv.scheduleCLine || 'Line 27a (Other)';
    if (!breakdown[key]) {
      breakdown[key] = { count: 0, amount: 0, deductible: 0 };
    }
    breakdown[key].count++;
    breakdown[key].amount += inv.total || 0;
    breakdown[key].deductible += inv.deductibleAmount || 0;
  }
  return breakdown;
}

// Main Render Function
function renderApp() {
  const app = document.getElementById('app');
  const kpis = getKPIs();
  const scheduleC = getScheduleCBreakdown();

  // Filter and search invoices
  const filteredInvoices = state.invoices.filter((inv) => {
    const matchesCategory = state.filterCategory === 'all' || 
      inv.taxCategory.toLowerCase().includes(state.filterCategory.toLowerCase());
    const matchesSearch = !state.searchQuery || 
      inv.vendor.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(state.searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  app.innerHTML = `
    <div class="vault-layout">
      <!-- Top Navigation -->
      <header class="vault-header">
        <div class="brand-section">
          <div class="brand-icon-box">
            <i data-lucide="shield" style="width:24px;height:24px;"></i>
          </div>
          <div class="brand-meta">
            <h1>VaultInvoice AI</h1>
            <p>Zero-Knowledge Local Invoice & Expense Auditor for Freelancers</p>
          </div>
        </div>

        <div class="header-status-group">
          <div class="privacy-badge" title="Guaranteed Zero Cloud Leakage">
            <span class="pulse-dot"></span>
            <span>100% Local GPU/CPU · Zero Cloud Egress · $0 API Cost</span>
          </div>

          <div class="model-pill-selector">
            <label for="modelSelect">Open Model:</label>
            <select id="modelSelect" class="model-select-dropdown">
              ${state.availableModels.map((m) => `<option value="${m}" ${m === state.activeModel ? 'selected' : ''}>${m}</option>`).join('')}
              <option value="simulated-local" ${state.activeModel === 'simulated-local' ? 'selected' : ''}>Open Heuristics (Deterministic Engine)</option>
            </select>
            <button id="refreshOllamaBtn" class="btn btn-secondary" style="padding:0.2rem 0.4rem;font-size:0.7rem;" title="Refresh Local Ollama Status">
              <i data-lucide="refresh-cw" style="width:12px;height:12px;"></i>
              ${state.ollamaOnline ? `${state.ollamaLatency}ms` : 'Offline'}
            </button>
          </div>

          <div class="header-actions">
            <button id="openWhyOpenBtn" class="btn btn-outline-emerald">
              <i data-lucide="help-circle" style="width:15px;height:15px;"></i>
              Why Open Innovation?
            </button>
            <button id="exportModalBtn" class="btn btn-primary">
              <i data-lucide="download" style="width:15px;height:15px;"></i>
              Export Tax Pack
            </button>
          </div>
        </div>
      </header>

      <!-- KPI Metrics Ribbon -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-label">Total Documented</span>
            <span class="kpi-icon"><i data-lucide="file-text" style="width:18px;height:18px;"></i></span>
          </div>
          <div class="kpi-value">${kpis.totalSpend}</div>
          <div class="kpi-subtext">${kpis.count} invoices & receipts processed</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-label">Tax Deductible Write-Offs</span>
            <span class="kpi-icon"><i data-lucide="check-circle" style="width:18px;height:18px;color:#10b981;"></i></span>
          </div>
          <div class="kpi-value" style="color:#10b981;">${kpis.totalDeductible}</div>
          <div class="kpi-subtext highlight-green">~${kpis.estimatedTaxSaved} est. tax savings (30% bracket)</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-label">Audit Risk Score</span>
            <span class="kpi-icon"><i data-lucide="alert-triangle" style="width:18px;height:18px;color:${kpis.highRiskCount > 0 ? '#f43f5e' : '#10b981'};"></i></span>
          </div>
          <div class="kpi-value" style="color:${kpis.highRiskCount > 0 ? '#f43f5e' : '#10b981'};">
            ${kpis.highRiskCount > 0 ? `${kpis.highRiskCount} Flagged` : 'Clean'}
          </div>
          <div class="kpi-subtext">${kpis.highRiskCount > 0 ? 'Review missing tax IDs or receipts' : 'All line items substantiate Schedule C'}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-label">Data Privacy Residency</span>
            <span class="kpi-icon"><i data-lucide="lock" style="width:18px;height:18px;color:#06b6d4;"></i></span>
          </div>
          <div class="kpi-value" style="color:#06b6d4;">0 Bytes</div>
          <div class="kpi-subtext highlight-green">0 bytes sent to 3rd-party cloud APIs</div>
        </div>
      </section>

      <!-- Main Workspace -->
      <main class="vault-workspace">
        <!-- Left Side: Ingestion & Live AI Ingestion -->
        <section class="input-panel">
          <div class="panel-card">
            <div class="panel-header">
              <h2 class="panel-title">
                <i data-lucide="cpu" style="width:18px;height:18px;color:#10b981;"></i>
                Ingest Receipt or Invoice
              </h2>
            </div>

            <!-- Drag & Drop Target -->
            <div id="dropZone" class="drop-zone">
              <div class="drop-zone-icon">
                <i data-lucide="file-text" style="width:22px;height:22px;"></i>
              </div>
              <h3>Drop invoice, receipt, or photo</h3>
              <p>Supports raw text, PDF scans, JSON, or click to upload</p>
              <input type="file" id="fileInput" style="display:none;" accept=".txt,.json,.csv,.pdf,image/*">
            </div>

            <!-- Quick-Pick Sample Receipts -->
            <div class="samples-strip">
              <div class="samples-strip-title">Or test with pre-built freelance receipts:</div>
              <div class="samples-grid">
                ${SAMPLE_INVOICES.map((sample) => `
                  <button class="sample-chip" data-sample-id="${sample.id}">
                    <span class="sample-chip-name">${sample.name}</span>
                    <span class="sample-chip-meta">${sample.badge}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Raw Text Preview & Trigger -->
            <div class="editor-wrapper">
              <div class="editor-label">
                <span>Raw Invoice Text Payload:</span>
                <span>${state.currentInputText.split('\n').length} lines</span>
              </div>
              <textarea id="invoiceTextarea" class="invoice-textarea" placeholder="Paste invoice text, contractor billing, or meal receipt...">${state.currentInputText}</textarea>
            </div>

            <button id="runAuditBtn" class="btn btn-primary trigger-audit-btn" ${state.isAuditing ? 'disabled' : ''}>
              ${state.isAuditing ? `
                <i data-lucide="refresh-cw" class="animate-spin" style="width:18px;height:18px;"></i>
                Auditing with ${state.activeModel}...
              ` : `
                <i data-lucide="shield" style="width:18px;height:18px;"></i>
                Audit & Classify with ${state.activeModel}
              `}
            </button>

            <!-- Real-time Inference Console -->
            <div id="inferenceConsole" class="inference-console ${state.isAuditing ? 'active' : ''}">
              <div class="console-header">
                <span>[LOCAL OLLAMA INFERENCE STREAM]</span>
                <span id="tokenCounter">0 tokens</span>
              </div>
              <div id="consoleOutput" class="console-body">Initializing model weights...</div>
            </div>
          </div>

          <!-- Schedule C Summary Widget -->
          <div class="panel-card">
            <h3 class="schedule-c-title">
              <i data-lucide="file-text" style="width:16px;height:16px;color:#10b981;"></i>
              IRS Schedule C Deductions Breakdown
            </h3>
            <div class="schedule-c-list">
              ${Object.entries(scheduleC).map(([line, val]) => `
                <div class="breakdown-row">
                  <span>${line} (${val.count}x)</span>
                  <span>$${val.deductible.toFixed(2)}</span>
                </div>
              `).join('')}
              ${Object.keys(scheduleC).length === 0 ? '<p style="color:var(--text-dim);font-size:0.8rem;">No deductions recorded yet.</p>' : ''}
            </div>
          </div>
        </section>

        <!-- Right Side: Structured Ledger Table -->
        <section class="results-panel">
          <div class="ledger-card">
            <div class="ledger-toolbar">
              <div class="search-input-box">
                <i data-lucide="search" style="width:15px;height:15px;color:var(--text-dim);"></i>
                <input type="text" id="searchInput" placeholder="Search vendor or invoice #..." value="${state.searchQuery}">
              </div>

              <div class="filter-pills">
                <button class="filter-btn ${state.filterCategory === 'all' ? 'active' : ''}" data-cat="all">All (${state.invoices.length})</button>
                <button class="filter-btn ${state.filterCategory === 'software' ? 'active' : ''}" data-cat="software">Software</button>
                <button class="filter-btn ${state.filterCategory === 'professional' ? 'active' : ''}" data-cat="professional">Contractors</button>
                <button class="filter-btn ${state.filterCategory === 'meal' ? 'active' : ''}" data-cat="meal">Meals 50%</button>
                <button class="filter-btn ${state.filterCategory === 'hardware' ? 'active' : ''}" data-cat="hardware">Hardware</button>
              </div>

              <button id="clearAllBtn" class="btn btn-secondary" style="font-size:0.75rem;padding:0.35rem 0.7rem;" title="Reset all invoice records">
                <i data-lucide="trash-2" style="width:14px;height:14px;color:#f43f5e;"></i>
                Clear All
              </button>
            </div>

            <!-- Invoices Ledger -->
            ${filteredInvoices.length === 0 ? `
              <div class="empty-ledger">
                <div class="empty-ledger-icon">
                  <i data-lucide="file-text" style="width:48px;height:48px;"></i>
                </div>
                <h3>No invoices match the filter</h3>
                <p>Drop a receipt or click a sample invoice on the left to run local open-weight AI analysis.</p>
              </div>
            ` : `
              <div class="table-responsive">
                <table class="invoice-table">
                  <thead>
                    <tr>
                      <th>Vendor / Document</th>
                      <th>Date</th>
                      <th>Tax Category</th>
                      <th>Total</th>
                      <th>Deductible</th>
                      <th>Audit Risk</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredInvoices.map((inv) => `
                      <tr>
                        <td>
                          <div class="vendor-cell">
                            <span class="vendor-name">${inv.vendor}</span>
                            <span class="invoice-num">${inv.invoiceNumber || 'No ID'} · ${inv.lineItems?.length || 1} items</span>
                          </div>
                        </td>
                        <td>${inv.date || 'N/A'}</td>
                        <td>
                          <span class="badge ${getCategoryBadgeClass(inv.taxCategory)}">
                            ${inv.taxCategory}
                          </span>
                        </td>
                        <td style="font-weight:700;font-family:var(--font-mono);">$${inv.total?.toFixed(2) || '0.00'}</td>
                        <td style="font-weight:700;font-family:var(--font-mono);color:#34d399;">$${inv.deductibleAmount?.toFixed(2) || '0.00'}</td>
                        <td>
                          <span class="risk-pill ${inv.auditRisk === 'High' ? 'risk-high' : 'risk-low'}">
                            ${inv.auditRisk || 'Low'}
                          </span>
                        </td>
                        <td>
                          <button class="btn btn-secondary inspect-btn" data-id="${inv.id}" style="padding:0.25rem 0.55rem;font-size:0.74rem;">
                            Inspect
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </section>
      </main>

      <!-- Modal: Invoice Details & Line Items -->
      ${state.selectedInvoice ? `
        <div class="modal-overlay active" id="invoiceModalOverlay">
          <div class="modal-dialog">
            <div class="modal-header">
              <div>
                <h3 style="font-size:1.2rem;font-weight:800;">${state.selectedInvoice.vendor}</h3>
                <p style="font-size:0.78rem;color:var(--text-dim);">${state.selectedInvoice.invoiceNumber} · Analyzed by ${state.selectedInvoice.modelUsed}</p>
              </div>
              <button class="modal-close-btn" id="closeInvoiceModalBtn">
                <i data-lucide="x" style="width:20px;height:20px;"></i>
              </button>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;background:var(--bg-surface);padding:1rem;border-radius:var(--radius-md);">
              <div>
                <span style="font-size:0.75rem;color:var(--text-dim);">Total Amount</span>
                <div style="font-size:1.4rem;font-weight:800;font-family:var(--font-mono);">$${state.selectedInvoice.total?.toFixed(2)}</div>
              </div>
              <div>
                <span style="font-size:0.75rem;color:var(--text-dim);">Tax Deductible (${state.selectedInvoice.deductiblePercent}%)</span>
                <div style="font-size:1.4rem;font-weight:800;font-family:var(--font-mono);color:#34d399;">$${state.selectedInvoice.deductibleAmount?.toFixed(2)}</div>
              </div>
            </div>

            <div style="margin-bottom:1.25rem;">
              <h4 style="font-size:0.85rem;font-weight:700;margin-bottom:0.5rem;color:var(--text-main);">Schedule C IRS Mapping</h4>
              <p style="font-size:0.82rem;color:var(--text-muted);background:var(--bg-input);padding:0.6rem;border-radius:var(--radius-sm);border:1px solid var(--border-subtle);">
                <strong>${state.selectedInvoice.scheduleCLine}</strong> — ${state.selectedInvoice.taxCategory}
              </p>
            </div>

            <div style="margin-bottom:1.25rem;">
              <h4 style="font-size:0.85rem;font-weight:700;margin-bottom:0.5rem;color:var(--text-main);">Itemized Line Items</h4>
              <table style="width:100%;font-size:0.8rem;border-collapse:collapse;">
                <thead>
                  <tr style="border-bottom:1px solid var(--border-subtle);color:var(--text-dim);text-align:left;">
                    <th style="padding:0.4rem 0;">Description</th>
                    <th style="padding:0.4rem 0;text-align:right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${(state.selectedInvoice.lineItems || []).map((item) => `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                      <td style="padding:0.45rem 0;">${item.description}</td>
                      <td style="padding:0.45rem 0;text-align:right;font-family:var(--font-mono);">$${item.amount?.toFixed(2) || item.rate?.toFixed(2) || '0.00'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="margin-bottom:1.25rem;">
              <h4 style="font-size:0.85rem;font-weight:700;margin-bottom:0.5rem;color:var(--text-main);">Audit Observations & Compliance Flags</h4>
              <ul style="padding-left:1.25rem;font-size:0.8rem;color:var(--text-muted);line-height:1.5;">
                ${(state.selectedInvoice.auditReasons || []).map((r) => `<li>${r}</li>`).join('')}
              </ul>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.5rem;border-top:1px solid var(--border-subtle);padding-top:1rem;">
              <button class="btn btn-secondary delete-invoice-btn" data-id="${state.selectedInvoice.id}">
                <i data-lucide="trash-2" style="width:14px;height:14px;color:#f43f5e;"></i>
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Modal: Why Open Innovation Matters -->
      ${state.isWhyOpenModalOpen ? `
        <div class="modal-overlay active" id="whyOpenModalOverlay">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3 style="font-size:1.25rem;font-weight:800;display:flex;align-items:center;gap:0.5rem;">
                <i data-lucide="shield" style="color:#10b981;width:22px;height:22px;"></i>
                Why Open Innovation Matters for VaultInvoice AI
              </h3>
              <button class="modal-close-btn" id="closeWhyOpenModalBtn">
                <i data-lucide="x" style="width:20px;height:20px;"></i>
              </button>
            </div>

            <p style="font-size:0.86rem;color:var(--text-muted);line-height:1.6;margin-bottom:1.25rem;">
              This week's theme asks: <em>"Build something with open-source AI at its core that someone would actually pay for."</em> Here is why open-source AI is the foundational piece that makes VaultInvoice viable as a real business where closed APIs fail:
            </p>

            <table class="comparison-table">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>Closed Cloud APIs (OpenAI/Anthropic)</th>
                  <th>VaultInvoice (Open-Weight Model)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Client Data Privacy</strong></td>
                  <td class="tag-cloud">Leaves laptop; bank info & confidential client scopes sent to 3rd-party cloud servers.</td>
                  <td class="tag-local">100% on-device. Zero data egress. Strict NDA & GDPR compliance.</td>
                </tr>
                <tr>
                  <td><strong>Micro-SaaS Margins</strong></td>
                  <td class="tag-cloud">Per-token charges erode freelance margins ($0.08+ per complex receipt parse).</td>
                  <td class="tag-local">$0 API cost. Freelancer buys once ($49) or low flat subscription with 95%+ margin.</td>
                </tr>
                <tr>
                  <td><strong>Offline Capability</strong></td>
                  <td class="tag-cloud">Fails immediately on airplane flights, tax prep retreats, or spotty client sites.</td>
                  <td class="tag-local">Runs completely offline on local laptop GPU/CPU with no internet connection.</td>
                </tr>
                <tr>
                  <td><strong>Model Sovereignty</strong></td>
                  <td class="tag-cloud">Locked into vendor price hikes, rate limits, or sudden model deprecation.</td>
                  <td class="tag-local">Freedom to swap between Llama 3.1, Gemma, Mistral, or specialized quant models.</td>
                </tr>
              </tbody>
            </table>

            <div style="background:var(--bg-surface);padding:1rem;border-radius:var(--radius-md);border-left:3px solid #10b981;margin-top:1.5rem;">
              <h4 style="font-size:0.88rem;font-weight:700;color:#34d399;margin-bottom:0.35rem;">Real Customer Willingness to Pay</h4>
              <p style="font-size:0.8rem;color:var(--text-muted);line-height:1.5;">
                Freelancers and solo contractors pay $30-$40/month for Dext or QuickBooks just to extract receipts. But traditional tools fail on privacy. Freelancers who sign non-disclosure agreements (NDAs) with tech clients cannot legally upload proprietary project invoices to general cloud models. VaultInvoice solves this barrier forever.
              </p>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Modal: Tax Pack Export -->
      ${state.isExportModalOpen ? `
        <div class="modal-overlay active" id="exportModalOverlay">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3 style="font-size:1.25rem;font-weight:800;display:flex;align-items:center;gap:0.5rem;">
                <i data-lucide="download" style="color:#10b981;width:22px;height:22px;"></i>
                Export Tax Preparation Package
              </h3>
              <button class="modal-close-btn" id="closeExportModalBtn">
                <i data-lucide="x" style="width:20px;height:20px;"></i>
              </button>
            </div>

            <p style="font-size:0.84rem;color:var(--text-muted);margin-bottom:1.25rem;">
              Generate audit-ready tax files formatted for your CPA, TurboTax, or QuickBooks.
            </p>

            <div style="display:flex;flex-direction:column;gap:0.85rem;">
              <button id="downloadCsvBtn" class="btn btn-secondary" style="justify-content:flex-start;padding:0.9rem;">
                <i data-lucide="file-text" style="width:18px;height:18px;color:#10b981;"></i>
                <div style="text-align:left;">
                  <div style="font-weight:700;">Download Schedule C CSV</div>
                  <div style="font-size:0.75rem;color:var(--text-dim);">Line-by-line itemization ready for Excel & spreadsheet import</div>
                </div>
              </button>

              <button id="downloadJsonBtn" class="btn btn-secondary" style="justify-content:flex-start;padding:0.9rem;">
                <i data-lucide="download" style="width:18px;height:18px;color:#06b6d4;"></i>
                <div style="text-align:left;">
                  <div style="font-weight:700;">Download Full Audit JSON</div>
                  <div style="font-size:0.75rem;color:var(--text-dim);">Complete structured payload with extracted model reasoning</div>
                </div>
              </button>

              <button id="copyCpaSummaryBtn" class="btn btn-primary" style="justify-content:flex-start;padding:0.9rem;">
                <i data-lucide="check-circle" style="width:18px;height:18px;"></i>
                <div style="text-align:left;">
                  <div style="font-weight:700;">Copy CPA Briefing to Clipboard</div>
                  <div style="font-size:0.75rem;color:rgba(0,0,0,0.7);">Formatted text overview ready to email your accountant</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Hydrate Lucide icons
  createIcons({
    icons: {
      Shield,
      Cpu,
      Lock,
      Download,
      Trash2,
      Search,
      AlertTriangle,
      CheckCircle,
      FileText,
      ArrowRight,
      X,
      ExternalLink,
      HelpCircle,
      RefreshCw,
    },
  });

  bindEventListeners();
}

function getCategoryBadgeClass(category = '') {
  const cat = category.toLowerCase();
  if (cat.includes('software') || cat.includes('cloud')) return 'badge-software';
  if (cat.includes('professional') || cat.includes('contract')) return 'badge-contractor';
  if (cat.includes('meal')) return 'badge-meal';
  if (cat.includes('equipment') || cat.includes('hardware')) return 'badge-hardware';
  return 'badge-general';
}

// Event Listeners Binding
function bindEventListeners() {
  // Model Select
  const modelSelect = document.getElementById('modelSelect');
  if (modelSelect) {
    modelSelect.addEventListener('change', (e) => {
      state.activeModel = e.target.value;
      renderApp();
    });
  }

  // Refresh Ollama Button
  const refreshOllamaBtn = document.getElementById('refreshOllamaBtn');
  if (refreshOllamaBtn) {
    refreshOllamaBtn.addEventListener('click', async () => {
      await refreshOllamaHealth();
      renderApp();
    });
  }

  // Open Modals
  const openWhyOpenBtn = document.getElementById('openWhyOpenBtn');
  if (openWhyOpenBtn) {
    openWhyOpenBtn.addEventListener('click', () => {
      state.isWhyOpenModalOpen = true;
      renderApp();
    });
  }

  const exportModalBtn = document.getElementById('exportModalBtn');
  if (exportModalBtn) {
    exportModalBtn.addEventListener('click', () => {
      state.isExportModalOpen = true;
      renderApp();
    });
  }

  // Close Modals
  const closeWhyOpenModalBtn = document.getElementById('closeWhyOpenModalBtn');
  if (closeWhyOpenModalBtn) {
    closeWhyOpenModalBtn.addEventListener('click', () => {
      state.isWhyOpenModalOpen = false;
      renderApp();
    });
  }

  const closeExportModalBtn = document.getElementById('closeExportModalBtn');
  if (closeExportModalBtn) {
    closeExportModalBtn.addEventListener('click', () => {
      state.isExportModalOpen = false;
      renderApp();
    });
  }

  const closeInvoiceModalBtn = document.getElementById('closeInvoiceModalBtn');
  if (closeInvoiceModalBtn) {
    closeInvoiceModalBtn.addEventListener('click', () => {
      state.selectedInvoice = null;
      renderApp();
    });
  }

  // Sample Chips
  document.querySelectorAll('.sample-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const sampleId = chip.dataset.sampleId;
      const found = SAMPLE_INVOICES.find((s) => s.id === sampleId);
      if (found) {
        state.currentInputText = found.text;
        const textarea = document.getElementById('invoiceTextarea');
        if (textarea) textarea.value = found.text;
      }
    });
  });

  // Invoice Textarea
  const invoiceTextarea = document.getElementById('invoiceTextarea');
  if (invoiceTextarea) {
    invoiceTextarea.addEventListener('input', (e) => {
      state.currentInputText = e.target.value;
    });
  }

  // Run Audit Button
  const runAuditBtn = document.getElementById('runAuditBtn');
  if (runAuditBtn) {
    runAuditBtn.addEventListener('click', handleRunAudit);
  }

  // Drag & Drop File Upload
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-active');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-active');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-active');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileRead(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileRead(e.target.files[0]);
      }
    });
  }

  // Search Input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderApp();
    });
  }

  // Category Filters
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.filterCategory = btn.dataset.cat;
      renderApp();
    });
  });

  // Clear All
  const clearAllBtn = document.getElementById('clearAllBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (confirm('Clear all processed invoices from local ledger?')) {
        state.invoices = [];
        saveInvoices();
        renderApp();
      }
    });
  }

  // Inspect buttons
  document.querySelectorAll('.inspect-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const invId = btn.dataset.id;
      state.selectedInvoice = state.invoices.find((i) => i.id === invId);
      renderApp();
    });
  });

  // Delete invoice button inside modal
  const deleteBtn = document.querySelector('.delete-invoice-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const invId = deleteBtn.dataset.id;
      state.invoices = state.invoices.filter((i) => i.id !== invId);
      saveInvoices();
      state.selectedInvoice = null;
      renderApp();
    });
  }

  // Export handlers
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');
  if (downloadCsvBtn) {
    downloadCsvBtn.addEventListener('click', handleDownloadCsv);
  }

  const downloadJsonBtn = document.getElementById('downloadJsonBtn');
  if (downloadJsonBtn) {
    downloadJsonBtn.addEventListener('click', handleDownloadJson);
  }

  const copyCpaSummaryBtn = document.getElementById('copyCpaSummaryBtn');
  if (copyCpaSummaryBtn) {
    copyCpaSummaryBtn.addEventListener('click', handleCopyCpaSummary);
  }
}

// File Read Helper
function handleFileRead(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    state.currentInputText = event.target.result;
    const textarea = document.getElementById('invoiceTextarea');
    if (textarea) textarea.value = state.currentInputText;
  };
  reader.readAsText(file);
}

// Audit Trigger Execution
async function handleRunAudit() {
  if (!state.currentInputText || state.currentInputText.trim().length === 0) {
    alert('Please paste or drop an invoice/receipt text first.');
    return;
  }

  state.isAuditing = true;
  renderApp();

  const consoleOutput = document.getElementById('consoleOutput');
  const tokenCounter = document.getElementById('tokenCounter');

  let outputAccumulator = '';
  const onToken = ({ text, totalTokens, elapsedMs }) => {
    outputAccumulator += text;
    if (consoleOutput) {
      consoleOutput.textContent = outputAccumulator;
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
    if (tokenCounter) {
      tokenCounter.textContent = `${totalTokens} tokens (${elapsedMs}ms)`;
    }
  };

  const useFallback = state.activeModel === 'simulated-local' || !state.ollamaOnline;

  try {
    const result = await auditInvoiceWithModel({
      text: state.currentInputText,
      modelName: state.activeModel,
      onToken,
      useFallback,
    });

    if (result && result.data) {
      const newInvoice = {
        id: `inv-${Date.now()}`,
        ...result.data,
        modelUsed: result.modelUsed,
        createdAt: new Date().toISOString(),
      };

      state.invoices.unshift(newInvoice);
      saveInvoices();

      // Trigger celebration confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#06b6d4'],
      });
    }
  } catch (err) {
    alert(`Audit failed: ${err.message}`);
  } finally {
    state.isAuditing = false;
    renderApp();
  }
}

// Export CSV
function handleDownloadCsv() {
  if (state.invoices.length === 0) {
    alert('No invoices to export.');
    return;
  }

  const headers = ['Date', 'Vendor', 'Invoice_No', 'Tax_Category', 'Schedule_C_Line', 'Total_Amount', 'Deductible_Amount', 'Audit_Risk'];
  const rows = state.invoices.map((inv) => [
    `"${inv.date || ''}"`,
    `"${(inv.vendor || '').replace(/"/g, '""')}"`,
    `"${inv.invoiceNumber || ''}"`,
    `"${(inv.taxCategory || '').replace(/"/g, '""')}"`,
    `"${(inv.scheduleCLine || '').replace(/"/g, '""')}"`,
    (inv.total || 0).toFixed(2),
    (inv.deductibleAmount || 0).toFixed(2),
    `"${inv.auditRisk || 'Low'}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `VaultInvoice_Tax_Export_${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
}

// Export JSON
function handleDownloadJson() {
  const jsonContent = JSON.stringify(state.invoices, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `VaultInvoice_Audit_Vault_${new Date().toISOString().split('T')[0]}.json`);
  link.click();
}

// Copy CPA Briefing Summary
function handleCopyCpaSummary() {
  const kpis = getKPIs();
  const scheduleC = getScheduleCBreakdown();

  const lines = [
    `=== VAULTINVOICE AI - CPA TAX PREPARATION BRIEFING ===`,
    `Date Generated: ${new Date().toLocaleDateString()}`,
    `Data Residency: 100% On-Device / Zero Cloud Egress`,
    ``,
    `FINANCIAL TOTALS:`,
    `- Total Incurred Expenses: ${kpis.totalSpend} across ${kpis.count} receipts`,
    `- Total Qualified Tax Deductions: ${kpis.totalDeductible}`,
    `- Estimated Freelance Tax Reduction (30% marginal bracket): ${kpis.estimatedTaxSaved}`,
    `- Audit Flags: ${kpis.highRiskCount > 0 ? `${kpis.highRiskCount} items flagged for documentation review` : 'All records compliant'}`,
    ``,
    `SCHEDULE C (FORM 1040) LINE MAPPINGS:`,
  ];

  for (const [line, val] of Object.entries(scheduleC)) {
    lines.push(`- ${line}: $${val.deductible.toFixed(2)} (${val.count} items)`);
  }

  lines.push(``);
  lines.push(`ITEMIZED EXPENSE SUMMARY:`);
  for (const inv of state.invoices) {
    lines.push(`• [${inv.date}] ${inv.vendor} | Inv #${inv.invoiceNumber} | Total: $${inv.total?.toFixed(2)} | Deductible: $${inv.deductibleAmount?.toFixed(2)} (${inv.scheduleCLine})`);
  }

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    alert('CPA Briefing copied to clipboard!');
  });
}

// Kickoff
initApp();
