# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# ZIP File Editor

A web-based ZIP file editor built with React, TypeScript, and Vite. This application allows you to upload ZIP files, browse their contents, edit text files, and download the modified archive.

## Features

- **ZIP File Upload**: Upload and extract ZIP files
- **File Tree Explorer**: Browse extracted files in a tree structure
- **Code Editor**: Edit text files with Monaco Editor (VS Code engine)
- **File Management**: Open multiple files in tabs
- **Download**: Export modified files as a new ZIP archive
- **Dark Theme**: Professional dark theme interface
- **Keyboard Shortcuts**: Standard editor shortcuts (Ctrl+S, Ctrl+O, etc.)

## Supported File Types

### Archive Formats
- ZIP (.zip)
- JAR (.jar)
- WAR (.war)
- EAR (.ear)

### Text File Formats
- JavaScript (.js, .jsx)
- TypeScript (.ts, .tsx)
- HTML (.html)
- CSS (.css, .scss, .sass)
- JSON (.json)
- Markdown (.md)
- Python (.py)
- Java (.java)
- C/C++ (.c, .cpp)
- And many more...

## Project Structure

```
zip-file-editor/
├── src/
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── MonacoEditor.tsx      # Monaco code editor component
│   │   │   ├── EditorTabs.tsx        # Editor tab management
│   │   │   ├── EditorContainer.tsx   # Main editor container
│   │   │   └── index.ts
│   │   ├── FileTree/
│   │   │   ├── FileTree.tsx          # File tree component
│   │   │   ├── TreeNode.tsx          # Individual tree node
│   │   │   ├── FileIcon.tsx          # File type icons
│   │   │   └── index.ts
│   │   ├── FileUpload/
│   │   │   ├── FileUploadArea.tsx    # Drag & drop upload area
│   │   │   ├── DownloadButton.tsx    # ZIP download button
│   │   │   └── index.ts
│   │   └── Layout/
│   │       ├── AppLayout.tsx         # Main application layout
│   │       └── index.ts
│   ├── hooks/
│   │   ├── useMonaco.ts             # Monaco editor hook
│   │   ├── useFileSystem.ts         # File system operations
│   │   ├── useZipHandler.ts         # ZIP file handling
│   │   └── useKeyboardShortcuts.ts  # Keyboard shortcut handling
│   ├── services/
│   │   ├── zipService.ts            # ZIP file operations
│   │   ├── fileService.ts           # File I/O operations
│   │   └── monacoService.ts         # Monaco editor service
│   ├── store/
│   │   ├── fileStore.ts             # File state management
│   │   ├── editorStore.ts           # Editor state management
│   │   └── index.ts
│   ├── types/
│   │   ├── file.types.ts            # File-related types
│   │   ├── editor.types.ts          # Editor-related types
│   │   └── index.ts
│   ├── utils/
│   │   ├── fileUtils.ts             # File utility functions
│   │   ├── treeUtils.ts             # Tree structure utilities
│   │   └── constants.ts             # Application constants
│   ├── styles/
│   │   ├── themes/
│   │   │   └── dark.css             # Dark theme styles
│   │   └── global.css               # Global application styles
│   ├── App.tsx                      # Main App component
│   └── main.tsx                     # Application entry point
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd zip-file-editor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Upload Files**: Drag and drop ZIP files or text files onto the upload area, or click to browse
2. **Browse Files**: Use the file tree on the left to navigate through extracted files
3. **Edit Files**: Click on text files to open them in the Monaco editor
4. **Save Changes**: Use Ctrl+S to save changes (files will be marked as modified)
5. **Download**: Click the "Download as ZIP" button to export your changes

## Keyboard Shortcuts

- `Ctrl+S` - Save current file
- `Ctrl+O` - Open file dialog
- `Ctrl+W` - Close current tab
- `Ctrl+T` - New tab
- `Ctrl+B` - Toggle sidebar
- `Ctrl+F` - Search in file
- `Ctrl+H` - Find and replace

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety and better development experience
- **Vite** - Fast build tool and development server
- **Monaco Editor** - VS Code's editor engine for code editing
- **JSZip** - JavaScript ZIP file manipulation
- **CSS3** - Styling with dark theme

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Monaco Editor by Microsoft
- JSZip library for ZIP file handling
- React and Vite development teams

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
