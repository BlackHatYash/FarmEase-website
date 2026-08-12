import React, { useState } from 'react';
import { Sprout, LayoutDashboard, Stethoscope, CloudSun, BarChart3, User, LogIn, Menu, X, Globe, Type, Bell } from 'lucide-react';
import { Language, FarmerProfile, WeatherAlert } from '../types';
import { translations, languageNames } from '../lib/translations';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isLargeText: boolean;
  setIsLargeText: (large: boolean) => void;
  user: FarmerProfile | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
  alerts: WeatherAlert[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  language,
  setLanguage,
  isLargeText,
  setIsLargeText,
  user,
  onOpenAuth,
  onLogout,
  alerts
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const t = translations[language] || translations.en;

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'crop-recommendation', label: t.cropRecommendation, icon: Sprout },
    { id: 'disease-detection', label: t.diseaseDetection, icon: Stethoscope },
    { id: 'weather', label: t.weather, icon: CloudSun },
    { id: 'farm-insights', label: t.farmInsights, icon: BarChart3 },
  ];

  const unreadAlerts = alerts.filter(a => a.severity === 'urgent' || a.severity === 'warning');

  return (
    <>
      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md border-b border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setCurrentTab('home')}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all">
                <Sprout className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-95" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1">
                  Farm<span className="text-emerald-400">Ease</span>
                </span>
                <span className="hidden sm:block text-xs font-medium text-emerald-200 tracking-wider">
                  Smart Farming • Better Yields
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 font-medium">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-emerald-800/90 text-emerald-300 font-semibold shadow-inner border border-emerald-700/60'
                        : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-emerald-300/80'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Utility Controls & Auth */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Emergency Alerts Bell */}
              <div className="relative">
                <button
                  onClick={() => setAlertsOpen(!alertsOpen)}
                  className="p-2 rounded-lg text-emerald-200 hover:bg-emerald-800 hover:text-white relative transition-colors"
                  title="Weather & Crop Risk Alerts"
                >
                  <Bell className="w-5 h-5" />
                  {unreadAlerts.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  )}
                  {unreadAlerts.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                  )}
                </button>

                {/* Alerts Dropdown */}
                {alertsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 text-gray-800 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                        <Bell className="w-4 h-4 text-emerald-600" />
                        {t.emergencyAlert}
                      </h4>
                      <button onClick={() => setAlertsOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-3 space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {alerts.map(alert => (
                        <div key={alert.id} className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl">
                          <div className="flex items-center justify-between font-semibold text-amber-900 text-xs">
                            <span>{alert.title}</span>
                            <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              {alert.date}
                            </span>
                          </div>
                          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                            {alert.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Language Selector Dropdown */}
              <div className="relative flex items-center bg-emerald-800/80 hover:bg-emerald-800 border border-emerald-700 rounded-lg px-2 py-1 text-xs text-emerald-100">
                <Globe className="w-3.5 h-3.5 text-emerald-300 mr-1.5 hidden sm:inline" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer py-1"
                >
                  {(Object.keys(languageNames) as Language[]).map((lang) => (
                    <option key={lang} value={lang} className="text-gray-900 bg-white">
                      {languageNames[lang].nativeName} ({languageNames[lang].name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Text Size Accessibility Toggle */}
              <button
                onClick={() => setIsLargeText(!isLargeText)}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  isLargeText
                    ? 'bg-amber-400 text-amber-950 font-bold'
                    : 'bg-emerald-800/60 text-emerald-200 hover:bg-emerald-800'
                }`}
                title="Toggle Text Size for accessibility"
              >
                <Type className="w-4 h-4" />
                <span className="hidden sm:inline">{isLargeText ? 'Large' : 'Normal'}</span>
              </button>

              {/* User Profile / Auth */}
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentTab('profile')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs border border-emerald-400">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:inline text-xs font-semibold truncate max-w-[100px]">
                      {user.name}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white transition-colors"
                  >
                    {t.login}
                  </button>
                  <button
                    onClick={() => onOpenAuth('signup')}
                    className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-400 hover:bg-emerald-300 text-emerald-950 transition-colors shadow-sm"
                  >
                    {t.signup}
                  </button>
                </div>
              )}

              {/* Mobile Drawer Trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-emerald-200 hover:bg-emerald-800 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-emerald-950 border-t border-emerald-800 px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-800 text-emerald-300 font-bold border border-emerald-700'
                      : 'text-emerald-100 hover:bg-emerald-900'
                  }`}
                >
                  <Icon className="w-5 h-5 text-emerald-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            {user ? (
              <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between">
                <button
                  onClick={() => {
                    setCurrentTab('profile');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-emerald-200 text-sm font-medium"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>{user.name} ({user.location})</span>
                </button>
                <button
                  onClick={onLogout}
                  className="text-xs text-red-300 hover:text-red-200 bg-red-950/60 px-3 py-1 rounded-lg border border-red-800/60"
                >
                  {t.logout}
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-emerald-800 flex gap-2">
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-emerald-800 text-white font-medium text-sm text-center"
                >
                  {t.login}
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('signup');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-emerald-400 text-emerald-950 font-bold text-sm text-center"
                >
                  {t.signup}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Fixed Bottom Navigation Bar for quick farmer access */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-emerald-100 shadow-2xl py-1.5 px-2 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-all ${
                isActive ? 'text-emerald-700 font-bold' : 'text-gray-500 hover:text-emerald-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 scale-110' : 'text-gray-400'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-none">
                {item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};
