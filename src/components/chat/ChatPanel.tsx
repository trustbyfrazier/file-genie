import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { useFileChat } from '@/hooks/useFileChat';
import { FileRecord } from '@/types/file';

interface ChatPanelProps {
  file: FileRecord | null;
  userId: string;
  open: boolean;
  onClose: () => void;
}

export function ChatPanel({ file, userId, open, onClose }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    historyLoading,
    streaming,
    inputDisabled,
    error,
    sendMessage,
  } = useFileChat({
    userId,
    fileId: file?.file_id || '',
    isOpen: open,
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, streaming]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && !historyLoading) {
      inputRef.current?.focus();
    }
  }, [open, historyLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !inputDisabled) {
      sendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[45vw] lg:w-[40vw] sm:max-w-none p-0 flex flex-col gap-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium truncate">
              {file?.friendly_name || 'Chat'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
          <div className="py-4">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start the conversation about this file!</p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <ChatMessage key={index} message={message} />
                ))}
              </>
            )}
            {streaming && messages[messages.length - 1]?.content === '' && (
              <TypingIndicator />
            )}
          </div>
        </ScrollArea>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 p-4 border-t border-border bg-background/95 backdrop-blur"
        >
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this file..."
            disabled={inputDisabled || historyLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || inputDisabled || historyLoading}
          >
            {streaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
