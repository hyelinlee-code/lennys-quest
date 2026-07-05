// Deterministic validation + chip derivation. No LLM. See pipeline/SCHEMA.md.
// Usage: node pipeline/validate.mjs <speaker-slug>
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node pipeline/validate.mjs <speaker-slug>');
  process.exit(2);
}

const workDir = join(ROOT, 'pipeline', 'work', slug);
const translatedPath = join(workDir, '03-translated.json');
const speakerPath = join(workDir, '03b-speaker.json');
const reportPath = join(workDir, 'validation-report.json');
const outPath = join(workDir, '04-validated.json');

const errors = [];
const err = (index, expression, check, detail) => errors.push({ index, expression, check, detail });

// ---------- helpers ----------
const RARITIES = ['common', 'rare'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

/** Normalize text for verbatim-ish comparison: curly quotes → straight, collapse whitespace. */
function norm(s) {
  return s
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}
const normLower = (s) => norm(s).toLowerCase();

function stripEdgePunct(tok) {
  return tok.replace(/^[^\p{L}\p{N}''-]+|[^\p{L}\p{N}''-]+$/gu, '');
}

/** Deterministic chip derivation from the canonical expression. */
function deriveChips(expression) {
  return expression.split(/\s+/).map(stripEdgePunct).filter(Boolean);
}

function wordCount(s) {
  return norm(s).split(/\s+/).filter(Boolean).length;
}

function hasHangul(s) {
  return /[가-힣]/.test(s ?? '');
}

/** Parse "Name (HH:MM:SS):" or "Name (MM:SS):" turns. */
function parseTurns(transcript) {
  const re = /^(.+?) \((\d{1,2}:\d{2}(?::\d{2})?)\):\s*$/gm;
  const marks = [];
  let m;
  while ((m = re.exec(transcript)) !== null) {
    marks.push({ name: m[1].trim(), ts: m[2], headerStart: m.index, start: m.index + m[0].length });
  }
  return marks.map((mark, i) => ({
    ...mark,
    text: transcript.slice(mark.start, i + 1 < marks.length ? marks[i + 1].headerStart : undefined),
  }));
}

// ---------- load ----------
if (!existsSync(translatedPath)) {
  console.error(`missing ${translatedPath}`);
  process.exit(2);
}
const data = JSON.parse(readFileSync(translatedPath, 'utf8'));
const speakerExtra = existsSync(speakerPath) ? JSON.parse(readFileSync(speakerPath, 'utf8')) : {};

const transcriptFile = data.source?.transcriptFile;
const transcriptPath = join(ROOT, 'pipeline', 'transcripts', transcriptFile ?? '');
if (!transcriptFile || !existsSync(transcriptPath)) {
  console.error(`missing transcript: ${transcriptPath}`);
  process.exit(2);
}
const transcript = readFileSync(transcriptPath, 'utf8');
const turns = parseTurns(transcript);
const turnsNorm = turns.map((t) => ({ ...t, textNorm: normLower(t.text) }));

const existingCardsPath = join(ROOT, 'public', 'data', 'cards.json');
const existingCards = existsSync(existingCardsPath)
  ? JSON.parse(readFileSync(existingCardsPath, 'utf8'))
  : [];

// ---------- per-card checks ----------
const cards = data.cards ?? [];
const seenExpr = new Set();
const outCards = [];

cards.forEach((c, i) => {
  const label = c.expression ?? `#${i}`;
  const sentNorm = normLower(c.key_sentence ?? '');

  // V1 + V9: verbatim substring of a GUEST turn
  const owners = turnsNorm.filter((t) => sentNorm && t.textNorm.includes(sentNorm));
  if (owners.length === 0) {
    err(i, label, 'V1', 'key_sentence is not a verbatim substring of the transcript');
  } else if (!owners.some((t) => !/^lenny\b/i.test(t.name))) {
    err(i, label, 'V9', `key_sentence belongs to a Lenny turn`);
  }

  // V2
  const wc = wordCount(c.key_sentence ?? '');
  if (wc < 15 || wc > 35) err(i, label, 'V2', `key_sentence word count ${wc} (need 15-35)`);

  // V3
  const surface = c.surface ?? c.expression ?? '';
  if (!sentNorm.includes(normLower(surface))) {
    err(i, label, 'V3', `surface "${surface}" not found in key_sentence`);
  }

  // V4 — derive chips
  const chips = deriveChips(c.expression ?? '');
  if (chips.length < 2 || chips.length > 8) {
    err(i, label, 'V4', `derived ${chips.length} chips (need 2-8)`);
  }
  const exprFlat = deriveChips(c.expression ?? '').join(' ').toLowerCase();
  if (chips.join(' ').toLowerCase() !== exprFlat) {
    err(i, label, 'V4', 'chip round-trip mismatch');
  }

  // V5
  const d = c.distractor_chips ?? [];
  if (d.length !== 2) err(i, label, 'V5', `need exactly 2 distractor_chips, got ${d.length}`);
  const chipSet = new Set(chips.map((t) => t.toLowerCase()));
  for (const tok of d) {
    if (/\s/.test(tok)) err(i, label, 'V5', `distractor "${tok}" is not a single word`);
    if (chipSet.has(String(tok).toLowerCase())) err(i, label, 'V5', `distractor "${tok}" duplicates a chip`);
  }

  // V6
  if (!RARITIES.includes(c.rarity)) err(i, label, 'V6', `bad rarity "${c.rarity}"`);
  if (!DIFFICULTIES.includes(c.difficulty)) err(i, label, 'V6', `bad difficulty "${c.difficulty}"`);

  // V7 — accept MM:SS or HH:MM:SS (transcripts use both)
  if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(c.timestamp ?? '')) {
    err(i, label, 'V7', `bad timestamp format "${c.timestamp}"`);
  } else if (!transcript.includes(`(${c.timestamp})`)) {
    err(i, label, 'V7', `timestamp ${c.timestamp} not found in transcript`);
  }

  // V8 — English-first app: meaning_ko is the ONLY Korean field (must have Hangul);
  //      context_en / usage_tip_en ship to the app and must be non-empty English.
  if (!hasHangul(c.meaning_ko)) err(i, label, 'V8', 'meaning_ko missing or has no Hangul');
  if (!c.context_en || hasHangul(c.context_en)) {
    err(i, label, 'V8', 'context_en missing or contains Hangul (must be English)');
  }
  if (!c.usage_tip_en || hasHangul(c.usage_tip_en)) {
    err(i, label, 'V8', 'usage_tip_en missing or contains Hangul (must be English)');
  }

  // duplicate expressions
  const exprKey = normLower(c.expression ?? '');
  if (seenExpr.has(exprKey)) err(i, label, 'DUP', 'duplicate expression in file');
  seenExpr.add(exprKey);

  // vocabulary words must appear in the sentence
  for (const v of c.vocabulary ?? []) {
    if (v.word && !sentNorm.includes(String(v.word).toLowerCase())) {
      err(i, label, 'VOCAB', `vocabulary word "${v.word}" not in key_sentence`);
    }
  }

  const id = `${slug}-${String(i + 1).padStart(3, '0')}`;
  // V10 — id collision with a DIFFERENT speaker (same-speaker upsert is fine)
  const clash = existingCards.find((e) => e.id === id && e.speakerId !== slug);
  if (clash) err(i, label, 'V10', `id ${id} already used by speaker ${clash.speakerId}`);

  outCards.push({
    id,
    speakerId: slug,
    sentence: c.key_sentence,
    keyPhrase: {
      text: c.expression,
      ...(c.surface && normLower(c.surface) !== normLower(c.expression) ? { surface: c.surface } : {}),
      meaning_ko: c.meaning_ko,
      ...(c.usage_tip_en ? { usageTip: c.usage_tip_en } : {}),
      chips,
      distractorChips: d,
    },
    context: c.context_en,
    vocabulary: (c.vocabulary ?? []).map((v) => ({
      word: v.word,
      meaning: v.meaning_en ?? '',
      ...(v.note_en ? { note: v.note_en } : {}),
      ...(v.synonyms?.length ? { synonyms: v.synonyms } : {}),
    })),
    topics: c.topics ?? [],
    difficulty: c.difficulty,
    rarity: c.rarity,
    timestamp: c.timestamp,
  });
});

// ---------- file-level checks ----------
if (cards.length < 6 || cards.length > 12) {
  err(-1, '(file)', 'FILE', `card count ${cards.length} (need 6-12)`);
}
const rareRatio = cards.length ? cards.filter((c) => c.rarity === 'rare').length / cards.length : 0;
if (rareRatio < 0.2 || rareRatio > 0.6) {
  err(-1, '(file)', 'FILE', `rare ratio ${rareRatio.toFixed(2)} (need 0.2-0.6)`);
}

const sp = data.source?.speaker ?? {};
for (const field of ['name', 'house']) {
  if (!sp[field]) err(-1, '(speaker)', 'SPK', `source.speaker.${field} missing`);
}
if (!['founder', 'investor', 'operator'].includes(sp.house)) {
  err(-1, '(speaker)', 'SPK', `bad house "${sp.house}"`);
}
// speaker profile is English-first: required non-empty, no Hangul
for (const field of ['epithet', 'introLine', 'sealLine']) {
  const val = speakerExtra[field];
  if (!val || hasHangul(val)) err(-1, '(speaker)', 'SPK', `03b-speaker.json ${field} missing or contains Hangul (must be English)`);
}

// ---------- write ----------
const pass = errors.length === 0;
writeFileSync(reportPath, JSON.stringify({ pass, slug, cardCount: cards.length, errors }, null, 2));

if (pass) {
  const speaker = {
    id: slug,
    name: sp.name,
    title: sp.role ?? '',
    ...(speakerExtra.titleHistory ? { titleHistory: speakerExtra.titleHistory } : {}),
    house: sp.house,
    epithet: speakerExtra.epithet ?? 'Sage',
    motif: speakerExtra.motif ?? '',
    introLine: speakerExtra.introLine ?? '',
    sealLine: speakerExtra.sealLine ?? '',
    portrait: `/cards/${slug}.png`,
    episode: sp.episode ?? '',
    cardCount: outCards.length,
  };
  writeFileSync(outPath, JSON.stringify({ cards: outCards, speaker }, null, 2));
  console.log(`✅ PASS — ${outCards.length} cards → ${outPath}`);
  process.exit(0);
} else {
  console.error(`❌ FAIL — ${errors.length} error(s). See ${reportPath}`);
  for (const e of errors) console.error(`  [${e.check}] ${e.expression}: ${e.detail}`);
  process.exit(1);
}
