# Routine: refresh-sososo

이 문서는 매일 아침 1회 Claude routine 이 실행할 정확한 절차다. routine 프롬프트(`claude.ai` 등록분)는 다음 한 줄이다:

> 저장소의 `.claude/routines/refresh-sososo.md` 를 읽고 정확히 그 스펙대로 수행하세요.

routine 은 이 문서를 매번 읽고 아래 단계를 순서대로 수행한다. 한 단계라도 실패하면 업로드를 하지 않고 종료한다 (사이트는 직전에 업로드된 `news.json` 을 계속 서빙).

소소.소(= 소소한 소식)는 **기분 좋고 따뜻한, 사람의 온기가 느껴지는 뉴스**만 모으는 아카이브다. 핵심은 세 가지다:
1. **따뜻한 뉴스만** 고른다 (정치·갈등·사건사고·부정 기사 배제).
2. **국내(한국에서 일어난) 소식만** 고른다. 화이트리스트는 한국 언론사를 거를 뿐, 한국 언론사도 해외 소식을 보도한다 — 사건의 무대가 해외인 소식은 배제한다.
3. 기사를 그대로 옮기지 않고 **전문적이되 따뜻한 시선으로 다시 쓴다**. 원문은 반드시 링크로 출처를 밝힌다.

## 데이터 모델 (중요)

S3 의 `news.json` 은 **누적(accumulated) 스토어**다 — 매일 덮어쓰지 않고 **머지(merge)** 된다.

- routine 은 **오늘의 배치(today's batch)** 만 만든다. 최대 12건. tracking 필드(`firstSeenAt`/`lastSeenAt`/`seenCount`)는 **쓰지 않는다 — 서버가 채운다**.
- Vercel 의 `POST /api/upload` 가: 기존 누적본 GET → 들어온 배치와 canonical URL 기준 dedup 머지 → 300건으로 트림 → PUT → 관련 경로 revalidate.
- routine 출력 스키마는 `IncomingNewsSchema` (`src/lib/validations/news.ts`). flat `items[]` 구조다.

---

## 0. 사전 조건 (routine 등록 시 1회 셋업)

업로드는 **Vercel 에 배포된 `POST /api/upload`** 가 대행한다. AWS 자격증명은 Vercel 시크릿에만 존재하며, routine 은 토큰으로 인증된 HTTP POST 만 보낸다.

- routine 환경에 sososo 레포가 클론되어 있고 **CWD 가 레포 루트**. `npm ci` 선실행.
- **claude.ai routine "Environment variables"** 에 다음을 설정:
  - `UPLOAD_URL` = 예: `https://sososo.example.com/api/upload`
  - `UPLOAD_TOKEN` = Vercel 시크릿과 동일 값 (`openssl rand -hex 32`)
- Vercel 시크릿 (사용자 사전 셋업, routine 미관여): `UPLOAD_TOKEN`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`, `S3_KEY`.
- 사용 도구: WebSearch, WebFetch, Bash, Read, Write, Grep.

---

## 1. 워크스페이스 동기화

```bash
git status --porcelain
```
- 출력이 비어있지 않으면 즉시 중단. 사유: "uncommitted changes in workspace".

```bash
git checkout main
git pull --rebase origin main
```
화이트리스트·태그·스키마를 최신으로 가져오기 위함. **routine 은 git 에 커밋·푸시하지 않는다.**

## 2. 화이트리스트 · 태그 로드

- `src/lib/news/whitelist.ts` → `domain → displayName` 매핑.
- `src/lib/news/tags.ts` → `WARM_TAGS` 목록(`나눔`,`선행`,`이웃`,`공동체`,`자원봉사`,`환경`,`동물`,`회복`,`극복`,`청년`,`교육`,`의료`,`가족`,`반려`,`지역`,`문화`). **태그는 이 목록에서만** 부여한다.

---

## 3. 후보 수집 (최근 48시간, KST)

KST 기준 "지금 - 48시간" ~ "지금" 사이에 보도된 한국 언론사의 **국내 소식** 기사를 모은다. 사건의 무대가 해외인 기사는 후보에서 제외한다. 경계는 포함적(`publishedAt >= now-48h`). 후보 목표 ≥ 20건(필터·랭킹 후 12건 선정용 여유분).

**세 축으로 교차 수집한다:**

### 3-A. 토픽 축 (따뜻한 키워드)
`선행`, `기부`, `나눔`, `미담`, `훈훈`, `감동`, `따뜻한 사연`, `봉사`, `자원봉사`, `후원`, `장학금`, `익명 기부`, `의인`, `구조`, `유기동물 입양`, `환경 정화`, `완치`, `재기`, `극복`, `희망`, `이웃 사랑`, `따뜻한 뉴스`, `착한 뉴스`.

### 3-B. 매체 축 (화이트리스트 도메인 직접 스윕)
- `site:joongang.co.kr 착한뉴스`, `site:yna.co.kr 미담`, `site:kbs.co.kr 훈훈`, `site:news1.kr 선행`, `site:donga.com 기부` 등 — 각 매체의 따뜻한 코너를 훑는다.

### 3-C. 톤 레퍼런스 축 (중앙일보 착한 뉴스 시리즈)
- `https://www.joongang.co.kr/series/11152` 를 WebFetch 해 최근 게재 항목 중 48h 이내 기사를 후보화한다. 이 시리즈가 소소.소가 추구하는 톤의 기준이다.

---

## 4. 워밍 필터 (따뜻함 게이트 — 필수)

각 후보에 대해 자문한다: **"이 소식을 읽고 나면 마음이 따뜻해지는가?"**

- 통과: 나눔·선행·구조·회복·연대·작은 영웅·미담·따뜻한 일상.
- 배제: 정치·선거·외교 갈등, 사건사고·범죄·재난(피해 중심), 경제 위기·실적, 단순 정책/행정, 부정·논란·비판 기사, 자극적·낚시성, **해외에서 일어난 일(소소.소는 국내 소식만 다룬다)**.
- 애매하면 배제한다. 소소.소의 신뢰는 "여기 오면 늘 따뜻하다"에서 온다.

## 5. 도메인·지역 필터
- **도메인**: 각 후보 URL host 추출 → `host.endsWith(domain)` 이 참인 화이트리스트 도메인만 통과. 나머지 폐기.
- **지역(국내 한정)**: 사건이 일어난 무대가 국내(한국)인 소식만 통과. 한국 언론사가 보도했더라도 해외에서 일어난 일은 폐기한다. 재외동포·해외 한인처럼 애매한 경우는 "국내 독자에게 우리 이웃의 이야기로 와닿는가"로 판단한다.

## 6. 중복 제거
- 동일 사건은 1건만 유지. 동일 판단: 제목 핵심 명사·고유명사·수치 ≥3 일치 또는 명백히 같은 사건.
- 우선순위: ① 최초 보도(publishedAt 빠른 쪽) ② 통신사(연합/뉴스1/뉴시스) ③ 본문 충실한 쪽.

## 7. 랭킹 (최대 12건)
- 가중 기준: **온기**(마음이 움직이는 정도), **공감**(누구나 공감할 보편성), **파급**(나눔·선행이 이어질 여지), **다양성**(한 태그가 전체의 절반을 넘지 않도록).
- 편집 순서대로 배열에 담는다 — 첫 항목이 오늘의 대표(히어로) 기사다.
- **중단 조건**: 통과 기사가 **0건**이면 (스키마 `min(1)` 위반) 업로드 없이 종료. 사유: `"no warm stories in window"`. (48h 내 정말 없을 수 있으나, 보통은 검색 부족이므로 3축을 한 번 더 확장한다.)

---

## 8. 본문 가져와 재작성 + og:image 추출

각 항목에 대해 `WebFetch <url>` 로 본문을 가져온 뒤 **다시 쓴다.**

### 8-1. 재작성 규칙 (소소.소의 핵심)
- **톤**: 전문적이고 단정하되 **따뜻한 시선**. 차분한 신문 기사체에 온기를 더한다. 과한 감탄·이모지·구어체 금지.
- **사실 코어 보존**: 누가·무엇을·언제·어디서 등 사실은 원문과 일치해야 한다. **창작·과장·추측 금지** (본문에 없는 내용을 지어내지 않는다).
- **그대로 복사 금지**: 원문 문장을 그대로 옮기지 않는다. 반드시 **재구성·재표현(paraphrase)** 한다. 직접 인용이 꼭 필요하면 한 문장 이내로 최소화하고 따옴표로 표시.
- **출처 명시**: 본문은 우리가 다시 쓴 글이고, 원문 링크(`url`)로 출처를 밝힌다 (UI 가 자동으로 출처 블록을 렌더).
- 각 항목 필드:
  - `title`: 따뜻하게 다듬은 제목. 낚시성 금지. **≤ 120자.**
  - `dek`: 카드/리드용 한두 문장 요약. **≤ 180자.**
  - `body`: 다시 쓴 본문. **200~1500자.** 문단형(줄바꿈 없이 이어 써도 무방), 마크다운·이모지 금지, 줄바꿈 토큰 금지.
  - `tags`: `WARM_TAGS` 중 **1~4개** (해당 소식의 결을 가장 잘 나타내는 것).
- `publishedAt`: 본문 메타에서 추출 → ISO8601 UTC.
- `id`: `sha1(url)` 앞 8자.

### 8-2. og:image 추출
기사 HTML `<head>` 에서 우선순위 순으로 첫 매치를 `imageUrl` 로 채택:
1. `og:image` → 2. `og:image:url` → 3. `twitter:image`
- **반드시 `https://`**. `http://`·프로토콜 상대(`//...`)는 폐기.
- 경로만 있는 상대 URL 은 기사 origin 으로 절대화.
- 추출 실패·부재 시 `imageUrl` **필드 자체를 생략**(null·빈문자열 금지). UI 가 텍스트 카드로 렌더.

---

## 9. JSON 빌드

`IncomingNewsSchema` 형식으로 직렬화:

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
      "source": "중앙일보",
      "sourceDomain": "joongang.co.kr",
      "publishedAt": "...",
      "imageUrl": "https://..."   // 선택
    }
  ]
}
```
- `items` 길이 **1 ≤ n ≤ 12**, 편집 순위 순서.
- `url`·`imageUrl` 은 https 필수, `sourceDomain` 은 화이트리스트 도메인.
- tracking 필드는 쓰지 않는다 (서버가 채움).
- 들여쓰기 2칸, UTF-8, LF, 마지막 newline 1개.

## 10. 스테이징 파일

```bash
mkdir -p tmp
# Write 도구로 tmp/news.json 에 위 페이로드 저장
```
`src/data/news.seed.json` 은 **건드리지 않는다** (시드/폴백용, S3 가 단일 진실 원본).

## 11. 스키마 검증

```bash
npm run validate:news -- tmp/news.json
```
- 실패 시 `path / message` 분석해 8~10 단계를 1회 재수행. 재시도 후에도 실패면 `rm -f tmp/news.json` 후 종료. 사유: `"schema validation failed after retry"`.

## 12. 업로드 (Vercel 프록시 경유 — 서버에서 머지)

```bash
npm run upload:news -- tmp/news.json
```
`scripts/upload-news-json.ts` 가 로컬 사전검증 후 `POST $UPLOAD_URL` (`Authorization: Bearer $UPLOAD_TOKEN`). Vercel 라우트가 토큰검증 → `IncomingNewsSchema` 검증 → S3 기존본 머지(canonical URL dedup, `seenCount++`, `firstSeenAt` 보존) → `StoredNewsSchema` 재검증 → PUT → `/`·`/today.json`·관련 `/tags/*` revalidate.

업로드 성공 후:
```bash
rm -f tmp/news.json
```

- Vercel 재배포 없음(소스 무변경). ISR revalidate 로 즉시 반영.

---

## 출력 요약 (종료 시 보고)

```
✓ uploaded news.json: items=<n>, top="<첫 기사 제목>", tags=[<등장 태그>]
```
또는 실패 시:
```
✗ aborted: <사유>
```
