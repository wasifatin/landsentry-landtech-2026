/**
 * JomiGuard AI — Application Controller
 * LandTech 2026 Hackathon | Track: Digital Land Records | Problem P3
 * Industrial Enterprise Dark UI Architecture
 */

import { LandRepository, computeSha256 } from './repository/storage.js';

// Initialize repository
const repo = new LandRepository();

// Application State
let currentTab = 'overview';
let searchQuery = '';
let selectedParcelId = null;
let selectedAlertId = null;
let activeDocId = 'doc-001';
let isSidebarCollapsed = false;
let currentTheme = 'dark';

// DOM Elements
const tabContainer = document.getElementById('tabContentContainer');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');
const sidebarNav = document.getElementById('sidebarNav');
const appSidebar = document.getElementById('appSidebar');
const appTopbar = document.getElementById('appTopbar');
const appMain = document.getElementById('appMain');
const navAlertCountBadge = document.getElementById('navAlertCountBadge');
const sidebarAlertBadge = document.getElementById('sidebarAlertBadge');
const btnSidebarCollapse = document.getElementById('btnSidebarCollapse');
const collapseToggleIcon = document.getElementById('collapseToggleIcon');
const collapseToggleLabel = document.getElementById('collapseToggleLabel');
const btnThemeToggle = document.getElementById('btnThemeToggle');
const themeToggleIcon = document.getElementById('themeToggleIcon');
const themeToggleLabel = document.getElementById('themeToggleLabel');
const roleSelector = document.getElementById('roleSelector');
const globalSearchInput = document.getElementById('globalSearchInput');
const btnRunChecks = document.getElementById('btnRunChecks');
const btnLoadScenariosModal = document.getElementById('btnLoadScenariosModal');
const bannerResetBtn = document.getElementById('bannerResetBtn');
const modalContainer = document.getElementById('modalContainer');
const introSplash = document.getElementById('introSplash');
const btnSkipIntro = document.getElementById('btnSkipIntro');
const btnReplaySplash = document.getElementById('btnReplaySplash');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');

// Update alert badge count
function updateBadge() {
  const alerts = repo.getAlerts().filter(a => a.status === 'New' || a.status === 'Under Review');
  const countStr = alerts.length.toString();
  if (navAlertCountBadge) navAlertCountBadge.textContent = countStr;
  if (sidebarAlertBadge) sidebarAlertBadge.textContent = countStr;
}

// Navigation Tab Switcher
function switchTab(tabId) {
  currentTab = tabId;
  if (sidebarNav) {
    const buttons = sidebarNav.querySelectorAll('.sidebar-btn');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Close mobile drawer and overlay if open
  if (appSidebar) {
    appSidebar.classList.remove('mobile-open');
  }
  const overlay = document.getElementById('sidebarOverlay');
  if (overlay) {
    overlay.classList.remove('active');
  }

  // Render view
  renderView();
}

// Global View Renderer
function renderView() {
  updateBadge();
  switch (currentTab) {
    case 'overview':
      renderOverviewDashboard();
      break;
    case 'parcels':
      renderParcelExplorer();
      break;
    case 'integrity':
      renderDocumentIntegrity();
      break;
    case 'double-selling':
      renderDoubleSelling();
      break;
    case 'rapid-transfers':
      renderRapidTransfers();
      break;
    case 'reconciliation':
      renderReconciliation();
      break;
    case 'cases':
      renderCaseManagement();
      break;
    case 'methodology':
      renderMethodologySettings();
      break;
    default:
      renderOverviewDashboard();
  }
}

// Helper: Format Dates
function formatDate(isoStr) {
  if (!isoStr || isoStr === 'N/A') return 'N/A';
  try {
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? isoStr : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return isoStr;
  }
}

// ==========================================
// 1. OVERVIEW DASHBOARD
// ==========================================
function renderOverviewDashboard() {
  pageTitle.textContent = 'Land Fraud & Double-Selling Triage Center';
  pageSubtitle.textContent = 'Multi-registry reconciliation, document cryptographic fingerprinting, and rapid transfer velocity analysis';

  const parcels = repo.getParcels();
  const deeds = repo.getDeeds();
  const alerts = repo.getAlerts();
  const highRisk = alerts.filter(a => a.score >= 60);
  const auditLogs = repo.getAuditLogs().slice(0, 6);

  tabContainer.innerHTML = `
    <!-- BENTO ENTITY GRID -->
    <div class="bento-grid">
      <!-- Card 1 -->
      <div class="glass-panel" style="padding: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div class="icon-box" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">🗺️</div>
          <span class="font-mono" style="font-size: 11px; color: var(--zinc-500);">PARCELS</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #fff;">${parcels.length} Indexed</div>
        <div style="font-size: 12px; color: var(--zinc-400); margin: 4px 0 14px 0;">Synthetic plots in demo registry</div>
        <div class="tech-progress-container">
          <div class="tech-progress-fill fill-emerald" style="width: 100%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 11px;">
          <span style="color: var(--zinc-500);">4 Demo Mouzas</span>
          <button class="nav-btn" style="padding: 0; color: var(--gold-primary);" onclick="window.appSwitchTab('parcels')">Explore Plots →</button>
        </div>
      </div>

      <!-- Card 2 -->
      <div class="glass-panel" style="padding: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div class="icon-box" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;">📜</div>
          <span class="font-mono" style="font-size: 11px; color: var(--zinc-500);">DEEDS CHECKED</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #fff;">${deeds.length} Registered</div>
        <div style="font-size: 12px; color: var(--zinc-400); margin: 4px 0 14px 0;">Sub-Registry cross-matched</div>
        <div class="tech-progress-container">
          <div class="tech-progress-fill fill-blue" style="width: 85%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 11px;">
          <span style="color: var(--zinc-500);">100% Synthetic Aliases</span>
          <button class="nav-btn" style="padding: 0; color: var(--gold-primary);" onclick="window.appSwitchTab('reconciliation')">Reconciliation →</button>
        </div>
      </div>

      <!-- Card 3 -->
      <div class="glass-panel" style="padding: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div class="icon-box" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">⚠️</div>
          <span class="font-mono" style="font-size: 11px; color: var(--zinc-500);">OPEN ALERTS</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #fff;">${alerts.length} Flagged for Review</div>
        <div style="font-size: 12px; color: var(--zinc-400); margin: 4px 0 14px 0;">Cases flagged for review requiring triage</div>
        <div class="tech-progress-container">
          <div class="tech-progress-fill fill-gold" style="width: 75%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 11px;">
          <span style="color: var(--zinc-500);">Rule-Based Triage</span>
          <button class="nav-btn" style="padding: 0; color: var(--gold-primary);" onclick="window.appSwitchTab('cases')">View Cases →</button>
        </div>
      </div>

      <!-- Card 4 -->
      <div class="glass-panel" style="padding: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div class="icon-box" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">🚨</div>
          <span class="font-mono" style="font-size: 11px; color: var(--zinc-500);">HIGH SEVERITY</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #f87171;">${highRisk.length} High-Risk</div>
        <div style="font-size: 12px; color: var(--zinc-400); margin: 4px 0 14px 0;">Possible duplicate / tampered</div>
        <div class="tech-progress-container">
          <div class="tech-progress-fill fill-red" style="width: ${Math.min(100, highRisk.length * 35)}%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 11px;">
          <span style="color: var(--zinc-500);">Score >= 60 / 100</span>
          <button class="nav-btn" style="padding: 0; color: var(--gold-primary);" onclick="window.appOpenHighRisk()">Prioritize →</button>
        </div>
      </div>
    </div>

    <!-- MANAGEMENT WORKSPACE -->
    <div class="workspace-split">
      <!-- Left Column: Recent Alerts Table -->
      <div class="glass-panel-static" style="padding: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 700; color: #fff;">Priority Triage Discrepancy Alerts</h2>
            <p style="font-size: 12px; color: var(--zinc-400);">Calculated via deterministic weights (+40 Double-Selling, +25 Doc Hash, +20 Reg-Mutation, +15 Rapid, +10 Missing)</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-secondary" onclick="window.appSwitchTab('cases')">View All Cases</button>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Parcel Key</th>
                <th>Primary Rule Fired</th>
                <th>Triage Score</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${alerts.map(a => `
                <tr>
                  <td class="font-mono" style="color: var(--gold-primary); font-weight: 600;">${a.id}</td>
                  <td class="font-mono" style="font-weight: 600;">
                    <a href="javascript:void(0)" onclick="window.appOpenParcel('${a.parcelId}')" style="color: #60a5fa; text-decoration: none;">
                      ${a.syntheticParcelKey}
                    </a>
                  </td>
                  <td>
                    <div style="font-weight: 600; color: #fff;">${a.rulesTriggered[0]?.name || 'Discrepancy Signal'}</div>
                    <div style="font-size: 11px; color: var(--zinc-500);">${a.rulesTriggered.length > 1 ? `+${a.rulesTriggered.length - 1} additional rule(s)` : 'Single factor'}</div>
                  </td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span class="font-mono" style="font-weight: 700; font-size: 14px;">${a.score}</span>
                      <div class="tech-progress-container" style="width: 50px;">
                        <div class="tech-progress-fill ${a.score >= 60 ? 'fill-red' : a.score >= 30 ? 'fill-gold' : 'fill-emerald'}" style="width: ${a.score}%;"></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge ${a.severity === 'HIGH' ? 'badge-high' : a.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'}">
                      <span class="status-pulse-dot ${a.severity === 'HIGH' ? 'pulse-red' : a.severity === 'MEDIUM' ? 'pulse-gold' : 'pulse-emerald'}"></span>
                      ${a.severity}
                    </span>
                  </td>
                  <td>
                    <span style="font-size: 12px; color: var(--zinc-300);">${a.status}</span>
                  </td>
                  <td>
                    <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.appOpenCaseModal('${a.id}')">
                      Review Case
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 16px; padding: 12px; background: rgba(24, 24, 27, 0.4); border-radius: 8px; border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--zinc-400);">
          <div>
            <span>💡 <strong>Triage Transparency:</strong> Risk score prioritizes cases for inspection. It is NOT an accusation of criminal fraud or legal judgment.</span>
          </div>
          <button class="btn-secondary" style="font-size: 11px;" onclick="window.appRunRecheck()">Re-evaluate Rules</button>
        </div>
      </div>

      <!-- Right Column: Stacked Widgets (Policy & Audit) -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <!-- Widget 1: Policy Toggles -->
        <div class="glass-panel-static" style="padding: 20px;">
          <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zinc-400); margin-bottom: 14px;">
            Active Detection Policies
          </h3>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #fff;">Double-Selling Rule</div>
                <div style="font-size: 11px; color: var(--zinc-500);">Flag dual uncancelled deed (+40)</div>
              </div>
              <div class="policy-toggle active" title="Active">
                <div class="policy-knob"></div>
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #fff;">Web Crypto SHA-256</div>
                <div style="font-size: 11px; color: var(--zinc-500);">Detect altered deed copies (+25)</div>
              </div>
              <div class="policy-toggle active" title="Active">
                <div class="policy-knob"></div>
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #fff;">Reg vs Mutation Cross-check</div>
                <div style="font-size: 11px; color: var(--zinc-500);">Sub-Registry vs AC Land (+20)</div>
              </div>
              <div class="policy-toggle active" title="Active">
                <div class="policy-knob"></div>
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #fff;">Rapid Transfer Velocity</div>
                <div style="font-size: 11px; color: var(--zinc-500);">≥ 3 transfers in 90 days (+15)</div>
              </div>
              <div class="policy-toggle active" title="Active">
                <div class="policy-knob"></div>
              </div>
            </div>
          </div>
          <div style="margin-top: 14px; border-top: 1px solid var(--border-subtle); padding-top: 12px; text-align: right;">
            <button class="nav-btn" style="color: var(--gold-primary); font-size: 11px; padding: 0;" onclick="window.appSwitchTab('methodology')">Configure Weights →</button>
          </div>
        </div>

        <!-- Widget 2: Audit Trail Timeline -->
        <div class="glass-panel-static" style="padding: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zinc-400);">
              Audit Trail (Local Demo)
            </h3>
            <span class="badge badge-gold" style="font-size: 9px;">IMMUTABLE SIM</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${auditLogs.map(l => `
              <div style="display: flex; gap: 10px; font-size: 12px; border-left: 2px solid var(--zinc-800); padding-left: 10px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="font-mono" style="font-size: 10px; color: var(--gold-primary); font-weight: 600;">${l.actorAlias}</span>
                    <span style="font-size: 10px; color: var(--zinc-500);">${new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style="color: #e4e4e7; margin-top: 2px; font-size: 11px;">${l.details}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 2. PARCEL & RECORD EXPLORER
// ==========================================
function renderParcelExplorer() {
  pageTitle.textContent = 'Synthetic Parcel & Land Record Explorer';
  pageSubtitle.textContent = 'Multi-generational cadastral survey lineages (CS, SA, RS, BS) and registered deeds with privacy-safe aliases';

  const parcels = repo.getParcels();
  const deeds = repo.getDeeds();
  const alerts = repo.getAlerts();

  // Filter based on search query
  const filtered = parcels.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.syntheticParcelKey.toLowerCase().includes(q) ||
      p.demoDistrict.toLowerCase().includes(q) ||
      p.demoMouza.toLowerCase().includes(q) ||
      p.plotDagNo.toLowerCase().includes(q) ||
      p.currentOwnerAlias.toLowerCase().includes(q);
  });

  tabContainer.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 13px; color: var(--zinc-400);">Showing <strong>${filtered.length}</strong> of ${parcels.length} demonstration parcels</span>
        ${searchQuery ? `<span class="badge badge-gold">Filter: "${searchQuery}" <button onclick="window.appClearSearch()" style="background:none;border:none;color:#000;cursor:pointer;margin-left:4px;">✕</button></span>` : ''}
      </div>
      <div style="font-size: 12px; color: var(--zinc-500);">
        🛡️ Aliases only: PERSON-SYN-001, BUYER-SYN-004. No genuine NID or phone numbers.
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px;">
      ${filtered.map(p => {
        const parcelAlert = alerts.find(a => a.syntheticParcelKey === p.syntheticParcelKey);
        const parcelDeeds = deeds.filter(d => d.syntheticParcelKey === p.syntheticParcelKey);
        const score = parcelAlert?.score || 0;

        return `
          <div class="glass-panel" style="padding: 22px;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px;">
              <div>
                <span class="font-mono" style="font-size: 11px; color: var(--gold-primary); font-weight: 700;">${p.syntheticParcelKey}</span>
                <h3 style="font-size: 18px; font-weight: 700; color: #fff; margin-top: 2px;">Plot Dag No. ${p.plotDagNo}</h3>
                <div style="font-size: 12px; color: var(--zinc-400);">${p.demoMouza}</div>
              </div>
              <span class="badge ${score >= 60 ? 'badge-high' : score >= 30 ? 'badge-medium' : 'badge-low'}">
                ${score > 0 ? `Risk: ${score}/100` : 'Clean Record'}
              </span>
            </div>

            <!-- Survey Generation Badges -->
            <div style="background: rgba(24, 24, 27, 0.6); padding: 10px; border-radius: 8px; margin-bottom: 14px; border: 1px solid var(--border-subtle);">
              <div style="font-size: 11px; text-transform: uppercase; color: var(--zinc-500); font-weight: 700; margin-bottom: 6px;">
                Survey Generations (CS ➔ SA ➔ RS ➔ BS)
              </div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center; font-size: 11px;">
                ${p.surveyGenerations.map(s => `
                  <div style="background: var(--surface-1); padding: 4px; border-radius: 4px; border: 1px solid var(--border-subtle);">
                    <div style="font-weight: 700; color: var(--gold-primary);">${s.surveyType}</div>
                    <div class="font-mono" style="font-size: 10px; color: #fff;">Dag ${s.dagNo}</div>
                    <div style="font-size: 9px; color: var(--zinc-400);">${s.recordedAreaDecimal} dec</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Property Attributes -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; margin-bottom: 14px;">
              <div>
                <span style="color: var(--zinc-500);">Declared Area:</span>
                <span style="font-weight: 600; color: #fff; margin-left: 4px;">${p.declaredArea} ${p.areaUnit}</span>
              </div>
              <div>
                <span style="color: var(--zinc-500);">Primary Khatian:</span>
                <span class="font-mono" style="color: #60a5fa; margin-left: 4px;">${p.primaryKhatianRef}</span>
              </div>
              <div>
                <span style="color: var(--zinc-500);">Current Owner:</span>
                <span class="font-mono" style="color: var(--gold-primary); margin-left: 4px;">${p.currentOwnerAlias}</span>
              </div>
              <div>
                <span style="color: var(--zinc-500);">Associated Deeds:</span>
                <span style="font-weight: 600; color: #fff; margin-left: 4px;">${parcelDeeds.length} Registered</span>
              </div>
            </div>

            <!-- Scenario Tag -->
            <div style="font-size: 11px; color: var(--zinc-400); margin-bottom: 16px; font-style: italic;">
              ${p.scenarioTag || 'Standard synthetic test parcel'}
            </div>

            <!-- Action buttons -->
            <div style="display: flex; gap: 8px; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
              <button class="btn-gold" style="flex: 1; justify-content: center;" onclick="window.appOpenParcel('${p.id}')">
                Inspect Lineage & Deeds
              </button>
              ${parcelAlert ? `
                <button class="btn-secondary" style="padding: 6px 12px;" onclick="window.appOpenCaseModal('${parcelAlert.id}')">
                  View Alert
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Modal: Detailed Parcel Inspection Drawer
window.appOpenParcel = function(parcelId) {
  const parcel = repo.getParcels().find(p => p.id === parcelId);
  if (!parcel) return;

  const deeds = repo.getDeeds().filter(d => d.syntheticParcelKey === parcel.syntheticParcelKey);
  const registrations = repo.getRegistrations().filter(r => r.syntheticParcelKey === parcel.syntheticParcelKey);
  const mutations = repo.getMutations().filter(m => m.syntheticParcelKey === parcel.syntheticParcelKey);
  const transfers = repo.getTransfers().filter(t => t.syntheticParcelKey === parcel.syntheticParcelKey);
  const alert = repo.getAlerts().find(a => a.syntheticParcelKey === parcel.syntheticParcelKey);

  modalContainer.style.display = 'flex';
  modalContainer.className = 'modal-overlay';
  modalContainer.innerHTML = `
    <div class="modal-content" style="padding: 28px;">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 14px;">
        <div>
          <span class="font-mono" style="font-size: 12px; color: var(--gold-primary); font-weight: 700;">${parcel.syntheticParcelKey}</span>
          <h2 style="font-size: 22px; font-weight: 800; color: #fff; margin-top: 2px;">
            Plot / Dag ${parcel.plotDagNo} • ${parcel.demoMouza}
          </h2>
          <div style="font-size: 13px; color: var(--zinc-400);">${parcel.demoDistrict}</div>
        </div>
        <button onclick="window.appCloseModal()" style="background: none; border: none; color: var(--zinc-400); font-size: 20px; cursor: pointer;">✕</button>
      </div>

      <!-- Survey Generations Reconciliation Panel -->
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zinc-400); margin-bottom: 8px;">
          Cadastral Survey Lineage (CS ➔ SA ➔ RS ➔ BS)
        </h4>
        <div style="overflow-x: auto;">
          <table class="enterprise-table" style="font-size: 12px;">
            <thead>
              <tr>
                <th>Survey Era</th>
                <th>Survey Year</th>
                <th>Plot / Dag No.</th>
                <th>Khatian Reference</th>
                <th>Recorded Area</th>
                <th>Survey Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${parcel.surveyGenerations.map(s => `
                <tr>
                  <td style="font-weight: 700; color: var(--gold-primary);">${s.surveyType} Survey</td>
                  <td class="font-mono">${s.surveyYear}</td>
                  <td class="font-mono">Dag ${s.dagNo}</td>
                  <td class="font-mono">${s.khatianNo}</td>
                  <td style="font-weight: 600;">${s.recordedAreaDecimal} Decimals</td>
                  <td style="color: var(--zinc-400);">${s.remarks}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="font-size: 11px; color: var(--zinc-500); margin-top: 6px;">
          ℹ️ Notice: Comparisons across survey generations (CS/SA/RS/BS) serve as evidence needing reconciliation across archive volumes, not as definitive proof of conflict.
        </div>
      </div>

      <!-- Associated Registered Deeds -->
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zinc-400); margin-bottom: 8px;">
          Associated Sub-Registry Deeds (${deeds.length})
        </h4>
        <table class="enterprise-table" style="font-size: 12px;">
          <thead>
            <tr>
              <th>Deed No.</th>
              <th>Seller Alias</th>
              <th>Buyer Alias</th>
              <th>Date</th>
              <th>Area</th>
              <th>Registry Office</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${deeds.map(d => `
              <tr>
                <td class="font-mono" style="color: #60a5fa;">${d.deedNo}</td>
                <td class="font-mono" style="color: var(--zinc-400);">${d.sellerAlias}</td>
                <td class="font-mono" style="color: var(--gold-primary); font-weight: 600;">${d.buyerAlias}</td>
                <td class="font-mono">${formatDate(d.deedDate)}</td>
                <td>${d.declaredArea} Dec</td>
                <td style="font-size: 11px; color: var(--zinc-400);">${d.sourceRegistryOffice}</td>
                <td><span class="badge ${d.saleStatus === 'REGISTERED' ? 'badge-low' : 'badge-high'}">${d.saleStatus}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Registration vs Mutation Status -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="font-size: 12px; font-weight: 700; color: #60a5fa; margin-bottom: 6px;">Sub-Registry Record</div>
          ${registrations.length > 0 ? `
            <div style="font-size: 12px; color: #fff;">Deed: <span class="font-mono">${registrations[0].deedRef}</span></div>
            <div style="font-size: 12px; color: var(--zinc-400);">Buyer: <span class="font-mono">${registrations[0].buyerAlias}</span></div>
            <div style="font-size: 12px; color: var(--zinc-400);">Area: ${registrations[0].area} ${registrations[0].areaUnit}</div>
            <div style="font-size: 11px; color: #34d399; margin-top: 4px;">Status: ${registrations[0].registrationStatus}</div>
          ` : `<div style="color: var(--zinc-500); font-size: 12px;">No registration file in demo dataset</div>`}
        </div>

        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="font-size: 12px; font-weight: 700; color: var(--gold-primary); margin-bottom: 6px;">AC Land Mutation Record</div>
          ${mutations.length > 0 && mutations[0].isRecordPresent ? `
            <div style="font-size: 12px; color: #fff;">Deed Ref: <span class="font-mono">${mutations[0].deedRef}</span></div>
            <div style="font-size: 12px; color: var(--zinc-400);">Buyer: <span class="font-mono">${mutations[0].buyerAlias}</span></div>
            <div style="font-size: 12px; color: var(--zinc-400);">Area: ${mutations[0].area} ${mutations[0].areaUnit}</div>
            <div style="font-size: 11px; color: ${mutations[0].mutationStatus === 'OBJECTION_FILED' ? '#f87171' : '#34d399'}; margin-top: 4px;">Status: ${mutations[0].mutationStatus}</div>
          ` : `
            <div style="color: #f87171; font-size: 12px; font-weight: 600;">Mutation Record Absent</div>
            <div style="font-size: 11px; color: var(--zinc-500); margin-top: 4px;">Missing from demo dataset / Verification required at Upazila Land Office</div>
          `}
        </div>
      </div>

      <!-- Modal Footer -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 16px;">
        <div style="font-size: 12px; color: var(--zinc-400);">
          ${alert ? `Active Case: <strong style="color: var(--gold-primary);">${alert.id}</strong> (Score: ${alert.score}/100)` : 'No active alerts for this plot'}
        </div>
        <div style="display: flex; gap: 8px;">
          ${alert ? `
            <button class="btn-gold" onclick="window.appOpenCaseModal('${alert.id}')">Open Case Detail</button>
          ` : ''}
          <button class="btn-secondary" onclick="window.appCloseModal()">Close</button>
        </div>
      </div>
    </div>
  `;
};

// ==========================================
// 3. DOCUMENT INTEGRITY CHECK
// ==========================================
function renderDocumentIntegrity() {
  pageTitle.textContent = 'Document Cryptographic Integrity Verification';
  pageSubtitle.textContent = 'SHA-256 digital fingerprinting comparing scanned copies to reference registry archives';

  const fingerprints = repo.getFingerprints();
  const currentDoc = fingerprints.find(f => f.id === activeDocId) || fingerprints[0];
  const isMatch = currentDoc.referenceSha256 === currentDoc.observedSha256 && currentDoc.integrityStatus !== 'MISMATCH';

  tabContainer.innerHTML = `
    <!-- Top Selector -->
    <div style="display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;">
      ${fingerprints.map(doc => `
        <button class="btn-secondary ${doc.id === currentDoc.id ? 'gold-glow-border' : ''}" 
          style="padding: 10px 16px; display: flex; align-items: center; gap: 10px; background: ${doc.id === currentDoc.id ? 'var(--surface-2)' : 'var(--surface-1)'};"
          onclick="window.appSelectDoc('${doc.id}')">
          <span style="font-size: 16px;">${doc.integrityStatus === 'MATCH' ? '🟢' : doc.integrityStatus === 'MISMATCH' ? '🔴' : '🟡'}</span>
          <div style="text-align: left;">
            <div style="font-weight: 700; color: #fff; font-size: 13px;">${doc.documentTitle}</div>
            <div class="font-mono" style="font-size: 10px; color: var(--zinc-400);">${doc.id.toUpperCase()}</div>
          </div>
        </button>
      `).join('')}
    </div>

    <div class="workspace-split">
      <!-- Left Column: SHA-256 Comparison & Content Inspector -->
      <div class="glass-panel-static" style="padding: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 700; color: #fff;">${currentDoc.documentTitle}</h3>
            <div style="font-size: 12px; color: var(--zinc-400);">Simulated Deed Scanned Text Archive Record</div>
          </div>
          <span class="badge ${isMatch ? 'badge-low' : 'badge-high'}" style="font-size: 12px; padding: 6px 12px;">
            <span class="status-pulse-dot ${isMatch ? 'pulse-emerald' : 'pulse-red'}"></span>
            ${isMatch ? 'INTEGRITY VERIFIED' : 'INTEGRITY MISMATCH DETECTED'}
          </span>
        </div>

        <!-- Fingerprint comparison blocks -->
        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
          <!-- Reference Hash -->
          <div style="background: rgba(24, 24, 27, 0.7); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--zinc-400);">
                Authorized Reference SHA-256 (Sub-Registry Archive Stamp)
              </span>
              <span class="badge badge-low" style="font-size: 9px;">AUTHORIZED ANCHOR</span>
            </div>
            <div class="font-mono" style="font-size: 12px; color: #34d399; word-break: break-all; background: #000; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-subtle);">
              ${currentDoc.referenceSha256}
            </div>
          </div>

          <!-- Observed Hash -->
          <div style="background: rgba(24, 24, 27, 0.7); padding: 14px; border-radius: 8px; border: 1px solid ${isMatch ? 'var(--border-subtle)' : 'rgba(239, 68, 68, 0.4)'};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--zinc-400);">
                Observed Live SHA-256 (Computed via Browser Web Crypto)
              </span>
              <span class="badge ${isMatch ? 'badge-low' : 'badge-high'}" style="font-size: 9px;">
                ${isMatch ? 'EXACT MATCH' : 'HASH DIVERGENCE'}
              </span>
            </div>
            <div class="font-mono" style="font-size: 12px; color: ${isMatch ? '#34d399' : '#f87171'}; word-break: break-all; background: #000; padding: 8px 12px; border-radius: 6px; border: 1px solid ${isMatch ? 'var(--border-subtle)' : 'rgba(239, 68, 68, 0.4)'};">
              ${currentDoc.observedSha256}
            </div>
          </div>
        </div>

        <!-- Raw Synthetic Deed Content -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: var(--zinc-300); text-transform: uppercase;">
              Synthetic Document Content Payload:
            </label>
            <span class="font-mono" style="font-size: 10px; color: var(--zinc-500);">${currentDoc.syntheticContent.length} bytes</span>
          </div>
          <textarea id="syntheticDocText" class="font-mono" rows="4" style="width: 100%; background: #000; border: 1px solid var(--border-subtle); color: #e4e4e7; border-radius: 8px; padding: 12px; font-size: 12px; outline: none; resize: vertical;">${currentDoc.syntheticContent}</textarea>
        </div>

        <!-- Action Controls -->
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn-gold" onclick="window.appRecalculateLiveHash()">
            🔄 Recalculate SHA-256
          </button>
          <button class="btn-secondary" style="border-color: rgba(239, 68, 68, 0.4); color: #f87171;" onclick="window.appSimulateTamper('${currentDoc.id}')">
            ⚠️ Simulate Altered Copy (+25 Risk)
          </button>
          <button class="btn-secondary" onclick="window.appResetDocument('${currentDoc.id}')">
            ↩️ Restore Reference Copy
          </button>
        </div>
      </div>

      <!-- Right Column: Verification Notes & File Warning -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="glass-panel-static" style="padding: 22px;">
          <h4 style="font-size: 14px; font-weight: 700; text-transform: uppercase; color: var(--gold-primary); margin-bottom: 12px;">
            Cryptographic Integrity Explanation
          </h4>
          <p style="font-size: 13px; color: var(--zinc-300); line-height: 1.6; margin-bottom: 12px;">
            ${currentDoc.notes}
          </p>
          <div style="background: rgba(250, 195, 6, 0.08); border: 1px solid rgba(250, 195, 6, 0.2); border-radius: 8px; padding: 12px; font-size: 12px; color: #fac306; line-height: 1.5;">
            <strong>⚠️ Security & Legal Disclaimer:</strong>
            <br>A SHA-256 hash comparison confirms whether the digital byte stream matches an authorized reference copy. By itself, <strong>it does NOT prove legal validity, title ownership, or authentic execution</strong>. A forged original document uploaded with a matching hash remains legally fraudulent until verified by an authorized Sub-Registrar.
          </div>
        </div>

        <!-- Synthetic File Picker Demonstrator -->
        <div class="glass-panel-static" style="padding: 22px;">
          <h4 style="font-size: 14px; font-weight: 700; text-transform: uppercase; color: var(--zinc-400); margin-bottom: 10px;">
            Test Synthetic Document File
          </h4>
          <div style="font-size: 12px; color: #f87171; font-weight: 600; margin-bottom: 10px;">
            🛑 PERSISTENT NOTICE: DEMO ONLY — Synthetic files only. Do NOT upload genuine land deeds, NIDs, or private records.
          </div>
          <input type="file" id="sampleDocInput" accept=".txt,.json,.pdf" style="font-size: 12px; color: var(--zinc-400); margin-bottom: 12px; width: 100%;">
          <div id="fileUploadResult" style="font-size: 12px; color: var(--zinc-300); display: none;"></div>
        </div>
      </div>
    </div>
  `;

  // Attach sample doc file input handler
  const fileInput = document.getElementById('sampleDocInput');
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        const content = evt.target.result;
        const hash = await computeSha256(content);
        const resultDiv = document.getElementById('fileUploadResult');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
          <div style="background: #000; padding: 10px; border-radius: 6px; border: 1px solid var(--border-subtle); margin-top: 8px;">
            <div style="font-weight: 700; color: #fff;">File: ${file.name} (${file.size} bytes)</div>
            <div class="font-mono" style="font-size: 11px; color: #60a5fa; margin-top: 4px; word-break: break-all;">Computed SHA-256: ${hash}</div>
            <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">Processed locally via Web Crypto API. No data uploaded to external servers.</div>
          </div>
        `;
      };
      reader.readAsText(file);
    });
  }
}

window.appSelectDoc = function(docId) {
  activeDocId = docId;
  renderDocumentIntegrity();
};

window.appRecalculateLiveHash = async function() {
  const textarea = document.getElementById('syntheticDocText');
  if (!textarea) return;
  const liveText = textarea.value;
  const hash = await computeSha256(liveText);

  const doc = repo.getFingerprints().find(f => f.id === activeDocId);
  if (doc) {
    doc.syntheticContent = liveText;
    doc.observedSha256 = hash;
    doc.integrityStatus = hash === doc.referenceSha256 ? 'MATCH' : 'MISMATCH';
    repo.recalculateAllAlerts();
    renderDocumentIntegrity();
  }
};

window.appSimulateTamper = function(docId) {
  repo.simulateTamperDocument(docId);
  renderDocumentIntegrity();
};

window.appResetDocument = function(docId) {
  repo.resetDocument(docId);
  renderDocumentIntegrity();
};

// ==========================================
// 4. DOUBLE-SELLING DETECTION
// ==========================================
function renderDoubleSelling() {
  pageTitle.textContent = 'Possible Double-Selling Conflict Detection';
  pageSubtitle.textContent = 'Algorithmic cross-matching for multiple unresolved registered sales sharing identical synthetic parcel keys';

  const deeds = repo.getDeeds();
  const parcels = repo.getParcels();

  // Find parcels with potential double-selling
  const doubleSellingCases = parcels.filter(p => {
    const pDeeds = deeds.filter(d => d.syntheticParcelKey === p.syntheticParcelKey && d.saleStatus === 'REGISTERED');
    const buyers = new Set(pDeeds.map(d => d.buyerAlias));
    return pDeeds.length > 1 && buyers.size > 1;
  });

  const conflictParcel = doubleSellingCases[0] || parcels[1];
  const conflictingDeeds = deeds.filter(d => d.syntheticParcelKey === conflictParcel.syntheticParcelKey);

  tabContainer.innerHTML = `
    <!-- Top summary card -->
    <div class="glass-panel-static" style="padding: 24px; margin-bottom: 24px; border-left: 4px solid var(--red-accent);">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge badge-high">DOUBLE-SELLING DETECTED</span>
            <span class="font-mono" style="font-size: 13px; color: var(--gold-primary); font-weight: 700;">${conflictParcel.syntheticParcelKey}</span>
          </div>
          <h2 style="font-size: 22px; font-weight: 800; color: #fff; margin: 6px 0;">
            Plot ${conflictParcel.plotDagNo} • ${conflictParcel.demoMouza}
          </h2>
          <p style="font-size: 13px; color: var(--zinc-300); max-width: 800px;">
            Two distinct registered deeds exist for the same canonical synthetic parcel key with no intermediate cancellation or partition record. Seller alias <strong>${conflictParcel.currentOwnerAlias}</strong> executed multiple sales to separate buyers within 23 days.
          </p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: var(--zinc-400);">Rules Engine Weight Contribution:</div>
          <div class="font-mono" style="font-size: 28px; font-weight: 800; color: #f87171;">+40 PTS</div>
          <button class="btn-gold" style="margin-top: 8px;" onclick="window.appRunDoubleSellingScan()">⚡ Re-run Detection</button>
        </div>
      </div>
    </div>

    <!-- Side-by-side Conflicting Deeds Evidence Table -->
    <div class="glass-panel-static" style="padding: 24px; margin-bottom: 24px;">
      <h3 style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 14px;">
        Conflicting Transfer Instruments (Evidence Set)
      </h3>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; margin-bottom: 20px;">
        ${conflictingDeeds.map((d, idx) => `
          <div style="background: var(--surface-1); border: 1px solid ${idx === 1 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}; border-radius: 12px; padding: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span class="badge ${idx === 1 ? 'badge-high' : 'badge-gold'}">INSTRUMENT #${idx + 1}</span>
              <span class="font-mono" style="font-size: 12px; color: #60a5fa; font-weight: 700;">${d.deedNo}</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
              <div>
                <span style="color: var(--zinc-500);">Registration Date:</span>
                <span class="font-mono" style="color: #fff; font-weight: 600; margin-left: 6px;">${formatDate(d.deedDate)}</span>
              </div>
              <div>
                <span style="color: var(--zinc-500);">Seller Alias:</span>
                <span class="font-mono" style="color: #f87171; font-weight: 700; margin-left: 6px;">${d.sellerAlias}</span>
              </div>
              <div>
                <span style="color: var(--zinc-500);">Buyer Alias:</span>
                <span class="font-mono" style="color: var(--gold-primary); font-weight: 700; margin-left: 6px;">${d.buyerAlias}</span>
              </div>
              <div>
                <span style="color: var(--zinc-500);">Declared Area:</span>
                <span style="color: #fff; font-weight: 600; margin-left: 6px;">${d.declaredArea} Decimals</span>
              </div>
              <div>
                <span style="color: var(--zinc-500);">Sub-Registry Office:</span>
                <span style="color: var(--zinc-300); margin-left: 6px;">${d.sourceRegistryOffice}</span>
              </div>
              <div>
                <span style="color: var(--zinc-500);">Status:</span>
                <span class="badge badge-low" style="margin-left: 6px;">${d.saleStatus}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Critical Notice on False Positives -->
      <div style="background: rgba(24, 24, 27, 0.6); border: 1px solid var(--border-subtle); padding: 16px; border-radius: 8px; font-size: 12px; color: var(--zinc-300); line-height: 1.6;">
        <strong style="color: var(--gold-primary);">⚖️ False Positive Prevention & Administrative Context:</strong>
        <br>Under Bangladesh land practice, a parcel key may legitimately feature multiple deeds due to: (1) valid partition (Bonton-nama) among legal heirs, (2) partial conveyance of a sub-plot (e.g. 5 decimals out of 15.5 decimals), or (3) registered deeds of cancellation/rectification (Bhul-shongshodhoni).
        <br>Therefore, JomiGuard AI flags these cases for <strong>triaged human review by the Sub-Registrar and AC (Land)</strong> to examine parent deeds and possession, rather than auto-voiding transactions.
      </div>
    </div>
  `;
}

window.appRunDoubleSellingScan = function() {
  repo.recalculateAllAlerts();
  renderDoubleSelling();
};

// ==========================================
// 5. RAPID TRANSFER DETECTION
// ==========================================
function renderRapidTransfers() {
  pageTitle.textContent = 'Rapid Succession Transfer (Velocity) Detector';
  pageSubtitle.textContent = 'Detection of abnormal high-frequency turnover sequences across short calendar windows';

  const settings = repo.getSettings();
  const transfers = repo.getTransfers();
  const parcels = repo.getParcels();

  // Check which parcels trigger
  const rapidParcel = parcels.find(p => p.syntheticParcelKey === 'PARCEL-SYN-DH-004') || parcels[3];
  const parcelTransfers = transfers
    .filter(t => t.syntheticParcelKey === rapidParcel.syntheticParcelKey)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  // Determine if threshold is met
  const isTriggered = parcelTransfers.length >= settings.rapidTransferCountThreshold;

  tabContainer.innerHTML = `
    <!-- Configurable Threshold Banner -->
    <div class="glass-panel-static" style="padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
        <div>
          <h3 style="font-size: 16px; font-weight: 700; color: #fff;">Interactive Prototype Velocity Thresholds</h3>
          <p style="font-size: 12px; color: var(--zinc-400);">
            Adjusting sliders immediately re-evaluates the rules engine in real-time. Illustrative prototype threshold, not an official or legal standard.
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="badge ${isTriggered ? 'badge-high' : 'badge-low'}" style="font-size: 12px; padding: 6px 12px;">
            ${isTriggered ? '⚠️ RAPID VELOCITY PATTERN ACTIVE' : '✅ VELOCITY WITHIN TOLERANCE'}
          </span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; background: rgba(0,0,0,0.5); padding: 18px; border-radius: 8px; border: 1px solid var(--border-subtle);">
        <!-- Slider 1: Count Threshold -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 13px; font-weight: 600; color: #fff;">Minimum Transfers Count (Threshold):</label>
            <span class="font-mono" style="font-weight: 800; color: var(--gold-primary);" id="lblCountThresh">${settings.rapidTransferCountThreshold} transfers</span>
          </div>
          <input type="range" id="sliderCountThresh" min="2" max="5" value="${settings.rapidTransferCountThreshold}" step="1" style="width: 100%; accent-color: var(--gold-primary); cursor: pointer;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--zinc-500); margin-top: 4px;">
            <span>2 transfers</span>
            <span>3 transfers (Default)</span>
            <span>4 transfers</span>
            <span>5 transfers</span>
          </div>
        </div>

        <!-- Slider 2: Window in Days -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 13px; font-weight: 600; color: #fff;">Evaluation Time Window (Days):</label>
            <span class="font-mono" style="font-weight: 800; color: var(--gold-primary);" id="lblWindowDays">${settings.rapidTransferWindowDays} days</span>
          </div>
          <input type="range" id="sliderWindowDays" min="30" max="180" value="${settings.rapidTransferWindowDays}" step="15" style="width: 100%; accent-color: var(--gold-primary); cursor: pointer;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--zinc-500); margin-top: 4px;">
            <span>30 days</span>
            <span>90 days (Default)</span>
            <span>180 days</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Rapid Sequence Timeline -->
    <div class="glass-panel-static" style="padding: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <span class="font-mono" style="font-size: 11px; color: var(--gold-primary); font-weight: 700;">${rapidParcel.syntheticParcelKey}</span>
          <h3 style="font-size: 18px; font-weight: 700; color: #fff;">
            Plot ${rapidParcel.plotDagNo} • ${rapidParcel.demoMouza}
          </h3>
          <div style="font-size: 12px; color: var(--zinc-400);">Chain of successive ownership conveyances</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: var(--zinc-400);">Velocity Weight:</div>
          <div class="font-mono" style="font-size: 22px; font-weight: 800; color: ${isTriggered ? '#f87171' : '#34d399'};">
            ${isTriggered ? '+15 PTS' : '0 PTS'}
          </div>
        </div>
      </div>

      <!-- Timeline visual -->
      <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
        ${parcelTransfers.map((t, index) => `
          <div style="display: flex; gap: 16px; align-items: center; background: var(--surface-1); padding: 16px; border-radius: 8px; border: 1px solid var(--border-subtle);">
            <div style="background: var(--gold-primary); color: #000; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;">
              ${index + 1}
            </div>
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                <span class="font-mono" style="font-weight: 700; color: #fff; font-size: 13px;">${formatDate(t.eventDate)}</span>
                <span class="badge badge-gold" style="font-size: 10px;">${t.deedId}</span>
              </div>
              <div style="font-size: 13px; color: var(--zinc-300);">
                From Seller <strong class="font-mono" style="color: #f87171;">${t.sellerAlias}</strong> ➔ Transferred to Buyer <strong class="font-mono" style="color: #34d399;">${t.buyerAlias}</strong>
              </div>
            </div>
            <div style="text-align: right; font-size: 12px; color: var(--zinc-400);">
              <div>Area: ${t.area} Dec</div>
              <div class="font-mono" style="font-size: 10px; color: var(--zinc-500);">${t.status}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Summary metrics box -->
      <div style="background: rgba(24, 24, 27, 0.6); padding: 16px; border-radius: 8px; border: 1px solid var(--border-subtle); font-size: 13px; color: var(--zinc-300); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>Observed Sequence Span:</strong> 3 recorded transfers over <strong>42 calendar days</strong> (Average: 1 transfer every 14 days).
        </div>
        <button class="btn-secondary" onclick="window.appOpenCaseModal('alt-003')">
          Inspect Case File alt-003
        </button>
      </div>
    </div>
  `;

  // Attach slider event listeners
  const countSlider = document.getElementById('sliderCountThresh');
  const windowSlider = document.getElementById('sliderWindowDays');

  if (countSlider) {
    countSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      repo.updateSettings({ rapidTransferCountThreshold: val });
      renderRapidTransfers();
    });
  }

  if (windowSlider) {
    windowSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      repo.updateSettings({ rapidTransferWindowDays: val });
      renderRapidTransfers();
    });
  }
}

// ==========================================
// 6. REGISTRATION VS MUTATION RECONCILIATION
// ==========================================
function renderReconciliation() {
  pageTitle.textContent = 'Registration vs Mutation Cross-System Reconciliation';
  pageSubtitle.textContent = 'Automated field-by-field verification between Sub-Registry (Ministry of Law) and AC Land Mutation (Ministry of Land)';

  const parcels = repo.getParcels();
  const registrations = repo.getRegistrations();
  const mutations = repo.getMutations();

  tabContainer.innerHTML = `
    <!-- Context Banner -->
    <div class="glass-panel-static" style="padding: 20px; margin-bottom: 24px; border-left: 4px solid var(--gold-primary);">
      <h3 style="font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 6px;">
        Institutional Governance Gap in Bangladesh Land Administration
      </h3>
      <p style="font-size: 13px; color: var(--zinc-300); line-height: 1.5;">
        Deed registration occurs at the <strong>Sub-Registry Office</strong> (Registration Directorate under Ministry of Law), whereas record-of-rights updates (Namzari/Mutation and Khatian issuance) occur separately at the <strong>Assistant Commissioner (Land) AC Land Office</strong> (Ministry of Land). Without real-time synchronization, unscrupulous actors can exploit the gap to register conflicting deeds before mutation is sanctioned.
      </p>
    </div>

    <!-- Comparative Cases Cards -->
    <div style="display: flex; flex-direction: column; gap: 24px;">
      ${parcels.map(parcel => {
        const reg = registrations.find(r => r.syntheticParcelKey === parcel.syntheticParcelKey);
        const mut = mutations.find(m => m.syntheticParcelKey === parcel.syntheticParcelKey);

        const buyerMatch = reg && mut && reg.buyerAlias === mut.buyerAlias;
        const areaMatch = reg && mut && Math.abs(reg.area - mut.area) < 0.01;
        const recordPresent = mut && mut.isRecordPresent;

        let statusBadge = '';
        if (!recordPresent) {
          statusBadge = '<span class="badge badge-high">MUTATION RECORD ABSENT</span>';
        } else if (!buyerMatch || !areaMatch) {
          statusBadge = '<span class="badge badge-high">FIELD DISCREPANCY DETECTED</span>';
        } else {
          statusBadge = '<span class="badge badge-low">RECONCILED IN DEMO DATA</span>';
        }

        return `
          <div class="glass-panel-static" style="padding: 22px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
              <div>
                <span class="font-mono" style="font-size: 11px; color: var(--gold-primary); font-weight: 700;">${parcel.syntheticParcelKey}</span>
                <h3 style="font-size: 17px; font-weight: 700; color: #fff;">
                  Plot ${parcel.plotDagNo} • ${parcel.demoMouza}
                </h3>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                ${statusBadge}
                <button class="btn-secondary" style="font-size: 11px; padding: 4px 10px;" onclick="window.appOpenParcel('${parcel.id}')">
                  View Plot
                </button>
              </div>
            </div>

            <!-- Field-by-field Comparison Table -->
            <div style="overflow-x: auto;">
              <table class="enterprise-table" style="font-size: 12px;">
                <thead>
                  <tr>
                    <th>Verification Field</th>
                    <th>Sub-Registry Deed Value</th>
                    <th>AC Land Mutation Value</th>
                    <th>Reconciliation Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="font-weight: 600; color: #fff;">Deed / Case Reference</td>
                    <td class="font-mono">${reg ? reg.deedRef : 'N/A'}</td>
                    <td class="font-mono">${mut ? mut.deedRef : 'N/A'}</td>
                    <td>
                      <span class="badge ${reg && mut && reg.deedRef === mut.deedRef ? 'badge-low' : 'badge-high'}">
                        ${reg && mut && reg.deedRef === mut.deedRef ? 'MATCH' : 'MISMATCH'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600; color: #fff;">Buyer / Transferee Alias</td>
                    <td class="font-mono" style="color: var(--gold-primary);">${reg ? reg.buyerAlias : 'N/A'}</td>
                    <td class="font-mono" style="color: ${buyerMatch ? 'var(--gold-primary)' : '#f87171'}; font-weight: 700;">
                      ${mut ? mut.buyerAlias : 'N/A'}
                    </td>
                    <td>
                      <span class="badge ${buyerMatch ? 'badge-low' : 'badge-high'}">
                        ${buyerMatch ? 'MATCH' : 'MISMATCH (ALERT)'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600; color: #fff;">Conveyed Area Dimension</td>
                    <td>${reg ? `${reg.area} ${reg.areaUnit}` : 'N/A'}</td>
                    <td style="font-weight: 700; color: ${areaMatch ? '#fff' : '#f87171'};">
                      ${mut ? `${mut.area} ${mut.areaUnit}` : 'N/A'}
                    </td>
                    <td>
                      <span class="badge ${areaMatch ? 'badge-low' : 'badge-high'}">
                        ${areaMatch ? 'MATCH' : 'AREA DRIFT (ALERT)'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600; color: #fff;">Transaction / Sanction Date</td>
                    <td class="font-mono">${reg ? formatDate(reg.transferDate) : 'N/A'}</td>
                    <td class="font-mono">${mut ? formatDate(mut.mutationDate) : 'N/A'}</td>
                    <td><span class="badge badge-low">CHRONOLOGY OK</span></td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600; color: #fff;">Administrative Status</td>
                    <td><span class="badge badge-low">${reg ? reg.registrationStatus : 'N/A'}</span></td>
                    <td>
                      <span class="badge ${mut && mut.mutationStatus === 'OBJECTION_FILED' ? 'badge-high' : 'badge-low'}">
                        ${mut ? mut.mutationStatus : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span class="badge ${mut && mut.mutationStatus === 'OBJECTION_FILED' ? 'badge-high' : 'badge-low'}">
                        ${mut && mut.mutationStatus === 'OBJECTION_FILED' ? 'CAVEAT ACTIVE' : 'SATISFACTORY'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            ${!recordPresent ? `
              <div style="margin-top: 10px; font-size: 11px; color: var(--zinc-400); font-style: italic;">
                ℹ️ Missing record note: Record missing from demo dataset; requires physical register verification at AC Land office, not automated proof of wrongdoing.
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ==========================================
// 7. REVIEW CASES & ALERT MANAGEMENT
// ==========================================
function renderCaseManagement() {
  pageTitle.textContent = 'Discrepancy Cases & Human Review Workspace';
  pageSubtitle.textContent = 'Structured adjudication triage workflow for Sub-Registrars, AC Land officers, and Land Auditors';

  const alerts = repo.getAlerts();
  const settings = repo.getSettings();

  tabContainer.innerHTML = `
    <!-- Reviewer role banner -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; background: var(--surface-1); padding: 14px 20px; border-radius: 8px; border: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 10px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 18px;">👤</span>
        <div>
          <div style="font-size: 13px; font-weight: 700; color: #fff;">Active Simulated Reviewer: ${settings.reviewerAlias}</div>
          <div style="font-size: 11px; color: var(--zinc-400);">Simulated Role: <strong style="color: var(--gold-primary);">${settings.currentReviewerRole}</strong> (UI Simulation, not production auth)</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 12px; color: var(--zinc-400);">Switch Persona:</span>
        <select onchange="window.appChangeRole(this.value)" style="background: #000; border: 1px solid var(--border-subtle); color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">
          <option value="Demo Sub-Registrar" ${settings.currentReviewerRole === 'Demo Sub-Registrar' ? 'selected' : ''}>Demo Sub-Registrar</option>
          <option value="Demo AC Land Officer" ${settings.currentReviewerRole === 'Demo AC Land Officer' ? 'selected' : ''}>Demo AC Land Officer</option>
          <option value="Demo Land Auditor" ${settings.currentReviewerRole === 'Demo Land Auditor' ? 'selected' : ''}>Demo Land Auditor</option>
        </select>
      </div>
    </div>

    <!-- Cases Table -->
    <div class="glass-panel-static" style="padding: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <h3 style="font-size: 18px; font-weight: 700; color: #fff;">All Discrepancy Alerts (${alerts.length})</h3>
        <span style="font-size: 12px; color: var(--zinc-400);">Click "Review Case" to change status or record inspection notes</span>
      </div>

      <div style="overflow-x: auto;">
        <table class="enterprise-table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Parcel Key</th>
              <th>Triggered Rules Breakdown</th>
              <th>Score</th>
              <th>Severity</th>
              <th>Current Status</th>
              <th>Assigned Reviewer</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${alerts.map(a => `
              <tr>
                <td class="font-mono" style="color: var(--gold-primary); font-weight: 700;">${a.id}</td>
                <td class="font-mono" style="font-weight: 600; color: #60a5fa;">${a.syntheticParcelKey}</td>
                <td>
                  <div style="display: flex; flex-direction: column; gap: 2px;">
                    ${a.rulesTriggered.map(r => `
                      <div style="font-size: 11px; color: #fff;">
                        • <strong>${r.name}</strong> <span class="font-mono" style="color: var(--gold-primary);">(+${r.weight})</span>
                      </div>
                    `).join('')}
                  </div>
                </td>
                <td>
                  <div class="font-mono" style="font-weight: 800; font-size: 15px; color: ${a.score >= 60 ? '#f87171' : a.score >= 30 ? 'var(--gold-primary)' : '#34d399'};">
                    ${a.score}/100
                  </div>
                </td>
                <td>
                  <span class="badge ${a.severity === 'HIGH' ? 'badge-high' : a.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'}">
                    ${a.severity}
                  </span>
                </td>
                <td>
                  <span style="font-size: 12px; font-weight: 600; color: #e4e4e7;">${a.status}</span>
                </td>
                <td class="font-mono" style="font-size: 11px; color: var(--zinc-400);">
                  ${a.assignedReviewerAlias}
                </td>
                <td>
                  <button class="btn-gold" style="padding: 5px 10px; font-size: 11px;" onclick="window.appOpenCaseModal('${a.id}')">
                    Review Case
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Case Detail Modal
window.appOpenCaseModal = function(caseId) {
  const alert = repo.getAlerts().find(a => a.id === caseId);
  if (!alert) return;

  const parcel = repo.getParcels().find(p => p.syntheticParcelKey === alert.syntheticParcelKey);
  const auditLogs = repo.getAuditLogs().filter(l => l.caseId === caseId);
  const settings = repo.getSettings();

  modalContainer.style.display = 'flex';
  modalContainer.className = 'modal-overlay';
  modalContainer.innerHTML = `
    <div class="modal-content" style="padding: 28px;">
      <!-- Header -->
      <div style="display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge ${alert.severity === 'HIGH' ? 'badge-high' : alert.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'}">${alert.severity} SEVERITY</span>
            <span class="font-mono" style="font-size: 13px; color: var(--gold-primary); font-weight: 700;">CASE ${alert.id}</span>
          </div>
          <h2 style="font-size: 22px; font-weight: 800; color: #fff; margin-top: 4px;">
            Parcel ${alert.syntheticParcelKey}
          </h2>
          <div style="font-size: 12px; color: var(--zinc-400);">${parcel ? `${parcel.demoMouza} • Dag ${parcel.plotDagNo}` : ''}</div>
        </div>
        <button onclick="window.appCloseModal()" style="background: none; border: none; color: var(--zinc-400); font-size: 20px; cursor: pointer;">✕</button>
      </div>

      <!-- Transparent Score Breakdown -->
      <div style="background: rgba(24, 24, 27, 0.7); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h4 style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: var(--zinc-300);">
            Deterministic Risk Score Breakdown (Capped at 100)
          </h4>
          <span class="font-mono" style="font-size: 22px; font-weight: 800; color: ${alert.score >= 60 ? '#f87171' : 'var(--gold-primary)'};">
            ${alert.score} / 100
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${alert.rulesTriggered.map(r => `
            <div style="background: #000; padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 700; color: #fff; font-size: 13px;">${r.name}</div>
                <div style="font-size: 11px; color: var(--zinc-400);">${r.description}</div>
              </div>
              <span class="font-mono" style="font-weight: 800; color: var(--gold-primary); font-size: 14px;">+${r.weight} PTS</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Supporting Evidence Refs -->
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: var(--zinc-400); margin-bottom: 8px;">
          Supporting Demonstration Evidence Items
        </h4>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${alert.evidenceRefs.map(ref => `
            <span class="font-mono" style="background: var(--surface-1); border: 1px solid var(--border-subtle); padding: 4px 10px; border-radius: 6px; font-size: 12px; color: #60a5fa;">
              ${ref}
            </span>
          `).join('')}
        </div>
      </div>

      <!-- Recommended Next Action -->
      <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 12px; color: #93c5fd; line-height: 1.5;">
        <strong>Recommended Next Administrative Action:</strong>
        <br>Schedule physical verification hearing between Sub-Registry deed register volume and Upazila Land Office mutation khatian. Require biometric alias verification and on-site spot survey.
      </div>

      <!-- Reviewer Note & Status Form -->
      <div style="background: var(--surface-1); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <h4 style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: #fff; margin-bottom: 12px;">
          Reviewer Triage Action & Audit Recording
        </h4>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div>
            <label style="font-size: 12px; color: var(--zinc-400); display: block; margin-bottom: 4px;">Transition Case Status:</label>
            <select id="caseStatusSelect" style="width: 100%; background: #000; border: 1px solid var(--border-subtle); color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; outline: none;">
              <option value="New" ${alert.status === 'New' ? 'selected' : ''}>New</option>
              <option value="Under Review" ${alert.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
              <option value="Resolved — No Issue Found" ${alert.status === 'Resolved — No Issue Found' ? 'selected' : ''}>Resolved — No Issue Found</option>
              <option value="Escalated for Authorized Review" ${alert.status === 'Escalated for Authorized Review' ? 'selected' : ''}>Escalated for Authorized Review</option>
            </select>
          </div>

          <div>
            <label style="font-size: 12px; color: var(--zinc-400); display: block; margin-bottom: 4px;">Assigned Reviewer Alias:</label>
            <input type="text" id="caseReviewerInput" value="${alert.assignedReviewerAlias || settings.reviewerAlias}" class="font-mono" style="width: 100%; background: #000; border: 1px solid var(--border-subtle); color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; outline: none;">
          </div>
        </div>

        <div style="margin-bottom: 14px;">
          <label style="font-size: 12px; color: var(--zinc-400); display: block; margin-bottom: 4px;">Add Reviewer Note (Appended to Local Audit Log):</label>
          <textarea id="caseNoteInput" rows="2" placeholder="e.g. Verified volume 2026/89; caveat issued to Sub-Registrar..." style="width: 100%; background: #000; border: 1px solid var(--border-subtle); color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; outline: none; resize: vertical;"></textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button class="btn-gold" onclick="window.appSaveCaseUpdates('${alert.id}')">
            💾 Save Status & Add Note
          </button>
        </div>
      </div>

      <!-- Case Note History -->
      ${alert.notes ? `
        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: var(--zinc-400); margin-bottom: 6px;">
            Case Notes Log:
          </h4>
          <pre class="font-mono" style="background: #000; padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle); color: #e4e4e7; font-size: 11px; white-space: pre-wrap;">${alert.notes}</pre>
        </div>
      ` : ''}

      <!-- Modal Close Button -->
      <div style="text-align: right; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
        <button class="btn-secondary" onclick="window.appCloseModal()">Close</button>
      </div>
    </div>
  `;
};

window.appSaveCaseUpdates = function(caseId) {
  const statusSelect = document.getElementById('caseStatusSelect');
  const reviewerInput = document.getElementById('caseReviewerInput');
  const noteInput = document.getElementById('caseNoteInput');

  if (!statusSelect) return;

  const newStatus = statusSelect.value;
  const reviewer = reviewerInput ? reviewerInput.value : undefined;
  const note = noteInput ? noteInput.value : undefined;

  repo.updateAlertStatus(caseId, newStatus, note, reviewer);
  window.appCloseModal();
  renderView();
};

// ==========================================
// 8. METHODOLOGY, DEMO DATA & SETTINGS
// ==========================================
function renderMethodologySettings() {
  pageTitle.textContent = 'Methodology, Scenario Loader & Settings';
  pageSubtitle.textContent = 'Deterministic scoring weights, hackathon compliance declarations, and synthetic dataset management';

  const settings = repo.getSettings();

  tabContainer.innerHTML = `
    <!-- Hackathon Track & Problem Statement Card -->
    <div class="glass-panel-static" style="padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
        <div>
          <span class="badge badge-gold">LANDTECH 2026 HACKATHON</span>
          <h2 style="font-size: 20px; font-weight: 800; color: #fff; margin: 6px 0;">
            Track: Digital Land Records, Verification & Digitization
          </h2>
          <div style="font-size: 14px; color: var(--zinc-300);">
            Selected Problem: <strong>P3 — Fraud & Double-Selling Detection</strong>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; color: var(--zinc-400);">App Version:</div>
          <div class="font-mono" style="font-weight: 800; color: #fff;">v1.0.0-PROTOTYPE</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 20px;">
        <div style="background: #000; padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="font-weight: 700; color: #10b981; font-size: 13px;">🛡️ 100% Synthetic Data</div>
          <div style="font-size: 12px; color: var(--zinc-400); margin-top: 4px;">
            Zero genuine citizen records, NID numbers, phone numbers, or private addresses. Cleanly aliased throughout.
          </div>
        </div>

        <div style="background: #000; padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="font-weight: 700; color: #60a5fa; font-size: 13px;">🔒 Offline Sandbox</div>
          <div style="font-size: 12px; color: var(--zinc-400); margin-top: 4px;">
            No scraping, API requests, or bulk downloads to any live government portal. All logic confined locally.
          </div>
        </div>

        <div style="background: #000; padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="font-weight: 700; color: var(--gold-primary); font-size: 13px;">⚖️ Advisory Triage Only</div>
          <div style="font-size: 12px; color: var(--zinc-400); margin-top: 4px;">
            Produces review priority scores, not legal conclusions or automated fraud verdicts.
          </div>
        </div>
      </div>
    </div>

    <!-- ONE-CLICK SCENARIOS LOADER (A to F) -->
    <div class="glass-panel-static" style="padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <h3 style="font-size: 17px; font-weight: 700; color: #fff;">Seeded Scenarios Quick-Loader (Scenarios A–F)</h3>
          <p style="font-size: 12px; color: var(--zinc-400);">Click any scenario to jump directly to its record and inspect the rule outcome</p>
        </div>
        <button class="btn-secondary" onclick="window.appResetSeedData()">↩️ Reset All to Factory Seed</button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px;">
        <!-- Scenario A -->
        <div style="background: var(--surface-1); border: 1px solid var(--border-subtle); padding: 14px; border-radius: 8px; cursor: pointer; transition: border-color 0.2s;" onclick="window.appLoadScenario('A')">
          <div style="display: flex; justify-content: space-between;">
            <span class="badge badge-low">SCENARIO A</span>
            <span class="font-mono" style="font-size: 11px; color: #34d399;">Score: 0 (Low)</span>
          </div>
          <div style="font-weight: 700; color: #fff; margin: 6px 0 2px 0;">Clean Record Baseline</div>
          <div style="font-size: 12px; color: var(--zinc-400);">Single sale, SHA-256 matches, Reg/Mutation agree, no rapid velocity.</div>
        </div>

        <!-- Scenario B -->
        <div style="background: var(--surface-1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 14px; border-radius: 8px; cursor: pointer; transition: border-color 0.2s;" onclick="window.appLoadScenario('B')">
          <div style="display: flex; justify-content: space-between;">
            <span class="badge badge-high">SCENARIO B</span>
            <span class="font-mono" style="font-size: 11px; color: #f87171;">Score: 60 (High)</span>
          </div>
          <div style="font-weight: 700; color: #fff; margin: 6px 0 2px 0;">Possible Double-Selling Conflict</div>
          <div style="font-size: 12px; color: var(--zinc-400);">Plot 204 registered to BUYER-SYN-002 and BUYER-SYN-003 by same seller.</div>
        </div>

        <!-- Scenario C -->
        <div style="background: var(--surface-1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 14px; border-radius: 8px; cursor: pointer; transition: border-color 0.2s;" onclick="window.appLoadScenario('C')">
          <div style="display: flex; justify-content: space-between;">
            <span class="badge badge-medium">SCENARIO C</span>
            <span class="font-mono" style="font-size: 11px; color: #fbbf24;">Score: 35 (Med)</span>
          </div>
          <div style="font-weight: 700; color: #fff; margin: 6px 0 2px 0;">Altered Document Hash Mismatch</div>
          <div style="font-size: 12px; color: var(--zinc-400);">Observed SHA-256 diverges from Sub-Registry reference copy.</div>
        </div>

        <!-- Scenario D -->
        <div style="background: var(--surface-1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 14px; border-radius: 8px; cursor: pointer; transition: border-color 0.2s;" onclick="window.appLoadScenario('D')">
          <div style="display: flex; justify-content: space-between;">
            <span class="badge badge-medium">SCENARIO D</span>
            <span class="font-mono" style="font-size: 11px; color: #fbbf24;">Score: 35 (Med)</span>
          </div>
          <div style="font-weight: 700; color: #fff; margin: 6px 0 2px 0;">Rapid Transfer Sequence</div>
          <div style="font-size: 12px; color: var(--zinc-400);">3 consecutive recorded transfers in 42 calendar days.</div>
        </div>

        <!-- Scenario E -->
        <div style="background: var(--surface-1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 14px; border-radius: 8px; cursor: pointer; transition: border-color 0.2s;" onclick="window.appLoadScenario('E')">
          <div style="display: flex; justify-content: space-between;">
            <span class="badge badge-medium">SCENARIO E</span>
            <span class="font-mono" style="font-size: 11px; color: #fbbf24;">Score: 30 (Med)</span>
          </div>
          <div style="font-weight: 700; color: #fff; margin: 6px 0 2px 0;">Reg vs Mutation Mismatch</div>
          <div style="font-size: 12px; color: var(--zinc-400);">Sub-Registry records 20.0 dec vs AC Land records 14.5 dec & different buyer.</div>
        </div>

        <!-- Scenario F -->
        <div style="background: var(--surface-1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 14px; border-radius: 8px; cursor: pointer; transition: border-color 0.2s;" onclick="window.appLoadScenario('F')">
          <div style="display: flex; justify-content: space-between;">
            <span class="badge badge-medium">SCENARIO F</span>
            <span class="font-mono" style="font-size: 11px; color: #fbbf24;">Score: 30 (Med)</span>
          </div>
          <div style="font-weight: 700; color: #fff; margin: 6px 0 2px 0;">Missing Mutation Record</div>
          <div style="font-size: 12px; color: var(--zinc-400);">Registered deed exists, but AC Land mutation file is absent from demo dataset.</div>
        </div>
      </div>
    </div>

    <!-- CONFIGURABLE HEURISTIC WEIGHTS & THRESHOLDS (PRD Section 7) -->
    <div class="glass-panel-static" style="padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
        <div>
          <h3 style="font-size: 17px; font-weight: 700; color: #fff;">Configurable Detection Weights & Demonstration Thresholds</h3>
          <p style="font-size: 12px; color: var(--zinc-400);">Illustrative prototype weights (capped at 100). Explicitly not an official or legal standard.</p>
        </div>
        <span class="badge badge-gold font-mono">DETERMINISTIC ENGINE</span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #fff;">Possible Double-Selling Weight</label>
            <span class="font-mono font-bold" style="color: #f87171;">+${settings.weightDoubleSelling}</span>
          </div>
          <input type="range" min="10" max="60" step="5" value="${settings.weightDoubleSelling}" 
                 onchange="window.appUpdateWeight('weightDoubleSelling', this.value)" style="width: 100%;">
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">PRD baseline default: +40</div>
        </div>

        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #fff;">Document Hash Mismatch Weight</label>
            <span class="font-mono font-bold" style="color: #fbbf24;">+${settings.weightDocumentIntegrity}</span>
          </div>
          <input type="range" min="10" max="50" step="5" value="${settings.weightDocumentIntegrity}" 
                 onchange="window.appUpdateWeight('weightDocumentIntegrity', this.value)" style="width: 100%;">
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">PRD baseline default: +25</div>
        </div>

        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #fff;">Registration/Mutation Mismatch</label>
            <span class="font-mono font-bold" style="color: #60a5fa;">+${settings.weightRegMutationMismatch}</span>
          </div>
          <input type="range" min="10" max="40" step="5" value="${settings.weightRegMutationMismatch}" 
                 onchange="window.appUpdateWeight('weightRegMutationMismatch', this.value)" style="width: 100%;">
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">PRD baseline default: +20</div>
        </div>

        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #fff;">Rapid Transfer Pattern Weight</label>
            <span class="font-mono font-bold" style="color: #a78bfa;">+${settings.weightRapidTransfer}</span>
          </div>
          <input type="range" min="5" max="30" step="5" value="${settings.weightRapidTransfer}" 
                 onchange="window.appUpdateWeight('weightRapidTransfer', this.value)" style="width: 100%;">
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">PRD baseline default: +15</div>
        </div>

        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #fff;">Rapid Transfer Threshold</label>
            <span class="font-mono font-bold" style="color: #38bdf8;">${settings.rapidTransferCountThreshold} transfers</span>
          </div>
          <input type="range" min="2" max="6" step="1" value="${settings.rapidTransferCountThreshold}" 
                 onchange="window.appUpdateWeight('rapidTransferCountThreshold', this.value)" style="width: 100%;">
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">Default: 3 transfers in ${settings.rapidTransferWindowDays} days</div>
        </div>

        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #fff;">Missing Critical Field Weight</label>
            <span class="font-mono font-bold" style="color: #34d399;">+${settings.weightMissingFields}</span>
          </div>
          <input type="range" min="5" max="25" step="5" value="${settings.weightMissingFields}" 
                 onchange="window.appUpdateWeight('weightMissingFields', this.value)" style="width: 100%;">
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">PRD baseline default: +10</div>
        </div>
      </div>
    </div>

    <!-- PRD ETHICAL SAFEGUARDS & NON-GOALS (PRD Section 3 & Section 7.1) -->
    <div class="glass-panel-static" style="padding: 24px; margin-bottom: 24px;">
      <h3 style="font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 8px;">
        Methodology & Non-Goals Architecture
      </h3>
      <p style="font-size: 12px; color: var(--zinc-400); margin-bottom: 16px;">
        Core non-negotiable boundaries defined by the LandTech 2026 Rule Book and PRD:
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border-left: 3px solid #ef4444;">
          <div style="font-size: 12px; font-weight: 800; color: #f87171;">🚫 No Legal Adjudication</div>
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">
            Never determines legal ownership or declares fraud proven. All signals are flags for review requiring authorized human investigation.
          </div>
        </div>

        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border-left: 3px solid #f59e0b;">
          <div style="font-size: 12px; font-weight: 800; color: #fbbf24;">🚫 No Black-Box LLM Scoring</div>
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">
            The risk engine is 100% deterministic, transparent and unit-testable. LLMs are not used as opaque scoring authorities.
          </div>
        </div>

        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border-left: 3px solid #10b981;">
          <div style="font-size: 12px; font-weight: 800; color: #34d399;">🚫 No Live Government Scraping</div>
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">
            Zero external connections to live land portals (ePorcha, DLRS, etc.). Completely offline synthetic demonstrator.
          </div>
        </div>
      </div>
    </div>

    <!-- Export & Data Management -->
    <div class="glass-panel-static" style="padding: 24px;">
      <h3 style="font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 8px;">
        Synthetic Data Export & Local Backup
      </h3>
      <p style="font-size: 12px; color: var(--zinc-400); margin-bottom: 16px;">
        Export current synthetic state for evaluation or testing. Output strictly contains synthetic aliases and demo identifiers.
      </p>

      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="btn-gold" onclick="window.appExportJson()">
          📥 Export Synthetic Records (JSON)
        </button>
        <button class="btn-secondary" onclick="window.appExportCsv()">
          📊 Export Triage Alerts (CSV)
        </button>
        <button class="btn-secondary" style="color: #f87171; border-color: rgba(239, 68, 68, 0.3);" onclick="window.appResetSeedData()">
          ⚠️ Reset Demo Data to Pristine State
        </button>
      </div>
    </div>
  `;
}

window.appUpdateWeight = function(key, val) {
  const updateObj = {};
  updateObj[key] = parseInt(val, 10);
  repo.updateSettings(updateObj);
  repo.recalculateAllAlerts();
  renderMethodologySettings();
};

// Scenario Quick Load Dispatcher
window.appLoadScenario = function(letter) {
  switch (letter) {
    case 'A':
      switchTab('parcels');
      window.appOpenParcel('p-001');
      break;
    case 'B':
      switchTab('double-selling');
      break;
    case 'C':
      switchTab('integrity');
      window.appSelectDoc('doc-002');
      break;
    case 'D':
      switchTab('rapid-transfers');
      break;
    case 'E':
      switchTab('reconciliation');
      break;
    case 'F':
      switchTab('reconciliation');
      break;
    default:
      switchTab('overview');
  }
};

window.appOpenHighRisk = function() {
  switchTab('cases');
};

window.appClearSearch = function() {
  searchQuery = '';
  if (globalSearchInput) globalSearchInput.value = '';
  renderView();
};

window.appRunRecheck = function() {
  repo.recalculateAllAlerts();
  renderView();
};

window.appResetSeedData = function() {
  if (confirm('Reset all demonstration datasets, hashes, and audit logs to factory seed state?')) {
    repo.resetToSeed();
    renderView();
  }
};

window.appChangeRole = function(newRole) {
  repo.updateSettings({ currentReviewerRole: newRole });
  if (roleSelector) roleSelector.value = newRole;
  renderView();
};

// Export Handlers
window.appExportJson = function() {
  const jsonStr = repo.exportSyntheticDataJson();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jomiguard_synthetic_records_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

window.appExportCsv = function() {
  const csvStr = repo.exportSyntheticAlertsCsv();
  const blob = new Blob([csvStr], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jomiguard_synthetic_alerts_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

window.appCloseModal = function() {
  modalContainer.style.display = 'none';
};

// Modal for Scenarios list
function openScenariosModal() {
  modalContainer.style.display = 'flex';
  modalContainer.className = 'modal-overlay';
  modalContainer.innerHTML = `
    <div class="modal-content" style="padding: 24px; max-width: 600px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="font-size: 18px; font-weight: 700; color: #fff;">Select Demonstration Scenario</h3>
        <button onclick="window.appCloseModal()" style="background: none; border: none; color: var(--zinc-400); font-size: 20px; cursor: pointer;">✕</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="btn-secondary" style="justify-content: flex-start; text-align: left; padding: 12px;" onclick="window.appLoadScenario('A'); window.appCloseModal();">
          <div>
            <div style="font-weight: 700; color: #10b981;">Scenario A: Clean Baseline Record (Low Risk, 0 pts)</div>
            <div style="font-size: 11px; color: var(--zinc-400);">All documents, hashes, and registers match perfectly.</div>
          </div>
        </button>
        <button class="btn-secondary" style="justify-content: flex-start; text-align: left; padding: 12px;" onclick="window.appLoadScenario('B'); window.appCloseModal();">
          <div>
            <div style="font-weight: 700; color: #f87171;">Scenario B: Possible Double-Selling Conflict (High Risk, 60 pts)</div>
            <div style="font-size: 11px; color: var(--zinc-400);">Dual uncancelled deeds to distinct buyers for Plot 204.</div>
          </div>
        </button>
        <button class="btn-secondary" style="justify-content: flex-start; text-align: left; padding: 12px;" onclick="window.appLoadScenario('C'); window.appCloseModal();">
          <div>
            <div style="font-weight: 700; color: #fbbf24;">Scenario C: Altered Document Hash Mismatch (Medium Risk, 35 pts)</div>
            <div style="font-size: 11px; color: var(--zinc-400);">Digital text altered; SHA-256 differs from reference.</div>
          </div>
        </button>
        <button class="btn-secondary" style="justify-content: flex-start; text-align: left; padding: 12px;" onclick="window.appLoadScenario('D'); window.appCloseModal();">
          <div>
            <div style="font-weight: 700; color: #fbbf24;">Scenario D: Rapid Transfer Velocity Sequence (Medium Risk, 35 pts)</div>
            <div style="font-size: 11px; color: var(--zinc-400);">3 consecutive transfers across 42 calendar days.</div>
          </div>
        </button>
        <button class="btn-secondary" style="justify-content: flex-start; text-align: left; padding: 12px;" onclick="window.appLoadScenario('E'); window.appCloseModal();">
          <div>
            <div style="font-weight: 700; color: #fbbf24;">Scenario E: Registration vs Mutation Mismatch (Medium Risk, 30 pts)</div>
            <div style="font-size: 11px; color: var(--zinc-400);">Sub-Registry records 20.0 dec vs AC Land records 14.5 dec.</div>
          </div>
        </button>
        <button class="btn-secondary" style="justify-content: flex-start; text-align: left; padding: 12px;" onclick="window.appLoadScenario('F'); window.appCloseModal();">
          <div>
            <div style="font-weight: 700; color: #fbbf24;">Scenario F: Missing Mutation Record (Medium Risk, 30 pts)</div>
            <div style="font-size: 11px; color: var(--zinc-400);">Sub-Registry deed present, but mutation record absent.</div>
          </div>
        </button>
      </div>
    </div>
  `;
}

// Sidebar Collapse / Expand Toggle
function toggleSidebar(forceState) {
  isSidebarCollapsed = typeof forceState === 'boolean' ? forceState : !isSidebarCollapsed;
  
  if (appSidebar) {
    if (isSidebarCollapsed) {
      appSidebar.classList.add('collapsed');
    } else {
      appSidebar.classList.remove('collapsed');
    }
  }

  if (appTopbar) {
    if (isSidebarCollapsed) {
      appTopbar.classList.add('sidebar-collapsed');
    } else {
      appTopbar.classList.remove('sidebar-collapsed');
    }
  }

  if (appMain) {
    if (isSidebarCollapsed) {
      appMain.classList.add('sidebar-collapsed');
    } else {
      appMain.classList.remove('sidebar-collapsed');
    }
  }

  if (collapseToggleIcon) collapseToggleIcon.textContent = isSidebarCollapsed ? '▶' : '◀';
  if (collapseToggleLabel) collapseToggleLabel.textContent = isSidebarCollapsed ? 'Maximize' : 'Minimize Sidebar';

  try {
    localStorage.setItem('jomiguard_sidebar_collapsed', isSidebarCollapsed ? '1' : '0');
  } catch (e) {}
}

// Light / Dark Mode Toggle
function toggleTheme(targetTheme) {
  if (targetTheme) {
    currentTheme = targetTheme;
  } else {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  }

  document.body.setAttribute('data-theme', currentTheme);

  if (themeToggleIcon) {
    themeToggleIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  }
  if (themeToggleLabel) {
    themeToggleLabel.textContent = currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }

  try {
    localStorage.setItem('jomiguard_theme', currentTheme);
  } catch (e) {}
}

// Cinematic Opening Splash Animation
function showSplashAnimation() {
  if (!introSplash) return;
  introSplash.style.display = 'flex';
  introSplash.classList.remove('fade-out');

  // Automatically fade out after 2.4s
  setTimeout(() => {
    dismissSplashAnimation();
  }, 2400);
}

function dismissSplashAnimation() {
  if (!introSplash) return;
  introSplash.classList.add('fade-out');
  setTimeout(() => {
    introSplash.style.display = 'none';
  }, 700);
}

// Global window dispatcher
window.appSwitchTab = switchTab;
window.appToggleTheme = toggleTheme;
window.appToggleSidebar = toggleSidebar;
window.appReplaySplash = showSplashAnimation;

// Event Listeners initialization
function initEvents() {
  // Sidebar navigation click
  if (sidebarNav) {
    sidebarNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.sidebar-btn');
      if (btn) {
        const tab = btn.getAttribute('data-tab');
        if (tab) switchTab(tab);
      }
    });
  }

  // Sidebar minimize / maximize toggle button
  if (btnSidebarCollapse) {
    btnSidebarCollapse.addEventListener('click', () => toggleSidebar());
  }

  // Logo click returns to overview
  const sidebarLogo = document.getElementById('sidebarLogo');
  if (sidebarLogo) {
    sidebarLogo.addEventListener('click', () => switchTab('overview'));
  }

  // Theme toggle button
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => toggleTheme());
  }

  // Splash screen buttons
  if (btnSkipIntro) {
    btnSkipIntro.addEventListener('click', dismissSplashAnimation);
  }
  if (btnReplaySplash) {
    btnReplaySplash.addEventListener('click', showSplashAnimation);
  }

  // Mobile drawer toggle & overlay
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebarMobileCloseBtn = document.getElementById('sidebarMobileCloseBtn');

  function openMobileNav() {
    if (appSidebar) appSidebar.classList.add('mobile-open');
    if (sidebarOverlay) sidebarOverlay.classList.add('active');
  }

  function closeMobileNav() {
    if (appSidebar) appSidebar.classList.remove('mobile-open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      if (appSidebar && appSidebar.classList.contains('mobile-open')) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileNav);
  }

  if (sidebarMobileCloseBtn) {
    sidebarMobileCloseBtn.addEventListener('click', closeMobileNav);
  }

  // Global search input
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (currentTab !== 'parcels' && currentTab !== 'cases') {
        switchTab('parcels');
      } else {
        renderView();
      }
    });
  }

  // Run demo checks button
  if (btnRunChecks) {
    btnRunChecks.addEventListener('click', () => {
      repo.recalculateAllAlerts();
      renderView();
      alert('⚡ Demo checks executed: All synthetic parcels and cross-registry rules re-evaluated deterministically.');
    });
  }

  // Scenarios modal button
  if (btnLoadScenariosModal) {
    btnLoadScenariosModal.addEventListener('click', openScenariosModal);
  }

  // Reset banner button
  if (bannerResetBtn) {
    bannerResetBtn.addEventListener('click', window.appResetSeedData);
  }

  // Bell button opens cases tab
  const bellBtn = document.getElementById('alertsBellBtn');
  if (bellBtn) {
    bellBtn.addEventListener('click', () => switchTab('cases'));
  }

  // Role selector
  if (roleSelector) {
    roleSelector.addEventListener('change', (e) => {
      repo.updateSettings({ currentReviewerRole: e.target.value });
      renderView();
    });
  }

  // Close modal when clicking overlay background
  modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) {
      window.appCloseModal();
    }
  });

  // Load saved theme
  try {
    const savedTheme = localStorage.getItem('jomiguard_theme') || 'dark';
    toggleTheme(savedTheme);

    const savedSidebar = localStorage.getItem('jomiguard_sidebar_collapsed');
    if (savedSidebar === '1') {
      toggleSidebar(true);
    }
  } catch (e) {}
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
  initEvents();
  renderView();
  showSplashAnimation();
});
