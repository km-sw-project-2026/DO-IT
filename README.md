# DO-IT 프로젝트

DO-IT은 React 19와 Cloudflare Workers / D1 기반으로 구축된 커뮤니티 웹 애플리케이션입니다. 이 프로젝트는 게시글, 댓글, 사용자 관리, 문서 저장소(Document Repository), 관리자 제어 및 멘토-멘티 매칭을 포괄하는 기능을 제공합니다.

---

## 기술 스택 (Tech Stack)

### Frontend
- **Framework:** React 19 (SPA)
- **Routing:** React Router DOM 7
- **Build Tool:** Vite 7
- **Language:** JavaScript (ESM, JSX - TS 미사용)

### Backend & Database
- **Serverless Backend:** Cloudflare Workers, Cloudflare Pages Functions
- **Database:** D1 (Cloudflare SQLite Database)

---

## 주요 기능 (Key Features)

- **커뮤니티 및 소통:** 게시판(게시글/댓글 작성), 실시간 채팅 기능
- **멘토링 시스템:** 멘토 프로필 등록 및 멘토링 신청, 멘토-멘티 관리
- **스케줄 관리:** 캘린더 기능 연동을 통한 일정 관리
- **문서 저장소:** 온라인 문서 편집(Doc Editor/Viewer) 및 폴더/파일 관리 (업로드 등)
- **사용자 및 권한 관리:** 회원가입/로그인, 관리자 페이지(Admin Page)
- **알림 및 신고:** 활동 내역 알림, 신고(Report) 접수 기능

---

## 주요 디렉토리 구조 (Project Structure)

```text
DO-IT/
 ┣ functions/api/     # Cloudflare Pages Functions (백엔드 API 핸들러)
 ┣ public/            # 정적 에셋 (아이콘 및 기본 이미지)
 ┣ src/               # React 프론트엔드 코드
 ┃ ┣ api/             # 백엔드 API와의 통신을 위한 함수 모음
 ┃ ┣ components/      # 재사용 가능한 UI 컴포넌트
 ┃ ┣ css/             # 컴포넌트/페이지별 스타일시트
 ┃ ┣ pages/           # 전체 화면을 구성하는 페이지 컴포넌트
 ┃ ┗ utils/           # 유틸리티 함수 모음
 ┣ worker/            # Cloudflare Worker 진입점
 ┣ AGENTS.md          # AI 및 개발자 가이드 문서
 ┗ database.sql       # D1 데이터베이스 스키마 export 파일
```

---

## 실행 및 배포 명령어 (Scripts)

로컬 개발 환경 및 배포에 아래 스크립트를 사용합니다:

- `npm run dev`: 로컬 개발 서버 시작 (Vite, http://localhost:5173)
- `npm run build`: 운영 환경을 위한 프론트엔드 사이트 정적 빌드 (`dist/`)
- `npm run preview`: 로컬에서 빌드된 프로덕션 버전 미리보기
- `npm run lint`: 전체 프로젝트 대상 ESLint 검사 수행
- `npm run deploy`: Cloudflare Workers 실서버에 빌드 및 배포
- `npm run schema:generate`: D1 DB 스키마를 `database.sql` 파일로 추출
- `npm run schema:apply`: `database.sql` 스키마 덤프를 D1에 반영

---

## 개발 가이드라인

- **스타일 및 뷰:** 컴포넌트는 `PascalCase` 명명 규칙을 따르며, 인라인 스타일 대신 개별 CSS 파일을 생성해 사용합니다.
- **API 에러 핸들링:** API 호출 시에는 `try/catch`로 예외 처리를 하며 `console.warn`을 통해 로깅하고 사용자 환경을 저해하지 않도록 안전한 기본값을 반환합니다.
- **TypeScript:** 이 프로젝트는 순수 JavaScript 프로젝트이므로 별도의 `.ts` 적용이나 테스트 프레임워크를 요구하지 않습니다. 보다 상세한 개발 가이드는 프로젝트 내 `AGENTS.md` 파일을 참조하세요.
