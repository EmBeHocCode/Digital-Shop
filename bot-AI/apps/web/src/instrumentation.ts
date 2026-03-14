/**
 * Next.js Instrumentation - chạy khi server khởi động
 * Bot được khởi động riêng qua run.cmd (cửa sổ Meow - Bot)
 */
export async function register() {
  // Init BotManager singleton để sẵn sàng khi user bấm Start từ Bot Terminal
  if (process.env.NEXT_RUNTIME === 'edge') return;
  const { botManager } = await import('@/lib/bot-manager');
  console.log('[Instrumentation] BotManager ready, status:', botManager.status);
}
