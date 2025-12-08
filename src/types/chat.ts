export interface ChatMessage {
  type: 'human' | 'ai';
  content: string;
  isStreaming?: boolean;
}

export interface ChatHistoryRow {
  id: number;
  session_id: string;
  message: {
    type: string;
    content: string;
    additional_kwargs?: Record<string, unknown>;
    response_metadata?: Record<string, unknown>;
  };
}

export interface ChatState {
  messages: ChatMessage[];
  historyLoading: boolean;
  streaming: boolean;
  inputDisabled: boolean;
  error: string | null;
}
