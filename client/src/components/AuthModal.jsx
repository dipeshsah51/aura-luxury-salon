import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  X, Sparkles, User, Mail, Lock, Phone, Key, ShieldCheck,
  ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, KeyRound, Send
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const {
    login,
    register,
    sendOtp,
    verifyOtpRegister,
    verifyOtpLogin,
    demoLogin,
    loading
  } = useAuth();

  const { showToast, showSimulatedDispatch } = useNotification();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [step, setStep] = useState('form'); // 'form' or 'otp'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  // 6-digit OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittingOtp, setSubmittingOtp] = useState(false);

  const otpInputs = useRef([]);

  // Timer countdown
  useEffect(() => {
    let timer;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Reset states when modal is opened or closed
  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setOtp(['', '', '', '', '', '']);
      setErrorMsg('');
      setCountdown(60);
      setCanResend(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle switching between Sign In and New Membership
  const handleTabSwitch = (newMode) => {
    setMode(newMode);
    setStep('form');
    setErrorMsg('');
    setOtp(['', '', '', '', '', '']);
  };

  // Submitting Form (Password login OR Sending OTP)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'login') {
      if (loginMethod === 'password') {
        const res = await login(formData.email, formData.password);
        if (res.success) {
          if (res.requiresOtp) {
            setStep('otp');
            setCountdown(60);
            setCanResend(false);
            showToast(res.message || `Security verification code sent to ${formData.email}!`, "info");
          } else {
            showToast(`Welcome back, ${res.user?.name || 'Member'}!`, "success");
            onClose();
          }
        } else {
          setErrorMsg(res.error || "Login failed");
          showToast(res.error || "Login failed", "error");
        }
      } else {
        // Send OTP for Sign In
        await triggerSendOtp('login');
      }
    } else {
      // Registration: Send OTP to verify email
      await triggerSendOtp('register');
    }
  };

  // Trigger Send OTP
  const triggerSendOtp = async (purpose) => {
    if (!formData.email || !formData.email.includes('@')) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (purpose === 'register' && !formData.name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    const res = await sendOtp(formData.email, purpose, formData.name);
    if (res.success) {
      showToast(`Verification code sent to ${formData.email}`, "success");
      setStep('otp');
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpInputs.current[0]?.focus(), 150);
    } else {
      setErrorMsg(res.error || "Failed to send verification code");
      showToast(res.error || "Failed to send code", "error");
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMsg('');
    const purpose = mode === 'register' ? 'register' : 'login';
    const res = await sendOtp(formData.email, purpose, formData.name);
    if (res.success) {
      showToast(`A new verification code was sent to ${formData.email}!`, "success");
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpInputs.current[0]?.focus();
    } else {
      setErrorMsg(res.error || "Failed to resend code");
    }
  };

  // Handle OTP Box Input
  const handleOtpChange = (index, value) => {
    // Keep only numbers
    const cleaned = value.replace(/\D/g, '');
    const newOtp = [...otp];

    if (cleaned.length > 1) {
      // Handle paste in single box
      const digits = cleaned.slice(0, 6).split('');
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      otpInputs.current[nextFocus]?.focus();
      return;
    }

    newOtp[index] = cleaned;
    setOtp(newOtp);

    // Auto advance focus
    if (cleaned && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  // Handle OTP Keydown (backspace & navigation)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  // Handle OTP Paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    pasted.split('').forEach((digit, i) => {
      newOtp[i] = digit;
    });
    setOtp(newOtp);

    const targetFocus = Math.min(pasted.length, 5);
    otpInputs.current[targetFocus]?.focus();
  };

  // Verify OTP submission
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }

    setSubmittingOtp(true);
    setErrorMsg('');

    try {
      if (mode === 'register') {
        const res = await verifyOtpRegister({
          name: formData.name,
          email: formData.email,
          password: formData.password || 'AuraClient@2026',
          phone: formData.phone,
          otp: fullCode
        });

        if (res.success) {
          showToast(`Welcome to AURA, ${res.user.name}! Your email is verified.`, "success");
          onClose();
        } else {
          setErrorMsg(res.error || "Verification failed");
          showToast(res.error || "Verification failed", "error");
        }
      } else {
        // Sign In via OTP
        const res = await verifyOtpLogin(formData.email, fullCode);
        if (res.success) {
          showToast(`Welcome back, ${res.user.name}!`, "success");
          onClose();
        } else {
          setErrorMsg(res.error || "Invalid code");
          showToast(res.error || "Authentication failed", "error");
        }
      }
    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setSubmittingOtp(false);
    }
  };

  // Quick Demo Access
  const handleQuickDemo = async (role) => {
    const res = await demoLogin(role);
    if (res.success) {
      if (res.requiresOtp) {
        setFormData(prev => ({ ...prev, email: 'dsah56631@gmail.com' }));
        setMode('login');
        setLoginMethod('password');
        setStep('otp');
        setCountdown(60);
        setCanResend(false);
        showToast("Director 2FA code sent to dsah56631@gmail.com! Check your Gmail.", "info");
      } else {
        showToast(`Logged in as ${role === 'admin' ? 'Salon Director (Admin)' : 'Sophia Martinez (Customer)'}!`, "success");
        onClose();
      }
    } else {
      showToast(res.error, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0F172A] border border-gold-500/30 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold-400" />
            <h3 className="font-serif text-lg font-bold text-white tracking-wide">
              {step === 'otp'
                ? 'Email Verification'
                : mode === 'login'
                ? 'Client Access'
                : 'Create Haute Membership'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo One-Click Access Banner */}
        <div className="p-3.5 bg-gold-950/20 border-b border-gold-500/20">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gold-400 mb-1.5 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" /> Quick Demo One-Click Sign In:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemo('admin')}
              className="py-1.5 px-2.5 rounded-lg bg-slate-800 border border-gold-500/40 text-xs font-medium text-gold-300 hover:bg-gold-500 hover:text-black transition text-left flex items-center gap-1.5"
            >
              👑 <span className="truncate">Admin Director</span>
            </button>
            <button
              onClick={() => handleQuickDemo('customer')}
              className="py-1.5 px-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition text-left flex items-center gap-1.5"
            >
              👤 <span className="truncate">Customer VIP</span>
            </button>
          </div>
        </div>

        {/* Mode Tabs (Only visible when on form step) */}
        {step === 'form' && (
          <div className="flex border-b border-slate-800 bg-slate-900/50">
            <button
              onClick={() => handleTabSwitch('login')}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition ${
                mode === 'login'
                  ? 'border-b-2 border-gold-400 text-gold-300 bg-slate-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleTabSwitch('register')}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'border-b-2 border-gold-400 text-gold-300 bg-slate-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>New Membership</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-gold-500/20 text-gold-300 font-normal border border-gold-500/30">
                OTP
              </span>
            </button>
          </div>
        )}

        {/* Error notification banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 1: INITIAL FORM (LOGIN OR REGISTRATION) */}
        {/* ============================================================ */}
        {step === 'form' && (
          <form onSubmit={handleSubmitForm} className="p-6 space-y-3.5">
            
            {/* Registration Fields */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Priya Sundaram"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-gold-400 transition"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="client@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-gold-400 transition"
                />
              </div>
              {mode === 'register' && (
                <p className="text-[11px] text-slate-400 mt-1">
                  We will send a 6-digit OTP code to this email to verify your membership.
                </p>
              )}
            </div>

            {/* Password (for password login or register) */}
            {(mode === 'register' || (mode === 'login' && loginMethod === 'password')) && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-gold-400 transition"
                  />
                </div>
              </div>
            )}

            {/* Phone Number (Optional for registration) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Number (For WhatsApp Updates)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-gold-400 transition"
                  />
                </div>
              </div>
            )}

            {/* Sign In Method Switcher */}
            {mode === 'login' && (
              <div className="pt-1 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setLoginMethod(loginMethod === 'password' ? 'otp' : 'password')}
                  className="text-gold-400 hover:text-gold-300 transition flex items-center gap-1 font-medium"
                >
                  {loginMethod === 'password' ? (
                    <>
                      <Mail className="w-3.5 h-3.5" /> Sign In via Email OTP Code
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" /> Sign In via Password
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider mt-3 shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Please wait...</span>
              ) : mode === 'login' ? (
                loginMethod === 'password' ? (
                  <span>Enter Lounge</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Send Sign-In Code
                  </>
                )
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Send Email Verification OTP
                </>
              )}
            </button>
          </form>
        )}

        {/* ============================================================ */}
        {/* STEP 2: OTP VERIFICATION SCREEN */}
        {/* ============================================================ */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtpSubmit} className="p-6 space-y-5 animate-fadeIn">
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-400 shadow-lg shadow-gold-500/10">
                <Mail className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-serif text-lg font-bold text-white">
                Check Your Gmail Inbox
              </h4>
              <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                We sent a 6-digit verification code directly to:
                <br />
                <span className="font-semibold text-gold-300 font-mono text-sm">{formData.email}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Please check your Gmail inbox and Spam/Updates folder.
              </p>
            </div>

            {/* 6 OTP Input Boxes */}
            <div>
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className="w-11 h-12 text-center text-lg font-bold rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 transition"
                  />
                ))}
              </div>

              <p className="text-[11px] text-center text-slate-400 mt-3">
                Open your Gmail app or mail.google.com to view your 6-digit OTP code.
              </p>
            </div>

            {/* Resend Timer & Actions */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="hover:text-white transition flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change Email
              </button>

              <div>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-gold-400 hover:text-gold-300 font-semibold transition flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend Code
                  </button>
                ) : (
                  <span className="text-slate-500">
                    Resend in <strong className="text-slate-400">{countdown}s</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Submit Verification Button */}
            <button
              type="submit"
              disabled={submittingOtp}
              className="btn-gold w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2"
            >
              {submittingOtp ? (
                <span>Verifying Code...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>{mode === 'register' ? 'Verify & Activate Membership' : 'Verify & Enter Lounge'}</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
