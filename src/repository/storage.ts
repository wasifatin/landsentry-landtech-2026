import { 
  Parcel, 
  DeedRecord, 
  RegistrationRecord, 
  MutationRecord, 
  DocumentFingerprint, 
  TransferEvent, 
  FraudAlert, 
  AuditEvent, 
  DetectionSettings,
  AlertStatus 
} from '../types';
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
} from '../data/seedData';
import { evaluateParcelRisk } from '../rules/riskEngine';

const STORAGE_KEY_PREFIX = 'landsentry_';

export class LandRepository {
  private parcels: Parcel[] = [];
  private deeds: DeedRecord[] = [];
  private registrations: RegistrationRecord[] = [];
  private mutations: MutationRecord[] = [];
  private fingerprints: DocumentFingerprint[] = [];
  private transfers: TransferEvent[] = [];
  private alerts: FraudAlert[] = [];
  private auditLogs: AuditEvent[] = [];
  private settings: DetectionSettings = { ...INITIAL_SETTINGS };

  constructor() {
    this.init();
  }

  private init() {
    this.loadFromStorage();
  }

  public resetToSeed(): void {
    this.parcels = JSON.parse(JSON.stringify(SEED_PARCELS));
    this.deeds = JSON.parse(JSON.stringify(SEED_DEEDS));
    this.registrations = JSON.parse(JSON.stringify(SEED_REGISTRATIONS));
    this.mutations = JSON.parse(JSON.stringify(SEED_MUTATIONS));
    this.fingerprints = JSON.parse(JSON.stringify(SEED_FINGERPRINTS));
    this.transfers = JSON.parse(JSON.stringify(SEED_TRANSFERS));
    this.alerts = JSON.parse(JSON.stringify(SEED_ALERTS));
    this.auditLogs = JSON.parse(JSON.stringify(SEED_AUDIT_LOGS));
    this.settings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));

    this.saveToStorage();
    this.addAuditLog('SYSTEM_RESET', 'All demonstration datasets and risk parameters reset to factory seed values.');
  }

  private loadFromStorage(): void {
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
        const s = localStorage.getItem(`${STORAGE_KEY_PREFIX}settings`);

        if (p && d && r && m && f && t && a && l) {
          this.parcels = JSON.parse(p);
          this.deeds = JSON.parse(d);
          this.registrations = JSON.parse(r);
          this.mutations = JSON.parse(m);
          this.fingerprints = JSON.parse(f);
          this.transfers = JSON.parse(t);
          this.alerts = JSON.parse(a);
          this.auditLogs = JSON.parse(l);
          if (s) this.settings = JSON.parse(s);
          return;
        }
      }
    } catch (e) {
      console.warn('LocalStorage unavailable or parse error; using default seed data.', e);
    }
    this.resetToSeed();
  }

  private saveToStorage(): void {
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
        localStorage.setItem(`${STORAGE_KEY_PREFIX}settings`, JSON.stringify(this.settings));
      }
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  // Getters
  public getParcels(): Parcel[] { return this.parcels; }
  public getDeeds(): DeedRecord[] { return this.deeds; }
  public getRegistrations(): RegistrationRecord[] { return this.registrations; }
  public getMutations(): MutationRecord[] { return this.mutations; }
  public getFingerprints(): DocumentFingerprint[] { return this.fingerprints; }
  public getTransfers(): TransferEvent[] { return this.transfers; }
  public getAlerts(): FraudAlert[] { return this.alerts; }
  public getAuditLogs(): AuditEvent[] { return this.auditLogs; }
  public getSettings(): DetectionSettings { return this.settings; }

  public updateSettings(newSettings: Partial<DetectionSettings>): void {
    const prev = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage();
    this.addAuditLog(
      'SETTINGS_UPDATED',
      `Updated detection settings. Rapid threshold: ${this.settings.rapidTransferCountThreshold} transfers in ${this.settings.rapidTransferWindowDays} days. Role: ${this.settings.currentReviewerRole}`
    );

    // If rapid transfer threshold or weights changed, recalculate all parcel risk evaluations!
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

  public recalculateAllAlerts(): void {
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
          const newAlert: FraudAlert = {
            id: `alt-gen-${Date.now().toString().slice(-4)}`,
            parcelId: parcel.id,
            syntheticParcelKey: parcel.syntheticParcelKey,
            rulesTriggered: evaluation.rulesTriggered,
            score: evaluation.score,
            severity: evaluation.severity,
            evidenceRefs: evaluation.evidenceRefs,
            status: 'New',
            notes: 'Generated automatically by LandSentry rule evaluation engine.',
            assignedReviewerAlias: this.settings.reviewerAlias,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            scenarioTag: parcel.scenarioTag || 'Dynamically Evaluated Record'
          };
          this.alerts.unshift(newAlert);
        }
      } else {
        // If no rules triggered (e.g. rapid transfer threshold was raised above transfer count)
        if (existingAlertIndex >= 0) {
          // If was created by rapid transfer only, we update or resolve it
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

  public updateAlertStatus(
    alertId: string, 
    newStatus: AlertStatus, 
    noteAddition?: string, 
    reviewerAlias?: string
  ): FraudAlert | null {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return null;

    const oldStatus = alert.status;
    alert.status = newStatus;
    alert.updatedAt = new Date().toISOString();
    if (reviewerAlias) alert.assignedReviewerAlias = reviewerAlias;
    if (noteAddition && noteAddition.trim()) {
      alert.notes = alert.notes 
        ? `${alert.notes}\n[${new Date().toLocaleTimeString()}] ${reviewerAlias || this.settings.reviewerAlias}: ${noteAddition.trim()}`
        : `[${new Date().toLocaleTimeString()}] ${reviewerAlias || this.settings.reviewerAlias}: ${noteAddition.trim()}`;
    }

    this.saveToStorage();
    this.addAuditLog(
      'CASE_STATUS_CHANGED',
      `Alert ${alertId} (${alert.syntheticParcelKey}) transitioned from "${oldStatus}" to "${newStatus}". Reviewer: ${reviewerAlias || this.settings.reviewerAlias}`,
      alertId
    );

    return alert;
  }

  public addCaseNote(alertId: string, noteText: string): FraudAlert | null {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return null;

    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${this.settings.reviewerAlias}: ${noteText}`;
    alert.notes = alert.notes ? `${alert.notes}\n${entry}` : entry;
    alert.updatedAt = new Date().toISOString();

    this.saveToStorage();
    this.addAuditLog('CASE_NOTE_ADDED', `Note appended to case ${alertId}: "${noteText}"`, alertId);
    return alert;
  }

  public simulateTamperDocument(fingerprintId: string): DocumentFingerprint | null {
    const doc = this.fingerprints.find(f => f.id === fingerprintId);
    if (!doc) return null;

    // Deterministically modify content
    if (!doc.syntheticContent.includes('AREA:99.9-TAMPERED')) {
      doc.syntheticContent = doc.syntheticContent.replace(/AREA:\d+\.\d+/, 'AREA:99.9-TAMPERED');
      // Simulated new hash
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

  public resetDocument(fingerprintId: string): DocumentFingerprint | null {
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

  public addAuditLog(action: string, details: string, caseId: string = 'GLOBAL'): void {
    const entry: AuditEvent = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      caseId,
      actorAlias: this.settings.reviewerAlias,
      action,
      timestamp: new Date().toISOString(),
      details
    };
    this.auditLogs.unshift(entry);
    // Keep max 100 audit entries
    if (this.auditLogs.length > 100) {
      this.auditLogs = this.auditLogs.slice(0, 100);
    }
    this.saveToStorage();
  }

  public exportSyntheticDataJson(): string {
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

  public exportSyntheticAlertsCsv(): string {
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

/**
 * Web Crypto SHA-256 calculation for synthetic content
 */
export async function computeSha256(text: string): Promise<string> {
  let subtle = (typeof window !== 'undefined' && window.crypto?.subtle) ||
               (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.subtle);

  if (!subtle && typeof process !== 'undefined') {
    try {
      const nodeCrypto = await import('crypto');
      subtle = (nodeCrypto as any).webcrypto?.subtle;
    } catch (e) {}
  }

  if (subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Web Crypto digest error, using fallback hash:', e);
    }
  }

  // Pure JS fallback FNV-1a / standard 32-byte representation if WebCrypto is disabled
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return hex.repeat(8);
}
