# 데이터 파이프라인 스테이지 포맷 (SCHEMA.md)

파이프라인 에이전트와 스크립트가 공유하는 계약 문서. 각 스테이지는
`pipeline/work/<speaker-slug>/` 아래 파일 하나를 쓴다. **파일이 곧 체크포인트** —
파일이 존재하고 검증을 통과하면 해당 스테이지는 재실행하지 않는다.

```
transcripts/<Name>.txt
  → 01-extracted.json    (quote-extractor, sonnet)
  → 02-enriched.json     (card-enricher, sonnet — 영어 콘텐츠가 앱에 그대로 실림)
  → 03-translated.json   (korean-translator, sonnet — meaning_ko만 추가)
  → 03b-speaker.json     (speaker-profiler, haiku — 영어 프로필)
  → validate.mjs         (결정적 검증 + chips 파생 → 04-validated.json)
  → [사용자 승인]
  → merge.mjs            (public/data/ 병합)
```

> **언어 정책 (2026-07-05 확정):** 앱은 영어 기본(X/LinkedIn 공유용).
> 카드에서 유일한 한국어 필드는 `meaning_ko` (키 프레이즈의 한국어 뜻) 하나다.
> context/usage tip/vocabulary/스피커 프로필은 전부 영어로 앱에 노출된다.

## 원칙

- **LLM은 판단, 스크립트는 결정성.** `chips`는 LLM이 만들지 않는다 —
  `validate.mjs`가 expression을 토큰화해 파생한다.
- 이전 스테이지의 필드는 **절대 수정하지 말고 그대로 복사**한다.
- `key_sentence`는 트랜스크립트에서 **글자 그대로(verbatim)** 복사한다.
  기계로 substring 검사를 하므로 한 글자라도 다르면 탈락한다.

## 트랜스크립트 포맷

```
Speaker Name (00:05:12):
발화 내용 여러 줄...

Lenny (00:05:40):
...
```

## 01-extracted.json (quote-extractor)

```jsonc
{
  "source": {
    "transcriptFile": "Wes_Kao.txt",
    "speaker": {
      "name": "Wes Kao",              // 게스트 이름 (트랜스크립트 표기 그대로)
      "role": "Co-founder, Maven",     // 트랜스크립트에서 파악한 현재 직함
      "house": "operator",             // founder | investor | operator
      "episode": "Wes Kao on Lenny's Podcast"
    }
  },
  "cards": [
    {
      "expression": "learn the hard way",       // 사전형(canonical) 표현
      "surface": "learned the hard way",        // key_sentence 안에 실제로 나타나는 형태.
                                                 // canonical과 동일하면 생략 가능
      "key_sentence": "...",                     // 트랜스크립트 verbatim, 15-35 단어
      "timestamp": "00:26:29",                   // 해당 발화 턴 시작 타임스탬프.
                                                 // 트랜스크립트 표기 그대로 (MM:SS 또는 HH:MM:SS)
      "rarity": "common"                         // common(~60%) | rare(~40%)
    }
  ]
}
```

카드 수: 8–10개. 게스트 발화만. 관용구/구동사/네이티브 표현 위주 (기초 어휘 금지).

## 02-enriched.json (card-enricher)

01의 모든 필드 + 카드마다 추가. **여기서 만든 영어 텍스트가 그대로 앱에 실린다** —
context_en/usage_tip_en/vocabulary는 최종 사용자 대상 문구 품질로 쓸 것:

```jsonc
{
  "meaning_en": "to learn through painful experience",   // 번역가의 입력용 (앱에 안 나감)
  "context_en": "1-2 sentences of STANDALONE situation setup...",  // 앱의 "The Story" 섹션
  "usage_tip_en": "When to use this in business talk...",          // 앱의 💡 사용 팁
  "distractor_chips": ["easy", "soft"],   // 정확히 2개, 한 단어씩, 그럴듯한 함정
  "difficulty": "intermediate",            // beginner | intermediate | advanced
  "topics": ["Career Development"],        // 1-2개
  "vocabulary": [                          // 0-3개, key_sentence 안에 나오는 단어만
    { "word": "moat", "meaning_en": "...", "note_en": "...", "synonyms": ["barrier"] }
  ]
}
```

## 03-translated.json (korean-translator, **sonnet**)

02의 모든 필드 그대로 + 카드마다 `meaning_ko` **하나만** 추가한다
(앱에서 유일한 한국어 노출 필드이므로 품질이 중요 — sonnet 사용):

```jsonc
{
  "meaning_ko": "호되게 직접 겪으며 깨닫다"   // 학습자 사전체, 자연스러운 한국어
}
```

고유명사(회사·인명)는 영어 유지. expression / key_sentence는 절대 번역·수정 금지.
sentence_ko / context_ko / usageTip_ko는 **더 이상 만들지 않는다** (영어 기본 정책).

## 03b-speaker.json (speaker-profiler) — 영어

```jsonc
{
  "epithet": "The Sage of Delivery",       // 게임 속 칭호 (영어, "The ... Sage" 꼴 권장)
  "titleHistory": "Co-founded altMBA with Seth Godin · Co-founder of Maven",
  "introLine": "…",                        // 알현 인사 대사 (현자 말투, 영어 1문장)
  "sealLine": "…",                         // 인장 수여 대사 (영어 1문장)
  "motif": "a glowing quill and a spark sigil"  // 카드 아트 프롬프트용 모티프 (영어 한 줄)
}
```

## 04-validated.json (validate.mjs가 생성 — 앱 최종 포맷)

`{ "cards": Card[], "speaker": Speaker }` — `src/types.ts`의 Card/Speaker와 동일.
chips는 여기서 파생·주입되고, id는 `<speaker-slug>-NNN`으로 부여된다.

## 검증 규칙 (validate.mjs)

| # | 규칙 |
|---|---|
| V1 | key_sentence가 트랜스크립트의 verbatim substring (공백·따옴표 정규화만 허용) |
| V2 | key_sentence 15–35 단어 |
| V3 | surface(없으면 expression)가 key_sentence 안에 존재 (대소문자 무시) |
| V4 | chips = expression 토큰화, 2–8개, 재조합하면 expression과 일치 |
| V5 | distractor 정확히 2개, 한 단어, chips와 중복 금지 (대소문자 무시) |
| V6 | rarity/difficulty enum 유효 |
| V7 | timestamp `MM:SS` 또는 `HH:MM:SS` 형식 (트랜스크립트 표기 그대로) + 트랜스크립트에 존재 |
| V8 | meaning_ko에 한글 존재 · context_en/usage_tip_en은 비어있지 않고 한글 미포함 |
| V9 | key_sentence의 발화자가 Lenny가 아님 |
| V10 | id가 기존 public/data/cards.json과 충돌하지 않음 |
| 파일 | 카드 6–12장, rare 비율 0.2–0.6 |

실패 시 `validation-report.json`에 `{ pass, errors: [{index, expression, check, detail}] }` 기록,
exit code 1. 성공 시 04-validated.json 생성, exit 0.
