import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: "dist/stats.html",
      open: false, // 자동으로 열지 않음
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
      "@components": "/src/components",
      "@hooks": "/src/hooks",
      "@services": "/src/services",
      "@store": "/src/store",
      "@types": "/src/types",
      "@utils": "/src/utils",
    },
  },
  optimizeDeps: {
    include: ["monaco-editor"],
    // 불필요한 워커들 제외
    exclude: [
      "monaco-editor/esm/vs/editor/editor.worker",
      "monaco-editor/esm/vs/language/json/json.worker",
      "monaco-editor/esm/vs/language/css/css.worker",
      "monaco-editor/esm/vs/language/html/html.worker",
      "monaco-editor/esm/vs/language/typescript/ts.worker",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Monaco Editor 및 관련 워커들을 분리
          if (id.includes("monaco-editor")) {
            if (id.includes("worker")) {
              return "monaco-workers";
            }
            return "monaco-core";
          }

          // Node modules 벤더 분리
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            if (id.includes("zustand")) {
              return "state-vendor";
            }
            if (id.includes("jszip") || id.includes("file-saver")) {
              return "file-vendor";
            }
            if (id.includes("styled-components")) {
              return "style-vendor";
            }
            return "vendor";
          }

          // 애플리케이션 코드 분리
          if (id.includes("/src/components/Editor/")) {
            return "editor-components";
          }
          if (id.includes("/src/components/")) {
            return "ui-components";
          }
          if (id.includes("/src/store/")) {
            return "store";
          }
          if (id.includes("/src/services/")) {
            return "services";
          }
        },
      },
    },
    // 청크 크기 경고 임계값 조정
    chunkSizeWarningLimit: 1000,
    // 압축 최적화
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // 프로덕션에서 console.log 제거
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info"], // 특정 함수 호출 제거
      },
    },
  },
});
