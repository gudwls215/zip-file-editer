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

export interface ZipEntry {
  filename: string;
  content: Uint8Array;
  isDirectory: boolean;
  size: number;
  lastModified: Date;
}

export interface FileTreeNode extends FileItem {
  expanded?: boolean;
  depth: number;
  parentId?: string;
}
