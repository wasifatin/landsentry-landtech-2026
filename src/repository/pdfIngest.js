/**
 * LandSentry — PDF Auto-Intake Engine
 * ────────────────────────────────────────────────────────────────────────────
 * Reads a land-file PDF, detects every field in it and returns a structured
 * object that LandRepository.importParsedLandFile() can load into the system.
 *
 * Step 1  extractPdfLines()   PDF bytes  → text lines (grouped by position)
 *            a) built-in reader  (no dependency, works offline; handles the
 *               ASCII85 / Flate text streams that most generators produce)
 *            b) pdf.js from cdnjs (used automatically when (a) can't find the
 *               expected sections, e.g. PDFs with embedded/custom fonts)
 * Step 2  parseLandFileLines() text lines → { parcelKey, deed, porcha,
 *                                             mutation, nec, chain, ... }
 *
 * Deterministic and fully local — no AI/OCR, no data leaves the browser.
 * Scanned (image-only) PDFs contain no text layer and cannot be read.
 */

const PDFJS_VERSION = '3.11.174';
const PDFJS_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

// ───────────────────────── Step 1a: built-in reader ─────────────────────────

function bytesToLatin1(bytes) {
  let s = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return s;
}

function latin1ToBytes(str) {
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0xff;
  return out;
}

function ascii85Decode(input) {
  let s = input.replace(/\s+/g, '');
  if (s.startsWith('<~')) s = s.slice(2);
  const end = s.indexOf('~>');
  if (end >= 0) s = s.slice(0, end);
  const out = [];
  let group = [];
  for (const ch of s) {
    if (ch === 'z' && group.length === 0) { out.push(0, 0, 0, 0); continue; }
    group.push(ch.charCodeAt(0) - 33);
    if (group.length === 5) {
      let v = 0;
      for (const g of group) v = v * 85 + g;
      out.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255);
      group = [];
    }
  }
  if (group.length > 1) {
    const n = group.length;
    while (group.length < 5) group.push(84);
    let v = 0;
    for (const g of group) v = v * 85 + g;
    const bytes = [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
    out.push(...bytes.slice(0, n - 1));
  }
  return Uint8Array.from(out);
}

async function inflate(bytes) {
  if (typeof DecompressionStream === 'undefined') throw new Error('DecompressionStream unavailable');
  const ds = new DecompressionStream('deflate');
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function tokenize(src) {
  const toks = [];
  let i = 0;
  const n = src.length;
  const ws = /[\s\0]/;
  const delim = /[\s\0\/\[\]()<>%]/;
  while (i < n) {
    const c = src[i];
    if (ws.test(c)) { i++; continue; }
    if (c === '%') { while (i < n && src[i] !== '\n' && src[i] !== '\r') i++; continue; }
    if (c === '(') {
      let depth = 1, s = '';
      i++;
      while (i < n && depth > 0) {
        const ch = src[i];
        if (ch === '\\') {
          const nx = src[i + 1];
          if (nx >= '0' && nx <= '7') {
            let o = nx; i += 2;
            while (o.length < 3 && src[i] >= '0' && src[i] <= '7') { o += src[i]; i++; }
            s += String.fromCharCode(parseInt(o, 8));
            continue;
          }
          if (nx === '\n') { i += 2; continue; }
          const map = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' };
          s += map[nx] !== undefined ? map[nx] : nx;
          i += 2;
          continue;
        }
        if (ch === '(') depth++;
        else if (ch === ')') { depth--; if (depth === 0) { i++; break; } }
        s += ch;
        i++;
      }
      toks.push({ t: 'str', v: s });
      continue;
    }
    if (c === '[') { toks.push({ t: '[' }); i++; continue; }
    if (c === ']') { toks.push({ t: ']' }); i++; continue; }
    if (c === '<') {
      if (src[i + 1] === '<') { i += 2; continue; }
      const j = src.indexOf('>', i);
      if (j < 0) break;
      const hex = src.slice(i + 1, j).replace(/\s/g, '');
      let s = '';
      for (let k = 0; k < hex.length; k += 2) s += String.fromCharCode(parseInt(hex.substr(k, 2).padEnd(2, '0'), 16));
      toks.push({ t: 'str', v: s });
      i = j + 1;
      continue;
    }
    if (c === '>') { i++; continue; }
    if (c === '/') {
      let j = i + 1;
      while (j < n && !delim.test(src[j])) j++;
      toks.push({ t: 'name', v: src.slice(i + 1, j) });
      i = j;
      continue;
    }
    let j = i;
    while (j < n && !delim.test(src[j])) j++;
    if (j === i) { i++; continue; }
    const w = src.slice(i, j);
    toks.push(isNaN(w) ? { t: 'op', v: w } : { t: 'num', v: parseFloat(w) });
    i = j;
  }
  return toks;
}

const mul = (a, b) => [
  a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3],
  a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3],
  a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5],
];

/** Interpret one page content stream → positioned text items. */
function runContentStream(src) {
  const toks = tokenize(src);
  const out = [];
  let ctm = [1, 0, 0, 1, 0, 0];
  const ctmStack = [];
  let tm = [1, 0, 0, 1, 0, 0];
  let tlm = [1, 0, 0, 1, 0, 0];
  let leading = 0;
  let operands = [];
  let arr = null;

  const emit = (text) => {
    if (!text) return;
    const p = mul(tm, ctm);
    const x = p[4], y = p[5];
    const last = out[out.length - 1];
    if (last && Math.abs(last.x - x) < 0.01 && Math.abs(last.y - y) < 0.01) last.str += text;
    else out.push({ str: text, x, y });
  };
  const nextLine = (tx, ty) => { tlm = mul([1, 0, 0, 1, tx, ty], tlm); tm = tlm.slice(); };

  for (const tk of toks) {
    if (tk.t === '[') { arr = []; continue; }
    if (tk.t === ']') { operands.push({ t: 'arr', v: arr || [] }); arr = null; continue; }
    if (arr) { arr.push(tk); continue; }
    if (tk.t !== 'op') { operands.push(tk); continue; }

    const nums = operands.filter(o => o.t === 'num').map(o => o.v);
    switch (tk.v) {
      case 'q': ctmStack.push(ctm.slice()); break;
      case 'Q': if (ctmStack.length) ctm = ctmStack.pop(); break;
      case 'cm': if (nums.length >= 6) ctm = mul(nums.slice(-6), ctm); break;
      case 'BT': tm = [1, 0, 0, 1, 0, 0]; tlm = tm.slice(); break;
      case 'Tm': if (nums.length >= 6) { tm = nums.slice(-6); tlm = tm.slice(); } break;
      case 'Td': if (nums.length >= 2) nextLine(nums[nums.length - 2], nums[nums.length - 1]); break;
      case 'TD': if (nums.length >= 2) { leading = -nums[nums.length - 1]; nextLine(nums[nums.length - 2], nums[nums.length - 1]); } break;
      case 'TL': if (nums.length >= 1) leading = nums[nums.length - 1]; break;
      case 'T*': nextLine(0, -leading); break;
      case 'Tj': {
        const s = operands.find(o => o.t === 'str');
        if (s) emit(s.v);
        break;
      }
      case "'": {
        nextLine(0, -leading);
        const s = operands.find(o => o.t === 'str');
        if (s) emit(s.v);
        break;
      }
      case 'TJ': {
        const a = operands.find(o => o.t === 'arr');
        if (a) {
          let text = '';
          for (const e of a.v) {
            if (e.t === 'str') text += e.v;
            else if (e.t === 'num' && e.v < -200) text += ' ';
          }
          emit(text);
        }
        break;
      }
      default: break;
    }
    operands = [];
  }
  return out;
}

function itemsToLines(items) {
  const rows = [];
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    let row = rows.find(r => Math.abs(r.y - it.y) < 3);
    if (!row) { row = { y: it.y, cells: [] }; rows.push(row); }
    row.cells.push(it);
  }
  rows.sort((a, b) => b.y - a.y);
  return rows.map(r => {
    r.cells.sort((a, b) => a.x - b.x);
    const cells = r.cells.map(c => c.str.replace(/\s+/g, ' ').trim()).filter(Boolean);
    return { cells, text: cells.join(' ').replace(/\s+/g, ' ').trim() };
  }).filter(l => l.text);
}

async function extractWithBuiltinReader(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const src = bytesToLatin1(bytes);
  const lines = [];
  const re = /stream\r?\n/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const dataStart = m.index + m[0].length;
    const endIdx = src.indexOf('endstream', dataStart);
    if (endIdx < 0) break;
    const objStart = src.lastIndexOf('obj', m.index);
    const dict = src.slice(Math.max(0, objStart), m.index);
    const lenMatch = dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/);
    let raw = src.slice(dataStart, lenMatch ? Math.min(endIdx, dataStart + parseInt(lenMatch[1], 10)) : endIdx);
    re.lastIndex = endIdx + 9;

    const filters = (dict.match(/\/Filter\s*(\[[^\]]*\]|\/\w+)/) || [, ''])[1].match(/\/(\w+)/g) || [];
    let data = latin1ToBytes(raw);
    try {
      for (const f of filters.map(x => x.slice(1))) {
        if (f === 'ASCII85Decode' || f === 'A85') data = ascii85Decode(bytesToLatin1(data));
        else if (f === 'FlateDecode' || f === 'Fl') data = await inflate(data);
        else throw new Error('unsupported filter ' + f);
      }
    } catch (e) { continue; }

    const content = bytesToLatin1(data);
    if (!/\bBT\b/.test(content) || !/\bET\b/.test(content)) continue;
    lines.push(...itemsToLines(runContentStream(content)));
  }
  return lines;
}

// ───────────────────────── Step 1b: pdf.js fallback ─────────────────────────

function loadPdfJs() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PDFJS_SRC;
    s.onload = () => {
      if (!window.pdfjsLib) return reject(new Error('pdf.js failed to initialise'));
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      resolve(window.pdfjsLib);
    };
    s.onerror = () => reject(new Error('Could not load pdf.js (offline?)'));
    document.head.appendChild(s);
    setTimeout(() => reject(new Error('pdf.js load timed out')), 8000);
  });
}

async function extractWithPdfJs(arrayBuffer) {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) }).promise;
  const lines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const items = tc.items.map(i => ({ str: i.str, x: i.transform[4], y: i.transform[5] }));
    lines.push(...itemsToLines(items));
  }
  return lines;
}

// ───────────────────────── Step 2: field parser ─────────────────────────

const SECTION_HEADINGS = [
  ['deed', /Sub-Registry Registered Deed|Registered Deed \(Saf-Kabala/i],
  ['porcha', /Record-of-Rights|Porcha/i],
  ['mutation', /Mutation Order Sheet|AC Land Mutation/i],
  ['nec', /Non-Encumbrance|Form 52 Search/i],
  ['chain', /Chain of Title|Baya Dalil/i],
  ['testsheet', /Test Sheet|Expected Triage Outcome|For the tester only/i],
];

const num = (s) => {
  const m = String(s || '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};
const isoDate = (s) => {
  const m = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};
const after = (line, re) => line.replace(re, '').trim();

export function parseLandFileLines(lines) {
  const res = {
    parcelKey: null, registryOffice: null, landOffice: null, khatian: null,
    deed: {}, porcha: { rows: [], note: '' }, mutation: null,
    nec: { otherDeeds: [], note: '', found: false }, chain: [], testSheet: null,
    sectionsFound: [], missing: [], warnings: [], ok: false,
  };
  let section = null;

  for (const ln of lines) {
    const line = ln.text;

    // Section switch (headings only — short lines that match)
    const head = SECTION_HEADINGS.find(([, re]) => re.test(line) && line.length < 90 && !/Parcel Key/i.test(line));
    if (head) {
      section = head[0];
      if (!res.sectionsFound.includes(section)) res.sectionsFound.push(section);
      continue;
    }
    if (section === 'deed' && /^Partition\)/i.test(line)) continue; // wrapped title

    // Parcel key line (appears under every heading)
    const pk = line.match(/Parcel Key:\s*([A-Za-z0-9._-]+)/i);
    if (pk) {
      if (!res.parcelKey) res.parcelKey = pk[1];
      const off = line.match(/\|\s*(.+)$/);
      if (off) {
        const val = off[1].trim();
        const kh = val.match(/^Khatian\s+(\S+)/i);
        if (kh) res.khatian = kh[1];
        else if (/Sub-Registry Office:/i.test(val)) res.registryOffice = after(val, /^Sub-Registry Office:\s*/i);
        else if (section === 'mutation') res.landOffice = val;
      }
      continue;
    }

    if (section === 'deed') {
      let m;
      if ((m = line.match(/^Deed Type\s+(.+)/i))) res.deed.type = m[1];
      else if ((m = line.match(/^Deed No\.?\s+(\S+)/i))) res.deed.no = m[1];
      else if ((m = line.match(/^Registration Date\s+(.+)/i))) res.deed.date = isoDate(m[1]);
      else if ((m = line.match(/^Seller\b.*?\)\s*(\S.*)$/i)) || (m = line.match(/^Seller\s+(\S.*)$/i))) res.deed.seller = m[1].trim();
      else if ((m = line.match(/^Buyer\b.*?\)\s*(\S.*)$/i)) || (m = line.match(/^Buyer\s+(\S.*)$/i))) res.deed.buyer = m[1].trim();
      else if ((m = line.match(/^District\s*\/\s*Mouza\s+(.+)/i))) {
        const parts = m[1].split('/').map(x => x.trim());
        res.deed.district = parts[0] || null;
        res.deed.mouza = parts.slice(1).join(' / ') || null;
      } else if ((m = line.match(/^Plot.*?Khatian\s+(.+)/i))) {
        const parts = m[1].split('/').map(x => x.trim());
        res.deed.plot = parts[0] || null;
        if (parts[1]) res.khatian = res.khatian || parts[1];
      } else if ((m = line.match(/^Land Area.*?Scanned Copy\s+(.+)/i))) res.deed.area = num(m[1]);
      else if ((m = line.match(/^Deed Status\s+(\S+)/i))) res.deed.status = m[1].toUpperCase();
      else if ((m = line.match(/^Registry Volume Reference Area\s+(.+)/i))) res.deed.volumeArea = num(m[1]);
      else if ((m = line.match(/Scanned copy SHA-256:\s*([0-9a-f]{64})/i))) res.deed.scannedSha = m[1].toLowerCase();
      else if ((m = line.match(/Registry archive reference SHA-256:\s*([0-9a-f]{64})/i))) res.deed.registrySha = m[1].toLowerCase();
    } else if (section === 'porcha') {
      const m = line.match(/^(CS|SA|RS|BS)\b[^()]*\(c\.\s*(\d{4})\)\s+(\d+(?:\.\d+)?)\s*(.*)$/i);
      if (m) res.porcha.rows.push({ type: m[1].toUpperCase(), year: m[2], area: parseFloat(m[3]), remarks: m[4].trim() });
      else if (/^Survey generations|CS-to-BS|explained by|reconciliation|consistent/i.test(line)) res.porcha.note += (res.porcha.note ? ' ' : '') + line;
    } else if (section === 'mutation') {
      res.mutation = res.mutation || {};
      let m;
      if ((m = line.match(/^Mutation Case No\.?\s+(\S+)/i))) res.mutation.caseNo = m[1];
      else if ((m = line.match(/^Deed Reference\s+(\S+)/i))) res.mutation.deedRef = m[1];
      else if ((m = line.match(/^Buyer on Mutation Record\s+(\S+)/i))) res.mutation.buyer = m[1];
      else if ((m = line.match(/^Area Mutated\s+(.+)/i))) res.mutation.area = num(m[1]);
      else if ((m = line.match(/^Mutation Status\s+(\S+)/i))) res.mutation.status = m[1].toUpperCase();
      else if ((m = line.match(/^DCR\b.*?\)\s*(DCR-\S+)/i))) res.mutation.dcr = m[1];
    } else if (section === 'nec') {
      const m = line.match(/^(DEED-\S+)\s+(\S+)\s+(\d{4}-\d{2}-\d{2})\s+(\S+)$/i);
      if (m) {
        res.nec.found = true;
        res.nec.otherDeeds.push({ deedNo: m[1], buyer: m[2], date: m[3], status: m[4].toUpperCase() });
      } else if (/^Search result/i.test(line)) res.nec.note = line;
    } else if (section === 'chain') {
      const m = line.match(/^(\d{4}-\d{2}-\d{2})\s+(\S+)\s+(\S+)\s+(DEED-\S+)$/i);
      if (m) res.chain.push({ date: m[1], seller: m[2], buyer: m[3], deedNo: m[4] });
    } else if (section === 'testsheet') {
      res.testSheet = res.testSheet || {};
      let m;
      if ((m = line.match(/^File Category\s+(.+)/i))) res.testSheet.category = m[1];
      else if ((m = line.match(/^Expected Score\s+(\d+)/i))) res.testSheet.score = parseInt(m[1], 10);
      else if ((m = line.match(/^Expected Severity\s+(\w+)/i))) res.testSheet.severity = m[1].toUpperCase();
    }
  }

  // ── validation ──
  const need = [
    ['Parcel Key', res.parcelKey], ['Deed No.', res.deed.no], ['Seller', res.deed.seller],
    ['Buyer', res.deed.buyer], ['Plot (Dag) No.', res.deed.plot], ['Land area', res.deed.area],
  ];
  need.forEach(([label, v]) => { if (v === null || v === undefined || v === '') res.missing.push(label); });
  res.ok = res.missing.length === 0;

  if (res.ok) {
    if (!res.deed.date) { res.warnings.push('Registration date not found — today\'s date used.'); res.deed.date = new Date().toISOString().slice(0, 10); }
    if (!res.deed.mouza) { res.deed.mouza = 'Unknown Mouza'; res.warnings.push('Mouza not found.'); }
    if (!res.deed.district) res.deed.district = 'Dhaka';
    if (!res.deed.status) res.deed.status = 'REGISTERED';
    if (!res.khatian) res.khatian = `K-${res.deed.plot}`;
    if (!res.mutation || !res.mutation.status) { res.warnings.push('No AC Land mutation record found in this file — treated as RECORD_MISSING.'); }
    if (!res.porcha.rows.length) res.warnings.push('No survey (CS/SA/RS/BS) rows found.');
    if (!res.deed.scannedSha || !res.deed.registrySha) res.warnings.push('Scanned/registry SHA-256 values not found — integrity comparison skipped.');
  }
  return res;
}

// ───────────────────────── Public API ─────────────────────────

/**
 * Read + parse a PDF File.
 * Returns the parsed structure plus { extractor, lineCount } or { ok:false, error }.
 */
export async function parseLandFilePdf(file) {
  let buffer;
  try { buffer = await file.arrayBuffer(); }
  catch (e) { return { ok: false, error: 'Could not read the file.', missing: [], warnings: [] }; }

  let parsed = null;
  let extractor = 'built-in reader';
  let lineCount = 0;
  let lastError = null;

  try {
    const lines = await extractWithBuiltinReader(buffer);
    lineCount = lines.length;
    if (lines.length) parsed = parseLandFileLines(lines);
  } catch (e) { lastError = e; }

  if (!parsed || !parsed.ok) {
    try {
      const lines = await extractWithPdfJs(buffer);
      if (lines.length) {
        const p2 = parseLandFileLines(lines);
        if (!parsed || p2.ok || p2.sectionsFound.length > parsed.sectionsFound.length) {
          parsed = p2; extractor = 'pdf.js'; lineCount = lines.length;
        }
      }
    } catch (e) { lastError = e; }
  }

  if (!parsed) {
    return {
      ok: false, missing: [], warnings: [], lineCount,
      error: lineCount === 0
        ? 'No readable text found in this PDF (it may be a scanned image). Use the manual form instead.'
        : `Could not read this PDF${lastError ? ': ' + lastError.message : '.'}`,
    };
  }
  if (!parsed.ok) {
    parsed.error = `This PDF doesn't look like a LandSentry land file — could not detect: ${parsed.missing.join(', ')}.`;
  }
  parsed.extractor = extractor;
  parsed.lineCount = lineCount;
  return parsed;
}
