# JAMEON BAGEL ERP (잠언베이글 베이킹 ERP)

개인 및 아티장 베이커리를 위한 베이킹 배합(Bakers %), 원가·마진율, 구움틀 용적 및 반죽 비중 변환, 작업지시서 관리 웹 애플리케이션입니다.

## 🥯 주요 기능

1. **레시피 및 배합 관리**
   - 소제목(`[소제목: 소보로]`, `[소제목: 본반죽]` 등) 분리 및 재료 순서 변경 (`▲` / `▼`)
   - 재료명 키보드 방향키(`↑`/`↓` + `Enter`) 자동완성 및 DB 단가 자동 매칭
   - 생산 수량 변경 및 특정 재료 중량 직접 변경 시 실시간 전체 배합량 스케일링
   - 가루류 기준 베이커스 퍼센트(Bakers %) 자동 계산 (`tabular-nums`)
   - 재료비, 포장비, 1개당 제조원가, 판매가 및 마진율 실시간 산출
   - 작업지시서 고해상도 PNG 이미지 내보내기 (`html2canvas`)

2. **구움틀 DB & 반죽 비중(Specific Gravity) 변환기**
   - 원형(`지름×높이`) / 사각(`가로×세로×높이`) 치수 입력 시 용적(`ml`) 자동 계산
   - 기준 구움틀 ➔ 대상 구움틀 용적비 자동 배율 계산 및 새 레시피 복제 저장
   - 반죽 비중 빠른 선택 칩 (제누와즈 0.48, 발효빵 0.60, 파운드 0.80, 휘낭시에 0.90, 치즈/무스 1.00)
   - `용적 × 충전율(%) × 비중` 기반 목표 반죽량 자동 산출

3. **간편 등록 3종 (텍스트 · 손글씨 사진 OCR · 엑셀)**
   - 텍스트 붙여넣기: 메모장, 카카오톡 텍스트의 소제목, 수량, 판매가, 재료, 공정 자동 파싱
   - 손글씨 · 레시피 사진 OCR: `tesseract.js` (`kor+eng`) 기반 이미지 텍스트 판독
   - 엑셀 파일: `.xlsx`, `.xls`, `.csv` 시트 선택 및 다중 시트 일괄 레시피 등록

4. **재료 단가 DB & 구움틀 DB**
   - 모바일 반응형 `카드형 | 목록형` 뷰 모드 토글 (`localStorage` 저장)
   - 저장 시 `YYYY.MM.DD` 형식의 업데이트일 자동 기록

5. **Google Sheets (GAS) 실시간 연동**
   - `localStorage` 캐시 우선 렌더링 후 비동기 구글 시트 최신화
   - `mode: "no-cors"` 기반 안전한 실시간 양방향 데이터 동기화

## 🛠️ 기술 스택 및 빌드

- **프레임워크:** React 18, Vite, TypeScript
- **스타일링:** 아티장 베이커리 페이퍼 팔레트 (Warm Paper `#F6F3EE`, Ink `#1C1B18`, Forest Green `#174328`, Crust Terracotta `#A85232`), Pretendard 폰트
- **아이콘:** `lucide-react`
- **단일 파일 번들:** `vite-plugin-singlefile`을 통한 초경량 `dist/index.html` 단일 파일 빌드
- **외부 대용량 라이브러리:** `tesseract.js`, `xlsx`, `html2canvas` CDN 분리를 통한 번들 비대화 방지

## 🚀 배포 및 로컬 실행

### 로컬 개발
```bash
npm install
npm run dev
```

### 프로덕션 빌드
```bash
npm run build
```

### Vercel 배포 환경 변수
- `VITE_GAS_WEBAPP_URL`: Google Apps Script 웹 앱 배포 URL
