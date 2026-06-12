import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Loader2, Info, GraduationCap, ArrowRight } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (token: string, user: any) => void;
  getApiUrl: (endpoint: string) => string;
}

export default function AdminLogin({ onLoginSuccess, getApiUrl }: AdminLoginProps) {
  const [email, setEmail] = useState('admin@indiwebpros.in');
  const [password, setPassword] = useState('AdminPass123!');
  const [isLoading, setIsLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode(null);
    setIsLoading(true);

    try {
      const url = getApiUrl('/api/v1/auth/login');
      console.log(`[Admin Login Dispatch] Authenticating user against Unified Express layer: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const resJson = await response.json();

      if (response.ok && resJson.status === 'success' && resJson.token) {
        console.log('[Admin Login] authentication success! Token received.');
        onLoginSuccess(resJson.token, resJson.user);
      } else {
        setErrorCode(resJson.message || 'Invalid username or credentials.');
      }
    } catch (err) {
      console.error('[Admin Login] network exception:', err);
      setErrorCode('Connection error connecting to remote systems db.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-6">
        
        {/* Core Header badge */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600/15 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-sans tracking-tight font-extrabold text-white">
            Admin Console Gateway
          </h2>
          <p className="text-xs text-slate-400">
            Secure enterprise access is guarded. Authorized personnel only.
          </p>
        </div>

        {/* Warning messages */}
        {errorCode && (
          <div className="bg-red-950/45 border border-red-900/40 p-3.5 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
            <span className="font-bold shrink-0">⚠️ AUTH FAIL:</span>
            <span>{errorCode}</span>
          </div>
        )}

        {/* Autopopulate Helper banner */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold font-mono">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>ENTERPRISE MASTER SEEDS</span>
          </div>
          <p className="font-mono text-[11px] leading-relaxed select-all">
            Email: <span className="text-slate-200">admin@indiwebpros.in</span><br />
            Password: <span className="text-slate-200">AdminPass123!</span>
          </p>
        </div>

        {/* Form Inputs definitions */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">
              Admin Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@indiwebpros.in"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-11 pr-4 text-xs font-sans text-white placeholder-slate-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">
              Master Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-11 pr-4 text-xs font-sans text-white placeholder-slate-600 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 font-sans font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 hover:shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Verifying and Authorizing...</span>
              </>
            ) : (
              <>
                <span>Secure Console SignIn</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
