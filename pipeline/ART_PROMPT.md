# 카드 아트 프롬프트 템플릿 (매뉴얼 생성용)

스피커당 이미지 **1장** — 표현 카드들이 같은 초상을 공유하고, 희귀도는 앱의 CSS가
표시한다(브론즈/골드 테두리 + 홀로). 이미지에는 절대 글자를 넣지 않는다.

## 사용법

1. Lenny's Podcast 공식 스피커 캐리커처 이미지를 준비한다.
2. 아래 템플릿의 `{{...}}` 변수를 채운다:
   - `{{HOUSE_COLOR}}`: founder = deep navy / investor = emerald green / operator = royal purple
   - `{{MOTIF}}`: `pipeline/work/<slug>/03b-speaker.json`의 `motif` 값
3. ChatGPT에 캐리커처를 첨부하고 프롬프트를 붙여넣는다.
   **두 번째 스피커부터는 Bret 앵커 카드(`public/cards/bret-taylor.jpeg`)도 함께 첨부**하고
   대괄호 안의 앵커 문장을 포함시킨다 → 전체 카드 스타일 통일.
4. 결과물을 `public/cards/<speaker-slug>.png` 로 저장 (세로 5:7, 1000×1400 이상).

## 템플릿 (Bret 카드를 만든 원본 프롬프트 — 검증됨, 변수 3곳만 교체)

`{{HOUSE_COLOR}}` / `{{MOTIF}}` / RARITY 블록만 바꾸고 나머지 문구는 그대로 쓸 것.

```
I'm attaching a reference caricature of a specific person (the official illustrated
version used by a newsletter). RESTYLE this exact character into an ornate collectible
"wizard card" for a card-collecting study app.

IDENTITY — preserve from the attached reference: Keep the person clearly recognizable.
Preserve their facial features, hairstyle, distinguishing traits, and overall likeness
from the reference. This must still read as the SAME person — just redrawn in a new
artistic style. Do not invent a different face.

RESTYLE INTO THIS STYLE (lock exactly — identical on every card)
Antique illuminated trading-card illustration. Painterly oil-portrait finish with fine
engraved linework, the look of a vintage arcane collectible. Rich, museum-like, slightly
aged. Dignified, not cartoonish. Reimagine the person as a learned alchemist-sage:
composed, intelligent expression, holding a small glowing orb of light.

FRAME & LAYOUT (lock exactly)
Place the restyled head-and-shoulders portrait inside an arched oval window. Around it,
an elaborate gilded baroque filigree frame on aged parchment, with ornate corner
flourishes and faint mystical motifs (constellations, arcane sigils). Weave in a subtle
modern "tech wizard" nod: thin circuitry traced into the gold filigree, plus {{MOTIF}}
hidden among the sigils. Reserve TWO completely BLANK zones for later text overlay
(no letters in them): a slim banner plaque across the TOP, and a blank scroll /
cartouche across the BOTTOM THIRD.

PALETTE / LIGHT
Candlelit chiaroscuro, warm gold-leaf accents, jewel tones.
Dominant set color: {{HOUSE_COLOR}}.

RARITY — rare
Gleaming gold-leaf frame, holographic prismatic sheen across the border, softly glowing
sigils.

CONSTRAINTS
Preserve the reference likeness. No readable text, letters, or numbers anywhere on the
card. Keep the top banner and bottom scroll empty. No logos, no watermarks, no existing
franchise or branded card design. Single character only.

FORMAT
Vertical trading card, 5:7 ratio, rounded corners, character centered, high resolution.
```

### 변수 값

- `{{HOUSE_COLOR}}`:
  - founder → `deep slate navy (#1B2433) with warm gold (#E0A85E)` (Bret 원본 그대로)
  - investor → `deep emerald green (#1B3325) with warm gold (#E0A85E)`
  - operator → `royal plum purple (#2A1B33) with warm gold (#E0A85E)`
- `{{MOTIF}}`: `pipeline/work/<slug>/03b-speaker.json`의 `motif` 값
  (Bret 원본은 `a tiny map-pin and a small "like" heart`)
- RARITY 블록: 그대로 **rare 버전으로 1장만 생성**하는 것을 권장 —
  common 카드의 무광 브론즈 톤은 앱 CSS(`.fcard.common`)가 처리하므로 이미지 2장이 필요 없다.
  (굳이 common 전용 이미지를 원하면: `RARITY — common / Aged bronze matte frame, quiet
  magic, no holographic sheen.`으로 교체)

## 레니 스프라이트 (타이틀/홈/대화 씬 캐릭터)

OpenAI(ChatGPT) 이미지 생성에 아래 프롬프트를 붙여넣는다.
**레니의 공식 캐리커처(팟캐스트 커버 이미지)를 첨부**하면 얼굴 일관성이 좋아진다.
결과물은 `public/portraits/lenny.png`로 저장 — 지금의 SVG 플레이스홀더를 자동 대체한다.

```
Create a full-body video-game character sprite of the attached person reimagined as a
warm, friendly INNKEEPER-GUIDE in a cozy fantasy world — think classic visual-novel
mentor character.

IDENTITY: Preserve the attached person's face, hairstyle, and glasses so he is clearly
recognizable as the same person. Do not invent a different face. Friendly smile,
approachable posture.

CHARACTER: He runs a scholarly inn called "Lenny's Study". Outfit: a humble
scholar-innkeeper robe in deep plum/navy tones with a mustard-gold scarf, rolled-up
sleeves, a small satchel of letters and scrolls at his hip. In one hand he holds up a
warm glowing brass lantern; the other hand is raised in a welcoming gesture. Subtle
modern nod: a tiny newsletter/envelope sigil pinned to his scarf.

STYLE: painterly storybook illustration with clean linework — matches an antique
illuminated trading-card world (oil-painting texture, candlelit warmth, gold accents).
NOT anime, NOT pixel art, NOT 3D render.

POSE & FRAMING: full body, standing, slight 3/4 angle facing the viewer, feet visible.
Character fills ~90% of frame height.

BACKGROUND: fully TRANSPARENT (PNG). No floor shadow beyond a soft small contact shadow.

CONSTRAINTS: no text, numbers, logos, or watermarks. Single character only.
FORMAT: vertical portrait orientation, high resolution, transparent PNG.
```

변형 포즈(선택, 나중에): 같은 프롬프트에 "SAME character, SAME style, only change the
pose:" + (a) 두 팔 벌려 환영 (b) 걱정스레 도감을 살펴봄 (c) 축하하며 랜턴을 치켜듦 —
대화 감정 표현용 2-3포즈면 충분하다.

## 배경 아트 — "Lenny's Study" 여관 내부 (VN 씬 배경)

홈/인트로 씬의 배경. 결과물을 `public/backgrounds/study.png`로 저장하면 자동 적용된다
(없으면 다크 그라데이션 폴백). 크로마키 불필요 — 배경은 그대로 쓴다.

```
Create a cozy fantasy inn interior background for a visual-novel game scene —
"Lenny's Study", a scholarly inn where a friendly innkeeper-guide welcomes travelers.

SETTING: warm candlelit study-tavern interior. Elements: tall bookshelves stuffed with
tomes and scrolls, a stone fireplace with gentle embers, a heavy wooden writing desk
with quills and an open ledger, hanging brass lanterns, a small notice board with
pinned letters, mugs and a kettle on a side table. Subtle modern nods: a wall of
pinned newsletters, a tiny map of a valley on the wall.

COMPOSITION: eye-level wide shot. Keep the LEFT THIRD of the floor area open and
uncluttered — a standing character sprite will be placed there. Main furniture and
detail on the center-right.

STYLE: painterly storybook illustration, oil-painting texture, candlelit chiaroscuro
with gold accents — must match an antique illuminated trading-card world.
NOT anime, NOT pixel art, NOT 3D render.

MOOD & VALUES: warm but DIM overall (deep plum/navy shadows, amber light pools) —
a bright parchment dialogue bubble must stay readable on top of it.

CONSTRAINTS: no people, no animals, no text or signage with readable letters,
no logos or watermarks.
FORMAT: landscape 16:9, high resolution.
```

변형(로드맵): 하우스별 알현 배경 — Founders' Keep 성 안 서재(네이비),
Verdant Exchange 온실 정원(에메랄드), Artisans' Guild 공방(퍼플). 같은 프롬프트에서
SETTING/HOUSE COLOR만 교체.

## 주의 (lennys-dex HANDOFF에서 검증된 함정)

- 실사진 복제 금지 — 일러스트 해석체로 (likeness 이슈 회피).
- "Harry Potter", "Chocolate Frog" 같은 IP 단어를 프롬프트에 쓰지 말 것 —
  "antique illuminated / alchemist" 계열 원천 미학으로만 묘사.
- 첫 장이 잘 나오면 그 이미지를 앵커로 고정해서 시리즈 전체 통일감 유지.
