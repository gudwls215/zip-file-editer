import { useCallback } from 'react';
import { FileService } from '../services/fileService';
import { ZipService } from '../services/zipService';
import { useFileStore } from '../store/fileStore';
import { buildFileTree } from '../utils/treeUtils';
import type { FileItem } from '../types';

export const useFileSystem = () => {
  const fileStore = useFileStore();
  const fileService = FileService.getInstance();
  const zipService = ZipService.getInstance();

  const processUploadedFiles = useCallback(async (files: FileList) => {
    fileStore.setLoading(true);
    fileStore.setError(null);

    try {
      const fileArray = Array.from(files);
      const processedFiles: FileItem[] = [];

      for (const file of fileArray) {
        if (zipService.isValidZipFile(file)) {
          // Extract ZIP file
          const extractedFiles = await zipService.extractZipFile(file);
          processedFiles.push(...extractedFiles);
        } else {
          // Process as regular file
          const regularFiles = await fileService.processFiles([file]);
          processedFiles.push(...regularFiles);
        }
      }

      fileStore.setFiles(processedFiles);
      
      // Build file tree
      const tree = buildFileTree(processedFiles);
      fileStore.setFileTree(tree);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process files';
      fileStore.setError(errorMessage);
    } finally {
      fileStore.setLoading(false);
    }
  }, [fileStore, fileService, zipService]);

  const downloadFile = useCallback((fileId: string) => {
    const file = fileStore.files.find(f => f.id === fileId);
    if (!file || !file.content) {
      fileStore.setError('File not found or has no content');
      return;
    }

    fileService.downloadFile(file.content, file.name);
  }, [fileStore.files, fileService]);

  const downloadAsZip = useCallback(async () => {
    fileStore.setLoading(true);
    try {
      const zipBlob = await zipService.createZipFile(fileStore.files);
      fileService.downloadBlob(zipBlob, 'archive.zip');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create ZIP file';
      fileStore.setError(errorMessage);
    } finally {
      fileStore.setLoading(false);
    }
  }, [fileStore, zipService, fileService]);

  const selectFile = useCallback((fileId: string) => {
    fileStore.setSelectedFileId(fileId);
  }, [fileStore]);

  const clearAllFiles = useCallback(() => {
    fileStore.clearFiles();
  }, [fileStore]);

  return {
    files: fileStore.files,
    fileTree: fileStore.fileTree,
    selectedFileId: fileStore.selectedFileId,
    isLoading: fileStore.isLoading,
    error: fileStore.error,
    processUploadedFiles,
    downloadFile,
    downloadAsZip,
    selectFile,
    clearAllFiles,
  };
};
