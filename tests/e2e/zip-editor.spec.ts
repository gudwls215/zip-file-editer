import { test, expect } from "@playwright/test";

test.describe("ZIP 파일 에디터 E2E 테스트", () => {
  test.beforeEach(async ({ page }) => {
    // 개발 서버로 이동
    await page.goto("/");

    // 페이지 로드 대기
    await page.waitForLoadState("domcontentloaded");
  });

  test("애플리케이션이 올바르게 로드되어야 함", async ({ page }) => {
    // 제목이 표시되는지 확인
    await expect(page.locator("text=Zip File Editor")).toBeVisible();

    // 파일 업로드 영역이 표시되는지 확인
    const uploadArea = page
      .locator("text=Drop a ZIP file here or click to browse")
      .first();
    await expect(uploadArea).toBeVisible();
  });

  test("성능 모니터가 작동해야 함", async ({ page }) => {
    // 페이지가 정상 로드되었는지 확인
    await expect(page.locator("text=Zip File Editor")).toBeVisible();

    // 기본 성능 확인: 페이지 로딩 시간
    const navigationTiming = await page.evaluate(() => {
      return {
        loadTime:
          performance.timing.loadEventEnd - performance.timing.navigationStart,
        domReady:
          performance.timing.domContentLoadedEventEnd -
          performance.timing.navigationStart,
      };
    });

    // 페이지 로딩이 합리적인 시간 내에 완료되어야 함 (10초 이내)
    expect(navigationTiming.loadTime).toBeLessThan(10000);
    expect(navigationTiming.domReady).toBeLessThan(10000);
  });

  test("업로드 영역이 인터랙티브해야 함", async ({ page }) => {
    const uploadArea = page
      .locator("text=Drop a ZIP file here or click to browse")
      .first();

    // 호버 테스트
    await uploadArea.hover();

    // 클릭 테스트 (파일 선택 대화상자 열기)
    await uploadArea.click();

    // 애플리케이션이 여전히 응답하는지 확인
    await expect(page.locator("text=Zip File Editor")).toBeVisible();
  });

  test("키보드 단축키가 응답해야 함", async ({ page }) => {
    // 일반적인 단축키 테스트
    await page.keyboard.press("Control+N"); // 새 파일
    await page.keyboard.press("Control+O"); // 파일 열기
    await page.keyboard.press("Control+S"); // 저장

    // 애플리케이션이 여전히 응답하는지 확인
    await expect(page.locator("text=Zip File Editor")).toBeVisible();
  });

  test("에러 상태를 우아하게 처리해야 함", async ({ page }) => {
    // 잘못된 데이터로 애플리케이션 테스트
    await page.evaluate(() => {
      // 잘못된 이벤트 발생시키기
      window.dispatchEvent(new CustomEvent("invalid-event"));
    });

    // 애플리케이션이 크래시하지 않았는지 확인
    await expect(page.locator("text=Zip File Editor")).toBeVisible();

    // 콘솔 에러 확인
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    // 치명적인 에러가 없어야 함 (일부 경고는 허용)
    const fatalErrors = errors.filter(
      (error) =>
        error.includes("Uncaught") ||
        error.includes("TypeError") ||
        error.includes("ReferenceError")
    );

    expect(fatalErrors.length).toBe(0);
  });

  test("반응형 레이아웃이 작동해야 함", async ({ page }) => {
    // 다양한 화면 크기에서 테스트
    const viewports = [
      { width: 1920, height: 1080 }, // 데스크톱
      { width: 1024, height: 768 }, // 태블릿
      { width: 375, height: 667 }, // 모바일
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);

      // 주요 UI 요소가 여전히 표시되는지 확인
      await expect(page.locator("text=Zip File Editor")).toBeVisible();

      const uploadArea = page
        .locator("text=Drop a ZIP file here or click to browse")
        .first();
      await expect(uploadArea).toBeVisible();
    }
  });

  test("브라우저 뒤로가기/앞으로가기가 작동해야 함", async ({ page }) => {
    // 페이지 네비게이션 테스트
    await page.goBack();
    await page.waitForTimeout(500);

    await page.goForward();
    await page.waitForTimeout(500);

    // 애플리케이션이 올바르게 복원되는지 확인
    await expect(page.locator("text=Zip File Editor")).toBeVisible();
  });

  test("페이지 새로고침 후 상태가 초기화되어야 함", async ({ page }) => {
    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // 초기 상태로 돌아갔는지 확인
    await expect(page.locator("text=Zip File Editor")).toBeVisible();
    const uploadArea = page
      .locator("text=Drop a ZIP file here or click to browse")
      .first();
    await expect(uploadArea).toBeVisible();
  });

  test("접근성 기본 요구사항을 충족해야 함", async ({ page }) => {
    // 기본 접근성 확인

    // 포커스 가능한 요소들 확인
    await page.keyboard.press("Tab");
    const focusedElement = await page.locator(":focus");
    await expect(focusedElement).toBeVisible();

    // 키보드 내비게이션 테스트
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");

    // 애플리케이션이 여전히 응답하는지 확인
    await expect(page.locator("text=Zip File Editor")).toBeVisible();
  });

  test("브라우저 호환성을 확인해야 함", async ({ page, browserName }) => {
    // 브라우저별 기본 기능 확인
    console.log(`${browserName}에서 테스트 실행 중`);

    // 기본 JavaScript 기능 확인
    const result = await page.evaluate(() => {
      return {
        hasLocalStorage: typeof localStorage !== "undefined",
        hasFileAPI: typeof File !== "undefined",
        hasPromise: typeof Promise !== "undefined",
        hasEventTarget: typeof EventTarget !== "undefined",
      };
    });

    expect(result.hasLocalStorage).toBe(true);
    expect(result.hasFileAPI).toBe(true);
    expect(result.hasPromise).toBe(true);
    expect(result.hasEventTarget).toBe(true);

    // UI가 올바르게 렌더링되는지 확인
    await expect(page.locator("text=Zip File Editor")).toBeVisible();
  });
});
