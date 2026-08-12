import React, { useState } from 'react';
import { X, Lock, Mail, Phone, User, MapPin, Ruler, Sprout, CheckCircle } from 'lucide-react';
import { FarmerProfile, Language } from '../types';
import { translations } from '../lib/translations';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup' | 'forgot';
  onClose: () => void;
  onSuccess: (user: FarmerProfile) => void;
  language: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
  language
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const t = translations[language] || translations.en;

  // Form State
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('Mumbai, Maharashtra');
  const [farmSize, setFarmSize] = useState('2.5');
  const [mainCrops, setMainCrops] = useState('Rice, Wheat');
  const [forgotSent, setForgotSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'forgot') {
      setForgotSent(true);
      return;
    }

    const newUser: FarmerProfile = {
      id: 'farmer_' + Date.now(),
      name: name || 'Ramesh Kumar',
      email: contact.includes('@') ? contact : 'farmer@farmease.app',
      phone: !contact.includes('@') ? contact : '+91 98765 43210',
      location: location || 'Punjab, India',
      farmSize: parseFloat(farmSize) || 2.5,
      farmSizeUnit: 'acres',
      soilType: 'Loamy',
      mainCrops: mainCrops.split(',').map(s => s.trim()),
      language,
      joinedDate: new Date().toISOString()
    };

    onSuccess(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-100 p-6 sm:p-8 space-y-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
            <Sprout className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-stone-900">
            {mode === 'login' ? t.login : mode === 'signup' ? t.signup : 'Reset Password'}
          </h2>
          <p className="text-xs text-stone-500">
            {mode === 'login'
              ? 'Welcome back to your FarmEase digital assistant'
              : mode === 'signup'
              ? 'Create your farmer profile for tailored crop advice'
              : 'Enter your email or phone to reset password'}
          </p>
        </div>

        {/* Forgot password success state */}
        {forgotSent ? (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-emerald-950">
              Password Reset Link Sent!
            </p>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              We sent a verification SMS / email to <strong>{contact}</strong>. Please check your inbox.
            </p>
            <button
              onClick={() => { setForgotSent(false); setMode('login'); }}
              className="mt-2 text-xs font-bold text-emerald-700 underline"
            >
              Back to Log In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Farmer Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Email or Mobile Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. farmer@example.com or 9876543210"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Location / District
                    </label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Ludhiana, Punjab"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Farm Size (Acres)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={farmSize}
                      onChange={(e) => setFarmSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Main Crops Grown
                  </label>
                  <input
                    type="text"
                    required
                    value={mainCrops}
                    onChange={(e) => setMainCrops(e.target.value)}
                    placeholder="e.g. Rice, Wheat, Cotton"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-emerald-700 hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
            >
              {mode === 'login' ? t.login : mode === 'signup' ? 'Complete Farmer Registration' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {/* Footer Toggle */}
        <div className="text-center pt-2 border-t border-stone-100 text-xs text-stone-600">
          {mode === 'login' ? (
            <span>
              New to FarmEase?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-bold text-emerald-700 hover:underline"
              >
                Sign Up Here
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold text-emerald-700 hover:underline"
              >
                Log In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
