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
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

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
  return buildInteriorPrompt(houseColor, motif, pose, garment, backdrop);
}

// Fixed-frame system: the API paints ONLY the oval interior portrait; the ornate
// frame is a per-house template composited by pipeline/compose_card.py.
function buildInteriorPrompt(houseColor, motif, pose, garment, backdrop) {
  return `The FIRST attached image is a reference caricature of a specific person (the official illustrated version used by a newsletter). The SECOND attached image is a style reference — match its painterly rendering style, lighting, and mood ONLY; completely ignore its ornate frame, plaques, and borders.

Paint the person from the first image as an OVAL PORTRAIT INTERIOR for a collectible wizard card (the ornate frame will be added separately by software — do NOT paint any frame).

IDENTITY — preserve from the first attached reference: Keep the person clearly recognizable. Preserve their facial features, hairstyle, distinguishing traits, and overall likeness from the reference. Preserve the person's apparent AGE from the reference — youthful subjects must stay youthful; do NOT age them up, no added wrinkles or gray hair. This must still read as the SAME person — just redrawn in a new artistic style. Do not invent a different face.

STYLE (lock exactly — identical on every card)
Antique illuminated portrait illustration. Painterly oil-portrait finish with fine engraved linework, the look of a vintage arcane collectible. Rich, museum-like. Dignified, not cartoonish. Reimagine the person as an alchemist-sage with a composed, intelligent expression.

THIS CARD'S UNIQUE STAGING (varies per card — this is what makes each sage distinct)
The sage's signature conjured artifact, rendered as a small luminous magical manifestation: ${motif}. NOT a generic glowing orb — the artifact's shape must clearly express this description.
Pose: ${pose}.
Attire: ${garment}, in the dominant set color with gold trim.
Backdrop behind the subject: ${backdrop}, softly lit and atmospheric, with faint glowing constellations.

COMPOSITION
Head-and-shoulders to waist-up portrait, subject centered, head in the upper third with clear space above the hair. All four EDGES and CORNERS of the image fade into deep dark atmosphere (near-black vignette in the dominant set color) — no bright content touching any edge, because the outer area will be masked to an oval.

PALETTE / LIGHT
Candlelit chiaroscuro, warm gold-leaf accents, jewel tones. Dominant set color: ${houseColor}.

CONSTRAINTS
Preserve the reference likeness. NO frame, NO border, NO plaques, NO banners. No readable text, letters, or numbers anywhere. No logos, no watermarks. Single character only.

FORMAT
Vertical portrait, high resolution.`;
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
  const interiorDir = join(ROOT, 'pipeline', 'interiors');
  mkdirSync(interiorDir, { recursive: true });
  writeFileSync(join(interiorDir, `${slug}.png`), Buffer.from(b64, 'base64'));

  const py = spawnSync('python', [join(ROOT, 'pipeline', 'compose_card.py'), slug, house], {
    encoding: 'utf8',
  });
  if (py.status !== 0) {
    console.error(`❌ ${slug}: compose failed — ${py.stderr?.slice(0, 300)}`);
    return 'error';
  }
  console.log(`✅ ${slug} → interior + composed public/cards/${slug}.png`);
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
