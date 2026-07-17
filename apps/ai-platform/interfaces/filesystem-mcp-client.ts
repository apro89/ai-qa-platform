export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export interface IFilesystemMcpClient {
  listDirectory(path: string): Promise<DirectoryEntry[]>;
  readTextFile(path: string): Promise<string>;
}
