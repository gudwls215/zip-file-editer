export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  content?: string;
  children?: FileItem[];
  lastModified?: Date;
}

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: ArrayBuffer | string;
  modified?: boolean;
  size?: number;
  extension?: string;
}

export interface FileSystemState {
  rootNode: FileNode | null;
  flatMap: Map<string, FileNode>;
}

export type FileContent = {
  path: string;
  content: string | ArrayBuffer;
  type: 'text' | 'binary' | 'image';
};

export interface FileTreeNode extends FileItem {
  expanded?: boolean;
  depth: number;
  parentId?: string;
}

export interface ZipEntry {
  filename: string;
  content: Uint8Array;
  isDirectory: boolean;
  size: number;
  lastModified: Date;
}
