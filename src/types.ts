export enum ChangeCategory {
  Staged = 'Staged Changes',
  Unstaged = 'Unstaged Changes',
  Untracked = 'Untracked Files',
}

export interface FileChange {
  filePath: string;
  added: number;
  deleted: number;
  category: ChangeCategory;
  status: FileStatus;
}

export enum FileStatus {
  Modified = 'M',
  Added = 'A',
  Deleted = 'D',
  Renamed = 'R',
  Untracked = '?',
}
