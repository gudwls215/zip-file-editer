import type { FileItem } from '../types';

export class FileService {
  private static instance: FileService;

  static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  downloadFile(content: string, filename: string, contentType = 'text/plain'): void {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  validateFile(file: File, maxSize: number, allowedTypes: string[]): boolean {
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      throw new Error(`File type ${fileExtension} is not supported`);
    }

    return true;
  }

  async processFiles(files: FileList | File[]): Promise<FileItem[]> {
    const fileArray = Array.from(files);
    const processedFiles: FileItem[] = [];

    for (const file of fileArray) {
      try {
        const content = await this.readFileAsText(file);
        processedFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          path: file.name,
          type: 'file',
          size: file.size,
          content,
          lastModified: new Date(file.lastModified)
        });
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error);
      }
    }

    return processedFiles;
  }
}
