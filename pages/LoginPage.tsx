import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ScannerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="hairGradientLogin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.2" />
        <stop offset="50%" stopColor="#D4AF37" stopOpacity="1" />
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.2" />
      </linearGradient>
    </defs>
    <path d="M40 160C80 160 120 40 160 40" stroke="url(#hairGradientLogin)" strokeWidth="6" strokeLinecap="round" />
    <path d="M55 170C95 170 135 50 175 50" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" strokeDasharray="4 4" opacity="0.6" />
    <path d="M25 150C65 150 105 30 145 30" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeDasharray="10 5" opacity="0.4" />
    <g stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round">
      <path d="M100 100 L130 130 H160" />
      <circle cx="165" cy="130" r="3" fill="#D4AF37" />
      <path d="M85 115 L60 140 H30" />
      <circle cx="25" cy="140" r="3" fill="#D4AF37" />
      <path d="M115 85 L140 60 H170" />
      <circle cx="175" cy="60" r="3" fill="#D4AF37" />
      <path d="M70 70 L40 40 V20" />
      <circle cx="40" cy="15" r="3" fill="#D4AF37" />
    </g>
    <circle cx="100" cy="100" r="5" fill="#D4AF37" className="animate-pulse" />
  </svg>
);

const EyeIcon: React.FC<{ visible: boolean }> = ({ visible }) =>
  visible ? (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(
        error.includes('Invalid login credentials')
          ? 'E-mail ou senha incorretos. Verifique suas credenciais.'
          : error.includes('Email not confirmed')
          ? 'Confirme seu e-mail antes de acessar.'
          : error
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden px-4">
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating orbs */}
      <div className="absolute top-10 right-10 w-2 h-2 bg-amber-500/40 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-20 left-10 w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-ping" style={{ animationDuration: '4s' }} />
      <div className="absolute top-1/2 right-6 w-1 h-1 bg-amber-400/30 rounded-full animate-ping" style={{ animationDuration: '2s' }} />

      {/* Card */}
      <div className="w-full max-w-md glass rounded-3xl border border-yellow-500/20 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Top amber bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #d4af37 0%, #f97316 100%)' }} />

        <div className="p-8 md:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative w-24 h-24 mb-4 group">
              <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-all" />
              <div className="absolute inset-0 border border-yellow-500/30 rounded-full flex items-center justify-center p-2 glass overflow-hidden">
                <ScannerIcon className="w-full h-full p-2 drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]" />
                <div className="scanner-line" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              RC-BioScan <span className="text-amber-500">IA PRO</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold mt-1">
              Acesso ao Sistema
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-xs uppercase tracking-wider text-slate-500 font-bold block">
                E-mail
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="login-password" className="text-xs uppercase tracking-wider text-slate-500 font-bold block">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-11 pr-12 py-3.5 text-sm focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400 transition-colors"
                  tabIndex={-1}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-4 rounded-2xl font-bold text-white text-sm shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f97316 100%)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Autenticando...
                </span>
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-slate-600 text-xs mt-8">
            Acesso restrito a usuários cadastrados.
            <br />
            <span className="text-amber-500/60">RC-BioScan IA PRO © 2025</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
