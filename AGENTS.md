# JAMEON BAGEL ERP — Project Rules (AGENTS.md)

## 1. 프로젝트 개요 및 배포 환경
- **목적:** 개인·취미용 베이킹 배합, 원가, 구움틀 변환 관리 웹앱 (잠언베이글 ERP)
- **개발 및 배포 파이프라인:** Antigravity 리모트 프로젝트 ➔ GitHub (`main` 브랜치 푸시) ➔ Vercel 및 Cloudflare Pages 자동 배포
- **빌드 설정:**
  - Framework: `Vite` (React + TypeScript)
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - `vite-plugin-singlefile`을 적용해 `dist/index.html` 단일 파일로 빌드 가능하도록 유지
  - Cloudflare Pages SPA 리다이렉트(`public/_redirects`) 및 보안 헤더(`public/_headers`) 적용

## 2. 기술 스택 및 번들 최적화 규칙
- **코어:** React 18, Vite, TypeScript, `vite-plugin-singlefile`, `lucide-react`
- **외부 대용량 라이브러리 처리:**
  - `tesseract.js` (손글씨·이미지 OCR), `xlsx` (엑셀 파싱), `html2canvas` (작업지시서 PNG 저장)는 단일 HTML 번들 비대화를 막기 위해 `index.html`의 CDN 스크립트 유지 또는 동적 `import()`로 분리
- **폴더 구조:**
  - `src/types/erp.ts` : Recipe, Ingredient, Pan, UiToggles 타입 정의
  - `src/api/sheetsApi.ts` : GAS API 통신 및 `localStorage` 캐싱
  - `src/utils/calc.ts` : 베이커스(%), 원가·마진율, 구움틀 용적(ml) 및 비중(g/ml) 계산
  - `src/utils/parser.ts` : 텍스트·소제목·엑셀·OCR 파싱 로직
  - `src/components/` : 기능별 모듈 컴포넌트 분리 (레시피 목록/상세, 구움틀 변환기, 재료 DB, 구움틀 DB, 모달)

## 3. Google Sheets (GAS) 백엔드 연동 규칙
- **환경 변수:** `.env` 및 Vercel 환경 변수 `VITE_GAS_WEBAPP_URL`로 GAS 웹앱 URL 관리 (코드 내 하드코딩 금지)
- **CORS 회피 규칙:** GAS `doPost` 호출 시 반드시 `headers: { "Content-Type": "text/plain" }`과 `mode: "no-cors"` 패턴 유지
- **동기화 UX:** 초기 로딩 시 `localStorage` 캐시를 먼저 렌더링한 뒤 GAS `doGet?mode=api` 응답으로 최신화
- **GAS 백엔드 호환성:** 기존 `Code_gs_잠언베이글_v14.js`의 액션(`saveRecipe`, `deleteRecipe`, `saveIngredient`, `deleteIngredient`, `savePan`, `deletePan`)과 데이터 스키마 유지

## 4. 디자인 시스템 (아티장 베이커리 작업지시서 스타일)
- **AI 템플릿 스타일 금지:** 과한 그림자, 둥근 SaaS 카드 남발, 장식용 이모지 사용 금지 (아이콘 필요 시 `lucide-react`만 절제해서 사용)
- **컬러 팔레트:**
  - 배경(Warm Paper): `#F6F3EE` / 표면(Paper): `#FFFFFF` / 보조 표면: `#FAF8F5`
  - 잉크 텍스트: `#1C1B18` (기본), `#5C5852` (보조), `#969087` (약함)
  - 구분선(Hairline): `#E2DDD5` (`1px`)
  - 메인 브랜드(Deep Forest Green): `#174328` / 틴트: `#EDF2EE`
  - 강조(Crust Terracotta): `#A85232` / 틴트: `#FAF0EC`
- **타이포그래피:** `Pretendard` 기반, 모든 중량·원가·비율 숫자 영역에 `font-variant-numeric: tabular-nums` 필수 적용
- **복잡도 제어 (토글·체크 숨김 원칙):**
  - 레시피 상세: `표시 항목` 체크박스(`원가·마진`, `구움틀·비중 변환기`, `제조 공정`)로 화면 구성 제어, 구움틀·비중 변환기는 기본 접힘(아코디언) 유지
  - 등록/수정 모달: `구움틀·반죽 비중 설정`과 `사진·오븐 온도/시간·주의사항`은 접이식 아코디언으로 기본 숨김 (기존 데이터가 있을 때만 자동 펼침)

## 5. 필수 보존 기능 명세 (v14 기준)
1. **레시피 관리:**
   - 재료 내 **소제목 분리** (`[소제목: 소보로]`, `[소제목: 빵 반죽]` 등) 및 **재료/소제목 위·아래 순서 변경 (`▲`/`▼`)**
   - 재료명·포장재 실시간 검색 드롭다운 및 **키보드 방향키(`↑`/`↓`) + `Enter` 선택**
   - 기준 수량·특정 재료 중량 변경 시 전체 배합량 및 원가·마진율 실시간 스케일링
   - 작업지시서 PNG 이미지 내보내기 (`html2canvas`)
2. **구움틀 DB & 비중 변환기:**
   - 원형(`지름×높이`)·사각(`가로×세로×높이`) 치수 입력 시 용적(`ml`) 자동 계산 및 권장 충전율(%) 관리
   - 기존 틀 ➔ 변경 틀(예: 1호틀 ➔ 2호틀) 부피비 자동 중량 조정 및 변환값 복제 저장
   - 반죽 비중(`g/ml`) 빠른 선택 칩(제누와즈 0.48, 발효빵 0.60, 파운드 0.80, 휘낭시에 0.90, 치즈/무스 1.00) 및 `용적 × 충전율 × 비중` 기반 목표 반죽량 자동 맞춤
3. **간편 등록 (텍스트 · 손글씨 사진 · 엑셀):**
   - 텍스트 붙여넣기 실시간 파싱 (소제목, 수량, 판매가, 재료, 공정 분리 및 재료 DB 단가 자동 매칭)
   - 손글씨·레시피 사진 업로드 시 `tesseract.js` (`kor+eng`) OCR 텍스트 추출
   - 엑셀(`.xlsx`, `.xls`, `.csv`) 시트 선택 등록 및 다중 시트 일괄 등록
4. **모바일 반응형 DB 및 업데이트일:**
   - 레시피 목록, 재료 DB, 구움틀 DB 모두 **`카드형 | 목록형` 전환** 지원 (모바일 기본값 `카드형`, 사용자 선택 상태 `localStorage` 저장)
   - 재료 DB 및 구움틀 DB 저장 시 **`YYYY.MM.DD`** 형식(예: `2026.11.10`)의 업데이트일 자동 기록 및 표기

## 6. 작업 완료 및 검증 규칙
- 코드 수정 후 반드시 `npm run build`를 실행해 TypeScript 타입 오류 및 Vite 빌드 오류가 없는지 확인
- 변경 사항이 검증된 후에만 `git commit` 및 `git push` 진행 (Vercel 자동 배포 트리거)
