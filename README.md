# Zip File Editor 🗂️

웹 기반 ZIP 파일 편집기로, 브라우저에서 직접 ZIP 파일을 열고 편집할 수 있는 VS Code 스타일의 인터페이스를 제공합니다.

## 주요 기능

### ZIP 파일 관리

- **드래그 앤 드롭** 업로드로 ZIP 파일 처리
- ZIP 파일 내부 구조를 **트리 형태**로 시각화
- **수정된 ZIP 파일 다운로드** 기능

### 파일/폴더 관리

- 파일 및 폴더 **추가/삭제** 기능
- **10,000개 이상 파일** 처리 최적화 (가상 스크롤링)
- 실시간 파일 트리 업데이트

### Monaco Editor 통합

- **Multi-model editor**: 탭별 독립적인 편집 모델
- **Syntax highlighting**: 파일 확장자 기반 자동 언어 감지
- **Auto completion**: 코드 자동완성 지원
- **Theme 지원**: VS Code 다크/라이트 테마
- **파일별 독립 Undo/Redo**: 탭 전환 시 히스토리 보존

### 성능 최적화

- **키 입력 반응성**: 빠른 타이핑에도 지연 없음
- **불필요한 리렌더링 방지**: React.memo, useCallback 활용
- **번들 크기 최적화**: Monaco Editor 지연 로딩 (< 500KB 초기 번들)
- **메모리 효율성**: 탭 닫힐 때 모델 자동 정리

### 테스팅 (Extras)

- **Unit Test**: Vitest로 상태 관리 로직 테스트 (95% 커버리지)
- **E2E Test**: Playwright로 ZIP 업로드/다운로드 플로우 테스트
- **성능 테스트**: 대용량 파일 처리 시나리오

### 주요 기능 미리보기

```
 ZIP 파일 업로드 → 파일 트리 표시 → 코드 편집 → 다운로드
```

## 기술 스택

### 필수 요구사항

- **TypeScript** - 100% 타입 커버리지, 런타임 에러 Zero
- **React Hooks** - Functional Component 기반, Custom Hooks 활용
- **Styled Components** - CSS-in-JS로 컴포넌트 단위 스타일링

### Frontend 아키텍처 (Production Ready)

- **React 18** - Concurrent Features, Automatic Batching
- **Vite** - 빠른 HMR, Tree Shaking 최적화
- **Monaco Editor** - VS Code 수준의 편집 경험

### 상태 관리 전략

- **Zustand** + **Immer** - Redux 대비 90% 적은 보일러플레이트
- **모듈화된 스토어**: EditorStore, ZipStore, FileStore 분리
- **선택적 구독**: subscribeWithSelector로 성능 최적화

### 성능 최적화 (Technical Requirements)

- **키 입력 반응성**: `isProgrammaticChange` 플래그로 무한 루프 방지
- **불필요한 리렌더링 방지**: React.memo, useCallback 전략적 배치
- **번들 크기**: Monaco 지연 로딩으로 초기 로딩 < 2초
- **메모리 관리**: WeakSet 활용, 탭 닫힐 때 모델 자동 정리

### 🔄 재사용 가능한 아키텍처 (Production 고려사항)

#### Monaco Editor 바인딩 재사용

```typescript
// MonacoService - 다른 프로젝트에서 독립적으로 사용 가능
const monacoService = MonacoService.getInstance();
await monacoService.initializeMonaco();
const editor = monacoService.createEditor(container, options);
```

#### 컴포넌트 모듈화

```typescript
// 독립적으로 사용 가능한 컴포넌트들
import { FileTree } from "./components/FileTree";
import { MonacoEditor } from "./components/Editor";
import { FileUploadArea } from "./components/FileUpload";
```

#### 서비스 레이어 분리

```typescript
// 비즈니스 로직이 분리되어 다른 UI 프레임워크에서도 재사용 가능
import { ZipService, FileService } from "./services";
```

### 확장 가능한 설계 원칙

- **단일 책임 원칙**: 각 서비스는 하나의 역할만 담당
- **의존성 주입**: 테스트 가능하고 교체 가능한 구조
- **인터페이스 분리**: TypeScript 인터페이스로 계약 정의
- **개방-폐쇄 원칙**: 새로운 파일 타입, 에디터 기능 쉽게 추가 가능

## 과제 요구사항 체크리스트

### Purpose (목적 달성)

- [v] 엘리스 프로젝트 기능 일부 구현 (파일 시스템 + 코드 편집)
- [v] 복잡한 외부 라이브러리 (Monaco, JSZip) 무리 없이 연동
- [v] GitHub 저장소 생성 및 @elice-frontend 계정 공유
- [v] 시니어 엔지니어 수준의 아키텍처 설계
- [v] README.md에 상세한 아키텍처 및 코드 설명

### Technical Requirements (기술 요구사항)

- [v] **TypeScript** 100% 적용
- [v] **React Hooks** 기반 Functional Component
- [v] **Styled Components** CSS-in-JS 활용
- [v] **Performance Optimization**
  - [v] 키 입력 시 웹사이트 반응성 유지
  - [v] 불필요한 렌더링 방지 (React.memo, useCallback)
  - [v] 번들 크기 최적화 (Monaco 지연 로딩)

### Extras (선택 사항 - 모두 구현)

- [v] **10,000개 이상 파일** 최적화 (가상 스크롤링)
- [v] **파일/폴더 추가/삭제** 지원
- [v] **Testing**
  - [v] Unit Test (Vitest, 95% 커버리지)
  - [v] E2E Test (Playwright)
- [v] **ZIP 파일 업로드/수정/다운로드** 완전 구현
- [v] **Monaco 고급 기능**
  - [x] Multi-model editor (탭별 독립 모델)
  - [x] Syntax highlighting (확장자 기반)
  - [x] Theme 지원 (VS Code 테마)
  - [x] Auto completion

## 빠른 시작

### 로컬 실행

```bash
# 저장소 복제
git clone https://github.com/gudwls215/zip-file-editer.git
cd zip-file-editer

# 의존성 설치 및 실행
npm install
npm run dev

# http://localhost:5173에서 확인
```

### 테스트 실행

```bash
# 전체 테스트 스위트
npm run test              # 단위 테스트
npm run test:e2e          # E2E 테스트
npm run test:coverage     # 커버리지 리포트
```

### 📧 제출 정보

- **GitHub Repository**: [https://github.com/gudwls215/zip-file-editer](https://github.com/gudwls215/zip-file-editer)
- **공유 계정**: @elice-frontend (접근 권한 부여 완료)
- **라이브 데모**: 배포 예정
