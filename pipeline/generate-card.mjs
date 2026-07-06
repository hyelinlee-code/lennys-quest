// Generate wizard-card art via OpenAI gpt-image-1 (images.edit with references).
// Usage:
//   node pipeline/generate-card.mjs <slug> [<slug> ...]   # specific speakers
//   node pipeline/generate-card.mjs --all                 # every speaker with an art-ref
//   add --force to overwrite an existing public/cards/<slug>.png
//
// Inputs per speaker:
//   pipeline/art-refs/<slug>.(png|jpg|jpeg|webp)  — official caricature (likeness reference)
//   public/cards/bret-taylor.jpg                  — anchor card (style/frame reference)
//   pipeline/work/<slug>/01-extracted.json        — house
//   pipeline/work/<slug>/03b-speaker.json         — motif
// Output: public/cards/<slug>.png (1024x1536, ~$0.19-0.25/image at high quality)
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REFS = join(ROOT, 'pipeline', 'art-refs');
const ANCHOR = join(ROOT, 'public', 'cards', 'bret-taylor.jpg');

const HOUSE_COLORS = {
  founder: 'deep slate navy (#1B2433) with warm gold (#E0A85E)',
  investor: 'deep emerald green (#1B3325) with warm gold (#E0A85E)',
  operator: 'royal plum purple (#2A1B33) with warm gold (#E0A85E)',
};

function env(key) {
  const line = readFileSync(join(ROOT, '.env'), 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${key}=`));
  const val = line?.slice(key.length + 1).trim();
  if (!val || val.includes('REPLACE-ME')) {
    console.error(`${key} missing in .env`);
    process.exit(2);
  }
  return val;
}

function findRef(slug) {
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    const p = join(REFS, `${slug}.${ext}`);
    if (existsSync(p)) return p;
  }
  return null;
}

// Deterministic per-speaker variety: pose / garment / backdrop picked by slug hash,
// and the speaker's motif becomes the FOCAL conjured artifact (not a hidden sigil).
// Frame, style, palette system stay locked — variety lives inside the oval only.
const POSES = [
  'holding the conjured artifact aloft in one raised hand, gaze steady at the viewer',
  'studying the artifact as it floats above an open palm at chest height',
  'conjuring the artifact between both hands, threads of light connecting the fingers',
  'turned three-quarter with the artifact hovering beside their shoulder',
  'arms crossed confidently while the artifact orbits slowly above',
  'writing in a small floating tome while the artifact glows above the page',
];
const GARMENTS = [
  'a high-collared arcane robe',
  "a scholar's layered coat with a leather satchel strap",
  'a hooded mantle worn back off the head',
  'an embroidered vest over rolled shirt-sleeves',
  'a ceremonial cloak fastened with a single metal clasp',
  'a simple traveling robe with a craftsman\'s tool belt',
];
const BACKDROPS = [
  'a candlelit observatory with brass instruments',
  'endless library shelves fading into darkness',
  'an alchemical workshop with glowing glassware',
  'a starlit tower balcony overlooking a luminous city of spires',
];

function hashPick(slug, arr, salt) {
  let h = salt;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return arr[h % arr.length];
}

function buildPrompt(houseColor, motif, slug) {
  const pose = hashPick(slug, POSES, 7);
  const garment = hashPick(slug, GARMENTS, 13);
  const backdrop = hashPick(slug, BACKDROPS, 29);
  return `The FIRST attached image is a reference caricature of a specific person (the official illustrated version used by a newsletter). The SECOND attached image is my anchor reference card — match its exact frame construction, palette treatment, and rendering style; change ONLY the character, the set color, and the motif details.

RESTYLE the person from the first image into an ornate collectible "wizard card" for a card-collecting study app.

IDENTITY — preserve from the first attached reference: Keep the person clearly recognizable. Preserve their facial features, hairstyle, distinguishing traits, and overall likeness from the reference. This must still read as the SAME person — just redrawn in a new artistic style. Do not invent a different face.

RESTYLE INTO THIS STYLE (lock exactly — identical on every card)
Antique illuminated trading-card illustration. Painterly oil-portrait finish with fine engraved linework, the look of a vintage arcane collectible. Rich, museum-like, slightly aged. Dignified, not cartoonish. Reimagine the person as a learned alchemist-sage with a composed, intelligent expression.

THIS CARD'S UNIQUE STAGING (varies per card — this is what makes each sage distinct)
The sage's signature conjured artifact, rendered as a small luminous magical manifestation: ${motif}. NOT a generic glowing orb — the artifact's shape must clearly express this description.
Pose: ${pose}.
Attire: ${garment}, in the dominant set color with gold trim.
Behind the subject inside the oval: ${backdrop}, softly lit and atmospheric.

FRAME & LAYOUT (lock exactly — match the anchor card's ornate density)
Place the restyled head-and-shoulders portrait inside an arched oval window. Around it, an ELABORATE, DENSELY LAYERED gilded baroque filigree frame — thick sculpted gold scrollwork with multiple nested border bands, exactly as rich and dimensional as the second attached anchor card. Ornate corner flourishes, two small round side medallions at mid-height, and abundant mystical detail (constellations, arcane sigils, fine engraved starfields) filling the space between borders. Weave in a subtle modern "tech wizard" nod: thin circuitry traced into the gold filigree, plus a miniature emblem of the sage's artifact worked into the two side medallions. Reserve TWO completely BLANK zones for later text overlay (no letters in them): a slim banner plaque across the TOP, and a blank scroll / cartouche across the BOTTOM THIRD.

PALETTE / LIGHT
Candlelit chiaroscuro, warm gold-leaf accents, jewel tones. Dominant set color: ${houseColor}.

RARITY — rare (match the anchor card's treatment)
Gleaming gold-leaf frame, an iridescent rainbow holographic prismatic sheen running along the outermost border edge exactly like the anchor card, softly glowing sigils throughout.

CONSTRAINTS
Preserve the reference likeness. No readable text, letters, or numbers anywhere on the card. Keep the top banner and bottom scroll empty. No logos, no watermarks, no existing franchise or branded card design. Single character only.

FORMAT
Vertical trading card, 5:7 ratio, rounded corners, character centered, high resolution.`;
}

async function generate(slug, apiKey, force) {
  const out = join(ROOT, 'public', 'cards', `${slug}.png`);
  if (existsSync(out) && !force) {
    console.log(`⏭  ${slug}: public/cards/${slug}.png already exists (use --force to regenerate)`);
    return 'skipped';
  }
  const ref = findRef(slug);
  if (!ref) {
    console.log(`⏭  ${slug}: no caricature at pipeline/art-refs/${slug}.(png|jpg|jpeg|webp)`);
    return 'no-ref';
  }
  const extractedPath = join(ROOT, 'pipeline', 'work', slug, '01-extracted.json');
  const profilePath = join(ROOT, 'pipeline', 'work', slug, '03b-speaker.json');
  if (!existsSync(extractedPath) || !existsSync(profilePath)) {
    console.log(`⏭  ${slug}: pipeline work files missing (run the dataset pipeline first)`);
    return 'no-data';
  }
  const house = JSON.parse(readFileSync(extractedPath, 'utf8')).source?.speaker?.house;
  const motif = JSON.parse(readFileSync(profilePath, 'utf8')).motif;
  const houseColor = HOUSE_COLORS[house];
  if (!houseColor || !motif) {
    console.log(`⏭  ${slug}: missing house (${house}) or motif`);
    return 'no-data';
  }

  console.log(`🎨 ${slug}: house=${house}, motif="${motif}"`);
  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('prompt', buildPrompt(houseColor, motif, slug));
  form.append('size', '1024x1536');
  form.append('quality', 'high');
  form.append('n', '1');
  const refBlob = new Blob([readFileSync(ref)], { type: ref.endsWith('.png') ? 'image/png' : 'image/jpeg' });
  const anchorBlob = new Blob([readFileSync(ANCHOR)], { type: 'image/jpeg' });
  form.append('image[]', refBlob, `${slug}-ref.png`);
  form.append('image[]', anchorBlob, 'anchor.jpg');

  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`❌ ${slug}: HTTP ${res.status} — ${body.slice(0, 400)}`);
    return 'error';
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) {
    console.error(`❌ ${slug}: no image in response`);
    return 'error';
  }
  writeFileSync(out, Buffer.from(b64, 'base64'));
  console.log(`✅ ${slug} → public/cards/${slug}.png`);
  return 'ok';
}

const argv = process.argv.slice(2);
const force = argv.includes('--force');
const slugs = argv.includes('--all')
  ? readdirSync(REFS)
      .map((f) => f.replace(/\.(png|jpe?g|webp)$/i, ''))
      .filter((s, i, a) => a.indexOf(s) === i)
  : argv.filter((a) => !a.startsWith('--'));

if (slugs.length === 0) {
  console.error('Usage: node pipeline/generate-card.mjs <slug> [...] | --all  [--force]');
  process.exit(2);
}
const apiKey = env('OPENAI_API_KEY');
const CONCURRENCY = 4; // parallel API calls; keep under org rate limits
const tally = {};
const queue = [...slugs];
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    for (let slug = queue.shift(); slug; slug = queue.shift()) {
      const r = await generate(slug, apiKey, force);
      tally[r] = (tally[r] ?? 0) + 1;
    }
  }),
);
console.log('\nDone:', JSON.stringify(tally));
