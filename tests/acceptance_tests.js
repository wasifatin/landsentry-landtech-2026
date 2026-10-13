/**
 * JomiGuard AI — Automated Acceptance Test Suite
 * Validates all 10 Hackathon Compliance & Functional Quality Criteria
 */

import { LandRepository, computeSha256 } from '../src/repository/storage.js';
import { 
  checkDoubleSelling, 
  checkDocumentIntegrity, 
  checkRapidTransfers, 
  checkReconciliation,
  evaluateParcelRisk 
} from '../src/rules/riskEngine.js';

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

console.log('\n======================================================');
console.log('🧪 JomiGuard AI — Hackathon Acceptance Test Suite');
console.log('======================================================\n');

const repo = new LandRepository();
repo.resetToSeed();

// ----------------------------------------------------
// TEST 1: First launch seeded synthetic KPIs & alerts
// ----------------------------------------------------
console.log('Test 1: First launch seeded synthetic KPIs & alerts without API keys');
const parcels = repo.getParcels();
const deeds = repo.getDeeds();
const alerts = repo.getAlerts();
assert(parcels.length === 6, `Expected 6 seeded parcels, found ${parcels.length}`);
assert(deeds.length === 9, `Expected 9 seeded deeds, found ${deeds.length}`);
assert(alerts.length >= 5, `Expected at least 5 seeded triage alerts, found ${alerts.length}`);

// ----------------------------------------------------
// TEST 2: Clean-record scenario stays low risk (Scenario A)
// ----------------------------------------------------
console.log('\nTest 2: Clean record scenario stays low risk (Score: 0)');
const cleanParcel = parcels.find(p => p.syntheticParcelKey === 'PARCEL-SYN-DH-001');
const cleanEval = evaluateParcelRisk(
  cleanParcel,
  repo.getDeeds(),
  repo.getFingerprints(),
  repo.getTransfers(),
  repo.getRegistrations(),
  repo.getMutations(),
  repo.getSettings()
);
assert(cleanEval.score === 0, `Clean scenario score must be 0, received ${cleanEval.score}`);
assert(cleanEval.severity === 'LOW', `Clean scenario severity must be LOW, received ${cleanEval.severity}`);
assert(cleanEval.rulesTriggered.length === 0, `Clean scenario should trigger 0 rules, triggered ${cleanEval.rulesTriggered.length}`);

// ----------------------------------------------------
// TEST 3: Double-sale scenario shows parcel key, 2 deed IDs, distinct buyer aliases
// ----------------------------------------------------
console.log('\nTest 3: Possible double-sale scenario (Scenario B)');
const doubleParcel = parcels.find(p => p.syntheticParcelKey === 'PARCEL-SYN-DH-002');
const doubleRule = checkDoubleSelling(doubleParcel, repo.getDeeds(), 40);
assert(doubleRule !== null, 'Double-selling rule must trigger for PARCEL-SYN-DH-002');
assert(doubleRule.weight === 40, `Double-selling weight contribution must be +40, received ${doubleRule?.weight}`);
assert(doubleRule.evidence.some(e => e.includes('DEED-SYN-2026-089')), 'Evidence must cite DEED-SYN-2026-089');
assert(doubleRule.evidence.some(e => e.includes('DEED-SYN-2026-104')), 'Evidence must cite DEED-SYN-2026-104');
assert(doubleRule.evidence.some(e => e.includes('BUYER-SYN-002')), 'Evidence must cite BUYER-SYN-002');
assert(doubleRule.evidence.some(e => e.includes('BUYER-SYN-003')), 'Evidence must cite BUYER-SYN-003');

// ----------------------------------------------------
// TEST 4: Altered synthetic document produces hash mismatch (Scenario C)
// ----------------------------------------------------
console.log('\nTest 4: Altered synthetic document hash divergence (Scenario C)');
const alteredDoc = repo.getFingerprints().find(f => f.id === 'doc-002');
assert(alteredDoc.referenceSha256 !== alteredDoc.observedSha256, 'Observed SHA-256 must diverge from reference hash');
assert(alteredDoc.integrityStatus === 'MISMATCH', 'Status must be MISMATCH');
assert(alteredDoc.notes.includes('Area field altered'), 'Explanation must describe the field modification');

// ----------------------------------------------------
// TEST 5: Rapid transfer threshold reactivity (Scenario D)
// ----------------------------------------------------
console.log('\nTest 5: Rapid transfer threshold reactivity (Scenario D)');
const rapidParcel = parcels.find(p => p.syntheticParcelKey === 'PARCEL-SYN-DH-004');

// Default threshold: 3 transfers in 90 days -> triggers
const rapidTriggered = checkRapidTransfers(rapidParcel, repo.getTransfers(), 3, 90, 15);
assert(rapidTriggered !== null, 'Rapid transfer must trigger at default threshold (3 transfers / 90 days)');

// Set threshold higher: 4 transfers in 90 days -> must stop triggering
const rapidSuppressed = checkRapidTransfers(rapidParcel, repo.getTransfers(), 4, 90, 15);
assert(rapidSuppressed === null, 'Rapid transfer must STOP triggering when threshold is raised to 4 transfers');

// ----------------------------------------------------
// TEST 6: Registration vs Mutation reconciliation conflicts (Scenario E)
// ----------------------------------------------------
console.log('\nTest 6: Registration vs Mutation reconciliation conflicts (Scenario E)');
const regMutParcel = parcels.find(p => p.syntheticParcelKey === 'PARCEL-SYN-DH-005');
const regMutRule = checkReconciliation(regMutParcel, repo.getRegistrations(), repo.getMutations(), 20);
assert(regMutRule !== null, 'Reconciliation rule must trigger for PARCEL-SYN-DH-005');
assert(regMutRule.evidence.some(e => e.includes('BUYER-SYN-008') && e.includes('BUYER-SYN-009')), 'Must show conflicting buyer aliases');
assert(regMutRule.evidence.some(e => e.includes('20') && e.includes('14.5')), 'Must show area conflict (20.0 vs 14.5)');

// ----------------------------------------------------
// TEST 7: Reviewer status & note changes persist with audit entry
// ----------------------------------------------------
console.log('\nTest 7: Case status & note persistence with audit trail');
const updatedCase = repo.updateAlertStatus('alt-001', 'Under Review', 'Verified land volume; proceeding to survey inquiry', 'REVIEWER-SYN-OFFICER-01');
assert(updatedCase.status === 'Under Review', 'Case status must update to "Under Review"');
assert(updatedCase.notes.includes('Verified land volume'), 'Case notes must persist');
const latestAudit = repo.getAuditLogs()[0];
assert(latestAudit.action === 'CASE_STATUS_CHANGED', 'Audit log must record CASE_STATUS_CHANGED event');
assert(latestAudit.actorAlias === 'REVIEWER-SYN-OFFICER-01', 'Audit log must record actor alias');

// ----------------------------------------------------
// TEST 8: Reset returns all scenarios to factory seed data
// ----------------------------------------------------
console.log('\nTest 8: Reset returns data to factory seed state');
repo.resetToSeed();
const resetAlert = repo.getAlerts().find(a => a.id === 'alt-001');
assert(resetAlert.status === 'Escalated for Authorized Review', 'Factory seed status must be restored');

// ----------------------------------------------------
// TEST 9: Export records contain synthetic aliases only
// ----------------------------------------------------
console.log('\nTest 9: Export validation (Synthetic data only)');
const exportedJson = repo.exportSyntheticDataJson();
assert(exportedJson.includes('DEMO ONLY — Self-generated synthetic'), 'JSON export must include mandatory synthetic notice');
assert(!exportedJson.includes('@gmail.com') && !exportedJson.includes('+8801'), 'Export must not contain genuine personal contact details');
const exportedCsv = repo.exportSyntheticAlertsCsv();
assert(exportedCsv.includes('SYNTHETIC DEMO RECORD ONLY'), 'CSV export must include non-legal triage score disclaimer');

// ----------------------------------------------------
// TEST 10: Web Crypto fallback calculation
// ----------------------------------------------------
console.log('\nTest 10: Cryptographic hash calculation');
const hashResult = await computeSha256('TEST_STRING');
assert(hashResult.length === 64, `Hash length must be 64 hexadecimal characters, got ${hashResult.length}`);

console.log('\n======================================================');
console.log(`📊 Acceptance Tests Summary: ${passed} Passed, ${failed} Failed`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL 10 ACCEPTANCE TESTS PASSED SUCCESSFULLY!\n');
}
