import { useEffect, useState } from 'react';
import { getSocket } from '../../services/socket';
import type { SocketUser } from '../../services/socket';

// Fallback mock when no socket users yet
const defaultUsers: SocketUser[] = [
  { socketId: 'self', name: 'You', initials: 'JD', color: 'from-primary-400 to-primary-600', status: 'editing' },
];

export default function PresenceUsers() {
  const [users, setUsers] = useState<SocketUser[]>(defaultUsers);

  useEffect(() => {
    const socket = getSocket();

    const handleRoomUsers = ({ users: roomUsers }: { users: SocketUser[] }) => {
      setUsers(roomUsers.length > 0 ? roomUsers : defaultUsers);
    };

    const handleUserJoined = ({ users: roomUsers }: { user: SocketUser; users: SocketUser[] }) => {
      setUsers(roomUsers.length > 0 ? roomUsers : defaultUsers);
    };

    const handleUserLeft = ({ users: roomUsers }: { userId: string; users: SocketUser[] }) => {
      setUsers(roomUsers.length > 0 ? roomUsers : defaultUsers);
    };

    socket.on('room-users', handleRoomUsers);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('room-users', handleRoomUsers);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      {/* User avatars */}
      <div className="flex -space-x-2">
        {users.map((user) => (
          <div key={user.socketId} className="relative group">
            <div
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${user.color} border-2 border-white flex items-center justify-center text-white text-[10px] font-bold cursor-pointer shadow-sm`}
              title={user.name}
            >
              {user.initials}
            </div>
            {/* Online indicator */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                user.status === 'editing' ? 'bg-green-400' : 'bg-amber-400'
              }`}
            />

            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-surface-900 text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {user.name}
              <span className="text-surface-200 ml-1">• {user.status}</span>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-900 rotate-45" />
            </div>
          </div>
        ))}
      </div>

      {/* Count badge */}
      <span className="text-xs font-medium text-surface-700 ml-1">
        {users.length} online
      </span>
    </div>
  );
}
