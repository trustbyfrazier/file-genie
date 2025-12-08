import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, ChatHistoryRow } from '@/types/chat';

const N8N_CHAT_WEBHOOK_URL = 'https://prezzboss.app.n8n.cloud/webhook/7c590627-8218-4b7e-bb88-f1bd224be2af';

interface UseFileChatProps {
  userId: string;
  fileId: string;
  isOpen: boolean;
}

export function useFileChat({ userId, fileId, isOpen }: UseFileChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sessionId = `${userId}${fileId}`;

  const loadHistory = useCallback(async () => {
    if (!userId || !fileId) return;

    setHistoryLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('n8n_chat_histories')
        .select('*')
        .eq('session_id', sessionId)
        .order('id', { ascending: true });

      if (fetchError) throw fetchError;

      const parsedMessages: ChatMessage[] = (data as ChatHistoryRow[] || []).map((row) => ({
        type: row.message.type === 'human' ? 'human' : 'ai',
        content: row.message.content,
      }));

      setMessages(parsedMessages);
    } catch (err) {
      console.error('Error loading chat history:', err);
      setError('Failed to load chat history');
    } finally {
      setHistoryLoading(false);
    }
  }, [userId, fileId, sessionId]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    } else {
      setMessages([]);
      setHistoryLoading(true);
      setError(null);
    }
  }, [isOpen, loadHistory]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || streaming || inputDisabled) return;

    setStreaming(true);
    setInputDisabled(true);
    setError(null);

    // Add user message to UI immediately
    setMessages((prev) => [...prev, { type: 'human', content }]);

    // Add placeholder for AI response
    setMessages((prev) => [...prev, { type: 'ai', content: '', isStreaming: true }]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(N8N_CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: content,
          user_id: userId,
          file_id: fileId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let aiContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        aiContent += chunk;

        // Update the last AI message with accumulated content
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { type: 'ai', content: aiContent, isStreaming: true };
          return updated;
        });
      }

      // Mark streaming complete
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { type: 'ai', content: aiContent, isStreaming: false };
        return updated;
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      console.error('Error sending message:', err);
      setError('Message failed. Try again.');
      
      // Remove the placeholder AI message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
      setInputDisabled(false);
      abortControllerRef.current = null;
    }
  }, [sessionId, userId, fileId, streaming, inputDisabled]);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStreaming(false);
      setInputDisabled(false);
    }
  }, []);

  return {
    messages,
    historyLoading,
    streaming,
    inputDisabled,
    error,
    sendMessage,
    cancelStream,
  };
}
