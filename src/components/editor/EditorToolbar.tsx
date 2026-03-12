import type { ReactNode } from 'react';
import type { Editor } from '@tiptap/react';

interface ToolbarButton {
  label: string;
  command: string;
  action: (editor: Editor) => void;
  isActive: (editor: Editor) => boolean;
  icon: ReactNode;
}

const toolbarGroups: ToolbarButton[][] = [
  [
    {
      label: 'Bold',
      command: 'bold',
      action: (editor) => editor.chain().focus().toggleBold().run(),
      isActive: (editor) => editor.isActive('bold'),
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /></svg>,
    },
    {
      label: 'Italic',
      command: 'italic',
      action: (editor) => editor.chain().focus().toggleItalic().run(),
      isActive: (editor) => editor.isActive('italic'),
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>,
    },
    {
      label: 'Underline',
      command: 'underline',
      action: (editor) => editor.chain().focus().toggleUnderline().run(),
      isActive: (editor) => editor.isActive('underline'),
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" /><line x1="4" y1="21" x2="20" y2="21" /></svg>,
    },
    {
      label: 'Strikethrough',
      command: 'strikeThrough',
      action: (editor) => editor.chain().focus().toggleStrike().run(),
      isActive: (editor) => editor.isActive('strike'),
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4" /><path d="M14 12a4 4 0 0 1 0 8H6" /><line x1="4" y1="12" x2="20" y2="12" /></svg>,
    },
  ],
  [
    {
      label: 'Heading',
      command: 'heading',
      action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: (editor) => editor.isActive('heading', { level: 2 }),
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v18" /><path d="M18 3v18" /><path d="M6 12h12" /></svg>,
    },
    {
      label: 'Bullet List',
      command: 'insertUnorderedList',
      action: (editor) => editor.chain().focus().toggleBulletList().run(),
      isActive: (editor) => editor.isActive('bulletList'),
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>,
    },
    {
      label: 'Numbered List',
      command: 'insertOrderedList',
      action: (editor) => editor.chain().focus().toggleOrderedList().run(),
      isActive: (editor) => editor.isActive('orderedList'),
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="20" y2="6" /><line x1="10" y1="12" x2="20" y2="12" /><line x1="10" y1="18" x2="20" y2="18" /><text x="2" y="8" fontSize="8" fill="currentColor" fontWeight="bold">1</text><text x="2" y="14" fontSize="8" fill="currentColor" fontWeight="bold">2</text><text x="2" y="20" fontSize="8" fill="currentColor" fontWeight="bold">3</text></svg>,
    },
  ],
  [
    {
      label: 'Undo',
      command: 'undo',
      action: (editor) => editor.chain().focus().undo().run(),
      isActive: () => false,
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.69 3L3 13" /></svg>,
    },
    {
      label: 'Redo',
      command: 'redo',
      action: (editor) => editor.chain().focus().redo().run(),
      isActive: () => false,
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.69 3L21 13" /></svg>,
    },
  ],
];

interface EditorToolbarProps {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-white border-b border-surface-200/60 overflow-x-auto">
      {toolbarGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex items-center gap-0.5">
          {group.map((btn) => {
            const active = btn.isActive(editor);
            return (
              <button
                key={btn.command + btn.label}
                onClick={() => btn.action(editor)}
                title={btn.label}
                className={`p-2 rounded-lg transition-colors ${active ? 'bg-primary-100 text-primary-700' : 'text-surface-700 hover:bg-surface-100 hover:text-primary-600 active:bg-primary-50'}`}
                aria-label={btn.label}
              >
                {btn.icon}
              </button>
            );
          })}
          {groupIndex < toolbarGroups.length - 1 && (
            <div className="w-px h-5 bg-surface-200 mx-1.5" />
          )}
        </div>
      ))}
    </div>
  );
}
