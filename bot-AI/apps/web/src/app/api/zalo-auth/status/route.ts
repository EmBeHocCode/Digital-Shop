import { NextResponse } from 'next/server';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

function getBotDir() {
  return process.env.BOT_DIR || path.resolve(process.cwd(), '..', 'bot');
}

export async function GET() {
  try {
    const botDir = getBotDir();
    const credentialsPath = path.join(botDir, 'credentials.json');
    const credentialsBase64Path = path.join(botDir, 'credentials.base64.txt');
    const qrPath = path.join(botDir, 'qr.png');

    const credentialsExists = existsSync(credentialsPath);
    const credentialsBase64Exists = existsSync(credentialsBase64Path);
    const qrExists = existsSync(qrPath);
    const qrUpdatedAt = qrExists ? statSync(qrPath).mtime.toISOString() : null;
    const qrSize = qrExists ? statSync(qrPath).size : 0;

    return NextResponse.json({
      success: true,
      data: {
        botDir,
        credentialsExists,
        credentialsBase64Exists,
        qrExists,
        qrUpdatedAt,
        qrSize,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Không lấy được trạng thái đăng nhập Zalo: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}
