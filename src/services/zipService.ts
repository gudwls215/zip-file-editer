import JSZip from 'jszip';
import type { FileItem } from '../types';
import { generateFileId, isTextFile } from '../utils/fileUtils';

export class ZipService {
  private static instance: ZipService;

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

  isValidZipFile(file: File): boolean {
    const validExtensions = ['.zip', '.jar', '.war', '.ear'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return validExtensions.includes(extension);
  }
}
