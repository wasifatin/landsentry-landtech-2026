/**
 * JomiGuard AI — Repository & Persistence Layer (ES Module)
 */

import { 
  SEED_PARCELS, 
  SEED_DEEDS, 
  SEED_REGISTRATIONS, 
  SEED_MUTATIONS, 
  SEED_FINGERPRINTS, 
  SEED_TRANSFERS, 
  SEED_ALERTS, 
  SEED_AUDIT_LOGS, 
  INITIAL_SETTINGS 
} from '../data/seedData.js';
import { evaluateParcelRisk } from '../rules/riskEngine.js';

const STORAGE_KEY_PREFIX = 'jomiguard_';

export class LandRepository {
  constructor() {
    this.parcels = [];
    this.deeds = [];
    this.registrations = [];
    this.mutations = [];
    this.fingerprints = [];
    this.transfers = [];
    this.alerts = [];
    this.auditLogs = [];
    this.uploadedDocs = [];
    this.settings = { ...INITIAL_SETTINGS };
    this.init();
  }

  init() {
    this.loadFromStorage();
  }

  resetToSeed() {
    this.clearAllRecords();
  }

  clearAllRecords() {
    this.parcels = [];
    this.deeds = [];
    this.registrations = [];
    this.mutations = [];
    this.fingerprints = [];
    this.transfers = [];
    this.alerts = [];
    this.auditLogs = [];
    this.uploadedDocs = [];
    this.settings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));
    this.settings.currentReviewerRole = 'Sub-Registrar';

    this.saveToStorage();
    this.addAuditLog('SYSTEM_RESET', 'All records cleared. System ready for live manual file input and dynamic verification.');
  }

  loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const p = localStorage.getItem(`${STORAGE_KEY_PREFIX}parcels`);
        const d = localStorage.getItem(`${STORAGE_KEY_PREFIX}deeds`);
        const r = localStorage.getItem(`${STORAGE_KEY_PREFIX}registrations`);
        const m = localStorage.getItem(`${STORAGE_KEY_PREFIX}mutations`);
        const f = localStorage.getItem(`${STORAGE_KEY_PREFIX}fingerprints`);
        const t = localStorage.getItem(`${STORAGE_KEY_PREFIX}transfers`);
        const a = localStorage.getItem(`${STORAGE_KEY_PREFIX}alerts`);
        const l = localStorage.getItem(`${STORAGE_KEY_PREFIX}auditLogs`);
        const u = localStorage.getItem(`${STORAGE_KEY_PREFIX}uploadedDocs`);
        const s = localStorage.getItem(`${STORAGE_KEY_PREFIX}settings`);

        if (p && d) {
          const loadedParcels = JSON.parse(p);
          // Purge old pre-baked prototype scenarios (e.g. p-001 or Scenario A)
          const hasOldDemoPrototypes = loadedParcels.some(item => item.id === 'p-001' || (item.scenarioTag && item.scenarioTag.includes('Scenario')));
          if (hasOldDemoPrototypes) {
            this.clearAllRecords();
            return;
          }

          this.parcels = loadedParcels;
          const rawDeeds = JSON.parse(d);
          this.deeds = rawDeeds;
          this.registrations = r ? JSON.parse(r) : [];
          this.mutations = m ? JSON.parse(m) : [];
          const rawFps = f ? JSON.parse(f) : [];
          this.fingerprints = rawFps;
          this.transfers = t ? JSON.parse(t) : [];
          this.alerts = a ? JSON.parse(a) : [];
          this.auditLogs = l ? JSON.parse(l) : [];
          if (u) {
            const rawDocs = JSON.parse(u);
            this.uploadedDocs = rawDocs;
          } else {
            this.uploadedDocs = [];
          }
          if (s) this.settings = JSON.parse(s);
          this.saveToStorage();
          return;
        }
      }
    } catch (e) {
      console.warn('LocalStorage unavailable; starting clean.', e);
    }
    this.clearAllRecords();
  }

  saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}parcels`, JSON.stringify(this.parcels));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}deeds`, JSON.stringify(this.deeds));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}registrations`, JSON.stringify(this.registrations));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}mutations`, JSON.stringify(this.mutations));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}fingerprints`, JSON.stringify(this.fingerprints));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}transfers`, JSON.stringify(this.transfers));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}alerts`, JSON.stringify(this.alerts));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}auditLogs`, JSON.stringify(this.auditLogs));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}uploadedDocs`, JSON.stringify(this.uploadedDocs));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}settings`, JSON.stringify(this.settings));
      }
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  getParcels() { return this.parcels; }
  getDeeds() { return this.deeds; }
  getRegistrations() { return this.registrations; }
  getMutations() { return this.mutations; }
  getFingerprints() { return this.fingerprints; }
  getTransfers() { return this.transfers; }
  getAlerts() { return this.alerts; }
  getAuditLogs() { return this.auditLogs; }
  getUploadedDocs(unitId) { 
    if (!unitId) return this.uploadedDocs;
    return this.uploadedDocs.filter(d => d.unitId === unitId);
  }
  addUploadedDoc(doc) {
    this.uploadedDocs.unshift(doc);
    this.saveToStorage();
    this.addAuditLog(
      'DOC_VERIFIED',
      `Verified and archived document ${doc.name} (${doc.category}) with SHA-256: ${doc.sha256.substring(0, 16)}...`
    );
  }

  removeUploadedDoc(docSha256) {
    const doc = this.uploadedDocs.find(d => d.sha256 === docSha256);
    this.uploadedDocs = this.uploadedDocs.filter(d => d.sha256 !== docSha256);
    if (docSha256) {
      this.fingerprints = this.fingerprints.filter(f => f.referenceSha256 !== docSha256 && f.observedSha256 !== docSha256 && f.sourceFileSha256 !== docSha256);
      this.deeds = this.deeds.filter(d => d.documentHash !== docSha256);
    }
    this.recalculateAllAlerts();
    this.saveToStorage();
    if (doc) {
      this.addAuditLog('DOC_REMOVED', `Removed uploaded document ${doc.name} (${doc.category}).`);
    }
  }

  clearUploadedDocs(unitId = null) {
    if (unitId) {
      const removed = this.uploadedDocs.filter(d => d.unitId === unitId);
      const shas = new Set(removed.map(d => d.sha256));
      this.uploadedDocs = this.uploadedDocs.filter(d => d.unitId !== unitId);
      this.fingerprints = this.fingerprints.filter(f => !shas.has(f.referenceSha256) && !shas.has(f.observedSha256));
      this.deeds = this.deeds.filter(d => !shas.has(d.documentHash));
    } else {
      this.uploadedDocs = [];
      this.fingerprints = this.fingerprints.filter(f => !f.syntheticContent || !f.syntheticContent.includes('MANUAL UPLOAD INTAKE'));
      this.deeds = this.deeds.filter(d => !d.fileName || (!d.fileName.toLowerCase().endsWith('.pdf') && !d.fileName.toLowerCase().endsWith('.docx')));
    }
    this.recalculateAllAlerts();
    this.saveToStorage();
    this.addAuditLog('DOCS_CLEARED', `Cleared uploaded documents${unitId ? ` for ${unitId}` : ''}.`);
  }

  clearUploadedPdfs() {
    this.uploadedDocs = this.uploadedDocs.filter(item => !item.name || !item.name.toLowerCase().endsWith('.pdf'));
    this.deeds = this.deeds.filter(item => !item.fileName || !item.fileName.toLowerCase().endsWith('.pdf'));
    this.fingerprints = this.fingerprints.filter(item => !item.syntheticContent || !item.syntheticContent.toLowerCase().includes('.pdf'));
    this.recalculateAllAlerts();
    this.saveToStorage();
    this.addAuditLog('PDFS_CLEARED', 'All uploaded PDF documents and associated records have been removed.');
  }

  removeParcel(parcelId) {
    const parcel = this.parcels.find(p => p.id === parcelId || p.syntheticParcelKey === parcelId);
    if (!parcel) return false;
    const key = parcel.syntheticParcelKey;

    this.parcels = this.parcels.filter(p => p.id !== parcel.id && p.syntheticParcelKey !== key);
    this.deeds = this.deeds.filter(d => d.syntheticParcelKey !== key);
    this.registrations = this.registrations.filter(r => r.syntheticParcelKey !== key);
    this.mutations = this.mutations.filter(m => m.syntheticParcelKey !== key);
    this.transfers = this.transfers.filter(t => t.syntheticParcelKey !== key);
    this.alerts = this.alerts.filter(a => a.syntheticParcelKey !== key);
    this.fingerprints = this.fingerprints.filter(f => !f.syntheticContent || !f.syntheticContent.includes(key));
    this.uploadedDocs = this.uploadedDocs.filter(d => !d.associatedParcelKey || d.associatedParcelKey !== key);

    this.recalculateAllAlerts();
    this.saveToStorage();
    this.addAuditLog('RECORD_REMOVED', `Removed land parcel record ${key} (Plot ${parcel.plotDagNo}, Mouza: ${parcel.demoMouza}) and all associated records.`);
    return true;
  }

  removeDeed(deedId) {
    const deed = this.deeds.find(d => d.id === deedId || d.deedNo === deedId);
    if (!deed) return false;

    this.deeds = this.deeds.filter(d => d.id !== deed.id && d.deedNo !== deed.deedNo);
    this.registrations = this.registrations.filter(r => r.deedNo !== deed.deedNo && r.deedRef !== deed.deedNo);
    this.mutations = this.mutations.filter(m => m.deedRef !== deed.deedNo);
    this.transfers = this.transfers.filter(t => t.deedNo !== deed.deedNo);
    if (deed.documentHash) {
      this.fingerprints = this.fingerprints.filter(f => f.referenceSha256 !== deed.documentHash && f.observedSha256 !== deed.documentHash);
      this.uploadedDocs = this.uploadedDocs.filter(u => u.sha256 !== deed.documentHash);
    }

    this.recalculateAllAlerts();
    this.saveToStorage();
    this.addAuditLog('DEED_REMOVED', `Removed deed ${deed.deedNo} and updated fraud risk calculations.`);
    return true;
  }

  clearHistory() {
    this.auditLogs = [];
    this.addAuditLog('HISTORY_CLEARED', 'Program history and audit log trail cleared.');
    this.saveToStorage();
  }

  registerManualRecord(data) {
    const {
      plotDagNo = '101',
      mouza = 'Dhaka Central',
      district = 'Dhaka',
      khatianNo = 'K-101',
      deedNo = `DEED-${Date.now().toString().slice(-4)}`,
      deedDate = new Date().toISOString().split('T')[0],
      seller = 'Seller Name',
      buyer = 'Buyer Name',
      area = 10.0,
      mutationStatus = 'MUTATION_APPROVED',
      docFile = null,
      docCategory = 'Registered Sale Deed'
    } = data;

    const areaNum = parseFloat(area) || 10.0;
    const cleanDag = String(plotDagNo).trim();
    const cleanMouza = String(mouza).trim();

    // 1. Find or create parcel
    let parcel = this.parcels.find(p => String(p.plotDagNo).trim() === cleanDag && p.demoMouza === cleanMouza);
    if (!parcel) {
      const pId = `parcel-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const parcelKey = `PARCEL-${cleanMouza.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'DH')}-${cleanDag}`;
      parcel = {
        id: pId,
        syntheticParcelKey: parcelKey,
        demoDistrict: district,
        demoMouza: cleanMouza,
        plotDagNo: cleanDag,
        primaryKhatianRef: khatianNo,
        declaredArea: areaNum,
        areaUnit: 'Decimals',
        status: 'ACTIVE',
        currentOwnerAlias: buyer,
        surveyGenerations: [
          { surveyType: 'RS', dagNo: cleanDag, khatianNo: khatianNo, recordedAreaDecimal: areaNum, surveyYear: '2024', remarks: 'Manual Registration Record' }
        ]
      };
      this.parcels.push(parcel);
    } else {
      parcel.currentOwnerAlias = buyer;
    }

    // 2. Add deed
    const dId = `deed-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const deed = {
      id: dId,
      deedNo: deedNo,
      deedRef: deedNo,
      syntheticParcelKey: parcel.syntheticParcelKey,
      subRegistryOffice: `${district} Sub-Registry Office`,
      sourceRegistryOffice: `${district} Sub-Registry Office`,
      deedDate: deedDate,
      deedType: 'Saf-Kabala (Outright Sale)',
      sellerAlias: seller,
      buyerAlias: buyer,
      conveyedAreaDecimal: areaNum,
      declaredArea: areaNum,
      saleStatus: 'REGISTERED',
      documentHash: docFile?.sha256 || 'SHA256-MANUAL-INTAKE',
      fileName: docFile?.name || ''
    };
    this.deeds.push(deed);

    // 3. Add registration record
    const rId = `reg-${Date.now()}`;
    this.registrations.push({
      id: rId,
      syntheticParcelKey: parcel.syntheticParcelKey,
      deedNo: deedNo,
      deedRef: deedNo,
      transferDate: deedDate,
      sellerAlias: seller,
      buyerAlias: buyer,
      area: areaNum,
      areaUnit: 'Decimals',
      registrationStatus: 'REGISTERED'
    });

    // 4. Add mutation record based on selected status
    const mId = `mut-${Date.now()}`;
    const isPresent = mutationStatus !== 'RECORD_MISSING';
    this.mutations.push({
      id: mId,
      syntheticParcelKey: parcel.syntheticParcelKey,
      caseNo: `MUT-${Date.now().toString().slice(-5)}`,
      deedRef: isPresent ? deedNo : 'N/A',
      mutationDate: deedDate,
      applicantAlias: buyer,
      buyerAlias: buyer,
      area: areaNum,
      areaUnit: 'Decimals',
      isRecordPresent: isPresent,
      mutationStatus: isPresent ? mutationStatus : 'RECORD_MISSING'
    });

    // 5. Add transfer entry
    this.transfers.push({
      id: `tr-${Date.now()}`,
      syntheticParcelKey: parcel.syntheticParcelKey,
      eventDate: deedDate,
      deedId: deedNo,
      sellerAlias: seller,
      buyerAlias: buyer,
      area: areaNum,
      status: 'NORMAL_TRANSFER'
    });

    // 6. If document uploaded, add fingerprint
    if (docFile && docFile.sha256) {
      this.fingerprints.push({
        id: `fp-${Date.now()}`,
        documentTitle: `${docCategory} — ${deedNo}`,
        referenceSha256: docFile.sha256,
        observedSha256: docFile.sha256,
        syntheticContent: `[MANUAL UPLOAD INTAKE: ${docFile.name} | Size: ${docFile.sizeFormatted} | Category: ${docCategory} | SHA-256: ${docFile.sha256}]`,
        integrityStatus: 'MATCH',
        notes: `Document verified via magic byte signature analysis as ${docFile.detectedType || 'Legitimate document'}.`
      });
      this.addUploadedDoc({
        ...docFile,
        unitId: 'parcels',
        category: docCategory,
        uploadedByRole: this.settings.currentReviewerRole
      });
    }

    // 7. Deterministic re-evaluation of fraud rules
    this.recalculateAllAlerts();
    this.saveToStorage();
    this.addAuditLog('MANUAL_INTAKE', `Manually registered deed ${deedNo} for Dag ${cleanDag} (${cleanMouza}). Real-time fraud analysis executed.`);

    return parcel;
  }
  /**
   * Load a land file that was auto-detected from a PDF (see pdfIngest.js).
   * Idempotent: re-importing the same parcel replaces its earlier PDF import.
   * Pass { recalc:false } when importing a batch, then call recalculateAllAlerts() once.
   */
  importParsedLandFile(parsed, docMeta = null, { recalc = true } = {}) {
    const key = parsed.parcelKey;
    const d = parsed.deed;
    const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    const SRC = 'PDF_IMPORT';

    // 1. Replace any earlier PDF import of this same parcel
    const old = this.parcels.find(p => p.syntheticParcelKey === key && p.importSource === SRC);
    if (old) {
      this.parcels = this.parcels.filter(p => p !== old);
      this.deeds = this.deeds.filter(x => !(x.syntheticParcelKey === key && x.importSource === SRC));
      this.registrations = this.registrations.filter(x => !(x.syntheticParcelKey === key && x.importSource === SRC));
      this.mutations = this.mutations.filter(x => !(x.syntheticParcelKey === key && x.importSource === SRC));
      this.transfers = this.transfers.filter(x => !(x.syntheticParcelKey === key && x.importSource === SRC));
      this.fingerprints = this.fingerprints.filter(x => !(x.importSource === SRC && x.syntheticContent && x.syntheticContent.includes(key)));
      this.uploadedDocs = this.uploadedDocs.filter(x => x.associatedParcelKey !== key);
    }

    // 2. Parcel (+ survey generations CS/SA/RS/BS)
    let parcel = this.parcels.find(p => p.syntheticParcelKey === key);
    const surveys = (parsed.porcha.rows || []).map(r => ({
      surveyType: r.type, dagNo: d.plot, khatianNo: parsed.khatian,
      recordedAreaDecimal: r.area, surveyYear: r.year, remarks: r.remarks || ''
    }));
    if (!parcel) {
      parcel = {
        id: `parcel-${uid()}`, syntheticParcelKey: key, demoDistrict: d.district, demoMouza: d.mouza,
        plotDagNo: String(d.plot), surveyGenerations: surveys, primaryKhatianRef: parsed.khatian,
        declaredArea: d.area, areaUnit: 'Decimals', status: 'ACTIVE', currentOwnerAlias: d.buyer,
        scenarioTag: 'Auto-imported from PDF', importSource: SRC
      };
      this.parcels.push(parcel);
    } else {
      parcel.currentOwnerAlias = d.buyer;
      if (surveys.length) parcel.surveyGenerations = surveys;
    }
    const registryOffice = parsed.registryOffice ? `${parsed.registryOffice} Sub-Registry Office` : `${d.district} Sub-Registry Office`;

    // 3. Main deed + every other registered deed found by the NEC / Form 52 search
    const addDeed = (deed) => {
      if (this.deeds.some(x => x.syntheticParcelKey === key && x.deedNo === deed.deedNo)) return;
      this.deeds.push({ id: `deed-${uid()}`, parcelId: parcel.id, syntheticParcelKey: key, importSource: SRC, ...deed });
    };
    addDeed({
      deedNo: d.no, deedRef: d.no, deedType: d.type || 'Saf-Kabala (Sale Deed)', deedDate: d.date,
      sellerAlias: d.seller, buyerAlias: d.buyer, conveyedAreaDecimal: d.area, declaredArea: d.area,
      registryVolumeAreaDecimal: d.volumeArea ?? null, saleStatus: d.status === 'REGISTERED' ? 'REGISTERED' : (d.status || 'REGISTERED'),
      sourceRegistryOffice: registryOffice, subRegistryOffice: registryOffice,
      documentHash: docMeta?.sha256 || 'SHA256-PDF-IMPORT', fileName: docMeta?.name || ''
    });
    (parsed.nec.otherDeeds || []).forEach(o => {
      const leg = (parsed.chain || []).find(c => c.deedNo === o.deedNo);
      addDeed({
        deedNo: o.deedNo, deedRef: o.deedNo, deedType: 'Registered deed (found via NEC / Form 52 search)', deedDate: o.date,
        sellerAlias: leg ? leg.seller : 'Not stated in NEC search', buyerAlias: o.buyer,
        conveyedAreaDecimal: null, declaredArea: '—', saleStatus: o.status === 'REGISTERED' ? 'REGISTERED' : o.status,
        sourceRegistryOffice: registryOffice, subRegistryOffice: registryOffice,
        documentHash: '', fileName: ''
      });
    });

    // 4. Registration record (what the Sub-Registry scanned copy says)
    this.registrations.push({
      id: `reg-${uid()}`, parcelId: parcel.id, syntheticParcelKey: key, importSource: SRC,
      deedNo: d.no, deedRef: d.no, transferDate: d.date, sellerAlias: d.seller, buyerAlias: d.buyer,
      area: d.area, areaUnit: 'Decimals', registrationStatus: d.status, surveyKhatianRef: parsed.khatian,
      subRegistryOffice: registryOffice
    });

    // 5. Mutation record (AC Land)
    const m = parsed.mutation && parsed.mutation.status ? parsed.mutation : null;
    this.mutations.push({
      id: `mut-${uid()}`, parcelId: parcel.id, syntheticParcelKey: key, importSource: SRC,
      caseNo: m?.caseNo || 'N/A', deedRef: m ? (m.deedRef || d.no) : 'N/A', mutationDate: d.date,
      applicantAlias: m?.buyer || '', buyerAlias: m?.buyer || '', sellerAlias: d.seller,
      area: m?.area ?? 0, areaUnit: 'Decimals', isRecordPresent: !!m,
      mutationStatus: m ? m.status : 'RECORD_MISSING', dcrNo: m?.dcr || '',
      surveyKhatianRef: parsed.khatian, acLandOffice: parsed.landOffice || ''
    });

    // 6. Chain of title → transfer events (feeds the rapid-transfer rule)
    (parsed.chain || []).forEach(c => {
      this.transfers.push({
        id: `tr-${uid()}`, parcelId: parcel.id, syntheticParcelKey: key, importSource: SRC,
        eventDate: c.date, deedId: c.deedNo, deedNo: c.deedNo, sellerAlias: c.seller, buyerAlias: c.buyer,
        area: c.deedNo === d.no ? d.area : null, status: 'NORMAL_TRANSFER'
      });
    });

    // 7. Document fingerprint: printed scanned-copy hash vs registry archive hash
    if (d.scannedSha && d.registrySha) {
      const same = d.scannedSha === d.registrySha;
      const volDiff = d.volumeArea != null && Math.abs(d.volumeArea - d.area) > 0.01;
      this.fingerprints.push({
        id: `fp-${uid()}`, recordId: d.no, importSource: SRC, sourceFileSha256: docMeta?.sha256 || '',
        documentTitle: `${d.type || 'Deed'} — ${d.no}`,
        syntheticContent: `PDF-INTAKE|PARCEL:${key}|PLOT:${d.plot}|AREA:${d.area}|SELLER:${d.seller}|BUYER:${d.buyer}|DATE:${d.date}|FILE:${docMeta?.name || ''}`,
        referenceSha256: d.registrySha, observedSha256: d.scannedSha,
        integrityStatus: same ? (volDiff ? 'METADATA_INCONSISTENCY' : 'MATCH') : 'MISMATCH',
        inconsistentFields: volDiff ? [`Scanned copy area ${d.area} dec vs registry volume area ${d.volumeArea} dec`] : undefined,
        notes: same
          ? 'Scanned-copy SHA-256 printed in the file equals the registry archive reference hash.'
          : `Scanned-copy SHA-256 printed in the file does not match the registry archive reference hash.${volDiff ? ` Area also differs: scanned copy ${d.area} dec vs registry volume ${d.volumeArea} dec.` : ''} Hash comparison checks against the stored reference only; it does not prove legal validity or ownership.`
      });
    }

    // 8. Archive the uploaded file itself
    if (docMeta && docMeta.sha256) {
      this.uploadedDocs = this.uploadedDocs.filter(x => x.sha256 !== docMeta.sha256);
      this.addUploadedDoc({
        ...docMeta, unitId: docMeta.unitId || 'parcels', category: 'Complete Land File (auto-detected)',
        associatedParcelKey: key, uploadedByRole: this.settings.currentReviewerRole
      });
    }

    if (recalc) this.recalculateAllAlerts();
    this.saveToStorage();
    this.addAuditLog(
      'PDF_AUTO_INTAKE',
      `Auto-detected and imported ${docMeta?.name || 'PDF'}: parcel ${key}, deed ${d.no}, ${(parsed.chain || []).length} chain transfer(s), ${(parsed.nec.otherDeeds || []).length} other registered deed(s).`
    );
    return parcel;
  }

  getSettings() { return this.settings; }

  updateSettings(newSettings) {
    const prev = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage();
    this.addAuditLog(
      'SETTINGS_UPDATED',
      `Updated detection settings. Rapid threshold: ${this.settings.rapidTransferCountThreshold} transfers in ${this.settings.rapidTransferWindowDays} days. Role: ${this.settings.currentReviewerRole}`
    );

    if (
      prev.rapidTransferCountThreshold !== this.settings.rapidTransferCountThreshold ||
      prev.rapidTransferWindowDays !== this.settings.rapidTransferWindowDays ||
      prev.weightDoubleSelling !== this.settings.weightDoubleSelling ||
      prev.weightDocumentIntegrity !== this.settings.weightDocumentIntegrity ||
      prev.weightRapidTransfer !== this.settings.weightRapidTransfer ||
      prev.weightRegMutationMismatch !== this.settings.weightRegMutationMismatch ||
      prev.weightMissingFields !== this.settings.weightMissingFields
    ) {
      this.recalculateAllAlerts();
    }
  }

  recalculateAllAlerts() {
    this.parcels.forEach(parcel => {
      const evaluation = evaluateParcelRisk(
        parcel,
        this.deeds,
        this.fingerprints,
        this.transfers,
        this.registrations,
        this.mutations,
        this.settings
      );

      const existingAlertIndex = this.alerts.findIndex(a => a.syntheticParcelKey === parcel.syntheticParcelKey);

      if (evaluation.rulesTriggered.length > 0) {
        if (existingAlertIndex >= 0) {
          const current = this.alerts[existingAlertIndex];
          this.alerts[existingAlertIndex] = {
            ...current,
            rulesTriggered: evaluation.rulesTriggered,
            score: evaluation.score,
            severity: evaluation.severity,
            evidenceRefs: evaluation.evidenceRefs,
            updatedAt: new Date().toISOString()
          };
        } else {
          const newAlert = {
            id: `alt-gen-${Date.now().toString().slice(-4)}${Math.random().toString(36).slice(2, 5)}`,
            parcelId: parcel.id,
            syntheticParcelKey: parcel.syntheticParcelKey,
            rulesTriggered: evaluation.rulesTriggered,
            score: evaluation.score,
            severity: evaluation.severity,
            evidenceRefs: evaluation.evidenceRefs,
            status: 'New',
            notes: 'Generated automatically by JomiGuard rule evaluation engine.',
            assignedReviewerAlias: this.settings.reviewerAlias,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            scenarioTag: parcel.scenarioTag || 'Dynamically Evaluated Record'
          };
          this.alerts.unshift(newAlert);
        }
      } else {
        if (existingAlertIndex >= 0) {
          const existing = this.alerts[existingAlertIndex];
          if (existing.rulesTriggered.every(r => r.ruleId === 'RAPID_TRANSFER')) {
            this.alerts.splice(existingAlertIndex, 1);
          } else {
            this.alerts[existingAlertIndex] = {
              ...existing,
              rulesTriggered: [],
              score: 0,
              severity: 'LOW',
              updatedAt: new Date().toISOString()
            };
          }
        }
      }
    });

    this.saveToStorage();
  }

  updateAlertStatus(alertId, newStatus, noteAddition, reviewerAlias) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return null;

    const oldStatus = alert.status;
    alert.status = newStatus;
    alert.updatedAt = new Date().toISOString();
    if (reviewerAlias) alert.assignedReviewerAlias = reviewerAlias;
    if (noteAddition && noteAddition.trim()) {
      const ts = new Date().toLocaleTimeString();
      const prefix = `[${ts}] ${reviewerAlias || this.settings.reviewerAlias}: ${noteAddition.trim()}`;
      alert.notes = alert.notes ? `${alert.notes}\n${prefix}` : prefix;
    }

    this.saveToStorage();
    this.addAuditLog(
      'CASE_STATUS_CHANGED',
      `Alert ${alertId} (${alert.syntheticParcelKey}) transitioned from "${oldStatus}" to "${newStatus}". Reviewer: ${reviewerAlias || this.settings.reviewerAlias}`,
      alertId
    );

    return alert;
  }

  simulateTamperDocument(fingerprintId) {
    const doc = this.fingerprints.find(f => f.id === fingerprintId);
    if (!doc) return null;

    if (!doc.syntheticContent.includes('AREA:99.9-TAMPERED')) {
      doc.syntheticContent = doc.syntheticContent.replace(/AREA:\d+\.\d+/, 'AREA:99.9-TAMPERED');
      doc.observedSha256 = 'fa8d6b3cf54f912138904bc365cd875e28195e0ba98c70538357b20368017295';
      doc.integrityStatus = 'MISMATCH';
      doc.tamperSimulated = true;
      doc.notes = 'Demonstration tamper simulated: Parcel area altered to 99.9 Decimals in unauthorized copy.';
    }

    this.saveToStorage();
    this.addAuditLog(
      'DOCUMENT_TAMPER_SIMULATED',
      `Simulated deterministic alteration on ${doc.documentTitle}. SHA-256 mismatch created.`
    );
    this.recalculateAllAlerts();
    return doc;
  }

  resetDocument(fingerprintId) {
    const original = SEED_FINGERPRINTS.find(f => f.id === fingerprintId);
    const doc = this.fingerprints.find(f => f.id === fingerprintId);
    if (!original || !doc) return null;

    doc.syntheticContent = original.syntheticContent;
    doc.referenceSha256 = original.referenceSha256;
    doc.observedSha256 = original.observedSha256;
    doc.integrityStatus = original.integrityStatus;
    doc.notes = original.notes;
    doc.tamperSimulated = false;

    this.saveToStorage();
    this.addAuditLog('DOCUMENT_RESET', `Restored ${doc.documentTitle} to original fingerprint.`);
    this.recalculateAllAlerts();
    return doc;
  }

  addAuditLog(action, details, caseId = 'GLOBAL') {
    const entry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      caseId,
      actorAlias: this.settings.reviewerAlias,
      action,
      timestamp: new Date().toISOString(),
      details
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 100) {
      this.auditLogs = this.auditLogs.slice(0, 100);
    }
    this.saveToStorage();
  }

  exportSyntheticDataJson() {
    const payload = {
      _syntheticNotice: 'DEMO ONLY — Self-generated synthetic demonstration records for LandTech 2026 Hackathon. Contains no real personal or land data.',
      exportedAt: new Date().toISOString(),
      parcels: this.parcels,
      deeds: this.deeds,
      registrations: this.registrations,
      mutations: this.mutations,
      fingerprints: this.fingerprints,
      transfers: this.transfers,
      alerts: this.alerts,
      auditLogs: this.auditLogs,
      settings: this.settings
    };
    return JSON.stringify(payload, null, 2);
  }

  exportSyntheticAlertsCsv() {
    const header = [
      'Alert_ID',
      'Synthetic_Parcel_Key',
      'Severity',
      'Score',
      'Status',
      'Triggered_Rules',
      'Reviewer_Alias',
      'Created_At',
      'Disclaimer'
    ].join(',');

    const rows = this.alerts.map(a => [
      `"${a.id}"`,
      `"${a.syntheticParcelKey}"`,
      `"${a.severity}"`,
      a.score,
      `"${a.status}"`,
      `"${a.rulesTriggered.map(r => r.name).join('; ')}"`,
      `"${a.assignedReviewerAlias}"`,
      `"${a.createdAt}"`,
      `"SYNTHETIC DEMO RECORD ONLY - NON-LEGAL TRIAGE SCORE"`
    ].join(','));

    return [header, ...rows].join('\n');
  }
}

export async function computeSha256(text) {
  let subtle = (typeof window !== 'undefined' && window.crypto?.subtle) ||
               (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle);

  if (!subtle && typeof process !== 'undefined') {
    try {
      const nodeCrypto = await import('crypto');
      subtle = nodeCrypto.webcrypto?.subtle;
    } catch (e) {}
  }

  if (subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Web Crypto digest error, using fallback:', e);
    }
  }

  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return hex.repeat(8);
}
