import React, { useState } from 'react';
import { 
  Sprout, 
  Phone, 
  Mail, 
  Lock, 
  User, 
  MapPin, 
  Ruler, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  RotateCcw,
  Leaf
} from 'lucide-react';
import { FarmerProfile, Language } from '../types';
import { translations, languageNames } from '../lib/translations';

interface LoginPageProps {
  currentUser: FarmerProfile | null;
  onLoginSuccess: (user: FarmerProfile) => void;
  onNavigate: (tabId: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  initialMode?: 'otp' | 'password' | 'signup';
}

const DEMO_PROFILES: FarmerProfile[] = [
  {
    id: 'farmer_001',
    name: 'Yash Shidruk',
    email: 'yash.shidruk@farmease.app',
    phone: '+91 98765 43210',
    location: 'Mumbai, Maharashtra',
    farmSize: 5.0,
    farmSizeUnit: 'acres',
    soilType: 'Loamy Alluvial',
    mainCrops: ['Rice (Paddy)', 'Wheat', 'Maize'],
    language: 'en',
    joinedDate: '2026-01-15'
  },
  {
    id: 'farmer_002',
    name: 'Ramesh Kumar',
    email: 'ramesh.kumar@farmease.app',
    phone: '+91 98220 11223',
    location: 'Nashik, Maharashtra',
    farmSize: 12.5,
    farmSizeUnit: 'acres',
    soilType: 'Black Cotton (Regur)',
    mainCrops: ['Grapes', 'Onion', 'Tomato'],
    language: 'mr',
    joinedDate: '2025-11-20'
  },
  {
    id: 'farmer_003',
    name: 'Sunita Patil',
    email: 'sunita.patil@farmease.app',
    phone: '+91 94230 99887',
    location: 'Kolhapur, Maharashtra',
    farmSize: 3.5,
    farmSizeUnit: 'acres',
    soilType: 'Red & Laterite',
    mainCrops: ['Sugarcane', 'Soybean', 'Chili'],
    language: 'hi',
    joinedDate: '2026-02-10'
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  onLoginSuccess,
  onNavigate,
  language,
  setLanguage,
  initialMode = 'otp'
}) => {
  const t = translations[language] || translations.en;

  // Active form view mode: 'otp' | 'password' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState<'otp' | 'password' | 'signup' | 'forgot'>(initialMode);

  // OTP Login State
  const [otpPhone, setOtpPhone] = useState('+91 98765 43210');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(45);

  // Password Login State
  const [identifier, setIdentifier] = useState('yash.shidruk@farmease.app');
  const [password, setPassword] = useState('farmease2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up State
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('+91 ');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupLocation, setSignupLocation] = useState('Pune, Maharashtra');
  const [signupFarmSize, setSignupFarmSize] = useState('4.0');
  const [signupSoilType, setSignupSoilType] = useState('Loamy Alluvial');
  const [signupCrops, setSignupCrops] = useState('Rice, Wheat, Soybean');

  // Status & Feedback State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Handle Mobile OTP Request
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpPhone || otpPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
      setOtpCode('8241'); // Prefill or demo hint
    }, 600);
  };

  // Verify OTP and complete login
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setErrorMsg('Please enter the 4-digit verification code.');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Find matching demo profile or create dynamic profile
      const matched = DEMO_PROFILES.find(p => p.phone.replace(/\s+/g, '') === otpPhone.replace(/\s+/g, ''));
      const authenticatedUser: FarmerProfile = matched || {
        id: 'farmer_' + Date.now(),
        name: 'Farmer ' + otpPhone.slice(-4),
        email: `farmer_${otpPhone.slice(-4)}@farmease.app`,
        phone: otpPhone,
        location: 'Maharashtra, India',
        farmSize: 3.5,
        farmSizeUnit: 'acres',
        soilType: 'Medium Black',
        mainCrops: ['Rice (Paddy)', 'Cotton'],
        language,
        joinedDate: new Date().toISOString().split('T')[0]
      };

      onLoginSuccess(authenticatedUser);
      onNavigate('dashboard');
    }, 500);
  };

  // Handle Email / Password Login
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg('Please provide both your login email/phone and password.');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const cleanIdent = identifier.trim().toLowerCase();
      const matched = DEMO_PROFILES.find(
        p => p.email.toLowerCase() === cleanIdent || p.phone.replace(/\s+/g, '') === cleanIdent.replace(/\s+/g, '')
      );

      const authenticatedUser: FarmerProfile = matched || {
        id: 'farmer_' + Date.now(),
        name: identifier.includes('@') ? identifier.split('@')[0].replace('.', ' ') : 'Verified Farmer',
        email: identifier.includes('@') ? identifier : `${identifier}@farmease.app`,
        phone: !identifier.includes('@') ? identifier : '+91 98765 43210',
        location: 'Nashik, Maharashtra',
        farmSize: 5.0,
        farmSizeUnit: 'acres',
        soilType: 'Loamy',
        mainCrops: ['Wheat', 'Maize'],
        language,
        joinedDate: new Date().toISOString().split('T')[0]
      };

      onLoginSuccess(authenticatedUser);
      onNavigate('dashboard');
    }, 500);
  };

  // Handle Farmer Registration (Sign Up)
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!signupPhone.trim() || signupPhone.length < 10) {
      setErrorMsg('Please enter a valid mobile contact number.');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const newFarmer: FarmerProfile = {
        id: 'farmer_' + Date.now(),
        name: signupName.trim(),
        email: signupEmail.trim() || `${signupName.toLowerCase().replace(/\s+/g, '.')}@farmease.app`,
        phone: signupPhone.trim(),
        location: signupLocation.trim() || 'Maharashtra, India',
        farmSize: parseFloat(signupFarmSize) || 2.5,
        farmSizeUnit: 'acres',
        soilType: signupSoilType,
        mainCrops: signupCrops.split(',').map(s => s.trim()).filter(Boolean),
        language,
        joinedDate: new Date().toISOString().split('T')[0]
      };

      onLoginSuccess(newFarmer);
      onNavigate('dashboard');
    }, 600);
  };

  // Quick 1-click select demo profile
  const handleSelectDemoProfile = (profile: FarmerProfile) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(profile);
      onNavigate('dashboard');
    }, 300);
  };

  return (
    <div id="login-page-view" className="min-h-[calc(100vh-5rem)] bg-stone-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-6xl w-full mx-auto">
        
        {/* Top Navigation Strip */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 transition-colors bg-emerald-100/80 hover:bg-emerald-200/80 px-3.5 py-2 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to FarmEase Home</span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm text-xs">
            <span className="text-stone-500 font-medium hidden sm:inline">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              aria-label="Select language for login"
              className="font-bold text-emerald-900 bg-transparent focus:outline-none cursor-pointer"
            >
              {(Object.keys(languageNames) as Language[]).map((lang) => (
                <option key={lang} value={lang}>
                  {languageNames[lang].nativeName} ({languageNames[lang].name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-3xl shadow-xl border border-stone-200/90 overflow-hidden grid lg:grid-cols-12">
          
          {/* ================= LEFT BRAND & BENEFIT PANEL (5 COLS) ================= */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-900 via-emerald-950 to-stone-950 text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
            {/* Background ambient accents */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Logo & Badge */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-600/50 text-emerald-300 text-xs font-semibold mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Kisan AI Assistant Portal</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg">
                    <Sprout className="w-7 h-7 text-emerald-950" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Farm<span className="text-emerald-400">Ease</span>
                    </h1>
                    <p className="text-xs text-emerald-200/80 font-medium">
                      Smart Farming • Better Yields
                    </p>
                  </div>
                </div>
              </div>

              {/* Tagline & Feature List */}
              <div className="space-y-4 pt-2">
                <h2 className="text-lg font-bold text-emerald-100">
                  Welcome to Your Intelligent Digital Farm Companion
                </h2>
                <p className="text-xs sm:text-sm text-emerald-200/80 leading-relaxed">
                  Log in to access real-time agronomic intelligence, multimodal plant pathology diagnostics, and precision weather forecasting tailored to your land.
                </p>

                <ul className="space-y-3 pt-2 text-xs text-stone-200">
                  <li className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span><strong>AI Crop Doctor:</strong> Upload leaf photos for 94.2% diagnostic accuracy & treatment advice.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span><strong>7-Day Micro-Weather:</strong> Real-time rain probabilities, humidity, and spray suitability alerts.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span><strong>Soil & Agronomic Intelligence:</strong> Recommendations tailored to your regional soil type and climate zone.</span>
                  </li>
                </ul>
              </div>

              {/* Farmer Quote / Testimonial */}
              <div className="bg-emerald-800/40 border border-emerald-700/60 rounded-2xl p-4 text-xs space-y-2">
                <p className="italic text-emerald-100">
                  "FarmEase helped me detect early blight 5 days before it spread to my whole tomato field. Saved at least ₹45,000 in harvest value."
                </p>
                <div className="flex items-center justify-between text-[11px] text-emerald-300 font-semibold pt-1 border-t border-emerald-700/40">
                  <span>— Ramesh K., Nashik, MH</span>
                  <span className="text-amber-300">★★★★★ Verified Farmer</span>
                </div>
              </div>
            </div>

            {/* Security Guarantee Footer */}
            <div className="relative z-10 pt-6 mt-6 border-t border-emerald-800/60 flex items-center gap-2 text-[11px] text-emerald-300/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>256-Bit Encrypted • ICAR Data Privacy Compliant • Zero Spam</span>
            </div>
          </div>

          {/* ================= RIGHT FORM PANEL (7 COLS) ================= */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
            
            {/* If currently logged in, show active session banner */}
            {currentUser && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs text-emerald-800 font-bold">Currently Signed In</div>
                    <div className="text-sm font-black text-emerald-950">{currentUser.name} ({currentUser.location})</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}

            <div>
              {/* Header Title */}
              <div className="space-y-1 mb-6">
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  {authMode === 'signup' 
                    ? 'Create Farmer Account' 
                    : authMode === 'forgot'
                    ? 'Reset Your Password'
                    : 'Farmer Sign In'}
                </h2>
                <p className="text-xs sm:text-sm text-stone-500">
                  {authMode === 'signup'
                    ? 'Register your farm plot to get custom AI crop schedules and pest alerts.'
                    : authMode === 'forgot'
                    ? 'Enter your registered email or phone to receive a secure recovery code.'
                    : 'Choose your preferred sign-in method to access your farm dashboard.'}
                </p>
              </div>

              {/* Mode Toggle Tabs (OTP vs Password vs Sign Up) */}
              {authMode !== 'forgot' && (
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-2xl mb-6 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('otp'); setErrorMsg(null); }}
                    className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      authMode === 'otp'
                        ? 'bg-white text-emerald-900 shadow-sm border border-stone-200'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Mobile OTP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('password'); setErrorMsg(null); }}
                    className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      authMode === 'password'
                        ? 'bg-white text-emerald-900 shadow-sm border border-stone-200'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Password</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setErrorMsg(null); }}
                    className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      authMode === 'signup'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>New Farmer</span>
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* ================= METHOD 1: MOBILE OTP FORM ================= */}
              {authMode === 'otp' && (
                <div className="space-y-4">
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1.5">
                          Registered Mobile Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                            <Phone className="w-4 h-4" />
                          </div>
                          <input
                            type="tel"
                            value={otpPhone}
                            onChange={(e) => setOtpPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-stone-900 bg-white"
                          />
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">
                          We will send a 4-digit verification SMS code to this mobile number.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Get Verification Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                        <span>Code sent to <strong>{otpPhone}</strong></span>
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setOtpCode(''); }}
                          className="text-emerald-700 hover:underline font-bold"
                        >
                          Change Number
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1.5">
                          Enter 4-Digit OTP
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                            <KeyRound className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            maxLength={4}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="e.g. 8241"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg tracking-widest font-black text-stone-900 bg-white text-center sm:text-left"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1.5">
                          <span>Demo verification code: <strong className="text-emerald-700">8241</strong></span>
                          <button
                            type="button"
                            onClick={() => setOtpCode('8241')}
                            className="text-emerald-600 hover:text-emerald-800 font-bold underline"
                          >
                            Auto-Fill Demo Code
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Verify & Enter Farm Dashboard</span>
                            <CheckCircle2 className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* ================= METHOD 2: PASSWORD FORM ================= */}
              {authMode === 'password' && (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Email or Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. yash.shidruk@farmease.app"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-stone-900 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-stone-700">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => { setAuthMode('forgot'); setErrorMsg(null); }}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-stone-900 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-600 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Remember this device</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In to FarmEase</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ================= METHOD 3: NEW FARMER REGISTRATION (SIGN UP) ================= */}
              {authMode === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Farmer Full Name *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          placeholder="e.g. Yash Shidruk"
                          required
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-stone-900 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Mobile Phone Number *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          required
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-stone-900 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Email Address (Optional)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="farmer@farmease.app"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-stone-900 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Create Password *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          required
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-stone-900 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Farm Location
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={signupLocation}
                          onChange={(e) => setSignupLocation(e.target.value)}
                          placeholder="District, State"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-stone-900 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Plot Size (Acres)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                          <Ruler className="w-4 h-4" />
                        </div>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={signupFarmSize}
                          onChange={(e) => setSignupFarmSize(e.target.value)}
                          placeholder="4.0"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-stone-900 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Soil Type
                      </label>
                      <select
                        value={signupSoilType}
                        onChange={(e) => setSignupSoilType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-stone-900 bg-white cursor-pointer"
                      >
                        <option value="Loamy Alluvial">Loamy Alluvial</option>
                        <option value="Black Cotton (Regur)">Black Cotton (Regur)</option>
                        <option value="Red Sandy">Red Sandy</option>
                        <option value="Laterite">Laterite</option>
                        <option value="Clayey">Clayey</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Main Crops Grown
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                        <Sprout className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={signupCrops}
                        onChange={(e) => setSignupCrops(e.target.value)}
                        placeholder="e.g. Rice, Wheat, Soybean"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-stone-900 bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Complete Registration & Launch Farm</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ================= METHOD 4: FORGOT PASSWORD ================= */}
              {authMode === 'forgot' && (
                <div className="space-y-4">
                  {!forgotSubmitted ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!forgotEmail) {
                          setErrorMsg('Please enter your email or phone.');
                          return;
                        }
                        setErrorMsg(null);
                        setForgotSubmitted(true);
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1.5">
                          Registered Email or Phone Number
                        </label>
                        <input
                          type="text"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="e.g. yash.shidruk@farmease.app"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-stone-900 bg-white"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Send Password Reset Link</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => { setAuthMode('password'); setForgotSubmitted(false); }}
                          className="text-xs text-stone-500 hover:text-stone-800 font-bold"
                        >
                          Return to Password Sign In
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-black text-emerald-950">
                        Recovery Link Dispatched
                      </h3>
                      <p className="text-xs text-emerald-800">
                        We have sent password reset instructions to <strong>{forgotEmail}</strong>. Please check your inbox or SMS messages.
                      </p>
                      <button
                        type="button"
                        onClick={() => { setAuthMode('password'); setForgotSubmitted(false); }}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Back to Login
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ================= 1-CLICK TEST FARMER ACCOUNTS ================= */}
            <div className="pt-6 border-t border-stone-200/80">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-stone-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Instant 1-Click Demo Profiles (For Evaluators)</span>
                </span>
                <span className="text-[10px] text-stone-400 font-medium">Click any to test</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-2.5">
                {DEMO_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleSelectDemoProfile(profile)}
                    className="text-left p-2.5 rounded-xl border border-stone-200 hover:border-emerald-500 bg-stone-50/80 hover:bg-emerald-50/60 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 group-hover:text-emerald-900">
                        {profile.name}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                        {profile.farmSize} Ac
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 truncate mt-0.5">
                      {profile.location}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-1 truncate">
                      {profile.mainCrops.join(', ')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
