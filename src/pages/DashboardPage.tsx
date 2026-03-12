import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import DocumentCard from '../components/dashboard/DocumentCard';
import CreateDocumentModal from '../components/dashboard/CreateDocumentModal';
import type { DocumentData } from '../components/dashboard/DocumentCard';
import { API_BASE_URL } from '../config';


export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [userDocs, setUserDocs] = useState<DocumentData[]>([]);
  const [currentUser, setCurrentUser] = useState({ name: 'John Doe', email: 'john@example.com', initials: 'JD' });

  useEffect(() => {
    const saved = localStorage.getItem('syncdoc_user');
    let token = '';
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const name = parsed.name || 'User';
        const email = parsed.email || 'user@example.com';
        token = parsed.token || '';
        const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
        setCurrentUser({ name, email, initials });
      } catch (e) {
      }
    }

    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch documents from PostgreSQL backend
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/documents`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Transform backend docs to frontend interface
          const formattedDocs = data.documents.map((doc: any) => ({
            id: doc.id,
            title: doc.title,
            preview: 'Document content preview...', 
            updatedAt: new Date(doc.updated_at).toLocaleDateString(),
            owner: doc.owner_name,
            collaborators: [
              { name: doc.owner_name, initials: 'O', color: 'bg-primary-500' }
            ],
            role: doc.role === 'owner' ? 'Owner' : (doc.role === 'editor' ? 'Editor' : 'Viewer')
          }));
          setUserDocs(formattedDocs);
        } else {
          console.error('Failed to fetch documents');
        }
      } catch (err) {
        console.error('API Error:', err);
      }
    };

    fetchDocuments();
  }, [navigate]);

  const filteredDocuments = useMemo(() => {
    let docs = userDocs;
    // Filter based on active route
    if (location.pathname === '/shared') {
      docs = docs.filter(doc => doc.role !== 'Owner');
    } else if (location.pathname === '/recent') {
      // Just a mock sort for demonstration
      docs = [...docs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }

    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      docs = docs.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.preview.toLowerCase().includes(q)
      );
    }
    
    // Convert owner emails to names for display
    return docs.map((doc) => ({
      ...doc,
      owner: doc.owner === currentUser.email ? currentUser.name : (doc.owner.split('@')[0] || doc.owner),
      role: doc.owner === currentUser.email ? 'Owner' : doc.role,
    }));
  }, [searchValue, userDocs, currentUser, location.pathname]);

  const handleCreateDocument = async (title: string) => {
    const saved = localStorage.getItem('syncdoc_user');
    let token = '';
    if (saved) {
      try { token = JSON.parse(saved).token; } catch (e) {}
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowCreateModal(false);
        navigate(`/document/${data.id}`);
      } else {
        console.error('Failed to create document');
      }
    } catch (err) {
      console.error('API Error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((s) => !s)}
      />

      {/* Main area */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-64'}`}>
        {/* TopBar */}
        <TopBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onCreateDocument={() => setShowCreateModal(true)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Content */}
        <main className="px-8 py-8">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
              {location.pathname === '/shared' ? 'Shared with Me' : 
               location.pathname === '/recent' ? 'Recent Documents' : 
               location.pathname === '/settings' ? 'Settings' : 
               'My Documents'}
            </h1>
            <p className="mt-1 text-sm text-surface-700">
              {location.pathname === '/settings' 
                ? 'Manage your account and preferences' 
                : `${filteredDocuments.length} document${filteredDocuments.length !== 1 ? 's' : ''} in this view`
              }
            </p>
          </div>
          
          {location.pathname === '/settings' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-surface-200 p-8 max-w-2xl">
              <h2 className="text-lg font-bold text-surface-900 mb-6">Profile Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">Display Name</label>
                  <input type="text" value={currentUser.name} disabled className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-surface-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">Email Address</label>
                  <input type="email" value={currentUser.email} disabled className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-surface-900" />
                </div>
                <div className="pt-4 border-t border-surface-200">
                  <button onClick={() => {
                    localStorage.removeItem('syncdoc_user');
                    navigate('/');
                  }} className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors">
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Documents', value: userDocs.length, icon: '📄', color: 'from-primary-50 to-primary-100 border-primary-200' },
              { label: 'Shared with Me', value: userDocs.filter((d) => d.owner !== currentUser.email).length, icon: '🤝', color: 'from-secondary-50 to-secondary-100 border-secondary-200' },
              { label: 'Active Collaborators', value: [...new Set(userDocs.flatMap(d => d.collaborators.map(c => c.email || c.name)))].filter(e => e !== currentUser.email && e !== currentUser.name).length, icon: '👥', color: 'from-amber-50 to-orange-50 border-amber-200' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br ${stat.color} border`}
              >
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-2xl font-bold text-surface-900">{stat.value}</p>
                  <p className="text-xs text-surface-700">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Document grid */}
          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredDocuments.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-100 mb-4">
                <svg className="w-8 h-8 text-surface-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <p className="text-surface-700 font-medium">No documents found</p>
              <p className="text-sm text-surface-700 mt-1">Try adjusting your search query</p>
            </div>
          )}
            </>
          )}
        </main>
      </div>

      {/* Create Document Modal */}
      <CreateDocumentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateDocument}
      />
    </div>
  );
}
