import React from 'react';
import { FILE_ICONS } from '../../utils/constants';
import { getFileExtension } from '../../utils/fileUtils';

interface FileIconProps {
  fileName: string;
  isDirectory: boolean;
  isExpanded?: boolean;
}

export const FileIcon: React.FC<FileIconProps> = ({
  fileName,
  isDirectory,
  isExpanded = false,
}) => {
  if (isDirectory) {
    return <span>{isExpanded ? FILE_ICONS.folderOpen : FILE_ICONS.folder}</span>;
  }

  const extension = getFileExtension(fileName);
  
  const getFileIcon = (ext: string): string => {
    switch (ext) {
      case 'js':
      case 'jsx':
        return FILE_ICONS.javascript;
      case 'ts':
      case 'tsx':
        return FILE_ICONS.typescript;
      case 'html':
        return FILE_ICONS.html;
      case 'css':
      case 'scss':
      case 'sass':
        return FILE_ICONS.css;
      case 'json':
        return FILE_ICONS.json;
      case 'md':
        return FILE_ICONS.markdown;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return FILE_ICONS.image;
      case 'mp4':
      case 'avi':
      case 'mov':
        return FILE_ICONS.video;
      case 'mp3':
      case 'wav':
      case 'flac':
        return FILE_ICONS.audio;
      case 'zip':
      case 'rar':
      case '7z':
        return FILE_ICONS.archive;
      default:
        return FILE_ICONS.file;
    }
  };

  return <span>{getFileIcon(extension)}</span>;
};
