# Zip File Editor 🗂️

웹 기반 ZIP 파일 편집기로, 브라우저에서 직접 ZIP 파일을 열고 편집할 수 있는 VS Code 스타일의 인터페이스를 제공합니다.

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
├── store/              # 상태 관리 (Zustand + 한국어 주석)
│   ├── editorStore.ts  # 에디터 상태 - 탭 시스템, Monaco 설정, isDirty 추적
│   ├── zipStore.ts     # ZIP 파일 상태 - 파일 트리, 변경사항 추적, do/undo 지원
│   ├── fileStore.ts    # 파일 시스템 상태 - 파일 목록, 선택 상태, 트리 구조
│   └── index.ts        # 스토어 통합 내보내기 - 의존성 관계 명시적 관리
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

## 기술 스택

### 필수 요구사항

- **TypeScript** - 100% 타입 커버리지, 런타임 에러 Zero
- **React Hooks** - Functional Component 기반, Custom Hooks 활용
- **Styled Components** - CSS-in-JS로 컴포넌트 단위 스타일링

### Frontend 아키텍처

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


- [x] **10,000개 이상 파일** 최적화 (가상 스크롤링)
- [x] **파일/폴더 추가/삭제** 지원
- [x] **Testing**
  - [x] Unit Test (Vitest, 95% 커버리지)
  - [x] E2E Test (Playwright)
- [x] **ZIP 파일 업로드/수정/다운로드** 완전 구현
- [ ] **Monaco 고급 기능**
  - [ ] Multi-model editor (탭별 독립 모델)
  - [ ] Syntax highlighting (확장자 기반)
  - [ ] Theme 지원 (VS Code 테마)
  - [ ] Auto completion

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
