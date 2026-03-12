import * as vscode from 'vscode';
import * as path from 'path';
import { GitService } from './gitService';
import { ChangeCategory, FileChange } from './types';

type TreeElement = CategoryItem | FileChangeItem;

class CategoryItem {
  constructor(
    public readonly category: ChangeCategory,
    public readonly children: FileChange[]
  ) {}
}

class FileChangeItem {
  constructor(public readonly change: FileChange) {}
}

export class SourceControlTreeDataProvider
  implements vscode.TreeDataProvider<TreeElement>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    TreeElement | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private gitService: GitService | undefined;

  setWorkspacePath(workspacePath: string): void {
    this.gitService = new GitService(workspacePath);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeElement): vscode.TreeItem {
    if (element instanceof CategoryItem) {
      return this.getCategoryTreeItem(element);
    }
    return this.getFileChangeTreeItem(element);
  }

  getChildren(element?: TreeElement): TreeElement[] {
    if (!this.gitService) {
      return [];
    }

    if (!element) {
      return this.getRootChildren();
    }

    if (element instanceof CategoryItem) {
      return element.children.map((change) => new FileChangeItem(change));
    }

    return [];
  }

  private getRootChildren(): TreeElement[] {
    const changes = this.gitService!.getChanges();

    const grouped = new Map<ChangeCategory, FileChange[]>();
    for (const change of changes) {
      const list = grouped.get(change.category) ?? [];
      list.push(change);
      grouped.set(change.category, list);
    }

    const categories: TreeElement[] = [];
    const order = [
      ChangeCategory.Staged,
      ChangeCategory.Unstaged,
      ChangeCategory.Untracked,
    ];

    for (const cat of order) {
      const files = grouped.get(cat);
      if (files && files.length > 0) {
        categories.push(new CategoryItem(cat, files));
      }
    }

    return categories;
  }

  private getCategoryTreeItem(item: CategoryItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      `${item.category} (${item.children.length})`,
      vscode.TreeItemCollapsibleState.Expanded
    );
    treeItem.contextValue = 'category';
    return treeItem;
  }

  private getFileChangeTreeItem(item: FileChangeItem): vscode.TreeItem {
    const { change } = item;
    const fileName = path.basename(change.filePath);
    const parentDir = path.basename(path.dirname(change.filePath));
    const label = parentDir && parentDir !== '.'
      ? `${parentDir}/${fileName}`
      : fileName;

    const treeItem = new vscode.TreeItem(label);
    treeItem.description = `+${change.added} -${change.deleted}`;
    treeItem.tooltip = new vscode.MarkdownString(
      `**${change.filePath}**\n\n+${change.added} additions, -${change.deleted} deletions`
    );
    treeItem.resourceUri = vscode.Uri.file(
      path.join(this.gitService!['workspacePath'], change.filePath)
    );
    treeItem.iconPath = vscode.ThemeIcon.File;
    treeItem.contextValue = 'fileChange';

    treeItem.command = {
      command: 'sourceControlPanel.openDiff',
      title: 'Open Diff',
      arguments: [change],
    };

    return treeItem;
  }
}
