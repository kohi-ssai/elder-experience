# 어르신 체험관 (Elder Experience)

A Korean-language elderly-empathy education web app. Static multi-page
HTML/CSS/JS, no build system, no backend. `index.html` is the hub linking
to five self-contained experience pages, each simulating a different aspect
of aging for the visitor. Each hub card has an [안내] button opening a sheet
(의미·목적·체험 방법·기대 효과) from the `GUIDE` object in `index.html` — update
that text whenever an experience's controls or content change:

- **vision.html** — 카메라로 보는 안질환. The hub links it twice as 시각 체험(노화)
  (`vision.html?g=aging`, 노화성 안질환 8종) and 시각 체험(일반) (`?g=general`,
  일반 시각장애 7종); each shows only its own group. Live camera feed run through per-condition visual filters
  (CSS `filter` for most conditions; a dedicated `<canvas>` redrawn every
  `requestAnimationFrame` for effects CSS can't express, e.g. color-blindness
  matrices and the presbyopia "loupe" partial-sharp-patch interaction).
  Includes stage buttons (초기/중기/말기) for every condition except 노안, which has
  '가까운 글씨 보기 / 먼 거리 보기' instead, and a hemianopia left/right toggle
  (hemianopia shows full-screen, no split). Effect shapes shared with games.html
  (glaucoma pattern, protanopia matrix, AMD warp, canvas ghost/bloom) live in
  `assets/js/vision-fx.js` (`window.VisionFx`).
- **games.html** — 일상생활 체험: 물건 찾기 · 키오스크 주문 · 지하철 노선도 찾기, 3가지
  게임, each with the same vision conditions applied on top. Canvas screens get
  pixel effects in `drawCanvasFx()`; HTML screens get SVG filters (`domSvgFx()`).
  **Keep it in sync with vision.html**: the same conditions in both pages, and any
  change to a vision effect must be applied here too and checked in all three games
  (items · kiosk · subway guide/map), including that game taps and the result-modal
  buttons still work under every condition.
- **hearing.html** — 지하철·병원 안내음성을 중증 난청으로 먼저 듣고 안내마다
  객관식 1 + 받아쓰기(빈칸) 1문제를 풀면 정상 청력이 열리는 흐름. 안내별 점수와
  탭(지하철/병원) 총점 표시. 음성은 `assets/audio/*_s.mp3`(중증)·`*_n.mp3`(정상).
- **tremor.html** — 미로 통과 · 따라쓰기 채점, 2가지 방식 선택. The maze mode
  overlays a room-grid derived from the real hospital floor plan photo
  (`assets/img/hospital_map.jpg`) with a walkability grid + BFS pathfinding
  (`ROOMS`/`BLOCK_ONLY_RECTS`, line-of-sight-verified path simplification)
  and a guide line whose visible jitter simulates hand tremor at increasing
  severity across 3 mission sets. Per-set miss counts are shown on the
  victory screen (not summed across sets). The writing mode shows only the
  current tremor level (no stability/deviation numbers — those measured the
  injected jitter, not the user).
- **memory.html** — 기억력·집중력 체험. 탭 5개(장보기·가는 길·약 정리·일상 판단·집중력)를 각각 따로 체험.
  앞의 3개는 암기 → 방해과제(계산) → 회상 구조, 일상 판단은 치매 어르신 상황 9개에
  대한 사회복무요원 응대 선택 + 해설. 결과 화면마다 '체험 후 생각해보기' 질문,
  모든 탭을 마치면 결과 화면에 전체 점수(`RESULTS`, 다시 하면 갱신). 장보기·가는 길·약 정리는
  초기·중기·말기 단계 선택(외우는 시간은 크게 줄이지 않고 항목 수·비슷한 보기·계산 문제 수로 조절).
  집중력 탭은 스트룹(글자 뜻이 아닌 색 고르기): 연습 3문제(뜻=색) 뒤 본문제, 두 구간 평균 반응 시간을
  비교해 보여준다. 단계는 색 종류·버튼 섞기·방해 자막으로만 조절(시간 제한·가짜 지연 없음).
  탭 전환 시 `runId`로 진행 중 타이머를 무효화한다.

Shared design tokens live in `assets/css/theme.css`. Pages are IIFE-scoped;
any function referenced from an inline `onclick` must be explicitly exported
via `window.fnName = fnName`.

## Workflow conventions

- All development happens on branch `claude/elderly-app-file-linking-h00643`
  against this repo (`kohi-ssai/elder-experience`).
- The user's merge-trigger is the literal word **"반영"** — do not merge a PR
  until they say it, even after describing/testing the change.
- Lifecycle per change: implement → verify with Playwright (headless
  Chromium at `/opt/pw-browsers/chromium`, camera mocked via
  `canvas.captureStream()` injected in `page.addInitScript`) → commit → push
  → open a **draft** PR → wait for "반영" → mark ready for review →
  squash-merge → unsubscribe from PR activity.
- Squash-merge means each merged PR becomes one commit on `main`. Since the
  designated branch is reused across PRs, **after every merge**, reset it
  from the fresh default branch before starting new work:
  `git fetch origin main && git checkout -B claude/elderly-app-file-linking-h00643 origin/main`,
  then push with `-u` (force-with-lease if the branch still has the old,
  now-merged history).
- Past PRs (and `git log`) are the authoritative history of what's been
  built and why — this file intentionally does not duplicate a changelog.
