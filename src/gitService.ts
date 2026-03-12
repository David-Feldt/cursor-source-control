import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ChangeCategory, FileChange, FileStatus } from './types';

export class GitService {
  constructor(private workspacePath: string) {}

  getChanges(): FileChange[] {
    if (!this.isGitRepo()) {
      return [];
    }

    const staged = this.getStagedChanges();
    const unstaged = this.getUnstagedChanges();
    const untracked = this.getUntrackedFiles();

    return [...staged, ...unstaged, ...untracked];
  }

  private isGitRepo(): boolean {
    try {
      this.exec('git rev-parse --is-inside-work-tree');
      return true;
    } catch {
      return false;
    }
  }

  private getStagedChanges(): FileChange[] {
    const numstat = this.exec('git diff --numstat --cached');
    const statusOutput = this.exec('git diff --name-status --cached');
    const statusMap = this.parseNameStatus(statusOutput);
    return this.parseNumstat(numstat, ChangeCategory.Staged, statusMap);
  }

  private getUnstagedChanges(): FileChange[] {
    const numstat = this.exec('git diff --numstat');
    const statusOutput = this.exec('git diff --name-status');
    const statusMap = this.parseNameStatus(statusOutput);
    return this.parseNumstat(numstat, ChangeCategory.Unstaged, statusMap);
  }

  private getUntrackedFiles(): FileChange[] {
    const output = this.exec('git ls-files --others --exclude-standard');
    if (!output.trim()) {
      return [];
    }

    return output
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
      .map((filePath) => {
        const added = this.countFileLines(filePath);
        return {
          filePath,
          added,
          deleted: 0,
          category: ChangeCategory.Untracked,
          status: FileStatus.Untracked,
        };
      });
  }

  private parseNumstat(
    output: string,
    category: ChangeCategory,
    statusMap: Map<string, FileStatus>
  ): FileChange[] {
    if (!output.trim()) {
      return [];
    }

    return output
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => {
        const parts = line.split('\t');
        if (parts.length < 3) {
          return null;
        }

        const added = parts[0] === '-' ? 0 : parseInt(parts[0], 10);
        const deleted = parts[1] === '-' ? 0 : parseInt(parts[1], 10);
        const filePath = parts.slice(2).join('\t');

        return {
          filePath,
          added,
          deleted,
          category,
          status: statusMap.get(filePath) ?? FileStatus.Modified,
        };
      })
      .filter((change): change is FileChange => change !== null);
  }

  private parseNameStatus(output: string): Map<string, FileStatus> {
    const map = new Map<string, FileStatus>();
    if (!output.trim()) {
      return map;
    }

    for (const line of output.trim().split('\n')) {
      if (!line) {
        continue;
      }
      const statusChar = line[0];
      const filePath = line.substring(1).trim().split('\t').pop() ?? '';

      switch (statusChar) {
        case 'A':
          map.set(filePath, FileStatus.Added);
          break;
        case 'D':
          map.set(filePath, FileStatus.Deleted);
          break;
        case 'R':
          map.set(filePath, FileStatus.Renamed);
          break;
        default:
          map.set(filePath, FileStatus.Modified);
          break;
      }
    }
    return map;
  }

  getDiffText(): string {
    const staged = this.exec('git diff --cached');
    const unstaged = this.exec('git diff');
    const untrackedFiles = this.exec(
      'git ls-files --others --exclude-standard'
    );

    let result = '';
    if (staged.trim()) {
      result += '=== STAGED CHANGES ===\n' + staged + '\n';
    }
    if (unstaged.trim()) {
      result += '=== UNSTAGED CHANGES ===\n' + unstaged + '\n';
    }
    if (untrackedFiles.trim()) {
      result +=
        '=== UNTRACKED FILES ===\n' +
        untrackedFiles
          .trim()
          .split('\n')
          .map((f) => `New file: ${f}`)
          .join('\n') +
        '\n';
    }
    return result;
  }

  private countFileLines(filePath: string): number {
    try {
      const fullPath = path.join(this.workspacePath, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      return (content.match(/\n/g) || []).length + (content.length > 0 && !content.endsWith('\n') ? 1 : 0);
    } catch {
      return 0;
    }
  }

  private exec(command: string): string {
    try {
      return execSync(command, {
        cwd: this.workspacePath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch {
      return '';
    }
  }
}
