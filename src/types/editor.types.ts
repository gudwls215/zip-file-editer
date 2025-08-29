export interface EditorState {
  openFiles: string[];
  activeFileId: string | null;
  fileContents: Record<string, string>;
  unsavedChanges: Record<string, boolean>;
}

export interface MonacoEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  theme?: string;
  readOnly?: boolean;
}

export interface EditorTab {
  id: string;
  name: string;
  path: string;
  isModified: boolean;
  language: string;
}
