---
name: sososo-refine
description: >-
  소소.소(sososo)에 이미 발행된 따뜻한 뉴스 글을 한 번 더 가다듬는다. 글 id(또는 최근 글)를
  받아 현재 본문을 피드(/today.json)에서 가져온 뒤, **작성에 관여하지 않은 별도 세션의
  '신선한 눈' 리뷰어 서브에이전트**에게 검토를 맡긴다. 검토 기준은 두 가지가 핵심이다: ①
  AI가 쓴 것 같은 어색한 문장을 없애고, ② 일반적으로 잘 쓰지 않는 단어를 흔한 말로 바꾼다.
  리뷰어가 낸 진단과 다듬은 버전(before/after)을 사용자에게 보여주고, 승인하면 재발행한다.
  사용자가 "발행한 글 다듬어줘 / 글 검토해줘 / AI 티 빼줘 / 문장 다시 손봐줘 / 어색한 표현
  고쳐줘 / sososo refine / 방금 올린 글 가다듬어줘"라고 하면 반드시 이 스킬을 사용한다.
  새 글을 작성·발행하는 일은 sososo-publish 가 맡고, 이 스킬은 그 결과물을 다듬는 후속 패스다.
---

# sososo-refine — 발행된 글을 신선한 눈으로 다시 다듬기

작성자는 자기 글에 눈이 멀기 쉽다. 그래서 이 스킬은 **글을 쓴 세션과 분리된 별도 세션
(서브에이전트)** 에게 검토를 맡긴다. 리뷰어는 글이 어떻게·왜 쓰였는지 모른 채 결과물만 보고
판단하므로, 작성자의 합리화에 오염되지 않은 교정을 한다.

검토의 두 축:
1. **AI가 쓴 것 같은 어색한 문장**을 사람이 말하듯 자연스럽게 고친다.
2. **잘 쓰지 않는 단어**를 누구나 아는 흔한 말로 바꾼다.

상세 기준은 `references/review-criteria.md` 에 있다. 리뷰어가 그 파일을 읽고 적용한다.

---

## 사전 조건

1. **CWD가 sososo 레포 루트.** (`package.json` name == sososo)
2. **재발행을 하므로 업로드 자격증명 필요**: `.env.local` 의 `UPLOAD_URL`/`UPLOAD_TOKEN`.
   없으면 검토는 할 수 있으나 재발행은 불가 — 시작 시 알린다.
3. 사이트 URL: `.env.local` 의 `NEXT_PUBLIC_SITE_URL` (없으면 `http://localhost:3000`).
   발행본은 `<SITE>/today.json` 에서 읽는다.

사용 도구: Bash, Read, Write, **Agent(서브에이전트 디스패치)**, WebFetch(또는 /today.json fetch).

---

## 절차

### 1단계 — 검토 대상 글 확보
- 사용자가 글 id를 주면 그 id를 쓴다. 안 주면 **가장 최근 글**(피드의 첫 항목)을 대상으로 하되,
  어떤 글인지 제목을 보여주고 진행한다.
- `<SITE>/today.json` 을 가져와 `items` 에서 대상 항목을 찾는다.
  ```bash
  curl -s "${SITE:-http://localhost:3000}/today.json"
  ```
- 항목의 `title`/`dek`/`body`/`tags`/`url`/`source`/`sourceDomain`/`publishedAt`/`imageUrl` 를 확보.
- id가 피드에 없으면 중단. 사유: `"item not found in feed"`.

### 2단계 — 별도 세션 리뷰 (이 스킬의 핵심)
**Agent 도구로 새 서브에이전트를 1개 띄운다.** 이 메인 세션(글을 쓰거나 발행한 컨텍스트)과
분리하기 위함이다. 리뷰어에게는 **완성된 초안 텍스트와 검토 기준만** 주고, 글의 작성 배경·의도는
설명하지 않는다 (신선한 눈 유지).

디스패치 프롬프트(아래 틀):

> 당신은 소소.소의 독립 교정 편집자입니다. 먼저 이 파일을 읽고 기준을 숙지하세요:
> `<이 스킬 절대경로>/references/review-criteria.md`
> 그런 다음 아래 글을 그 기준으로 검토하세요. 이 글이 어떻게 쓰였는지는 알 필요 없습니다.
> 결과물만 보고, 기준의 "출력 형식" 그대로 진단과 다듬은 버전을 돌려주세요.
> 사실(인명·수치·기관명·법률용어)은 바꾸지 마세요.
>
> [title] …
> [dek] …
> [body] …
> [tags] …

리뷰어는 진단(문장/단어 단위) + 다듬은 `title`/`dek`/`body`/`tags` + 판정을 반환한다.

### 3단계 — 진단·수정안 제시 (확인 게이트)
리뷰어 결과를 사용자에게 보여준다:
- **진단 목록**: 어떤 문장이 왜 AI 티가 나는지, 어떤 단어를 흔한 말로 바꿨는지.
- **before / after**: title·dek·body 를 원본과 다듬은 버전으로 나란히.
- 리뷰어 판정이 "이미 자연스러움"이면 그대로 보고하고, 굳이 재발행하지 않는다.
- 변경이 있으면 **재발행할지 사용자에게 확인**한다 (재발행은 비가역적 외부 작업).

### 4단계 — 재발행 (승인 시에만)
다듬은 버전으로 `IncomingNewsSchema` JSON을 만들어 `tmp/news.json` 에 쓴다. **id·url·source·
sourceDomain·publishedAt·imageUrl 은 원본 그대로** 두고, 바뀐 `title`/`dek`/`body`/`tags` 만 반영
한다 (`generatedAt` 은 현재 시각, `timezone`은 `"Asia/Seoul"`, tracking 필드는 쓰지 않음).
형식·필드 규칙은 `sososo-publish` 스킬과 동일하다.

```bash
npm run validate:news -- tmp/news.json
npm run upload:news -- tmp/news.json
rm -f tmp/news.json
```
서버가 canonical URL로 dedup 머지하므로, 같은 글의 표시 필드만 갱신된다 (중복 카드 없음,
`firstSeenAt` 보존, `seenCount` 증가). 검증 실패 시 1회 재수정 후에도 실패면 중단.

### 5단계 — 보고
```
✓ refined & republished: id=<id>
  바뀐 곳: <요약 (문장 n곳, 단어 m곳)>
또는
✓ reviewed: 변경 없음 (이미 자연스러움)
또는
✗ aborted: <사유>
```

---

## 원칙

- **분리 검토**: 리뷰는 반드시 별도 서브에이전트에서. 같은 컨텍스트에서 자기 글을 자가승인하지 않는다.
- **사실 보존**: 인명·지명·수치·날짜·기관명·법률용어는 그대로. 새 내용 창작 금지.
- **과교정 금지**: 이미 자연스러운 문장은 두라. 바꾼 곳은 이유를 댄다.
- 경어체·문단·길이·태그·줄표 금지 등 소소.소 공통 규칙은 `references/review-criteria.md` 참조.
