/// <reference types="vite/client" />

declare module 'monaco-editor/esm/vs/editor/editor.worker?worker' {
	const EditorWorkerFactory: { new (): Worker };
	export default EditorWorkerFactory;
}

declare module 'monaco-editor/esm/vs/language/json/json.worker?worker' {
	const JsonWorkerFactory: { new (): Worker };
	export default JsonWorkerFactory;
}

declare module 'monaco-editor/esm/vs/language/css/css.worker?worker' {
	const CssWorkerFactory: { new (): Worker };
	export default CssWorkerFactory;
}

declare module 'monaco-editor/esm/vs/language/html/html.worker?worker' {
	const HtmlWorkerFactory: { new (): Worker };
	export default HtmlWorkerFactory;
}

declare module 'monaco-editor/esm/vs/language/typescript/ts.worker?worker' {
	const TsWorkerFactory: { new (): Worker };
	export default TsWorkerFactory;
}
