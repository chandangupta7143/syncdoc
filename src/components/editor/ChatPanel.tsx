import { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../services/socket';
import { API_BASE_URL } from '../../config';

interface ChatMessage {
  id: string;
  user: string;
  initials: string;
  color: string;
  text: string;
  type: 'text' | 'file';
  fileUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  time: string;
  socketId: string;
}

interface ChatPanelProps {
  documentId: string;
  userRole: string;
}

function isImageMime(mimeType?: string | null): boolean {
  return !!mimeType && mimeType.startsWith('image/');
}

export default function ChatPanel({ documentId, userRole }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const socket = getSocket();
  const mySocketId = socket.id;
  const isViewer = userRole === 'viewer';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const handleReceiveMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };
    const handleChatHistory = ({ messages: history }: { messages: ChatMessage[] }) => {
      setMessages(history);
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('chat-history', handleChatHistory);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('chat-history', handleChatHistory);
    };
  }, [socket]);

  const handleSend = () => {
    if (!newMessage.trim() || isViewer) return;
    socket.emit('send-message', {
      documentId,
      message: { text: newMessage.trim(), type: 'text' },
    });
    setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isViewer) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      socket.emit('send-message', {
        documentId,
        message: { text: '', type: 'file', fileUrl: data.url, fileName: data.fileName, mimeType: data.mimeType },
      });
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-200/60">
        <h3 className="text-sm font-semibold text-surface-900">Document Chat</h3>
        <p className="text-xs text-surface-700 mt-0.5">{messages.length} messages</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-surface-100 mb-3">
              <svg className="w-6 h-6 text-surface-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <p className="text-sm text-surface-700 font-medium">No messages yet</p>
            <p className="text-xs text-surface-700 mt-1">Start the conversation!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.socketId === mySocketId;
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${msg.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                {msg.initials}
              </div>
              <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  {!isMe && <span className="text-xs font-semibold text-surface-900">{msg.user}</span>}
                  <span className="text-[10px] text-surface-700">{msg.time}</span>
                </div>

                {msg.type === 'text' && (
                  <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe ? 'bg-primary-500 text-white rounded-tr-md' : 'bg-surface-100 text-surface-900 rounded-tl-md'
                  }`}>
                    {msg.text}
                  </div>
                )}

                {msg.type === 'file' && msg.fileUrl && (
                  <div className={`rounded-2xl overflow-hidden border ${isMe ? 'border-primary-400 rounded-tr-md' : 'border-surface-200 rounded-tl-md'}`}>
                    {isImageMime(msg.mimeType) ? (
                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                        <img src={msg.fileUrl} alt={msg.fileName || 'Shared image'} className="max-w-full max-h-48 object-cover" />
                      </a>
                    ) : (
                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 bg-surface-50 hover:bg-surface-100 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                          <svg className="w-4.5 h-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-surface-900 truncate">{msg.fileName}</p>
                          <p className="text-[10px] text-primary-600">Click to download</p>
                        </div>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-surface-200/60">
        {isViewer ? (
          <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-amber-50 border border-amber-200">
            <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span className="text-xs font-medium text-amber-700">Viewers cannot send messages</span>
          </div>
        ) : (
          <>
            {uploading && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <svg className="animate-spin w-3.5 h-3.5 text-primary-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-xs text-primary-600 font-medium">Uploading file...</span>
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-surface-900 bg-surface-100 border border-transparent placeholder:text-surface-700/50 outline-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                />
              </div>
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFileSelect} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-2.5 rounded-xl text-surface-700 hover:bg-surface-100 transition-colors shrink-0 disabled:opacity-40"
                aria-label="Attach file"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
              </button>
              <button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
