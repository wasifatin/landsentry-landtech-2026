/**
 * LandSentry — Application Controller
 * LandTech 2026 Hackathon | Track: Digital Land Records
 * Industrial Enterprise Dark UI Architecture
 */

import { LandRepository, computeSha256 } from './repository/storage.js';
import { getLanguage, setLanguage, t } from './i18n/translations.js';
import { ADMIN_CREDENTIALS, authenticate } from './signin.js';
import { validateUploadedDocument, formatBytes } from './repository/fileValidator.js';
import { parseLandFilePdf } from './repository/pdfIngest.js';

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
let currentUser = null;

try {
  const savedUser = sessionStorage.getItem('landsentry_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
  }
} catch (e) {}

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
const btnLanguageToggle = document.getElementById('btnLanguageToggle');
const currentLangLabel = document.getElementById('currentLangLabel');
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
  attachUnitUploadHandler(currentTab);
}

// Helper: Format Dates
function formatDate(isoStr) {
  if (!isoStr || isoStr === 'N/A') return 'N/A';
  try {
    const d = new Date(isoStr);
    const locale = getLanguage() === 'bn' ? 'bn-BD' : 'en-GB';
    return isNaN(d.getTime()) ? isoStr : d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return isoStr;
  }
}

// Helper: Format Severities
function formatSeverity(sev) {
  if (getLanguage() === 'bn') {
    if (sev === 'HIGH') return 'উচ্চ ঝুঁকি';
    if (sev === 'MEDIUM') return 'মধ্যম ঝুঁকি';
    if (sev === 'LOW') return 'কম ঝুঁকি';
  }
  return sev;
}

// Helper: Format Statuses
function formatStatus(status) {
  if (!status) return '';
  if (getLanguage() === 'bn') {
    switch (status) {
      case 'New': return 'নতুন';
      case 'Under Review': return 'পর্যালোচনাধীন';
      case 'Resolved — No Issue Found':
      case 'Resolved - No Issue Found': return 'নিষ্পন্ন — কোনো ত্রুটি নেই';
      case 'Escalated for Authorized Review': return 'অনুমোদিত পর্যালোচনার জন্য প্রেরিত';
      case 'ACTIVE': return 'সক্রিয়';
      case 'FLAGGED_FOR_REVIEW': return 'পর্যালোচনার জন্য চিহ্নিত';
      case 'MUTATION_PENDING': return 'নামজারি অপেক্ষমাণ';
      case 'REGISTERED': return 'নিবন্ধিত';
      case 'COMPLETED': return 'সম্পন্ন';
      case 'MUTATION_APPROVED': return 'নামজারি অনুমোদিত';
      case 'OBJECTION_FILED': return 'আপত্তি দাখিলকৃত';
      case 'UNDER_INSPECTION': return 'তদন্তাধীন';
      case 'MUTATION_SANCTIONED': return 'নামজারি মঞ্জুরকৃত';
      case 'RECORD_MISSING': return 'রেকর্ড অনুপস্থিত';
      case 'MATCH': return 'হুবহু মিল রয়েছে';
      case 'MISMATCH': return 'অমিল শনাক্ত';
      case 'METADATA_INCONSISTENCY': return 'মেটাডাটা অসঙ্গতি';
      case 'NORMAL_TRANSFER': return 'স্বাভাবিক হস্তান্তর';
      case 'ACTIVE_TRANSFER_1': return 'সক্রিয় হস্তান্তর ১';
      case 'ACTIVE_TRANSFER_2_CONFLICT': return 'দ্বন্দ্বপূর্ণ হস্তান্তর ২';
      case 'DOCUMENT_TAMPER_FLAGGED': return 'পরিবর্তিত দলিল চিহ্নিত';
      case 'TRANSFER_LEG_1': return 'হস্তান্তর ধাপ ১';
      case 'TRANSFER_LEG_2': return 'হস্তান্তর ধাপ ২';
      case 'TRANSFER_LEG_3': return 'হস্তান্তর ধাপ ৩';
      case 'RECONCILIATION_MISMATCH': return 'সমন্বয়ে অমিল';
      case 'MISSING_MUTATION_RECORD': return 'নামজারি রেকর্ড অনুপস্থিত';
      default: return status;
    }
  }
  return status;
}

// Helper: Format Rule Names & Descriptions
const RULE_I18N = {
  'Possible Double-Selling Conflict': {
    bnName: 'সম্ভাব্য দ্বৈত-বিক্রয় সংক্রান্ত বিরোধ',
    bnDesc: 'একই দাগে একাধিক পৃথক ক্রেতার নামে সক্রিয় নিবন্ধিত দলিল শনাক্ত হয়েছে।'
  },
  'Document Cryptographic Integrity Mismatch': {
    bnName: 'দলিলের ক্রিপ্টোগ্রাফিক ইন্টিগ্রিটি অমিল',
    bnDesc: 'দলিলের বর্তমান পর্যবেক্ষণকৃত হ্যাশ সংরক্ষিত রেফারেন্স ফিঙ্গারপ্রিন্টের সাথে মিলছে না।'
  },
  'Rapid Succession Transfer Pattern': {
    bnName: 'দ্রুত হস্তান্তর বেগ ক্রম প্যাটার্ন',
    bnDesc: 'স্বল্প সময়ের ব্যবধানে একই দাগে একাধিক হস্তান্তর নথিভুক্ত হয়েছে।'
  },
  'Mutation Record Absent from Dataset': {
    bnName: 'নামজারি রেকর্ড অনুপস্থিত',
    bnDesc: 'সাব-রেজিস্ট্রি দলিলের বিপরীতে কোনো সংশ্লিষ্ট সহকারী কমিশনার (ভূমি) নামজারি পাওয়া যায়নি।'
  },
  'Registration vs Mutation Field Discrepancy': {
    bnName: 'নিবন্ধন ও নামজারি তথ্যের অমিল',
    bnDesc: 'সাব-রেজিস্ট্রি দলিল ও এসি ল্যান্ড নামজারি তথ্যের মাঝে অসঙ্গতি শনাক্ত হয়েছে।'
  },
  'Inconsistent / Missing Field Metrics': {
    bnName: 'অসামঞ্জস্যপূর্ণ বা অনুপস্থিত পরিমাপ',
    bnDesc: 'জরিপ প্রজন্মে জমির পরিমাণের পার্থক্য বা অসংযুক্ত খতিয়ান রেকর্ড।'
  }
};

function formatRuleName(name) {
  if (getLanguage() === 'bn' && name && RULE_I18N[name]) {
    return RULE_I18N[name].bnName;
  }
  return name || '';
}

function formatRuleDesc(name, desc) {
  if (getLanguage() === 'bn' && name && RULE_I18N[name]) {
    return RULE_I18N[name].bnDesc;
  }
  return desc || '';
}

// Helper: Format Document Titles
function formatDocTitle(title) {
  if (getLanguage() === 'bn' && title) {
    if (title.includes('2025-012')) return 'কৃত্রিম দলিল কপি ২০২৫-০১২ (যাচাইকৃত রেফারেন্স)';
    if (title.includes('2026-045')) return 'কৃত্রিম দলিল কপি ২০২৬-০৪৫ (পরিবর্তিত বিষয়বস্তু টেস্ট)';
    if (title.includes('2026-092')) return 'কৃত্রিম দলিল কপি ২০২৬-০৯২ (মেটাডাটা অসঙ্গতি টেস্ট)';
  }
  return title;
}

// Helper: Format Scenario Tags
function formatScenarioTag(tag) {
  if (getLanguage() === 'bn' && tag) {
    if (tag.includes('Scenario A')) return 'সিনারিও A: ত্রুটিহীন বেসলাইন রেকর্ড';
    if (tag.includes('Scenario B')) return 'সিনারিও B: সম্ভাব্য দ্বৈত-বিক্রয় বিরোধ';
    if (tag.includes('Scenario C')) return 'সিনারিও C: পরিবর্তিত দলিলের হ্যাশ অমিল';
    if (tag.includes('Scenario D')) return 'সিনারিও D: দ্রুত হস্তান্তর বেগ ক্রম';
    if (tag.includes('Scenario E')) return 'সিনারিও E: নিবন্ধন বনাম নামজারি অমিল';
    if (tag.includes('Scenario F')) return 'সিনারিও F: অনুপস্থিত / অসম্পূর্ণ গুরুত্বপূর্ণ রেকর্ড';
  }
  return tag;
}

// Helper: Format Survey Remarks
function formatSurveyRemark(remark) {
  if (getLanguage() === 'bn' && remark) {
    if (remark.includes('Cadastral Survey baseline')) return 'ক্যাডাস্ট্রাল সার্ভে বেসলাইন রেকর্ড';
    if (remark.includes('State Acquisition settlement')) return 'স্টেট অ্যাকুইজিশন রেকর্ড';
    if (remark.includes('Revisional Survey matching parent tract')) return 'রিভিশনাল সার্ভে মূল দাগের সাথে মিল রয়েছে';
    if (remark.includes('City Survey digitized record')) return 'সিটি সার্ভে ডিজিটাইজড রেকর্ড';
    if (remark.includes('Cadastral Survey entry')) return 'ক্যাডাস্ট্রাল সার্ভে ভুক্তি';
    if (remark.includes('Recorded parent title')) return 'মূল মালিকানা রেকর্ড';
    if (remark.includes('Revisional Survey record')) return 'রিভিশনাল সার্ভে রেকর্ড';
    if (remark.includes('Pending reconciliation')) return 'সমন্বয় প্রক্রিয়াধীন';
    if (remark.includes('Original parent dag')) return 'মূল মূল-দাগ';
    if (remark.includes('Settlement record')) return 'সেটেলমেন্ট রেকর্ড';
    if (remark.includes('Revisional survey confirmed')) return 'রিভিশনাল সার্ভে নিশ্চিতকৃত';
    if (remark.includes('BS publication')) return 'বিএস চূড়ান্ত প্রকাশনা';
    if (remark.includes('Agricultural tract')) return 'কৃষি জমি জোত';
    if (remark.includes('Partition record')) return 'বণ্টননামা রেকর্ড';
    if (remark.includes('RS commercial boundary')) return 'আরএস বাণিজ্যিক সীমানা';
    if (remark.includes('BS verification pending')) return 'বিএস যাচাইকরণ প্রক্রিয়াধীন';
    if (remark.includes('Original holding')) return 'মূল জোত স্বত্ব';
    if (remark.includes('SA record')) return 'এসএ রেকর্ড ভুক্তি';
    if (remark.includes('RS holding')) return 'আরএস জোত রেকর্ড';
    if (remark.includes('contested acquisition')) return 'বিএস নোটে ৫.৫ ডেসিমি অধিগ্রহণ বিরোধ';
    if (remark.includes('Riverside embankment')) return 'নদীতীরবর্তী বাঁধ সীমানা';
    if (remark.includes('SA holding')) return 'এসএ জোত রেকর্ড';
    if (remark.includes('RS surveyed dag')) return 'আরএস জরিপকৃত দাগ';
    if (remark.includes('Unverified mutation link')) return 'অযাচাইকৃত নামজারি সূত্র';
  }
  return remark;
}

// ==========================================
// OFFICIAL DOCUMENT INTAKE & VALIDATION CONFIG
// ==========================================
const UNIT_REQUIRED_DOCUMENTS = {
  overview: {
    title: 'Central Intake & Verification Hub',
    titleBn: 'কেন্দ্রীয় দলিল গ্রহণ ও সত্যতা যাচাই হাব',
    docs: [
      'Sub-Registry Registered Deed (Saf-Kabala, Heba, Deed of Partition)',
      'Record-of-Rights / Porcha (CS / SA / RS / City Survey Khatian)',
      'AC Land Mutation Order Sheet & DCR (Duplicate Carbon Receipt)',
      'Non-Encumbrance Certificate (NEC / Form 52 Search)'
    ],
    docsBn: [
      'সাব-রেজিস্ট্রি নিবন্ধিত দলিল (সাফ-কবলা, হেবা, বণ্টননামা)',
      'খতিয়ান / পর্চা (সিএস / এসএ / আরএস / সিটি জরিপ খতিয়ান)',
      'এসি ল্যান্ড নামজারি প্রস্তাব ও ডিসিআর রসিদ',
      'নির্দোষ সনদ / তল্লাশি প্রত্যয়ন (NEC ফর্ম ৫২)'
    ]
  },
  parcels: {
    title: 'Parcel Lineage & Cadastral Survey Verification',
    titleBn: 'দাগের পূর্বসূত্র ও ক্যাডাস্ট্রাল জরিপ যাচাই',
    docs: [
      'Certified Cadastral Mouza Map / Naksha',
      'Record-of-Rights (CS/SA/RS/BS Khatian Extract)',
      'Official Land Demarcation & Field Survey Report'
    ],
    docsBn: [
      'সার্টিফাইড ক্যাডাস্ট্রাল মৌজা নকশা / ম্যাপ',
      'খতিয়ান রেকর্ড (সিএস / এসএ / আরএস / বিএস পর্চা)',
      'সরকারি জমি চিহ্নিতকরণ ও সরেজমিন জরিপ প্রতিবেদন'
    ]
  },
  integrity: {
    title: 'Deed Cryptographic Integrity & Tamper Audit',
    titleBn: 'দলিলের ক্রিপ্টোগ্রাফিক সত্যতা ও পরিবর্তন যাচাই',
    docs: [
      'Original Registered Deed (Certified Volume / Balam Extract)',
      'Scanned Deed Copy for Byte & SHA-256 Hash Matching',
      'Certified True Copy (Nakol) with Seal'
    ],
    docsBn: [
      'মূল নিবন্ধিত দলিলের বালাম কপি / সার্টিফাইড ভলিউম এক্সট্র্যাক্ট',
      'হ্যাশ ও বাইট মেলানোর জন্য স্ক্যানকৃত দলিল',
      'সিলমোহরযুক্ত নকল / সার্টিফাইড ট্রু কপি'
    ]
  },
  'double-selling': {
    title: 'Chain of Title & Parallel Conveyance Verification',
    titleBn: 'মালিকানা ধারাবাহিকতা ও সমান্তরাল হস্তান্তর যাচাই',
    docs: [
      'Consecutive Chain of Title Deeds (Baya Dalil)',
      'Non-Encumbrance Certificate (NEC Form 52) from Sub-Registry',
      'Seller Prior Ownership Title & Mutation Proof'
    ],
    docsBn: [
      'ধারাবাহিক বায়া দলিলসমূহের মূল কপি',
      'সাব-রেজিস্ট্রি হতে নির্দোষ সনদ (NEC ফর্ম ৫২)',
      'বিক্রেতার পূর্ববর্তী স্বত্ব ও নামজারি প্রমাণ'
    ]
  },
  'rapid-transfers': {
    title: 'Succession Velocity & Rapid Transfer Audit',
    titleBn: 'উত্তরাধিকার বেগ ও দ্রুত হস্তান্তর অডিট',
    docs: [
      'Immediate Prior Sales Deed (Transferred within Velocity Window)',
      'Registered Irrevocable Power of Attorney (Am-Moktarnama)',
      'Legal Heirship Certificate (Warisan Sanad) & Identity Dossier'
    ],
    docsBn: [
      'নিকটবর্তী পূর্ব হস্তান্তর দলিল (বেগ সময়সীমার অন্তর্ভুক্ত)',
      'রেজিস্ট্রিকৃত অপ্রত্যাহারযোগ্য আমমোক্তারনামা',
      'আইনি ওয়ারিশান সনদ ও জাতীয় পরিচয়পত্র ডসিয়ার'
    ]
  },
  reconciliation: {
    title: 'Dual-Registry Cross-Reconciliation Dossier',
    titleBn: 'দ্বৈত-রেজিস্ট্রি ক্রস-সমন্বয় ডসিয়ার',
    docs: [
      'Sub-Registry Registration Memo / Index-II Entry',
      'Upazila AC Land Mutation Proposal & Dakhila (Rent Receipt)',
      'Khatian Settlement & Revenue Clearance Record'
    ],
    docsBn: [
      'সাব-রেজিস্ট্রি নিবন্ধন মেমো / ইনডেক্স-২ এন্ট্রি',
      'উপজেলা এসি ল্যান্ড নামজারি প্রস্তাব ও দাখিলা (খাজনা রসিদ)',
      'খতিয়ান বন্দোবস্ত ও রাজস্ব ছাড়পত্র রেকর্ড'
    ]
  },
  cases: {
    title: 'Formal Investigation Dossier & Physical Hearing Intake',
    titleBn: 'আনুষ্ঠানিক তদন্ত ডসিয়ার ও সরাসরি শুনানি নথি',
    docs: [
      'Field Investigation Report by Kanungo / Union Land Assistant',
      'Hearing Summons Notice & Citizen Rejoinder Statement',
      'Statutory Recommendation Memo to AC Land / Sub-Registrar'
    ],
    docsBn: [
      'কানুনগো / ইউনিয়ন ভূমি কর্মকর্তার সরেজমিন তদন্ত প্রতিবেদন',
      'শুনানি নোটিশ ও নাগরিক জবাব / আপত্তি পত্র',
      'এসি ল্যান্ড / সাব-রেজিস্ট্রারের নিকট সংবিধিবদ্ধ সুপারিশ মেমো'
    ]
  },
  methodology: {
    title: 'Regulatory Policy & Statutory Benchmark Filing',
    titleBn: 'নিয়ন্ত্রক নীতি ও সংবিধিবদ্ধ মানদণ্ড নথিভুক্তকরণ',
    docs: [
      'Ministry of Land Gazette Notification & Policy Circular',
      'Statutory Risk Threshold Schedule & Compliance Charter'
    ],
    docsBn: [
      'ভূমি মন্ত্রণালয়ের গেজেট প্রজ্ঞাপন ও পরিপত্র',
      'সংবিধিবদ্ধ ঝুঁকি থ্রেশহোল্ড তফসিল ও সম্মতি সনদ'
    ]
  }
};

function renderUnitDocUploadSection(unitId) {
  const conf = UNIT_REQUIRED_DOCUMENTS[unitId] || UNIT_REQUIRED_DOCUMENTS.overview;
  const lang = getLanguage();
  const docsList = lang === 'bn' ? conf.docsBn : conf.docs;
  const unitTitle = lang === 'bn' ? conf.titleBn : conf.title;
  const uploadedDocs = repo.getUploadedDocs(unitId);

  return `
    <div class="unit-doc-upload-box" id="uploadBox_${unitId}">
      <div class="doc-upload-notice">
        <div class="doc-upload-notice-header">
          <div class="doc-upload-notice-title">
            <span style="font-size: 16px;">🛡️</span>
            <span>${unitTitle} — ${lang === 'bn' ? 'অফিসিয়াল দলিল গ্রহণ ও যাচাই' : 'Official Document Verification'}</span>
          </div>
          <span class="doc-upload-badge">${lang === 'bn' ? 'ক্রিপ্টোগ্রাফিক বাইট সিগনেচার সক্রিয়' : 'CRYPTOGRAPHIC SIGNATURE CHECK ACTIVE'}</span>
        </div>

        <div style="font-size: 12px; color: var(--zinc-300); margin: 6px 0; font-weight: 600;">
          ${lang === 'bn' ? '📋 এই ইউনিটের জন্য আবশ্যকীয় নথিসমূহ:' : '📋 Required Documents for this Unit:'}
        </div>
        <ul class="doc-upload-req-list">
          ${docsList.map(doc => `<li>${doc}</li>`).join('')}
        </ul>

        <div class="doc-upload-meta-chips">
          <span>📎 <strong>${lang === 'bn' ? 'অনুমোদিত ফরম্যাট:' : 'Accepted Formats:'}</strong> PDF (.pdf), Microsoft Word (.doc, .docx)</span>
          <span>⚖️ <strong>${lang === 'bn' ? 'সর্বোচ্চ সাইজ:' : 'Max Size Limit:'}</strong> 15 MB</span>
          <span>🔒 <strong>${lang === 'bn' ? 'নিরাপত্তা বিধি:' : 'Security Policy:'}</strong> ${lang === 'bn' ? 'ম্যাজিক বাইট যাচাই সক্রিয়; নাম পরিবর্তিত বা জাল ফাইল সরাসরি "not legitimate" হিসেবে বাতিল হবে।' : 'Magic byte analysis enforced. Renamed, corrupted, or spoofed files rejected as not legitimate.'}</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 16px; margin-bottom: 12px;" class="doc-upload-controls-grid">
        <div>
          <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px; display: block;">
            ${lang === 'bn' ? 'দলিলের শ্রেণি নির্বাচন করুন' : 'Select Document Category'}
          </label>
          <select id="docCategory_${unitId}" class="login-input" style="padding: 10px 12px; font-size: 13px;">
            ${docsList.map(doc => `<option value="${doc}">${doc}</option>`).join('')}
          </select>
        </div>

        <div>
          <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px; display: block;">
            ${lang === 'bn' ? 'ফাইল নির্বাচন করুন (.pdf, .doc, .docx)' : 'Upload Document File (.pdf, .doc, .docx)'}
          </label>
          <input type="file" id="fileInput_${unitId}" accept=".pdf,.doc,.docx" class="login-input" style="padding: 8px 12px; font-size: 12px; cursor: pointer;">
        </div>
      </div>

      <div id="uploadFeedback_${unitId}"></div>

      ${uploadedDocs.length > 0 ? `
        <div style="margin-top: 18px; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em;">
                ${lang === 'bn' ? 'যাচাইকৃত সংরক্ষিত দলিলসমূহ' : 'Verified & Legitimate Documents in this Unit'} (${uploadedDocs.length})
              </div>
              <span class="badge badge-low" style="font-size: 10px;">LEGITIMATE & VERIFIED</span>
            </div>
            <button type="button" class="btn-clear-docs" onclick="window.appClearUploadedDocs('${unitId}')" title="${lang === 'bn' ? 'সব আপলোড করা নথি মুছে ফেলুন' : 'Clear all uploaded documents in this unit'}">
              🗑️ ${lang === 'bn' ? 'সব নথি মুছুন' : 'Clear All'}
            </button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${uploadedDocs.map(d => `
              <div class="doc-verified-item">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                  <span style="font-size: 22px;">${d.extension === '.pdf' ? '📄' : '📝'}</span>
                  <div style="min-width: 0;">
                    <div style="font-weight: 700; color: #fff; font-size: 13px; word-break: break-all;">${d.name}</div>
                    <div style="font-size: 11px; color: var(--gold-primary); font-weight: 600;">${d.category}</div>
                    <div class="doc-hash-pill">SHA-256: ${d.sha256}</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; margin-left: 12px;">
                  <div style="text-align: right;">
                    <span class="badge badge-low" style="font-size: 10px;">${d.status}</span>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${d.sizeFormatted} • ${new Date(d.verifiedAt).toLocaleTimeString()}</div>
                  </div>
                  <button type="button" class="btn-remove-doc" onclick="window.appRemoveUploadedDoc('${d.sha256}')" title="${lang === 'bn' ? 'এই নথিটি মুছে ফেলুন' : 'Remove this document'}">
                    🗑️ ${lang === 'bn' ? 'মুছুন' : 'Remove'}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function attachUnitUploadHandler(unitId) {
  const fileInput = document.getElementById(`fileInput_${unitId}`);
  const catSelect = document.getElementById(`docCategory_${unitId}`);
  const feedbackDiv = document.getElementById(`uploadFeedback_${unitId}`);
  if (!fileInput) return;

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const category = catSelect ? catSelect.value : 'General Land Document';
    if (feedbackDiv) {
      feedbackDiv.innerHTML = `
        <div style="padding: 10px; font-size: 12px; color: var(--gold-primary); display: flex; align-items: center; gap: 8px;">
          <span class="status-pulse-dot pulse-gold"></span>
          <span>Analyzing binary magic bytes, verifying MIME signature, and calculating SHA-256 digest...</span>
        </div>
      `;
    }

    const result = await validateUploadedDocument(file, category);

    if (!result.isValid) {
      if (feedbackDiv) {
        feedbackDiv.innerHTML = `
          <div class="doc-upload-error-banner">
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; margin-bottom: 4px;">
              <span>❌</span>
              <span>Upload Rejected: File is Not Legitimate</span>
            </div>
            <div>${result.error}</div>
          </div>
        `;
      }
      fileInput.value = '';
      return;
    }

    const doc = {
      ...result.document,
      unitId: unitId,
      uploadedByRole: currentUser ? currentUser.role : repo.getSettings().currentReviewerRole,
    };

    // PDF → try to auto-detect a full land file and load it into the system
    if (doc.extension === '.pdf') {
      const outcome = await autoImportPdf(file, result.document);
      if (outcome && outcome.ok) {
        if (feedbackDiv) feedbackDiv.innerHTML = renderImportResultCard(outcome, true);
        fileInput.value = '';
        updateBadge();
        return; // import already archived the file; keep the summary visible
      }
    }

    repo.addUploadedDoc(doc);

    if (feedbackDiv) {
      feedbackDiv.innerHTML = `
        <div class="doc-upload-success-banner">
          <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; margin-bottom: 4px;">
            <span>✅</span>
            <span>Document Verified & Legitimate — Successfully Uploaded</span>
          </div>
          <div><strong>File:</strong> ${doc.name} (${doc.sizeFormatted}) — Verified Signature: <em>${doc.detectedType}</em></div>
          <div><strong>Category:</strong> ${doc.category}</div>
          <div><strong>SHA-256 Digest:</strong> <span class="doc-hash-pill">${doc.sha256}</span></div>
          <div style="font-size: 11px; color: var(--emerald-accent); margin-top: 4px;">Verified and sealed into audit trail at ${new Date(doc.verifiedAt).toLocaleTimeString()}</div>
        </div>
      `;
    }

    setTimeout(() => {
      renderView();
    }, 1200);
  });
}

// ==========================================
// 1. OVERVIEW DASHBOARD
// ==========================================
function renderOverviewDashboard() {
  pageTitle.textContent = t('mainTitle', 'Land Fraud & Double-Selling Detection System');
  pageSubtitle.textContent = t('mainSubtitle', 'Multi-registry reconciliation, document cryptographic fingerprinting, and rapid transfer velocity analysis');

  const parcels = repo.getParcels();
  const deeds = repo.getDeeds();
  const alerts = repo.getAlerts();
  const highRisk = alerts.filter(a => a.score >= 60);
  const auditLogs = repo.getAuditLogs().slice(0, 6);

  tabContainer.innerHTML = `
    <!-- BENTO ENTITY GRID -->
    <div class="bento-grid">
      <!-- Card 1: Parcels -->
      <div class="glass-panel" style="padding: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div class="icon-box" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">🗺️</div>
          <span class="font-mono" style="font-size: 11px; color: var(--zinc-400); font-weight: 700;">${t('kpiParcelsTitle')}</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #fff;">${parcels.length} ${t('indexed')}</div>
        <div style="font-size: 12px; color: var(--zinc-400); margin: 4px 0 14px 0;">${t('kpiParcelsSub')}</div>
        <div class="tech-progress-container">
          <div class="tech-progress-fill fill-emerald" style="width: 100%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 11px;">
          <span style="color: var(--zinc-500);">${t('demoMouzas')}</span>
          <button class="nav-btn" onclick="window.appSwitchTab('parcels')" title="${t('btnExplorePlots')}">
            <span>🗺️</span>
            <span>${t('btnExplorePlots')}</span>
          </button>
        </div>
      </div>

      <!-- Card 2: Deeds -->
      <div class="glass-panel" style="padding: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div class="icon-box" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;">📜</div>
          <span class="font-mono" style="font-size: 11px; color: var(--zinc-400); font-weight: 700;">${t('kpiDeedsTitle')}</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #fff;">${deeds.length} ${t('registered')}</div>
        <div style="font-size: 12px; color: var(--zinc-400); margin: 4px 0 14px 0;">${t('kpiDeedsSub')}</div>
        <div class="tech-progress-container">
          <div class="tech-progress-fill fill-blue" style="width: 85%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 11px;">
          <span style="color: var(--zinc-500);">${t('syntheticPercent')}</span>
          <button class="nav-btn" onclick="window.appSwitchTab('reconciliation')" title="${t('btnReconciliation')}">
            <span>🔄</span>
            <span>${t('btnReconciliation')}</span>
          </button>
        </div>
      </div>

      <!-- Card 3: Open Alerts -->
      <div class="glass-panel" style="padding: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div class="icon-box" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">⚠️</div>
          <span class="font-mono" style="font-size: 11px; color: var(--zinc-400); font-weight: 700;">${t('kpiAlertsTitle')}</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #fff;">${alerts.length} ${t('flaggedForReview')}</div>
        <div style="font-size: 12px; color: var(--zinc-400); margin: 4px 0 14px 0;">${t('kpiAlertsSub')}</div>
        <div class="tech-progress-container">
          <div class="tech-progress-fill fill-gold" style="width: 75%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 11px;">
          <span style="color: var(--zinc-500);">${t('ruleBasedTriage')}</span>
          <button class="nav-btn" onclick="window.appSwitchTab('cases')" title="${t('btnViewCases')}">
            <span>📋</span>
            <span>${t('btnViewCases')}</span>
          </button>
        </div>
      </div>

      <!-- Card 4: High Severity -->
      <div class="glass-panel" style="padding: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div class="icon-box" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">🚨</div>
          <span class="font-mono" style="font-size: 11px; color: var(--zinc-400); font-weight: 700;">${t('kpiHighRiskTitle')}</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #f87171;">${highRisk.length} ${t('highRisk')}</div>
        <div style="font-size: 12px; color: var(--zinc-400); margin: 4px 0 14px 0;">${t('kpiHighRiskSub')}</div>
        <div class="tech-progress-container">
          <div class="tech-progress-fill fill-red" style="width: ${Math.min(100, highRisk.length * 35)}%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 11px;">
          <span style="color: var(--zinc-500);">${t('scoreThreshold')}</span>
          <button class="nav-btn" onclick="window.appOpenHighRisk()" title="${t('btnPrioritize')}">
            <span>🚨</span>
            <span>${t('btnPrioritize')}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- UNIT DOCUMENT INTAKE & VALIDATION (FULL WIDTH OUTSIDE BENTO GRID) -->
    ${renderUnitDocUploadSection('overview')}

    <!-- MANAGEMENT WORKSPACE -->
    <div class="workspace-split">
      <!-- Left Column: Recent Alerts Table -->
      <div class="glass-panel-static" style="padding: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 700; color: #fff;">${t('priorityTriageTitle')}</h2>
            <p style="font-size: 12px; color: var(--zinc-400);">${t('priorityTriageDesc')}</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="nav-btn" onclick="window.appSwitchTab('cases')">
              <span>📋</span>
              <span>${t('btnViewCases')}</span>
            </button>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th>${t('alertId')}</th>
                <th>${t('parcelKey')}</th>
                <th>${t('primaryRuleFired')}</th>
                <th>${t('triageScore')}</th>
                <th>${t('severity')}</th>
                <th>${t('status')}</th>
                <th>${t('action')}</th>
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
                    <div style="font-weight: 600; color: #fff;">${formatRuleName(a.rulesTriggered[0]?.name) || t('discrepancySignal')}</div>
                    <div style="font-size: 11px; color: var(--zinc-500);">${a.rulesTriggered.length > 1 ? `+${a.rulesTriggered.length - 1} ${t('additionalRules')}` : t('singleFactor')}</div>
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
                      ${formatSeverity(a.severity)}
                    </span>
                  </td>
                  <td>
                    <span style="font-size: 12px; color: var(--zinc-300);">${formatStatus(a.status)}</span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px; align-items: center;">
                      <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.appOpenCaseModal('${a.id}')">
                        ${t('reviewCase')}
                      </button>
                      <button class="btn-remove-doc" style="padding: 4px 8px; font-size: 11px;" onclick="window.appRemoveParcelRecord('${a.parcelId || a.syntheticParcelKey}')" title="${getLanguage() === 'bn' ? 'রেকর্ড মুছুন' : 'Delete Record'}">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 16px; padding: 12px; background: rgba(24, 24, 27, 0.4); border-radius: 8px; border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--zinc-400);">
          <div>
            <span>💡 <strong>${t('triageTransparency')}</strong> ${t('triageTransparencyDesc')}</span>
          </div>
          <button class="btn-secondary" style="font-size: 11px;" onclick="window.appRunRecheck()">${t('reEvaluateRules')}</button>
        </div>
      </div>

      <!-- Right Column: Stacked Widgets (Policy & Audit) -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <!-- Widget 1: Policy Toggles -->
        <div class="glass-panel-static" style="padding: 20px;">
          <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zinc-400); margin-bottom: 14px;">
            ${t('activeDetectionPolicies')}
          </h3>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #fff;">${t('doubleSellingRule')}</div>
                <div style="font-size: 11px; color: var(--zinc-500);">${t('doubleSellingRuleDesc')}</div>
              </div>
              <div class="policy-toggle active" title="${t('active')}">
                <div class="policy-knob"></div>
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #fff;">${t('webCryptoSha256')}</div>
                <div style="font-size: 11px; color: var(--zinc-500);">${t('webCryptoSha256Desc')}</div>
              </div>
              <div class="policy-toggle active" title="${t('active')}">
                <div class="policy-knob"></div>
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #fff;">${t('regVsMutationCrossCheck')}</div>
                <div style="font-size: 11px; color: var(--zinc-500);">${t('regVsMutationCrossCheckDesc')}</div>
              </div>
              <div class="policy-toggle active" title="${t('active')}">
                <div class="policy-knob"></div>
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #fff;">${t('rapidTransferVelocity')}</div>
                <div style="font-size: 11px; color: var(--zinc-500);">${t('rapidTransferVelocityDesc')}</div>
              </div>
              <div class="policy-toggle active" title="${t('active')}">
                <div class="policy-knob"></div>
              </div>
            </div>
          </div>
          <div style="margin-top: 14px; border-top: 1px solid var(--border-subtle); padding-top: 12px; text-align: right;">
            <button class="nav-btn" onclick="window.appSwitchTab('methodology')">
              <span>⚙️</span>
              <span>${t('btnConfigureWeights')}</span>
            </button>
          </div>
        </div>

        <!-- Widget 2: Audit Trail Timeline -->
        <div class="glass-panel-static" style="padding: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zinc-400);">
                ${t('auditTrailTitle')}
              </h3>
              <span class="badge badge-gold" style="font-size: 9px;">${t('immutableSim')}</span>
            </div>
            <button class="btn-clear-docs" onclick="window.appClearHistory()" title="Clear Audit History Logs">
              🗑️ ${getLanguage() === 'bn' ? 'ইতিহাস মুছুন' : 'Clear History'}
            </button>
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
  pageTitle.textContent = t('parcelExplorerTitle');
  pageSubtitle.textContent = t('parcelExplorerSubtitle');

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

  if (parcels.length === 0) {
    tabContainer.innerHTML = `
      ${renderUnitDocUploadSection('parcels')}
      <div class="glass-panel-static" style="padding: 40px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
        <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 8px;">
          ${getLanguage() === 'bn' ? 'কোনো জমির রেকর্ড ভুক্তি নেই' : 'No Land Records Found'}
        </h3>
        <p style="font-size: 13px; color: var(--zinc-400); max-width: 500px; margin: 0 auto 20px auto;">
          ${getLanguage() === 'bn' ? 'জমির নতুন রেকর্ড ও দলিল আপলোড করতে উপরের "➕ জমির রেকর্ড ইনপুট" বোতামে ক্লিক করুন।' : 'No land records currently registered. Use the "➕ Input Land Record" button to manually add plots, deeds, and official documents.'}
        </p>
        <button class="btn-gold" onclick="window.appOpenManualIntake()">${getLanguage() === 'bn' ? '➕ জমির রেকর্ড ইনপুট করুন' : '➕ Input Land Record'}</button>
      </div>
    `;
    return;
  }

  tabContainer.innerHTML = `
    ${renderUnitDocUploadSection('parcels')}

    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 13px; color: var(--zinc-400);">${t('showingOf')} <strong>${filtered.length}</strong> ${t('ofParcels')} ${parcels.length} ${t('demoParcels')}</span>
        ${searchQuery ? `<span class="badge badge-gold">${t('filter')}: "${searchQuery}" <button onclick="window.appClearSearch()" style="background:none;border:none;color:#000;cursor:pointer;margin-left:4px;">✕</button></span>` : ''}
      </div>
      <div style="font-size: 12px; color: var(--zinc-500);">
        🛡️ ${t('aliasesOnly')}
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
                <h3 style="font-size: 18px; font-weight: 700; color: #fff; margin-top: 2px;">${t('plotDagNo')} ${p.plotDagNo}</h3>
                <div style="font-size: 12px; color: var(--zinc-400);">${p.demoMouza}</div>
              </div>
              <span class="badge ${score >= 60 ? 'badge-high' : score >= 30 ? 'badge-medium' : 'badge-low'}">
                ${score > 0 ? `${t('riskLabel')} ${score}/100` : t('cleanRecord')}
              </span>
            </div>

            <!-- Survey Generation Badges -->
            <div style="background: rgba(24, 24, 27, 0.6); padding: 10px; border-radius: 8px; margin-bottom: 14px; border: 1px solid var(--border-subtle);">
              <div style="font-size: 11px; text-transform: uppercase; color: var(--zinc-500); font-weight: 700; margin-bottom: 6px;">
                ${t('surveyGenerations')}
              </div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center; font-size: 11px;">
                ${p.surveyGenerations.map(s => `
                  <div style="background: var(--surface-1); padding: 4px; border-radius: 4px; border: 1px solid var(--border-subtle);">
                    <div style="font-weight: 700; color: var(--gold-primary);">${s.surveyType}</div>
                    <div class="font-mono" style="font-size: 10px; color: #fff;">${t('dag')} ${s.dagNo}</div>
                    <div style="font-size: 9px; color: var(--zinc-400);">${s.recordedAreaDecimal} ${t('dec')}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Property Attributes -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; margin-bottom: 14px;">
              <div>
                <span style="color: var(--zinc-500);">${t('declaredArea')}</span>
                <span style="font-weight: 600; color: #fff; margin-left: 4px;">${p.declaredArea} ${p.areaUnit}</span>
              </div>
              <div>
                <span style="color: var(--zinc-500);">${t('primaryKhatian')}</span>
                <span class="font-mono" style="color: #60a5fa; margin-left: 4px;">${p.primaryKhatianRef}</span>
              </div>
              <div>
                <span style="color: var(--zinc-500);">${t('currentOwner')}</span>
                <span class="font-mono" style="color: var(--gold-primary); margin-left: 4px;">${p.currentOwnerAlias}</span>
              </div>
              <div>
                <span style="color: var(--zinc-500);">${t('associatedDeeds')}</span>
                <span style="font-weight: 600; color: #fff; margin-left: 4px;">${parcelDeeds.length} ${t('registeredCount')}</span>
              </div>
            </div>



            <!-- Action buttons -->
            <div style="display: flex; gap: 8px; border-top: 1px solid var(--border-subtle); padding-top: 14px; flex-wrap: wrap;">
              <button class="btn-gold" style="flex: 1; justify-content: center;" onclick="window.appOpenParcel('${p.id}')">
                ${t('inspectLineageDeeds')}
              </button>
              ${parcelAlert ? `
                <button class="btn-secondary" style="padding: 6px 12px;" onclick="window.appOpenCaseModal('${parcelAlert.id}')">
                  ${t('viewAlert')}
                </button>
              ` : ''}
              <button class="btn-remove-record" style="padding: 6px 12px;" onclick="window.appRemoveParcelRecord('${p.id}')" title="${getLanguage() === 'bn' ? 'রেকর্ডটি মুছে ফেলুন' : 'Delete this record'}">
                🗑️ ${getLanguage() === 'bn' ? 'মুছুন' : 'Delete'}
              </button>
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
            ${t('plot')} / ${t('dag')} ${parcel.plotDagNo} • ${parcel.demoMouza}
          </h2>
          <div style="font-size: 13px; color: var(--zinc-400);">${parcel.demoDistrict}</div>
        </div>
        <button onclick="window.appCloseModal()" style="background: none; border: none; color: var(--zinc-400); font-size: 20px; cursor: pointer;">✕</button>
      </div>

      <!-- Survey Generations Reconciliation Panel -->
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zinc-400); margin-bottom: 8px;">
          ${t('cadastralSurveyLineage')}
        </h4>
        <div style="overflow-x: auto;">
          <table class="enterprise-table" style="font-size: 12px;">
            <thead>
              <tr>
                <th>${t('surveyEra')}</th>
                <th>${t('surveyYear')}</th>
                <th>${t('plotDagNoHeader')}</th>
                <th>${t('khatianReference')}</th>
                <th>${t('recordedArea')}</th>
                <th>${t('surveyRemarks')}</th>
              </tr>
            </thead>
            <tbody>
              ${parcel.surveyGenerations.map(s => `
                <tr>
                  <td style="font-weight: 700; color: var(--gold-primary);">${s.surveyType} ${t('survey')}</td>
                  <td class="font-mono">${s.surveyYear}</td>
                  <td class="font-mono">${t('dag')} ${s.dagNo}</td>
                  <td class="font-mono">${s.khatianNo}</td>
                  <td style="font-weight: 600;">${s.recordedAreaDecimal} ${t('decimals')}</td>
                  <td style="color: var(--zinc-400);">${formatSurveyRemark(s.remarks)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="font-size: 11px; color: var(--zinc-500); margin-top: 6px;">
          ℹ️ ${t('surveyNotice')}
        </div>
      </div>

      <!-- Associated Registered Deeds -->
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zinc-400); margin-bottom: 8px;">
          ${t('associatedSubRegistryDeeds')} (${deeds.length})
        </h4>
        <table class="enterprise-table" style="font-size: 12px;">
          <thead>
            <tr>
              <th>${t('deedNo')}</th>
              <th>${t('sellerAlias')}</th>
              <th>${t('buyerAlias')}</th>
              <th>${t('date')}</th>
              <th>${t('area')}</th>
              <th>${t('registryOffice')}</th>
              <th>${t('status')}</th>
              <th>${t('action')}</th>
            </tr>
          </thead>
          <tbody>
            ${deeds.map(d => `
              <tr>
                <td class="font-mono" style="color: #60a5fa;">${d.deedNo}</td>
                <td class="font-mono" style="color: var(--zinc-400);">${d.sellerAlias}</td>
                <td class="font-mono" style="color: var(--gold-primary); font-weight: 600;">${d.buyerAlias}</td>
                <td class="font-mono">${formatDate(d.deedDate)}</td>
                <td>${d.declaredArea} ${t('dec')}</td>
                <td style="font-size: 11px; color: var(--zinc-400);">${d.sourceRegistryOffice}</td>
                <td><span class="badge ${d.saleStatus === 'REGISTERED' ? 'badge-low' : 'badge-high'}">${formatStatus(d.saleStatus)}</span></td>
                <td>
                  <button class="btn-remove-doc" style="padding: 2px 6px; font-size: 11px;" onclick="window.appRemoveDeed('${d.id || d.deedNo}')" title="${getLanguage() === 'bn' ? 'দলিল মুছুন' : 'Delete Deed'}">
                    🗑️
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Registration vs Mutation Status -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="font-size: 12px; font-weight: 700; color: #60a5fa; margin-bottom: 6px;">${t('subRegistryRecord')}</div>
          ${registrations.length > 0 ? `
            <div style="font-size: 12px; color: #fff;">${t('deed')} <span class="font-mono">${registrations[0].deedRef}</span></div>
            <div style="font-size: 12px; color: var(--zinc-400);">${t('buyer')} <span class="font-mono">${registrations[0].buyerAlias}</span></div>
            <div style="font-size: 12px; color: var(--zinc-400);">${t('areaLabel')} ${registrations[0].area} ${registrations[0].areaUnit}</div>
            <div style="font-size: 11px; color: #34d399; margin-top: 4px;">${t('statusLabel')} ${formatStatus(registrations[0].registrationStatus)}</div>
          ` : `<div style="color: var(--zinc-500); font-size: 12px;">${t('noRegFile')}</div>`}
        </div>

        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="font-size: 12px; font-weight: 700; color: var(--gold-primary); margin-bottom: 6px;">${t('acLandMutationRecord')}</div>
          ${mutations.length > 0 && mutations[0].isRecordPresent ? `
            <div style="font-size: 12px; color: #fff;">${t('deedRef')} <span class="font-mono">${mutations[0].deedRef}</span></div>
            <div style="font-size: 12px; color: var(--zinc-400);">${t('buyer')} <span class="font-mono">${mutations[0].buyerAlias}</span></div>
            <div style="font-size: 12px; color: var(--zinc-400);">${t('areaLabel')} ${mutations[0].area} ${mutations[0].areaUnit}</div>
            <div style="font-size: 11px; color: ${mutations[0].mutationStatus === 'OBJECTION_FILED' ? '#f87171' : '#34d399'}; margin-top: 4px;">${t('statusLabel')} ${formatStatus(mutations[0].mutationStatus)}</div>
          ` : `
            <div style="color: #f87171; font-size: 12px; font-weight: 600;">${t('mutationRecordAbsent')}</div>
            <div style="font-size: 11px; color: var(--zinc-500); margin-top: 4px;">${t('mutationRecordAbsentDesc')}</div>
          `}
        </div>
      </div>

      <!-- Modal Footer -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 16px; flex-wrap: wrap; gap: 10px;">
        <div style="font-size: 12px; color: var(--zinc-400);">
          ${alert ? `${t('activeCase')} <strong style="color: var(--gold-primary);">${alert.id}</strong> (${t('score')} ${alert.score}/100)` : t('noActiveAlerts')}
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn-remove-record" onclick="window.appRemoveParcelRecord('${parcel.id}')">
            🗑️ ${getLanguage() === 'bn' ? 'রেকর্ডটি মুছুন' : 'Delete Record'}
          </button>
          ${alert ? `
            <button class="btn-gold" onclick="window.appOpenCaseModal('${alert.id}')">${t('openCaseDetail')}</button>
          ` : ''}
          <button class="btn-secondary" onclick="window.appCloseModal()">${t('close')}</button>
        </div>
      </div>
    </div>
  `;
};

// ==========================================
// 3. DOCUMENT INTEGRITY CHECK
// ==========================================
function renderDocumentIntegrity() {
  pageTitle.textContent = t('docIntegrityTitle');
  pageSubtitle.textContent = t('docIntegritySubtitle');

  const fingerprints = repo.getFingerprints();
  if (fingerprints.length === 0) {
    tabContainer.innerHTML = `
      ${renderUnitDocUploadSection('integrity')}
      <div class="glass-panel-static" style="padding: 40px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
        <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 8px;">
          ${getLanguage() === 'bn' ? 'কোনো দলিলের ফিঙ্গারপ্রিন্ট নেই' : 'No Document Fingerprints Yet'}
        </h3>
        <p style="font-size: 13px; color: var(--zinc-400); max-width: 500px; margin: 0 auto;">
          ${getLanguage() === 'bn' ? 'দলিল যাচাইয়ের জন্য প্রথমে জমির রেকর্ড ও দলিল ইনপুট করুন।' : 'Input land records with documents to see integrity verification. Use the "➕ Input Land Record" button above.'}
        </p>
      </div>
    `;
    return;
  }
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
            <div style="font-weight: 700; color: #fff; font-size: 13px;">${formatDocTitle(doc.documentTitle)}</div>
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
            <h3 style="font-size: 18px; font-weight: 700; color: #fff;">${formatDocTitle(currentDoc.documentTitle)}</h3>
            <div style="font-size: 12px; color: var(--zinc-400);">${t('simulatedDeedArchive')}</div>
          </div>
          <span class="badge ${isMatch ? 'badge-low' : 'badge-high'}" style="font-size: 12px; padding: 6px 12px;">
            <span class="status-pulse-dot ${isMatch ? 'pulse-emerald' : 'pulse-red'}"></span>
            ${isMatch ? t('integrityVerified') : t('integrityMismatchDetected')}
          </span>
        </div>

        <!-- Fingerprint comparison blocks -->
        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
          <!-- Reference Hash -->
          <div style="background: rgba(24, 24, 27, 0.7); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--zinc-400);">
                ${t('authorizedRefSha256')}
              </span>
              <span class="badge badge-low" style="font-size: 9px;">${t('authorizedAnchor')}</span>
            </div>
            <div class="font-mono" style="font-size: 12px; color: #34d399; word-break: break-all; background: #000; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-subtle);">
              ${currentDoc.referenceSha256}
            </div>
          </div>

          <!-- Observed Hash -->
          <div style="background: rgba(24, 24, 27, 0.7); padding: 14px; border-radius: 8px; border: 1px solid ${isMatch ? 'var(--border-subtle)' : 'rgba(239, 68, 68, 0.4)'};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--zinc-400);">
                ${t('observedLiveSha256')}
              </span>
              <span class="badge ${isMatch ? 'badge-low' : 'badge-high'}" style="font-size: 9px;">
                ${isMatch ? t('exactMatch') : t('hashDivergence')}
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
              ${t('syntheticDocContent')}
            </label>
            <span class="font-mono" style="font-size: 10px; color: var(--zinc-500);">${currentDoc.syntheticContent.length} ${t('bytes')}</span>
          </div>
          <textarea id="syntheticDocText" class="font-mono" rows="4" style="width: 100%; background: #000; border: 1px solid var(--border-subtle); color: #e4e4e7; border-radius: 8px; padding: 12px; font-size: 12px; outline: none; resize: vertical;">${currentDoc.syntheticContent}</textarea>
        </div>

        <!-- Action Controls -->
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn-gold" onclick="window.appRecalculateLiveHash()">
            ${t('recalculateSha256')}
          </button>
          <button class="btn-secondary" style="border-color: rgba(239, 68, 68, 0.4); color: #f87171;" onclick="window.appSimulateTamper('${currentDoc.id}')">
            ${t('simulateAlteredCopy')}
          </button>
          <button class="btn-secondary" onclick="window.appResetDocument('${currentDoc.id}')">
            ${t('restoreReferenceCopy')}
          </button>
        </div>
      </div>

      <!-- Right Column: Verification Notes & File Warning -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="glass-panel-static" style="padding: 22px;">
          <h4 style="font-size: 14px; font-weight: 700; text-transform: uppercase; color: var(--gold-primary); margin-bottom: 12px;">
            ${t('cryptoIntegrityExplanation')}
          </h4>
          <p style="font-size: 13px; color: var(--zinc-300); line-height: 1.6; margin-bottom: 12px;">
            ${currentDoc.notes}
          </p>
          <div style="background: rgba(250, 195, 6, 0.08); border: 1px solid rgba(250, 195, 6, 0.2); border-radius: 8px; padding: 12px; font-size: 12px; color: #fac306; line-height: 1.5;">
            <strong>${t('securityDisclaimer')}</strong>
            <br>${t('securityDisclaimerBody')}
          </div>
        </div>

        <!-- Real Document Intake & Validation -->
        ${renderUnitDocUploadSection('integrity')}
      </div>
    </div>
  `;
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
  pageTitle.textContent = t('doubleSellingTitle');
  pageSubtitle.textContent = t('doubleSellingSubtitle');

  const deeds = repo.getDeeds();
  const parcels = repo.getParcels();

  // Find parcels with potential double-selling
  const doubleSellingCases = parcels.filter(p => {
    const pDeeds = deeds.filter(d => d.syntheticParcelKey === p.syntheticParcelKey && d.saleStatus === 'REGISTERED');
    const buyers = new Set(pDeeds.map(d => d.buyerAlias));
    return pDeeds.length > 1 && buyers.size > 1;
  });

  const conflictParcel = doubleSellingCases[0] || (parcels.length > 1 ? parcels[1] : parcels[0]);
  if (!conflictParcel) {
    tabContainer.innerHTML = `
      ${renderUnitDocUploadSection('double-selling')}
      <div class="glass-panel-static" style="padding: 40px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚖️</div>
        <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 8px;">
          ${getLanguage() === 'bn' ? 'কোনো রেকর্ড নেই' : 'No Records Found'}
        </h3>
        <p style="font-size: 13px; color: var(--zinc-400); max-width: 500px; margin: 0 auto;">
          ${getLanguage() === 'bn' ? 'দ্বৈত-বিক্রয় বিশ্লেষণের জন্য প্রথমে জমির রেকর্ড ইনপুট করুন।' : 'Input land records first to run double-selling detection analysis. Use the "➕ Input Land Record" button above.'}
        </p>
      </div>
    `;
    return;
  }
  const conflictingDeeds = deeds.filter(d => d.syntheticParcelKey === conflictParcel.syntheticParcelKey);

  tabContainer.innerHTML = `
    <!-- Top summary card -->
    <div class="glass-panel-static" style="padding: 24px; margin-bottom: 24px; border-left: 4px solid var(--red-accent);">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge badge-high">${t('doubleSellingDetected')}</span>
            <span class="font-mono" style="font-size: 13px; color: var(--gold-primary); font-weight: 700;">${conflictParcel.syntheticParcelKey}</span>
          </div>
          <h2 style="font-size: 22px; font-weight: 800; color: #fff; margin: 6px 0;">
            ${t('plot')} ${conflictParcel.plotDagNo} • ${conflictParcel.demoMouza}
          </h2>
          <p style="font-size: 13px; color: var(--zinc-300); max-width: 800px;">
            ${t('twoDistinctDeeds')} ${conflictParcel.currentOwnerAlias} ${t('executedMultipleSales')}
          </p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: var(--zinc-400);">${t('rulesEngineWeight')}</div>
          <div class="font-mono" style="font-size: 28px; font-weight: 800; color: #f87171;">+40 ${t('pts')}</div>
          <button class="btn-gold" style="margin-top: 8px;" onclick="window.appRunDoubleSellingScan()">${t('reRunDetection')}</button>
        </div>
      </div>
    </div>

    <!-- Real Document Intake & Validation for Double-Selling -->
    ${renderUnitDocUploadSection('double-selling')}

    <!-- Side-by-side Conflicting Deeds Evidence Table -->
    <div class="glass-panel-static" style="padding: 24px; margin-bottom: 24px;">
      <h3 style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 14px;">
        ${t('conflictingTransferInstruments')}
      </h3>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; margin-bottom: 20px;">
        ${conflictingDeeds.map((d, idx) => `
          <div style="background: var(--surface-1); border: 1px solid ${idx === 1 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}; border-radius: 12px; padding: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span class="badge ${idx === 1 ? 'badge-high' : 'badge-gold'}">${t('instrument')} #${idx + 1}</span>
              <span class="font-mono" style="font-size: 12px; color: #60a5fa; font-weight: 700;">${d.deedNo}</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
              <div>
                <span style="color: var(--zinc-500);">${t('registrationDate')}</span>
                <span class="font-mono" style="color: #fff; font-weight: 600; margin-left: 6px;">${formatDate(d.deedDate)}</span>
              </div>
              <div>
                <span style="color: var(--zinc-500);">${t('sellerAliasLabel')}</span>
                <span class="font-mono" style="color: #f87171; font-weight: 700; margin-left: 6px;">${d.sellerAlias}</span>
              </div>
              <div>
                <span style="color: var(--zinc-500);">${t('buyerAliasLabel')}</span>
                <span class="font-mono" style="color: var(--gold-primary); font-weight: 700; margin-left: 6px;">${d.buyerAlias}</span>
              </div>
              <div>
                <span style="color: var(--zinc-500);">${t('declaredAreaLabel')}</span>
                <span style="color: #fff; font-weight: 600; margin-left: 6px;">${d.declaredArea} ${t('decimals')}</span>
              </div>
              <div>
                <span style="color: var(--zinc-500);">${t('subRegistryOffice')}</span>
                <span style="color: var(--zinc-300); margin-left: 6px;">${d.sourceRegistryOffice}</span>
              </div>
              <div>
                <span style="color: var(--zinc-500);">${t('statusFieldLabel')}</span>
                <span class="badge badge-low" style="margin-left: 6px;">${formatStatus(d.saleStatus)}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Critical Notice on False Positives -->
      <div style="background: rgba(24, 24, 27, 0.6); border: 1px solid var(--border-subtle); padding: 16px; border-radius: 8px; font-size: 12px; color: var(--zinc-300); line-height: 1.6;">
        <strong style="color: var(--gold-primary);">⚖️ ${t('falsePositiveTitle')}</strong>
        <br>${t('falsePositiveBody')}
        <br>${t('falsePositiveAction')}
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
  pageTitle.textContent = t('rapidTransfersTitle');
  pageSubtitle.textContent = t('rapidTransfersSubtitle');

  const settings = repo.getSettings();
  const transfers = repo.getTransfers();
  const parcels = repo.getParcels();

  // Check which parcels trigger
  const rapidParcel = parcels.find(p => {
    const pTransfers = transfers.filter(tr => tr.syntheticParcelKey === p.syntheticParcelKey);
    return pTransfers.length >= settings.rapidTransferCountThreshold;
  }) || parcels[0];
  if (!rapidParcel) {
    tabContainer.innerHTML = `
      ${renderUnitDocUploadSection('rapid-transfers')}
      <div class="glass-panel-static" style="padding: 40px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚡</div>
        <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 8px;">
          ${getLanguage() === 'bn' ? 'কোনো রেকর্ড নেই' : 'No Records Found'}
        </h3>
        <p style="font-size: 13px; color: var(--zinc-400); max-width: 500px; margin: 0 auto;">
          ${getLanguage() === 'bn' ? 'দ্রুত হস্তান্তর বিশ্লেষণের জন্য প্রথমে জমির রেকর্ড ইনপুট করুন।' : 'Input land records first to run rapid transfer detection. Use the "➕ Input Land Record" button above.'}
        </p>
      </div>
    `;
    return;
  }
  const parcelTransfers = transfers
    .filter(tr => tr.syntheticParcelKey === rapidParcel.syntheticParcelKey)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  // Determine if threshold is met
  const isTriggered = parcelTransfers.length >= settings.rapidTransferCountThreshold;

  tabContainer.innerHTML = `
    <!-- Configurable Threshold Banner -->
    <div class="glass-panel-static" style="padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
        <div>
          <h3 style="font-size: 16px; font-weight: 700; color: #fff;">${t('interactiveThresholds')}</h3>
          <p style="font-size: 12px; color: var(--zinc-400);">
            ${t('interactiveThresholdsDesc')}
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="badge ${isTriggered ? 'badge-high' : 'badge-low'}" style="font-size: 12px; padding: 6px 12px;">
            ${isTriggered ? t('rapidVelocityActive') : t('velocityWithinTolerance')}
          </span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; background: rgba(0,0,0,0.5); padding: 18px; border-radius: 8px; border: 1px solid var(--border-subtle);">
        <!-- Slider 1: Count Threshold -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 13px; font-weight: 600; color: #fff;">${t('minTransfersCount')}</label>
            <span class="font-mono" style="font-weight: 800; color: var(--gold-primary);" id="lblCountThresh">${settings.rapidTransferCountThreshold} ${t('transfers')}</span>
          </div>
          <input type="range" id="sliderCountThresh" min="2" max="5" value="${settings.rapidTransferCountThreshold}" step="1" style="width: 100%; accent-color: var(--gold-primary); cursor: pointer;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--zinc-500); margin-top: 4px;">
            <span>2 ${t('transfers')}</span>
            <span>3 ${t('transfersDefault')}</span>
            <span>4 ${t('transfers')}</span>
            <span>5 ${t('transfers')}</span>
          </div>
        </div>

        <!-- Slider 2: Window in Days -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 13px; font-weight: 600; color: #fff;">${t('evalTimeWindow')}</label>
            <span class="font-mono" style="font-weight: 800; color: var(--gold-primary);" id="lblWindowDays">${settings.rapidTransferWindowDays} ${t('days')}</span>
          </div>
          <input type="range" id="sliderWindowDays" min="30" max="180" value="${settings.rapidTransferWindowDays}" step="15" style="width: 100%; accent-color: var(--gold-primary); cursor: pointer;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--zinc-500); margin-top: 4px;">
            <span>30 ${t('days')}</span>
            <span>90 ${t('daysDefault')}</span>
            <span>180 ${t('days')}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Real Document Intake & Validation for Rapid Transfers -->
    ${renderUnitDocUploadSection('rapid-transfers')}

    <!-- Rapid Sequence Timeline -->
    <div class="glass-panel-static" style="padding: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <span class="font-mono" style="font-size: 11px; color: var(--gold-primary); font-weight: 700;">${rapidParcel.syntheticParcelKey}</span>
          <h3 style="font-size: 18px; font-weight: 700; color: #fff;">
            ${t('plot')} ${rapidParcel.plotDagNo} • ${rapidParcel.demoMouza}
          </h3>
          <div style="font-size: 12px; color: var(--zinc-400);">${t('chainOfConveyances')}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: var(--zinc-400);">${t('velocityWeight')}</div>
          <div class="font-mono" style="font-size: 22px; font-weight: 800; color: ${isTriggered ? '#f87171' : '#34d399'};">
            ${isTriggered ? '+15 PTS' : '0 PTS'}
          </div>
        </div>
      </div>

      <!-- Timeline visual -->
      <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
        ${parcelTransfers.map((tItem, index) => `
          <div style="display: flex; gap: 16px; align-items: center; background: var(--surface-1); padding: 16px; border-radius: 8px; border: 1px solid var(--border-subtle);">
            <div style="background: var(--gold-primary); color: #000; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;">
              ${index + 1}
            </div>
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                <span class="font-mono" style="font-weight: 700; color: #fff; font-size: 13px;">${formatDate(tItem.eventDate)}</span>
                <span class="badge badge-gold" style="font-size: 10px;">${tItem.deedId}</span>
              </div>
              <div style="font-size: 13px; color: var(--zinc-300);">
                ${t('fromSeller')} <strong class="font-mono" style="color: #f87171;">${tItem.sellerAlias}</strong> ${t('transferredToBuyer')} <strong class="font-mono" style="color: #34d399;">${tItem.buyerAlias}</strong>
              </div>
            </div>
            <div style="text-align: right; font-size: 12px; color: var(--zinc-400);">
              <div>${t('areaLabel')} ${tItem.area} ${t('dec')}</div>
              <div class="font-mono" style="font-size: 10px; color: var(--zinc-500);">${formatStatus(tItem.status)}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Summary metrics box -->
      <div style="background: rgba(24, 24, 27, 0.6); padding: 16px; border-radius: 8px; border: 1px solid var(--border-subtle); font-size: 13px; color: var(--zinc-300); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <strong>${t('observedSequenceSpan')}</strong> ${t('recordedTransfersOver')} <strong>42 ${t('calendarDays')}</strong> ${t('averageFrequency')}
        </div>
        <button class="btn-secondary" onclick="window.appOpenCaseModal('alt-003')">
          ${t('inspectCaseFile')} alt-003
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
  pageTitle.textContent = t('reconciliationTitle');
  pageSubtitle.textContent = t('reconciliationSubtitle');

  const parcels = repo.getParcels();
  const registrations = repo.getRegistrations();
  const mutations = repo.getMutations();

  if (parcels.length === 0) {
    tabContainer.innerHTML = `
      ${renderUnitDocUploadSection('reconciliation')}
      <div class="glass-panel-static" style="padding: 40px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">🔄</div>
        <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 8px;">
          ${getLanguage() === 'bn' ? 'কোনো রেকর্ড পাওয়া যায়নি' : 'No Records Found'}
        </h3>
        <p style="font-size: 13px; color: var(--zinc-400); max-width: 500px; margin: 0 auto 20px auto;">
          ${getLanguage() === 'bn' ? 'দ্বৈত-রেজিস্ট্রি ক্রস-সমন্বয় বিশ্লেষণের জন্য প্রথমে জমির রেকর্ড ইনপুট করুন।' : 'Input land records first to run dual-registry cross-reconciliation. Use the "➕ Input Land Record" button.'}
        </p>
        <button class="btn-gold" onclick="window.appOpenManualIntake()">${getLanguage() === 'bn' ? '➕ জমির রেকর্ড ইনপুট করুন' : '➕ Input Land Record'}</button>
      </div>
    `;
    return;
  }

  tabContainer.innerHTML = `
    <!-- Real Document Intake & Validation for Dual-Registry Reconciliation -->
    ${renderUnitDocUploadSection('reconciliation')}

    <!-- Context Banner -->
    <div class="glass-panel-static" style="padding: 20px; margin-bottom: 24px; border-left: 4px solid var(--gold-primary);">
      <h3 style="font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 6px;">
        ${t('institutionalGapTitle')}
      </h3>
      <p style="font-size: 13px; color: var(--zinc-300); line-height: 1.5;">
        ${t('institutionalGapBody')}
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
          statusBadge = `<span class="badge badge-high">${t('mutationRecordAbsentBadge')}</span>`;
        } else if (!buyerMatch || !areaMatch) {
          statusBadge = `<span class="badge badge-high">${t('fieldDiscrepancyDetected')}</span>`;
        } else {
          statusBadge = `<span class="badge badge-low">${t('reconciledInDemo')}</span>`;
        }

        return `
          <div class="glass-panel-static" style="padding: 22px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
              <div>
                <span class="font-mono" style="font-size: 11px; color: var(--gold-primary); font-weight: 700;">${parcel.syntheticParcelKey}</span>
                <h3 style="font-size: 17px; font-weight: 700; color: #fff;">
                  ${t('plot')} ${parcel.plotDagNo} • ${parcel.demoMouza}
                </h3>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                ${statusBadge}
                <button class="btn-secondary" style="font-size: 11px; padding: 4px 10px;" onclick="window.appOpenParcel('${parcel.id}')">
                  ${t('viewPlot')}
                </button>
              </div>
            </div>

            <!-- Field-by-field Comparison Table -->
            <div style="overflow-x: auto;">
              <table class="enterprise-table" style="font-size: 12px;">
                <thead>
                  <tr>
                    <th>${t('verificationField')}</th>
                    <th>${t('subRegistryDeedValue')}</th>
                    <th>${t('acLandMutationValue')}</th>
                    <th>${t('reconciliationResult')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="font-weight: 600; color: #fff;">${t('deedCaseReference')}</td>
                    <td class="font-mono">${reg ? reg.deedRef : 'N/A'}</td>
                    <td class="font-mono">${mut ? mut.deedRef : 'N/A'}</td>
                    <td>
                      <span class="badge ${reg && mut && reg.deedRef === mut.deedRef ? 'badge-low' : 'badge-high'}">
                        ${reg && mut && reg.deedRef === mut.deedRef ? t('match') : t('mismatch')}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600; color: #fff;">${t('buyerTransfereeAlias')}</td>
                    <td class="font-mono" style="color: var(--gold-primary);">${reg ? reg.buyerAlias : 'N/A'}</td>
                    <td class="font-mono" style="color: ${buyerMatch ? 'var(--gold-primary)' : '#f87171'}; font-weight: 700;">
                      ${mut ? mut.buyerAlias : 'N/A'}
                    </td>
                    <td>
                      <span class="badge ${buyerMatch ? 'badge-low' : 'badge-high'}">
                        ${buyerMatch ? t('match') : t('mismatchAlert')}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600; color: #fff;">${t('conveyedAreaDimension')}</td>
                    <td>${reg ? `${reg.area} ${reg.areaUnit}` : 'N/A'}</td>
                    <td style="font-weight: 700; color: ${areaMatch ? '#fff' : '#f87171'};">
                      ${mut ? `${mut.area} ${mut.areaUnit}` : 'N/A'}
                    </td>
                    <td>
                      <span class="badge ${areaMatch ? 'badge-low' : 'badge-high'}">
                        ${areaMatch ? t('match') : t('areaDriftAlert')}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600; color: #fff;">${t('transactionSanctionDate')}</td>
                    <td class="font-mono">${reg ? formatDate(reg.transferDate) : 'N/A'}</td>
                    <td class="font-mono">${mut ? formatDate(mut.mutationDate) : 'N/A'}</td>
                    <td><span class="badge badge-low">${t('chronologyOk')}</span></td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600; color: #fff;">${t('administrativeStatus')}</td>
                    <td><span class="badge badge-low">${reg ? formatStatus(reg.registrationStatus) : 'N/A'}</span></td>
                    <td>
                      <span class="badge ${mut && mut.mutationStatus === 'OBJECTION_FILED' ? 'badge-high' : 'badge-low'}">
                        ${mut ? formatStatus(mut.mutationStatus) : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span class="badge ${mut && mut.mutationStatus === 'OBJECTION_FILED' ? 'badge-high' : 'badge-low'}">
                        ${mut && mut.mutationStatus === 'OBJECTION_FILED' ? t('caveatActive') : t('satisfactory')}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            ${!recordPresent ? `
              <div style="margin-top: 10px; font-size: 11px; color: var(--zinc-400); font-style: italic;">
                ℹ️ ${t('missingRecordNote')}
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
// ==========================================
// 7. REVIEW CASES & ALERT MANAGEMENT
// ==========================================
function renderCaseManagement() {
  pageTitle.textContent = t('caseManagementTitle');
  pageSubtitle.textContent = t('caseManagementSubtitle');

  const alerts = repo.getAlerts();
  const settings = repo.getSettings();

  if (alerts.length === 0) {
    tabContainer.innerHTML = `
      ${renderUnitDocUploadSection('cases')}
      <div class="glass-panel-static" style="padding: 40px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
        <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 8px;">
          ${getLanguage() === 'bn' ? 'কোনো সক্রিয় ঝুঁকি কেস নেই' : 'No Active Alert Cases'}
        </h3>
        <p style="font-size: 13px; color: var(--zinc-400); max-width: 500px; margin: 0 auto;">
          ${getLanguage() === 'bn' ? 'সমস্ত রেকর্ড সমন্বিত রয়েছে অথবা কোনো অমিল পাওয়া যায়নি।' : 'All land records are reconciled or no discrepancy alerts have been triggered.'}
        </p>
      </div>
    `;
    return;
  }

  tabContainer.innerHTML = `
    <!-- Reviewer role banner -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; background: var(--surface-1); padding: 14px 20px; border-radius: 8px; border: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 10px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 18px;">👤</span>
        <div>
          <div style="font-size: 13px; font-weight: 700; color: #fff;">${t('activeSimulatedReviewer')} ${settings.reviewerAlias}</div>
          <div style="font-size: 11px; color: var(--zinc-400);">${t('simulatedRole')} <strong style="color: var(--gold-primary);">${settings.currentReviewerRole}</strong> ${t('uiSimulation')}</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 12px; color: var(--zinc-400);">${t('switchPersona')}</span>
        <select onchange="window.appChangeRole(this.value)" style="background: #000; border: 1px solid var(--border-subtle); color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">
          <option value="Sub-Registrar" ${settings.currentReviewerRole === 'Sub-Registrar' ? 'selected' : ''}>${t('roleSubRegistrar')}</option>
          <option value="AC Land Officer" ${settings.currentReviewerRole === 'AC Land Officer' ? 'selected' : ''}>${t('roleAcLand')}</option>
          <option value="Land Auditor" ${settings.currentReviewerRole === 'Land Auditor' ? 'selected' : ''}>${t('roleAuditor')}</option>
        </select>
      </div>
    </div>

    <!-- Real Document Intake & Validation for Case Review -->
    ${renderUnitDocUploadSection('cases')}

    <!-- Cases Table -->
    <div class="glass-panel-static" style="padding: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <h3 style="font-size: 18px; font-weight: 700; color: #fff;">${t('allDiscrepancyAlerts')} (${alerts.length})</h3>
        <span style="font-size: 12px; color: var(--zinc-400);">${t('clickReviewCase')}</span>
      </div>

      <div style="overflow-x: auto;">
        <table class="enterprise-table">
          <thead>
            <tr>
              <th>${t('caseId')}</th>
              <th>${t('parcelKey')}</th>
              <th>${t('triggeredRulesBreakdown')}</th>
              <th>${t('triageScore')}</th>
              <th>${t('severity')}</th>
              <th>${t('currentStatus')}</th>
              <th>${t('assignedReviewer')}</th>
              <th>${t('action')}</th>
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
                        • <strong>${formatRuleName(r.name)}</strong> <span class="font-mono" style="color: var(--gold-primary);">(+${r.weight})</span>
                      </div>
                    `).join('')}
                  </div>
                </td>
                <td>
                  <div class="font-mono" style="font-weight: 800; font-size: 15px; color: ${a.score >= 60 ? '#f87171' : a.score >= 30 ? 'var(--gold-primary)' : '#34d399'};">
                    ${a.score} ${t('of100')}
                  </div>
                </td>
                <td>
                  <span class="badge ${a.severity === 'HIGH' ? 'badge-high' : a.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'}">
                    ${formatSeverity(a.severity)}
                  </span>
                </td>
                <td>
                  <span style="font-size: 12px; font-weight: 600; color: #e4e4e7;">${formatStatus(a.status)}</span>
                </td>
                <td class="font-mono" style="font-size: 11px; color: var(--zinc-400);">
                  ${a.assignedReviewerAlias}
                </td>
                <td>
                  <button class="btn-gold" style="padding: 5px 10px; font-size: 11px;" onclick="window.appOpenCaseModal('${a.id}')">
                    ${t('reviewCase')}
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
            <span class="badge ${alert.severity === 'HIGH' ? 'badge-high' : alert.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'}">${formatSeverity(alert.severity)} ${t('severityLabel')}</span>
            <span class="font-mono" style="font-size: 13px; color: var(--gold-primary); font-weight: 700;">${t('caseLabel')} ${alert.id}</span>
          </div>
          <h2 style="font-size: 22px; font-weight: 800; color: #fff; margin-top: 4px;">
            ${t('parcelLabel')} ${alert.syntheticParcelKey}
          </h2>
          <div style="font-size: 12px; color: var(--zinc-400);">${parcel ? `${parcel.demoMouza} • ${t('dag')} ${parcel.plotDagNo}` : ''}</div>
        </div>
        <button onclick="window.appCloseModal()" style="background: none; border: none; color: var(--zinc-400); font-size: 20px; cursor: pointer;">✕</button>
      </div>

      <!-- Transparent Score Breakdown -->
      <div style="background: rgba(24, 24, 27, 0.7); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h4 style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: var(--zinc-300);">
            ${t('deterministicScoreBreakdown')}
          </h4>
          <span class="font-mono" style="font-size: 22px; font-weight: 800; color: ${alert.score >= 60 ? '#f87171' : 'var(--gold-primary)'};">
            ${alert.score} ${t('of100')}
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${alert.rulesTriggered.map(r => `
            <div style="background: #000; padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 700; color: #fff; font-size: 13px;">${formatRuleName(r.name)}</div>
                <div style="font-size: 11px; color: var(--zinc-400);">${formatRuleDesc(r.name, r.description)}</div>
              </div>
              <span class="font-mono" style="font-weight: 800; color: var(--gold-primary); font-size: 14px;">+${r.weight} ${t('pts')}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Supporting Evidence Refs -->
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: var(--zinc-400); margin-bottom: 8px;">
          ${t('supportingEvidenceItems')}
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
        <strong>${t('recommendedAction')}</strong>
        <br>${t('recommendedActionBody')}
      </div>

      <!-- Reviewer Note & Status Form -->
      <div style="background: var(--surface-1); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <h4 style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: #fff; margin-bottom: 12px;">
          ${t('reviewerTriageAction')}
        </h4>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div>
            <label style="font-size: 12px; color: var(--zinc-400); display: block; margin-bottom: 4px;">${t('transitionCaseStatus')}</label>
            <select id="caseStatusSelect" style="width: 100%; background: #000; border: 1px solid var(--border-subtle); color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; outline: none;">
              <option value="New" ${alert.status === 'New' ? 'selected' : ''}>${t('statusNew')}</option>
              <option value="Under Review" ${alert.status === 'Under Review' ? 'selected' : ''}>${t('statusUnderReview')}</option>
              <option value="Resolved — No Issue Found" ${alert.status === 'Resolved — No Issue Found' ? 'selected' : ''}>${t('statusResolved')}</option>
              <option value="Escalated for Authorized Review" ${alert.status === 'Escalated for Authorized Review' ? 'selected' : ''}>${t('statusEscalated')}</option>
            </select>
          </div>

          <div>
            <label style="font-size: 12px; color: var(--zinc-400); display: block; margin-bottom: 4px;">${t('assignedReviewerAlias')}</label>
            <input type="text" id="caseReviewerInput" value="${alert.assignedReviewerAlias || settings.reviewerAlias}" class="font-mono" style="width: 100%; background: #000; border: 1px solid var(--border-subtle); color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; outline: none;">
          </div>
        </div>

        <div style="margin-bottom: 14px;">
          <label style="font-size: 12px; color: var(--zinc-400); display: block; margin-bottom: 4px;">${t('addReviewerNote')}</label>
          <textarea id="caseNoteInput" rows="2" placeholder="${t('reviewerNotePlaceholder')}" style="width: 100%; background: #000; border: 1px solid var(--border-subtle); color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; outline: none; resize: vertical;"></textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button class="btn-gold" onclick="window.appSaveCaseUpdates('${alert.id}')">
            ${t('saveStatusAddNote')}
          </button>
        </div>
      </div>

      <!-- Case Note History -->
      ${alert.notes ? `
        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: var(--zinc-400); margin-bottom: 6px;">
            ${t('caseNotesLog')}
          </h4>
          <pre class="font-mono" style="background: #000; padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle); color: #e4e4e7; font-size: 11px; white-space: pre-wrap;">${alert.notes}</pre>
        </div>
      ` : ''}

      <!-- Modal Close Button & Record Removal -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 14px; flex-wrap: wrap; gap: 8px;">
        <button class="btn-remove-record" onclick="window.appRemoveParcelRecord('${parcel ? parcel.id : alert.syntheticParcelKey}')">
          🗑️ ${getLanguage() === 'bn' ? 'সম্পূর্ণ রেকর্ড মুছে ফেলুন' : 'Delete Associated Record'}
        </button>
        <button class="btn-secondary" onclick="window.appCloseModal()">${t('close')}</button>
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
  pageTitle.textContent = t('methodologyTitle');
  pageSubtitle.textContent = t('methodologySubtitle');

  const settings = repo.getSettings();

  tabContainer.innerHTML = `
    <!-- Real Document Intake & Validation for Methodology -->
    ${renderUnitDocUploadSection('methodology')}

    <!-- Hackathon Track & Problem Statement Card -->
    <div class="glass-panel-static" style="padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
        <div>
          <span class="badge badge-gold">${t('landTechHackathon')}</span>
          <h2 style="font-size: 20px; font-weight: 800; color: #fff; margin: 6px 0;">
            ${t('trackDigitalLandRecords')}
          </h2>
          <div style="font-size: 14px; color: var(--zinc-300);">
            ${t('selectedProblem')} <strong>${t('selectedProblemValue')}</strong>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; color: var(--zinc-400);">${t('appVersion')}</div>
          <div class="font-mono" style="font-weight: 800; color: #fff;">v1.0.0-PROTOTYPE</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 20px;">
        <div style="background: #000; padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="font-weight: 700; color: #10b981; font-size: 13px;">${t('syntheticData100')}</div>
          <div style="font-size: 12px; color: var(--zinc-400); margin-top: 4px;">
            ${t('syntheticData100Desc')}
          </div>
        </div>

        <div style="background: #000; padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="font-weight: 700; color: #60a5fa; font-size: 13px;">${t('offlineSandbox')}</div>
          <div style="font-size: 12px; color: var(--zinc-400); margin-top: 4px;">
            ${t('offlineSandboxDesc')}
          </div>
        </div>

        <div style="background: #000; padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="font-weight: 700; color: var(--gold-primary); font-size: 13px;">${t('advisoryTriageOnly')}</div>
          <div style="font-size: 12px; color: var(--zinc-400); margin-top: 4px;">
            ${t('advisoryTriageOnlyDesc')}
          </div>
        </div>
      </div>
    </div>

    <!-- MANUAL LAND RECORD & FILE INTAKE HUB -->
    <div class="glass-panel-static" style="padding: 24px; margin-bottom: 24px; border-left: 4px solid var(--gold-primary);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h3 style="font-size: 17px; font-weight: 700; color: #fff;">
            ${getLanguage() === 'bn' ? 'ম্যানুয়াল ভূমি রেকর্ড ও দলিল ফাইল গ্রহণ হাব' : 'Manual Land Record & File Intake Hub'}
          </h3>
          <p style="font-size: 12px; color: var(--zinc-400);">
            ${getLanguage() === 'bn' 
              ? 'কোনো পূর্বনির্ধারিত প্রোটোটাইপ ছাড়া সরাসরি নিজস্ব দাগ, খতিয়ান, সাফ-কবলা দলিল ও স্ক্যান ফাইল ইনপুট দিন।' 
              : 'Directly input real/custom plots, khatians, registered deeds, and upload documents for instant fraud triage.'}
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn-gold" onclick="window.appOpenManualIntake()">
            ${getLanguage() === 'bn' ? '➕ নতুন রেকর্ড ইনপুট' : '➕ Input Land Record'}
          </button>
          <button class="btn-secondary" style="color: #f87171; border-color: rgba(239,68,68,0.3);" onclick="window.appResetSeedData()">
            ${getLanguage() === 'bn' ? '🗑️ সমস্ত রেকর্ড মুছুন' : '🗑️ Clear All Records'}
          </button>
        </div>
      </div>
      <div style="background: rgba(0,0,0,0.5); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle); font-size: 12px; color: var(--zinc-300); line-height: 1.6;">
        ${getLanguage() === 'bn'
          ? '🛡️ <strong>স্বয়ংক্রিয় যাচাইকরণ:</strong> প্রতিটি ম্যানুয়াল এন্ট্রি করার সাথে সাথে সিস্টেম স্বতঃস্ফূর্তভাবে ক্রিপ্টোগ্রাফিক SHA-256 হ্যাশ গণনা করবে, ম্যাজিক বাইট ফরম্যাট যাচাই করবে এবং দ্বৈত-বিক্রয়, দ্রুত হস্তান্তর ও নামজারি সমন্বয় টেস্ট রান করবে।'
          : '🛡️ <strong>Automated Verification:</strong> Upon manual submission, LandSentry executes real-time Web Crypto SHA-256 hash calculation, magic-byte document structure inspection, and deterministic double-selling & rapid-transfer verification.'}
      </div>
    </div>

    <!-- CONFIGURABLE HEURISTIC WEIGHTS & THRESHOLDS (PRD Section 7) -->
    <div class="glass-panel-static" style="padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
        <div>
          <h3 style="font-size: 17px; font-weight: 700; color: #fff;">${t('configurableWeightsTitle')}</h3>
          <p style="font-size: 12px; color: var(--zinc-400);">${t('configurableWeightsDesc')}</p>
        </div>
        <span class="badge badge-gold font-mono">${t('deterministicEngine')}</span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #fff;">${t('possibleDoubleSellingWeight')}</label>
            <span class="font-mono font-bold" style="color: #f87171;">+${settings.weightDoubleSelling}</span>
          </div>
          <input type="range" min="10" max="60" step="5" value="${settings.weightDoubleSelling}" 
                 onchange="window.appUpdateWeight('weightDoubleSelling', this.value)" style="width: 100%;">
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">${t('prdBaseline')} +40</div>
        </div>

        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #fff;">${t('docHashMismatchWeight')}</label>
            <span class="font-mono font-bold" style="color: #fbbf24;">+${settings.weightDocumentIntegrity}</span>
          </div>
          <input type="range" min="10" max="50" step="5" value="${settings.weightDocumentIntegrity}" 
                 onchange="window.appUpdateWeight('weightDocumentIntegrity', this.value)" style="width: 100%;">
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">${t('prdBaseline')} +25</div>
        </div>

        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #fff;">${t('regMutationMismatchWeight')}</label>
            <span class="font-mono font-bold" style="color: #60a5fa;">+${settings.weightRegMutationMismatch}</span>
          </div>
          <input type="range" min="10" max="40" step="5" value="${settings.weightRegMutationMismatch}" 
                 onchange="window.appUpdateWeight('weightRegMutationMismatch', this.value)" style="width: 100%;">
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">${t('prdBaseline')} +20</div>
        </div>

        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #fff;">${t('rapidTransferPatternWeight')}</label>
            <span class="font-mono font-bold" style="color: #a78bfa;">+${settings.weightRapidTransfer}</span>
          </div>
          <input type="range" min="5" max="30" step="5" value="${settings.weightRapidTransfer}" 
                 onchange="window.appUpdateWeight('weightRapidTransfer', this.value)" style="width: 100%;">
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">${t('prdBaseline')} +15</div>
        </div>

        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #fff;">${t('rapidTransferThreshold')}</label>
            <span class="font-mono font-bold" style="color: #38bdf8;">${settings.rapidTransferCountThreshold} ${t('transfers')}</span>
          </div>
          <input type="range" min="2" max="6" step="1" value="${settings.rapidTransferCountThreshold}" 
                 onchange="window.appUpdateWeight('rapidTransferCountThreshold', this.value)" style="width: 100%;">
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">${t('defaultTransfers')} 3 ${t('transfersInDays')} ${settings.rapidTransferWindowDays} ${t('days')}</div>
        </div>

        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #fff;">${t('missingFieldWeight')}</label>
            <span class="font-mono font-bold" style="color: #34d399;">+${settings.weightMissingFields}</span>
          </div>
          <input type="range" min="5" max="25" step="5" value="${settings.weightMissingFields}" 
                 onchange="window.appUpdateWeight('weightMissingFields', this.value)" style="width: 100%;">
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">${t('prdBaseline')} +10</div>
        </div>
      </div>
    </div>

    <!-- PRD ETHICAL SAFEGUARDS & NON-GOALS (PRD Section 3 & Section 7.1) -->
    <div class="glass-panel-static" style="padding: 24px; margin-bottom: 24px;">
      <h3 style="font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 8px;">
        ${t('methodologyNonGoals')}
      </h3>
      <p style="font-size: 12px; color: var(--zinc-400); margin-bottom: 16px;">
        ${t('methodologyNonGoalsDesc')}
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border-left: 3px solid #ef4444;">
          <div style="font-size: 12px; font-weight: 800; color: #f87171;">${t('noLegalAdjudication')}</div>
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">
            ${t('noLegalAdjudicationDesc')}
          </div>
        </div>

        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border-left: 3px solid #f59e0b;">
          <div style="font-size: 12px; font-weight: 800; color: #fbbf24;">${t('noBlackBoxLLM')}</div>
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">
            ${t('noBlackBoxLLMDesc')}
          </div>
        </div>

        <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border-left: 3px solid #10b981;">
          <div style="font-size: 12px; font-weight: 800; color: #34d399;">${t('noLiveGovtScraping')}</div>
          <div style="font-size: 11px; color: var(--zinc-400); margin-top: 4px;">
            ${t('noLiveGovtScrapingDesc')}
          </div>
        </div>
      </div>
    </div>

    <!-- Export & Data Management -->
    <div class="glass-panel-static" style="padding: 24px;">
      <h3 style="font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 8px;">
        ${t('syntheticDataExport')}
      </h3>
      <p style="font-size: 12px; color: var(--zinc-400); margin-bottom: 16px;">
        ${t('syntheticDataExportDesc')}
      </p>

      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="btn-gold" onclick="window.appExportJson()">
          ${t('exportJson')}
        </button>
        <button class="btn-secondary" onclick="window.appExportCsv()">
          ${t('exportCsv')}
        </button>
        <button class="btn-secondary" style="color: #f87171; border-color: rgba(239, 68, 68, 0.3);" onclick="window.appResetSeedData()">
          ${t('resetDemoData')}
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
  if (confirm(t('confirmReset'))) {
    repo.resetToSeed();
    renderView();
  }
};

window.appRemoveUploadedDoc = function(sha256) {
  const lang = getLanguage();
  const msg = lang === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি এই নথিটি মুছে ফেলতে চান?' : 'Are you sure you want to remove this document?';
  if (confirm(msg)) {
    repo.removeUploadedDoc(sha256);
    renderView();
  }
};

window.appClearUploadedDocs = function(unitId) {
  const lang = getLanguage();
  const msg = lang === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি সব আপলোডকৃত নথি মুছে ফেলতে চান?' : 'Are you sure you want to remove all uploaded documents?';
  if (confirm(msg)) {
    repo.clearUploadedDocs(unitId);
    renderView();
  }
};

window.appClearAllPdfs = function() {
  repo.clearUploadedPdfs();
  renderView();
};

window.appRemoveParcelRecord = function(parcelId) {
  if (!parcelId) return;
  const lang = getLanguage();
  const msg = lang === 'bn' 
    ? 'আপনি কি নিশ্চিত যে আপনি এই জমির রেকর্ডটি সম্পূর্ণভাবে মুছে ফেলতে চান?' 
    : 'Are you sure you want to permanently remove this land record and its associated lineage?';
  if (confirm(msg)) {
    repo.removeParcel(parcelId);
    window.appCloseModal();
    renderView();
  }
};

window.appRemoveDeed = function(deedId) {
  if (!deedId) return;
  const lang = getLanguage();
  const msg = lang === 'bn' 
    ? 'আপনি কি নিশ্চিত যে আপনি এই দলিলটি মুছে ফেলতে চান?' 
    : 'Are you sure you want to remove this deed?';
  if (confirm(msg)) {
    repo.removeDeed(deedId);
    window.appCloseModal();
    renderView();
  }
};

window.appClearHistory = function() {
  const lang = getLanguage();
  const msg = lang === 'bn'
    ? 'আপনি কি প্রোগ্রাম হিস্ট্রি এবং সমস্ত অডিট লগ মুছে ফেলতে চান?'
    : 'Are you sure you want to clear the audit history and activity logs?';
  if (confirm(msg)) {
    repo.clearHistory();
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
  a.download = `landsentry_synthetic_records_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

window.appExportCsv = function() {
  const csvStr = repo.exportSyntheticAlertsCsv();
  const blob = new Blob([csvStr], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `landsentry_synthetic_alerts_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

window.appCloseModal = function() {
  modalContainer.style.display = 'none';
};

// Modal for Manual Land Record & File Intake
function openManualIntakeModal() {
  modalContainer.style.display = 'flex';
  modalContainer.className = 'modal-overlay';
  const lang = getLanguage();

  modalContainer.innerHTML = `
    <div class="modal-content" style="padding: 28px; max-width: 680px;">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <span class="badge badge-gold" style="font-size: 10px; margin-bottom: 6px;">${lang === 'bn' ? 'ম্যানুয়াল রেকর্ড ও দলিল ভুক্তি' : 'MANUAL RECORD & FILE INTAKE'}</span>
          <h2 style="font-size: 20px; font-weight: 800; color: #fff; margin-top: 4px;">
            ${lang === 'bn' ? 'জমির নতুন রেকর্ড ও দলিল ফাইল ইনপুট' : 'Input Land Record & Deed File'}
          </h2>
          <div style="font-size: 12px; color: var(--zinc-400);">
            ${lang === 'bn' ? 'ম্যানুয়াল তথ্যাদি ও দলিল সংযোজন করুন; সিস্টেম স্বয়ংক্রিয়ভাবে ক্রিপ্টোগ্রাফিক হ্যাশ তৈরি ও অনিয়ম বিশ্লেষণ করবে।' : 'Enter land details and attach deed documents. Real-time deterministic risk assessment will run automatically.'}
          </div>
        </div>
        <button onclick="window.appCloseModal()" style="background: none; border: none; color: var(--zinc-400); font-size: 20px; cursor: pointer;">✕</button>
      </div>

      <form id="manualIntakeForm" onsubmit="event.preventDefault(); window.appSubmitManualIntake();">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--zinc-300); text-transform: uppercase; display: block; margin-bottom: 6px;">
              ${lang === 'bn' ? 'দাগ নম্বর (Plot / Dag No.) *' : 'Plot / Dag No. *'}
            </label>
            <input type="text" id="intakePlotDag" required class="login-input font-mono" placeholder="e.g. 104" style="padding: 10px 12px; font-size: 13px;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--zinc-300); text-transform: uppercase; display: block; margin-bottom: 6px;">
              ${lang === 'bn' ? 'মৌজা (Mouza) *' : 'Mouza *'}
            </label>
            <input type="text" id="intakeMouza" required class="login-input" placeholder="e.g. Tejgaon, Gulshan, Savar" style="padding: 10px 12px; font-size: 13px;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--zinc-300); text-transform: uppercase; display: block; margin-bottom: 6px;">
              ${lang === 'bn' ? 'জেলা (District)' : 'District'}
            </label>
            <input type="text" id="intakeDistrict" class="login-input" value="Dhaka" style="padding: 10px 12px; font-size: 13px;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--zinc-300); text-transform: uppercase; display: block; margin-bottom: 6px;">
              ${lang === 'bn' ? 'খতিয়ান নম্বর (Khatian Ref)' : 'Khatian Reference'}
            </label>
            <input type="text" id="intakeKhatian" class="login-input font-mono" placeholder="e.g. K-104 / RS-512" style="padding: 10px 12px; font-size: 13px;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--zinc-300); text-transform: uppercase; display: block; margin-bottom: 6px;">
              ${lang === 'bn' ? 'দলিল নম্বর (Deed No.) *' : 'Deed No. *'}
            </label>
            <input type="text" id="intakeDeedNo" required class="login-input font-mono" placeholder="e.g. DEED-2026-9812" style="padding: 10px 12px; font-size: 13px;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--zinc-300); text-transform: uppercase; display: block; margin-bottom: 6px;">
              ${lang === 'bn' ? 'দলিলের তারিখ (Deed Date)' : 'Deed Date'}
            </label>
            <input type="date" id="intakeDeedDate" class="login-input font-mono" value="${new Date().toISOString().split('T')[0]}" style="padding: 10px 12px; font-size: 13px;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--zinc-300); text-transform: uppercase; display: block; margin-bottom: 6px;">
              ${lang === 'bn' ? 'বিক্রেতার নাম / এলিয়াস (Seller) *' : 'Seller Alias / Name *'}
            </label>
            <input type="text" id="intakeSeller" required class="login-input" placeholder="e.g. Rafiqul Islam" style="padding: 10px 12px; font-size: 13px;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--zinc-300); text-transform: uppercase; display: block; margin-bottom: 6px;">
              ${lang === 'bn' ? 'গ্রহীতা / ক্রেতার নাম (Buyer) *' : 'Buyer / Transferee Alias *'}
            </label>
            <input type="text" id="intakeBuyer" required class="login-input" placeholder="e.g. Anisur Rahman" style="padding: 10px 12px; font-size: 13px;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--zinc-300); text-transform: uppercase; display: block; margin-bottom: 6px;">
              ${lang === 'bn' ? 'জমির পরিমাণ (ডেসিমেল / শতাংশ) *' : 'Conveyed Area (Decimals) *'}
            </label>
            <input type="number" step="0.01" min="0.01" id="intakeArea" required class="login-input font-mono" placeholder="e.g. 10.50" style="padding: 10px 12px; font-size: 13px;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--zinc-300); text-transform: uppercase; display: block; margin-bottom: 6px;">
              ${lang === 'bn' ? 'এসি ল্যান্ড নামজারি স্ট্যাটাস' : 'AC Land Mutation Status'}
            </label>
            <select id="intakeMutationStatus" class="login-input" style="padding: 10px 12px; font-size: 13px;">
              <option value="MUTATION_APPROVED">${lang === 'bn' ? 'নামজারি অনুমোদিত (Approved)' : 'Approved (MUTATION_APPROVED)'}</option>
              <option value="MUTATION_PENDING">${lang === 'bn' ? 'নামজারি অপেক্ষমাণ (Pending)' : 'Pending (MUTATION_PENDING)'}</option>
              <option value="RECORD_MISSING">${lang === 'bn' ? 'রেকর্ড অনুপস্থিত (Record Missing)' : 'Record Missing (RECORD_MISSING)'}</option>
            </select>
          </div>
        </div>

        <!-- Document File Upload & Byte Validation -->
        <div style="background: rgba(24, 24, 27, 0.7); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px; margin-bottom: 18px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <label style="font-size: 11px; font-weight: 700; color: var(--gold-primary); text-transform: uppercase;">
              📎 ${lang === 'bn' ? 'দলিল ফাইল আপলোড ও ক্রিপ্টো হ্যাশিং' : 'Deed File Attachment (PDF / DOC / DOCX)'}
            </label>
            <span style="font-size: 10px; color: var(--zinc-400);">${lang === 'bn' ? 'ম্যাজিক বাইট ও SHA-256 স্বয়ংক্রিয়ভাবে বের হবে' : 'Web Crypto SHA-256 fingerprinting'}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 10px; color: var(--zinc-400); margin-bottom: 4px; display: block;">
                ${lang === 'bn' ? 'দলিলের শ্রেণি' : 'Document Category'}
              </label>
              <select id="intakeDocCategory" class="login-input" style="padding: 8px 10px; font-size: 12px;">
                <option value="Registered Sale Deed">Registered Sale Deed (সাফ-কবলা দলিল)</option>
                <option value="Khatian Extract">Khatian Extract / Porcha (খতিয়ান পর্চা)</option>
                <option value="Mutation Order Sheet">AC Land Mutation Order (নামজারি আদেশ)</option>
                <option value="Non-Encumbrance Certificate">NEC Search Certificate (নির্দোষ সনদ)</option>
              </select>
            </div>
            <div>
              <label style="font-size: 10px; color: var(--zinc-400); margin-bottom: 4px; display: block;">
                ${lang === 'bn' ? 'ফাইল বাছাই করুন' : 'Select File'}
              </label>
              <input type="file" id="intakeFileInput" accept=".pdf,.doc,.docx" class="login-input" style="padding: 6px 10px; font-size: 11px;">
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-subtle); padding-top: 16px;">
          <button type="button" class="btn-secondary" onclick="window.appCloseModal()">${t('close')}</button>
          <button type="submit" id="btnSubmitManualIntake" class="btn-gold">
            ${lang === 'bn' ? '💾 রেকর্ড সংরক্ষণ ও ফ্রড টেস্ট রান' : '💾 Register Record & Run Analysis'}
          </button>
        </div>
      </form>
    </div>
  `;
}

window.appOpenManualIntake = openManualIntakeModal;

window.appSubmitManualIntake = async function() {
  const dag = document.getElementById('intakePlotDag')?.value?.trim();
  const mouza = document.getElementById('intakeMouza')?.value?.trim();
  const district = document.getElementById('intakeDistrict')?.value?.trim() || 'Dhaka';
  const khatian = document.getElementById('intakeKhatian')?.value?.trim() || `K-${dag}`;
  const deedNo = document.getElementById('intakeDeedNo')?.value?.trim();
  const deedDate = document.getElementById('intakeDeedDate')?.value || new Date().toISOString().split('T')[0];
  const seller = document.getElementById('intakeSeller')?.value?.trim();
  const buyer = document.getElementById('intakeBuyer')?.value?.trim();
  const area = parseFloat(document.getElementById('intakeArea')?.value) || 10.0;
  const mutationStatus = document.getElementById('intakeMutationStatus')?.value || 'MUTATION_APPROVED';
  const docCategory = document.getElementById('intakeDocCategory')?.value || 'Registered Sale Deed';
  const fileInput = document.getElementById('intakeFileInput');

  if (!dag || !mouza || !deedNo || !seller || !buyer) {
    alert(getLanguage() === 'bn' ? 'অনুগ্রহ করে আবশ্যকীয় ঘরগুলো পূরণ করুন।' : 'Please fill all required fields.');
    return;
  }

  let docFile = null;
  if (fileInput && fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    const validation = await validateUploadedDocument(file, docCategory);
    if (!validation.isValid) {
      alert((getLanguage() === 'bn' ? 'ফাইল প্রত্যাখ্যাত: ' : 'File Rejected: ') + validation.error);
      return;
    }
    docFile = {
      ...validation.document,
      timestamp: new Date().toISOString()
    };
  }

  repo.registerManualRecord({
    plotDagNo: dag,
    mouza: mouza,
    district: district,
    khatianNo: khatian,
    deedNo: deedNo,
    deedDate: deedDate,
    seller: seller,
    buyer: buyer,
    area: area,
    mutationStatus: mutationStatus,
    docFile: docFile,
    docCategory: docCategory
  });

  window.appCloseModal();
  switchTab('parcels');
  alert(getLanguage() === 'bn' 
    ? `দাগ নং ${dag} (${mouza}) এর জন্য দলিল ${deedNo} সফলভাবে যুক্ত হয়েছে এবং বিশ্লেষণ সম্পন্ন হয়েছে!` 
    : `Deed ${deedNo} for Dag ${dag} (${mouza}) recorded successfully! Deterministic fraud analysis executed.`
  );
};

// ==========================================
// PDF AUTO-INTAKE — detect every field in a land-file PDF and add it to the system
// ==========================================
const escHtml = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Validate → parse → import one PDF. Returns { ok, file, parsed, alert, error }. Call repo.recalculateAllAlerts() afterwards when batching. */
async function autoImportPdf(file, validatedDoc = null, { recalc = true } = {}) {
  let doc = validatedDoc;
  if (!doc) {
    const v = await validateUploadedDocument(file, 'Complete Land File (auto-detected)');
    if (!v.isValid) return { ok: false, file, error: v.error };
    doc = v.document;
  }
  if (doc.extension !== '.pdf') {
    return { ok: false, file, error: 'Auto-detection works on PDF files only. Use "Input Land Record" for Word documents.' };
  }
  const parsed = await parseLandFilePdf(file);
  if (!parsed.ok) return { ok: false, file, error: parsed.error || 'Could not detect land-file fields.', parsed };

  const docMeta = { ...doc, uploadedByRole: currentUser ? currentUser.role : repo.getSettings().currentReviewerRole };
  repo.importParsedLandFile(parsed, docMeta, { recalc });
  const alert = recalc ? repo.getAlerts().find(x => x.syntheticParcelKey === parsed.parcelKey) : null;
  return { ok: true, file, parsed, alert };
}

function riskOf(parcelKey) {
  const a = repo.getAlerts().find(x => x.syntheticParcelKey === parcelKey);
  return a ? { score: a.score, severity: a.severity, rules: a.rulesTriggered.map(r => r.ruleId) } : { score: 0, severity: 'LOW', rules: [] };
}

function renderImportResultCard(r, compact = false) {
  const fname = escHtml(r.file?.name || '');
  if (!r.ok) {
    return `
      <div class="doc-upload-error-banner" style="margin-bottom: 10px;">
        <div style="display:flex;align-items:center;gap:8px;font-weight:700;margin-bottom:4px;"><span>❌</span><span>${fname}</span></div>
        <div>${escHtml(r.error)}</div>
      </div>`;
  }
  const p = r.parsed, d = p.deed;
  const risk = riskOf(p.parcelKey);
  const badge = risk.severity === 'HIGH' ? 'badge-high' : risk.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low';
  const ts = p.testSheet && typeof p.testSheet.score === 'number' ? p.testSheet : null;
  const tsOk = ts && ts.score === risk.score;
  const fields = [
    ['Parcel Key', p.parcelKey], ['Deed No.', d.no], ['Date', d.date], ['Seller', d.seller], ['Buyer', d.buyer],
    ['Mouza', d.mouza], ['Plot / Khatian', `${d.plot} / ${p.khatian}`], ['Area (scanned copy)', `${d.area} dec`],
    ['Registry volume area', d.volumeArea != null ? `${d.volumeArea} dec` : '—'],
    ['Mutation', p.mutation && p.mutation.status ? `${p.mutation.status} · ${p.mutation.area ?? '—'} dec · buyer ${p.mutation.buyer || '—'}` : 'RECORD_MISSING'],
    ['Survey rows', (p.porcha.rows || []).map(x => `${x.type} ${x.area}`).join(' · ') || '—'],
    ['Other deeds (NEC)', (p.nec.otherDeeds || []).length ? p.nec.otherDeeds.map(x => `${x.deedNo} → ${x.buyer}`).join(', ') : 'none'],
    ['Chain of title', `${(p.chain || []).length} transfer(s)`],
    ['Hash check', d.scannedSha && d.registrySha ? (d.scannedSha === d.registrySha ? 'Match' : 'MISMATCH') : 'not stated'],
  ];
  return `
    <div class="doc-upload-success-banner" style="margin-bottom: 12px; text-align:left;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:8px;font-weight:700;"><span>✅</span><span>${fname} — detected &amp; added to the system</span></div>
        <span class="badge ${badge}" style="font-size:11px;">${risk.severity} · ${risk.score}/100</span>
      </div>
      ${risk.rules.length ? `<div style="font-size:11px;margin-bottom:6px;color:var(--zinc-300);">Rules triggered: <strong>${risk.rules.map(escHtml).join(', ')}</strong></div>` : `<div style="font-size:11px;margin-bottom:6px;color:var(--emerald-accent);">No rules triggered.</div>`}
      ${ts ? `<div style="font-size:11px;margin-bottom:6px;color:${tsOk ? 'var(--emerald-accent)' : 'var(--gold-primary)'};">Test sheet in PDF expects ${ts.score}/100 ${ts.severity || ''} — ${tsOk ? 'matches ✓' : 'DIFFERS from computed result'}</div>` : ''}
      ${compact ? '' : `
      <div style="display:grid;grid-template-columns:150px 1fr;gap:3px 12px;font-size:11px;margin-top:8px;">
        ${fields.map(([k, v]) => `<div style="color:var(--zinc-400);">${escHtml(k)}</div><div class="font-mono" style="color:#fff;word-break:break-all;">${escHtml(v)}</div>`).join('')}
      </div>`}
      ${p.warnings && p.warnings.length ? `<div style="font-size:11px;margin-top:8px;color:var(--gold-primary);">⚠ ${p.warnings.map(escHtml).join(' ')}</div>` : ''}
      ${compact ? `<div style="font-size:11px;margin-top:6px;color:var(--zinc-300);">${fields.slice(0, 5).map(([k, v]) => `<strong>${escHtml(k)}:</strong> ${escHtml(v)}`).join(' &nbsp;•&nbsp; ')}</div>
      <div style="margin-top:8px;"><button type="button" class="btn-secondary" style="padding:4px 10px;font-size:11px;" onclick="window.appGoTab('parcels')">View in Parcel Explorer →</button></div>` : ''}
    </div>`;
}

window.appGoTab = function (tab) { window.appCloseModal(); switchTab(tab); };

async function runPdfImport(fileList) {
  const out = document.getElementById('pdfImportResults');
  const drop = document.getElementById('pdfDropZone');
  const files = Array.from(fileList || []);
  if (!files.length || !out) return;

  out.innerHTML = `<div style="padding:10px;font-size:12px;color:var(--gold-primary);display:flex;align-items:center;gap:8px;"><span class="status-pulse-dot pulse-gold"></span><span>Reading ${files.length} file(s), detecting fields and running the rule engine…</span></div>`;
  if (drop) drop.style.opacity = '0.6';

  const results = [];
  for (const f of files) {
    try { results.push(await autoImportPdf(f, null, { recalc: false })); }
    catch (e) { results.push({ ok: false, file: f, error: 'Unexpected error: ' + (e && e.message ? e.message : e) }); }
  }
  repo.recalculateAllAlerts(); // once, after the whole batch
  updateBadge();

  const okCount = results.filter(r => r.ok).length;
  out.innerHTML = `
    <div style="font-size:12px;font-weight:700;color:#fff;margin:6px 0 10px;">
      ${okCount} of ${results.length} file(s) imported
    </div>
    ${results.map(r => renderImportResultCard(r)).join('')}
    ${okCount ? `<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px;">
      <button type="button" class="btn-secondary" onclick="window.appGoTab('cases')">Open Case Management</button>
      <button type="button" class="btn-gold" onclick="window.appGoTab('parcels')">View Parcels →</button>
    </div>` : ''}`;
  if (drop) drop.style.opacity = '1';
  const input = document.getElementById('pdfImportInput');
  if (input) input.value = '';
}

function openPdfImportModal() {
  modalContainer.style.display = 'flex';
  modalContainer.className = 'modal-overlay';
  modalContainer.innerHTML = `
    <div class="modal-content" style="padding: 28px; max-width: 760px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1px solid var(--border-subtle);padding-bottom:16px;margin-bottom:18px;">
        <div>
          <span class="badge badge-gold" style="font-size:10px;margin-bottom:6px;">AUTO-INTAKE</span>
          <h2 style="font-size:20px;font-weight:800;color:#fff;margin-top:4px;">Import Land File PDF(s)</h2>
          <div style="font-size:12px;color:var(--zinc-400);">Drop one or more land-file PDFs. The system reads the deed, porcha, mutation sheet, NEC search and chain of title, loads everything and runs the fraud rules automatically.</div>
        </div>
        <button onclick="window.appCloseModal()" style="background:none;border:none;color:var(--zinc-400);font-size:20px;cursor:pointer;">✕</button>
      </div>
      <label id="pdfDropZone" for="pdfImportInput" style="display:block;border:2px dashed var(--border-subtle);border-radius:12px;padding:34px 16px;text-align:center;cursor:pointer;transition:all .15s;">
        <div style="font-size:34px;">📄</div>
        <div style="font-weight:700;color:#fff;margin-top:6px;">Drag &amp; drop PDF files here, or click to browse</div>
        <div style="font-size:11px;color:var(--zinc-400);margin-top:4px;">Multiple files allowed · PDF with a text layer · max 15 MB each · processed locally in your browser</div>
        <input type="file" id="pdfImportInput" accept=".pdf,application/pdf" multiple style="display:none;">
      </label>
      <div id="pdfImportResults" style="margin-top:16px;"></div>
    </div>`;

  const zone = document.getElementById('pdfDropZone');
  const input = document.getElementById('pdfImportInput');
  input.addEventListener('change', () => runPdfImport(input.files));
  ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.style.borderColor = 'var(--gold-primary)'; zone.style.background = 'rgba(212,175,55,0.06)'; }));
  ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.style.borderColor = ''; zone.style.background = ''; }));
  zone.addEventListener('drop', e => runPdfImport(e.dataTransfer.files));
}
window.appOpenPdfImport = openPdfImportModal;

// Manual-intake form: picking a PDF pre-fills every field it can detect
modalContainer.addEventListener('change', async (e) => {
  if (!e.target || e.target.id !== 'intakeFileInput') return;
  const file = e.target.files && e.target.files[0];
  if (!file || !/\.pdf$/i.test(file.name)) return;
  const parsed = await parseLandFilePdf(file);
  if (!parsed.ok) return;
  const d = parsed.deed;
  const set = (id, v) => { const el = document.getElementById(id); if (el && v !== null && v !== undefined && v !== '') el.value = v; };
  set('intakePlotDag', d.plot); set('intakeMouza', d.mouza); set('intakeDistrict', d.district);
  set('intakeKhatian', parsed.khatian); set('intakeDeedNo', d.no); set('intakeDeedDate', d.date);
  set('intakeSeller', d.seller); set('intakeBuyer', d.buyer); set('intakeArea', d.area);
  if (parsed.mutation && parsed.mutation.status) {
    const sel = document.getElementById('intakeMutationStatus');
    if (sel && Array.from(sel.options).some(o => o.value === parsed.mutation.status)) sel.value = parsed.mutation.status;
  }
  const cat = document.getElementById('intakeDocCategory');
  if (cat) cat.value = 'Registered Sale Deed';
});

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
    localStorage.setItem('landsentry_sidebar_collapsed', isSidebarCollapsed ? '1' : '0');
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
    localStorage.setItem('landsentry_theme', currentTheme);
  } catch (e) {}
}

// ==========================================
// CINEMATIC OPENING INTRO SPLASH & LOGO TRANSITION
// ==========================================
function showSplashAnimation() {
  if (!introSplash) {
    if (currentUser) showAppUI();
    else showLoginUI();
    return;
  }
  introSplash.style.display = 'flex';
  introSplash.classList.remove('fade-out');

  // Automatically fade out after 2.4s and smoothly reveal main app or login
  setTimeout(() => {
    dismissSplashAnimation();
  }, 2400);
}

function dismissSplashAnimation() {
  if (!introSplash) return;
  introSplash.classList.add('fade-out');
  setTimeout(() => {
    introSplash.style.display = 'none';
    if (currentUser) {
      showAppUI();
    } else {
      showLoginUI();
    }
  }, 750);
}

// ==========================================
// AUTHENTICATION & SESSION UI CONTROLLERS
// ==========================================
function showAppUI() {
  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) {
    loginScreen.classList.add('hidden');
    loginScreen.style.display = 'none';
  }
  if (appSidebar) appSidebar.style.display = 'flex';
  if (appTopbar) appTopbar.style.display = 'flex';
  if (appMain) appMain.style.display = 'block';
  const appFooter = document.getElementById('appFooter');
  if (appFooter) appFooter.style.display = 'flex';

  updateUserDisplay();
  renderView();
}

function showLoginUI() {
  if (appSidebar) appSidebar.style.display = 'none';
  if (appTopbar) appTopbar.style.display = 'none';
  if (appMain) appMain.style.display = 'none';
  const appFooter = document.getElementById('appFooter');
  if (appFooter) appFooter.style.display = 'none';

  // Close any open modals
  window.appCloseModal();

  // Reset navigation tab
  currentTab = 'overview';

  // Clear session state
  currentUser = null;
  try {
    sessionStorage.removeItem('landsentry_user');
  } catch (e) {}

  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) {
    loginScreen.classList.remove('hidden');
    loginScreen.style.display = 'flex';
  }

  // Reset all login form fields to clean initial state
  const loginForm = document.getElementById('loginForm');
  if (loginForm && typeof loginForm.reset === 'function') {
    loginForm.reset();
  }

  const roleSelect = document.getElementById('loginRole');
  if (roleSelect) roleSelect.selectedIndex = 0;

  const usernameInput = document.getElementById('loginUsername');
  if (usernameInput) {
    usernameInput.value = '';
    usernameInput.defaultValue = '';
  }

  const passwordInput = document.getElementById('loginPassword');
  if (passwordInput) {
    passwordInput.value = '';
    passwordInput.defaultValue = '';
    passwordInput.type = 'password';
    passwordInput.setAttribute('type', 'password');
  }

  const eyeHidden = document.getElementById('eyeIconHidden');
  if (eyeHidden) eyeHidden.style.display = 'block';

  const eyeVisible = document.getElementById('eyeIconVisible');
  if (eyeVisible) eyeVisible.style.display = 'none';

  const errDiv = document.getElementById('loginError');
  if (errDiv) {
    errDiv.style.display = 'none';
    errDiv.textContent = '';
  }

  // Clear role displays
  const roleDisplayLabel = document.getElementById('roleDisplayLabel');
  if (roleDisplayLabel) roleDisplayLabel.textContent = '';
  const roleAvatarCircle = document.getElementById('roleAvatarCircle');
  if (roleAvatarCircle) roleAvatarCircle.textContent = 'LS';
  const sidebarLoggedInAs = document.getElementById('sidebarLoggedInAs');
  if (sidebarLoggedInAs) sidebarLoggedInAs.innerHTML = '';
}

function updateUserDisplay() {
  if (!currentUser) return;
  const roleDisplayLabel = document.getElementById('roleDisplayLabel');
  if (roleDisplayLabel) {
    roleDisplayLabel.textContent = getLanguage() === 'bn' ? (currentUser.displayNameBn || currentUser.role) : currentUser.role;
  }
  const roleAvatarCircle = document.getElementById('roleAvatarCircle');
  if (roleAvatarCircle) {
    const initials = currentUser.role === 'Sub-Registrar' ? 'SR' : currentUser.role === 'AC Land Officer' ? 'ACL' : 'LA';
    roleAvatarCircle.textContent = initials;
  }
  const sidebarLoggedInAs = document.getElementById('sidebarLoggedInAs');
  if (sidebarLoggedInAs) {
    sidebarLoggedInAs.innerHTML = `Signed in as: <strong style="color:var(--gold-primary);">${currentUser.username}</strong><br><span style="font-size:10px; color:var(--text-muted);">${currentUser.office || ''}</span>`;
  }
}

function executeLogin() {
  const roleSelect = document.getElementById('loginRole');
  const userIn = document.getElementById('loginUsername');
  const passIn = document.getElementById('loginPassword');
  const errDiv = document.getElementById('loginError');

  const role = roleSelect ? roleSelect.value : '';
  const username = userIn ? userIn.value.trim() : '';
  const password = passIn ? passIn.value : '';

  const auth = authenticate(role, username, password);
  if (!auth.success) {
    if (errDiv) {
      errDiv.textContent = auth.message || 'Authentication failed. Please check credentials.';
      errDiv.style.display = 'block';
    }
    return;
  }

  // Auth successful
  currentUser = auth.user;
  try {
    sessionStorage.setItem('landsentry_user', JSON.stringify(currentUser));
  } catch (e) {}

  if (errDiv) errDiv.style.display = 'none';

  // Update repository settings with current role
  repo.updateSettings({ currentReviewerRole: currentUser.role });

  showAppUI();
}

// Global window dispatcher
window.appSwitchTab = switchTab;
window.appToggleTheme = toggleTheme;
window.appToggleSidebar = toggleSidebar;
window.appReplaySplash = showSplashAnimation;

// Event Listeners initialization
function initEvents() {
  // Admin Login Events
  const loginTogglePassword = document.getElementById('loginTogglePassword');
  const loginPasswordInput = document.getElementById('loginPassword');
  const eyeHidden = document.getElementById('eyeIconHidden');
  const eyeVisible = document.getElementById('eyeIconVisible');

  if (loginTogglePassword && loginPasswordInput) {
    loginTogglePassword.addEventListener('click', () => {
      const isPass = loginPasswordInput.type === 'password';
      loginPasswordInput.type = isPass ? 'text' : 'password';
      if (eyeHidden) eyeHidden.style.display = isPass ? 'none' : 'block';
      if (eyeVisible) eyeVisible.style.display = isPass ? 'block' : 'none';
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      executeLogin();
    });
  }

  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', executeLogin);
  }

  if (loginPasswordInput) {
    loginPasswordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeLogin();
    });
  }

  const loginUsernameInput = document.getElementById('loginUsername');
  if (loginUsernameInput) {
    loginUsernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeLogin();
    });
  }

  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      currentUser = null;
      try {
        sessionStorage.removeItem('landsentry_user');
      } catch (e) {}
      showLoginUI();
    });
  }

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

  // Splash screen button
  if (btnSkipIntro) {
    btnSkipIntro.addEventListener('click', dismissSplashAnimation);
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

  // Run checks button
  if (btnRunChecks) {
    btnRunChecks.addEventListener('click', () => {
      repo.recalculateAllAlerts();
      renderView();
      alert(t('demoChecksExecuted'));
    });
  }

  // Manual Land Record Intake button
  const btnPdfImport = document.getElementById('btnOpenPdfImportModal');
  if (btnPdfImport) btnPdfImport.addEventListener('click', openPdfImportModal);

  const btnManualIntake = document.getElementById('btnOpenManualIntakeModal');
  if (btnManualIntake) {
    btnManualIntake.addEventListener('click', openManualIntakeModal);
  }

  // Bell button opens cases tab
  const bellBtn = document.getElementById('alertsBellBtn');
  if (bellBtn) {
    bellBtn.addEventListener('click', () => switchTab('cases'));
  }

  // Language Switcher
  if (btnLanguageToggle) {
    btnLanguageToggle.addEventListener('click', () => {
      const nextLang = getLanguage() === 'en' ? 'bn' : 'en';
      setLanguage(nextLang);
      updateLanguageUI();
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
    const savedTheme = localStorage.getItem('landsentry_theme') || 'dark';
    toggleTheme(savedTheme);

    const savedSidebar = localStorage.getItem('landsentry_sidebar_collapsed');
    if (savedSidebar === '1') {
      toggleSidebar(true);
    }
  } catch (e) {}
}

export function updateLanguageUI() {
  const lang = getLanguage();
  if (currentLangLabel) {
    currentLangLabel.textContent = lang === 'en' ? 'বাংলা' : 'English';
  }

  // Topbar and Header
  const headerTrackLabel = document.getElementById('headerTrackLabel');
  if (headerTrackLabel) headerTrackLabel.textContent = t('trackLabel');
  const btnRunChecks = document.getElementById('btnRunChecks');
  if (btnRunChecks) btnRunChecks.textContent = t('runRecheck');
  const btnManualIntakeLabel = document.getElementById('btnOpenManualIntakeModal');
  if (btnManualIntakeLabel) btnManualIntakeLabel.textContent = lang === 'bn' ? '➕ জমির রেকর্ড ইনপুট' : '➕ Input Land Record';
  const btnClearHistoryHeader = document.getElementById('btnClearHistoryBtnHeader');
  if (btnClearHistoryHeader) btnClearHistoryHeader.textContent = lang === 'bn' ? '📜 ইতিহাস মুছুন' : '📜 Clear History';
  const globalSearchInput = document.getElementById('globalSearchInput');
  if (globalSearchInput) globalSearchInput.placeholder = t('searchPlaceholder');

  // Intro splash motto
  const introMottoEl = document.querySelector('.intro-motto');
  if (introMottoEl) introMottoEl.textContent = t('introMotto');
  if (btnSkipIntro) btnSkipIntro.textContent = t('enterDashboard');

  // Sidebar navigation labels
  const navMap = {
    overview: 'navDashboard',
    parcels: 'navParcels',
    integrity: 'navIntegrity',
    'double-selling': 'navDoubleSelling',
    'rapid-transfers': 'navRapidTransfers',
    reconciliation: 'navReconciliation',
    cases: 'navCases',
    methodology: 'navMethodology'
  };

  if (sidebarNav) {
    const buttons = sidebarNav.querySelectorAll('.sidebar-btn');
    buttons.forEach(btn => {
      const tab = btn.getAttribute('data-tab');
      const labelSpan = btn.querySelector('.sidebar-btn-label');
      if (tab && labelSpan && navMap[tab]) {
        labelSpan.textContent = t(navMap[tab]);
      }
    });
  }

  // Sidebar footer controls
  if (themeToggleLabel) {
    themeToggleLabel.textContent = currentTheme === 'dark' ? t('lightMode') : t('darkMode');
  }
  if (collapseToggleLabel) {
    collapseToggleLabel.textContent = isSidebarCollapsed ? t('maximizeSidebar') : t('minimizeSidebar');
  }

  const btnClearHistorySidebar = document.getElementById('btnClearHistoryBtnSidebar');
  if (btnClearHistorySidebar) {
    const lbl = btnClearHistorySidebar.querySelector('.sidebar-control-label');
    if (lbl) lbl.textContent = lang === 'bn' ? 'ইতিহাস মুছুন' : 'Clear History';
  }
  const btnClearUploadedDocs = document.getElementById('btnClearUploadedDocs');
  if (btnClearUploadedDocs) {
    const lbl = btnClearUploadedDocs.querySelector('.sidebar-control-label');
    if (lbl) lbl.textContent = lang === 'bn' ? 'সব আপলোড মুছুন' : 'Clear Uploaded PDFs';
  }

  // Sidebar brand subtitle
  const sidebarBrandSub = document.getElementById('sidebarBrandSub');
  if (sidebarBrandSub) sidebarBrandSub.textContent = t('brandSub');

  // Topbar badge
  const topbarBadgeFull = document.getElementById('topbarBadgeFull');
  if (topbarBadgeFull) topbarBadgeFull.textContent = t('demoBadge');
  const topbarBadgeShort = document.getElementById('topbarBadgeShort');
  if (topbarBadgeShort) topbarBadgeShort.textContent = t('demoBadgeShort');

  // Fixed footer status bar
  const footerRulesEngine = document.getElementById('footerRulesEngine');
  if (footerRulesEngine) footerRulesEngine.textContent = t('footerRulesEngine');
  const footerWebCrypto = document.getElementById('footerWebCrypto');
  if (footerWebCrypto) footerWebCrypto.textContent = t('footerWebCrypto');
  const footerSandbox = document.getElementById('footerSandbox');
  if (footerSandbox) footerSandbox.textContent = t('footerSandbox');
  const footerBrand = document.getElementById('footerBrand');
  if (footerBrand) footerBrand.textContent = t('footerBrand');

  // Document title and root lang
  document.documentElement.lang = lang;
  document.title = lang === 'bn' 
    ? 'LandSentry — ভূমি জালিয়াতি ও দ্বৈত-বিক্রয় শনাক্তকরণ ব্যবস্থা | ল্যান্ডটেক ২০২৬' 
    : 'LandSentry — Land Fraud & Double-Selling Detection System | LandTech 2026';

  // Tooltips / title attributes
  const btnLangToggleEl = document.getElementById('btnLanguageToggle');
  if (btnLangToggleEl) {
    btnLangToggleEl.title = lang === 'bn' ? 'Switch to English' : 'ভাষা পরিবর্তন করুন / Switch Language';
  }
  const alertsBellBtnEl = document.getElementById('alertsBellBtn');
  if (alertsBellBtnEl) alertsBellBtnEl.title = t('navCases');
  const mobileMenuBtnEl = document.getElementById('mobileMenuBtn');
  if (mobileMenuBtnEl) mobileMenuBtnEl.title = lang === 'bn' ? 'মেনু খুলুন' : 'Open Navigation Menu';
  const btnThemeToggleEl = document.getElementById('btnThemeToggle');
  if (btnThemeToggleEl) btnThemeToggleEl.title = lang === 'bn' ? 'লাইট / ডার্ক মোড পরিবর্তন' : 'Toggle Light / Dark Mode';
  const btnSidebarCollapseEl = document.getElementById('btnSidebarCollapse');
  if (btnSidebarCollapseEl) btnSidebarCollapseEl.title = lang === 'bn' ? 'সাইডবার ছোট বা বড় করুন' : 'Minimize or Maximize Sidebar';
  const sidebarMobileCloseBtnEl = document.getElementById('sidebarMobileCloseBtn');
  if (sidebarMobileCloseBtnEl) sidebarMobileCloseBtnEl.title = lang === 'bn' ? 'মেনু বন্ধ করুন' : 'Close Menu';

  updateUserDisplay();
  if (currentUser) {
    renderView();
  }
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
  initEvents();
  updateLanguageUI();
  showSplashAnimation();
});
