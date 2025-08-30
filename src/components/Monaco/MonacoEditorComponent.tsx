import { useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import * as monaco from 'monaco-editor';
import { MonacoService } from '../../services/monacoService';

export interface MonacoEditorProps {
  value?: string;
  language?: string;
  theme?: string;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  width?: string | number;
  height?: string | number;
  onChange?: (value: string) => void;
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  onBeforeMount?: () => void;
  className?: string;
  uri?: string;
  readOnly?: boolean;
}

export interface MonacoEditorRef {
  editor: monaco.editor.IStandaloneCodeEditor | null;
  focus: () => void;
  getPosition: () => monaco.Position | null;
  setPosition: (position: monaco.Position) => void;
  getSelection: () => monaco.Selection | null;
  setSelection: (selection: monaco.Range) => void;
  getValue: () => string;
  setValue: (value: string) => void;
  insertText: (text: string) => void;
  executeEdits: (edits: monaco.editor.IIdentifiedSingleEditOperation[]) => void;
}

const MonacoEditorComponent = forwardRef<MonacoEditorRef, MonacoEditorProps>(({
  value = '',
  language,
  theme = 'vs-dark',
  options = {},
  width = '100%',
  height = '100%',
  onChange,
  onMount,
  onBeforeMount,
  className,
  uri,
  readOnly = false
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const modelRef = useRef<monaco.editor.ITextModel | null>(null);
  const monacoService = useMemo(() => MonacoService.getInstance(), []);

  // Expose editor methods through ref
  useImperativeHandle(ref, () => ({
    editor: editorRef.current,
    focus: () => editorRef.current?.focus(),
    getPosition: () => editorRef.current?.getPosition() || null,
    setPosition: (position: monaco.Position) => editorRef.current?.setPosition(position),
    getSelection: () => editorRef.current?.getSelection() || null,
    setSelection: (selection: monaco.Range) => editorRef.current?.setSelection(selection),
    getValue: () => editorRef.current?.getValue() || '',
    setValue: (newValue: string) => editorRef.current?.setValue(newValue),
    insertText: (text: string) => {
      const editor = editorRef.current;
      if (editor) {
        const position = editor.getPosition();
        if (position) {
          editor.executeEdits('insert-text', [{
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            text
          }]);
        }
      }
    },
    executeEdits: (edits: monaco.editor.IIdentifiedSingleEditOperation[]) => {
      editorRef.current?.executeEdits('external', edits);
    }
  }), []);

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    const initEditor = async () => {
      try {
        onBeforeMount?.();
        await monacoService.initialize();

        const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
          theme,
          readOnly,
          ...options
        };

        const editor = monacoService.createEditor(containerRef.current!, editorOptions);
        editorRef.current = editor;

        // Create or get model
        if (uri) {
          const model = monacoService.getOrCreateModel(uri, value, language);
          modelRef.current = model;
          editor.setModel(model);
        } else {
          // Create anonymous model
          const tempUri = `inmemory://model/${Math.random()}`;
          const model = monacoService.getOrCreateModel(tempUri, value, language);
          modelRef.current = model;
          editor.setModel(model);
        }

        // Setup change listener
        const disposable = editor.onDidChangeModelContent(() => {
          const newValue = editor.getValue();
          onChange?.(newValue);
        });

        onMount?.(editor);

        return () => {
          disposable.dispose();
          editor.dispose();
          if (modelRef.current && !uri) {
            // Only dispose anonymous models
            modelRef.current.dispose();
          }
        };
      } catch (error) {
        console.error('Failed to initialize Monaco Editor:', error);
      }
    };

    const cleanup = initEditor();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  // Update value when prop changes
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  // Update theme
  useEffect(() => {
    monaco.editor.setTheme(theme);
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width,
        height,
        overflow: 'hidden'
      }}
    />
  );
});

MonacoEditorComponent.displayName = 'MonacoEditorComponent';

export default MonacoEditorComponent;
