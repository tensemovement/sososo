---
name: sososo-publish
description: >-
  소소.소(소소한 소식, sososo) 따뜻한 뉴스 아카이브에 기사를 재작성해 발행한다. 화이트리스트
  한국 언론사 기사 URL을 하나 이상 받아, 각 본문을 가져와 '전문적이되 따뜻한' 톤으로 다시 쓰고
  (제목·요약·본문·태그), og:image를 뽑아, IncomingNewsSchema JSON으로 만들어 검증한 뒤
  배포된 /api/upload 로 업로드한다 (서버가 S3 누적 피드에 머지). 사용자가 기사 URL을 주며
  "소소소에 올려줘 / 소소.소에 발행 / 따뜻한 뉴스로 만들어 업로드 / 이 기사 재작성해서 올려줘 /
  sososo publish / 이 뉴스 사이트에 추가" 같은 요청을 하면 반드시 이 스킬을 사용한다.
  refresh-sososo 일일 routine의 수집(3~7단계)을 제외한 '작성→검증→업로드'(8~12단계)
  부분을, 이미 고른 URL에 대해 수동으로 실행하는 도구다. 수집·검색이 필요한 자동 일일
  갱신에는 .claude/routines/refresh-sososo.md 를 따른다.
---

# sososo-publish — 기사를 따뜻한 뉴스로 재작성해 발행

소소.소(= 소소한 소식)는 **기분 좋고 따뜻한, 사람의 온기가 느껴지는 뉴스만** 모으는 아카이브다.
이 스킬은 **이미 고른 기사 URL**(화이트리스트 한국 언론사)을 받아, 각 기사를 소소.소의
편집 톤으로 **다시 써서** 배포된 사이트에 발행한다. 핵심 원칙 두 가지:

1. **따뜻한 뉴스만** 올린다 (정치·갈등·사건사고·부정 기사는 거른다).
2. 원문을 그대로 옮기지 않고 **전문적이되 따뜻한 시선으로 다시 쓴다.** 원문은 `url` 링크로 출처를 밝힌다.

> 이 스킬은 사용자가 URL을 직접 고른다는 점만 다르고, 재작성·검증·업로드 규칙은
> `.claude/routines/refresh-sososo.md` 의 8~12단계와 동일하다. 수집/검색까지 자동으로
> 하려면 이 스킬이 아니라 그 routine을 따른다.

## 동작 범위

사용자 결정에 따라 **끝까지 완전 자동**으로 수행한다: 재작성 → `tmp/news.json` 생성 →
스키마 검증 → 업로드 → 정리 → 보고. 업로드는 S3 누적 피드에 실제 반영되는 **비가역적
외부 작업**이므로, 도중 어느 단계라도 실패하면 **업로드하지 않고 중단**한다.
(사이트는 직전 업로드본을 계속 서빙하므로 중단해도 안전하다.)

---

## 사전 조건 (시작 전 확인 — 실패하면 즉시 중단)

작업을 다 해놓고 마지막에 업로드가 막히는 일을 피하기 위해 **맨 먼저** 확인한다.

1. **CWD가 sososo 레포 루트**여야 한다. `package.json` 의 `name` 이 `sososo` 인지 확인:
   ```bash
   test -f package.json && grep -q '"name": "sososo"' package.json && echo OK_REPO
   ```
   아니면 중단. 사유: `"not in the sososo repo root"`.

2. **업로드 자격증명**이 있어야 한다. `scripts/upload-news-json.ts` 는 `.env.local` 또는
   환경변수에서 `UPLOAD_URL` 과 `UPLOAD_TOKEN` 을 읽는다. 둘 중 하나라도 없으면 재작성에
   들어가기 전에 중단하고, 사용자에게 `.env.local` 에 두 값을 넣어 달라고 안내한다.
   ```bash
   { [ -f .env.local ] && grep -q '^UPLOAD_URL=' .env.local && grep -q '^UPLOAD_TOKEN=' .env.local; } \
     || { [ -n "$UPLOAD_URL" ] && [ -n "$UPLOAD_TOKEN" ]; } \
     && echo OK_ENV || echo MISSING_ENV
   ```
   사유: `"UPLOAD_URL/UPLOAD_TOKEN not set"`.

3. **권위 있는 화이트리스트·태그를 읽는다** (하드코딩 금지 — 목록이 바뀔 수 있다):
   - `src/lib/news/whitelist.ts` → `domain → displayName` 매핑. 매칭은 서브도메인 허용
     (`news.kbs.co.kr` → `kbs.co.kr`). **단, 스키마는 `sourceDomain` 에 베이스 도메인**
     (`khan.co.kr`)을 요구한다.
   - `src/lib/news/tags.ts` → `WARM_TAGS`. **태그는 이 목록에서만** 부여한다.
   (현재 스냅샷은 이 문서 맨 아래 "참고" 에 있으나, 항상 파일을 한 번 읽어 최신을 쓴다.)

사용 도구: WebFetch, Bash, Read, Write, Grep.

---

## 입력

화이트리스트 한국 언론사 기사 **URL 1개 이상**. 사용자가 URL만 주면 그걸로 충분하다.
URL이 없으면 어떤 기사를 발행할지 물어본다 — 이 스킬은 기사를 **검색·수집하지 않는다**
(그건 routine의 역할).

한 번에 올릴 수 있는 항목은 **최대 12개**(`INCOMING_CAP`). 더 많으면 12개로 줄이고 알린다.

---

## 절차

### 1단계 — 사전 조건 확인
위 "사전 조건" 1~3을 수행한다. 하나라도 실패하면 중단.

### 2단계 — 각 URL 처리 (fetch → 게이트 → 재작성 → 이미지)

URL마다 다음을 한다.

**(a) 도메인 게이트.** URL host를 화이트리스트와 대조(서브도메인 허용)한다. 매칭 안 되면
그 URL은 **건너뛰고** 사용자에게 알린다 (스키마 `sourceDomain` 검증에서 어차피 막힌다).
매칭되면 `sourceDomain = entry.domain`(베이스), `source = entry.displayName` 으로 정한다.

**(b) 본문 가져오기.** `WebFetch <url>` 로 기사 본문과 메타(`<head>`)를 가져온다.

**(c) 따뜻함 게이트.** "이 소식을 읽고 나면 마음이 따뜻해지는가?" 를 자문한다.
- 통과: 나눔·선행·구조·회복·연대·작은 영웅·미담·따뜻한 일상. 더해서 **정의·인권·시민 연대가
  실현되어 '사회가 바르게 작동하고 있다'는 안도와 희망을 주는 소식**도 따뜻함에 포함한다.
  어려운·민감한 주제라도 **갈등 그 자체가 아니라 회복·용기·정의 실현에 초점**이 있으면 통과할 수 있다.
- 배제: **갈등·대립·피해 그 자체가 중심인** 기사 — 정치 정쟁·선거 공방, 사건사고·범죄·재난(피해 중심),
  경제 위기·실적, 단순 정책/행정, 비방·논란 부추기기, 자극적·낚시성.
- **국내 한정**: 소소.소는 **국내(한국에서 일어난) 소식만** 다룬다. 화이트리스트는 한국 언론사를 거를 뿐이라,
  한국 언론사가 보도한 **해외 발생 소식**은 따뜻하더라도 건너뛴다. 재외동포·해외 한인처럼 애매하면 편집장에게 확인한다.
- 사용자가 직접 고른 URL이라도 결이 맞는지 본다. **명백히 따뜻하지 않으면 건너뛰고** 이유를 알린다.
  단, **애매하거나 민감·정치적으로 읽힐 수 있는 주제는 임의로 폐기하지 말고 사용자(편집장)에게 확인한다** —
  무엇을 '따뜻함'으로 볼지의 최종 판단은 편집장의 몫이다. 소소.소의 신뢰는 "여기 오면 마음이 따뜻해진다"에서 온다.

**(d) 재작성.** 아래 "재작성 규칙" 에 따라 `title`/`dek`/`body`/`tags` 를 만든다.
`publishedAt` 은 기사 메타에서 뽑아 **ISO8601 UTC**(`Z`)로 변환한다.

**(e) `id` 생성.** 저장할 `url` 문자열의 sha1 앞 8자:
```bash
printf '%s' '<url>' | shasum -a 1 | cut -c1-8
```
(dedup은 서버가 canonical URL로 하므로 id는 단순 식별자다. 같은 기사를 다시 올리면
서버가 `seenCount` 만 올리고 `firstSeenAt` 을 보존한다 — 중복 카드가 생기지 않는다.)

**(f) og:image 추출.** 기사 `<head>` 에서 우선순위대로 첫 매치를 `imageUrl` 로 채택:
`og:image` → `og:image:url` → `twitter:image`.
- **반드시 `https://`.** `http://`·프로토콜 상대(`//...`)는 버린다.
- 경로만 있는 상대 URL은 기사 origin으로 절대화.
- 못 찾으면 **`imageUrl` 필드 자체를 생략**한다 (`null`·빈 문자열 금지). UI가 텍스트 카드로 렌더.

### 3단계 — JSON 빌드
통과한 항목들을 `IncomingNewsSchema` 형태로 직렬화한다 (필드 표는 "참고" 참조):
```json
{
  "generatedAt": "<현재 시각 ISO8601 UTC>",
  "timezone": "Asia/Seoul",
  "items": [
    {
      "id": "...",
      "title": "...",
      "dek": "...",
      "body": "...",
      "tags": ["나눔", "교육"],
      "url": "https://...",
      "source": "경향신문",
      "sourceDomain": "khan.co.kr",
      "publishedAt": "2026-06-01T08:35:00.000Z",
      "imageUrl": "https://..."
    }
  ]
}
```
- `items` 길이는 **1 ≤ n ≤ 12**, 사용자가 준 순서(또는 편집상 중요도 순). 첫 항목이 히어로.
- `generatedAt` 은 지금 시각. UTC `Z` 표기로 만든다: `date -u +%Y-%m-%dT%H:%M:%S.000Z`.
- tracking 필드(`firstSeenAt`/`lastSeenAt`/`seenCount`)는 **쓰지 않는다** — 서버가 채운다.
- `url`·`imageUrl` https 필수. `timezone` 은 정확히 `"Asia/Seoul"`.
- 들여쓰기 2칸, UTF-8, LF, 마지막 newline 1개.

### 4단계 — 스테이징 파일 쓰기
```bash
mkdir -p tmp
```
Write 도구로 `tmp/news.json` 에 저장한다. **`src/data/news.seed.json` 은 절대 건드리지 않는다**
(시드/폴백용이고, S3가 단일 진실 원본이다).

### 5단계 — 스키마 검증 (업로드 게이트)
```bash
npm run validate:news -- tmp/news.json
```
- 성공: `✓ ... matches IncomingNewsSchema (items=N)`.
- 실패: 출력의 `경로: 메시지` 를 보고 2~4단계를 **1회 재수정**한다 (흔한 원인: body가 200자
  미만/1500자 초과, title>120, dek>180, 태그가 WARM_TAGS 밖, sourceDomain이 베이스 도메인
  아님, http URL). 재시도 후에도 실패하면 `rm -f tmp/news.json` 하고 중단.
  사유: `"schema validation failed after retry"`.

### 6단계 — 업로드
```bash
npm run upload:news -- tmp/news.json
```
`scripts/upload-news-json.ts` 가 로컬 재검증 후 `POST $UPLOAD_URL`(`Authorization: Bearer
$UPLOAD_TOKEN`). 서버가 토큰검증 → 스키마검증 → S3 기존본과 머지(canonical URL dedup,
`seenCount++`, `firstSeenAt` 보존) → 300건 트림 → PUT → `/`·`/today.json`·관련 `/tags/*`
revalidate. 성공 출력은 `✓ <서버 응답>`.
- 비-2xx 또는 에러면 중단(파일은 남겨 디버깅에 쓴다). 사유에 서버 응답을 포함한다.

### 7단계 — 정리 & 보고
업로드 성공 후에만:
```bash
rm -f tmp/news.json
```
그리고 요약을 보고한다 (재작성한 제목들이 한눈에 보이도록):
```
✓ published: items=<n>
  1. "<title>"  [<tags>]  — <source>
  2. ...
  skipped: <건너뛴 URL과 사유, 있으면>
```
실패 시:
```
✗ aborted: <사유>
```

---

## 재작성 규칙 (소소.소의 핵심)

원문을 요약·번역하는 게 아니라, 사실을 보존한 채 **우리 글로 다시 쓰는** 것이다.

- **톤**: 전문적이고 단정하되 **따뜻한 시선**. 차분한 신문 기사체에 온기를 더한다.
  **글은 경어체(~합니다/~입니다)로 작성한다.** 과한 감탄·이모지·구어체는 쓰지 않는다.
- **AI 티 자제**: 부연설명을 줄표(`—`)로 끼워 넣는 등 'AI가 쓴 것 같은' 표현을 쓰지 않는다.
  부연이 필요하면 문장을 나누거나 쉼표·괄호로 자연스럽게 처리한다.
- **사실 코어 보존**: 누가·무엇을·언제·어디서 등 사실은 원문과 일치해야 한다.
  **창작·과장·추측 금지** — 본문에 없는 내용을 지어내지 않는다. 수치·고유명사는 원문대로.
- **그대로 복사 금지**: 원문 문장을 그대로 옮기지 않는다. 반드시 **재구성·재표현(paraphrase)**.
  직접 인용이 꼭 필요하면 한 문장 이내로 최소화하고 따옴표로 표시한다.
- **출처 명시**: 본문은 우리가 다시 쓴 글이고, 출처는 `url` 링크로 밝힌다 (UI가 출처 블록을 자동 렌더).
  본문 안에 "기사에 따르면" 같은 메타 서술이나 매체명을 직접 넣지 않는다.

### 필드별 작성
- `title`: 따뜻하게 다듬은 제목. 낚시성 금지. **≤ 120자.** 원문 제목을 그대로 쓰지 않는다.
- `dek`: 카드·리드용 한두 문장 요약. **≤ 180자.** 본문의 정서를 압축한다.
- `body`: 다시 쓴 본문. **200~1500자(필수 구간).** **읽기 좋게 2~4개 문단으로 나눈다 —
  문단 사이는 빈 줄(`\n\n`)로 구분한다** (상세 페이지가 `\n{2,}` 기준으로 문단을 분리해 렌더한다).
  도입 → 전개 → 마무리(온기/의미)처럼 자연스러운 흐름으로 끊는다. 한 문단이 너무 길지 않게.
  **마크다운·이모지 금지.** 리터럴 `\n` 글자를 본문에 적지 말고 실제 줄바꿈을 쓴다.
- `tags`: `WARM_TAGS` 중 **1~4개.** 그 소식의 결을 가장 잘 나타내는 것만. 억지로 4개 채우지 않는다.
- **추상 뭉뚱그림 금지**: `자리`·`과정`·`행보` 같은 흐릿한 추상명사로 제목을 뭉뚱그리지 말고
  무엇을 되찾았는지·무슨 일이 있었는지 손에 잡히게 쓴다 (예: "다시 세워준 자리" → "손을 들어주다").
- **표현 중복(echo) 금지**: 인상적인 표현·관용구는 제목·dek·본문을 통틀어 **한 번만** 쓴다.
  같은 구절이 두세 곳에 겹치면 어색하니, 한 곳만 남기고 나머지는 다르게 푼다.

---

## 중단(abort) 규칙 요약

다음 중 하나면 **업로드 없이** 중단하고 사유를 보고한다:
- 레포 루트가 아님 / `UPLOAD_URL`·`UPLOAD_TOKEN` 없음.
- 따뜻함·도메인 게이트를 통과한 항목이 **0개** (스키마 `min(1)` 위반).
  사유: `"no publishable warm stories"`.
- 스키마 검증이 1회 재수정 후에도 실패.
- 업로드가 비-2xx로 응답.

---

## 참고

### IncomingNewsSchema 필드 (`src/lib/validations/news.ts`)

| 필드 | 타입/제약 | 비고 |
|------|-----------|------|
| `id` | string, ≥1 | `sha1(url)` 앞 8자 |
| `title` | string, 1–120 | 따뜻한 재작성 제목 |
| `dek` | string, 1–180 | 카드/리드 요약 |
| `body` | string, **200–1500** | 재작성 본문 (요약 아님) |
| `tags` | enum[] of WARM_TAGS, **1–4** | 통제 어휘만 |
| `url` | https URL | 출처 링크 |
| `source` | string, 1–40 | 매체 표시명 (예: 경향신문) |
| `sourceDomain` | 화이트리스트 베이스 도메인 | 예: khan.co.kr |
| `publishedAt` | ISO8601 datetime | 원문 발행 시각 (UTC) |
| `imageUrl` | https URL, optional | 없으면 필드 생략 |
| `generatedAt` (배치) | ISO8601 datetime | 지금 시각 |
| `timezone` (배치) | `"Asia/Seoul"` 고정 | |

tracking 필드(`firstSeenAt`/`lastSeenAt`/`seenCount`)는 incoming에 쓰지 않는다 — 서버가 채운다.
배치 `items` 는 1~12개.

### WARM_TAGS (현재 스냅샷 — 실행 시 `src/lib/news/tags.ts` 로 확인)
`나눔` `선행` `이웃` `공동체` `자원봉사` `환경` `동물` `회복` `극복` `청년` `교육` `의료` `가족` `반려` `지역` `문화`

### 화이트리스트 (현재 스냅샷 — 실행 시 `src/lib/news/whitelist.ts` 로 확인)
yna.co.kr(연합뉴스), kbs.co.kr(KBS), sbs.co.kr(SBS), imbc.com(MBC), chosun.com(조선일보),
joongang.co.kr(중앙일보), donga.com(동아일보), hani.co.kr(한겨레), khan.co.kr(경향신문),
hankyung.com(한국경제), mk.co.kr(매일경제), sedaily.com(서울경제), edaily.co.kr(이데일리),
mt.co.kr(머니투데이), ohmynews.com(오마이뉴스), pressian.com(프레시안), ytn.co.kr(YTN),
news1.kr(뉴스1), newsis.com(뉴시스), hankookilbo.com(한국일보)
