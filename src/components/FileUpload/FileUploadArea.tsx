import React, { useRef } from 'react';
import { useFileSystem } from '../../hooks/useFileSystem';

export const FileUploadArea: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { processUploadedFiles, isLoading } = useFileSystem();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await processUploadedFiles(files);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      await processUploadedFiles(files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        border: '2px dashed #666',
        borderRadius: '8px',
        padding: '40px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: '#2d2d30',
        color: '#cccccc',
        margin: '20px',
        transition: 'border-color 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#007acc';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#666';
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".zip,.rar,.7z,.tar,.gz,.txt,.js,.ts,.jsx,.tsx,.html,.css,.json,.md"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      {isLoading ? (
        <div>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}></div>
          <div>Processing files...</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>
            Drop files here or click to upload
          </div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            Supports ZIP files and text files
          </div>
        </div>
      )}
    </div>
  );
};
