import { useState, useEffect } from 'react';

interface MockOAuthModalProps {
  provider: 'Google' | 'GitHub' | null;
  mode: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: { name: string; email: string }) => void;
}

export default function MockOAuthModal({ provider, mode, onClose, onSuccess }: MockOAuthModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear error when email changes
  useEffect(() => {
    setError('');
  }, [email, name]);

  if (!provider) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (mode === 'signup' && !name)) return;
    
    setLoading(true);
    setError('');
    
    // Simulate network delay
    setTimeout(() => {
      try {
        const usersDb = JSON.parse(localStorage.getItem('syncdoc_users_db') || '[]');
        
        if (mode === 'login') {
          const user = usersDb.find((u: any) => u.email === email);
          if (!user) {
            setError(`No account found for this email. Please sign up first.`);
            setLoading(false);
            return;
          }
          onSuccess(user);
        } else {
          // Signup mode
          const existingUser = usersDb.find((u: any) => u.email === email);
          if (existingUser) {
            setError('An account with this email already exists. Please log in.');
            setLoading(false);
            return;
          }
          
          const newUser = { name, email, authProvider: provider };
          usersDb.push(newUser);
          localStorage.setItem('syncdoc_users_db', JSON.stringify(usersDb));
          onSuccess(newUser);
        }
      } catch (err) {
        setError('An unexpected error occurred.');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            {provider === 'Google' ? (
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.97h3.86c2.26-2.09 3.56-5.17 3.56-8.79z" />
                <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.97c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.07C3.515 21.27 7.565 24 12.255 24z" />
                <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.64h-3.98a11.86 11.86 0 000 10.72l3.98-3.07z" />
                <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.73-10.71 6.64l3.98 3.07c.95-2.85 3.6-4.96 6.73-4.96z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            )}
            <h3 className="text-lg font-bold text-surface-900">Sign {mode === 'login' ? 'in' : 'up'} with {provider}</h3>
          </div>
          
          <p className="text-sm text-surface-700 mb-5 leading-relaxed">
            {mode === 'login' ? (
              <span>Since this is a demo, please enter the email you previously used for your mock <span className="font-semibold text-surface-900">{provider}</span> account.</span>
            ) : (
              <span>Since this is a demo environment, please provide the details you'd like to use for your mock <span className="font-semibold text-surface-900">{provider}</span> account.</span>
            )}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1.5 ml-0.5">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex Smith"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm text-surface-900 bg-surface-50 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all placeholder:text-surface-400"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5 ml-0.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={`you@example.com`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm text-surface-900 bg-surface-50 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all placeholder:text-surface-400"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 mt-2">
                {error}
              </p>
            )}
            
            <div className="flex gap-3 mt-8 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-surface-700 bg-surface-100 hover:bg-surface-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 flex items-center justify-center text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
