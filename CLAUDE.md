# lennys-quest — 밸리의 견습 마법사

Lenny's Podcast 트랜스크립트 기반 비즈니스 영어 학습 게임 (비주얼노벨 + 카드 수집).
플레이어(견습 마법사)가 현자(팟캐스트 게스트)의 가르침(인용문)을 공부하고
칩 퀴즈를 통과하면 마법사 카드를 수집한다. 설계 배경은 두 프로토타입:
`../lennys-dex` (카드 도감/gamification), `../Lennys_Eng-Study` (학습 데이터셋).

## 실행

- `npm run dev` — 개발 서버 (포트 3456)
- `npm run build` — 타입체크 + 빌드
- `npm run validate -- <slug>` / `npm run merge -- <slug>` — 파이프라인 스크립트

## 구조

- **정적 SPA** (React 19 + TS + Vite 6 + Tailwind 4). 라우터 없음 —
  `src/types.ts`의 `Screen` union + `src/game/GameProvider.tsx`의 useReducer 상태머신.
- **콘텐츠** = `public/data/cards.json` + `speakers.json` (pre-baked, 런타임 LLM 호출 없음).
  스키마는 `src/types.ts`의 `Card`/`Speaker`.
- **언어 정책 (2026-07-05 확정)**: 앱 UI와 콘텐츠는 **영어 기본** (X/LinkedIn 공유용).
  유일한 한국어는 `keyPhrase.meaning_ko` (학습 페이지에서 tap-to-reveal).
  새 UI 문구·대사·데이터 필드를 추가할 때 한국어로 만들지 말 것.
- **진행 상태** = localStorage `lennys-quest-save` (`SaveGameV1`, 버전드 마이그레이션은
  `src/lib/storage.ts`). 콘텐츠와 진행 상태는 절대 섞지 않는다.
- **게임 룰** (lennys-dex HANDOFF에서 계승된 불변 원칙):
  - 카드 = 표현 1개. 스피커는 세트 라벨. 아트는 스피커당 1장 공유.
  - 레어도(테두리/홀로)와 마스터(별)는 독립 축.
  - **벌점 없음.** 퀴즈 실패·스트릭 끊김으로 카드를 잃지 않는다.
  - 복습 = 고정 간격(포획 다음 세션에 마스터 도전 1회). 적응형 SRS는 post-MVP.
  - 이미지에 글자 굽지 않기 — 표현/이름은 CSS 오버레이 (`TiltCard`의 banner/scroll).
- **복습 연출**: "잉크 바램" — due 카드는 도감에서 탈색 + 배지. 마스터(★★)하면 영구 도금.
- 설정 모달의 **[다음 날 →]** 버튼으로 세션을 강제 진행해 복습 루프를 시연할 수 있다.

## 데이터 파이프라인 (API 키 불필요 — Claude Code 서브에이전트)

`/generate-dataset <트랜스크립트명>` 스킬 참고 (`.claude/skills/generate-dataset/SKILL.md`).
스테이지 계약: `pipeline/SCHEMA.md`. 흐름:

```
transcripts/*.txt → quote-extractor(sonnet) → card-enricher(sonnet, 영어 콘텐츠가 그대로 앱에 실림)
  → korean-translator(sonnet, meaning_ko만) + speaker-profiler(haiku, 영어 프로필)
  → node pipeline/validate.mjs <slug>   (결정적 검증 + chips 파생)
  → [사용자 품질 승인] → node pipeline/merge.mjs <slug>
```

- chips는 LLM이 아니라 validate.mjs가 expression에서 결정적으로 파생한다.
- key_sentence는 트랜스크립트 verbatim — validator가 substring 검사.
- 트랜스크립트 타임스탬프는 파일마다 MM:SS 또는 HH:MM:SS — 표기 그대로 복사.
- 병합은 반드시 사용자 승인 후에만.

## 카드 아트 (매뉴얼)

`pipeline/ART_PROMPT.md`의 템플릿으로 ChatGPT에서 생성 →
`public/cards/<slug>.png` (5:7 세로). 없으면 `_placeholder.svg` 폴백.
레니 스프라이트는 `public/portraits/lenny.png`가 생기면 SVG 플레이스홀더를 대체.

## 로드맵 (post-MVP, 우선순위 순 — 2026-07-06 갱신)

1. **본격 SRS (SM-2-lite) + 문장 통암기 단계 "Sage"** — 같은 마일스톤으로 묶음:
   - SRS: 카드별 interval/ease/dueDate
   - Sage(✦✦): Master(★★) 위 3단계 — 문장 전체 cloze(칩 전체) 또는 자유 타이핑으로
     key_sentence 통암기. mastery 0-3으로 확장
   - 둘 다 SaveGame **v2 마이그레이션** 필요 (storage.ts migrate switch에 case 2 추가)
1.5. **프린세스 메이커 3식 전체 게임 UI 오버홀** — VN 씬은 PM3 구도 적용 완료(VnScene/SpeechBubble);
   지도·도감·학습·퀴즈 화면까지 장식 패널/프레임/게임 메뉴 스타일로 재설계.
   하우스별 알현 배경 아트 3종 포함 (Hyelin 최애 게임 오마주 — ART_PROMPT.md 배경 섹션 참고)
2. **그리모어 공유 카드** — 내 컬렉션 통계(카드 수·하우스 진행·스트릭·최애 카드)를
   canvas로 예쁜 이미지 렌더 → X/LinkedIn 첨부용 다운로드. 쇼케이스 목적과 직결
3. **메타 진행 & 이벤트 (PM3 게임 디자인, 3페이즈)** — "카드 수집의 so what" 해결:
   - P1 랭크 시스템: 수집량 마일스톤마다 견습생 칭호 상승(Apprentice→Adept→Archmage 등),
     홈에 칭호 표시 + 마일스톤 도달 시 레니 칭찬 VN 씬 인터스티셜
   - P2 현자 동행 이벤트: 한 현자의 카드를 전부 모으면 특별 대화 에피소드 해금
     (PM3 휴가/이벤트 씬 오마주 — 현자와의 1:1 스토리 + 보너스 가르침)
   - P3 엔딩: 하우스 완성/전체 완성 시 엔딩 일러스트 + 에필로그 (PM3 멀티엔딩 오마주)
2. 299개 트랜스크립트 스케일업 (`--batch` 모드)
3. 진행 데이터 JSON export/import
4. 오디오 — timestamp로 에피소드 딥링크
5. 자유 타이핑 퀴즈, legendary 등급, 세트 완성 보너스
6. PWA / 클라우드 동기화
- 중국어/스페인어 번역은 하지 않기로 확정. 런타임 LLM 호출도 없음.
