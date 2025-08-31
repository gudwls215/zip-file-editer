# Zip File Editor

웹 기반 ZIP 파일 편집기로, 브라우저에서 직접 ZIP 파일을 열고 편집할 수 있는 VS Code 스타일의 인터페이스를 제공합니다.

## 주요 기능

### ZIP 파일 관리

- **드래그 앤 드롭** 또는 **파일 선택**으로 ZIP 파일 업로드
- ZIP 파일 내부 구조를 **트리 형태**로 시각화
- 파일 및 폴더 **추가/삭제** 기능
- 수정된 ZIP 파일 **다운로드** 기능

### 코드 편집

- **Monaco Editor** 기반의 VS Code 스타일 편집기
- **문법 하이라이팅** 및 **자동완성** 지원
- **탭 기반 멀티파일 편집**
- **실시간 저장 상태 추적** (isDirty 상태)
- **Undo/Redo** 기능 (파일별 히스토리 관리)

### 사용자 인터페이스

- **리사이즈 가능한 사이드바** (마우스 드래그)
- **VS Code 다크 테마** 스타일
- **성능 최적화된 파일 트리** (가상 스크롤링)
- **키보드 단축키** 지원

## 기술 스택

### Frontend

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구 및 개발 서버
- **Monaco Editor** - 코드 에디터
- **Styled Components** - CSS-in-JS

### 상태 관리

- **Zustand** - 경량 상태 관리 라이브러리
- **Immer** - 불변성 관리
- **subscribeWithSelector** - 선택적 구독

### 파일 처리

- **JSZip** - ZIP 파일 조작
- **File Saver** - 파일 다운로드
- **React Dropzone** - 드래그 앤 드롭

### 테스팅

- **Vitest** - 단위 테스트
- **Playwright** - E2E 테스트
- **Testing Library** - React 컴포넌트 테스트

## 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── Layout/         # 메인 레이아웃
│   │   └── AppLayout.tsx
│   ├── FileTree/       # 파일 트리 관련
│   │   ├── OptimizedFileTree.tsx
│   │   ├── VirtualFileTree.tsx
│   │   ├── FileTree.tsx
│   │   └── TreeNode.tsx
│   ├── Editor/         # 에디터 관련
│   │   ├── EditorContainer.tsx
│   │   ├── EditorTabs.tsx
│   │   ├── MonacoEditor.tsx
│   │   └── LazyMonacoEditor.tsx
│   ├── FileUpload/     # 파일 업로드
│   │   ├── FileUploadArea.tsx
│   │   └── DownloadButton.tsx
│   └── Monaco/         # Monaco 에디터 래퍼
│       └── MonacoEditorComponent.tsx
├── store/              # 상태 관리 (Zustand)
│   ├── editorStore.ts  # 에디터 상태
│   ├── zipStore.ts     # ZIP 파일 상태
│   └── fileStore.ts    # 파일 시스템 상태
├── services/           # 비즈니스 로직
│   ├── zipService.ts   # ZIP 파일 처리
│   ├── fileService.ts  # 파일 조작
│   └── monacoService.ts # Monaco 에디터 관리
├── hooks/              # 커스텀 훅
│   ├── useZipHandler.ts
│   ├── useFileSystem.ts
│   ├── useKeyboardShortcuts.ts
│   └── useMonaco.ts
├── types/              # TypeScript 타입 정의
│   ├── file.types.ts
│   ├── editor.types.ts
│   └── index.ts
├── utils/              # 유틸리티 함수
│   ├── fileUtils.ts
│   ├── treeUtils.ts
│   ├── constants.ts
│   └── monacoConfig.ts
└── setup/              # 설정 파일
    └── monacoWorkers.ts
```

## 아키텍처 설계

### 1. 상태 관리 아키텍처

#### EditorStore (에디터 상태)

```typescript
interface EditorState {
  tabs: EditorTab[]; // 열린 탭 목록
  activeTabId: string | null; // 현재 활성 탭
  theme: string; // 에디터 테마
  fontSize: number; // 글꼴 크기
  wordWrap: boolean; // 줄바꿈 설정
  minimap: boolean; // 미니맵 표시
}
```

**주요 기능:**

- **탭 관리**: 추가, 제거, 활성화
- **내용 추적**: `isDirty` 상태로 수정 여부 관리
- **원본 비교**: `originalContent`와 현재 내용 비교
- **뷰 상태 보존**: 커서 위치, 스크롤 위치 등

#### ZipStore (ZIP 파일 상태)

```typescript
interface ZipStore {
  zipFile: JSZip | null; // ZIP 파일 객체
  fileName: string | null; // 파일명
  originalBuffer: ArrayBuffer | null; // 원본 데이터
  fileTree: FileNode[]; // 파일 트리 구조
  savedChanges: Record<string, string>; // 저장된 변경사항
  hasStructuralChanges: boolean; // 구조적 변경 여부
}
```

**주요 기능:**

- **ZIP 파일 로드/저장**
- **파일 트리 구성**
- **구조적 변경사항 추적** (파일/폴더 추가/삭제)
- **저장 지점 관리** (Ctrl+S 시점)

### 2. 컴포넌트 아키텍처

#### 계층 구조

```
AppLayout (메인 레이아웃)
├── FileUploadArea (파일 업로드)
├── OptimizedFileTree (파일 트리)
│   ├── VirtualFileTree (가상 스크롤링)
│   └── TreeNode (트리 노드)
└── EditorContainer (에디터 영역)
    ├── EditorTabs (탭 바)
    └── MonacoEditor (에디터 본체)
```

#### 성능 최적화

- **가상 스크롤링**: 대용량 파일 트리 처리
- **지연 로딩**: Monaco Editor 동적 로드
- **메모이제이션**: React.memo, useCallback 활용
- **모델 재사용**: Monaco Editor 모델 캐싱

### 3. 서비스 레이어

#### ZipService

- ZIP 파일 압축/해제
- 파일 유효성 검사
- 바이너리 파일 처리

#### FileService

- 파일 다운로드
- 파일 타입 감지
- 브라우저 호환성 처리

#### MonacoService

- 에디터 인스턴스 관리
- 언어 감지 및 설정
- 모델 생명주기 관리

### 4. Do/Undo 시스템 설계

#### 파일별 히스토리 관리

```typescript
// 각 탭마다 독립적인 Monaco Editor 모델 유지
const model = monaco.editor.createModel(content, language, uri);
editor.setModel(model); // 탭 전환 시 모델 교체
```

#### 저장 지점 추적

```typescript
// 원본 내용과 현재 내용 비교로 isDirty 상태 결정
tab.isDirty = content !== tab.originalContent;

// 저장 시 새로운 원본으로 설정
markTabSaved: (tabId) => {
  tab.isDirty = false;
  tab.originalContent = tab.content;
};
```

#### 구조적 변경사항

- 파일/폴더 추가/삭제는 `hasStructuralChanges` 플래그로 추적
- ZIP 파일 전체 재생성이 필요한 변경사항과 내용 변경사항 구분

### 5. 키보드 단축키

| 단축키       | 기능      |
| ------------ | --------- |
| Ctrl+S       | 파일 저장 |
| Ctrl+Z       | 실행 취소 |
| Ctrl+Shift+Z | 다시 실행 |
| Ctrl+F       | 찾기      |
| Ctrl+H       | 바꾸기    |

### 6. 파일 타입 지원

#### 텍스트 파일

- JavaScript, TypeScript, HTML, CSS, JSON 등
- 문법 하이라이팅 및 자동완성

#### 이미지 파일

- PNG, JPG, GIF, SVG 등
- 미리보기 모드

#### 바이너리 파일

- 바이너리 파일 감지
- 편집 불가 알림

## 설치 및 실행

### 개발 환경 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

### 테스트

```bash
# 단위 테스트
npm run test

# 테스트 UI
npm run test:ui

# 커버리지 리포트
npm run test:coverage

# E2E 테스트
npm run test:e2e
```

## 성능 최적화

### 1. 파일 트리 최적화

- **임계값 기반 가상화**: 1000개 이상 파일시 가상 스크롤링 자동 활성화
- **검색 최적화**: 플랫맵을 통한 O(1) 파일 검색
- **확장 상태 보존**: 트리 재구성 시 확장 상태 유지

### 2. 에디터 최적화

- **모델 재사용**: 동일 파일에 대한 Monaco 모델 캐싱
- **지연 로딩**: Monaco Editor 동적 import
- **메모리 관리**: 닫힌 탭의 모델 자동 정리

### 3. 메모리 관리

- **약한 참조**: 에디터 인스턴스에 대한 WeakSet 사용
- **자동 정리**: 컴포넌트 언마운트 시 리스너 제거
- **가비지 컬렉션**: 사용하지 않는 Monaco 모델 정리

## 브라우저 호환성

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### 필수 기능

- ES2020 지원
- File API
- ArrayBuffer
- Web Workers (Monaco Editor)

## 기여하기

1. Fork 프로젝트
2. Feature 브랜치 생성
3. 변경사항 커밋
4. 브랜치에 Push
5. Pull Request 생성

## 알려진 제한사항

1. **파일 크기**: 브라우저 메모리 제한에 따른 대용량 파일 처리 제한
2. **바이너리 파일**: 실행 파일 등 특정 바이너리 파일 편집 불가
3. **브라우저 보안**: CORS 정책에 따른 외부 파일 접근 제한
