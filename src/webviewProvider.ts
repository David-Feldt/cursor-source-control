import * as vscode from 'vscode';
import * as path from 'path';
import { GitService } from './gitService';
import { ChangeCategory, FileChange, FileStatus } from './types';
import { getFileIconName, getFolderIconName } from './iconMap';

interface FolderGroup {
  folderPath: string;
  folderName: string;
  files: FileChange[];
}

export class SourceControlWebviewProvider
  implements vscode.WebviewViewProvider
{
  public static readonly viewType = 'sourceControlPanel';

  private _view?: vscode.WebviewView;
  private gitService: GitService | undefined;
  private workspacePath: string | undefined;

  constructor(private readonly extensionUri: vscode.Uri) {}

  setWorkspacePath(workspacePath: string): void {
    this.workspacePath = workspacePath;
    this.gitService = new GitService(workspacePath);
  }

  refresh(): void {
    if (this._view) {
      this._view.webview.html = this.getHtml(this._view.webview);
    }
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'resources', 'icons'),
      ],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.command === 'openDiff') {
        const change: FileChange = message.change;
        vscode.commands.executeCommand('sourceControlPanel.openDiff', change);
      }
    });
  }

  private iconUri(webview: vscode.Webview, iconName: string): string {
    const uri = vscode.Uri.joinPath(
      this.extensionUri,
      'resources',
      'icons',
      `${iconName}.svg`
    );
    return webview.asWebviewUri(uri).toString();
  }

  private getHtml(webview: vscode.Webview): string {
    const changes = this.gitService?.getChanges() ?? [];

    const grouped = new Map<ChangeCategory, FileChange[]>();
    for (const change of changes) {
      const list = grouped.get(change.category) ?? [];
      list.push(change);
      grouped.set(change.category, list);
    }

    const order = [
      ChangeCategory.Staged,
      ChangeCategory.Unstaged,
      ChangeCategory.Untracked,
    ];

    let sectionsHtml = '';
    for (const cat of order) {
      const files = grouped.get(cat);
      if (!files || files.length === 0) {
        continue;
      }
      sectionsHtml += this.renderSection(cat, files, webview);
    }

    if (!sectionsHtml) {
      sectionsHtml = '<div class="empty">No changes detected</div>';
    }

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      padding: 0;
      margin: 0;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: transparent;
    }
    .section-header {
      display: flex;
      align-items: center;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--vscode-sideBarSectionHeader-foreground);
      background: var(--vscode-sideBarSectionHeader-background);
      cursor: pointer;
      user-select: none;
    }
    .section-header:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .section-header .chevron {
      margin-right: 4px;
      transition: transform 0.15s;
      font-size: 12px;
    }
    .section-header .chevron.collapsed {
      transform: rotate(-90deg);
    }
    .section-count {
      margin-left: 6px;
      opacity: 0.7;
    }
    .section-body {
      margin: 0;
      padding: 0;
    }
    .section-body.hidden {
      display: none;
    }
    .folder-header {
      display: flex;
      align-items: center;
      padding: 2px 12px 2px 16px;
      cursor: pointer;
      user-select: none;
      opacity: 0.9;
      font-size: 13px;
    }
    .folder-header:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .folder-header .chevron {
      margin-right: 4px;
      transition: transform 0.15s;
      font-size: 10px;
    }
    .folder-header .chevron.collapsed {
      transform: rotate(-90deg);
    }
    .folder-icon {
      width: 16px;
      height: 16px;
      margin-right: 5px;
      flex-shrink: 0;
    }
    .folder-files {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .folder-files.hidden {
      display: none;
    }
    .file-item {
      display: flex;
      align-items: center;
      padding: 2px 12px 2px 36px;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
    }
    .file-item.root-file {
      padding-left: 20px;
    }
    .file-item:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .file-icon {
      width: 16px;
      height: 16px;
      margin-right: 5px;
      flex-shrink: 0;
    }
    .file-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .file-name.modified {
      color: var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d);
    }
    .file-name.added {
      color: var(--vscode-gitDecoration-addedResourceForeground, #81b88b);
    }
    .file-name.deleted {
      color: var(--vscode-gitDecoration-deletedResourceForeground, #c74e39);
    }
    .file-name.untracked {
      color: var(--vscode-gitDecoration-untrackedResourceForeground, #73c991);
    }
    .stats {
      flex-shrink: 0;
      margin-left: 8px;
      font-size: 12px;
      font-family: var(--vscode-editor-font-family);
    }
    .stat-add {
      color: #4ec94e;
    }
    .stat-del {
      color: #f14c4c;
      margin-left: 4px;
    }
    .empty {
      padding: 20px;
      text-align: center;
      opacity: 0.6;
    }
  </style>
</head>
<body>
  ${sectionsHtml}
  <script>
    const vscode = acquireVsCodeApi();

    document.querySelectorAll('.section-header').forEach(header => {
      header.addEventListener('click', () => {
        const body = header.nextElementSibling;
        const chevron = header.querySelector('.chevron');
        body.classList.toggle('hidden');
        chevron.classList.toggle('collapsed');
      });
    });

    document.querySelectorAll('.folder-header').forEach(header => {
      header.addEventListener('click', () => {
        const list = header.nextElementSibling;
        const chevron = header.querySelector('.chevron');
        const openIcon = header.querySelector('.folder-icon-open');
        const closedIcon = header.querySelector('.folder-icon-closed');
        list.classList.toggle('hidden');
        chevron.classList.toggle('collapsed');
        if (openIcon && closedIcon) {
          const isHidden = list.classList.contains('hidden');
          openIcon.style.display = isHidden ? 'none' : 'inline';
          closedIcon.style.display = isHidden ? 'inline' : 'none';
        }
      });
    });

    document.querySelectorAll('.file-item').forEach(item => {
      item.addEventListener('click', () => {
        const change = JSON.parse(item.dataset.change);
        vscode.postMessage({ command: 'openDiff', change });
      });
    });
  </script>
</body>
</html>`;
  }

  private groupByFolder(files: FileChange[]): FolderGroup[] {
    const folderMap = new Map<string, FileChange[]>();

    for (const file of files) {
      const dir = path.dirname(file.filePath);
      const list = folderMap.get(dir) ?? [];
      list.push(file);
      folderMap.set(dir, list);
    }

    const groups: FolderGroup[] = [];
    for (const [folderPath, folderFiles] of folderMap) {
      groups.push({
        folderPath,
        folderName: folderPath === '.' ? '' : folderPath,
        files: folderFiles,
      });
    }

    groups.sort((a, b) => a.folderPath.localeCompare(b.folderPath));
    return groups;
  }

  private renderSection(
    category: ChangeCategory,
    files: FileChange[],
    webview: vscode.Webview
  ): string {
    const folderGroups = this.groupByFolder(files);

    let contentHtml = '';
    for (const group of folderGroups) {
      if (!group.folderName) {
        contentHtml += group.files
          .map((f) => this.renderFileItem(f, true, webview))
          .join('\n');
      } else {
        const lastFolder = path.basename(group.folderName);
        const openIconUri = this.iconUri(
          webview,
          getFolderIconName(lastFolder, true)
        );
        const closedIconUri = this.iconUri(
          webview,
          getFolderIconName(lastFolder, false)
        );
        const filesHtml = group.files
          .map((f) => this.renderFileItem(f, false, webview))
          .join('\n');
        contentHtml += `
          <div class="folder-header">
            <span class="chevron">&#9662;</span>
            <img class="folder-icon folder-icon-open" src="${openIconUri}" style="display:inline" />
            <img class="folder-icon folder-icon-closed" src="${closedIconUri}" style="display:none" />
            ${this.escapeHtml(group.folderName)}
          </div>
          <ul class="folder-files">
            ${filesHtml}
          </ul>
        `;
      }
    }

    return `
      <div class="section-header">
        <span class="chevron">&#9662;</span>
        ${this.escapeHtml(category)}
        <span class="section-count">${files.length}</span>
      </div>
      <div class="section-body">
        ${contentHtml}
      </div>
    `;
  }

  private renderFileItem(
    change: FileChange,
    isRoot: boolean,
    webview: vscode.Webview
  ): string {
    const fileName = path.basename(change.filePath);
    const iconName = getFileIconName(fileName);
    const iconSrc = this.iconUri(webview, iconName);
    const colorClass = this.getStatusColorClass(change);
    const changeJson = this.escapeHtml(JSON.stringify(change));
    const rootClass = isRoot ? ' root-file' : '';

    return `
      <li class="file-item${rootClass}" data-change="${changeJson}">
        <img class="file-icon" src="${iconSrc}" />
        <span class="file-name ${colorClass}">${this.escapeHtml(fileName)}</span>
        <span class="stats">
          <span class="stat-add">+${change.added}</span>
          <span class="stat-del">-${change.deleted}</span>
        </span>
      </li>
    `;
  }

  private getStatusColorClass(change: FileChange): string {
    if (change.category === ChangeCategory.Untracked) {
      return 'untracked';
    }
    switch (change.status) {
      case FileStatus.Added:
        return 'added';
      case FileStatus.Deleted:
        return 'deleted';
      default:
        return 'modified';
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
