'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Cpu, MemoryStick, Activity, Zap, Globe, Terminal } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProcStats { pid: number; ramMb: number; cpu: number; threads: number }
interface ResourceData {
  system: {
    cpu: number; cores: number; cpuModel: string;
    ram: { used: number; total: number; percent: number };
  };
  bot: ProcStats | null;
  web: ProcStats | null;
}

const MAX_POINTS = 40;

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ data, max = 100, color }: { data: number[]; max?: number; color: string }) {
  const W = 120, H = 36;
  if (data.length < 2) return <div style={{ width: W, height: H }} />;
  const pts = data.slice(-MAX_POINTS);
  const step = W / (pts.length - 1);
  const coords = pts.map((v, i) => [i * step, H - (v / max) * (H - 4) - 2] as [number, number]);
  const d = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const fill = `${d} L${W},${H} L0,${H} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <defs>
        <linearGradient id={`g-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#g-${color.replace('#','')})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* last point dot */}
      <circle cx={coords[coords.length-1][0]} cy={coords[coords.length-1][1]} r="2.5" fill={color} />
    </svg>
  );
}

// ── Gauge bar ─────────────────────────────────────────────────────────────────
function GaugeBar({ percent, color }: { percent: number; color: string }) {
  const clamp = Math.min(100, Math.max(0, percent));
  return (
    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamp}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────
function StatTile({
  label, value, unit, sub, color, bar,
}: {
  label: string; value: string | number; unit?: string;
  sub?: string; color: string; bar?: number;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-bold tabular-nums" style={{ color }}>{value}</span>
        {unit && <span className="text-xs text-muted-foreground/50">{unit}</span>}
      </div>
      {sub && <span className="text-[10px] text-muted-foreground/40 truncate">{sub}</span>}
      {bar !== undefined && <GaugeBar percent={bar} color={color} />}
    </div>
  );
}

// ── Process card ─────────────────────────────────────────────────────────────
function ProcCard({
  title, icon, info, cpuHistory, ramHistory, accentCpu, accentRam,
}: {
  title: string;
  icon: React.ReactNode;
  info: ProcStats | null;
  cpuHistory: number[];
  ramHistory: number[];
  accentCpu: string;
  accentRam: string;
}) {
  const maxRam = Math.max(...ramHistory, 512);
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accentCpu}18` }}>
          {icon}
        </div>
        <span className="text-sm font-semibold">{title}</span>
        {info ? (
          <span className="ml-auto text-[10px] text-muted-foreground/40 font-mono">PID {info.pid}</span>
        ) : (
          <span className="ml-auto text-[10px] text-[#FF4B4B]/60">Không chạy</span>
        )}
      </div>

      {info ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="CPU" value={info.cpu.toFixed(1)} unit="%" color={accentCpu} bar={info.cpu} />
            <StatTile label="RAM" value={info.ramMb >= 1024 ? (info.ramMb/1024).toFixed(1) : info.ramMb} unit={info.ramMb >= 1024 ? 'GB' : 'MB'} color={accentRam} bar={(info.ramMb / maxRam) * 100} />
            <StatTile label="Threads" value={info.threads} color="#888" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">CPU %</span>
              <Sparkline data={cpuHistory} max={30} color={accentCpu} />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">RAM MB</span>
              <Sparkline data={ramHistory} max={maxRam} color={accentRam} />
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-16 text-muted-foreground/20 text-xs">
          Không tìm thấy tiến trình
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ResourceUsage() {
  const [data, setData] = useState<ResourceData | null>(null);
  const [sysCpuHist,  setSysCpuHist]  = useState<number[]>([]);
  const [sysRamHist,  setSysRamHist]  = useState<number[]>([]);
  const [botCpuHist,  setBotCpuHist]  = useState<number[]>([]);
  const [botRamHist,  setBotRamHist]  = useState<number[]>([]);
  const [webCpuHist,  setWebCpuHist]  = useState<number[]>([]);
  const [webRamHist,  setWebRamHist]  = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const push = (setter: React.Dispatch<React.SetStateAction<number[]>>, val: number) =>
    setter(prev => { const n = [...prev, val]; return n.length > MAX_POINTS ? n.slice(-MAX_POINTS) : n; });

  const poll = async () => {
    try {
      const res = await fetch('/api/resource-usage');
      if (!res.ok) return;
      const d: ResourceData = await res.json();
      setData(d);
      push(setSysCpuHist, d.system.cpu);
      push(setSysRamHist, d.system.ram.percent);
      if (d.bot) { push(setBotCpuHist, d.bot.cpu); push(setBotRamHist, d.bot.ramMb); }
      if (d.web) { push(setWebCpuHist, d.web.cpu); push(setWebRamHist, d.web.ramMb); }
    } catch {}
  };

  useEffect(() => {
    poll();
    timerRef.current = setInterval(poll, 2000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sys = data?.system;
  const cpuColor = !sys ? '#58CC02' : sys.cpu > 80 ? '#FF4B4B' : sys.cpu > 50 ? '#FF9600' : '#58CC02';
  const ramColor = !sys ? '#1CB0F6' : sys.ram.percent > 85 ? '#FF4B4B' : sys.ram.percent > 65 ? '#FF9600' : '#1CB0F6';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground/50" />
        <h2 className="text-sm font-semibold text-muted-foreground/70 uppercase tracking-wider">Tài nguyên hệ thống</h2>
        <span className="ml-auto text-[10px] text-muted-foreground/30 animate-pulse">● live</span>
      </div>

      {/* System Overview */}
      <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="h-4 w-4 text-muted-foreground/50" />
          <span className="text-sm font-semibold">Hệ thống</span>
          {sys && <span className="ml-auto text-[10px] text-muted-foreground/30 font-mono truncate max-w-[200px]">{sys.cpuModel}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* CPU */}
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <StatTile label={`CPU (${sys?.cores ?? '—'} lõi)`} value={sys ? sys.cpu.toFixed(1) : '—'} unit="%" color={cpuColor} />
            </div>
            <GaugeBar percent={sys?.cpu ?? 0} color={cpuColor} />
            <Sparkline data={sysCpuHist} max={100} color={cpuColor} />
          </div>

          {/* RAM */}
          <div className="space-y-2">
            <StatTile
              label="RAM"
              value={sys ? (sys.ram.used / 1024).toFixed(1) : '—'}
              unit="GB"
              sub={sys ? `/ ${(sys.ram.total / 1024).toFixed(1)} GB  (${sys.ram.percent}%)` : ''}
              color={ramColor}
            />
            <GaugeBar percent={sys?.ram.percent ?? 0} color={ramColor} />
            <Sparkline data={sysRamHist} max={100} color={ramColor} />
          </div>
        </div>
      </div>

      {/* Process cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProcCard
          title="Bot"
          icon={<Terminal className="h-3.5 w-3.5" style={{ color: '#CE82FF' }} />}
          info={data?.bot ?? null}
          cpuHistory={botCpuHist}
          ramHistory={botRamHist}
          accentCpu="#CE82FF"
          accentRam="#FF9600"
        />
        <ProcCard
          title="Web Dashboard"
          icon={<Globe className="h-3.5 w-3.5" style={{ color: '#1CB0F6' }} />}
          info={data?.web ?? null}
          cpuHistory={webCpuHist}
          ramHistory={webRamHist}
          accentCpu="#1CB0F6"
          accentRam="#58CC02"
        />
      </div>
    </div>
  );
}
