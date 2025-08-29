import { useCallback } from 'react';
import { ZipService } from '../services/zipService';
import { FileService } from '../services/fileService';
import type { FileItem } from '../types';

export const useZipHandler = () => {
  const zipService = ZipService.getInstance();
  const fileService = FileService.getInstance();

  const extractZip = useCallback(async (file: File): Promise<FileItem[]> => {
    if (!zipService.isValidZipFile(file)) {
      throw new Error('Invalid ZIP file');
    }

    return await zipService.extractZipFile(file);
  }, [zipService]);

  const createZip = useCallback(async (files: FileItem[]): Promise<Blob> => {
    return await zipService.createZipFile(files);
  }, [zipService]);

  const downloadZip = useCallback(async (files: FileItem[], filename = 'archive.zip') => {
    try {
      const zipBlob = await zipService.createZipFile(files);
      fileService.downloadBlob(zipBlob, filename);
    } catch (error) {
      throw new Error(`Failed to create ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [zipService, fileService]);

  const isZipFile = useCallback((file: File): boolean => {
    return zipService.isValidZipFile(file);
  }, [zipService]);

  return {
    extractZip,
    createZip,
    downloadZip,
    isZipFile,
  };
};
