import { NextResponse } from 'next/server';

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:10000/api';
const BOT_API_KEY = process.env.BOT_API_KEY || '';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(`${BOT_API_URL}/settings`, {
      headers: BOT_API_KEY ? { Authorization: `Bearer ${BOT_API_KEY}` } : {},
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      return NextResponse.json({ running: false, online: false, maintenance: true });
    }

    const data = await res.json();
    const maintenanceEnabled = data?.data?.bot?.maintenanceMode?.enabled ?? false;

    return NextResponse.json({
      running: true,           // bot process đang chạy
      online: !maintenanceEnabled, // đang reply Zalo
      maintenance: maintenanceEnabled,
    });
  } catch {
    // Bot không chạy hoặc không reach được
    return NextResponse.json({ running: false, online: false, maintenance: true });
  }
}
