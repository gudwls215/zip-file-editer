import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright 설정
 * @see https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.{test,spec}.{js,ts}",
  /* 병렬 테스트 실행 */
  fullyParallel: true,
  /* CI에서 실패시 재시도 금지 */
  forbidOnly: !!process.env.CI,
  /* CI에서 재시도 횟수 */
  retries: process.env.CI ? 2 : 0,
  /* 워커 개수 */
  workers: process.env.CI ? 1 : undefined,
  /* 리포터 설정 */
  reporter: "html",
  /* 모든 테스트에서 공유되는 설정 */
  use: {
    /* 베이스 URL로 page.goto('/')를 사용할 수 있습니다 */
    baseURL: "http://localhost:5174",

    /* 실패한 테스트의 스크린샷 수집 */
    screenshot: "only-on-failure",

    /* 실패한 테스트의 비디오 수집 */
    video: "retain-on-failure",

    /* 실패한 테스트의 트레이스 수집 */
    trace: "on-first-retry",
  },

  /* 프로젝트별 설정 */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* 모바일 브라우저 테스트 */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Microsoft Edge, Google Chrome에서 브랜드 채널 테스트 */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* 테스트 시작 전 개발 서버 실행 */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5174",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
