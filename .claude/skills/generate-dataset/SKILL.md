---
name: generate-dataset
description: Lenny's Podcast 트랜스크립트 1개에서 lennys-quest 카드 데이터셋을 생성하는 파이프라인 오케스트레이터. 사용법 "/generate-dataset <트랜스크립트명>" (예: /generate-dataset Wes_Kao). 서브에이전트(quote-extractor→card-enricher→korean-translator→speaker-profiler)를 순서대로 실행하고 validate.mjs로 검증한다. 병합(merge)은 사용자 승인 후에만.
---

# generate-dataset 파이프라인 오케스트레이터

인자: 트랜스크립트 이름 (예: `Wes_Kao` → `pipeline/transcripts/Wes_Kao.txt`).
모든 경로는 `lennys-quest/` 기준. 포맷 계약은 `pipeline/SCHEMA.md`.

## 절차

1. **준비**
   - `pipeline/transcripts/<이름>.txt` 존재 확인. 없으면 `../Lennys_Eng-Study/transcripts/`에서
     복사한다 (있는 경우). 그래도 없으면 사용자에게 파일을 요청하고 중단.
   - slug 계산: 게스트 이름 소문자-하이픈 (예: `wes-kao`). `pipeline/work/<slug>/` 생성.

2. **재개(resume) 체크**: 아래 각 스테이지는 출력 파일이 이미 존재하면 건너뛴다.

3. **스테이지 실행** (Task 도구로 서브에이전트 호출, 순서대로):
   - `quote-extractor` → `01-extracted.json` (트랜스크립트 경로 + 출력 경로 전달)
   - `card-enricher` → `02-enriched.json`
   - `korean-translator` → `03-translated.json`
   - `speaker-profiler` → `03b-speaker.json` (01만 있으면 실행 가능, 병렬 가능)

4. **검증**: `node pipeline/validate.mjs <slug>` 실행.
   - **실패 시**: `pipeline/work/<slug>/validation-report.json`의 에러를 읽고,
     책임 스테이지의 에이전트에게 에러 내용을 전달해 해당 카드만 수정하는 재실행을 시킨다
     (V1/V2/V3/V7/V9 → quote-extractor, V5/V6/VOCAB → card-enricher, V8 → korean-translator).
     스테이지당 최대 2회 재시도. 그래도 실패하는 카드는 03-translated.json에서 제거하고
     보고서에 기록한다 — **불량 카드는 절대 내보내지 않는다.**
   - 카드 제거 후 파일 레벨 체크(6장 미만)에 걸리면 quote-extractor에게 추가 추출을 요청.

5. **리뷰 요약 출력 후 정지** (병합 금지):
   - 표현 목록 (표현 / 뜻 / 희귀도 / 난이도 표)
   - rare 비율, 카드 수
   - 대표 카드 1장의 전체 필드 샘플
   - 안내: "품질을 확인하셨으면 `node pipeline/merge.mjs <slug>` 로 병합하거나,
     저에게 '병합해' 라고 말씀해 주세요. 카드 아트는 `pipeline/ART_PROMPT.md` 템플릿으로
     생성해서 `public/cards/<slug>.png`에 넣으면 됩니다."

6. **병합은 사용자가 명시적으로 승인한 경우에만**: `node pipeline/merge.mjs <slug>`.
   병합 후 `npm run dev`가 켜져 있으면 새 스피커가 지도에 바로 나타난다.

## 배치 모드 (post-MVP)

`/generate-dataset --batch <파일>` — 파일에 트랜스크립트 이름을 줄 단위로 나열.
각 이름에 대해 1–5를 반복. work/ 체크포인트 덕에 중단돼도 재실행하면 이어서 진행된다.
