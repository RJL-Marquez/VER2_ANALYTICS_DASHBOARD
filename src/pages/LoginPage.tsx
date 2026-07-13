import { FormEvent, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string) => void;
}

const DEMO_EMAIL = 'rencejoseph.marquez@mgenesis.com';
const DEMO_PASSWORD = '12345678';

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setIsSubmitting(true);
    // Simulated auth check against the demo account.
    window.setTimeout(() => {
      if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
        onLogin(email.trim());
      } else {
        setError('Incorrect email or password. Please try again.');
        setIsSubmitting(false);
      }
    }, 400);
  }

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center lg:justify-start px-4 sm:px-8 lg:px-20 bg-[#0b1220] bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(115deg, rgba(6,20,38,0.82) 0%, rgba(0,64,110,0.55) 55%, rgba(0,99,169,0.35) 100%), url('/login_image.png')",
      }}
    >
      {/* Brand mark, top-left */}
      <div className="absolute top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3">
        <img
          src="/microgenesis_logo.png"
          alt="Microgenesis Logo"
          className="h-7 object-contain brightness-0 invert"
        />
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/95 backdrop-blur-sm shadow-2xl p-8 sm:p-10 dark:bg-slate-900/95">
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#0063a9] dark:text-blue-300">Microsoft Forms</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Survey Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Sign in to view stakeholder satisfaction reporting.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="field-label">Email address</span>
            <div className="relative mt-1">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0063a9] dark:text-blue-300" />
              <input
                type="email"
                autoComplete="username"
                className="field pl-11"
                placeholder="name@mgenesis.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </label>

          <label className="block">
            <span className="field-label">Password</span>
            <div className="relative mt-1">
              <LockKeyhole size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0063a9] dark:text-blue-300" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="field pl-11 pr-10"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#0063a9] focus:ring-[#0063a9]"
              />
              Remember me
            </label>
            <button type="button" className="font-medium text-[#0063a9] hover:underline cursor-pointer dark:text-blue-300">
              Forgot password?
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose dark:bg-rose-950/30 dark:border-rose-900">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#0063a9] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#00528c] transition disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
