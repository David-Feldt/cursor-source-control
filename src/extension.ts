import * as vscode from 'vscode';
import * as path from 'path';
import { SourceControlWebviewProvider } from './webviewProvider';
import { ChangeCategory, FileChange } from './types';

export function activate(context: vscode.ExtensionContext): void {
  const webviewProvider = new SourceControlWebviewProvider(
    context.extensionUri
  );

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (workspaceFolder) {
    webviewProvider.setWorkspacePath(workspaceFolder.uri.fsPath);
  }

  const registration = vscode.window.registerWebviewViewProvider(
    SourceControlWebviewProvider.viewType,
    webviewProvider
  );

  const refreshCommand = vscode.commands.registerCommand(
    'sourceControlPanel.refresh',
    () => webviewProvider.refresh()
  );

  const openDiffCommand = vscode.commands.registerCommand(
    'sourceControlPanel.openDiff',
    async (change: FileChange) => {
      if (!workspaceFolder) {
        return;
      }

      const workspacePath = workspaceFolder.uri.fsPath;
      const fileUri = vscode.Uri.file(
        path.join(workspacePath, change.filePath)
      );

      if (change.category === ChangeCategory.Untracked) {
        await vscode.commands.executeCommand('vscode.open', fileUri);
        return;
      }

      try {
        await vscode.commands.executeCommand('git.openChange', fileUri);
      } catch {
        const ref =
          change.category === ChangeCategory.Staged ? 'HEAD' : '~';
        const gitUri = toGitUri(change.filePath, ref);
        const title = `${path.basename(change.filePath)} (${change.category === ChangeCategory.Staged ? 'Index' : 'Working Tree'})`;
        await vscode.commands.executeCommand(
          'vscode.diff',
          gitUri,
          fileUri,
          title
        );
      }
    }
  );

  const watcher = vscode.workspace.createFileSystemWatcher('**/*');
  const debouncedRefresh = debounce(() => webviewProvider.refresh(), 1000);
  watcher.onDidChange(debouncedRefresh);
  watcher.onDidCreate(debouncedRefresh);
  watcher.onDidDelete(debouncedRefresh);

  const gitWatcher = vscode.workspace.createFileSystemWatcher(
    '**/.git/index'
  );
  gitWatcher.onDidChange(() => webviewProvider.refresh());

  vscode.workspace.onDidChangeWorkspaceFolders(() => {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (folder) {
      webviewProvider.setWorkspacePath(folder.uri.fsPath);
      webviewProvider.refresh();
    }
  });

  context.subscriptions.push(
    registration,
    refreshCommand,
    openDiffCommand,
    watcher,
    gitWatcher
  );
}

export function deactivate(): void {}

function toGitUri(filePath: string, ref: string): vscode.Uri {
  return vscode.Uri.parse(
    `git:${filePath}?${JSON.stringify({ path: filePath, ref })}`
  );
}

function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => fn(...args), delay);
  };
}
