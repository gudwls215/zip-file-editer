import React, { memo } from 'react';
import { FILE_ICONS } from '../../utils/constants';
import { getFileExtension } from '../../utils/fileUtils';
import styled from 'styled-components';

interface FileIconProps {
  fileName: string;
  isDirectory: boolean;
  isExpanded?: boolean;
}

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 14px;
  margin-right: 6px;
  flex-shrink: 0;
`;

// Performance: Use memo to prevent unnecessary re-renders
export const FileIcon: React.FC<FileIconProps> = memo(({
  fileName,
  isDirectory,
  isExpanded = false,
}) => {
  const getIcon = (): string => {
    if (isDirectory) {
      return isExpanded ? FILE_ICONS['folder-open'] : FILE_ICONS.folder;
    }

    const extension = getFileExtension(fileName);
    
    // Try to get specific icon for extension
    if (FILE_ICONS[extension]) {
      return FILE_ICONS[extension];
    }

    // Fallback to default file icon
    return FILE_ICONS.file;
  };

  return (
    <IconWrapper>
      {getIcon()}
    </IconWrapper>
  );
});

FileIcon.displayName = 'FileIcon';
