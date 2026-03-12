import { useState, useEffect } from 'react';

interface Permission {
  userId: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  role: 'owner' | 'editor' | 'viewer';
}

interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  currentUserRole: string;
}

const roleLabels: Record<string, { label: string; desc: string; color: string }> = {
  owner: { label: 'Owner', desc: 'Full access', color: 'bg-primary-50 text-primary-700 border-primary-200' },
  editor: { label: 'Editor', desc: 'Can edit & chat', color: 'bg-secondary-50 text-secondary-700 border-secondary-200' },
  viewer: { label: 'Viewer', desc: 'Read-only', color: 'bg-surface-100 text-surface-700 border-surface-200' },
};

export default function ShareDocumentModal({ isOpen, onClose, documentId, currentUserRole }: ShareDocumentModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch existing permissions
  useEffect(() => {
    if (!isOpen) return;
    fetch(`http://localhost:5000/documents/${documentId}/permissions`)
      .then((r) => r.json())
      .then((data) => setPermissions(data.permissions || []))
      .catch(() => {});
  }, [isOpen, documentId]);

  const handleShare = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`http://localhost:5000/documents/${documentId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'u1' },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to share');
        return;
      }

      setSuccess(`Shared with ${data.permission.name} as ${role}`);
      setEmail('');

      // Refresh permissions
      const permsRes = await fetch(`http://localhost:5000/documents/${documentId}/permissions`);
      const permsData = await permsRes.json();
      setPermissions(permsData.permissions || []);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/documents/${documentId}/share/${userId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'u1' },
      });
      if (res.ok) {
        setPermissions((prev) => prev.filter((p) => p.userId !== userId));
      }
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-surface-200/60 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200/60">
          <div>
            <h2 className="text-lg font-bold text-surface-900">Share Document</h2>
            <p className="text-xs text-surface-700 mt-0.5">Manage who can access this document</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-700 transition-colors" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Share form (only for owners) */}
          {currentUserRole === 'owner' && (
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Invite by email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); setSuccess(''); }}
                  placeholder="user@email.com"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm text-surface-900 bg-surface-50 border border-surface-200 placeholder:text-surface-700/50 outline-none focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium text-surface-700 bg-surface-50 border border-surface-200 outline-none focus:border-primary-400 transition-all"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  onClick={handleShare}
                  disabled={loading || !email.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 shadow-md shadow-primary-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? 'Sharing...' : 'Share'}
                </button>
              </div>

              {/* Feedback */}
              {error && (
                <p className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  {error}
                </p>
              )}
              {success && (
                <p className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {success}
                </p>
              )}

              <p className="mt-2 text-[10px] text-surface-700">
                Test emails: sarah@syncdoc.com, alex@syncdoc.com, emily@syncdoc.com, mike@syncdoc.com
              </p>
            </div>
          )}

          {/* People with access */}
          <div>
            <h3 className="text-sm font-semibold text-surface-900 mb-3">
              People with access ({permissions.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {permissions.map((perm) => (
                <div key={perm.userId} className="flex items-center justify-between p-3 rounded-xl bg-surface-50/80 border border-surface-200/60">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${perm.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                      {perm.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900">{perm.name}</p>
                      <p className="text-[11px] text-surface-700">{perm.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${roleLabels[perm.role].color}`}>
                      {roleLabels[perm.role].label}
                    </span>
                    {currentUserRole === 'owner' && perm.role !== 'owner' && (
                      <button
                        onClick={() => handleRemove(perm.userId)}
                        className="p-1 rounded-lg hover:bg-red-50 text-surface-700 hover:text-red-600 transition-colors"
                        title="Remove access"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
