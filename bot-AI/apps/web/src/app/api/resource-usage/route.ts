/**
 * GET /api/resource-usage
 * Returns real-time CPU, RAM, thread stats for system + bot/web processes
 */
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

// ── CPU delta tracking ────────────────────────────────────────────────────────
interface CpuSample { idle: number; total: number }

function snapCpu(): CpuSample {
  let idle = 0, total = 0;
  for (const c of os.cpus()) {
    idle  += c.times.idle;
    total += c.times.user + c.times.nice + c.times.sys + c.times.idle + c.times.irq;
  }
  return { idle, total };
}

let prevSys: CpuSample | null = null;

function systemCpuPercent(): number {
  const cur = snapCpu();
  if (!prevSys) { prevSys = cur; return 0; }
  const dIdle  = cur.idle  - prevSys.idle;
  const dTotal = cur.total - prevSys.total;
  prevSys = cur;
  return dTotal === 0 ? 0 : Math.round((1 - dIdle / dTotal) * 1000) / 10;
}

// ── Per-process CPU delta tracking ───────────────────────────────────────────
interface ProcSample { cpu: number; time: number }
const procCache = new Map<number, ProcSample>();

function procCpuPercent(pid: number, currentCpuSeconds: number): number {
  const now = Date.now();
  const prev = procCache.get(pid);
  procCache.set(pid, { cpu: currentCpuSeconds, time: now });
  if (!prev) return 0;
  const deltaCpu  = currentCpuSeconds - prev.cpu;   // seconds
  const deltaTime = (now - prev.time) / 1000;         // seconds
  if (deltaTime <= 0) return 0;
  const cores = os.cpus().length;
  return Math.round((deltaCpu / deltaTime / cores) * 1000) / 10;
}

// ── PowerShell: get bun.exe processes info ────────────────────────────────────
interface ProcInfo {
  pid: number;
  name: string;
  ramMb: number;      // WorkingSet MB
  cpuSec: number;     // Cumulative CPU seconds (for delta)
  threads: number;
  cmdline: string;
}

async function getBunProcesses(): Promise<ProcInfo[]> {
  try {
    const ps = `
      Get-CimInstance Win32_Process -Filter "Name='bun.exe'" |
      Select-Object ProcessId, WorkingSetSize, KernelModeTime, UserModeTime,
                    ThreadCount, CommandLine |
      ConvertTo-Json -Compress
    `;
    const { stdout } = await execFileAsync('powershell', [
      '-NoProfile', '-NonInteractive', '-Command', ps,
    ], { timeout: 4000 });

    const raw = JSON.parse(stdout.trim());
    const arr: ProcInfo[] = (Array.isArray(raw) ? raw : [raw]).map((p: Record<string, unknown>) => ({
      pid:     Number(p.ProcessId),
      name:    'bun',
      ramMb:   Math.round(Number(p.WorkingSetSize) / 1024 / 1024),
      // KernelModeTime + UserModeTime are in 100-nanosecond units
      cpuSec:  (Number(p.KernelModeTime) + Number(p.UserModeTime)) / 1e7,
      threads: Number(p.ThreadCount),
      cmdline: String(p.CommandLine ?? ''),
    }));
    return arr;
  } catch {
    return [];
  }
}

// ── Classify processes as bot / web ──────────────────────────────────────────
function classify(procs: ProcInfo[]) {
  const bot = procs.find(p => p.cmdline.includes('apps\\bot') || p.cmdline.includes('apps/bot'));
  const web = procs.find(p => p.cmdline.includes('apps\\web') || p.cmdline.includes('apps/web'));
  // fallback: largest RAM = bot
  const sorted = [...procs].sort((a, b) => b.ramMb - a.ramMb);
  return {
    bot: bot ?? sorted[0] ?? null,
    web: web ?? sorted[1] ?? null,
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET() {
  const cpuPercent   = systemCpuPercent();
  const totalRam     = os.totalmem();
  const freeRam      = os.freemem();
  const usedRam      = totalRam - freeRam;
  const cores        = os.cpus().length;
  const cpuModel     = os.cpus()[0]?.model ?? '';

  const procs        = await getBunProcesses();
  const { bot, web } = classify(procs);

  const mapProc = (p: ProcInfo | null) => p ? {
    pid:     p.pid,
    ramMb:   p.ramMb,
    cpu:     procCpuPercent(p.pid, p.cpuSec),
    threads: p.threads,
  } : null;

  return Response.json({
    system: {
      cpu:      cpuPercent,
      cores,
      cpuModel: cpuModel.replace(/\s+/g, ' ').trim(),
      ram: {
        used:    Math.round(usedRam  / 1024 / 1024),
        total:   Math.round(totalRam / 1024 / 1024),
        percent: Math.round(usedRam / totalRam * 1000) / 10,
      },
    },
    bot: mapProc(bot),
    web: mapProc(web),
  });
}
