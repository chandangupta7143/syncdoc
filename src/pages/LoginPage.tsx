import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '../components/auth/AuthCard';
import InputField from '../components/auth/InputField';
import AuthButton from '../components/auth/AuthButton';
import MockOAuthModal from '../components/auth/MockOAuthModal';
import { API_BASE_URL } from '../config';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [oauthProvider, setOauthProvider] = useState<'Google' | 'GitHub' | null>(null);
  const navigate = useNavigate();

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ ...errors, email: data.error || 'Login failed' });
        setLoading(false);
        return;
      }

      // Store both the user object and the JWT token
      localStorage.setItem('syncdoc_user', JSON.stringify({ ...data.user, token: data.token }));
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setErrors({ ...errors, email: 'Network error connecting to server' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your SyncDoc workspace"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <InputField
          id="login-email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          error={errors.email}
          required
        />

        <InputField
          id="login-password"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          error={errors.password}
          required
        />

        {/* Forgot password */}
        <div className="flex items-center justify-end">
          <a
            href="#forgot"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Forgot password?
          </a>
        </div>

        <AuthButton loading={loading}>Sign In</AuthButton>
      </form>

      {/* Divider */}
      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white/70 px-3 text-xs text-surface-700">or continue with</span>
        </div>
      </div>

      {/* Social login (UI only) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setOauthProvider('Google')}
          disabled={loading}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 text-sm font-medium text-surface-700 hover:border-surface-200 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.97h3.86c2.26-2.09 3.56-5.17 3.56-8.79z" />
            <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.97c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.07C3.515 21.27 7.565 24 12.255 24z" />
            <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.64h-3.98a11.86 11.86 0 000 10.72l3.98-3.07z" />
            <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.73-10.71 6.64l3.98 3.07c.95-2.85 3.6-4.96 6.73-4.96z" />
          </svg>
          Google
        </button>
        <button
          type="button"
          onClick={() => setOauthProvider('GitHub')}
          disabled={loading}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 text-sm font-medium text-surface-700 hover:border-surface-200 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          GitHub
        </button>
      </div>

      {/* Sign up link */}
      <p className="mt-8 text-center text-sm text-surface-700">
        Don't have an account?{' '}
        <Link
          to="/signup"
          className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          Create one free
        </Link>
      </p>

      <MockOAuthModal
        provider={oauthProvider}
        mode="login"
        onClose={() => setOauthProvider(null)}
        onSuccess={(user) => {
          localStorage.setItem('syncdoc_user', JSON.stringify(user));
          setOauthProvider(null);
          navigate('/dashboard');
        }}
      />
    </AuthCard>
  );
}
