import type { FileItem, FileTreeNode, FileNode } from '../types';

export const buildFileTree = (files: FileItem[]): FileTreeNode[] => {
  const rootNodes: FileTreeNode[] = [];
  const nodeMap = new Map<string, FileTreeNode>();

  // Sort files to ensure directories come before files
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type === 'directory' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });

  sortedFiles.forEach(file => {
    const pathParts = file.path.split('/').filter(Boolean);
    let currentPath = '';
    let depth = 0;

    pathParts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      if (!nodeMap.has(currentPath)) {
        const isLeaf = index === pathParts.length - 1;
        const node: FileTreeNode = {
          id: file.id,
          name: part,
          path: currentPath,
          type: isLeaf ? file.type : 'directory',
          size: isLeaf ? file.size : undefined,
          content: isLeaf ? file.content : undefined,
          children: [] as FileTreeNode[],
          depth,
          expanded: false,
          parentId: depth === 0 ? undefined : pathParts.slice(0, -1).join('/')
        };

        nodeMap.set(currentPath, node);

        if (depth === 0) {
          rootNodes.push(node);
        } else {
          const parentPath = pathParts.slice(0, -1).join('/');
          const parent = nodeMap.get(parentPath);
          if (parent) {
            parent.children!.push(node);
          }
        }
      }
      depth++;
    });
  });

  return rootNodes;
};

export const flattenTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
  const result: FileTreeNode[] = [];
  
  const traverse = (node: FileTreeNode) => {
    result.push(node);
    if (node.expanded && node.children) {
      (node.children as FileTreeNode[]).forEach(traverse);
    }
  };

  nodes.forEach(traverse);
  return result;
};

export const findNodeById = (nodes: FileTreeNode[], id: string): FileTreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children as FileTreeNode[], id);
      if (found) return found;
    }
  }
  return null;
};

export const toggleNodeExpansion = (nodes: FileTreeNode[], id: string): FileTreeNode[] => {
  return nodes.map(node => {
    if (node.id === id) {
      return { ...node, expanded: !node.expanded };
    }
    if (node.children) {
      return { ...node, children: toggleNodeExpansion(node.children as FileTreeNode[], id) };
    }
    return node;
  });
};

export const sortFileTree = (node: FileNode): FileNode => {
  if (node.type === 'file' || !node.children) {
    return node;
  }

  const sortedChildren = [...node.children].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });

  return {
    ...node,
    children: sortedChildren.map(sortFileTree)
  };
};

export const findNodeByPath = (root: FileNode | null, path: string): FileNode | null => {
  if (!root) return null;
  if (root.path === path) return root;
  
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByPath(child, path);
      if (found) return found;
    }
  }
  
  return null;
};

export const countFiles = (node: FileNode): number => {
  if (node.type === 'file') return 1;
  if (!node.children) return 0;
  return node.children.reduce((acc, child) => acc + countFiles(child), 0);
};
