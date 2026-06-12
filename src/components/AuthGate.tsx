import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Loader2, Info, ArrowRight, UserPlus, LogIn, User, Sparkles, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface AuthGateProps {
  onLoginSuccess: (token: string, user: any) => void;
  getApiUrl: (endpoint: string) => string;
}

export default function AuthGate({ onLoginSuccess, getApiUrl }: AuthGateProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // OTP Flow States
  const [otpStep, setOtpStep] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [isAdminFlow, setIsAdminFlow] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick helper to reset authorization messages
  const resetNotifications = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleRetrieveOtp = async () => {
    setIsRetrieving(true);
    resetNotifications();
    try {
      const cleanEmail = email.trim().toLowerCase();
      const url = getApiUrl(`/api/auth/latest-otp?email=${encodeURIComponent(cleanEmail)}`);
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok && data.success) {
        setOtpValue(data.otp); // autofill!
        setSuccessMsg(`Sandbox OTP loaded: ${data.otp}. Click verify to continue!`);
      } else {
        setErrorMsg(data.message || 'No active verification key found in database sandbox.');
      }
    } catch (err) {
      console.error('[AuthGate] Retrieve OTP failed:', err);
      setErrorMsg('Failed to query database for latest sandbox OTP.');
    } finally {
      setIsRetrieving(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    resetNotifications();
    try {
      // If admin flow, we call the admin login endpoint to trigger the security code
      const cleanEmail = email.trim().toLowerCase();
      const url = cleanEmail === 'admin@indiwebpros.in' 
        ? getApiUrl('/api/auth/admin-login') 
        : getApiUrl('/api/auth/resend-otp');
      
      const payload = cleanEmail === 'admin@indiwebpros.in'
        ? { email: cleanEmail, password }
        : { email: cleanEmail };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(data.message || 'Verification key has been resent successfully.');
      } else {
        setErrorMsg(data.message || 'Unable to re-transmit credentials.');
      }
    } catch (err) {
      console.error('[AuthGate] Resend exception:', err);
      setErrorMsg('Underlying connectivity exception occurred requesting new OTP.');
    } finally {
      setIsResending(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetNotifications();
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (isLoginMode) {
        // Sign-In Flow
        if (cleanEmail === 'admin@indiwebpros.in') {
          // Admin login requires double-step OTP flow
          console.log('[AuthGate] Initiating secure multi-step Admin login flow...');
          const url = getApiUrl('/api/auth/admin-login');
          
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password })
          });

          const resJson = await response.json();

          if (response.ok && resJson.success) {
            setSuccessMsg('Administrative access code dispatched to admin@indiwebpros.in.');
            setOtpStep(true);
            setIsAdminFlow(true);
          } else {
            setErrorMsg(resJson.message || 'Invalid credentials or access denied.');
          }
        } else {
          // General Candidate login
          console.log(`[AuthGate] Direct Candidate login: ${cleanEmail}`);
          const url = getApiUrl('/api/auth/login');

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password })
          });

          const resJson = await response.json();

          if (response.ok && resJson.token) {
            console.log('[AuthGate] Direct Candidate login success.');
            onLoginSuccess(resJson.token, resJson.user);
          } else {
            setErrorMsg(resJson.message || 'Incorrect email address or passphrase.');
          }
        }
      } else {
        // Registration Flow
        if (!lastName || !lastName.trim()) {
          setErrorMsg('Surname is required. Please add your last name or surname.');
          setIsLoading(false);
          return;
        }

        console.log(`[AuthGate] Dispatching candidate profile declaration: ${cleanEmail}`);
        const url = getApiUrl('/api/auth/register');

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email: cleanEmail,
            password
          })
        });

        const resJson = await response.json();

        if (response.ok && resJson.success) {
          setSuccessMsg('Verification OTP dispatched successfully to your email address!');
          setOtpStep(true);
          setIsAdminFlow(false);
        } else {
          setErrorMsg(resJson.message || 'Registration failed. Check entered fields.');
        }
      }
    } catch (err) {
      console.error('[AuthGate] System communication breakdown:', err);
      setErrorMsg('Network error. Check server connectivity or RDS availability.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetNotifications();
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpValue.trim();

    if (!cleanOtp) {
      setErrorMsg('Please input the 6-digit verification code.');
      setIsLoading(false);
      return;
    }

    try {
      if (isAdminFlow) {
        // Admin verification flow
        console.log(`[AuthGate] Dispatching admin OTP verification credentials: ${cleanEmail}`);
        const url = getApiUrl('/api/auth/admin-verify-otp');

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, otp: cleanOtp })
        });

        const resJson = await response.json();

        if (response.ok && resJson.token) {
          setSuccessMsg('Administrative Account Verified Successfully. Access Granted.');
          setTimeout(() => {
            onLoginSuccess(resJson.token, resJson.user);
          }, 600);
        } else {
          setErrorMsg(resJson.message || 'Wrong administrative OTP verification code.');
        }
      } else {
        // Candidate verification flow
        console.log(`[AuthGate] Verifying candidate registry OTP: ${cleanEmail}`);
        const url = getApiUrl('/api/auth/verify-otp');

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, otp: cleanOtp })
        });

        const resJson = await response.json();

        if (response.ok && resJson.success) {
          setSuccessMsg('Account Verified Successfully');
          
          // Instantly login the newly verified candidate using their credentials
          setTimeout(async () => {
            try {
              console.log('[AuthGate] Proceeding to automatically authorize candidate sessions...');
              const loginUrl = getApiUrl('/api/auth/login');
              const loginResponse = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: cleanEmail, password })
              });
              const loginJson = await loginResponse.json();
              if (loginResponse.ok && loginJson.token) {
                onLoginSuccess(loginJson.token, loginJson.user);
              } else {
                setErrorMsg('Verification completed! Please toggle Sign In to enter your workspace.');
                setIsLoginMode(true);
                setOtpStep(false);
              }
            } catch (loginErr) {
              console.error('[AuthGate] Post-verification automatic login exception:', loginErr);
              setIsLoginMode(true);
              setOtpStep(false);
            }
          }, 1200);
        } else {
          setErrorMsg(resJson.message || 'Wrong OTP verification code.');
        }
      }
    } catch (err) {
      console.error('[AuthGate] OTP Verification exception:', err);
      setErrorMsg('System communications timeout while verifying code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrefillAdmin = () => {
    setEmail('admin@indiwebpros.in');
    setPassword('AdminPass123!');
    setFirstName('');
    setLastName('');
    resetNotifications();
  };

  const handlePrefillCandidate = () => {
    setEmail('candidate@indiwebpros.in');
    setPassword('CandidatePass123!');
    setFirstName('Sarah');
    setLastName('Dev');
    resetNotifications();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-6">
        
        {/* Core Header Visual */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-indigo-600/15 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
            {otpStep ? (
              <KeyRound className="w-6 h-6 text-indigo-400 animate-pulse" />
            ) : isLoginMode ? (
              <LogIn className="w-6 h-6 text-indigo-400" />
            ) : (
              <UserPlus className="w-6 h-6 text-indigo-400" />
            )}
          </div>
          <h2 className="text-xl font-sans tracking-tight font-extrabold text-white">
            {otpStep 
              ? 'Enter Verification Code' 
              : isLoginMode 
                ? 'Sign In' 
                : 'Create Candidate Account'}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {otpStep 
              ? `We have dispatched a 6-digit confirmation key to ${email}`
              : isLoginMode 
                ? 'Access candidate tools or administrative console' 
                : 'Join the next-generation cohort evaluation ecosystem'}
          </p>
        </div>

        {/* Navigation Tab for Mode Toggle (only hidden on OTP stage) */}
        {!otpStep && (
          <div className="flex bg-slate-950 border border-slate-850 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(true);
                resetNotifications();
              }}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isLoginMode 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(false);
                resetNotifications();
              }}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isLoginMode 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register Candidate
            </button>
          </div>
        )}

        {/* Notices and Notifications */}
        {errorMsg && (
          <div className="bg-red-950/45 border border-red-900/40 p-3.5 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
            <span className="font-bold shrink-0">⚠️ ERROR:</span>
            <div className="space-y-2 flex-1">
              <p>{errorMsg}</p>
              {(errorMsg.toLowerCase().includes('already registered') || errorMsg.toLowerCase().includes('already verified')) && (
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(true);
                    resetNotifications();
                  }}
                  className="mt-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-sans font-bold text-[11px] py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 w-fit"
                >
                  <span>Go to Login</span>
                  <LogIn className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/45 border border-emerald-900/40 p-3.5 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5">
            <span className="font-bold shrink-0">✨ STATUS:</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Interactive forms segment */}
        {!otpStep ? (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {!isLoginMode && (
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                    First Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <User className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-3 text-xs font-sans text-white placeholder-slate-600 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                    Surname / Last Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <User className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-3 text-xs font-sans text-white placeholder-slate-600 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Mail className="w-3.5 h-3.5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-9 text-xs font-sans text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                Secure Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Lock className="w-3.5 h-3.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-10 text-xs font-sans text-white placeholder-slate-600 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-400 hover:text-indigo-400 transition-colors" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400 hover:text-indigo-400 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-505 active:bg-indigo-700 disabled:bg-slate-800 text-white disabled:text-slate-500 font-sans font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 hover:shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{isLoginMode ? 'Sign In Credentials' : 'Configure My Profile'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* OTP Verification Stage Form Layout */
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase block text-center">
                6-Digit Secure Verification OTP
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-slate-950 border-2 border-dashed border-slate-800 focus:border-indigo-500 rounded-xl py-3 text-center text-xl font-mono tracking-[12px] font-bold text-white placeholder-slate-700 outline-none transition-all"
              />
              <div className="flex items-center justify-between mt-1.5 px-0.5">
                <p className="text-[10px] text-slate-500 font-mono">
                  Expires in 10m. Check Resend mail/logs.
                </p>
                <button
                  type="button"
                  disabled={isResending}
                  onClick={handleResendOtp}
                  className="text-[10px] font-sans font-bold text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 transition-all cursor-pointer underline underline-offset-2 flex items-center gap-1"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      <span>Resending...</span>
                    </>
                  ) : (
                    <span>Resend OTP</span>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-3 text-center space-y-2">
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                No email arrived? Retrieve your active sandbox verification code instantly.
              </p>
              <button
                type="button"
                disabled={isRetrieving}
                onClick={handleRetrieveOtp}
                className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30 text-indigo-300 font-sans font-bold text-[10px] py-1.5 px-3 rounded-lg border border-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isRetrieving ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin animate-infinite" />
                    <span>Retrieving Sandbox Code...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                    <span>Retrieve & Auto-Fill Sandbox OTP</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOtpStep(false);
                  setOtpValue('');
                  resetNotifications();
                }}
                className="flex-1 bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              
              <button
                type="submit"
                disabled={isLoading || otpValue.length < 6}
                className="flex-[2] bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-800 text-white disabled:text-slate-500 font-sans font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Verify OTP</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Developer Sandbox Debugging Credentials Badge Removed */}

      </div>
    </div>
  );
}
