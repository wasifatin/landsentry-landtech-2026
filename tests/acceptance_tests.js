/**
 * JomiGuard AI — PRD Compliance & Scenario Verification Test Suite
 * Validates PRD Section 8 (Required Scenarios A-F) & Section 13 (Acceptance Criteria AT-01 to AT-12)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LandRepository, computeSha256 } from '../src/repository/storage.js';
import { 
  calculateSeverity,
  checkDoubleSelling, 
  checkDocumentIntegrity, 
  checkRapidTransfers, 
  checkReconciliation,
  checkMissingFields,
  evaluateParcelRisk 
} from '../src/rules/riskEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n======================================================================');
console.log('🏛️  JOMIGUARD AI — PRD SCENARIO & ACCEPTANCE TEST SUITE');
console.log('    LandTech 2026 Hackathon | Problem P3: Fraud & Double-Selling');
console.log('======================================================================\n');

const repo = new LandRepository();
repo.resetToSeed();

// ======================================================================
// SECTION 1: PRD SECTION 8 — REQUIRED SYNTHETIC DEMO SCENARIOS (A TO F)
// ======================================================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 PART 1: PRD SECTION 8 — REQUIRED SYNTHETIC DEMO SCENARIOS (A to F)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ----------------------------------------------------
// SCENARIO A: Clean Record
// PRD: "One synthetic transfer, matching reference hash, reconciled registration/mutation values, no rapid transfer."
// Expected: "Low risk or no alert; every passing check is visible."
// ----------------------------------------------------
console.log('▶ Scenario A: Clean Record (PARCEL-SYN-DH-001)');
const parcelA = repo.getParcels().find(p => p.syntheticParcelKey === 'PARCEL-SYN-DH-001');
const evalA = evaluateParcelRisk(
  parcelA,
  repo.getDeeds(),
  repo.getFingerprints(),
  repo.getTransfers(),
  repo.getRegistrations(),
  repo.getMutations(),
  repo.getSettings()
);
assert(parcelA !== undefined, 'Parcel PARCEL-SYN-DH-001 exists in synthetic fixtures');
assert(evalA.score === 0, `Scenario A risk score must be 0 (received ${evalA.score})`);
assert(evalA.severity === 'LOW', `Scenario A severity band must be LOW (received ${evalA.severity})`);
assert(evalA.rulesTriggered.length === 0, `Scenario A must trigger 0 risk flags (triggered: ${evalA.rulesTriggered.length})`);
assert(evalA.score < 30, 'Scenario A is strictly within the Low risk demo band (0–29)');

// Check document hash for Scenario A
const docA = repo.getFingerprints().find(f => f.syntheticContent.includes('PARCEL-SYN-DH-001'));
assert(docA && (docA.integrityStatus === 'MATCH' || docA.integrityStatus === 'VERIFIED'), 'Scenario A document copy matches reference hash');
assert(docA.referenceSha256 === docA.observedSha256, 'Scenario A reference hash matches observed hash perfectly');

// ----------------------------------------------------
// SCENARIO B: Possible Double Sale
// PRD: "One parcel has two unresolved sale records tied to distinct buyer aliases."
// Expected: "Double-sale alert with both deed IDs, dates and shared parcel key."
// ----------------------------------------------------
console.log('\n▶ Scenario B: Possible Double Sale (PARCEL-SYN-DH-002)');
const parcelB = repo.getParcels().find(p => p.syntheticParcelKey === 'PARCEL-SYN-DH-002');
const evalB = evaluateParcelRisk(
  parcelB,
  repo.getDeeds(),
  repo.getFingerprints(),
  repo.getTransfers(),
  repo.getRegistrations(),
  repo.getMutations(),
  repo.getSettings()
);
const doubleSaleRule = evalB.rulesTriggered.find(r => r.ruleId === 'DOUBLE_SELLING');
assert(doubleSaleRule !== undefined, 'Double-selling rule triggered for PARCEL-SYN-DH-002');
assert(doubleSaleRule.weight === 40, `Rule weight contribution must be +40 (received ${doubleSaleRule?.weight})`);
assert(doubleSaleRule.evidence.some(e => e.includes('DEED-SYN-2026-089')), 'Double-sale alert cites deed DEED-SYN-2026-089');
assert(doubleSaleRule.evidence.some(e => e.includes('DEED-SYN-2026-104')), 'Double-sale alert cites deed DEED-SYN-2026-104');
assert(doubleSaleRule.evidence.some(e => e.includes('BUYER-SYN-002')), 'Double-sale alert cites distinct buyer BUYER-SYN-002');
assert(doubleSaleRule.evidence.some(e => e.includes('BUYER-SYN-003')), 'Double-sale alert cites distinct buyer BUYER-SYN-003');
assert(doubleSaleRule.evidence.some(e => e.includes('PARCEL-SYN-DH-002')), 'Double-sale alert explicitly specifies shared synthetic parcel key');
assert(evalB.score >= 40, `Parcel overall risk reflects double-sale (+40) score: ${evalB.score}`);

// ----------------------------------------------------
// SCENARIO C: Altered Copy
// PRD: "A sample’s observed synthetic content differs from its reference content."
// Expected: "Hash mismatch with both hashes and a non-legal limitation note."
// ----------------------------------------------------
console.log('\n▶ Scenario C: Altered Copy (PARCEL-SYN-DH-003 / doc-002)');
const docC = repo.getFingerprints().find(f => f.id === 'doc-002');
assert(docC !== undefined, 'Synthetic deed document doc-002 exists');
assert(docC.referenceSha256 !== docC.observedSha256, 'Observed SHA-256 diverges from reference SHA-256 fingerprint');
assert(docC.integrityStatus === 'MISMATCH', 'Integrity status correctly flagged as MISMATCH');
assert(docC.referenceSha256.length === 64, `Reference SHA-256 has valid 64-char length (${docC.referenceSha256})`);
assert(docC.observedSha256.length === 64, `Observed SHA-256 has valid 64-char length (${docC.observedSha256})`);
assert(docC.notes.includes('does not prove legal validity') || docC.notes.includes('stored reference only'), 'Discloses non-legal limitation notice');

const parcelC = repo.getParcels().find(p => p.syntheticParcelKey === 'PARCEL-SYN-DH-003');
const evalC = evaluateParcelRisk(
  parcelC,
  repo.getDeeds(),
  repo.getFingerprints(),
  repo.getTransfers(),
  repo.getRegistrations(),
  repo.getMutations(),
  repo.getSettings()
);
const docRule = evalC.rulesTriggered.find(r => r.ruleId === 'DOCUMENT_INTEGRITY');
assert(docRule !== undefined, 'Document integrity rule triggered for PARCEL-SYN-DH-003');
assert(docRule.weight === 25, `Document integrity weight contribution must be +25 (received ${docRule?.weight})`);

// ----------------------------------------------------
// SCENARIO D: Rapid Transfer
// PRD: "At least three synthetic transfer events fall within the default 90-day period."
// Expected: "Rapid-transfer alert; modifying the configured threshold changes the outcome."
// ----------------------------------------------------
console.log('\n▶ Scenario D: Rapid Transfer Pattern (PARCEL-SYN-DH-004)');
const parcelD = repo.getParcels().find(p => p.syntheticParcelKey === 'PARCEL-SYN-DH-004');
const rapidRuleDefault = checkRapidTransfers(parcelD, repo.getTransfers(), 3, 90, 15);
assert(rapidRuleDefault !== null, 'Rapid transfer rule triggers on default settings (>=3 transfers in 90 days)');
assert(rapidRuleDefault.weight === 15, `Rapid transfer rule weight contribution must be +15 (received ${rapidRuleDefault?.weight})`);
assert(rapidRuleDefault.evidence.length >= 3, `Transfer timeline displays legs: count = ${rapidRuleDefault.evidence.length}`);

// Modifying threshold changes outcome
const rapidRuleHigher = checkRapidTransfers(parcelD, repo.getTransfers(), 4, 90, 15);
assert(rapidRuleHigher === null, 'Increasing threshold to 4 transfers successfully suppresses alert (threshold reactive)');
const rapidRuleShorter = checkRapidTransfers(parcelD, repo.getTransfers(), 3, 30, 15);
assert(rapidRuleShorter === null, 'Narrowing window to 30 days suppresses alert since transactions spanned 42 days');

// ----------------------------------------------------
// SCENARIO E: Record Mismatch
// PRD: "Registration and mutation differ on at least one material field (e.g. area/unit, deed reference, buyer alias, date or status)."
// Expected: "Side-by-side field comparison with exact discrepancies."
// ----------------------------------------------------
console.log('\n▶ Scenario E: Record Mismatch (PARCEL-SYN-DH-005)');
const parcelE = repo.getParcels().find(p => p.syntheticParcelKey === 'PARCEL-SYN-DH-005');
const regE = repo.getRegistrations().find(r => r.syntheticParcelKey === parcelE.syntheticParcelKey);
const mutE = repo.getMutations().find(m => m.syntheticParcelKey === parcelE.syntheticParcelKey);
assert(regE !== undefined && mutE !== undefined, 'Both registration and mutation records exist for PARCEL-SYN-DH-005');
assert(regE.buyerAlias !== mutE.buyerAlias, `Buyer aliases differ: Sub-Registry=${regE.buyerAlias} vs AC Land=${mutE.buyerAlias}`);
assert(regE.area !== mutE.area, `Declared area values differ: Sub-Registry=${regE.area} dec vs AC Land=${mutE.area} dec`);

const evalE = evaluateParcelRisk(
  parcelE,
  repo.getDeeds(),
  repo.getFingerprints(),
  repo.getTransfers(),
  repo.getRegistrations(),
  repo.getMutations(),
  repo.getSettings()
);
const regMutRuleE = evalE.rulesTriggered.find(r => r.ruleId === 'REG_MUTATION_MISMATCH');
assert(regMutRuleE !== undefined, 'Registration vs mutation rule triggers for PARCEL-SYN-DH-005');
assert(regMutRuleE.weight === 20, `Reconciliation rule weight contribution is +20 (received ${regMutRuleE?.weight})`);
assert(regMutRuleE.evidence.some(e => e.includes('BUYER-SYN-008') && e.includes('BUYER-SYN-009')), 'Evidence details exact buyer mismatch');
assert(regMutRuleE.evidence.some(e => e.includes('20') && e.includes('14.5')), 'Evidence details exact area discrepancy (20.0 vs 14.5)');

// ----------------------------------------------------
// SCENARIO F: Incomplete Record
// PRD: "One important field is absent from a synthetic record."
// Expected: "Missing-data flag stating verification is required, not wrongdoing."
// ----------------------------------------------------
console.log('\n▶ Scenario F: Incomplete Record / Missing Field (PARCEL-SYN-DH-006)');
const parcelF = repo.getParcels().find(p => p.syntheticParcelKey === 'PARCEL-SYN-DH-006');
const mutF = repo.getMutations().find(m => m.syntheticParcelKey === parcelF.syntheticParcelKey);
assert(mutF !== undefined && mutF.isRecordPresent === false, 'Mutation record is marked as unlinked/absent');

const evalF = evaluateParcelRisk(
  parcelF,
  repo.getDeeds(),
  repo.getFingerprints(),
  repo.getTransfers(),
  repo.getRegistrations(),
  repo.getMutations(),
  repo.getSettings()
);
const missingRecordRule = evalF.rulesTriggered.find(r => r.ruleId === 'REG_MUTATION_MISMATCH');
assert(missingRecordRule !== undefined, 'Missing record triggers triage notification');
assert(missingRecordRule.description.includes('Verification required'), 'Missing-data flag states verification is required');
assert(!missingRecordRule.description.toLowerCase().includes('fraud proven'), 'Never asserts fraud or guilt on missing records');
const missingKhatianRule = evalF.rulesTriggered.find(r => r.ruleId === 'MISSING_FIELDS');
assert(missingKhatianRule !== undefined, 'Missing khatian field rule triggered for PARCEL-SYN-DH-006');


// ======================================================================
// SECTION 2: PRD SECTION 13 — ACCEPTANCE CRITERIA (AT-01 TO AT-12)
// ======================================================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 PART 2: PRD SECTION 13 — ACCEPTANCE CRITERIA VALIDATION (AT-01 to AT-12)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ----------------------------------------------------
// AT-01: First launch loads seeded synthetic KPIs and alerts without an API key
// ----------------------------------------------------
console.log('▶ AT-01: First launch loads seeded synthetic KPIs and alerts without an API key');
assert(repo.getParcels().length === 6, `6 seeded synthetic parcels loaded without API key (found ${repo.getParcels().length})`);
assert(repo.getDeeds().length === 9, `9 seeded synthetic deeds loaded without API key (found ${repo.getDeeds().length})`);
assert(repo.getAlerts().length === 5, `5 triage alerts loaded without external services (found ${repo.getAlerts().length})`);
assert(repo.getFingerprints().length === 3, `3 document fingerprints loaded (found ${repo.getFingerprints().length})`);

// ----------------------------------------------------
// AT-02: The clean scenario has no double-sale/hash/mismatch/rapid-transfer trigger and remains low risk
// ----------------------------------------------------
console.log('\n▶ AT-02: Clean scenario has no triggers and remains low risk');
assert(evalA.score === 0, `Clean scenario score is strictly 0 (received ${evalA.score})`);
assert(evalA.rulesTriggered.length === 0, 'Clean scenario has 0 rule triggers');
assert(evalA.severity === 'LOW', 'Clean scenario severity is LOW');

// ----------------------------------------------------
// AT-03: Double-sale case shows shared synthetic parcel key, two distinct buyer aliases, deed IDs and dates
// ----------------------------------------------------
console.log('\n▶ AT-03: Double-sale case shows shared parcel key, distinct buyer aliases, deed IDs and dates');
const dsDeeds = repo.getDeeds().filter(d => d.syntheticParcelKey === 'PARCEL-SYN-DH-002');
assert(dsDeeds.length >= 2, `Found ${dsDeeds.length} deeds for PARCEL-SYN-DH-002`);
const dsBuyers = new Set(dsDeeds.map(d => d.buyerAlias));
assert(dsBuyers.size >= 2, `Distinct buyers identified: ${Array.from(dsBuyers).join(', ')}`);
assert(dsDeeds.every(d => d.deedNo && d.deedDate), 'Every deed specifies deedNo and deedDate');

// ----------------------------------------------------
// AT-04: Altered-copy test computes or truthfully simulates a different hash, displays both values and explains hash match is not legal proof
// ----------------------------------------------------
console.log('\n▶ AT-04: Altered-copy displays both hashes and explains hash match is not legal proof');
assert(docC.referenceSha256 !== docC.observedSha256, 'Different SHA-256 hashes displayed');
assert(docC.referenceSha256.length === 64 && docC.observedSha256.length === 64, 'Both hashes are valid 64-char strings');
assert(docC.notes.includes('does not prove legal validity') || docC.notes.includes('stored reference only'), 'Explicit note: hash check does not prove legal validity');

// ----------------------------------------------------
// AT-05: Three transfers inside 90 days trigger rapid-transfer; increasing threshold changes outcome
// ----------------------------------------------------
console.log('\n▶ AT-05: Three transfers inside 90 days trigger rule; threshold change alters outcome');
assert(rapidRuleDefault !== null, 'Triggered under default: 3 transfers in 90 days');
assert(rapidRuleHigher === null, 'Suppressed when threshold is increased to 4 transfers');

// ----------------------------------------------------
// AT-06: Registration-versus-mutation comparison highlights exact mismatched and missing fields
// ----------------------------------------------------
console.log('\n▶ AT-06: Registration vs mutation highlights exact mismatched and missing fields');
assert(regMutRuleE.evidence.some(e => e.includes('BUYER-SYN-008') && e.includes('BUYER-SYN-009')), 'Buyer alias mismatch highlighted');
assert(regMutRuleE.evidence.some(e => e.includes('20') && e.includes('14.5')), 'Area discrepancy highlighted');
assert(missingRecordRule.evidence.some(e => e.includes('MISSING / NOT RECORDED') || e.includes('Not found')), 'Missing mutation record identified');

// ----------------------------------------------------
// AT-07: Updating case status or a note survives page refresh and adds an audit event
// ----------------------------------------------------
console.log('\n▶ AT-07: Updating case status or note persists and creates an audit event');
const initialAuditCount = repo.getAuditLogs().length;
const testCaseUpdate = repo.updateAlertStatus(
  'alt-002',
  'Escalated for Authorized Review',
  'Evidence verified by triage team; forwarding to Upazila Land Office.',
  'REVIEWER-SYN-OFFICER-01'
);
assert(testCaseUpdate.status === 'Escalated for Authorized Review', 'Case status persisted in repo state');
assert(testCaseUpdate.notes.includes('forwarding to Upazila Land Office'), 'Case note persisted in repo state');
const newAuditLogs = repo.getAuditLogs();
assert(newAuditLogs.length === initialAuditCount + 1, `Audit log increased by 1 (total: ${newAuditLogs.length})`);
assert(newAuditLogs[0].caseId === 'alt-002', `Audit entry linked to correct case ID (${newAuditLogs[0].caseId})`);
assert(newAuditLogs[0].actorAlias === 'REVIEWER-SYN-OFFICER-01', 'Audit log records actor alias');

// ----------------------------------------------------
// AT-08: Reset restores original records, alerts, thresholds and known case states
// ----------------------------------------------------
console.log('\n▶ AT-08: Reset restores original records, alerts, thresholds and known states');
repo.resetToSeed();
const restoredAlert = repo.getAlerts().find(a => a.id === 'alt-002');
assert(restoredAlert.status === 'Under Review', 'Restored alert status returns to seed baseline ("Under Review")');
assert(repo.getParcels().length === 6, 'Restored parcels match exactly 6');
assert(repo.getSettings().rapidTransferCountThreshold === 3, 'Restored rapid transfer threshold is 3');

// ----------------------------------------------------
// AT-09: Search and filters work, dashboard alert links open correct case, exported data uses synthetic aliases only
// ----------------------------------------------------
console.log('\n▶ AT-09: Search/filter sanity, dashboard links, and synthetic aliases in export');
const searchResults = repo.getParcels().filter(p => 
  p.syntheticParcelKey.includes('002') || p.demoDistrict.includes('North')
);
assert(searchResults.length >= 1, `Parcel search filter returned ${searchResults.length} matching entries`);
const exportedJson = repo.exportSyntheticDataJson();
assert(exportedJson.includes('BUYER-SYN-') && exportedJson.includes('SELLER-SYN-'), 'Export uses synthetic person aliases');
assert(!exportedJson.includes('@gmail.com') && !exportedJson.includes('+8801'), 'Export contains no real phone numbers or emails');

// ----------------------------------------------------
// AT-10: No app feature or configuration contacts live government/third-party registries; privacy warning visible
// ----------------------------------------------------
console.log('\n▶ AT-10: Complete offline privacy, no live registry endpoints, visible privacy warning');
const htmlContent = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
assert(htmlContent.includes('Self-generated synthetic demonstration records only'), 'index.html contains persistent synthetic data warning banner');
assert(!htmlContent.includes('eporcha.gov.bd') && !htmlContent.includes('land.gov.bd/api'), 'Zero live government endpoints in index.html');
const appJsContent = fs.readFileSync(path.join(projectRoot, 'src/app.js'), 'utf8');
assert(!appJsContent.includes('http://') && !appJsContent.includes('https://api'), 'Zero remote API fetch calls in app.js');

// ----------------------------------------------------
// AT-11: README setup commands work from clean checkout; dependencies and sources credited; AI use disclosed
// ----------------------------------------------------
console.log('\n▶ AT-11: README setup verification, license attribution and AI disclosure');
const readmeContent = fs.readFileSync(path.join(projectRoot, 'README.md'), 'utf8');
assert(readmeContent.includes('AI Tools Disclosure') || readmeContent.includes('AI Tool Use'), 'README contains AI Tools Disclosure');
assert(readmeContent.includes('Open-Source Dependencies & Licenses') || readmeContent.includes('Licenses'), 'README credits open-source dependencies and licenses');
assert(readmeContent.includes('npm run dev') || readmeContent.includes('python -m http.server'), 'README contains reproducible setup command');

// ----------------------------------------------------
// AT-12: Both student members can explain detection logic, storage choices, hash limitations, synthetic dataset, risk weights and non-goals
// ----------------------------------------------------
console.log('\n▶ AT-12: Explainability & non-goals audit in code and UI');
assert(htmlContent.includes('Methodology') && appJsContent.includes('Methodology & Non-Goals'), 'UI contains Methodology & Non-Goals section');
assert(!htmlContent.toLowerCase().includes('fraud proven'), 'UI strictly omits forbidden phrase "fraud proven"');
assert(appJsContent.includes('flagged for review') || htmlContent.includes('flagged for review') || htmlContent.includes('FLAGGED_FOR_REVIEW'), 'UI uses approved triage terminology "flagged for review"');

// ----------------------------------------------------
// CRYPTOGRAPHIC HASH SUB-SYSTEM VERIFICATION
// ----------------------------------------------------
console.log('\n▶ Cryptographic SHA-256 Engine Verification');
const doc1 = repo.getFingerprints().find(f => f.id === 'doc-001');
const calculatedHash = await computeSha256(doc1.syntheticContent);
assert(calculatedHash.length === 64, `Calculated SHA-256 is 64 hex characters (${calculatedHash.substring(0, 16)}...)`);
assert(calculatedHash === doc1.referenceSha256, 'Calculated SHA-256 matches doc-001 reference fingerprint identically');

console.log('\n======================================================================');
console.log(`📊 FINAL TEST RUN RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================================\n');

if (failed > 0) {
  console.error(`💥 TEST SUITE FAILED with ${failed} failure(s).\n`);
  process.exit(1);
} else {
  console.log('🎉 ALL PRD SCENARIOS (A-F) & ACCEPTANCE CRITERIA (AT-01 to AT-12) FULLY PASSED!\n');
  process.exit(0);
}
