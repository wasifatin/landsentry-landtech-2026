/**
 * LandSentry — Deterministic Rules Engine (ES Module)
 */

export function calculateSeverity(score) {
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

export function checkDoubleSelling(parcel, deeds, weight = 40) {
  const parcelDeeds = deeds.filter(
    d => d.syntheticParcelKey === parcel.syntheticParcelKey && d.saleStatus === 'REGISTERED'
  );

  const distinctBuyers = Array.from(new Set(parcelDeeds.map(d => d.buyerAlias)));

  if (parcelDeeds.length > 1 && distinctBuyers.length > 1) {
    const evidenceList = parcelDeeds.map(
      d => `Deed ${d.deedNo} (Buyer: ${d.buyerAlias}, Date: ${d.deedDate})`
    );
    evidenceList.push(`Shared Synthetic Parcel Key: ${parcel.syntheticParcelKey}`);

    return {
      ruleId: 'DOUBLE_SELLING',
      name: 'Possible Double-Selling Conflict',
      weight,
      description: `Detected ${parcelDeeds.length} active registered deeds associated with ${distinctBuyers.length} distinct buyer aliases for parcel ${parcel.syntheticParcelKey}.`,
      evidence: evidenceList
    };
  }

  return null;
}

export function checkDocumentIntegrity(parcel, fingerprints, weight = 25) {
  const doc = fingerprints.find(f => f.syntheticContent.includes(parcel.syntheticParcelKey));
  if (!doc) return null;

  if (doc.integrityStatus === 'MISMATCH' || doc.referenceSha256 !== doc.observedSha256) {
    return {
      ruleId: 'DOCUMENT_INTEGRITY',
      name: 'Document Cryptographic Integrity Mismatch',
      weight,
      description: `Observed document hash does not match stored reference fingerprint for ${doc.documentTitle}. Indicates document copy modification.`,
      evidence: [
        `Reference SHA-256: ${doc.referenceSha256.substring(0, 16)}...`,
        `Observed SHA-256: ${doc.observedSha256.substring(0, 16)}...`,
        `Note: ${doc.notes}`
      ]
    };
  }

  return null;
}

export function checkRapidTransfers(parcel, transfers, countThreshold = 3, windowDays = 90, weight = 15) {
  const parcelTransfers = transfers
    .filter(t => t.syntheticParcelKey === parcel.syntheticParcelKey)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  if (parcelTransfers.length < countThreshold) {
    return null;
  }

  for (let i = 0; i <= parcelTransfers.length - countThreshold; i++) {
    const firstDate = new Date(parcelTransfers[i].eventDate).getTime();
    const lastDate = new Date(parcelTransfers[i + countThreshold - 1].eventDate).getTime();
    const diffDays = Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24));

    if (diffDays <= windowDays) {
      const windowTransfers = parcelTransfers.slice(i, i + countThreshold);
      const evidence = windowTransfers.map(
        (t, idx) => `Leg ${idx + 1}: ${t.eventDate} (${t.sellerAlias} -> ${t.buyerAlias}, Deed: ${t.deedId})`
      );
      evidence.push(`Time Span: ${diffDays} days (Configured Threshold: >= ${countThreshold} transfers in ${windowDays} days)`);

      return {
        ruleId: 'RAPID_TRANSFER',
        name: 'Rapid Succession Transfer Pattern',
        weight,
        description: `Parcel underwent ${countThreshold} recorded transfers within ${diffDays} calendar days, meeting prototype rapid-velocity criteria.`,
        evidence
      };
    }
  }

  return null;
}

export function checkReconciliation(parcel, registrations, mutations, weight = 20) {
  const reg = registrations.find(r => r.syntheticParcelKey === parcel.syntheticParcelKey);
  const mut = mutations.find(m => m.syntheticParcelKey === parcel.syntheticParcelKey);

  if (!reg) return null;

  if (!mut || !mut.isRecordPresent) {
    return {
      ruleId: 'REG_MUTATION_MISMATCH',
      name: 'Mutation Record Absent from Dataset',
      weight,
      description: `Deed ${reg.deedRef} is registered at Sub-Registry, but no corresponding AC Land mutation was found. Verification required.`,
      evidence: [
        `Sub-Registry Deed: ${reg.deedRef} (Registered: ${reg.transferDate})`,
        `AC Land Record: Not found in demo dataset (Pending mutation or separate jurisdiction archive)`
      ]
    };
  }

  const conflicts = [];
  if (reg.buyerAlias !== mut.buyerAlias) {
    conflicts.push(`Buyer Alias Conflict: Registration lists '${reg.buyerAlias}' vs Mutation lists '${mut.buyerAlias}'`);
  }
  if (Math.abs(reg.area - mut.area) > 0.01) {
    conflicts.push(`Area Conflict: Registration recorded ${reg.area} ${reg.areaUnit} vs Mutation recorded ${mut.area} ${mut.areaUnit}`);
  }
  if (mut.mutationStatus === 'OBJECTION_FILED') {
    conflicts.push(`Mutation Dispute: AC Land records show active objection/caveat filed`);
  }

  if (conflicts.length > 0) {
    return {
      ruleId: 'REG_MUTATION_MISMATCH',
      name: 'Registration vs Mutation Field Discrepancy',
      weight,
      description: `Critical fields mismatch between Sub-Registry deed and AC Land mutation record for parcel ${parcel.syntheticParcelKey}.`,
      evidence: conflicts
    };
  }

  return null;
}

export function checkMissingFields(parcel, mutations, weight = 10) {
  const conflicts = [];

  if (parcel.surveyGenerations && parcel.surveyGenerations.length >= 2) {
    const cs = parcel.surveyGenerations.find(s => s.surveyType === 'CS');
    const bs = parcel.surveyGenerations.find(s => s.surveyType === 'BS');
    if (cs && bs && Math.abs(cs.recordedAreaDecimal - bs.recordedAreaDecimal) > 0.1) {
      conflicts.push(
        `Cadastral Generation Variance: CS recorded ${cs.recordedAreaDecimal} dec, BS recorded ${bs.recordedAreaDecimal} dec (Delta: ${Math.abs(cs.recordedAreaDecimal - bs.recordedAreaDecimal).toFixed(1)} dec)`
      );
    }
  }

  const mut = mutations.find(m => m.syntheticParcelKey === parcel.syntheticParcelKey);
  if (mut && !mut.isRecordPresent) {
    conflicts.push('Missing Cadastral Khatian linkage between Sub-Registry volume and AC Land mutation khatian.');
  }

  if (conflicts.length > 0) {
    return {
      ruleId: 'MISSING_FIELDS',
      name: 'Inconsistent / Missing Field Metrics',
      weight,
      description: `Survey generation variances or unlinked khatian records require reconciliation across land office archives.`,
      evidence: conflicts
    };
  }

  return null;
}

export function evaluateParcelRisk(parcel, deeds, fingerprints, transfers, registrations, mutations, settings) {
  const rulesTriggered = [];
  const evidenceRefs = [];

  // 1. Double Selling
  const doubleSelling = checkDoubleSelling(parcel, deeds, settings.weightDoubleSelling);
  if (doubleSelling) {
    rulesTriggered.push(doubleSelling);
    const relatedDeeds = deeds.filter(d => d.syntheticParcelKey === parcel.syntheticParcelKey);
    relatedDeeds.forEach(d => evidenceRefs.push(d.deedNo));
  }

  // 2. Document Integrity
  const docIntegrity = checkDocumentIntegrity(parcel, fingerprints, settings.weightDocumentIntegrity);
  if (docIntegrity) {
    rulesTriggered.push(docIntegrity);
    const doc = fingerprints.find(f => f.syntheticContent.includes(parcel.syntheticParcelKey));
    if (doc) evidenceRefs.push(doc.id.toUpperCase());
  }

  // 3. Reg vs Mutation
  const regMut = checkReconciliation(parcel, registrations, mutations, settings.weightRegMutationMismatch);
  if (regMut) {
    rulesTriggered.push(regMut);
    const reg = registrations.find(r => r.syntheticParcelKey === parcel.syntheticParcelKey);
    if (reg) evidenceRefs.push(reg.deedRef);
  }

  // 4. Rapid Transfer
  const rapid = checkRapidTransfers(
    parcel,
    transfers,
    settings.rapidTransferCountThreshold,
    settings.rapidTransferWindowDays,
    settings.weightRapidTransfer
  );
  if (rapid) {
    rulesTriggered.push(rapid);
    const relatedTransfers = transfers.filter(t => t.syntheticParcelKey === parcel.syntheticParcelKey);
    relatedTransfers.forEach(t => evidenceRefs.push(t.deedId));
  }

  // 5. Missing / Inconsistent fields
  const missing = checkMissingFields(parcel, mutations, settings.weightMissingFields);
  if (missing) {
    rulesTriggered.push(missing);
  }

  const rawScore = rulesTriggered.reduce((sum, r) => sum + r.weight, 0);
  const score = Math.min(100, rawScore);
  const severity = calculateSeverity(score);

  return {
    rulesTriggered,
    score,
    severity,
    evidenceRefs: Array.from(new Set(evidenceRefs))
  };
}
