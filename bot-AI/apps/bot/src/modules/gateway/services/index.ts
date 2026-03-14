/**
 * Gateway Services - Message processing utilities
 */

export {
  addToBuffer,
  destroyMessageBuffer,
  getBufferConfig,
  initMessageBuffer,
  startTypingWithRefresh,
  stopTyping,
} from './message.buffer.js';

export { buildPrompt, extractTextFromMessages, processPrefix } from './prompt.builder.js';

export { extractQuoteInfo, parseQuoteAttachment, type QuoteMedia } from './quote.parser.js';

export { isAutoReplyEnabled, getAutoReplyGroups, setAutoReply } from './autoReply.service.js';

export { handleQuickCommand } from './quick-command.handler.js';

export { processMinigameCommand } from './minigame.handler.js';
