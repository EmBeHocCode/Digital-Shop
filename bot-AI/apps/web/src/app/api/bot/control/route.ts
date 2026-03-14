import { NextRequest, NextResponse } from 'next/server';

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:10000/api';
const BOT_API_KEY = process.env.BOT_API_KEY || '';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body?.action as string;

  if (action !== 'start' && action !== 'stop') {
    return NextResponse.json({ success: false, message: 'Action không hợp lệ (start | stop)' }, { status: 400 });
  }

  const maintenanceEnabled = action === 'stop'; // stop = bật maintenance = ngừng reply

  try {
    // Đọc settings hiện tại
    const getRes = await fetch(`${BOT_API_URL}/settings`, {
      headers: BOT_API_KEY ? { Authorization: `Bearer ${BOT_API_KEY}` } : {},
      signal: AbortSignal.timeout(3000),
    });

    if (!getRes.ok) {
      return NextResponse.json({ success: false, message: 'Bot API không phản hồi' }, { status: 502 });
    }

    const current = await getRes.json();
    const currentSettings = current?.data ?? {};

    // Cập nhật maintenanceMode
    const updated = {
      ...currentSettings,
      bot: {
        ...currentSettings.bot,
        maintenanceMode: {
          ...(currentSettings.bot?.maintenanceMode ?? {}),
          enabled: maintenanceEnabled,
        },
      },
    };

    const putRes = await fetch(`${BOT_API_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(BOT_API_KEY ? { Authorization: `Bearer ${BOT_API_KEY}` } : {}),
      },
      body: JSON.stringify(updated),
      signal: AbortSignal.timeout(3000),
    });

    if (!putRes.ok) {
      return NextResponse.json({ success: false, message: 'Không thể cập nhật settings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: action === 'start' ? 'Bot đã bật reply Zalo' : 'Bot đã dừng reply Zalo',
      online: !maintenanceEnabled,
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Bot API không phản hồi' }, { status: 502 });
  }
}
