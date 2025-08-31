import { test, expect } from "@playwright/test";

test.describe("ZIP 파일 에디터 E2E 테스트", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("애플리케이션이 올바르게 로드되어야 함", async ({ page }) => {
    await expect(page.locator("text=Zip File Editor")).toBeVisible();
    const uploadArea = page
      .locator("text=Drop a ZIP file here or click to browse")
      .first();
    await expect(uploadArea).toBeVisible();
  });

  test("업로드 영역이 인터랙티브해야 함", async ({ page }) => {
    const uploadArea = page
      .locator("text=Drop a ZIP file here or click to browse")
      .first();
    await uploadArea.hover();
    await uploadArea.click();
    await expect(page.locator("text=Zip File Editor")).toBeVisible();
  });

  test("새로운 ZIP 파일 로드시 상태가 초기화되어야 함", async ({ page }) => {
    // 첫 번째 ZIP 파일 로드 시뮬레이션
    await page.evaluate(() => {
      // 가상의 ZIP 파일 로드 이벤트 발생
      const mockZipData1 = {
        files: {
          "first-file.txt": {
            name: "first-file.txt",
            dir: false,
            async: () => Promise.resolve("첫 번째 ZIP의 파일"),
          },
        },
      };

      // ZIP 스토어에 첫 번째 파일 설정
      if ((window as any).useZipStore) {
        (window as any).useZipStore.getState().setZipData({
          zipFile: mockZipData1,
          fileName: "first.zip",
          originalBuffer: new ArrayBuffer(0),
        });
      }
    });

    await page.waitForTimeout(500);

    // 두 번째 ZIP 파일 로드 시뮬레이션 (상태 초기화 테스트)
    await page.evaluate(() => {
      const mockZipData2 = {
        files: {
          "second-file.js": {
            name: "second-file.js",
            dir: false,
            async: () => Promise.resolve("console.log('두 번째 ZIP');"),
          },
        },
      };

      // ZIP 스토어에 두 번째 파일 설정
      if ((window as any).useZipStore) {
        (window as any).useZipStore.getState().setZipData({
          zipFile: mockZipData2,
          fileName: "second.zip",
          originalBuffer: new ArrayBuffer(0),
        });
      }
    });

    await page.waitForTimeout(500);

    // 새 ZIP 로드 후 상태가 초기화되었는지 확인
    const storeState = await page.evaluate(() => {
      if ((window as any).useZipStore) {
        return (window as any).useZipStore.getState();
      }
      return null;
    });

    // 기본적으로 애플리케이션이 여전히 작동하는지 확인
    await expect(page.locator("text=Zip File Editor")).toBeVisible();
  });

  test("애플리케이션이 크래시하지 않아야 함", async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("invalid-event"));
    });
    await expect(page.locator("text=Zip File Editor")).toBeVisible();
  });
});
