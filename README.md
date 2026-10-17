# 🛡️ LandSentry — Every Transfer Under Watch

**An Explainable Land Fraud & Double-Selling Detection System**

**Event:** LandTech 2026 — LandTech Innovation Hackathon  
**Track:** Digital Land Records, Verification & Digitization  
**Selected Problem:** P3 — Fraud & Double-Selling Detection  
**Project Status:** Working Prototype — Round 1  
**Version:** 1.0.0

---

## 1. Project Overview

LandSentry is a browser-based land-record verification and risk-triage prototype designed to help identify suspicious land transactions and inconsistencies in land records in Bangladesh.

Land-related fraud can involve multiple registered deeds for the same parcel, altered document copies, suspiciously rapid ownership transfers, and discrepancies between Sub-Registry registration records and AC Land mutation records.

LandSentry brings these checks together in one interface. It evaluates synthetic land-record data, generates an explainable risk score, presents the evidence behind each alert, and supports human review through a case-management workflow.

**Our goal is not to replace government authorities or make legal ownership decisions. Our goal is to help reviewers identify records that may require further verification.**

## 2. Problem Statement

**P3 — Fraud & Double-Selling Detection**

LandSentry addresses the challenge of detecting:

- Possible double-selling of the same land parcel to different buyers.
- Document alterations identified through cryptographic hash comparison.
- Suspiciously rapid sequences of ownership transfers.
- Inconsistencies between Sub-Registry deed records and AC Land mutation records.
- Missing or inconsistent information across historical survey records.

The project is designed around the Bangladesh land administration context, including the relationship between registered deeds, khatian/porcha records, mutation records, and historical survey generations such as CS, SA, RS, and BS.

## 3. Key Features

### Risk Monitoring Dashboard

- Displays parcel and deed statistics.
- Highlights open alerts and high-risk cases.
- Provides recent alerts and a local audit trail.

### Parcel & Record Explorer

- Searches and filters synthetic land parcels.
- Presents historical survey information across CS, SA, RS, and BS.
- Highlights relevant record inconsistencies for review.

### Document Integrity Verification

- Computes SHA-256 fingerprints using the browser's Web Crypto API.
- Compares observed document fingerprints with stored reference fingerprints.
- Demonstrates document-tampering detection using controlled prototype scenarios.

### Double-Selling Detection

- Identifies multiple active registered deeds associated with the same synthetic parcel key and different buyer aliases.
- Displays the records that triggered the alert.

### Rapid Transfer Analysis

- Analyzes ownership-transfer timelines.
- Supports configurable transfer-count and time-window thresholds.
- Uses three transfers within 90 days as the default prototype threshold.

### Registration–Mutation Reconciliation

- Compares relevant Sub-Registry and AC Land records.
- Flags buyer-alias conflicts, area discrepancies, missing mutation records, and recorded objections.

### Explainable Risk Scoring

- Assigns weighted scores to triggered rules.
- Shows the evidence associated with each triggered rule.
- Categorizes cases into Low, Medium, and High severity.

### Case Review & Audit

- Supports case-status updates and reviewer notes.
- Provides simulated reviewer roles.
- Maintains a browser-local audit trail of supported actions.

### Data Export & Demonstration Scenarios

- Loads predefined synthetic demonstration scenarios.
- Supports JSON and CSV exports of supported records.
- Includes a reset option for restoring the demonstration dataset.

### Bilingual Interface

- Provides English and Bangla interface translations.
- Includes light and dark visual themes.

## 4. Explainable Risk Assessment

LandSentry uses a deterministic, rule-based risk engine rather than a trained machine-learning model.

The total score is calculated as:

`Risk Score = min(100, sum of triggered rule weights)`

| Detection rule                    | Weight |
| --------------------------------- | -----: |
| Possible double-selling           |    +40 |
| Document integrity mismatch       |    +25 |
| Registration–mutation discrepancy |    +20 |
| Rapid succession transfers        |    +15 |
| Missing or inconsistent fields    |    +10 |

### Severity Classification

| Score  | Severity | Suggested action                        |
| ------ | -------- | --------------------------------------- |
| 0–29   | Low      | Routine monitoring                      |
| 30–59  | Medium   | Further administrative verification     |
| 60–100 | High     | Priority review by relevant authorities |

The scoring thresholds and weights are prototype settings, not official government standards. A high score indicates that a case warrants closer review; it does not prove fraud, forgery, or legal ownership.

## 5. How It Works

1. **Record intake:** The reviewer works with supported documents and the prototype's available record data.
2. **File validation:** Supported uploaded files undergo extension, size, and file-signature checks.
3. **Integrity checking:** The application computes a SHA-256 fingerprint where supported.
4. **Rule evaluation:** The risk engine checks for double-selling, integrity mismatches, rapid transfers, registration–mutation discrepancies, and missing or inconsistent fields.
5. **Risk scoring:** Triggered rule weights are combined into a score capped at 100.
6. **Human review:** The reviewer examines the evidence, updates the case status, and records notes where supported.

The current PDF text-extraction workflow processes text-based PDFs. Image-only scanned PDFs without an extractable text layer are not supported by the current extraction implementation.

## 6. Technology Stack

- **Frontend:** React
- **Programming Language:** JavaScript and TypeScript
- **Build Tool:** Vite
- **Cryptographic Fingerprinting:** Browser Web Crypto API (SHA-256)
- **Document Processing:** Browser-based PDF text extraction with a built-in reader and PDF.js fallback
- **Data Storage:** Browser-local storage
- **Icons:** Lucide React
- **Testing:** Node.js acceptance-test script
- **Version Control:** Git and GitHub

The prototype performs its core risk evaluation locally in the browser. PDF.js may be loaded from a CDN when the built-in PDF reader cannot extract the required text, so that fallback requires network access.

## 7. Getting Started

### Prerequisites

Install:

- Node.js with npm.
- Git, if you plan to clone and contribute to the repository.
- A modern web browser.

### Installation

Clone the repository:

```bash
git clone https://github.com/wasifatin/landsentry-landtech-2026.git
```

Open the project directory:

```bash
cd landsentry-landtech-2026
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal, commonly:

`http://localhost:5173`

### Build and Test

Create a production build:

```bash
npm run build
```

Run the available acceptance tests:

```bash
npm test
```

Preview the production build:

```bash
npm run preview
```

Run these commands from the directory containing `package.json`. A successful build or test run should be verified in your own environment before reporting it as successful.

## 8. Repository Structure

```text
landsentry-landtech-2026/
├── public/
│   └── assets/
├── src/
│   ├── assets/
│   ├── data/
│   │   └── seedData.js
│   ├── i18n/
│   │   └── translations.js
│   ├── repository/
│   │   ├── fileValidator.js
│   │   ├── pdfIngest.js
│   │   └── storage.js
│   ├── rules/
│   │   └── riskEngine.js
│   ├── types/
│   │   └── index.ts
│   ├── app.js
│   ├── signin.js
│   └── index.css
├── tests/
│   └── acceptance_tests.js
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
└── README.md
```

This structure describes the main files in the current prototype; minor differences may exist in the final repository.

## 9. Data Sources, Privacy & Security

LandSentry follows the LandTech 2026 Rule Book's data and security requirements.

- The demonstration dataset uses synthetic, fictional records created for the prototype.
- The application must not be used to collect, display, or process real individuals' personal information or actual private land records for this hackathon.
- No scraping, automated querying, or bulk downloading from government portals is performed.
- The prototype does not connect to live government land-record systems.
- Hash comparisons use stored reference fingerprints and are demonstrated with controlled test scenarios.
- Browser-local processing is used for the core risk evaluation; uploaded information is not intentionally sent to a LandSentry backend.
- Browser storage is not equivalent to a secure production database and must not be treated as one.

**Data source:** Self-generated synthetic demonstration data included in the project source code. No live government database or private real-world land-record dataset is used.

Any external library or asset included in the project should be credited below with its source and applicable licence.

## 10. AI Tool Disclosure

LandSentry's implemented risk engine is deterministic and rule-based. It does not use a trained machine-learning model to produce its risk scores.

AI tools used during development must be disclosed accurately. Complete the following list with every tool actually used by the team:

- **ChatGPT (OpenAI):** [Describe the actual use, such as planning, documentation, code explanation, debugging assistance, or review, only where applicable.]
- **Other AI tools:** [List each tool and its actual use, or write "None".]

The student developers remain responsible for the submitted code, implementation decisions, testing, and technical explanations. Both student members should be able to explain the project's architecture, risk rules, scoring logic, and limitations.

## 11. Limitations & Future Improvements

The current version is a demonstration prototype, not a production-ready government platform.

Known limitations include:

- Risk scores are generated by predefined rules and weights rather than a trained fraud-detection model.
- PDF text extraction does not support image-only scanned PDFs without a text layer.
- Reference fingerprint matching is meaningful only when a trusted reference fingerprint is available.
- The application uses synthetic records and does not verify ownership against live official registries.
- Browser-local storage is not designed for secure multi-user production workflows.
- Role switching and review workflows are prototype simulations, not verified government authentication or authorization.
- A hash match confirms byte-level consistency with a reference, not the authenticity or legal validity of the underlying document.

Potential future improvements include Bangla OCR, authenticated multi-user access, secure server-side audit records, authorized registry integration, and additional validation workflows, subject to legal authorization and privacy safeguards.

## 12. Demo & Submission Links

- **GitHub Repository:** https://github.com/wasifatin/landsentry-landtech-2026
- **Live Demo:** [Add the public HTTPS deployment URL, if available]
- **Demo Video (maximum 3 minutes):** [Add the video link]
- **Concept Note (PDF, maximum 4 pages):** [Add the repository path or link]
- **Hackathon:** LandTech 2026 — Daffodil International University

A live deployment is recommended by the rulebook but is not mandatory for Round 1. The concept note and demo video are separate submission deliverables.

## 13. Team & Mentors

- **Team Name:** Code Inferno X
- **Student 1 / Team Leader:** Fatin Sharhad
- **Student 2:** Md. Tanvir Hossain
- **Faculty Mentor:** Md. Abdullah-Al-Kafi
- **Industry Mentor:** Farvez Rakib



## 14. Development History & Round Updates

This repository retains its Git commit history to support transparency and authorship review.

### Round 1 — Initial Submission

- Initial LandSentry prototype and synthetic demonstration scenarios.
- Explainable rule-based risk assessment.
- Document integrity verification and record-reconciliation workflows.
- Project documentation and setup instructions.

### Changes After Round 1

Update this section before the Final Round with a factual summary of all changes made after the Round 1 submission, including new features, fixes, tests, design changes, and deployment updates.

**No post-Round-1 changes are claimed here until they have actually been made.**

## 15. Third-Party Credits & Licensing

- React: https://react.dev/
- Vite: https://vite.dev/
- Lucide React: https://lucide.dev/
- PDF.js: https://mozilla.github.io/pdf.js/

The project uses the dependencies declared in `package.json`. Refer to each dependency's official licence and include any additional third-party assets or libraries used in the finished repository.

**Project licence:** MIT License

Copyright (c) 2026 Team Code Inferno

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## 16. Disclaimer

LandSentry is an educational and hackathon demonstration prototype. It is not an official government land registry, legal ownership verification service, or fraud adjudication system.

Risk indicators are advisory signals for further investigation. They must not be treated as proof of fraud, forgery, guilt, or legal title. Any real-world deployment would require appropriate legal review, security controls, verified data, and authorization from relevant authorities.

---

**LandSentry — Every Transfer Under Watch**  
_Supporting transparent, explainable, and responsible land-record review in Bangladesh._
