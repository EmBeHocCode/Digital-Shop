/**
 * Direct .env file CRUD — read/write apps/bot/.env without going through bot API
 */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const ENV_PATH = path.resolve(process.cwd(), '../../apps/bot/.env');

// ── helpers ────────────────────────────────────────────────────────────────

function readLines(): string[] {
  if (!fs.existsSync(ENV_PATH)) return [];
  return fs.readFileSync(ENV_PATH, 'utf-8').split('\n');
}

function writeLines(lines: string[]): void {
  fs.writeFileSync(ENV_PATH, lines.join('\n'), 'utf-8');
}

/** Parse all non-comment key=value lines → Map */
function parseEnv(lines: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 1); // preserve value as-is (may contain = signs)
    map.set(key, value);
  }
  return map;
}

/** Set (or add) a key, preserving comments and order */
function setKey(lines: string[], key: string, value: string): string[] {
  const out: string[] = [];
  let found = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      out.push(line);
      continue;
    }
    const eqIdx = line.indexOf('=');
    if (eqIdx !== -1 && line.slice(0, eqIdx).trim() === key) {
      out.push(`${key}=${value}`);
      found = true;
    } else {
      out.push(line);
    }
  }
  if (!found) {
    // Append at end (ensure trailing newline gap)
    if (out.length > 0 && out[out.length - 1].trim() !== '') out.push('');
    out.push(`${key}=${value}`);
  }
  return out;
}

/** Remove a key entirely */
function deleteKey(lines: string[], key: string): string[] {
  return lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return true;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) return true;
    return line.slice(0, eqIdx).trim() !== key;
  });
}

// ── GET /api/env-direct → { keys: [{key, value, masked}]  } ───────────────

export async function GET(request: NextRequest) {
  try {
    const lines = readLines();
    const map = parseEnv(lines);

    // ?key=SOME_KEY → trả về raw value của 1 key (dùng cho edit input)
    const singleKey = request.nextUrl.searchParams.get('key');
    if (singleKey) {
      const raw = (map.get(singleKey) ?? '').trim();
      return NextResponse.json({ success: true, data: { key: singleKey, value: raw } });
    }

    const keys = Array.from(map.entries()).map(([key, value]) => ({
      key,
      isSet: value.trim() !== '',
      masked:
        value.trim().length > 8
          ? `${value.slice(0, 4)}...${value.slice(-4)}`
          : value.trim()
            ? '••••••'
            : '',
    }));
    return NextResponse.json({ success: true, data: { keys } });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// ── PUT /api/env-direct  body: { key, value } →  upsert ──────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as { key?: string; value?: string };
    const { key, value } = body;
    if (!key || typeof value === 'undefined') {
      return NextResponse.json({ success: false, error: 'key and value required' }, { status: 400 });
    }

    const keyPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;
    if (!keyPattern.test(key)) {
      return NextResponse.json({ success: false, error: 'Invalid key name' }, { status: 400 });
    }

    const lines = readLines();
    const updated = setKey(lines, key, value);
    writeLines(updated);
    return NextResponse.json({ success: true, data: { key, updated: true } });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// ── DELETE /api/env-direct  body: { key } ─────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json() as { key?: string };
    const { key } = body;
    if (!key) {
      return NextResponse.json({ success: false, error: 'key required' }, { status: 400 });
    }

    const lines = readLines();
    const updated = deleteKey(lines, key);
    writeLines(updated);
    return NextResponse.json({ success: true, data: { key, deleted: true } });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
