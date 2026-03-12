import { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import EditorToolbar from './EditorToolbar';
import { SlashCommand } from './extensions/SlashCommand';
import { emitDocumentChange, getSocket } from '../../services/socket';

interface RichTextEditorProps {
  documentId: string;
  userRole: string;
}

const placeholderContent = `
<h1>Project Roadmap Q4</h1>
<p>Welcome to SyncDoc — your AI-powered collaborative workspace. Start typing to edit this document in real time with your team.</p>
<h2>Objectives</h2>
<ul>
  <li>Launch the beta version of the collaborative editor</li>
  <li>Integrate AI-powered text suggestions using Google Gemini</li>
  <li>Implement role-based access control for document sharing</li>
  <li>Deploy real-time chat and file upload features</li>
</ul>
<h2>Timeline</h2>
<p>The project is divided into multiple sprints. Each sprint focuses on a specific feature module, allowing incremental delivery and testing.</p>
<p><strong>Sprint 1:</strong> Authentication and user management</p>
<p><strong>Sprint 2:</strong> Document CRUD and dashboard UI</p>
<p><strong>Sprint 3:</strong> Real-time collaboration with WebSockets</p>
<p><strong>Sprint 4:</strong> AI integration and final polish</p>
<h2>Notes</h2>
<p>This is a placeholder document. In production, content will be synced in real-time across all connected clients using Socket.io.</p>
`;

export default function RichTextEditor({ documentId, userRole }: RichTextEditorProps) {
  const isReadOnly = userRole === 'viewer';
  const [permDenied, setPermDenied] = useState(false);
  const isRemoteUpdate = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      SlashCommand,
      Placeholder.configure({
        placeholder: "Type '/' for commands or start typing...",
      }),
    ],
    content: placeholderContent,
    editable: !isReadOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[500px] ' +
          '[&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:text-surface-900 [&_h1]:mb-4 [&_h1]:tracking-tight ' +
          '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-surface-900 [&_h2]:mt-8 [&_h2]:mb-3 ' +
          '[&_p]:text-surface-700 [&_p]:leading-relaxed [&_p]:mb-3 ' +
          '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 ' +
          '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 ' +
          '[&_li]:text-surface-700 [&_li]:mb-1 [&_li]:leading-relaxed ' +
          '[&_strong]:text-surface-900 [&_strong]:font-semibold ' +
          '[&_em]:italic [&_u]:underline ' +
          'selection:bg-primary-100 p-8',
      },
    },
    onUpdate: ({ editor }) => {
      if (isRemoteUpdate.current || isReadOnly) return;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        emitDocumentChange(documentId, editor.getHTML());
      }, 500);
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  useEffect(() => {
    const socket = getSocket();

    const handleDocumentChange = ({ content }: { content: string; userId: string }) => {
      if (editor && content !== editor.getHTML()) {
        isRemoteUpdate.current = true;
        const currentPos = editor.state.selection.$anchor.pos;
        editor.commands.setContent(content, { emitUpdate: false });
        try {
          editor.commands.setTextSelection(Math.min(currentPos, editor.state.doc.content.size));
        } catch (e) {
          // Ignore
        }
        isRemoteUpdate.current = false;
      }
    };

    const handleDocumentLoad = ({ content }: { content: string }) => {
      if (editor && content) {
        isRemoteUpdate.current = true;
        editor.commands.setContent(content, { emitUpdate: false });
        isRemoteUpdate.current = false;
      }
    };

    const handlePermissionDenied = () => {
      setPermDenied(true);
      setTimeout(() => setPermDenied(false), 3000);
    };

    socket.on('document-change', handleDocumentChange);
    socket.on('document-load', handleDocumentLoad);
    socket.on('permission-denied', handlePermissionDenied);

    return () => {
      socket.off('document-change', handleDocumentChange);
      socket.off('document-load', handleDocumentLoad);
      socket.off('permission-denied', handlePermissionDenied);
    };
  }, [editor]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white relative">
      <div className={isReadOnly ? 'opacity-40 pointer-events-none' : ''}>
        <EditorToolbar editor={editor} />
      </div>
      
      <div className="flex-1 overflow-y-auto w-full">
        <div className="mx-auto max-w-3xl pt-6 px-8 pb-4">
          {/* Status bar */}
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className={`w-2 h-2 rounded-full ${isReadOnly ? 'bg-amber-400' : 'bg-green-400 animate-pulse'}`} />
            <span className="text-[11px] text-surface-700 font-medium">
              {isReadOnly ? 'Read-only — You have Viewer access' : 'Live — changes sync instantly'}
            </span>
          </div>

          {/* Permission denied toast */}
          {permDenied && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              You do not have permission to edit this document.
            </div>
          )}
        </div>
        
        <div className="mx-auto max-w-3xl pb-20">
          <EditorContent editor={editor} className={isReadOnly ? 'cursor-default opacity-90' : ''} />
        </div>
      </div>
    </div>
  );
}
