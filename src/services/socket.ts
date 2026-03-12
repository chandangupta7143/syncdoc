import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

// Singleton socket instance
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    let token = '';
    try {
      const saved = localStorage.getItem('syncdoc_user');
      if (saved) token = JSON.parse(saved).token || '';
    } catch {}

    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: { token }
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    // Refresh token in case it changed since socket initialization
    try {
      const saved = localStorage.getItem('syncdoc_user');
      if (saved) {
        const token = JSON.parse(saved).token || '';
        s.auth = { token };
      }
    } catch {}
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

// ── Event helpers ──────────────────────────────────────

export interface SocketUser {
  socketId: string;
  name: string;
  initials: string;
  color: string;
  status: 'editing' | 'viewing';
}

export interface CursorData {
  userId: string;
  user: SocketUser;
  cursor: { x: number; y: number; offset: number };
}

export function joinDocument(
  documentId: string,
  user: { name: string; initials: string; color: string }
): void {
  const s = connectSocket();
  s.emit('join-document', { documentId, user });
}

export function leaveDocument(documentId: string): void {
  const s = getSocket();
  s.emit('leave-document', { documentId });
}

export function emitDocumentChange(documentId: string, content: string): void {
  const s = getSocket();
  s.emit('document-change', { documentId, content });
}

export function emitCursorUpdate(
  documentId: string,
  cursor: { x: number; y: number; offset: number }
): void {
  const s = getSocket();
  s.emit('cursor-update', { documentId, cursor });
}
