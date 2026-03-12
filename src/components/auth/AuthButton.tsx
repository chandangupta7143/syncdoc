import type { ReactNode } from 'react';

interface AuthButtonProps {
  children: ReactNode;
  type?: 'button' | 'submit';
  loading?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export default function AuthButton({
  children,
  type = 'submit',
  loading = false,
  onClick,
  disabled = false,
}: AuthButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative w-full py-3.5 px-6 rounded-xl text-sm font-semibold text-white
        bg-gradient-to-r from-primary-600 to-primary-500
        shadow-lg shadow-primary-500/25
        transition-all duration-200
        ${disabled || loading
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:from-primary-700 hover:to-primary-600 hover:shadow-primary-500/40 hover:-translate-y-0.5 active:translate-y-0'
        }
      `}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Please wait...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
