export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
        <div className="flex items-center gap-1">
          <span className="typing-dot w-2 h-2 bg-muted-foreground/60 rounded-full" />
          <span className="typing-dot w-2 h-2 bg-muted-foreground/60 rounded-full" />
          <span className="typing-dot w-2 h-2 bg-muted-foreground/60 rounded-full" />
        </div>
      </div>
    </div>
  );
}
