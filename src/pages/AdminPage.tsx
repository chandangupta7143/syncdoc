import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  doc_count?: number;
}

interface Document {
  id: string;
  title: string;
  owner_name: string;
  owner_email: string;
  created_at: string;
  updated_at: string;
  perm_count?: number;
}

type AdminTab = 'overview' | 'users' | 'documents';

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalDocs: 0, totalMessages: 0, activeToday: 0 });

  const getToken = useCallback(() => {
    try {
      const saved = localStorage.getItem('syncdoc_user');
      if (saved) return JSON.parse(saved).token || '';
    } catch { /* */ }
    return '';
  }, []);

  // Load admin data
  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login'); return; }

    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch users
        const usersRes = await fetch(`${API_BASE_URL}/api/admin/users`, { headers });
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users || []);
        }

        // Fetch all documents
        const docsRes = await fetch(`${API_BASE_URL}/api/admin/documents`, { headers });
        if (docsRes.ok) {
          const data = await docsRes.json();
          setDocuments(data.documents || []);
        }

        // Fetch stats
        const statsRes = await fetch(`${API_BASE_URL}/api/admin/stats`, { headers });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Admin fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken, navigate]);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? All their documents will be deleted too.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (res.ok) setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) { console.error(err); }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (res.ok) setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) { console.error(err); }
  };

  const tabItems = [
    { id: 'overview' as AdminTab, label: 'Overview', icon: '📊' },
    { id: 'users' as AdminTab, label: 'Users', icon: '👥' },
    { id: 'documents' as AdminTab, label: 'Documents', icon: '📄' },
  ];

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-surface-200/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 rounded-lg hover:bg-surface-100 text-surface-700 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/25">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
                  <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-surface-900">Admin Panel</h1>
                <p className="text-[11px] text-surface-500">Manage users, documents & system</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tab navigation */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-surface-200 p-1 mb-6 w-fit">
          {tabItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                  : 'text-surface-600 hover:bg-surface-100'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-surface-500">Loading admin data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* ═══ OVERVIEW TAB ═══ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Users', value: stats.totalUsers, icon: '👥', gradient: 'from-blue-500 to-indigo-600', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200' },
                    { label: 'Total Documents', value: stats.totalDocs, icon: '📄', gradient: 'from-emerald-500 to-teal-600', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200' },
                    { label: 'Total Messages', value: stats.totalMessages, icon: '💬', gradient: 'from-violet-500 to-purple-600', bg: 'from-violet-50 to-purple-50', border: 'border-violet-200' },
                    { label: 'Active Today', value: stats.activeToday, icon: '🟢', gradient: 'from-amber-500 to-orange-600', bg: 'from-amber-50 to-orange-50', border: 'border-amber-200' },
                  ].map(stat => (
                    <div key={stat.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bg} border ${stat.border} p-5`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">{stat.label}</p>
                          <p className="text-3xl font-bold text-surface-900 mt-1">{stat.value}</p>
                        </div>
                        <span className="text-3xl">{stat.icon}</span>
                      </div>
                      <div className={`absolute -bottom-2 -right-2 w-20 h-20 rounded-full bg-gradient-to-br ${stat.gradient} opacity-10`} />
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-surface-200/60">
                      <h3 className="text-sm font-bold text-surface-900">Recent Users</h3>
                    </div>
                    <div className="divide-y divide-surface-100">
                      {users.slice(0, 5).map(user => (
                        <div key={user.id} className="px-5 py-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                            {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-900 truncate">{user.name}</p>
                            <p className="text-xs text-surface-500 truncate">{user.email}</p>
                          </div>
                          <span className="text-[10px] text-surface-400">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                      {users.length === 0 && (
                        <div className="px-5 py-8 text-center text-sm text-surface-400">No users yet</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-surface-200/60">
                      <h3 className="text-sm font-bold text-surface-900">Recent Documents</h3>
                    </div>
                    <div className="divide-y divide-surface-100">
                      {documents.slice(0, 5).map(doc => (
                        <div key={doc.id} className="px-5 py-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-900 truncate">{doc.title}</p>
                            <p className="text-xs text-surface-500 truncate">by {doc.owner_name || doc.owner_email}</p>
                          </div>
                          <span className="text-[10px] text-surface-400">{new Date(doc.updated_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                      {documents.length === 0 && (
                        <div className="px-5 py-8 text-center text-sm text-surface-400">No documents yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ USERS TAB ═══ */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-surface-200/60 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-surface-900">All Users</h3>
                    <p className="text-xs text-surface-500 mt-0.5">{users.length} registered users</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-50 text-left">
                        <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Documents</th>
                        <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-surface-50/50 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <span className="font-medium text-surface-900">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-surface-600">{user.email}</td>
                          <td className="px-6 py-3.5 text-surface-500">{new Date(user.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-3.5">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 border border-primary-200">
                              {user.doc_count || 0}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 transition-all"
                              title="Delete User"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="py-12 text-center text-sm text-surface-400">No users found</div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ DOCUMENTS TAB ═══ */}
            {activeTab === 'documents' && (
              <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-surface-200/60 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-surface-900">All Documents</h3>
                    <p className="text-xs text-surface-500 mt-0.5">{documents.length} documents in system</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-50 text-left">
                        <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Document</th>
                        <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Owner</th>
                        <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Updated</th>
                        <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {documents.map(doc => (
                        <tr key={doc.id} className="hover:bg-surface-50/50 transition-colors">
                          <td className="px-6 py-3.5">
                            <Link to={`/document/${doc.id}`} className="flex items-center gap-3 group">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                                <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                              </div>
                              <span className="font-medium text-surface-900 group-hover:text-primary-600 transition-colors">{doc.title}</span>
                            </Link>
                          </td>
                          <td className="px-6 py-3.5 text-surface-600">{doc.owner_name || doc.owner_email}</td>
                          <td className="px-6 py-3.5 text-surface-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-3.5 text-surface-500">{new Date(doc.updated_at).toLocaleDateString()}</td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                to={`/document/${doc.id}`}
                                className="p-1.5 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-primary-50 transition-all"
                                title="Open Document"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                              </Link>
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                title="Delete Document"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {documents.length === 0 && (
                    <div className="py-12 text-center text-sm text-surface-400">No documents found</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
