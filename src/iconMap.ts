const fileExtensionMap: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'react_ts',
  '.d.ts': 'typescript-def',
  '.js': 'javascript',
  '.jsx': 'react',
  '.json': 'json',
  '.css': 'css',
  '.scss': 'sass',
  '.sass': 'sass',
  '.html': 'html',
  '.htm': 'html',
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.svg': 'svg',
  '.py': 'python',
  '.rs': 'rust',
  '.go': 'go',
  '.java': 'java',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.rb': 'ruby',
  '.swift': 'swift',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.sh': 'console',
  '.bash': 'console',
  '.zsh': 'console',
  '.lock': 'lock',
};

const fileNameMap: Record<string, string> = {
  'dockerfile': 'docker',
  'docker-compose.yml': 'docker',
  'docker-compose.yaml': 'docker',
  '.gitignore': 'git',
  '.gitattributes': 'git',
  '.gitmodules': 'git',
  'package-lock.json': 'lock',
  'yarn.lock': 'lock',
  'pnpm-lock.yaml': 'lock',
};

const folderNameMap: Record<string, string> = {
  'src': 'folder-src',
  'source': 'folder-src',
  'test': 'folder-test',
  'tests': 'folder-test',
  '__tests__': 'folder-test',
  'spec': 'folder-test',
  'config': 'folder-config',
  'configs': 'folder-config',
  'configuration': 'folder-config',
  'dist': 'folder-dist',
  'build': 'folder-dist',
  'out': 'folder-dist',
  'output': 'folder-dist',
  'docs': 'folder-docs',
  'doc': 'folder-docs',
  'documentation': 'folder-docs',
  'components': 'folder-components',
  'component': 'folder-components',
  'api': 'folder-api',
  'apis': 'folder-api',
  'app': 'folder-app',
  'application': 'folder-app',
  'utils': 'folder-utils',
  'util': 'folder-utils',
  'utilities': 'folder-utils',
  'helpers': 'folder-utils',
  'lib': 'folder-lib',
  'libs': 'folder-lib',
  'library': 'folder-lib',
  'public': 'folder-public',
  'static': 'folder-public',
  'assets': 'folder-public',
};

export function getFileIconName(fileName: string): string {
  const lowerName = fileName.toLowerCase();

  if (fileNameMap[lowerName]) {
    return fileNameMap[lowerName];
  }

  if (lowerName.endsWith('.d.ts')) {
    return 'typescript-def';
  }

  const ext = '.' + lowerName.split('.').pop();
  return fileExtensionMap[ext] || 'file';
}

export function getFolderIconName(folderName: string, open: boolean): string {
  const lowerName = folderName.toLowerCase();
  const base = folderNameMap[lowerName] || 'folder';
  return open ? `${base}-open` : base;
}
