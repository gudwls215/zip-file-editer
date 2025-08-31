import React, { lazy, Suspense } from "react";
import { MonacoEditorProps, MonacoEditorRef } from "./MonacoEditorComponent";

// Monaco Editor를 동적으로 로드
const MonacoEditorComponent = lazy(() =>
  import("./MonacoEditorComponent").then((module) => ({
    default: module.default,
  }))
);

// 로딩 컴포넌트
const EditorSkeleton = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      backgroundColor: "#1e1e1e",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#cccccc",
      fontSize: "14px",
    }}
  >
    Loading Editor...
  </div>
);

// Lazy Monaco Editor Wrapper
const LazyMonacoEditor = React.forwardRef<MonacoEditorRef, MonacoEditorProps>(
  (props, ref) => {
    return (
      <Suspense fallback={<EditorSkeleton />}>
        <MonacoEditorComponent {...props} ref={ref} />
      </Suspense>
    );
  }
);

LazyMonacoEditor.displayName = "LazyMonacoEditor";

export default LazyMonacoEditor;
