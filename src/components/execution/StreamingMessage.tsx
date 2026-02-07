interface StreamingMessageProps {
  content: string;
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="bg-base-200 p-3 rounded-lg border border-base-300">
      <pre className="whitespace-pre-wrap text-sm font-mono">{content}</pre>
      <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
    </div>
  );
}
