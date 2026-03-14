import { Hono } from 'hono';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../');

const credentialsPath = path.join(projectRoot, 'credentials.json');
const credentialsBase64Path = path.join(projectRoot, 'credentials.base64.txt');
const qrPath = path.join(projectRoot, 'qr.png');

function safeDelete(filePath: string, deleted: string[]) {
  if (!fs.existsSync(filePath)) return;
  fs.unlinkSync(filePath);
  deleted.push(path.basename(filePath));
}

export const zaloAuthApi = new Hono();

zaloAuthApi.get('/status', (c) => {
  try {
    const credentialsExists = fs.existsSync(credentialsPath);
    const credentialsBase64Exists = fs.existsSync(credentialsBase64Path);
    const qrExists = fs.existsSync(qrPath);
    const qrUpdatedAt = qrExists ? fs.statSync(qrPath).mtime.toISOString() : null;
    const qrSize = qrExists ? fs.statSync(qrPath).size : 0;

    return c.json({
      success: true,
      data: {
        botDir: projectRoot,
        credentialsExists,
        credentialsBase64Exists,
        qrExists,
        qrUpdatedAt,
        qrSize,
      },
    });
  } catch (error) {
    return c.json(
      { success: false, error: `Không lấy được trạng thái đăng nhập Zalo: ${(error as Error).message}` },
      500,
    );
  }
});

zaloAuthApi.get('/qr', (c) => {
  try {
    if (!fs.existsSync(qrPath)) {
      return c.json(
        { success: false, error: 'Chưa có mã QR. Hãy khởi động bot hoặc xóa phiên để tạo QR mới.' },
        404,
      );
    }

    const file = fs.readFileSync(qrPath);
    return new Response(file, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    return c.json(
      { success: false, error: `Không đọc được mã QR: ${(error as Error).message}` },
      500,
    );
  }
});

zaloAuthApi.delete('/session', (c) => {
  try {
    const deleted: string[] = [];
    safeDelete(credentialsPath, deleted);
    safeDelete(credentialsBase64Path, deleted);
    safeDelete(qrPath, deleted);

    return c.json({
      success: true,
      data: { deleted },
      message: deleted.length > 0 ? 'Đã xóa phiên đăng nhập.' : 'Không có phiên cũ để xóa.',
    });
  } catch (error) {
    return c.json(
      { success: false, error: `Không xóa được phiên đăng nhập: ${(error as Error).message}` },
      500,
    );
  }
});
