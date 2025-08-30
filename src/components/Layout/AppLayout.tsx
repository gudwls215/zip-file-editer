import React from 'react';
import { FileUploadArea } from '../FileUpload/FileUploadArea';
import { FileTree } from '../FileTree/FileTree';
import { EditorContainer } from '../Editor/EditorContainer';

const AppLayout: React.FC = () => {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1e1e1e',
      color: '#cccccc',
      fontFamily: '"Segoe UI", "Segoe WPC", "Segoe UI Symbol", "Helvetica Neue", sans-serif',
      fontSize: '13px'
    }}>
      {/* Title Bar */}
      <div style={{
        height: '35px',
        background: 'linear-gradient(to bottom, #3c3c3c, #2d2d30)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #464647',
        fontSize: '14px',
        fontWeight: '400',
        letterSpacing: '0.5px'
      }}>
        Zip File Editor
      </div>

      {/* File Upload Section */}
      <div style={{
        height: '120px',
        backgroundColor: '#252526',
        borderBottom: '1px solid #464647',
        padding: '12px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <FileUploadArea />
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left Sidebar - File Tree */}
        <div style={{
          width: '300px',
          backgroundColor: '#252526',
          borderRight: '1px solid #464647',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '35px',
            backgroundColor: '#2d2d30',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '12px',
            borderBottom: '1px solid #464647',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: '#a0a0a0'
          }}>
            File Tree
          </div>
          <div style={{
            flex: 1,
            overflow: 'auto'
          }}>
            <FileTree />
          </div>
        </div>

        {/* Right Content Area - Integrated Editor */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <EditorContainer />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
