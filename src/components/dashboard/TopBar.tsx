import { useState, useEffect } from 'react';
import SearchBar from './SearchBar';

interface TopBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCreateDocument: () => void;
  sidebarCollapsed: boolean;
}

export default function TopBar({ searchValue, onSearchChange, onCreateDocument, sidebarCollapsed }: TopBarProps) {
  const [user, setUser] = useState({ name: 'John Doe', initials: 'JD' });

  useEffect(() => {
    const saved = localStorage.getItem('syncdoc_user');
    if (saved) {
      try {
        const { name } = JSON.parse(saved);
        const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
        setUser({ name, initials });
      } catch (e) {
        // use default
      }
    }
  }, []);

  return (
    <header
      className={`
        sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-surface-200/60
        transition-all duration-300
        ${sidebarCollapsed ? 'pl-[72px]' : 'pl-64'}
      `}
    >
      <div className="flex items-center justify-between px-6 py-3.5">
        {/* Search */}
        <SearchBar value={searchValue} onChange={onSearchChange} />

        {/* Right actions */}
        <div className="flex items-center gap-3 ml-4">
          {/* Notifications */}
          <button
            className="relative p-2.5 rounded-xl hover:bg-surface-100 text-surface-700 transition-colors"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* Create Document */}
          <button
            onClick={onCreateDocument}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/35 hover:-translate-y-0.5 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">New Document</span>
          </button>

          {/* Avatar */}
          <div 
            className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer ring-2 ring-white shadow-sm"
            title={user.name}
          >
            {user.initials}
          </div>
        </div>
      </div>
    </header>
  );
}
