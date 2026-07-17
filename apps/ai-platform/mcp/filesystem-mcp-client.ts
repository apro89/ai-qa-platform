import type { DirectoryEntry, IFilesystemMcpClient } from '../interfaces/filesystem-mcp-client.js';
import { normalizePath } from '../utils/path-utils.js';

export interface IMcpToolInvoker {
  callTool(toolName: string, args: Record<string, unknown>): Promise<unknown>;
}

export interface FilesystemMcpToolConfig {
  listDirectoryToolName?: string;
  readFileToolName?: string;
}

export class FilesystemMcpClient implements IFilesystemMcpClient {
  private readonly listDirectoryToolName: string;
  private readonly readFileToolName: string;

  public constructor(
    private readonly invoker: IMcpToolInvoker,
    config: FilesystemMcpToolConfig = {},
  ) {
    this.listDirectoryToolName = config.listDirectoryToolName ?? 'list_dir';
    this.readFileToolName = config.readFileToolName ?? 'read_file';
  }

  public async listDirectory(path: string): Promise<DirectoryEntry[]> {
    const response = await this.invoker.callTool(this.listDirectoryToolName, { path });

    const normalizedEntries = this.toArray(response).map((value) => {
      const raw = value as { name?: unknown; path?: unknown; isDirectory?: unknown };
      const name = typeof raw.name === 'string' ? raw.name : String(raw.name ?? '');
      const rawPath = typeof raw.path === 'string' ? raw.path : `${path}/${name}`;
      const inferredIsDirectory = name.endsWith('/');

      return {
        name: name.replace(/\/$/, ''),
        path: normalizePath(rawPath).replace(/\/$/, ''),
        isDirectory: typeof raw.isDirectory === 'boolean' ? raw.isDirectory : inferredIsDirectory,
      };
    });

    return normalizedEntries;
  }

  public async readTextFile(path: string): Promise<string> {
    const response = await this.invoker.callTool(this.readFileToolName, {
      filePath: path,
      startLine: 1,
      endLine: 200000,
    });

    if (typeof response === 'string') {
      return response;
    }

    const parsed = response as { content?: unknown; text?: unknown };
    if (typeof parsed.content === 'string') {
      return parsed.content;
    }

    if (typeof parsed.text === 'string') {
      return parsed.text;
    }

    return JSON.stringify(response);
  }

  private toArray(input: unknown): unknown[] {
    if (Array.isArray(input)) {
      return input;
    }

    if (input && typeof input === 'object') {
      const candidate = input as { entries?: unknown };
      if (Array.isArray(candidate.entries)) {
        return candidate.entries;
      }
    }

    return [];
  }
}
