import React, { useRef, useEffect, useCallback } from "react";
// Monaco Editor 초기화 시에만 필요한 웹 워커 설정을 임포트
import "../../setup/monacoWorkers";
import * as monaco from "monaco-editor";
import { useEditorStore } from "../../store/editorStore";
import { useZipStore } from "../../store/zipStore";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { MonacoService } from "../../services/monacoService";

/**
 * MonacoEditor - Microsoft VS Code와 동일한 수준의 고급 코드 에디터 컴포넌트
 *
 * 핵심 기능:
 * - Monaco Editor 인스턴스의 전체 생명주기 관리 (생성, 업데이트, 해제)
 * - 다중 탭 환경에서 각 파일별로 독립적인 편집 모델과 상태 유지
 * - 사용자 입력에 따른 실시간 내용 변경 감지 및 수정 상태(isDirty) 추적
 * - 표준 IDE 키보드 단축키 지원 (저장, 실행취소, 재실행, 탭 닫기 등)
 *
 * 고급 기능:
 * - Multi-model 아키텍처: 탭별로 완전히 독립된 Monaco 편집 모델 관리
 * - View State 영속성: 커서 위치, 스크롤 위치, 선택 영역, 폴딩 상태 보존
 * - 프로그래밍적 변경과 사용자 입력 구분으로 무한 루프 및 의도치 않은 상태 변경 방지
 * - 메모리 누수 방지: 닫힌 탭의 Monaco 모델 자동 정리 및 가비지 컬렉션
 * - 언어별 특화 자동완성 및 IntelliSense 기능
 *
 * 성능 최적화:
 * - isProgrammaticChange 플래그로 재귀 호출 및 무한 루프 방지
 * - 모델 재사용을 통한 편집 히스토리(Undo/Redo) 및 검색 히스토리 유지
 * - 탭 전환 시 뷰 상태의 효율적인 저장 및 복원
 * - 구조적 공유를 통한 메모리 사용량 최적화
 */
export const MonacoEditor: React.FC = () => {
  // 무한 루프 방지: 프로그래밍적 변경과 사용자 직접 입력을 구분하는 플래그
  // 에디터 내용을 코드로 변경할 때 true로 설정하여 onChange 이벤트 무시
  const isProgrammaticChange = useRef(false);

  // Monaco Editor 인스턴스 및 DOM 컨테이너 참조
  // editorRef: Monaco Editor의 실제 인스턴스 (API 호출용)
  // containerRef: 에디터가 마운트될 DOM 엘리먼트
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Monaco 관련 서비스의 싱글톤 인스턴스 
  // 언어 서버, 워커 스레드, 테마 등을 관리하는 서비스
  const monacoSvcRef = useRef(MonacoService.getInstance());

  // 탭 전환 시 이전 활성 탭의 뷰 상태 저장을 위한 추적 변수
  // 커서 위치, 스크롤 위치, 선택 영역 등을 보존하기 위해 사용
  const prevActiveIdRef = useRef<string | null>(null);

  // Zustand 스토어에서 에디터 상태 및 액션들을 가져옴
  const {
    getActiveTab,        // 현재 활성화된 탭 정보 조회
    updateTabContent,    // 탭의 내용 업데이트 (isDirty 상태 포함)
    theme,              // 에디터 테마 (vs-dark, vs-light 등)
    fontSize,           // 폰트 크기 설정
    wordWrap,           // 줄 바꿈 설정
    minimap,            // 미니맵 표시 여부
    markTabSaved,       // 탭을 저장됨으로 표시 (isDirty = false)
    removeTab,          // 탭 제거
    setTabViewState,    // 탭의 뷰 상태 저장 (커서, 스크롤 등)
  } = useEditorStore();
  const { setSavedChange } = useZipStore(); // ZIP 다운로드용 저장된 변경사항 관리

  // 현재 활성화된 탭 정보 조회
  const activeTab = getActiveTab();

  // 개발 시 디버깅용 로그 (프로덕션에서는 제거 권장)
  console.log("MonacoEditor 렌더링 - 활성 탭:", activeTab?.name);

  // 파일 저장 핸들러 - Ctrl+S 키 바인딩 및 저장 로직
  // 현재 활성 탭의 내용을 저장하고 isDirty 상태를 false로 변경
  const handleSave = useCallback(() => {
    if (activeTab) {
      // 에디터에서 현재 값을 가져오거나 탭의 저장된 내용 사용
      const value = editorRef.current?.getValue() ?? activeTab.content;
      console.log("탭 저장 중:", activeTab.name);

      // ZIP 파일 다운로드를 위한 스냅샷 저장 (zipStore에 저장)
      setSavedChange(activeTab.path, value);

      // 에디터 내용이 탭의 저장된 내용과 다른 경우에만 업데이트
      // 이를 통해 불필요한 상태 변경과 리렌더링 방지
      if (value !== activeTab.content) {
        updateTabContent(activeTab.id, value);
      }

      // 탭을 저장됨 상태로 표시 (isDirty = false, 탭 제목의 점 표시 제거)
      markTabSaved(activeTab.id);
    }
  }, [activeTab, markTabSaved, setSavedChange, updateTabContent]);

  // 탭 닫기 핸들러 - 저장되지 않은 변경사항 확인 후 탭 제거
  // 사용자가 실수로 작업 내용을 잃지 않도록 확인 다이얼로그 표시
  const handleCloseTab = useCallback(() => {
    if (activeTab) {
      // 수정된 내용이 있는 경우 사용자에게 확인 요청
      if (activeTab.isDirty) {
        const shouldClose = window.confirm(
          `${activeTab.name} 파일에 저장되지 않은 변경사항이 있습니다. 정말 닫으시겠습니까?`
        );
        if (!shouldClose) return; // 사용자가 취소한 경우 탭 닫기 중단
      }
      // 탭 제거 (해당 탭의 Monaco 모델도 자동으로 정리됨)
      removeTab(activeTab.id);
    }
  }, [activeTab, removeTab]);

  // 키보드 단축키 등록 - IDE 수준의 단축키 지원
  useKeyboardShortcuts({
    onSave: handleSave,        // Ctrl+S: 현재 파일 저장
    onCloseTab: handleCloseTab, // Ctrl+W: 현재 탭 닫기
    onSearch: () => {
      // Ctrl+F: 검색 다이얼로그 열기 (Monaco 내장 기능)
      editorRef.current?.getAction("actions.find")?.run();
    },
    onReplace: () => {
      // Ctrl+H: 찾기 및 바꾸기 다이얼로그 열기 (Monaco 내장 기능)
      editorRef.current
        ?.getAction("editor.action.startFindReplaceAction")
        ?.run();
    },
  });

  // 에디터 내용 변경 핸들러 - 사용자 입력에 따른 실시간 상태 업데이트
  const handleEditorChange = useCallback(() => {
    if (!editorRef.current) return; // 에디터가 초기화되지 않은 경우 무시
    if (isProgrammaticChange.current) return; // 프로그래밍적 변경인 경우 무시
    
    const value = editorRef.current.getValue(); // 현재 에디터의 전체 텍스트 내용
    const currentActive = useEditorStore.getState().getActiveTab(); // 최신 활성 탭 정보
    if (!currentActive) return; // 활성 탭이 없는 경우 무시
    
    // 내용이 실제로 변경된 경우에만 상태 업데이트 (불필요한 리렌더링 방지)
    if (value !== currentActive.content) {
      updateTabContent(currentActive.id, value);
    }
  }, [updateTabContent]);

  // 커스텀 자동완성 제공자 설정 함수
  // Monaco Editor에 언어별 특화된 코드 스니펫과 자동완성 기능을 등록
  const setupCustomAutocompletion = useCallback(() => {
    // JavaScript 언어용 자동완성 강화
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: (model, position) => {
        // 현재 커서 위치의 단어 정보 추출 (자동완성 범위 계산용)
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        // JavaScript 개발에 자주 사용되는 코드 패턴들을 스니펫으로 제공
        const suggestions: monaco.languages.CompletionItem[] = [
          {
            label: 'console.log',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'console.log(${1:message});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '콘솔에 메시지를 출력합니다',
            range: range
          },
          {
            label: 'function',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'function ${1:name}(${2:params}) {\n\t${3:// 코드 작성}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '함수 선언문을 생성합니다',
            range: range
          },
          {
            label: 'arrow function',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'const ${1:name} = (${2:params}) => {\n\t${3:// 코드 작성}\n};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '화살표 함수를 생성합니다',
            range: range
          },
          {
            label: 'if statement',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'if (${1:condition}) {\n\t${2:// 코드 작성}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'if 조건문을 생성합니다',
            range: range
          },
          {
            label: 'for loop',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${3:// 코드 작성}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'for 반복문을 생성합니다',
            range: range
          },
          {
            label: 'try-catch',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'try {\n\t${1:// 실행할 코드}\n} catch (${2:error}) {\n\t${3:// 에러 처리}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '예외 처리 블록을 생성합니다',
            range: range
          }
        ];

        return { suggestions };
      }
    });

    // TypeScript 언어용 자동완성 강화 (React 포함)
    monaco.languages.registerCompletionItemProvider('typescript', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        // TypeScript 및 React 개발에 필수적인 패턴들을 스니펫으로 제공
        const suggestions: monaco.languages.CompletionItem[] = [
          {
            label: 'interface',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'interface ${1:Name} {\n\t${2:property}: ${3:type};\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'TypeScript 인터페이스를 정의합니다',
            range: range
          },
          {
            label: 'type',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'type ${1:Name} = ${2:type};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'TypeScript 타입 별칭을 정의합니다',
            range: range
          },
          {
            label: 'enum',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'enum ${1:Name} {\n\t${2:VALUE} = "${3:value}",\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'TypeScript 열거형을 정의합니다',
            range: range
          },
          {
            label: 'useState',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState<${2:type}>(${3:initialValue});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'React useState 훅을 생성합니다',
            range: range
          },
          {
            label: 'useEffect',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'useEffect(() => {\n\t${1:// 사이드 이펙트}\n\treturn () => {\n\t\t${2:// 정리 함수}\n\t};\n}, [${3:dependencies}]);',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'React useEffect 훅을 생성합니다',
            range: range
          },
          {
            label: 'useCallback',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'const ${1:callback} = useCallback((${2:params}) => {\n\t${3:// 콜백 로직}\n}, [${4:dependencies}]);',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'React useCallback 훅을 생성합니다',
            range: range
          },
          {
            label: 'React Component',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'const ${1:ComponentName}: React.FC<${2:Props}> = (${3:props}) => {\n\treturn (\n\t\t<div>\n\t\t\t${4:// JSX 내용}\n\t\t</div>\n\t);\n};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'React 함수형 컴포넌트를 생성합니다',
            range: range
          }
        ];

        return { suggestions };
      }
    });

    // CSS 언어용 자동완성
    monaco.languages.registerCompletionItemProvider('css', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        // 모던 CSS 레이아웃 패턴들을 스니펫으로 제공
        const suggestions: monaco.languages.CompletionItem[] = [
          {
            label: 'flexbox',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'display: flex;\njustify-content: ${1:center};\nalign-items: ${2:center};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Flexbox 레이아웃을 설정합니다',
            range: range
          },
          {
            label: 'grid',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'display: grid;\ngrid-template-columns: ${1:repeat(3, 1fr)};\ngap: ${2:1rem};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'CSS Grid 레이아웃을 설정합니다',
            range: range
          }
        ];

        return { suggestions };
      }
    });

    console.log("커스텀 자동완성 제공자 등록 완료");
  }, []);

  // Monaco Editor 인스턴스 생성 및 초기화
  useEffect(() => {
    // 이미 에디터가 생성되었거나 컨테이너가 준비되지 않은 경우 무시
    if (!containerRef.current || editorRef.current) return;

    // Monaco 서비스 초기화 확인 (웹 워커, 언어 서버 등)
    monacoSvcRef.current.initialize().catch(() => {
      // 초기화 실패 시 무시 (에디터 기본 기능은 동작)
    });

    // Monaco Editor 인스턴스 생성 - 고급 설정 포함
    const editor = monaco.editor.create(containerRef.current, {
      // 기본 외관 설정
      theme: theme,                                    // 에디터 테마 (다크/라이트)
      fontSize,                                        // 폰트 크기
      fontFamily:                                      // 코딩 폰트 우선순위
        '"Cascadia Code", "Fira Code", "Consolas", "Monaco", monospace',
      lineNumbers: "on",                               // 줄 번호 표시
      minimap: { enabled: minimap },                   // 미니맵 표시 여부
      automaticLayout: true,                           // 자동 레이아웃 조정
      scrollBeyondLastLine: false,                     // 마지막 줄 이후 스크롤 방지
      wordWrap: wordWrap ? "on" : "off",              // 줄 바꿈 설정
      
      // 코드 구조 및 편집 기능
      folding: true,                                   // 코드 폴딩 활성화
      glyphMargin: true,                               // 글리프 마진 (브레이크포인트 등)
      renderWhitespace: "selection",                   // 공백 문자 표시
      tabSize: 2,                                      // 탭 크기
      insertSpaces: true,                              // 탭 대신 공백 사용
      
      // 마우스 및 커서 설정
      mouseWheelZoom: true,                           // 마우스 휠로 줌 조정
      cursorBlinking: "blink",                        // 커서 깜빡임 애니메이션
      cursorSmoothCaretAnimation: "off",              // 커서 이동 애니메이션 비활성화
      smoothScrolling: false,                         // 부드러운 스크롤 비활성화
      
      // 자동완성 및 IntelliSense 기능 설정
      quickSuggestions: {
        other: true,      // 일반 텍스트에서 자동완성 활성화
        comments: true,   // 주석 내에서도 자동완성 제공
        strings: true     // 문자열 내에서도 자동완성 제공
      },
      acceptSuggestionOnCommitCharacter: true,        // 특수 문자 입력 시 자동완성 적용
      acceptSuggestionOnEnter: "on",                  // Enter 키로 자동완성 적용
      quickSuggestionsDelay: 100,                     // 자동완성 지연 시간 (ms)
      
      // 편집 도구 및 도우미 기능
      accessibilitySupport: "auto",                   // 접근성 지원 자동 감지
      autoIndent: "full",                             // 완전 자동 들여쓰기
      codeLens: true,                                 // 코드 렌즈 활성화 (참조 수 등)
      colorDecorators: true,                          // 색상 값 시각적 표시
      contextmenu: true,                              // 우클릭 컨텍스트 메뉴
      dragAndDrop: true,                              // 텍스트 드래그 앤 드롭
      fontLigatures: true,                            // 폰트 합자 지원 (==, => 등)
      formatOnPaste: true,                            // 붙여넣기 시 자동 포맷팅
      formatOnType: true,                             // 타이핑 시 자동 포맷팅
      links: true,                                    // URL 링크 감지 및 클릭 가능
      
      // 고급 편집 기능
      multiCursorMergeOverlapping: true,              // 겹치는 멀티 커서 자동 병합
      multiCursorModifier: "alt",                     // 멀티 커서 수정 키 (Alt)
      parameterHints: {                               // 함수 매개변수 힌트
        enabled: true,                                // 힌트 활성화
        cycle: false                                  // 힌트 순환 비활성화
      },
      
      // 화면 표시 및 레이아웃
      renderControlCharacters: false,                 // 제어 문자 표시 안함
      renderFinalNewline: "on",                       // 파일 끝 개행 문자 표시
      renderLineHighlight: "line",                    // 현재 줄 강조
      selectionHighlight: true,                       // 동일 텍스트 선택 시 강조
      showFoldingControls: "mouseover",               // 마우스 오버 시 폴딩 컨트롤 표시
      showUnused: true,                               // 사용되지 않는 코드 흐리게 표시
      
      // 검색 및 제안 기능
      suggestFontSize: 14,                            // 자동완성 목록 폰트 크기
      suggestLineHeight: 24,                          // 자동완성 목록 줄 높이
      suggestOnTriggerCharacters: true,               // 트리거 문자로 자동완성 호출
      suggestSelection: "first",                      // 자동완성 기본 선택 항목
      tabCompletion: "on",                            // Tab 키로 자동완성 적용
      wordBasedSuggestions: "currentDocument",        // 현재 문서 기반 단어 제안
      
      // 텍스트 래핑 및 정렬
      wordSeparators: "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?", // 단어 구분 문자
      wordWrapBreakAfterCharacters: "\t})]?|&,;",     // 줄바꿈 후 허용 문자
      wordWrapBreakBeforeCharacters: "{([+",          // 줄바꿈 전 허용 문자
      wordWrapColumn: 80,                             // 줄바꿈 기준 열 수
      wrappingIndent: "indent",                       // 래핑된 줄 들여쓰기 방식
      
      // 기타 고급 설정
      disableLayerHinting: false,                     // 레이어 힌팅 활성화
      disableMonospaceOptimizations: false,           // 고정폭 폰트 최적화 활성화
      fixedOverflowWidgets: false,                    // 오버플로우 위젯 고정 비활성화
      foldingStrategy: "auto",                        // 자동 폴딩 전략
      hideCursorInOverviewRuler: false,               // 오버뷰 룰러에 커서 표시
      overviewRulerBorder: true,                      // 오버뷰 룰러 테두리
      overviewRulerLanes: 2,                          // 오버뷰 룰러 레인 수
      revealHorizontalRightPadding: 30,               // 수평 스크롤 여백
      roundedSelection: false,                        // 선택 영역 둥근 모서리 비활성화
      rulers: [],                                     // 수직 가이드 라인 (없음)
      scrollBeyondLastColumn: 5,                      // 마지막 열 이후 스크롤 여백
      selectOnLineNumbers: true,                      // 줄 번호 클릭으로 줄 선택
      selectionClipboard: false,                      // 선택 시 클립보드 자동 복사 비활성화
      useTabStops: true,                              // 탭 정지점 사용
    });

    // 에디터 인스턴스를 ref에 저장하여 다른 함수에서 접근 가능하게 함
    editorRef.current = editor;
    console.log("Monaco Editor 초기화 성공");

    // 커스텀 자동완성 제공자 등록 (언어별 특화 스니펫)
    setupCustomAutocompletion();

    // 에디터 내부 키보드 단축키 등록 (Monaco 전용)
    // 이 단축키들은 에디터에 포커스가 있을 때만 작동함
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave(); // Ctrl+S: 파일 저장
    });

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ,
      () => {
        editor.trigger("keyboard", "redo", {}); // Ctrl+Shift+Z: 재실행
      }
    );

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
      editor.trigger("keyboard", "undo", {}); // Ctrl+Z: 실행취소
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW, () => {
      handleCloseTab(); // Ctrl+W: 탭 닫기
    });

    // 에디터 내용 변경 이벤트 리스너 등록
    // 사용자가 타이핑할 때마다 호출되어 실시간으로 상태 업데이트
    editor.onDidChangeModelContent(() => {
      if (isProgrammaticChange.current) return; // 프로그래밍적 변경 시 무시
      handleEditorChange();
    });

    // 컴포넌트 언마운트 시 정리 함수
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose(); // 에디터 인스턴스 해제
        editorRef.current = null;    // 참조 정리
      }
    };
  }, []);

  // 활성 탭 변경 시 에디터 모델 전환 및 상태 복원
  // 각 탭은 독립적인 Monaco 모델을 가지며, 탭 전환 시 해당 모델로 교체
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return; // 에디터가 아직 초기화되지 않은 경우 무시

    // 이전 활성 탭의 뷰 상태 저장 (커서 위치, 스크롤 위치, 선택 영역 등)
    const prevActiveId = prevActiveIdRef.current;
    if (prevActiveId && prevActiveId !== activeTab?.id) {
      try {
        const viewState = editor.saveViewState(); // 현재 뷰 상태 캡처
        setTabViewState(prevActiveId, viewState);  // 스토어에 저장
      } catch {
        // 뷰 상태 저장 실패 시 무시 (드물게 발생)
      }
    }

    // 활성 탭이 없는 경우 에디터를 빈 상태로 설정
    if (!activeTab) {
      editor.setModel(null);
      return;
    }

    // 이미지 파일인 경우 에디터 대신 이미지 뷰어 사용
    if (activeTab.language === "image") {
      editor.setModel(null);
      return;
    }

    // 파일 URI 생성 및 Monaco 모델 관리
    const targetUri = monaco.Uri.file(activeTab.path);
    const targetUriStr = targetUri.toString();
    
    // 기존 모델 조회 또는 새 모델 생성
    let model = monaco.editor.getModel(targetUri);
    if (!model) {
      // 새 모델 생성 - 파일별 독립적인 편집 히스토리 유지
      model = monaco.editor.createModel(
        activeTab.content,                    // 초기 내용
        activeTab.language || "plaintext",   // 언어 모드 (구문 강조용)
        targetUri                            // 고유 식별자
      );
    }

    // 모델 전환 최적화 - 동일한 모델인 경우 전환 생략
    const currentModel = editor.getModel();
    const switchedModel = !currentModel || currentModel.uri.toString() !== targetUriStr;
    
    if (switchedModel) {
      editor.setModel(model); // 새 모델로 전환
    }

    // 모델 내용 동기화 - ZIP에서 다시 로드된 경우 등
    if (model.getValue() !== activeTab.content) {
      // Undo/Redo 히스토리를 유지하면서 내용 업데이트
      isProgrammaticChange.current = true; // 프로그래밍적 변경 플래그 설정
      
      const fullRange = model.getFullModelRange();
      const prevSel = editor.getSelection(); // 현재 선택 영역 백업
      
      // 전체 내용을 새 내용으로 교체 (히스토리 유지)
      editor.executeEdits("sync-content", [
        { range: fullRange, text: activeTab.content },
      ]);
      model.pushStackElement(); // Undo 스택에 변경점 추가
      
      // 커서 위치 복원 (유효한 위치로 조정)
      if (prevSel) {
        try {
          const pos = model.validatePosition(prevSel.getPosition());
          editor.setPosition(pos);
        } catch {
          // 위치 복원 실패 시 무시
        }
      }
      
      isProgrammaticChange.current = false; // 플래그 해제
    }

    // 뷰 상태 복원 - 탭 전환 시에만 실행
    if (switchedModel) {
      const vs = activeTab.viewState;
      if (vs) {
        try {
          editor.restoreViewState(vs); // 커서, 스크롤, 선택 영역 복원
        } catch {
          // 뷰 상태 복원 실패 시 무시
        }
      }
    }
    
    editor.focus(); // 에디터에 포커스 설정

    // 다음 탭 전환을 위해 현재 탭 ID 저장
    prevActiveIdRef.current = activeTab.id;
  }, [activeTab, setTabViewState]);

  // 에디터 설정 변경 시 실시간 업데이트
  // 사용자가 설정을 변경하면 즉시 에디터에 반영
  useEffect(() => {
    if (!editorRef.current) return;

    editorRef.current.updateOptions({
      theme,                                // 테마 변경 (다크/라이트)
      fontSize,                             // 폰트 크기 변경
      wordWrap: wordWrap ? "on" : "off",   // 줄 바꿈 설정
      minimap: { enabled: minimap },        // 미니맵 표시 여부
    });
  }, [theme, fontSize, wordWrap, minimap]);

  // 메모리 누수 방지: 닫힌 탭의 Monaco 모델 정리
  // 열린 탭에 해당하지 않는 Monaco 모델들을 자동으로 해제하여 메모리 절약
  const openTabs = useEditorStore((state) => state.tabs);
  useEffect(() => {
    // 현재 열린 탭들의 URI 집합 생성
    const openUris = new Set(
      openTabs.map((t) => monaco.Uri.file(t.path).toString())
    );
    
    // 모든 Monaco 모델을 순회하며 사용되지 않는 모델 해제
    monaco.editor.getModels().forEach((m) => {
      const u = m.uri.toString();
      if (!openUris.has(u)) {
        m.dispose(); // 모델 해제 및 메모리 정리
      }
    });
  }, [openTabs]);

  // 브라우저 종료/새로고침 시 저장되지 않은 변경사항 경고
  // 사용자가 실수로 작업 내용을 잃지 않도록 브라우저 기본 경고 표시
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsaved = useEditorStore.getState().hasUnsavedChanges();
      if (hasUnsaved) {
        e.preventDefault();  // 기본 동작 방지
        e.returnValue = "";  // 브라우저 경고 다이얼로그 표시
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // 활성 탭이 없는 경우의 빈 상태 화면
  if (!activeTab) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e1e1e",
          color: "#cccccc",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: "500",
              marginBottom: "8px",
            }}
          >
            Monaco Editor
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#999999",
              fontStyle: "italic",
            }}
          >
            파일 트리에서 파일을 선택하여 편집을 시작하세요
          </div>
        </div>
      </div>
    );
  }

  // 이미지 파일의 경우 전용 뷰어 표시
  if (activeTab.language === "image") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e1e1e",
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <img
            src={activeTab.content}
            alt={activeTab.name}
            style={{
              maxWidth: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
              border: "1px solid #464647",
              borderRadius: "4px",
            }}
          />
          <div
            style={{
              marginTop: "12px",
              fontSize: "12px",
              color: "#999999",
            }}
          >
            {activeTab.name}
          </div>
        </div>
      </div>
    );
  }

  // 메인 에디터 렌더링
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Monaco Editor 컨테이너 */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "calc(100% - 22px)", // 상태바 공간 확보
        }}
      />

      {/* 하단 상태바 - 현재 파일 정보 표시 */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "22px",
          backgroundColor: "#007acc",
          display: "flex",
          alignItems: "center",
          paddingLeft: "12px",
          fontSize: "11px",
          color: "#ffffff",
          zIndex: 1000,
        }}
      >
        {/* 파일명 표시 */}
        <span>{activeTab.name}</span>
        
        {/* 언어 모드 표시 */}
        <span style={{ marginLeft: "12px", opacity: 0.8 }}>
          {activeTab.language}
        </span>
        
        {/* 수정 상태 표시 */}
        {activeTab.isDirty && (
          <span style={{ marginLeft: "12px", opacity: 0.8 }}>
            • 수정됨
          </span>
        )}
        
        {/* 에디터 준비 상태 표시 (디버깅용) */}
        <span style={{ marginLeft: "auto", marginRight: "12px", opacity: 0.6 }}>
          에디터 준비: {editorRef.current ? "완료" : "대기중"}
        </span>
      </div>
    </div>
  );
};
