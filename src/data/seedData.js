/**
 * Seed Synthetic Data (ES Module)
 */

export const INITIAL_SETTINGS = {
  rapidTransferWindowDays: 90,
  rapidTransferCountThreshold: 3,
  weightDoubleSelling: 40,
  weightDocumentIntegrity: 25,
  weightRegMutationMismatch: 20,
  weightRapidTransfer: 15,
  weightMissingFields: 10,
  currentReviewerRole: 'Demo Sub-Registrar',
  reviewerAlias: 'REVIEWER-SYN-OFFICER-01'
};

export const SEED_PARCELS = [
  {
    id: 'p-001',
    syntheticParcelKey: 'PARCEL-SYN-DH-001',
    demoDistrict: 'Demo District Dhaka-North',
    demoMouza: 'Demo Mouza 01 (Gulshan-Badda)',
    plotDagNo: '101',
    primaryKhatianRef: 'RS-402',
    declaredArea: 12.0,
    areaUnit: 'Decimals',
    status: 'ACTIVE',
    currentOwnerAlias: 'BUYER-SYN-001',
    scenarioTag: 'Scenario A: Clean Baseline Record',
    surveyGenerations: [
      { surveyType: 'CS', dagNo: '88', khatianNo: 'CS-105', recordedAreaDecimal: 12.0, surveyYear: '1920', remarks: 'Cadastral Survey baseline' },
      { surveyType: 'SA', dagNo: '94', khatianNo: 'SA-210', recordedAreaDecimal: 12.0, surveyYear: '1962', remarks: 'State Acquisition settlement' },
      { surveyType: 'RS', dagNo: '101', khatianNo: 'RS-402', recordedAreaDecimal: 12.0, surveyYear: '1988', remarks: 'Revisional Survey matching parent tract' },
      { surveyType: 'BS', dagNo: '101', khatianNo: 'BS-550', recordedAreaDecimal: 12.0, surveyYear: '2015', remarks: 'City Survey digitized record' }
    ]
  },
  {
    id: 'p-002',
    syntheticParcelKey: 'PARCEL-SYN-DH-002',
    demoDistrict: 'Demo District Dhaka-North',
    demoMouza: 'Demo Mouza 01 (Gulshan-Badda)',
    plotDagNo: '204',
    primaryKhatianRef: 'RS-509',
    declaredArea: 15.5,
    areaUnit: 'Decimals',
    status: 'FLAGGED_FOR_REVIEW',
    currentOwnerAlias: 'SELLER-SYN-002',
    scenarioTag: 'Scenario B: Possible Double-Selling Conflict',
    surveyGenerations: [
      { surveyType: 'CS', dagNo: '180', khatianNo: 'CS-220', recordedAreaDecimal: 15.5, surveyYear: '1920', remarks: 'Cadastral Survey entry' },
      { surveyType: 'SA', dagNo: '192', khatianNo: 'SA-315', recordedAreaDecimal: 15.5, surveyYear: '1962', remarks: 'Recorded parent title' },
      { surveyType: 'RS', dagNo: '204', khatianNo: 'RS-509', recordedAreaDecimal: 15.5, surveyYear: '1988', remarks: 'Revisional Survey record' },
      { surveyType: 'BS', dagNo: '204', khatianNo: 'BS-680', recordedAreaDecimal: 15.5, surveyYear: '2015', remarks: 'Pending reconciliation' }
    ]
  },
  {
    id: 'p-003',
    syntheticParcelKey: 'PARCEL-SYN-DH-003',
    demoDistrict: 'Demo District Dhaka-West',
    demoMouza: 'Demo Mouza 02 (Mirpur-Kalyanpur)',
    plotDagNo: '305',
    primaryKhatianRef: 'RS-612',
    declaredArea: 10.0,
    areaUnit: 'Decimals',
    status: 'FLAGGED_FOR_REVIEW',
    currentOwnerAlias: 'BUYER-SYN-004',
    scenarioTag: 'Scenario C: Altered Document Hash Mismatch',
    surveyGenerations: [
      { surveyType: 'CS', dagNo: '290', khatianNo: 'CS-340', recordedAreaDecimal: 10.0, surveyYear: '1920', remarks: 'Original parent dag' },
      { surveyType: 'SA', dagNo: '298', khatianNo: 'SA-410', recordedAreaDecimal: 10.0, surveyYear: '1962', remarks: 'Settlement record' },
      { surveyType: 'RS', dagNo: '305', khatianNo: 'RS-612', recordedAreaDecimal: 10.0, surveyYear: '1988', remarks: 'Revisional survey confirmed' },
      { surveyType: 'BS', dagNo: '305', khatianNo: 'BS-730', recordedAreaDecimal: 10.0, surveyYear: '2015', remarks: 'BS publication' }
    ]
  },
  {
    id: 'p-004',
    syntheticParcelKey: 'PARCEL-SYN-DH-004',
    demoDistrict: 'Demo District Gazipur-South',
    demoMouza: 'Demo Mouza 03 (Tongi Industrial)',
    plotDagNo: '408',
    primaryKhatianRef: 'RS-718',
    declaredArea: 8.2,
    areaUnit: 'Decimals',
    status: 'FLAGGED_FOR_REVIEW',
    currentOwnerAlias: 'BUYER-SYN-007',
    scenarioTag: 'Scenario D: Rapid Transfer Sequence (Velocity)',
    surveyGenerations: [
      { surveyType: 'CS', dagNo: '380', khatianNo: 'CS-480', recordedAreaDecimal: 8.2, surveyYear: '1920', remarks: 'Agricultural tract' },
      { surveyType: 'SA', dagNo: '395', khatianNo: 'SA-520', recordedAreaDecimal: 8.2, surveyYear: '1962', remarks: 'Partition record' },
      { surveyType: 'RS', dagNo: '408', khatianNo: 'RS-718', recordedAreaDecimal: 8.2, surveyYear: '1988', remarks: 'RS commercial boundary' },
      { surveyType: 'BS', dagNo: '408', khatianNo: 'BS-840', recordedAreaDecimal: 8.2, surveyYear: '2015', remarks: 'BS verification pending' }
    ]
  },
  {
    id: 'p-005',
    syntheticParcelKey: 'PARCEL-SYN-DH-005',
    demoDistrict: 'Demo District Dhaka-West',
    demoMouza: 'Demo Mouza 02 (Mirpur-Kalyanpur)',
    plotDagNo: '512',
    primaryKhatianRef: 'RS-820',
    declaredArea: 20.0,
    areaUnit: 'Decimals',
    status: 'FLAGGED_FOR_REVIEW',
    currentOwnerAlias: 'BUYER-SYN-008',
    scenarioTag: 'Scenario E: Registration vs Mutation Mismatch',
    surveyGenerations: [
      { surveyType: 'CS', dagNo: '480', khatianNo: 'CS-560', recordedAreaDecimal: 20.0, surveyYear: '1920', remarks: 'Original holding' },
      { surveyType: 'SA', dagNo: '492', khatianNo: 'SA-630', recordedAreaDecimal: 20.0, surveyYear: '1962', remarks: 'SA record' },
      { surveyType: 'RS', dagNo: '512', khatianNo: 'RS-820', recordedAreaDecimal: 20.0, surveyYear: '1988', remarks: 'RS holding 20.0 dec' },
      { surveyType: 'BS', dagNo: '512', khatianNo: 'BS-910', recordedAreaDecimal: 14.5, surveyYear: '2015', remarks: 'BS notes 5.5 dec contested acquisition' }
    ]
  },
  {
    id: 'p-006',
    syntheticParcelKey: 'PARCEL-SYN-DH-006',
    demoDistrict: 'Demo District Narayanganj',
    demoMouza: 'Demo Mouza 04 (Fatullah Riverside)',
    plotDagNo: '615',
    primaryKhatianRef: 'RS-930',
    declaredArea: 25.0,
    areaUnit: 'Decimals',
    status: 'MUTATION_PENDING',
    currentOwnerAlias: 'BUYER-SYN-010',
    scenarioTag: 'Scenario F: Missing / Incomplete Critical Record',
    surveyGenerations: [
      { surveyType: 'CS', dagNo: '570', khatianNo: 'CS-610', recordedAreaDecimal: 25.0, surveyYear: '1920', remarks: 'Riverside embankment' },
      { surveyType: 'SA', dagNo: '585', khatianNo: 'SA-712', recordedAreaDecimal: 25.0, surveyYear: '1962', remarks: 'SA holding' },
      { surveyType: 'RS', dagNo: '615', khatianNo: 'RS-930', recordedAreaDecimal: 25.0, surveyYear: '1988', remarks: 'RS surveyed dag' },
      { surveyType: 'BS', dagNo: '615', khatianNo: 'BS-995', recordedAreaDecimal: 25.0, surveyYear: '2015', remarks: 'Unverified mutation link' }
    ]
  }
];

export const SEED_DEEDS = [
  {
    id: 'd-001',
    parcelId: 'p-001',
    syntheticParcelKey: 'PARCEL-SYN-DH-001',
    deedNo: 'DEED-SYN-2025-012',
    sellerAlias: 'SELLER-SYN-001',
    buyerAlias: 'BUYER-SYN-001',
    deedDate: '2025-11-15',
    declaredArea: 12.0,
    saleStatus: 'REGISTERED',
    sourceRegistryOffice: 'Demo Sub-Registry Office Dhaka Sadar',
    syntheticDocumentId: 'doc-001'
  },
  {
    id: 'd-002',
    parcelId: 'p-002',
    syntheticParcelKey: 'PARCEL-SYN-DH-002',
    deedNo: 'DEED-SYN-2026-089',
    sellerAlias: 'SELLER-SYN-002',
    buyerAlias: 'BUYER-SYN-002',
    deedDate: '2026-08-10',
    declaredArea: 15.5,
    saleStatus: 'REGISTERED',
    sourceRegistryOffice: 'Demo Sub-Registry Office Tejgaon',
    syntheticDocumentId: 'doc-004'
  },
  {
    id: 'd-003',
    parcelId: 'p-002',
    syntheticParcelKey: 'PARCEL-SYN-DH-002',
    deedNo: 'DEED-SYN-2026-104',
    sellerAlias: 'SELLER-SYN-002',
    buyerAlias: 'BUYER-SYN-003',
    deedDate: '2026-09-02',
    declaredArea: 15.5,
    saleStatus: 'REGISTERED',
    sourceRegistryOffice: 'Demo Sub-Registry Office Gulshan',
    syntheticDocumentId: 'doc-005'
  },
  {
    id: 'd-004',
    parcelId: 'p-003',
    syntheticParcelKey: 'PARCEL-SYN-DH-003',
    deedNo: 'DEED-SYN-2026-045',
    sellerAlias: 'SELLER-SYN-003',
    buyerAlias: 'BUYER-SYN-004',
    deedDate: '2026-04-12',
    declaredArea: 10.0,
    saleStatus: 'REGISTERED',
    sourceRegistryOffice: 'Demo Sub-Registry Office Mirpur',
    syntheticDocumentId: 'doc-002'
  },
  {
    id: 'd-005',
    parcelId: 'p-004',
    syntheticParcelKey: 'PARCEL-SYN-DH-004',
    deedNo: 'DEED-SYN-2026-051',
    sellerAlias: 'SELLER-SYN-004',
    buyerAlias: 'BUYER-SYN-005',
    deedDate: '2026-07-01',
    declaredArea: 8.2,
    saleStatus: 'REGISTERED',
    sourceRegistryOffice: 'Demo Sub-Registry Office Tongi',
    syntheticDocumentId: 'doc-006'
  },
  {
    id: 'd-006',
    parcelId: 'p-004',
    syntheticParcelKey: 'PARCEL-SYN-DH-004',
    deedNo: 'DEED-SYN-2026-063',
    sellerAlias: 'BUYER-SYN-005',
    buyerAlias: 'BUYER-SYN-006',
    deedDate: '2026-07-20',
    declaredArea: 8.2,
    saleStatus: 'REGISTERED',
    sourceRegistryOffice: 'Demo Sub-Registry Office Tongi',
    syntheticDocumentId: 'doc-007'
  },
  {
    id: 'd-007',
    parcelId: 'p-004',
    syntheticParcelKey: 'PARCEL-SYN-DH-004',
    deedNo: 'DEED-SYN-2026-078',
    sellerAlias: 'BUYER-SYN-006',
    buyerAlias: 'BUYER-SYN-007',
    deedDate: '2026-08-12',
    declaredArea: 8.2,
    saleStatus: 'REGISTERED',
    sourceRegistryOffice: 'Demo Sub-Registry Office Tongi',
    syntheticDocumentId: 'doc-008'
  },
  {
    id: 'd-008',
    parcelId: 'p-005',
    syntheticParcelKey: 'PARCEL-SYN-DH-005',
    deedNo: 'DEED-SYN-2026-077',
    sellerAlias: 'SELLER-SYN-005',
    buyerAlias: 'BUYER-SYN-008',
    deedDate: '2026-05-18',
    declaredArea: 20.0,
    saleStatus: 'REGISTERED',
    sourceRegistryOffice: 'Demo Sub-Registry Office Mirpur',
    syntheticDocumentId: 'doc-009'
  },
  {
    id: 'd-009',
    parcelId: 'p-006',
    syntheticParcelKey: 'PARCEL-SYN-DH-006',
    deedNo: 'DEED-SYN-2026-092',
    sellerAlias: 'SELLER-SYN-006',
    buyerAlias: 'BUYER-SYN-010',
    deedDate: '2026-06-20',
    declaredArea: 25.0,
    saleStatus: 'REGISTERED',
    sourceRegistryOffice: 'Demo Sub-Registry Office Fatullah',
    syntheticDocumentId: 'doc-003'
  }
];

export const SEED_REGISTRATIONS = [
  {
    id: 'reg-001',
    parcelId: 'p-001',
    syntheticParcelKey: 'PARCEL-SYN-DH-001',
    deedRef: 'DEED-SYN-2025-012',
    sellerAlias: 'SELLER-SYN-001',
    buyerAlias: 'BUYER-SYN-001',
    area: 12.0,
    areaUnit: 'Decimals',
    transferDate: '2025-11-15',
    registrationStatus: 'COMPLETED',
    surveyKhatianRef: 'RS-402',
    subRegistryOffice: 'Demo Sub-Registry Office Dhaka Sadar'
  },
  {
    id: 'reg-002',
    parcelId: 'p-002',
    syntheticParcelKey: 'PARCEL-SYN-DH-002',
    deedRef: 'DEED-SYN-2026-089',
    sellerAlias: 'SELLER-SYN-002',
    buyerAlias: 'BUYER-SYN-002',
    area: 15.5,
    areaUnit: 'Decimals',
    transferDate: '2026-08-10',
    registrationStatus: 'COMPLETED',
    surveyKhatianRef: 'RS-509',
    subRegistryOffice: 'Demo Sub-Registry Office Tejgaon'
  },
  {
    id: 'reg-003',
    parcelId: 'p-003',
    syntheticParcelKey: 'PARCEL-SYN-DH-003',
    deedRef: 'DEED-SYN-2026-045',
    sellerAlias: 'SELLER-SYN-003',
    buyerAlias: 'BUYER-SYN-004',
    area: 10.0,
    areaUnit: 'Decimals',
    transferDate: '2026-04-12',
    registrationStatus: 'COMPLETED',
    surveyKhatianRef: 'RS-612',
    subRegistryOffice: 'Demo Sub-Registry Office Mirpur'
  },
  {
    id: 'reg-004',
    parcelId: 'p-004',
    syntheticParcelKey: 'PARCEL-SYN-DH-004',
    deedRef: 'DEED-SYN-2026-078',
    sellerAlias: 'BUYER-SYN-006',
    buyerAlias: 'BUYER-SYN-007',
    area: 8.2,
    areaUnit: 'Decimals',
    transferDate: '2026-08-12',
    registrationStatus: 'COMPLETED',
    surveyKhatianRef: 'RS-718',
    subRegistryOffice: 'Demo Sub-Registry Office Tongi'
  },
  {
    id: 'reg-005',
    parcelId: 'p-005',
    syntheticParcelKey: 'PARCEL-SYN-DH-005',
    deedRef: 'DEED-SYN-2026-077',
    sellerAlias: 'SELLER-SYN-005',
    buyerAlias: 'BUYER-SYN-008',
    area: 20.0,
    areaUnit: 'Decimals',
    transferDate: '2026-05-18',
    registrationStatus: 'COMPLETED',
    surveyKhatianRef: 'RS-820',
    subRegistryOffice: 'Demo Sub-Registry Office Mirpur'
  },
  {
    id: 'reg-006',
    parcelId: 'p-006',
    syntheticParcelKey: 'PARCEL-SYN-DH-006',
    deedRef: 'DEED-SYN-2026-092',
    sellerAlias: 'SELLER-SYN-006',
    buyerAlias: 'BUYER-SYN-010',
    area: 25.0,
    areaUnit: 'Decimals',
    transferDate: '2026-06-20',
    registrationStatus: 'COMPLETED',
    surveyKhatianRef: 'RS-930',
    subRegistryOffice: 'Demo Sub-Registry Office Fatullah'
  }
];

export const SEED_MUTATIONS = [
  {
    id: 'mut-001',
    parcelId: 'p-001',
    syntheticParcelKey: 'PARCEL-SYN-DH-001',
    deedRef: 'DEED-SYN-2025-012',
    sellerAlias: 'SELLER-SYN-001',
    buyerAlias: 'BUYER-SYN-001',
    area: 12.0,
    areaUnit: 'Decimals',
    mutationDate: '2025-12-05',
    mutationStatus: 'MUTATION_APPROVED',
    surveyKhatianRef: 'RS-402',
    acLandOffice: 'Demo AC Land Office Tejgaon Revenue Circle',
    isRecordPresent: true
  },
  {
    id: 'mut-002',
    parcelId: 'p-002',
    syntheticParcelKey: 'PARCEL-SYN-DH-002',
    deedRef: 'DEED-SYN-2026-089',
    sellerAlias: 'SELLER-SYN-002',
    buyerAlias: 'BUYER-SYN-002',
    area: 15.5,
    areaUnit: 'Decimals',
    mutationDate: '2026-08-28',
    mutationStatus: 'OBJECTION_FILED',
    surveyKhatianRef: 'RS-509',
    acLandOffice: 'Demo AC Land Office Tejgaon Revenue Circle',
    isRecordPresent: true
  },
  {
    id: 'mut-003',
    parcelId: 'p-003',
    syntheticParcelKey: 'PARCEL-SYN-DH-003',
    deedRef: 'DEED-SYN-2026-045',
    sellerAlias: 'SELLER-SYN-003',
    buyerAlias: 'BUYER-SYN-004',
    area: 10.0,
    areaUnit: 'Decimals',
    mutationDate: '2026-05-02',
    mutationStatus: 'MUTATION_APPROVED',
    surveyKhatianRef: 'RS-612',
    acLandOffice: 'Demo AC Land Office Mirpur Circle',
    isRecordPresent: true
  },
  {
    id: 'mut-004',
    parcelId: 'p-004',
    syntheticParcelKey: 'PARCEL-SYN-DH-004',
    deedRef: 'DEED-SYN-2026-078',
    sellerAlias: 'BUYER-SYN-006',
    buyerAlias: 'BUYER-SYN-007',
    area: 8.2,
    areaUnit: 'Decimals',
    mutationDate: '2026-08-25',
    mutationStatus: 'UNDER_INSPECTION',
    surveyKhatianRef: 'RS-718',
    acLandOffice: 'Demo AC Land Office Tongi Circle',
    isRecordPresent: true
  },
  {
    id: 'mut-005',
    parcelId: 'p-005',
    syntheticParcelKey: 'PARCEL-SYN-DH-005',
    deedRef: 'DEED-SYN-2026-077',
    sellerAlias: 'SELLER-SYN-005',
    buyerAlias: 'BUYER-SYN-009',
    area: 14.5,
    areaUnit: 'Decimals',
    mutationDate: '2026-06-15',
    mutationStatus: 'MUTATION_SANCTIONED',
    surveyKhatianRef: 'RS-820',
    acLandOffice: 'Demo AC Land Office Mirpur Circle',
    isRecordPresent: true
  },
  {
    id: 'mut-006',
    parcelId: 'p-006',
    syntheticParcelKey: 'PARCEL-SYN-DH-006',
    deedRef: 'NOT_FOUND',
    sellerAlias: 'N/A',
    buyerAlias: 'N/A',
    area: 0,
    areaUnit: 'Decimals',
    mutationDate: 'N/A',
    mutationStatus: 'RECORD_MISSING',
    surveyKhatianRef: 'N/A',
    acLandOffice: 'Demo AC Land Office Narayanganj Sadar',
    isRecordPresent: false
  }
];

export const SEED_FINGERPRINTS = [
  {
    id: 'doc-001',
    recordId: 'd-001',
    documentTitle: 'Synthetic Deed Copy 2025-012 (Verified Reference)',
    syntheticContent: 'JOMIGUARD-SYNTHETIC-DEED-DOC-001|PARCEL:PARCEL-SYN-DH-001|PLOT:101|AREA:12.0|SELLER:SELLER-SYN-001|BUYER:BUYER-SYN-001|DATE:2025-11-15',
    referenceSha256: 'c54aa8ef6504de87f518eef2ae9839b0e54f672f7b643ceee9ee34868a2ffea9',
    observedSha256: 'c54aa8ef6504de87f518eef2ae9839b0e54f672f7b643ceee9ee34868a2ffea9',
    integrityStatus: 'MATCH',
    notes: 'Cryptographic fingerprint matches authorized Sub-Registry reference copy verbatim.'
  },
  {
    id: 'doc-002',
    recordId: 'd-004',
    documentTitle: 'Synthetic Deed Copy 2026-045 (Altered Content Test)',
    syntheticContent: 'JOMIGUARD-SYNTHETIC-DEED-DOC-002|PARCEL:PARCEL-SYN-DH-003|PLOT:305|AREA:18.0|SELLER:SELLER-SYN-003|BUYER:BUYER-SYN-004|DATE:2026-04-12',
    referenceSha256: '3e82cb536f036a2ccc1170081fca9c071b3f6858baa3c04e0360d124eaf12053',
    observedSha256: 'fa8d6b3cf54f912138904bc365cd875e28195e0ba98c70538357b20368017295',
    integrityStatus: 'MISMATCH',
    notes: 'Observed content hash differs from reference archive fingerprint (Area field altered from 10.0 to 18.0). Note: Cryptographic hash comparison checks against stored reference only; does not prove legal validity or ownership.',
    tamperSimulated: true
  },
  {
    id: 'doc-003',
    recordId: 'd-009',
    documentTitle: 'Synthetic Deed Copy 2026-092 (Metadata Discrepancy)',
    syntheticContent: 'JOMIGUARD-SYNTHETIC-DEED-DOC-003|PARCEL:PARCEL-SYN-DH-006|PLOT:615|AREA:25.0|SELLER:SELLER-SYN-006|BUYER:BUYER-SYN-010|DATE:2026-06-20',
    referenceSha256: '152fea107d0a2cd884d188200eab0db4891f89d9be2485a6ce92a19d227ddbad',
    observedSha256: '152fea107d0a2cd884d188200eab0db4891f89d9be2485a6ce92a19d227ddbad',
    integrityStatus: 'METADATA_INCONSISTENCY',
    inconsistentFields: ['Khatian Linkage Missing', 'Unverified Boundary Co-ordinates in Mouza Map'],
    notes: 'Cryptographic hash matches internal body, but external registry seal reflects missing AC Land mutation endorsement.'
  }
];

export const SEED_TRANSFERS = [
  {
    id: 'tr-001',
    parcelId: 'p-001',
    syntheticParcelKey: 'PARCEL-SYN-DH-001',
    eventDate: '2025-11-15',
    deedId: 'DEED-SYN-2025-012',
    sellerAlias: 'SELLER-SYN-001',
    buyerAlias: 'BUYER-SYN-001',
    area: 12.0,
    status: 'NORMAL_TRANSFER'
  },
  {
    id: 'tr-002',
    parcelId: 'p-002',
    syntheticParcelKey: 'PARCEL-SYN-DH-002',
    eventDate: '2026-08-10',
    deedId: 'DEED-SYN-2026-089',
    sellerAlias: 'SELLER-SYN-002',
    buyerAlias: 'BUYER-SYN-002',
    area: 15.5,
    status: 'ACTIVE_TRANSFER_1'
  },
  {
    id: 'tr-003',
    parcelId: 'p-002',
    syntheticParcelKey: 'PARCEL-SYN-DH-002',
    eventDate: '2026-09-02',
    deedId: 'DEED-SYN-2026-104',
    sellerAlias: 'SELLER-SYN-002',
    buyerAlias: 'BUYER-SYN-003',
    area: 15.5,
    status: 'ACTIVE_TRANSFER_2_CONFLICT'
  },
  {
    id: 'tr-004',
    parcelId: 'p-003',
    syntheticParcelKey: 'PARCEL-SYN-DH-003',
    eventDate: '2026-04-12',
    deedId: 'DEED-SYN-2026-045',
    sellerAlias: 'SELLER-SYN-003',
    buyerAlias: 'BUYER-SYN-004',
    area: 10.0,
    status: 'DOCUMENT_TAMPER_FLAGGED'
  },
  {
    id: 'tr-005',
    parcelId: 'p-004',
    syntheticParcelKey: 'PARCEL-SYN-DH-004',
    eventDate: '2026-07-01',
    deedId: 'DEED-SYN-2026-051',
    sellerAlias: 'SELLER-SYN-004',
    buyerAlias: 'BUYER-SYN-005',
    area: 8.2,
    status: 'TRANSFER_LEG_1'
  },
  {
    id: 'tr-006',
    parcelId: 'p-004',
    syntheticParcelKey: 'PARCEL-SYN-DH-004',
    eventDate: '2026-07-20',
    deedId: 'DEED-SYN-2026-063',
    sellerAlias: 'BUYER-SYN-005',
    buyerAlias: 'BUYER-SYN-006',
    area: 8.2,
    status: 'TRANSFER_LEG_2'
  },
  {
    id: 'tr-007',
    parcelId: 'p-004',
    syntheticParcelKey: 'PARCEL-SYN-DH-004',
    eventDate: '2026-08-12',
    deedId: 'DEED-SYN-2026-078',
    sellerAlias: 'BUYER-SYN-006',
    buyerAlias: 'BUYER-SYN-007',
    area: 8.2,
    status: 'TRANSFER_LEG_3'
  },
  {
    id: 'tr-008',
    parcelId: 'p-005',
    syntheticParcelKey: 'PARCEL-SYN-DH-005',
    eventDate: '2026-05-18',
    deedId: 'DEED-SYN-2026-077',
    sellerAlias: 'SELLER-SYN-005',
    buyerAlias: 'BUYER-SYN-008',
    area: 20.0,
    status: 'RECONCILIATION_MISMATCH'
  },
  {
    id: 'tr-009',
    parcelId: 'p-006',
    syntheticParcelKey: 'PARCEL-SYN-DH-006',
    eventDate: '2026-06-20',
    deedId: 'DEED-SYN-2026-092',
    sellerAlias: 'SELLER-SYN-006',
    buyerAlias: 'BUYER-SYN-010',
    area: 25.0,
    status: 'MISSING_MUTATION_RECORD'
  }
];

export const SEED_ALERTS = [
  {
    id: 'alt-001',
    parcelId: 'p-002',
    syntheticParcelKey: 'PARCEL-SYN-DH-002',
    rulesTriggered: [
      {
        ruleId: 'DOUBLE_SELLING',
        name: 'Possible Double-Selling Conflict',
        weight: 40,
        description: 'Multiple unresolved active sale deeds registered to distinct buyer aliases for identical parcel key.',
        evidence: [
          'Deed DEED-SYN-2026-089 (Buyer: BUYER-SYN-002, Date: 2026-08-10)',
          'Deed DEED-SYN-2026-104 (Buyer: BUYER-SYN-003, Date: 2026-09-02)',
          'Canonical Synthetic Key: PARCEL-SYN-DH-002 (Plot 204, RS-509)'
        ]
      },
      {
        ruleId: 'REG_MUTATION_MISMATCH',
        name: 'Registration vs Mutation Status Conflict',
        weight: 20,
        description: 'Second buyer deed has not cleared mutation due to prior objection filed at AC Land office.',
        evidence: ['AC Land recorded mutation status: OBJECTION_FILED']
      }
    ],
    score: 60,
    severity: 'HIGH',
    evidenceRefs: ['DEED-SYN-2026-089', 'DEED-SYN-2026-104', 'MUT-SYN-002'],
    status: 'Escalated for Authorized Review',
    notes: 'Simulated high-risk duplicate sale conflict flagged for Assistant Commissioner (Land) and Sub-Registrar joint hearing.',
    assignedReviewerAlias: 'REVIEWER-SYN-OFFICER-01',
    createdAt: '2026-09-03T10:15:00Z',
    updatedAt: '2026-09-04T14:20:00Z',
    scenarioTag: 'Scenario B: Possible Double-Selling Conflict'
  },
  {
    id: 'alt-002',
    parcelId: 'p-003',
    syntheticParcelKey: 'PARCEL-SYN-DH-003',
    rulesTriggered: [
      {
        ruleId: 'DOCUMENT_INTEGRITY',
        name: 'Document Cryptographic Integrity Mismatch',
        weight: 25,
        description: 'Observed SHA-256 hash differs from stored reference copy recorded during deed intake.',
        evidence: [
          'Reference Hash: 3e82cb536f036a2ccc1170081fca9c071b3f6858baa3c04e0360d124eaf12053',
          'Observed Hash: fa8d6b3cf54f912138904bc365cd875e28195e0ba98c70538357b20368017295',
          'Discrepancy: Declared area text altered from 10.0 to 18.0 decimals'
        ]
      },
      {
        ruleId: 'MISSING_FIELDS',
        name: 'Inconsistent Parcel Dimension Metric',
        weight: 10,
        description: 'Documented area in presentation copy exceeds parent cadastral allocation.',
        evidence: ['Document states 18.0 dec vs Survey allocation of 10.0 dec']
      }
    ],
    score: 35,
    severity: 'MEDIUM',
    evidenceRefs: ['DOC-SYN-002', 'DEED-SYN-2026-045'],
    status: 'Under Review',
    notes: 'Cryptographic fingerprint alert: digital copy has been modified after initial scan.',
    assignedReviewerAlias: 'REVIEWER-SYN-AUDITOR-02',
    createdAt: '2026-04-15T09:30:00Z',
    updatedAt: '2026-04-16T11:00:00Z',
    scenarioTag: 'Scenario C: Altered Document Hash Mismatch'
  },
  {
    id: 'alt-003',
    parcelId: 'p-004',
    syntheticParcelKey: 'PARCEL-SYN-DH-004',
    rulesTriggered: [
      {
        ruleId: 'RAPID_TRANSFER',
        name: 'Rapid Succession Transfer Pattern',
        weight: 15,
        description: 'Parcel underwent 3 consecutive transfers within 42 days (Threshold: 3 transfers / 90 days).',
        evidence: [
          'Transfer 1: 2026-07-01 (SELLER-SYN-004 -> BUYER-SYN-005)',
          'Transfer 2: 2026-07-20 (BUYER-SYN-005 -> BUYER-SYN-006)',
          'Transfer 3: 2026-08-12 (BUYER-SYN-006 -> BUYER-SYN-007)',
          'Total Span: 42 calendar days'
        ]
      },
      {
        ruleId: 'REG_MUTATION_MISMATCH',
        name: 'Intermediary Mutation Inspection Pending',
        weight: 20,
        description: 'Intermediate owner executed onward sale prior to regularized AC Land mutation sanction.',
        evidence: ['Mutation record MUT-SYN-004 status: UNDER_INSPECTION']
      }
    ],
    score: 35,
    severity: 'MEDIUM',
    evidenceRefs: ['DEED-SYN-2026-051', 'DEED-SYN-2026-063', 'DEED-SYN-2026-078'],
    status: 'New',
    notes: 'Rapid chain-flipping pattern detected. Recommend field verification of possession.',
    assignedReviewerAlias: 'REVIEWER-SYN-OFFICER-01',
    createdAt: '2026-08-14T08:00:00Z',
    updatedAt: '2026-08-14T08:00:00Z',
    scenarioTag: 'Scenario D: Rapid Transfer Sequence (Velocity)'
  },
  {
    id: 'alt-004',
    parcelId: 'p-005',
    syntheticParcelKey: 'PARCEL-SYN-DH-005',
    rulesTriggered: [
      {
        ruleId: 'REG_MUTATION_MISMATCH',
        name: 'Registration vs Mutation Field Mismatch',
        weight: 20,
        description: 'Critical fields conflict between Sub-Registry deed registration and AC Land mutation record.',
        evidence: [
          'Buyer Alias Mismatch: Sub-Registry has BUYER-SYN-008; AC Land has BUYER-SYN-009',
          'Area Mismatch: Sub-Registry registered 20.0 Decimals; AC Land recorded 14.5 Decimals',
          'Delta: 5.5 Decimals discrepancy'
        ]
      },
      {
        ruleId: 'MISSING_FIELDS',
        name: 'Partial Land Acquisition Unaccounted in Deed',
        weight: 10,
        description: 'Sub-registry deed omitted BS note regarding 5.5 decimals government canal acquisition.',
        evidence: ['BS survey remarks indicate 5.5 dec contested acquisition']
      }
    ],
    score: 30,
    severity: 'MEDIUM',
    evidenceRefs: ['REG-SYN-005', 'MUT-SYN-005', 'DEED-SYN-2026-077'],
    status: 'New',
    notes: 'Discrepancy between Sub-Registry volume and AC Land mutation khatian.',
    assignedReviewerAlias: 'REVIEWER-SYN-OFFICER-01',
    createdAt: '2026-06-18T14:45:00Z',
    updatedAt: '2026-06-18T14:45:00Z',
    scenarioTag: 'Scenario E: Registration vs Mutation Mismatch'
  },
  {
    id: 'alt-005',
    parcelId: 'p-006',
    syntheticParcelKey: 'PARCEL-SYN-DH-006',
    rulesTriggered: [
      {
        ruleId: 'REG_MUTATION_MISMATCH',
        name: 'Mutation Record Absent from Synthetic Dataset',
        weight: 20,
        description: 'Deed DEED-SYN-2026-092 registered at Sub-Registry, but no corresponding AC Land mutation file found.',
        evidence: [
          'Sub-Registry Registration REG-SYN-006 present (2026-06-20)',
          'AC Land Mutation record: MISSING / NOT RECORDED',
          'Requires physical record search at AC Land circle office'
        ]
      },
      {
        ruleId: 'MISSING_FIELDS',
        name: 'Unverified Cadastral Khatian Linkage',
        weight: 10,
        description: 'Khatian lineage incomplete between RS-930 and pending BS publication.',
        evidence: ['BS survey link unverified in demo records']
      }
    ],
    score: 30,
    severity: 'MEDIUM',
    evidenceRefs: ['REG-SYN-006', 'DEED-SYN-2026-092'],
    status: 'New',
    notes: 'Missing mutation reconciliation. Requires authorized manual verification at Upazila Land Office.',
    assignedReviewerAlias: 'REVIEWER-SYN-AUDITOR-02',
    createdAt: '2026-06-25T11:20:00Z',
    updatedAt: '2026-06-25T11:20:00Z',
    scenarioTag: 'Scenario F: Missing / Incomplete Critical Record'
  }
];

export const SEED_AUDIT_LOGS = [
  {
    id: 'aud-001',
    caseId: 'alt-001',
    actorAlias: 'REVIEWER-SYN-OFFICER-01',
    action: 'STATUS_ESCALATED',
    timestamp: '2026-09-04T14:20:00Z',
    details: 'Status changed from "Under Review" to "Escalated for Authorized Review". Dual-deed conflict on PARCEL-SYN-DH-002.'
  },
  {
    id: 'aud-002',
    caseId: 'alt-002',
    actorAlias: 'REVIEWER-SYN-AUDITOR-02',
    action: 'NOTE_ADDED',
    timestamp: '2026-04-16T11:00:00Z',
    details: 'Added reviewer note: SHA-256 fingerprint verified against offline registry snapshot; area divergence confirmed.'
  },
  {
    id: 'aud-003',
    caseId: 'alt-003',
    actorAlias: 'SYSTEM_RULES_ENGINE',
    action: 'ALERT_GENERATED',
    timestamp: '2026-08-14T08:00:00Z',
    details: 'Triggered RAPID_TRANSFER (3 transfers in 42 days) on PARCEL-SYN-DH-004.'
  },
  {
    id: 'aud-004',
    caseId: 'alt-004',
    actorAlias: 'SYSTEM_RULES_ENGINE',
    action: 'ALERT_GENERATED',
    timestamp: '2026-06-18T14:45:00Z',
    details: 'Triggered REG_MUTATION_MISMATCH (Area & Buyer alias conflict) on PARCEL-SYN-DH-005.'
  },
  {
    id: 'aud-005',
    caseId: 'alt-005',
    actorAlias: 'SYSTEM_RULES_ENGINE',
    action: 'ALERT_GENERATED',
    timestamp: '2026-06-25T11:20:00Z',
    details: 'Triggered MISSING_RECORD (AC Land mutation unlinked) on PARCEL-SYN-DH-006.'
  }
];
