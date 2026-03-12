import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import RichTextEditor from '../components/editor/RichTextEditor';
import PresenceUsers from '../components/editor/PresenceUsers';
import ChatPanel from '../components/editor/ChatPanel';
import AIInsightsPanel from '../components/editor/AIInsightsPanel';
import ShareDocumentModal from '../components/editor/ShareDocumentModal';
import { joinDocument, leaveDocument, disconnectSocket, getSocket } from '../services/socket';
import { API_BASE_URL } from '../config';

type PanelTab = 'chat' | 'ai';

export default function DocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [activePanel, setActivePanel] = useState<PanelTab | null>('chat');
  const [showShareModal, setShowShareModal] = useState(false);
  const [userRole, setUserRole] = useState<string>('editor');

  // Fetch role + socket lifecycle
  useEffect(() => {
    if (!id) return;

    // Get current user email from localStorage
    let userEmail = 'viewer@example.com';
    try {
      const saved = localStorage.getItem('syncdoc_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) {
          userEmail = parsed.email;
        }
      }
    } catch (e) {
      // ignore
    }

    // Fetch user role from server
    let token = '';
    try {
      const saved = localStorage.getItem('syncdoc_user');
      if (saved) token = JSON.parse(saved).token || '';
    } catch {}

    fetch(`${API_BASE_URL}/api/documents/${id}/permissions`, {
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
    })
      .then((r) => r.json())
      .then((data) => {
        // Find our role in the permissions list
        const myPerm = data.permissions.find((p: any) => p.email === userEmail);
        setUserRole(myPerm ? myPerm.role : 'viewer');
      })
      .catch(() => setUserRole('viewer'));

    // Get current user from localStorage
    let currentName = 'Anonymous';
    let currentInitials = 'A';
    try {
      const saved = localStorage.getItem('syncdoc_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) {
          currentName = parsed.name;
          currentInitials = currentName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
        }
      }
    } catch (e) {
      // use defaults
    }

    // Join socket room
    joinDocument(id, {
      name: currentName,
      initials: currentInitials,
      color: 'from-primary-400 to-primary-600',
    });

    // Listen for role assignment from server
    const socket = getSocket();
    const handleYourRole = ({ role }: { role: string }) => {
      setUserRole(role);
    };
    socket.on('your-role', handleYourRole);

    return () => {
      socket.off('your-role', handleYourRole);
      leaveDocument(id);
      disconnectSocket();
    };
  }, [id]);



  const roleBadgeStyles: Record<string, string> = {
    owner: 'bg-primary-50 text-primary-700 border-primary-200',
    editor: 'bg-secondary-50 text-secondary-700 border-secondary-200',
    viewer: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className="h-screen flex flex-col bg-surface-50">
      {/* Top header bar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-surface-200/60 shrink-0">
        {/* Left – back + doc title + role badge */}
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-surface-100 text-surface-700 transition-colors" aria-label="Back to dashboard">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-surface-900 leading-tight">Project Roadmap Q4</h1>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${roleBadgeStyles[userRole] || roleBadgeStyles.viewer}`}>
                  {userRole}
                </span>
              </div>
              <p className="text-[10px] text-surface-700">Document #{id} · Last saved 2 min ago</p>
            </div>
          </div>
        </div>

        {/* Center – presence */}
        <PresenceUsers />

        {/* Right – panel toggles + share */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
            className={`p-2 rounded-lg transition-colors ${activePanel === 'chat' ? 'bg-primary-50 text-primary-600' : 'text-surface-700 hover:bg-surface-100'}`}
            aria-label="Toggle chat" title="Chat"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </button>

          <button
            onClick={() => setActivePanel(activePanel === 'ai' ? null : 'ai')}
            className={`p-2 rounded-lg transition-colors ${activePanel === 'ai' ? 'bg-primary-50 text-primary-600' : 'text-surface-700 hover:bg-surface-100'}`}
            aria-label="Toggle AI" title="AI Insights"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </button>

          <div className="w-px h-5 bg-surface-200 mx-1" />

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 shadow-md shadow-primary-500/20 hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            Share
          </button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor column */}
        <div className="flex-1 flex flex-col min-w-0">
          <RichTextEditor documentId={id || '1'} userRole={userRole} />
        </div>

        {/* Right sidebar panel */}
        {activePanel && (
          <div className="w-80 xl:w-96 border-l border-surface-200/60 bg-white shrink-0 flex flex-col overflow-hidden">
            <div className="flex border-b border-surface-200/60 shrink-0">
              <button
                onClick={() => setActivePanel('chat')}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                  activePanel === 'chat' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-surface-700 hover:text-surface-900'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActivePanel('ai')}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                  activePanel === 'ai' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-surface-700 hover:text-surface-900'
                }`}
              >
                AI Insights
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {activePanel === 'chat' ? (
                <ChatPanel documentId={id || '1'} userRole={userRole} />
              ) : (
                <AIInsightsPanel documentId={id || '1'} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareDocumentModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        documentId={id || '1'}
        currentUserRole={userRole}
      />
    </div>
  );
}
