import { NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

function getBotDir() {
  return process.env.BOT_DIR || path.resolve(process.cwd(), '..', 'bot');
}

export async function GET() {
  try {
    const qrPath = path.join(getBotDir(), 'qr.png');
    if (!existsSync(qrPath)) {
      return NextResponse.json(
        { success: false, error: 'Chưa có mã QR. Hãy khởi động bot hoặc xóa phiên để tạo QR mới.' },
        { status: 404 },
      );
    }

    const file = readFileSync(qrPath);
    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Không đọc được mã QR: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}
