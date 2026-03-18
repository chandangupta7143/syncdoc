import { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import EditorToolbar from './EditorToolbar';
import { SlashCommand } from './extensions/SlashCommand';
import { emitDocumentChange, emitCursorUpdate, getSocket } from '../../services/socket';
import type { CursorData } from '../../services/socket';

interface RichTextEditorProps {
  documentId: string;
  userRole: string;
}

export default function RichTextEditor({ documentId, userRole }: RichTextEditorProps) {
  const isReadOnly = userRole === 'viewer';
  const [permDenied, setPermDenied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'syncing' | 'offline'>('saved');
  const [remoteCursors, setRemoteCursors] = useState<Record<string, CursorData>>({});
  const [wordCount, setWordCount] = useState(0);

  const isRemoteUpdate = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedContent = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'syncdoc-code-block' } },
        blockquote: { HTMLAttributes: { class: 'syncdoc-blockquote' } },
        horizontalRule: { HTMLAttributes: { class: 'syncdoc-hr' } },
      }),
      Underline,
      TaskList.configure({ HTMLAttributes: { class: 'syncdoc-task-list' } }),
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'syncdoc-link' } }),
      Image.configure({ inline: true, allowBase64: true }),
      TextStyle,
      Color,
      SlashCommand,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            const level = node.attrs.level;
            if (level === 1) return 'Untitled';
            if (level === 2) return 'Heading 2';
            return 'Heading 3';
          }
          return "Type '/' for commands, or start writing...";
        },
      }),
    ],
    content: '',
    editable: !isReadOnly,
    editorProps: {
      attributes: {
        class: 'syncdoc-editor focus:outline-none min-h-[600px] px-8 py-6',
      },
    },
    onUpdate: ({ editor }) => {
      if (isRemoteUpdate.current || isReadOnly) return;

      // Update word count
      const text = editor.state.doc.textContent;
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);

      setSyncStatus('syncing');
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        emitDocumentChange(documentId, editor.getHTML());
        setSyncStatus('saved');
      }, 500);
    },
    onSelectionUpdate: ({ editor }) => {
      if (isReadOnly) return;

      if (cursorTimer.current) clearTimeout(cursorTimer.current);
      cursorTimer.current = setTimeout(() => {
        const { selection } = editor.state;
        emitCursorUpdate(documentId, { x: 0, y: 0, offset: selection.$anchor.pos });
      }, 200);
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  const handleDocumentChange = useCallback(({ content }: { content: string; userId: string }) => {
    if (editor && content !== editor.getHTML()) {
      isRemoteUpdate.current = true;
      const currentPos = editor.state.selection.$anchor.pos;
      editor.commands.setContent(content, { emitUpdate: false });

      try {
        const maxPos = editor.state.doc.content.size;
        editor.commands.setTextSelection(Math.min(currentPos, maxPos));
      } catch (_e) { /* ignore */ }

      isRemoteUpdate.current = false;
      setSyncStatus('saved');
    }
  }, [editor]);

  const handleCursorUpdate = useCallback(({ userId, user, cursor }: CursorData) => {
    setRemoteCursors(prev => ({
      ...prev,
      [userId]: { userId, user, cursor }
    }));
  }, []);

  const handleUserLeft = useCallback(({ userId }: { userId: string }) => {
    setRemoteCursors(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const handleDocumentLoad = ({ content }: { content: string }) => {
      if (editor && content) {
        isRemoteUpdate.current = true;
        hasLoadedContent.current = true;
        editor.commands.setContent(content, { emitUpdate: false });
        isRemoteUpdate.current = false;
        setSyncStatus('saved');
        // Update word count
        const text = editor.state.doc.textContent;
        setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
      }
    };

    const handlePermissionDenied = () => {
      setPermDenied(true);
      setTimeout(() => setPermDenied(false), 3000);
    };

    socket.on('document-change', handleDocumentChange);
    socket.on('document-load', handleDocumentLoad);
    socket.on('cursor-update', handleCursorUpdate);
    socket.on('user-left', handleUserLeft);
    socket.on('permission-denied', handlePermissionDenied);

    return () => {
      socket.off('document-change', handleDocumentChange);
      socket.off('document-load', handleDocumentLoad);
      socket.off('cursor-update', handleCursorUpdate);
      socket.off('user-left', handleUserLeft);
      socket.off('permission-denied', handlePermissionDenied);
    };
  }, [editor, handleDocumentChange, handleCursorUpdate, handleUserLeft]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white relative">
      <div className={isReadOnly ? 'opacity-40 pointer-events-none' : ''}>
        <EditorToolbar editor={editor} />
      </div>

      <div className="flex-1 overflow-y-auto w-full relative">
        <div className="mx-auto max-w-3xl pt-4 px-8 pb-2">
          {/* Status bar */}
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  syncStatus === 'syncing' ? 'bg-primary-500 animate-pulse' :
                  syncStatus === 'saved' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-[11px] text-surface-700 font-medium">
                  {isReadOnly ? 'Read-only' : `${syncStatus === 'syncing' ? 'Saving...' : 'Saved'}`}
                </span>
              </div>
              <span className="text-[10px] text-surface-700/60">{wordCount} words</span>
            </div>

            {/* Collaborator avatars */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5 overflow-hidden">
                {Object.values(remoteCursors).map((c, i) => (
                  <div
                    key={c.userId}
                    className={`w-5 h-5 rounded-full border border-white bg-gradient-to-br ${c.user.color} flex items-center justify-center text-[8px] font-bold text-white shadow-sm`}
                    style={{ zIndex: 10 + i }}
                    title={c.user.name}
                  >
                    {c.user.initials}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Permission denied toast */}
          {permDenied && (
            <div className="mb-3 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              You do not have permission to edit this document.
            </div>
          )}
        </div>

        <div className="mx-auto max-w-3xl pb-20 relative">
          <EditorContent editor={editor} className={isReadOnly ? 'cursor-default opacity-90' : ''} />

          {/* Live collaborator cursors */}
          <div className="absolute right-[-140px] top-20 hidden lg:block space-y-3 opacity-60">
            {Object.values(remoteCursors).map(c => (
              <div key={c.userId} className="flex items-center gap-2 group cursor-default translate-x-2 transition-transform hover:translate-x-0">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${c.user.color} animate-pulse`} />
                <span className="text-[10px] font-medium text-surface-600 bg-surface-50 px-2 py-1 rounded-md border border-surface-200 shadow-sm">
                  {c.user.name} is editing...
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
