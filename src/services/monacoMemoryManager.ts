import * as monaco from 'monaco-editor';

/**
 * 🧠 Monaco Editor 메모리 관리자
 * 
 * WeakSet을 활용하여 Monaco 모델의 생명주기를 추적하고
 * 탭이 닫힐 때 자동으로 메모리를 정리하는 싱글톤 서비스
 */
export class MonacoMemoryManager {
  private static instance: MonacoMemoryManager;
  
  /**
   * WeakSet: 가비지 컬렉션에 영향을 주지 않는 약한 참조 컬렉션
   * - 모델이 다른 곳에서 참조되지 않으면 자동으로 WeakSet에서도 제거됨
   * - 메모리 누수 방지에 핵심적인 역할
   */
  private modelTracker = new WeakSet<monaco.editor.ITextModel>();
  
  /**
   * 강한 참조 맵: 탭 ID와 Monaco 모델 매핑
   * - 실제 모델 dispose를 위해 필요한 강한 참조
   * - 탭 제거 시 명시적으로 정리됨
   */
  private modelRegistry = new Map<string, monaco.editor.ITextModel>();
  
  /**
   * URI 레지스트리: 파일 경로별 모델 중복 방지
   * - 같은 파일을 여러 탭에서 열 때 모델 재사용
   */
  private uriRegistry = new Map<string, monaco.editor.ITextModel>();
  
  /**
   * 활성 모델 카운터: 메모리 사용량 추적
   */
  private activeModelCount = 0;

  /**
   * 싱글톤 패턴 구현
   */
  static getInstance(): MonacoMemoryManager {
    if (!this.instance) {
      this.instance = new MonacoMemoryManager();
      console.log('🧠 MonacoMemoryManager 인스턴스 생성');
    }
    return this.instance;
  }

  /**
   * 새로운 Monaco 모델 생성 및 등록
   * 
   * @param tabId - 탭 고유 식별자
   * @param filePath - 파일 경로 (URI 생성용)
   * @param content - 파일 내용
   * @param language - 프로그래밍 언어
   */
  createAndRegisterModel(
    tabId: string, 
    filePath: string, 
    content: string, 
    language: string = 'plaintext'
  ): monaco.editor.ITextModel {
    // 1️⃣ 기존 모델이 있는지 확인 (파일 경로 기준)
    const existingModel = this.uriRegistry.get(filePath);
    if (existingModel && !existingModel.isDisposed()) {
      // 기존 모델 재사용 (메모리 효율성)
      this.modelRegistry.set(tabId, existingModel);
      console.log(`♻️ 기존 모델 재사용: ${filePath}`);
      return existingModel;
    }

    // 2️⃣ 새로운 URI 생성
    const uri = monaco.Uri.file(filePath);
    
    // 3️⃣ Monaco 모델 생성
    const model = monaco.editor.createModel(content, language, uri);
    
    // 4️⃣ 메모리 추적 시스템에 등록
    this.registerModel(tabId, filePath, model);
    
    console.log(`✨ 새 모델 생성: ${filePath} (탭: ${tabId})`);
    return model;
  }

  /**
   * 기존 모델을 메모리 추적 시스템에 등록 (레거시 지원)
   */
  registerModel(tabId: string, model: monaco.editor.ITextModel): void;
  registerModel(tabId: string, filePath: string, model: monaco.editor.ITextModel): void;
  registerModel(tabId: string, filePathOrModel: string | monaco.editor.ITextModel, model?: monaco.editor.ITextModel): void {
    let actualModel: monaco.editor.ITextModel;
    let actualFilePath: string;

    if (typeof filePathOrModel === 'string' && model) {
      // 새로운 시그니처: registerModel(tabId, filePath, model)
      actualModel = model;
      actualFilePath = filePathOrModel;
    } else {
      // 기존 시그니처: registerModel(tabId, model)
      actualModel = filePathOrModel as monaco.editor.ITextModel;
      actualFilePath = actualModel.uri.path;
    }

    // WeakSet에 추가 (약한 참조로 추적)
    this.modelTracker.add(actualModel);
    
    // 강한 참조 맵에 추가
    this.modelRegistry.set(tabId, actualModel);
    this.uriRegistry.set(actualFilePath, actualModel);
    
    // 통계 업데이트
    this.activeModelCount++;
    
    console.log(`📝 모델 등록: ${actualFilePath} | 활성 모델: ${this.activeModelCount}개`);
  }

  /**
   * 🗑️ 탭 닫기 시 모델 정리 (핵심 기능!)
   * 
   * @param tabId - 정리할 탭 ID
   */
  disposeModel(tabId: string): void {
    const model = this.modelRegistry.get(tabId);
    
    if (!model) {
      console.warn(`⚠️ 탭 ${tabId}에 대한 모델을 찾을 수 없음`);
      return;
    }

    // 이미 dispose된 모델인지 확인
    if (model.isDisposed()) {
      console.log(`♻️ 모델이 이미 정리됨: ${tabId}`);
      this.modelRegistry.delete(tabId);
      return;
    }

    // URI 레지스트리에서 제거
    const uri = model.uri.path;
    this.uriRegistry.delete(uri);
    
    // 강한 참조 제거
    this.modelRegistry.delete(tabId);
    
    // Monaco 모델 dispose (메모리 해제!)
    model.dispose();
    
    // 통계 업데이트
    this.activeModelCount = Math.max(0, this.activeModelCount - 1);
    
    console.log(`🗑️ 모델 정리 완료: ${uri} | 남은 모델: ${this.activeModelCount}개`);
  }

  /**
   * 특정 탭의 모델 가져오기
   */
  getModelForTab(tabId: string): monaco.editor.ITextModel | undefined {
    return this.modelRegistry.get(tabId);
  }

  /**
   * 🧹 메모리 누수 감지 및 정리 (레거시 메서드)
   */
  cleanup(): number {
    return this.detectAndCleanLeaks();
  }

  /**
   * 🧹 전체 메모리 정리 (애플리케이션 종료 시)
   */
  disposeAll(): void {
    console.log(`🧹 전체 메모리 정리 시작: ${this.activeModelCount}개 모델`);
    
    // 모든 모델 dispose
    this.modelRegistry.forEach((model, tabId) => {
      if (!model.isDisposed()) {
        model.dispose();
        console.log(`🗑️ 정리: ${tabId}`);
      }
    });
    
    // 레지스트리 초기화
    this.modelRegistry.clear();
    this.uriRegistry.clear();
    this.activeModelCount = 0;
    
    console.log('✅ 전체 메모리 정리 완료');
  }

  /**
   * 🔍 메모리 사용량 진단
   */
  getMemoryStats() {
    const stats = {
      activeModels: this.activeModelCount,
      registeredTabs: this.modelRegistry.size,
      registeredUris: this.uriRegistry.size,
      weakSetTracking: 'WeakSet으로 추적 중'
    };
    
    console.table(stats);
    return stats;
  }

  /**
   * 🔧 메모리 누수 감지 및 정리
   */
  detectAndCleanLeaks(): number {
    let cleanedCount = 0;
    
    // dispose된 모델들을 레지스트리에서 제거
    for (const [tabId, model] of this.modelRegistry.entries()) {
      if (model.isDisposed()) {
        this.modelRegistry.delete(tabId);
        cleanedCount++;
        console.log(`🧹 누수 모델 정리: ${tabId}`);
      }
    }
    
    // URI 레지스트리도 정리
    for (const [uri, model] of this.uriRegistry.entries()) {
      if (model.isDisposed()) {
        this.uriRegistry.delete(uri);
        console.log(`🧹 누수 URI 정리: ${uri}`);
      }
    }
    
    this.activeModelCount = this.modelRegistry.size;
    
    if (cleanedCount > 0) {
      console.log(`🧹 메모리 누수 정리 완료: ${cleanedCount}개 모델`);
    }
    
    return cleanedCount;
  }
}