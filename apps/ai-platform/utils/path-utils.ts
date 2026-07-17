import path from 'node:path';

export function normalizePath(value: string): string {
  return value.replace(/\\/g, '/');
}

export function relativeFromRoot(rootPath: string, targetPath: string): string {
  return normalizePath(path.posix.relative(normalizePath(rootPath), normalizePath(targetPath)));
}

export function getFileExtension(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  return extension.startsWith('.') ? extension.slice(1) : extension;
}

export function getBaseName(filePath: string): string {
  return path.basename(filePath);
}

export function joinPath(parentPath: string, childPath: string): string {
  return normalizePath(path.posix.join(normalizePath(parentPath), childPath));
}

export function safeArtifactName(filePath: string): string {
  const baseName = getBaseName(filePath);
  const extension = path.extname(baseName);
  return extension.length > 0 ? baseName.slice(0, -extension.length) : baseName;
}
