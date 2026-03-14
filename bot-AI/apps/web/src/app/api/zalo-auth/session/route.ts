import { NextResponse } from 'next/server';
import { existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

function getBotDir() {
  return process.env.BOT_DIR || path.resolve(process.cwd(), '..', 'bot');
}

function safeDelete(filePath: string, deleted: string[]) {
  if (!existsSync(filePath)) return;
  unlinkSync(filePath);
  deleted.push(path.basename(filePath));
}

export async function DELETE() {
  try {
    const botDir = getBotDir();
    const deleted: string[] = [];

    safeDelete(path.join(botDir, 'credentials.json'), deleted);
    safeDelete(path.join(botDir, 'credentials.base64.txt'), deleted);
    safeDelete(path.join(botDir, 'qr.png'), deleted);

    return NextResponse.json({
      success: true,
      data: {
        deleted,
      },
      message: deleted.length > 0 ? 'Đã xóa phiên đăng nhập.' : 'Không có phiên cũ để xóa.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Không xóa được phiên đăng nhập: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}
