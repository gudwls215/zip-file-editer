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
        manualChunks: {
          // Monaco를 별도 청크로 분리 (필요할 때만 로드)
          "monaco-core": ["monaco-editor"],
          vendor: ["react", "react-dom", "zustand"],
          utils: ["jszip", "file-saver"],
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
