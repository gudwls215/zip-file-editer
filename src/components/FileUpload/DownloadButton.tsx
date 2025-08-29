import React from 'react';
import { useFileSystem } from '../../hooks/useFileSystem';
import styled from 'styled-components';

interface DownloadButtonProps {
  disabled?: boolean;
}

const StyledButton = styled.button<{ $isDisabled: boolean; $isLoading: boolean }>`
  background: ${props => props.$isDisabled ? '#404040' : '#007acc'};
  color: ${props => props.$isDisabled ? '#888888' : '#ffffff'};
  border: none;
  padding: 6px 12px;
  border-radius: 3px;
  cursor: ${props => props.$isDisabled || props.$isLoading ? 'not-allowed' : 'pointer'};
  font-size: 12px;
  font-weight: 500;
  opacity: ${props => props.$isDisabled || props.$isLoading ? 0.6 : 1};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #1177bb;
  }

  &:active:not(:disabled) {
    background: #005999;
  }
`;

export const DownloadButton: React.FC<DownloadButtonProps> = ({ disabled = false }) => {
  const { files, downloadAsZip, isLoading } = useFileSystem();

  const handleDownload = () => {
    if (files.length > 0 && !disabled && !isLoading) {
      downloadAsZip();
    }
  };

  const isDisabled = disabled || files.length === 0;

  return (
    <StyledButton
      onClick={handleDownload}
      disabled={isDisabled || isLoading}
      $isDisabled={isDisabled}
      $isLoading={isLoading}
      title={isDisabled ? 'No files to download' : 'Download ZIP file'}
    >
      {isLoading ? 'Downloading...' : 'Download ZIP'}
    </StyledButton>
  );
};
