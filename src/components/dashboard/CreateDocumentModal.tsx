import { useState } from 'react';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
}

export default function CreateDocumentModal({ isOpen, onClose, onCreate }: CreateDocumentModalProps) {
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title.trim());
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-surface-200/60 w-full max-w-md animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200/60">
          <h2 className="text-lg font-bold text-surface-900">Create New Document</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label htmlFor="doc-title" className="block text-sm font-medium text-surface-700 mb-1.5">
              Document Title
            </label>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project Roadmap Q4"
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-sm text-surface-900 bg-surface-50 border border-surface-200 placeholder:text-surface-700/50 outline-none focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>

          {/* Template options */}
          <div>
            <p className="text-sm font-medium text-surface-700 mb-2">Start from template</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Blank', icon: '📄' },
                { label: 'Meeting', icon: '📋' },
                { label: 'Project', icon: '🚀' },
              ].map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-primary-50 text-surface-700 hover:text-primary-700 transition-all text-xs font-medium"
                >
                  <span className="text-xl">{tpl.icon}</span>
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/35 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
