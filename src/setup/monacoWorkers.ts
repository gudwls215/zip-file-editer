/**
 * Monaco Editor Worker Setup - Vite 환경에서의 Monaco Editor Worker 설정
 *
 * 목적:
 * - Vite 빌드 시스템과 Monaco Editor Worker 통합
 * - 지연 로딩으로 초기 번들 크기 최소화
 * - Worker 캐싱으로 성능 최적화
 * - 브라우저 호환성 보장
 *
 * Vite 특화 기능:
 * - ?worker 쿼리로 Worker 파일 인식
 * - ES 모듈 기반 동적 import
 * - 개발/프로덕션 환경 최적화
 *
 * 성능 최적화 전략:
 * - 필요할 때만 Worker 로딩 (Lazy Loading)
 * - Worker 인스턴스 캐싱 및 재사용
 * - 언어별 Worker 분리로 메모리 효율성
 */

/**
 * 언어별 Worker 동적 Import 함수들
 *
 * Vite의 특징:
 * - ?worker 쿼리로 Worker 모듈 식별
 * - import() 문으로 Code Splitting 지원
 * - 번들러가 Worker 코드를 별도 청크로 분리
 *
 * 성능 이점:
 * - 사용하지 않는 언어 Worker는 로딩하지 않음
 * - 초기 JavaScript 번들 크기 감소
 * - 필요시에만 네트워크 요청 발생
 */
const getEditorWorker = () =>
  import("monaco-editor/esm/vs/editor/editor.worker?worker"); // 기본 에디터 Worker
const getJsonWorker = () =>
  import("monaco-editor/esm/vs/language/json/json.worker?worker"); // JSON 언어 서버
const getCssWorker = () =>
  import("monaco-editor/esm/vs/language/css/css.worker?worker"); // CSS 언어 서버
const getHtmlWorker = () =>
  import("monaco-editor/esm/vs/language/html/html.worker?worker"); // HTML 언어 서버
const getTsWorker = () =>
  import("monaco-editor/esm/vs/language/typescript/ts.worker?worker"); // TS/JS 언어 서버

/**
 * Worker 캐시 시스템
 *
 * 캐싱 전략:
 * - 언어별 Worker 클래스를 메모리에 캐시
 * - 동일한 언어 재사용 시 즉시 Worker 생성
 * - 메모리 사용량과 로딩 시간의 균형
 *
 * 캐시 키:
 * - 언어 라벨 (json, css, html, typescript 등)
 * - Map 자료구조로 O(1) 조회 성능
 */
const workerCache = new Map<string, any>();

/**
 * Monaco Environment 설정 (브라우저 전용)
 *
 * 설정 목적:
 * - Monaco Editor가 Worker를 요청할 때 적절한 Worker 제공
 * - 언어별 Worker 라우팅
 * - 지연 로딩 및 캐싱 적용
 *
 * 브라우저 체크:
 * - SSR 환경에서는 window 객체가 없으므로 조건부 실행
 * - Node.js 환경에서의 에러 방지
 */
if (typeof window !== "undefined") {
  (window as any).MonacoEnvironment = {
    /**
     * Worker 팩토리 함수
     *
     * 매개변수:
     * - _: 사용하지 않는 첫 번째 인자
     * - label: 언어 식별자 (Monaco가 요청하는 언어 타입)
     *
     * 동작 과정:
     * 1. 캐시에서 해당 언어 Worker 클래스 확인
     * 2. 캐시에 있으면 즉시 인스턴스 생성
     * 3. 없으면 동적 import로 Worker 모듈 로딩
     * 4. 로딩된 Worker 클래스를 캐시에 저장
     * 5. 새 Worker 인스턴스 반환
     */
    async getWorker(_: any, label: string) {
      // 캐시된 Worker 클래스 확인
      if (workerCache.has(label)) {
        const WorkerClass = workerCache.get(label);
        return new WorkerClass();
      }

      let WorkerModule;

      // 언어별 Worker 모듈 동적 로딩
      switch (label) {
        case "json":
          WorkerModule = await getJsonWorker();
          break;
        case "css":
        case "scss":
        case "less":
          WorkerModule = await getCssWorker();
          break;
        case "html":
        case "handlebars":
        case "razor":
          WorkerModule = await getHtmlWorker();
          break;
        case "typescript":
        case "javascript":
          WorkerModule = await getTsWorker();
          break;
        default:
          // 알 수 없는 언어는 기본 에디터 Worker 사용
          WorkerModule = await getEditorWorker();
          break;
      }

      // Worker 클래스 캐시에 저장
      const WorkerClass = WorkerModule.default;
      workerCache.set(label, WorkerClass);

      // 새 Worker 인스턴스 생성 및 반환
      return new WorkerClass();
    },
  };
}

/**
 * 모듈 Export
 *
 * 빈 export로 이 파일을 모듈로 인식시킴
 * - TypeScript 컴파일러가 모듈로 처리
 * - 부수 효과(side effect)만 수행하는 모듈
 * - import 시 즉시 MonacoEnvironment 설정 실행
 *
 * 사용법:
 * import './setup/monacoWorkers'; // 부수 효과만 실행
 */
export {};
