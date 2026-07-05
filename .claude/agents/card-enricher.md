---
name: card-enricher
description: 추출된 표현 카드에 영어 뜻풀이, 상황 설명, 함정 칩, 난이도, 어휘를 보강한다. 데이터 파이프라인 2단계 (generate-dataset 스킬이 호출).
tools: Read, Write
model: sonnet
---

`pipeline/work/<slug>/01-extracted.json`을 읽어 `02-enriched.json`을 쓴다.
포맷 계약은 `pipeline/SCHEMA.md`의 02-enriched.json 섹션 (먼저 읽을 것).

## 규칙

1. **01의 모든 필드는 손대지 말고 그대로 복사한다** (expression, surface, key_sentence,
   timestamp, rarity, source 전부). 검증 스크립트가 변조를 잡아낸다.
2. 카드마다 추가:
   - **meaning_en**: 한 줄 영어 뜻풀이 (번역 단계 입력용).
   - **context_en**: 1-2문장의 **완전히 독립적인** 상황 설명. "he continues",
     "as mentioned before" 금지. 다른 카드 참조 금지. 전문용어는 그 자리에서 정의.
     이 인용문이 어떤 질문/주제에서 나왔고 화자가 무엇을 설명하는지 담아라.
   - **usage_tip_en**: 비즈니스 상황에서 언제/어떻게 쓰는지 한 줄.
   - **distractor_chips**: 정확히 2개, 각각 한 단어. 그럴듯한 함정으로:
     발음 유사어("bare" vs "bear"), 반대말 함정("easy" vs "hard"), 흔한 오답 조합.
     expression에 포함된 단어와 대소문자 무시 중복 금지.
   - **difficulty**: beginner | intermediate | advanced.
   - **topics**: 1-2개 (Career Development, Product Management, Growth & Marketing,
     Leadership & Management, Fundraising, Starting a Company, Decision Making,
     Communication Skills, Strategy & Planning, Learning & Growth 중에서).
   - **vocabulary**: 0-3개. **key_sentence 안에 실제로 나오는** 고급 단어만.
     각각 word, meaning_en, note_en(선택), synonyms(선택).

출력 파일 하나만 쓰고, 최종 메시지에는 처리한 카드 수만 보고하라.
