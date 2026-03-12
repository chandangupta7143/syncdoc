import { Link } from 'react-router-dom';

export interface DocumentData {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  owner: string;
  collaborators: { name: string; email?: string; initials: string; color: string }[];
  role: 'Owner' | 'Editor' | 'Viewer';
}

interface DocumentCardProps {
  document: DocumentData;
}

const roleBadgeStyles: Record<string, string> = {
  Owner: 'bg-primary-50 text-primary-700 border-primary-200',
  Editor: 'bg-secondary-50 text-secondary-700 border-secondary-200',
  Viewer: 'bg-surface-100 text-surface-700 border-surface-200',
};

export default function DocumentCard({ document }: DocumentCardProps) {
  return (
    <Link
      to={`/document/${document.id}`}
      className="group block bg-white rounded-2xl border border-surface-200/80 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Preview area */}
      <div className="px-6 pt-6 pb-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-surface-900 truncate group-hover:text-primary-700 transition-colors">
              {document.title}
            </h3>
          </div>

          {/* Role badge */}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${roleBadgeStyles[document.role]}`}>
            {document.role}
          </span>
        </div>

        {/* Text preview */}
        <div className="space-y-1.5 mb-4">
          <div className="h-2 bg-surface-100 rounded-full w-full" />
          <div className="h-2 bg-surface-100 rounded-full w-5/6" />
          <div className="h-2 bg-surface-100 rounded-full w-3/4" />
        </div>
        <p className="text-xs text-surface-700 line-clamp-2 leading-relaxed">
          {document.preview}
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 py-3.5 bg-surface-50/80 border-t border-surface-200/60 flex items-center justify-between">
        {/* Collaborators */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {document.collaborators.slice(0, 3).map((c, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full ${c.color} border-2 border-white flex items-center justify-center text-white text-[9px] font-bold`}
                title={c.name}
              >
                {c.initials}
              </div>
            ))}
            {document.collaborators.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-surface-200 border-2 border-white flex items-center justify-center text-surface-700 text-[9px] font-bold">
                +{document.collaborators.length - 3}
              </div>
            )}
          </div>
        </div>

        {/* Updated at */}
        <span className="text-[11px] text-surface-700">{document.updatedAt}</span>
      </div>
    </Link>
  );
}
