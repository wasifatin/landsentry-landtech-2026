/**
 * LandSentry — Data & Type Definitions
 * Track: Digital Land Records, Verification & Digitization
 * Domain: Land Fraud & Double-Selling Detection
 * Compliance: Non-authoritative deterministic triage engine.
 */

export type SurveyGeneration = 'CS' | 'SA' | 'RS' | 'BS';

export interface SurveyDetail {
  surveyType: SurveyGeneration;
  dagNo: string;
  khatianNo: string;
  recordedAreaDecimal: number;
  surveyYear: string;
  remarks: string;
}

export interface Parcel {
  id: string;
  syntheticParcelKey: string;
  demoDistrict: string;
  demoMouza: string;
  plotDagNo: string;
  surveyGenerations: SurveyDetail[];
  primaryKhatianRef: string;
  declaredArea: number;
  areaUnit: string;
  status: 'ACTIVE' | 'FLAGGED_FOR_REVIEW' | 'MUTATION_PENDING' | 'RECONCILED';
  currentOwnerAlias: string;
  scenarioTag?: string;
}

export interface DeedRecord {
  id: string;
  parcelId: string;
  syntheticParcelKey: string;
  deedNo: string;
  sellerAlias: string;
  buyerAlias: string;
  deedDate: string;
  declaredArea: number;
  saleStatus: 'REGISTERED' | 'DISPUTED_DUPLICATE' | 'CANCELLED' | 'PENDING';
  sourceRegistryOffice: string;
  syntheticDocumentId: string;
}

export interface RegistrationRecord {
  id: string;
  parcelId: string;
  syntheticParcelKey: string;
  deedRef: string;
  sellerAlias: string;
  buyerAlias: string;
  area: number;
  areaUnit: string;
  transferDate: string;
  registrationStatus: string;
  surveyKhatianRef: string;
  subRegistryOffice: string;
}

export interface MutationRecord {
  id: string;
  parcelId: string;
  syntheticParcelKey: string;
  deedRef: string;
  sellerAlias: string;
  buyerAlias: string;
  area: number;
  areaUnit: string;
  mutationDate: string;
  mutationStatus: string;
  surveyKhatianRef: string;
  acLandOffice: string;
  isRecordPresent: boolean;
}

export interface DocumentFingerprint {
  id: string;
  recordId: string;
  documentTitle: string;
  syntheticContent: string;
  referenceSha256: string;
  observedSha256: string;
  integrityStatus: 'MATCH' | 'MISMATCH' | 'METADATA_INCONSISTENCY';
  inconsistentFields?: string[];
  notes: string;
  tamperSimulated?: boolean;
}

export interface TransferEvent {
  id: string;
  parcelId: string;
  syntheticParcelKey: string;
  eventDate: string;
  deedId: string;
  sellerAlias: string;
  buyerAlias: string;
  area: number;
  status: string;
}

export interface TriggeredRule {
  ruleId: 'DOUBLE_SELLING' | 'DOCUMENT_INTEGRITY' | 'REG_MUTATION_MISMATCH' | 'RAPID_TRANSFER' | 'MISSING_FIELDS';
  name: string;
  weight: number;
  description: string;
  evidence: string[];
}

export type AlertStatus = 'New' | 'Under Review' | 'Resolved — No Issue Found' | 'Escalated for Authorized Review';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface FraudAlert {
  id: string;
  parcelId: string;
  syntheticParcelKey: string;
  rulesTriggered: TriggeredRule[];
  score: number;
  severity: SeverityLevel;
  evidenceRefs: string[];
  status: AlertStatus;
  notes: string;
  assignedReviewerAlias: string;
  createdAt: string;
  updatedAt: string;
  scenarioTag: string;
}

export interface AuditEvent {
  id: string;
  caseId: string;
  actorAlias: string;
  action: string;
  timestamp: string;
  details: string;
}

export interface DetectionSettings {
  rapidTransferWindowDays: number;
  rapidTransferCountThreshold: number;
  weightDoubleSelling: number;
  weightDocumentIntegrity: number;
  weightRegMutationMismatch: number;
  weightRapidTransfer: number;
  weightMissingFields: number;
  currentReviewerRole: 'Sub-Registrar' | 'AC Land Officer' | 'Land Auditor';
  reviewerAlias: string;
}
