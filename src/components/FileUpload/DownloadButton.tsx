import React from 'react';
import { useFileSystem } from '../../hooks/useFileSystem';

export const DownloadButton: React.FC = () => {
  const { files, downloadAsZip, isLoading } = useFileSystem();

  const handleDownload = () => {
    if (files.length > 0) {
      downloadAsZip();
    }
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      style={{
        backgroundColor: '#007acc',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        margin: '8px',
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      {isLoading ? 'Creating ZIP...' : 'Download as ZIP'}
    </button>
  );
};
