import React, { useState } from 'react';
import { BrandLogo } from '../components/BrandLogo';
import { AuthSession } from '../types';
import { api, ApiError } from '../services/api';
import { saveSessionLocally, getCachedSessionLocally } from '../services/db';
import { 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  WifiOff, 
  CheckCircle2, 
  Sun, 
  Moon, 
  Phone, 
  Mail, 
  Building, 
  Send, 
  MessageCircle, 
  Clock, 
  ArrowRight, 
  KeyRound, 
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  Sparkles,
  Check
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LoginViewProps {
  onLoginSuccess: (session: AuthSession) => void;
  isOnline: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, isOnline }) => {
  const { toggleTheme, eyeShield, toggleEyeShield, isNight } = useTheme();
  const [activeTab, setActiveTab] = useState<'create_account' | 'login'>('login');
  
  // Public Login form state (Clean universal login - no admin branding)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Security Test Step for Administrator Verification (Step 2 - Only triggered after owner credentials match)
  const [pendingAdminSession, setPendingAdminSession] = useState<AuthSession | null>(null);
  const [adminSecurityPin, setAdminSecurityPin] = useState('');
  const [securityAnswer1, setSecurityAnswer1] = useState(''); // Email / WhatsApp
  const [securityAnswer2, setSecurityAnswer2] = useState(''); // City / Headquarters
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathProblem, setMathProblem] = useState<{ num1: number; num2: number }>({ num1: 17, num2: 8 });
  const [showSecurityHint, setShowSecurityHint] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securityAttempts, setSecurityAttempts] = useState(0);
  const [securityVerified, setSecurityVerified] = useState(false);
  
  // Request Access / Create Account form state
  const [reqFullName, setReqFullName] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqAgency, setReqAgency] = useState('');
  const [reqCity, setReqCity] = useState('Lahore');
  const [reqUsername, setReqUsername] = useState('');
  const [reqPassword, setReqPassword] = useState('');
  const [reqConfirmPassword, setReqConfirmPassword] = useState('');
  const [showReqPassword, setShowReqPassword] = useState(false);

  // Status & notifications
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pendingApprovalData, setPendingApprovalData] = useState<{
    owner_email: string;
    owner_whatsapp: string;
  } | null>(null);

  // Access request submitted state
  const [requestSubmittedData, setRequestSubmittedData] = useState<{
    full_name: string;
    phone: string;
    username: string;
    owner_email: string;
    owner_whatsapp: string;
    whatsapp_link: string;
    mailto_link: string;
  } | null>(null);

  // Generate a new random math question for security challenge
  const refreshMathChallenge = () => {
    const n1 = Math.floor(Math.random() * 14) + 6;
    const n2 = Math.floor(Math.random() * 9) + 4;
    setMathProblem({ num1: n1, num2: n2 });
    setMathAnswer('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Please enter both Username/Employee ID and Password');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setPendingApprovalData(null);

    try {
      if (isOnline) {
        const response = await api.login(username.trim(), password);
        const session: AuthSession = {
          user: response.user,
          token: response.token,
          expires_at: response.expires_at,
        };

        // If the authenticated user is the Administrator / Owner, trigger Multi-Factor Security Challenge Questions!
        if (session.user.role === 'owner') {
          setPendingAdminSession(session);
          setSecurityError('');
          setSecurityAnswer1('');
          setSecurityAnswer2('');
          setAdminSecurityPin('');
          setSecurityVerified(false);
          setShowSecurityHint(false);
          refreshMathChallenge();
          setIsLoading(false);
          return;
        }

        // Standard employee user login -> proceed directly to employee view
        localStorage.setItem('property_hub_token', response.token);
        localStorage.setItem('property_hub_current_user_id', response.user.user_id);
        await saveSessionLocally(session);
        onLoginSuccess(session);
      } else {
        const cached = await getCachedSessionLocally();
        if (cached && (
          cached.user.username.toLowerCase() === username.trim().toLowerCase() ||
          (cached.user.email && cached.user.email.toLowerCase() === username.trim().toLowerCase())
        )) {
          if (cached.user.role === 'owner') {
            setPendingAdminSession(cached);
            setSecurityError('');
            setSecurityAnswer1('');
            setSecurityAnswer2('');
            setAdminSecurityPin('');
            setSecurityVerified(false);
            setShowSecurityHint(false);
            refreshMathChallenge();
            setIsLoading(false);
            return;
          }
          onLoginSuccess(cached);
        } else {
          setErrorMsg('Offline mode: You can only sign into previously verified accounts on this device.');
        }
      }
    } catch (err: any) {
      console.error('Login error', err);
      if (err instanceof ApiError) {
        if (err.message.includes('verification') || err.message.includes('pending') || err.message.includes('deactivated')) {
          setPendingApprovalData({
            owner_email: 'sacc5038@gmail.com',
            owner_whatsapp: '+92 3082665978',
          });
        }
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Unable to connect to server. Please check your credentials or network connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqFullName.trim() || !reqPhone.trim() || !reqEmail.trim() || !reqUsername.trim() || !reqPassword) {
      setErrorMsg('Please complete all required fields (Name, Phone/WhatsApp, Email, Username, Password)');
      return;
    }

    if (reqPassword !== reqConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (!isOnline) {
      setErrorMsg('An active Internet connection is required to submit your access request.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await api.requestAccess({
        full_name: reqFullName.trim(),
        phone: reqPhone.trim(),
        email: reqEmail.trim(),
        agency_name: reqAgency.trim(),
        city: reqCity.trim(),
        desired_username: reqUsername.trim(),
        password: reqPassword,
      });

      if (response.user && response.token) {
        // Instant direct public auto-login!
        const session = {
          user: response.user,
          token: response.token,
          expires_at: response.expires_at || new Date(Date.now() + 30 * 86400000).toISOString(),
        };
        localStorage.setItem('property_hub_token', response.token);
        localStorage.setItem('property_hub_current_user_id', response.user.user_id);
        await saveSessionLocally(session);
        onLoginSuccess(session);
        return;
      }

      setSuccessMsg('Account registered successfully! Please sign in with your credentials.');
      setActiveTab('login');
      setUsername(reqUsername.trim());
      setPassword(reqPassword);
      setReqPassword('');
      setReqConfirmPassword('');
    } catch (err: any) {
      console.error('Registration error', err);
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Unable to complete registration. Network or server error.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Verification of Multi-Factor Security Questions for Master Administrator Access
  const handleSecurityChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAdminSession) return;

    setSecurityError('');

    const pin = adminSecurityPin.trim();
    const ans1 = securityAnswer1.trim().toLowerCase();
    const ans2 = securityAnswer2.trim().toLowerCase();
    const userMath = parseInt(mathAnswer.trim(), 10);
    const expectedMath = mathProblem.num1 + mathProblem.num2;

    // Check 1: Master Secret PIN Code
    // Allowed: 5978 (owner phone last 4 digits 0308-2665978), 2026, 786, 1234, or admin
    const isPinValid = pin === '5978' || pin === '2026' || pin === '786' || pin === '1234' || pin === 'admin';
    if (!pin) {
      setSecurityError('براہِ کرم 4 ہندسوں کی خفیہ سیکیورٹی کی (Master Security PIN) درج کریں۔');
      return;
    }
    if (!isPinValid) {
      const attempts = securityAttempts + 1;
      setSecurityAttempts(attempts);
      setSecurityError('سیکیورٹی پن کوڈ درست نہیں ہے۔ (ڈیفالٹ ماسٹر پن: 5978 یا 2026 استعمال کریں)');
      return;
    }

    // Check 2: Security Question 1 - Official Director WhatsApp or Email
    const isAns1Valid = 
      ans1.includes('sacc5038') || 
      ans1.includes('3082665978') || 
      ans1.includes('03082665978') || 
      ans1.includes('923082665978') ||
      (pendingAdminSession.user.email && ans1.includes(pendingAdminSession.user.email.toLowerCase())) ||
      (pendingAdminSession.user.phone && ans1.includes(pendingAdminSession.user.phone.replace(/\D/g, '')));

    if (!isAns1Valid) {
      setSecurityError('سیکیورٹی سوال 1: رجسٹرڈ ڈائریکٹر واٹس ایپ یا ای میل ایڈمن ریکارڈ سے میچ نہیں ہوئی۔ (ہنٹ: sacc5038@gmail.com یا 03082665978)');
      return;
    }

    // Check 3: Security Question 2 - Headquarters City or Brand Name
    const isAns2Valid = 
      ans2.includes('lahore') || 
      ans2.includes('لاہور') || 
      ans2.includes('cm') || 
      ans2.includes('wallet') || 
      ans2.includes('vault') || 
      ans2.includes('inventory') || 
      ans2.includes('property hub') || 
      ans2.includes('director') || 
      ans2.includes('master') ||
      (pendingAdminSession.user.city && ans2.includes(pendingAdminSession.user.city.toLowerCase()));

    if (!isAns2Valid) {
      setSecurityError('سیکیورٹی سوال 2: بنیادی شہر یا برانڈ کا نام ریکارڈ سے میچ نہیں ہوا۔ (ہنٹ: Lahore یا CM INVENTORY WALLET)');
      return;
    }

    // Check 4: Anti-Bot Math Security Challenge
    if (isNaN(userMath) || userMath !== expectedMath) {
      setSecurityError(`حسابی سیکیورٹی سوال غلط ہے! ${mathProblem.num1} + ${mathProblem.num2} کا درست مجموعہ درج کریں۔`);
      return;
    }

    // Success! Administrator verified through multi-step security test
    setSecurityVerified(true);
    setIsLoading(true);

    try {
      localStorage.setItem('property_hub_token', pendingAdminSession.token);
      localStorage.setItem('property_hub_current_user_id', pendingAdminSession.user.user_id);
      await saveSessionLocally(pendingAdminSession);

      // Brief animation before launching into Admin Console
      setTimeout(() => {
        onLoginSuccess(pendingAdminSession);
      }, 600);
    } catch (err) {
      console.error('Failed to save verified session', err);
      setIsLoading(false);
      setSecurityVerified(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-start sm:justify-center items-center px-3 sm:px-4 py-6 sm:py-10 pb-16 theme-bg-main relative overflow-x-hidden overflow-y-auto transition-colors duration-200">
      {/* Background ambient lighting - eye-friendly soft sapphire glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Top controls: Clean Eye-Care and Theme controls aligned to right */}
        <div className="flex items-center justify-end mb-4 gap-1.5 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border theme-border theme-bg-subtle text-amber-700 dark:text-amber-400 active:scale-95 transition min-h-[40px] min-w-[40px] flex items-center justify-center shadow-xs"
            title={isNight ? 'Switch to Soft Warm Day' : 'Switch to Soothing Twilight'}
            aria-label="Toggle Theme"
          >
            {isNight ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-amber-700" />}
          </button>

          <button
            onClick={toggleEyeShield}
            className={`p-2 rounded-xl border text-xs font-medium transition min-h-[40px] min-w-[40px] flex items-center justify-center ${
              eyeShield
                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 shadow-xs'
                : 'theme-border theme-text-tertiary hover:theme-text-main hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title={eyeShield ? 'Eye Shield Filter Active (Blue Light Barrier)' : 'Enable Eye Shield'}
            aria-label="Toggle Eye Shield"
          >
            <Eye className={`w-4 h-4 ${eyeShield ? 'stroke-[2.5] text-amber-600 dark:text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Main Logo & Identity Header: Exact Official Brand Logo */}
        <div className="flex justify-center mb-5 sm:mb-6">
          <BrandLogo size="md" />
        </div>

        {/* Main Card */}
        <div className="theme-bg-card border theme-border rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xl theme-shadow transition-colors">
          {/* SUCCESS SCREEN: REQUEST SUBMITTED */}
          {requestSubmittedData ? (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border-2 border-emerald-400">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-bold theme-text-main font-brand">
                  Access Request Submitted
                </h2>
                <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold mt-1">
                  Your registration details have been received
                </p>
              </div>

              <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border text-left text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b theme-border">
                  <span className="theme-text-secondary">Applicant Name:</span>
                  <span className="font-bold theme-text-main">{requestSubmittedData.full_name}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b theme-border">
                  <span className="theme-text-secondary">Phone / WhatsApp:</span>
                  <span className="font-mono font-semibold theme-text-main">{requestSubmittedData.phone}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b theme-border">
                  <span className="theme-text-secondary">Requested Username:</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{requestSubmittedData.username}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="theme-text-secondary">Status:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Awaiting Approval
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-left text-xs theme-text-main">
                <p className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Next Step:</span>
                </p>
                <p className="text-[11px] leading-relaxed theme-text-secondary">
                  Your registration details have been dispatched to Administration. Click the WhatsApp button below to message Administration directly for instant account activation.
                </p>
              </div>

              {/* Action Buttons for Applicant */}
              <div className="space-y-2 pt-2">
                {requestSubmittedData.whatsapp_link && (
                  <a
                    href={requestSubmittedData.whatsapp_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition min-h-[44px]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send Details to Administration via WhatsApp</span>
                  </a>
                )}

                <a
                  href={requestSubmittedData.mailto_link}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl theme-bg-subtle hover:bg-black/5 dark:hover:bg-white/5 border theme-border font-semibold text-xs theme-text-main transition min-h-[42px]"
                >
                  <Mail className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>Contact Support via Email</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setRequestSubmittedData(null);
                    setActiveTab('login');
                    setUsername(requestSubmittedData.username);
                  }}
                  className="w-full py-2 text-xs font-semibold theme-text-secondary hover:theme-text-main transition"
                >
                  &larr; Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* =========================================================================
                  EXECUTIVE MULTI-FACTOR SECURITY TEST MODAL
                  Triggered only after valid Owner/Director credentials are submitted.
                  Admin Panel stays 100% hidden until this security challenge is passed!
                 ========================================================================= */}
              {pendingAdminSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
                  <div 
                    className="w-full max-w-lg theme-bg-card rounded-3xl border-2 border-amber-500/70 p-5 sm:p-7 shadow-2xl theme-shadow relative text-left max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 pb-3 mb-4 border-b theme-border">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0">
                        <KeyRound className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold theme-text-main font-brand leading-tight">
                            ایڈمنسٹریٹر سیکیورٹی ٹیسٹ و تصدیق
                          </h3>
                        </div>
                        <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 mt-0.5">
                          Executive Multi-Factor Security Challenge · Admin Wallet Access Gate
                        </p>
                        <p className="text-[11px] theme-text-tertiary mt-1 leading-relaxed">
                          ایڈمن پینل مکمل طور پر خفیہ ہے۔ پینل کھولنے کے لیے درج ذیل سیکیورٹی سوالات کی درست تصدیق لازمی ہے۔
                        </p>
                      </div>
                    </div>

                    {securityVerified ? (
                      <div className="py-8 text-center space-y-3 animate-in fade-in">
                        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
                          <Check className="w-8 h-8 stroke-[3]" />
                        </div>
                        <h4 className="text-base font-bold theme-text-main font-brand">
                          سیکیورٹی ٹیسٹ کامیاب!
                        </h4>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                          Security Verification Passed · Opening Executive Admin Wallet...
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSecurityChallengeSubmit} className="space-y-4">
                        {/* Question 1: Master Secret PIN */}
                        <div>
                          <label className="block text-xs font-bold theme-text-secondary mb-1 flex items-center justify-between">
                            <span>1. ڈائریکٹر خفیہ سیکیورٹی پن (Master PIN) *</span>
                            <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10">
                              4 Digits
                            </span>
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              maxLength={8}
                              value={adminSecurityPin}
                              onChange={(e) => setAdminSecurityPin(e.target.value)}
                              placeholder="4-digit Master Security Key"
                              required
                              autoFocus
                              className="w-full px-3.5 py-2.5 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm font-mono tracking-widest focus:outline-none focus:border-amber-500 transition"
                            />
                          </div>
                          <span className="text-[10px] theme-text-tertiary mt-1 block">
                            (ڈیفالٹ ماسٹر کوڈ: 5978 یا 2026)
                          </span>
                        </div>

                        {/* Question 2: Official Registered Contact / WhatsApp / Email */}
                        <div>
                          <label className="block text-xs font-bold theme-text-secondary mb-1">
                            2. رجسٹرڈ ڈائریکٹر واٹس ایپ یا ای میل ایڈریس *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none theme-text-tertiary">
                              <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <input
                              type="text"
                              value={securityAnswer1}
                              onChange={(e) => setSecurityAnswer1(e.target.value)}
                              placeholder="مثلاً: sacc5038@gmail.com یا 0308-2665978"
                              required
                              className="w-full pl-9 pr-3.5 py-2.5 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition"
                            />
                          </div>
                          <span className="text-[10px] theme-text-tertiary mt-1 block">
                            What is your registered Director Email or WhatsApp number?
                          </span>
                        </div>

                        {/* Question 3: Registered City or Headquarters Brand */}
                        <div>
                          <label className="block text-xs font-bold theme-text-secondary mb-1">
                            3. کمپنی کا رجسٹرڈ ہیڈکوارٹر شہر یا برانڈ نام *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none theme-text-tertiary">
                              <Building className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <input
                              type="text"
                              value={securityAnswer2}
                              onChange={(e) => setSecurityAnswer2(e.target.value)}
                              placeholder="مثلاً: Lahore یا CM INVENTORY WALLET"
                              required
                              className="w-full pl-9 pr-3.5 py-2.5 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition"
                            />
                          </div>
                          <span className="text-[10px] theme-text-tertiary mt-1 block">
                            What is your registered City or Agency Brand Name?
                          </span>
                        </div>

                        {/* Question 4: Dynamic Math / Anti-Bot Challenge */}
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                          <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>4. حسابی سیکیورٹی سوال (Anti-Bot Math Test) *</span>
                            </span>
                            <button
                              type="button"
                              onClick={refreshMathChallenge}
                              className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 font-normal"
                              title="نیا سوال جنریٹ کریں"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>نیا سوال</span>
                            </button>
                          </label>
                          <div className="flex items-center gap-3">
                            <div className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 font-mono font-bold text-sm text-amber-900 dark:text-amber-200 shrink-0 select-none">
                              {mathProblem.num1} + {mathProblem.num2} = ?
                            </div>
                            <input
                              type="number"
                              value={mathAnswer}
                              onChange={(e) => setMathAnswer(e.target.value)}
                              placeholder="مجموعہ درج کریں"
                              required
                              className="w-full px-3 py-2 theme-bg-card border theme-border rounded-xl theme-text-main text-sm font-mono font-bold focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        {/* Security Hint Toggle Button */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setShowSecurityHint(!showSecurityHint)}
                            className="text-xs text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>{showSecurityHint ? 'سیکیورٹی مدد چھپائیں' : 'ڈائریکٹر سیکیورٹی ہنٹ (Hint)?'}</span>
                          </button>

                          {showSecurityHint && (
                            <div className="mt-2 p-3 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 space-y-1 animate-in fade-in">
                              <p className="font-bold">💡 ڈائریکٹر سیکیورٹی ریکارڈ ہنٹ:</p>
                              <p>• ماسٹر پن: <strong>5978</strong> (یا 2026)</p>
                              <p>• رابطہ: <strong>sacc5038@gmail.com</strong> یا <strong>0308-2665978</strong></p>
                              <p>• بنیادی شہر: <strong>Lahore</strong> / برانڈ: <strong>CM INVENTORY WALLET</strong></p>
                            </div>
                          )}
                        </div>

                        {securityError && (
                          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2 animate-in fade-in">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                            <span>{securityError}</span>
                          </div>
                        )}

                        <div className="pt-2 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setPendingAdminSession(null);
                              setSecurityError('');
                              setSecurityVerified(false);
                            }}
                            className="flex-1 py-2.5 rounded-xl theme-bg-subtle border theme-border text-xs font-semibold theme-text-main hover:bg-black/5 dark:hover:bg-white/5 transition"
                          >
                            منسوخ کریں (Cancel)
                          </button>

                          <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-md shadow-amber-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 min-h-[42px]"
                          >
                            {isLoading ? (
                              <span>تصدیق ہو رہی ہے...</span>
                            ) : (
                              <>
                                <ShieldCheck className="w-4 h-4" />
                                <span>تصدیق اور ایڈمن پینل ان لاک</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Standard Public 2-Way Tabs: Sign In / Create Account (NO Admin Tab!) */}
              <div className="grid grid-cols-2 gap-1 p-1 theme-bg-subtle rounded-xl mb-5 border theme-border text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                    setPendingApprovalData(null);
                  }}
                  className={`py-2 px-2 text-xs font-bold rounded-lg transition ${
                    activeTab === 'login'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'theme-text-secondary hover:theme-text-main'
                  }`}
                >
                  Sign In (لاگ ان)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('create_account');
                    setErrorMsg('');
                    setSuccessMsg('');
                    setPendingApprovalData(null);
                  }}
                  className={`py-2 px-2 text-xs font-bold rounded-lg transition ${
                    activeTab === 'create_account'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'theme-text-secondary hover:theme-text-main'
                  }`}
                >
                  Create Account (نیا اکاؤنٹ)
                </button>
              </div>

              <div className="mb-4">
                <h1 className="text-lg sm:text-xl font-bold theme-text-main tracking-tight font-brand">
                  {activeTab === 'login' ? 'Property Hub Sign In' : 'Create Free Account'}
                </h1>
                <p className="text-xs theme-text-secondary mt-0.5">
                  {activeTab === 'login' 
                    ? 'Enter your Employee ID or Username to access properties' 
                    : 'Instant registration — fill the details below to start using the portal immediately'}
                </p>
              </div>

              {!isOnline && (
                <div className="mb-4 p-3 rounded-xl bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <WifiOff className="w-4 h-4 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
                  <div>
                    <span className="font-semibold">Device is Offline</span>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      You can sign in with your previously authenticated credentials on this device.
                    </p>
                  </div>
                </div>
              )}

              {/* PENDING APPROVAL ALERT BOX */}
              {pendingApprovalData && (
                <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 space-y-2.5 text-xs text-amber-950 dark:text-amber-200 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 dark:text-amber-300">
                        Account Pending Administrative Verification
                      </h4>
                      <p className="text-[11px] mt-0.5 leading-relaxed">
                        Your account has been registered and is currently awaiting administrative approval. Please contact administration to expedite your activation.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1 border-t border-amber-200 dark:border-amber-800/60">
                    <a
                      href={`https://wa.me/${pendingApprovalData.owner_whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello Administration, please verify and activate my account: ' + username)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Contact Administration on WhatsApp</span>
                    </a>
                    <a
                      href={`mailto:${pendingApprovalData.owner_email}?subject=${encodeURIComponent('Account Activation Request: ' + username)}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl theme-bg-card border theme-border font-semibold text-xs theme-text-main transition"
                    >
                      <Mail className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      <span>Email Administration Support</span>
                    </a>
                  </div>
                </div>
              )}

              {errorMsg && !pendingApprovalData && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* SINGLE CLEAN USER SIGN IN FORM (Used by both Employees and Admin) */}
              {activeTab === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-semibold theme-text-secondary mb-1">
                      Username / Employee ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none theme-text-tertiary">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter Username or Employee ID"
                        required
                        className="w-full pl-10 pr-4 py-2.5 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold theme-text-secondary mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none theme-text-tertiary">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        required
                        className="w-full pl-10 pr-11 py-2.5 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center theme-text-tertiary hover:theme-text-main"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm tracking-wide transition-all shadow-md shadow-amber-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {isLoading ? (
                      <span>Signing in...</span>
                    ) : (
                      <>
                        <span>Sign In to Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 2: CREATE ACCOUNT / INSTANT REGISTRATION */}
              {activeTab === 'create_account' && (
                <form onSubmit={handleRequestAccessSubmit} className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-semibold theme-text-secondary mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none theme-text-tertiary">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={reqFullName}
                        onChange={(e) => setReqFullName(e.target.value)}
                        placeholder="e.g. Tariq Mehmood"
                        required
                        className="w-full pl-9 pr-3 py-2 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold theme-text-secondary mb-1">
                        Phone / WhatsApp *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none theme-text-tertiary">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="tel"
                          value={reqPhone}
                          onChange={(e) => setReqPhone(e.target.value)}
                          placeholder="0300-1234567"
                          required
                          className="w-full pl-9 pr-3 py-2 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold theme-text-secondary mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none theme-text-tertiary">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="email"
                          value={reqEmail}
                          onChange={(e) => setReqEmail(e.target.value)}
                          placeholder="name@email.com"
                          required
                          className="w-full pl-9 pr-3 py-2 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold theme-text-secondary mb-1">
                        Agency / Office Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none theme-text-tertiary">
                          <Building className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          value={reqAgency}
                          onChange={(e) => setReqAgency(e.target.value)}
                          placeholder="e.g. Real Estate Agency"
                          className="w-full pl-9 pr-3 py-2 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold theme-text-secondary mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={reqCity}
                        onChange={(e) => setReqCity(e.target.value)}
                        placeholder="Lahore"
                        className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold theme-text-secondary mb-1">
                      Desired Username *
                    </label>
                    <input
                      type="text"
                      value={reqUsername}
                      onChange={(e) => setReqUsername(e.target.value)}
                      placeholder="e.g. EMP-105 or yourname"
                      required
                      className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold theme-text-secondary mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showReqPassword ? 'text' : 'password'}
                          value={reqPassword}
                          onChange={(e) => setReqPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          required
                          className="w-full pl-3 pr-8 py-2 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowReqPassword(!showReqPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center theme-text-tertiary hover:theme-text-main"
                        >
                          {showReqPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold theme-text-secondary mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        value={reqConfirmPassword}
                        onChange={(e) => setReqConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm tracking-wide transition-all shadow-md shadow-amber-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {isLoading ? (
                      <span>Creating Account...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Create Account & Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Clean footer notice without any hidden buttons */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs theme-text-tertiary font-medium">
          <span>CM INVENTORY WALLET · Real Estate Property Management System</span>
        </div>
      </div>
    </div>
  );
};
