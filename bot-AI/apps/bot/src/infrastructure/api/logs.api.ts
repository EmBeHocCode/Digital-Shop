/**
 * Logs API - Xem logs hệ thống
 */
import { Hono } from 'hono';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../');
const logsDir = path.join(projectRoot, 'logs');
const settingsPath = path.join(projectRoot, 'settings.json');
const resolvedLogsDir = path.resolve(logsDir);

export const logsApi = new Hono();

function isSubPath(parent: string, child: string): boolean {
  const rel = path.relative(parent, child);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function isSafeSegment(segment: string): boolean {
  return (
    !!segment &&
    segment !== '.' &&
    segment !== '..' &&
    !segment.includes('\0') &&
    !segment.includes('/') &&
    !segment.includes('\\')
  );
}

function resolveSafeLogPath(...segments: string[]): string | null {
  if (segments.some((segment) => !isSafeSegment(segment))) {
    return null;
  }

  const fullPath = path.resolve(resolvedLogsDir, ...segments);
  const sameDir = fullPath === resolvedLogsDir;
  if (sameDir || isSubPath(resolvedLogsDir, fullPath)) {
    return fullPath;
  }
  return null;
}

function getMaxSessionFolders(): number {
  try {
    if (!fs.existsSync(settingsPath)) return 100;
    const raw = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const value = Number(raw?.logger?.maxSessionFolders);
    if (Number.isFinite(value) && value >= 1) {
      return Math.floor(value);
    }
  } catch {
    // Ignore invalid settings and fallback to default
  }
  return 100;
}

function cleanupOldLogFolders(maxFolders: number): void {
  if (!fs.existsSync(logsDir) || maxFolders < 1) return;

  const folders = fs
    .readdirSync(logsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const fullPath = path.join(logsDir, entry.name);
      const stats = fs.statSync(fullPath);
      return {
        fullPath,
        mtimeMs: stats.mtimeMs,
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (folders.length <= maxFolders) return;

  for (const folder of folders.slice(maxFolders)) {
    fs.rmSync(folder.fullPath, { recursive: true, force: true });
  }
}

// GET /logs - Danh sách log folders
logsApi.get('/', async (c) => {
  try {
    cleanupOldLogFolders(getMaxSessionFolders());

    if (!fs.existsSync(logsDir)) {
      return c.json({ success: true, data: [] });
    }

    const entries = fs.readdirSync(logsDir, { withFileTypes: true });
    const folders = entries
      .filter((e) => e.isDirectory())
      .map((e) => ({
        name: e.name,
        path: e.name,
      }))
      .sort((a, b) => b.name.localeCompare(a.name)); // Newest first

    return c.json({ success: true, data: folders });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

// GET /logs/file/unauthorized - Đọc unauthorized.json
// Route tĩnh phải đặt trước route động /:folder/:file để tránh bị nuốt
logsApi.get('/file/unauthorized', async (c) => {
  try {
    const filePath = resolveSafeLogPath('unauthorized.json');
    if (!filePath) {
      return c.json({ success: false, error: 'Invalid path' }, 400);
    }

    if (!fs.existsSync(filePath)) {
      return c.json({ success: true, data: [] });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content || '[]');

    return c.json({ success: true, data });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

// GET /logs/:folder - Danh sách files trong folder
logsApi.get('/:folder', async (c) => {
  try {
    const folder = c.req.param('folder');
    const folderPath = resolveSafeLogPath(folder);

    if (!folderPath) {
      return c.json({ success: false, error: 'Invalid folder path' }, 400);
    }

    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
      return c.json({ success: false, error: 'Folder not found' }, 404);
    }

    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => {
        const filePath = path.join(folderPath, e.name);
        const stats = fs.statSync(filePath);
        return {
          name: e.name,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      });

    return c.json({ success: true, data: files });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

// GET /logs/:folder/:file - Đọc nội dung file log
logsApi.get('/:folder/:file', async (c) => {
  try {
    const folder = c.req.param('folder');
    const file = c.req.param('file');
    const filePath = resolveSafeLogPath(folder, file);
    const lines = Number(c.req.query('lines')) || 100;
    const offset = Number(c.req.query('offset')) || 0;

    if (!filePath) {
      return c.json({ success: false, error: 'Invalid file path' }, 400);
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return c.json({ success: false, error: 'File not found' }, 404);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const allLines = content.split('\n').filter((l) => l.trim());
    const totalLines = allLines.length;

    // Get last N lines with offset
    const start = Math.max(0, totalLines - lines - offset);
    const end = totalLines - offset;
    const selectedLines = allLines.slice(start, end);

    return c.json({
      success: true,
      data: {
        lines: selectedLines,
        totalLines,
        hasMore: start > 0,
      },
    });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

// GET /logs/download/:folder/:file - Download file log
logsApi.get('/download/:folder/:file', async (c) => {
  try {
    const folder = c.req.param('folder');
    const file = c.req.param('file');
    const filePath = resolveSafeLogPath(folder, file);

    if (!filePath) {
      return c.json({ success: false, error: 'Invalid file path' }, 400);
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return c.json({ success: false, error: 'File not found' }, 404);
    }

    const content = fs.readFileSync(filePath);

    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${file}"`,
        'Content-Length': content.length.toString(),
      },
    });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

// DELETE /logs/:folder - Xóa folder log
logsApi.delete('/:folder', async (c) => {
  try {
    const folder = c.req.param('folder');
    const folderPath = resolveSafeLogPath(folder);

    if (!folderPath) {
      return c.json({ success: false, error: 'Invalid folder path' }, 400);
    }

    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
      return c.json({ success: false, error: 'Folder not found' }, 404);
    }

    fs.rmSync(folderPath, { recursive: true });

    return c.json({ success: true, message: `Folder ${folder} deleted` });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});
