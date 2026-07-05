// Merge an APPROVED validated dataset into public/data/. Idempotent upsert by id.
// Usage: node pipeline/merge.mjs <speaker-slug>
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node pipeline/merge.mjs <speaker-slug>');
  process.exit(2);
}

const validatedPath = join(ROOT, 'pipeline', 'work', slug, '04-validated.json');
if (!existsSync(validatedPath)) {
  console.error(`missing ${validatedPath} — run validate.mjs first (and make sure it passed)`);
  process.exit(2);
}
const { cards, speaker } = JSON.parse(readFileSync(validatedPath, 'utf8'));

const cardsPath = join(ROOT, 'public', 'data', 'cards.json');
const speakersPath = join(ROOT, 'public', 'data', 'speakers.json');
const allCards = existsSync(cardsPath) ? JSON.parse(readFileSync(cardsPath, 'utf8')) : [];
const allSpeakers = existsSync(speakersPath) ? JSON.parse(readFileSync(speakersPath, 'utf8')) : [];

// upsert cards by id
let added = 0;
let replaced = 0;
for (const card of cards) {
  const idx = allCards.findIndex((c) => c.id === card.id);
  if (idx >= 0) {
    allCards[idx] = card;
    replaced++;
  } else {
    allCards.push(card);
    added++;
  }
}

// upsert speaker by id (keep an existing portrait path if one was set manually)
const spIdx = allSpeakers.findIndex((s) => s.id === speaker.id);
if (spIdx >= 0) {
  speaker.portrait = allSpeakers[spIdx].portrait ?? speaker.portrait;
  allSpeakers[spIdx] = speaker;
} else {
  allSpeakers.push(speaker);
}

writeFileSync(cardsPath, JSON.stringify(allCards, null, 2));
writeFileSync(speakersPath, JSON.stringify(allSpeakers, null, 2));

console.log(`✅ merged ${speaker.name}: +${added} new, ${replaced} replaced (total ${allCards.length} cards, ${allSpeakers.length} speakers)`);

// art check
const artCandidates = ['png', 'jpeg', 'jpg', 'webp'].map((ext) => join(ROOT, 'public', 'cards', `${slug}.${ext}`));
if (!artCandidates.some(existsSync)) {
  console.warn(`⚠️  no card art found at public/cards/${slug}.(png|jpeg|jpg|webp) — the placeholder will show.`);
  console.warn('   카드 아트 프롬프트 템플릿: pipeline/ART_PROMPT.md 참고');
}
