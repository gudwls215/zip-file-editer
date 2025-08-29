import React from 'react';
import { FileTree } from '../FileTree';
import { EditorContainer } from '../Editor';
import { FileUploadArea, DownloadButton } from '../FileUpload';
import { useFileSystem } from '../../hooks/useFileSystem';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export const AppLayout: React.FC = () => {
  const { files, error, clearAllFiles } = useFileSystem();

  useKeyboardShortcuts({
    onSave: () => {
      // Save current file
      console.log('Save shortcut triggered');
    },
    onOpen: () => {
      // Open file dialog
      console.log('Open shortcut triggered');
    },
  });

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1e1e1e',
      color: '#cccccc',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        height: '40px',
        backgroundColor: '#2d2d30',
        borderBottom: '1px solid #464647',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 'normal',
        }}>
          ZIP File Editor
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <DownloadButton />
          {files.length > 0 && (
            <button
              onClick={clearAllFiles}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#f14c4c',
          color: 'white',
          padding: '8px 16px',
          fontSize: '14px',
        }}>
          Error: {error}
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex' }}>
        {files.length === 0 ? (
          /* Upload Area */
          <FileUploadArea />
        ) : (
          /* File Explorer and Editor */
          <>
            <div style={{
              width: '300px',
              borderRight: '1px solid #464647',
              backgroundColor: '#252526',
            }}>
              <FileTree />
            </div>
            <EditorContainer />
          </>
        )}
      </div>

      {/* Status Bar */}
      <div style={{
        height: '24px',
        backgroundColor: '#007acc',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        fontSize: '12px',
        color: 'white',
      }}>
        {files.length > 0 && `${files.length} file(s) loaded`}
      </div>
    </div>
  );
};
