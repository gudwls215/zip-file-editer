import JSZip from 'jszip';
import type { FileItem, FileNode } from '../types';
import { generateFileId, isTextFile, getFileExtension, isBinaryFile } from '../utils/fileUtils';

export class ZipService {
  private static instance: ZipService;
  private zip: JSZip;

  constructor() {
    this.zip = new JSZip();
  }

  static getInstance(): ZipService {
    if (!ZipService.instance) {
      ZipService.instance = new ZipService();
    }
    return ZipService.instance;
  }

  async extractZipFile(file: File): Promise<FileItem[]> {
    try {
      const zip = new JSZip();
      const zipData = await zip.loadAsync(file);
      const files: FileItem[] = [];

      for (const [path, zipEntry] of Object.entries(zipData.files)) {
        if (zipEntry.dir) {
          // Directory
          files.push({
            id: generateFileId(),
            name: path.split('/').filter(Boolean).pop() || path,
            path: path,
            type: 'directory',
            lastModified: zipEntry.date || new Date()
          });
        } else {
          // File
          let content: string | undefined;
          
          if (isTextFile(path)) {
            try {
              content = await zipEntry.async('text');
            } catch {
              content = '[Binary content - cannot display as text]';
            }
          }

          files.push({
            id: generateFileId(),
            name: path.split('/').pop() || path,
            path: path,
            type: 'file',
            size: 0, // JSZip doesn't provide easy access to uncompressed size
            content,
            lastModified: zipEntry.date || new Date()
          });
        }
      }

      return files;
    } catch (error) {
      console.error('Error extracting ZIP file:', error);
      throw new Error('Failed to extract ZIP file');
    }
  }

  async createZipFile(files: FileItem[]): Promise<Blob> {
    try {
      const zip = new JSZip();

      files.forEach(file => {
        if (file.type === 'directory') {
          zip.folder(file.path);
        } else if (file.content) {
          zip.file(file.path, file.content);
        }
      });

      return await zip.generateAsync({ type: 'blob' });
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      throw new Error('Failed to create ZIP file');
    }
  }

  async parseZipFile(file: File): Promise<FileNode> {
    const arrayBuffer = await file.arrayBuffer();
    this.zip = await JSZip.loadAsync(arrayBuffer);
    
    const rootNode: FileNode = {
      id: 'root',
      name: file.name.replace('.zip', ''),
      path: '',
      type: 'directory',
      children: []
    };

    const pathMap = new Map<string, FileNode>();
    pathMap.set('', rootNode);

    const entries = Object.entries(this.zip.files);
    entries.sort(([a], [b]) => a.localeCompare(b));

    for (const [relativePath, zipEntry] of entries) {
      if (relativePath.endsWith('/')) {
        const dirPath = relativePath.slice(0, -1);
        const dirName = dirPath.split('/').pop() || '';
        const parentPath = dirPath.substring(0, dirPath.lastIndexOf('/'));
        
        const dirNode: FileNode = {
          id: `dir-${dirPath}`,
          name: dirName,
          path: dirPath,
          type: 'directory',
          children: []
        };

        const parent = pathMap.get(parentPath) || rootNode;
        if (!parent.children) parent.children = [];
        parent.children.push(dirNode);
        pathMap.set(dirPath, dirNode);
      } else {
        const fileName = relativePath.split('/').pop() || '';
        const parentPath = relativePath.substring(0, relativePath.lastIndexOf('/'));
        const isBinary = isBinaryFile(fileName);
        
        let content: string | ArrayBuffer;
        if (isBinary) {
          content = await zipEntry.async('arraybuffer');
        } else {
          content = await zipEntry.async('text');
        }

        const fileNode: FileNode = {
          id: `file-${relativePath}`,
          name: fileName,
          path: relativePath,
          type: 'file',
          content,
          size: 0,
          extension: getFileExtension(fileName),
          modified: false
        };

        const parent = pathMap.get(parentPath) || rootNode;
        if (!parent.children) parent.children = [];
        parent.children.push(fileNode);
      }
    }

    return rootNode;
  }

  async createZipFromTree(rootNode: FileNode): Promise<Blob> {
    const newZip = new JSZip();
    
    const addToZip = (node: FileNode, parentPath: string = '') => {
      const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;
      
      if (node.type === 'file' && node.content !== undefined) {
        if (typeof node.content === 'string') {
          newZip.file(fullPath, node.content);
        } else {
          newZip.file(fullPath, node.content);
        }
      } else if (node.type === 'directory' && node.children) {
        if (fullPath) {
          newZip.folder(fullPath);
        }
        node.children.forEach(child => addToZip(child, fullPath));
      }
    };

    if (rootNode.children) {
      rootNode.children.forEach(child => addToZip(child, ''));
    }

    return await newZip.generateAsync({ type: 'blob' });
  }

  isValidZipFile(file: File): boolean {
    const validExtensions = ['.zip', '.jar', '.war', '.ear'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return validExtensions.includes(extension);
  }
}
