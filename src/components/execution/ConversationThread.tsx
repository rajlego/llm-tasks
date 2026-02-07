import type { ConversationMessage } from '../../models/conversation';
import { formatRelativeTime } from '../../utils/date';

interface ConversationThreadProps {
  messages: ConversationMessage[];
}

export function ConversationThread({ messages }: ConversationThreadProps) {
  return (
    <div className="space-y-3">
      {messages
        .filter(m => m.role !== 'system')
        .map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
    </div>
  );
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isTool = message.role === 'tool';

  return (
    <div className={`chat ${isUser ? 'chat-end' : 'chat-start'}`}>
      <div className="chat-header text-xs opacity-50">
        {isUser ? 'You' : isAssistant ? 'AI' : 'Tool'}
        <time className="ml-2">{formatRelativeTime(message.timestamp)}</time>
      </div>
      <div
        className={`chat-bubble chat-bubble-sm ${
          isUser
            ? 'chat-bubble-primary'
            : isTool
              ? 'chat-bubble-accent'
              : ''
        }`}
      >
        <pre className="whitespace-pre-wrap text-sm">{message.content}</pre>
      </div>
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className="chat-footer text-xs opacity-50">
          Called: {message.toolCalls.map(tc => tc.name).join(', ')}
        </div>
      )}
    </div>
  );
}
