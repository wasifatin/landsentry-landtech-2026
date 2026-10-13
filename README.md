# 🛡️ JomiGuard AI — Land Fraud & Double-Selling Detection System

**Hackathon:** LandTech 2026  
**Track:** Digital Land Records, Verification & Digitization  
**Selected Problem:** P3 — Fraud & Double-Selling Detection  
**Role & Status:** Advisory Triage & Human Review Demonstrator (Prototype v1.0.0)

---

> [!IMPORTANT]
> ### 🛑 Critical Compliance & Demonstration Notice
> **DEMO ONLY — Self-Generated Synthetic Records Only.**  
> - JomiGuard AI is **NOT** an official government land registry, a legal ownership oracle, or a fraud adjudication court.
> - **Never treats a risk score or hash match as legal proof of title or guilt.** The system generates rule-based advisory triage signals to prioritize human review by authorized officers (Sub-Registrars and Assistant Commissioners of Land).
> - **Zero Genuine Personal Data:** All names, IDs, phone numbers, and addresses in this application are fictional demonstration aliases (e.g., `PERSON-SYN-001`, `BUYER-SYN-004`).
> - **Zero Live Government Connection:** No scraping, automated queries, or connections to any live government or third-party land portals exist. All processing is confined to this local prototype.

---

## 📌 Problem Context & Bangladesh Land Administration Reality

In Bangladesh's land administration system, property record management has historically suffered from structural bottlenecks:
1. **Institutional Separation (The Sub-Registry vs. AC Land Chasm):**
   - **Deed Registration** is administered by the Directorate of Registration under the **Ministry of Law, Justice and Parliamentary Affairs**.
   - **Mutation (Namzari) & Record-of-Rights (Khatian)** maintenance is administered by the Upazila Land Office under the **Ministry of Land**.
   - Because these two systems historically operated in physical silos without atomic, synchronized ledger verification, bad actors exploit the delay between deed registration and mutation to sell the same plot multiple times to different buyers (**Double-Selling**).
2. **Multi-Generational Cadastral Surveys:**
   - Plots transition across historical survey generations: **CS** (Cadastral Survey, ~1920) ➔ **SA** (State Acquisition, ~1962) ➔ **RS** (Revisional Survey, ~1988) ➔ **BS/City Survey** (~2015).
   - Plot/Dag numbers split, merge, and vary across generations. Discrepancies often emerge from legitimate partitions, but can also be manipulated using forged paper deeds.
3. **Forged & Altered Scanned Deeds:**
   - Physical deed copies presented for mutation frequently contain altered consideration amounts, tampered boundaries, or modified recipient names.
4. **Rapid Succession Transfer Velocity (Chain Flipping):**
   - Fraudulent syndicates execute rapid back-to-back sales through dummy intermediaries before original owners or heirs discover the breach.

**JomiGuard AI** directly addresses Problem **P3** by providing an automated, deterministic triage engine that detects:
- Suspicious/forged or altered document copies using browser Web Crypto SHA-256 fingerprinting.
- The same synthetic parcel key associated with unresolved sales to multiple distinct buyer aliases.
- Suspiciously rapid succession transfers within configurable velocity windows.
- Field-level discrepancies between Sub-Registry deed registration and AC Land mutation records.

---

## 🌟 Key Features

| Module | Purpose & Implementation |
| :--- | :--- |
| **Overview Dashboard** | Real-time KPI bento grid (parcels indexed, deeds registered, open alerts, high-risk cases), recent alerts triage queue, active policy switches, and immutable local audit trail. |
| **Parcel & Record Explorer** | Search and filter synthetic parcels by mouza, dag, and survey era. Visualizes generational lineages (CS ➔ SA ➔ RS ➔ BS) and explains survey variances as reconciliation evidence. |
| **Document Cryptographic Fingerprinting** | Computes SHA-256 digital hashes using the native browser **Web Crypto API**. Compares live document text to authorized Sub-Registry reference copies; includes deterministic tamper simulation and rollback. |
| **Double-Selling Detector** | Identifies overlapping, uncancelled registered deeds linked to the same canonical synthetic parcel key across distinct buyer aliases. Provides clear evidence tables and explains legitimate false-positive possibilities. |
| **Rapid Transfer Velocity Analyzer** | Chronological ownership timeline with **interactive configurable demo thresholds** (default: 3 transfers in 90 days). Changing sliders immediately updates triggered alerts in real-time. |
| **Registration vs. Mutation Reconciliation** | Side-by-side field comparison (Buyer Alias, Declared Area, Deed Reference, Status) between Sub-Registry and AC Land records with mismatch indicators. |
| **Case & Review Management** | Advisory triage scoring (0–100), rule-by-rule weight breakdown (+40, +25, +20, +15, +10), status transitions, reviewer notes, and simulated role switching (`Sub-Registrar`, `AC Land Officer`, `Auditor`). |
| **Data Export & Scenario Quick-Loader** | 1-click loading for Scenarios A–F, pristine factory reset, and JSON/CSV export of synthetic records with mandatory disclaimers. |

---

## 🎨 Design System: "Industrial Enterprise Dark"

- **Palette:** Deep Black background (`#000000`), elevated surfaces in Zinc Grays (`#0f0f0f`, `#1a1a1a`, `#262626`).
- **Accent:** Bold Gold (`#fac306`) with glowing focal effects (`rgba(250, 195, 6, 0.2)`).
- **Status Accents:** Emerald (`#10b981`), Red (`#ef4444`), and Blue (`#3b82f6`).
- **Typography:** Modern clean sans-serif for UI hierarchy and `JetBrains Mono` for all technical parcel keys, hashes, deed IDs, and timestamps.
- **Glassmorphic Panels:** `rgba(15, 15, 15, 0.75)` with `14px` blur and micro-animations.

---

## ⚙️ Deterministic Risk Engine & Transparent Weights

JomiGuard AI avoids black-box opacity. All risk scoring is completely deterministic, explainable, and testable:

$$\text{Triage Score} = \min\left(100, \sum \text{Triggered Rule Weights}\right)$$

| Rule ID | Weight | Trigger Criteria |
| :--- | :---: | :--- |
| `DOUBLE_SELLING` | **+40** | Same canonical synthetic parcel key has multiple active registered deeds with distinct buyer aliases. |
| `DOCUMENT_INTEGRITY` | **+25** | Observed SHA-256 hash diverges from authorized Sub-Registry reference archive fingerprint. |
| `REG_MUTATION_MISMATCH` | **+20** | Conflicting buyer alias, area mismatch (>0.01 dec), or mutation caveat objection between registers. |
| `RAPID_TRANSFER` | **+15** | Parcel undergoes $\ge N$ transfers within $D$ calendar days (Configurable prototype default: 3 in 90 days). |
| `MISSING_FIELDS` | **+10** | Unlinked cadastral khatian or significant unexplained area drift across CS/BS survey generations. |

### Severity Bands
- **0 – 29: Low Severity** (Satisfactory baseline, routine monitoring)
- **30 – 59: Medium Severity** (Discrepancy flagged; schedule administrative verification)
- **60 – 100: High Severity** (Immediate joint Sub-Registrar / AC Land review required)

---

## 🧪 Seed Demonstration Scenarios (A through F)

| Scenario | Synthetic Parcel Key | Condition | Expected Score & Severity |
| :--- | :--- | :--- | :--- |
| **A: Clean Baseline** | `PARCEL-SYN-DH-001` | Single sale, reference hash matches, registration and mutation records agree. | **0 / 100 (LOW)** |
| **B: Double-Selling** | `PARCEL-SYN-DH-002` | Registered deeds `DEED-SYN-2026-089` and `DEED-SYN-2026-104` to distinct buyers by same seller. | **60 / 100 (HIGH)** |
| **C: Altered Document** | `PARCEL-SYN-DH-003` | Deed `DOC-SYN-002` area altered from 10.0 to 18.0 decimals; SHA-256 diverges. | **35 / 100 (MEDIUM)** |
| **D: Rapid Sequence** | `PARCEL-SYN-DH-004` | 3 successive transfers inside 42 days (`SELLER-SYN-004` ➔ `BUYER-005` ➔ `006` ➔ `007`). | **35 / 100 (MEDIUM)** |
| **E: Reg/Mut Mismatch** | `PARCEL-SYN-DH-005` | Sub-Registry records 20.0 dec vs AC Land records 14.5 dec; buyer aliases conflict. | **30 / 100 (MEDIUM)** |
| **F: Missing Record** | `PARCEL-SYN-DH-006` | Registered deed present, but mutation file absent from demo dataset. | **30 / 100 (MEDIUM)** |

---

## 🚀 Installation & Run Guide

The prototype is engineered for **instant execution** with zero mandatory external API keys or cloud dependencies.

### Option 1: Standalone Zero-Build Run (Recommended for Instant Evaluation)
Run Python's built-in HTTP server from the project directory:
```bash
# From workspace root:
python -m http.server 5173
```
Then open your browser at:
```
http://localhost:5173
```
*(You can also double-click `index.html` directly in modern browsers supporting local ES modules).*

### Option 2: Node.js / Vite Toolchain (Developer Mode)
If Node.js and npm are installed on your machine:
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Run production build
npm run build
```

### Running Automated Acceptance Tests
To execute the automated test suite verifying all 10 acceptance criteria:
```bash
node tests/acceptance_tests.js
```
*(Or run with any standard node executable: `& "C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe" tests/acceptance_tests.js`).*

---

## 🤖 AI Tools Disclosure

*In compliance with the LandTech 2026 Rule Book Section on AI Assistance, the team declares the following tool usage. Team members must review and maintain truthful disclosures.*

- **Google Gemini / Antigravity IDE:** Utilized for scaffolding initial TypeScript models, synthesizing realistic demonstration dataset schemas (`seedData.ts`), crafting Industrial Enterprise Dark CSS styling, and generating the automated acceptance test script.
- **ChatGPT (OpenAI):** Utilized during initial project ideation for PRD refinement, problem analysis against Bangladesh land laws (Registration Act 1908 & State Acquisition and Tenancy Act 1950), and structuring the rule-weight formulas.
- **Student Authorship Confirmation:** Both student team members have reviewed, understood, and tested all project code and detection rules, and are fully prepared to explain all architecture, code logic, and design decisions during the live evaluation.

---

## 👥 Team Composition & Hackathon Alignment

Per the LandTech 2026 rule book specifications, the permitted 4-person team structure comprises:
- **Team Leader (Student / Alumni 1):** Lead Full-Stack Development & Architecture
- **Member (Student / Alumni 2):** UI/UX Design, Risk Engine Logic & Data Synthesis
- **Faculty Mentor:** Academic Guidance, Research Rigor & Methodology Review
- **Industry Mentor:** Domain Expertise in Bangladesh Land Governance & GovTech Systems

*(Final team roster, DIU student IDs, and mentor contact records must be confirmed directly with hackathon organizers).*

---

## 📦 Open-Source Dependencies & Licenses

All libraries used are open-source with permissive licenses:
- **React (v18.2.0):** MIT License (Facebook / Meta)
- **React-DOM (v18.2.0):** MIT License (Facebook / Meta)
- **Lucide Icons (v0.344.0):** ISC License (Lucide Project)
- **Vite (v5.1.6):** MIT License (Evan You & Vite Contributors)
- **TypeScript (v5.2.2):** Apache License 2.0 (Microsoft)
- **Google Fonts (Inter & JetBrains Mono):** SIL Open Font License 1.1

---

## 📋 Hackathon Round 1 & Final Round Checklist

- [x] **Problem Focus:** Specifically targeted to **P3 — Fraud & Double-Selling Detection**.
- [x] **Synthetic Data Compliance:** 100% self-generated dummy aliases; zero real citizen data.
- [x] **Offline Sandbox:** Zero unauthorized requests to live government portals.
- [x] **Browser Web Crypto SHA-256:** Cryptographic integrity check implemented with fallback.
- [x] **Configurable Rapid Transfer Threshold:** User can modify count and days to observe live trigger reactivity.
- [x] **Multi-Registry Reconciliation:** Field-by-field Sub-Registry vs AC Land comparison.
- [x] **Local Persistence & Audit Trail:** LocalStorage persistence, status updater, note appender, and audit log.
- [x] **All 10 Acceptance Criteria Passed:** Verified via automated test suite.

### Changes Since Round 1 (Placeholder for Final Round)
*To be completed by the student team prior to the Final Round submission:*
1. *Initial concept submission: 16 October 2026.*
2. *Expanded survey generational cross-referencing (CS/SA/RS/BS).*
3. *Refined deterministic scoring weights based on mentor feedback.*
4. *Prepared 10-slide pitch deck and 3-minute demonstration video.*

---

## ⚖️ Legal & Governance Limitations
1. **Advisory Triage Only:** JomiGuard AI is a prioritization dashboard designed to assist authorized public servants. It does not replace the statutory authority of a Sub-Registrar under the *Registration Act, 1908* or an Assistant Commissioner (Land) under the *State Acquisition and Tenancy Act, 1950*.
2. **Cryptographic Hashes vs Legal Validity:** SHA-256 verifies digital bitstream consistency against an initial intake copy; it does not adjudicate legal execution or physical possession.
3. **No Nationwide Production Claim:** This application is submitted as an academic and hackathon technology prototype. Any production deployment requires formal integration with the Ministry of Land's e-Mutation system and the Directorate of Registration's deed database under authorized government security mandates.
