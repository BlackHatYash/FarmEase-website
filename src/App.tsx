import React, { useState, useEffect } from 'react';
import { Language, FarmerProfile, WeatherData, CropRecommendation, DiseaseScan, WeatherAlert } from './types';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeatureCards } from './components/FeatureCards';
import { HowItWorks } from './components/HowItWorks';
import { Dashboard } from './components/Dashboard';
import { CropRecommendationView } from './components/CropRecommendationView';
import { DiseaseDetectionView } from './components/DiseaseDetectionView';
import { WeatherView } from './components/WeatherView';
import { FarmInsightsView } from './components/FarmInsightsView';
import { ProfileView } from './components/ProfileView';
import { LoginPage } from './components/LoginPage';
import { AuthModal } from './components/AuthModal';
import { fetchWeatherData } from './services/api';
import tomatoBlightImg from './assets/images/tomato_blight_leaf_1795064405537.jpg';
import { translations, languageFonts } from './lib/translations';

// Pre-seeded initial user profile so the dashboard is immediately interactive
const initialUser: FarmerProfile = {
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
};

const getStoredActiveUser = (): FarmerProfile | null => {
  try {
    const saved = localStorage.getItem('farmease_user');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load user from localStorage', e);
  }
  return initialUser;
};

const getStoredLanguage = (): Language => {
  try {
    const saved = localStorage.getItem('farmease_lang') as Language | null;
    if (saved && saved in languageFonts) {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'en';
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [language, setLanguage] = useState<Language>(getStoredLanguage);
  const [isLargeText, setIsLargeText] = useState<boolean>(false);
  const [user, setUser] = useState<FarmerProfile | null>(getStoredActiveUser);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const t = translations[language] || translations.en;
  const activeFont = languageFonts[language] || languageFonts.en;

  // Auth Modal state
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Stored Records
  const [savedRecommendations, setSavedRecommendations] = useState<CropRecommendation[]>([
    {
      id: 'rec_init_1',
      cropName: 'Basmati Rice (PBR 1121)',
      suitabilityScore: 94,
      expectedYield: '4.8 tons / hectare',
      growingDuration: '120–135 days',
      waterRequirement: 'High',
      estimatedProfitability: '$2,100 / hectare',
      recommendedPlantingPeriod: 'June 15 – July 10',
      soilCompatibility: 'Excellent compatibility with fertile alluvial soil pH 6.8.',
      aiExplanation: 'Selected due to high water availability, suitable monsoon onset forecast, and optimal soil nitrogen levels following your previous wheat crop.',
      keyCareTips: [
        'Maintain 2-3 cm standing water during tillering.',
        'Apply zinc sulfate at 25 kg/ha after transplanting.'
      ],
      createdAt: new Date().toISOString()
    }
  ]);

  const [diseaseScans, setDiseaseScans] = useState<DiseaseScan[]>([
    {
      id: 'scan_init_1',
      imageUrl: tomatoBlightImg,
      cropName: 'Tomato',
      diseaseName: 'Tomato Early Blight (Alternaria solani)',
      confidence: 94,
      isHealthy: false,
      visibleSymptoms: ['Concentric dark brown circular spots', 'Yellow halo surrounding lesions', 'Premature leaf drop'],
      possibleCauses: ['Fungal spore carryover in soil debris', 'Extended foliage wetness & warm temp'],
      recommendedTreatment: ['Remove infected leaves', 'Apply Copper Hydroxide spray', 'Improve leaf airflow'],
      preventionTips: ['3-year crop rotation', 'Mulch soil base'],
      disclaimer: 'Disclaimer: AI results are informational.',
      scannedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]);

  const [alerts] = useState<WeatherAlert[]>([
    {
      id: 'alt_1',
      title: 'Scattered Rain Alert (35% Chance)',
      description: 'Afternoon precipitation expected. Consider delaying scheduled foliar fertilizer sprays.',
      severity: 'warning',
      date: 'Today'
    },
    {
      id: 'alt_2',
      title: 'Fungal Pathogen Risk Warning',
      description: 'High air humidity (68%) elevates early blight risk in tomato and potato crops.',
      severity: 'urgent',
      date: 'Aug 12'
    }
  ]);

  useEffect(() => {
    const fontConfig = languageFonts[language] || languageFonts.en;
    document.documentElement.lang = language;
    document.documentElement.style.setProperty('--font-sans', fontConfig.fontFamily);
    document.documentElement.style.fontFamily = fontConfig.fontFamily;
    document.body.style.fontFamily = fontConfig.fontFamily;
    try {
      localStorage.setItem('farmease_lang', language);
    } catch {
      // ignore storage errors
    }
  }, [language]);

  useEffect(() => {
    fetchWeatherData(user?.location || 'Punjab, India')
      .then(w => setWeather(w))
      .catch(err => console.error(err));
  }, [user?.location]);

  // Synchronize URL hash for direct links (#signup, #login, etc.) on GitHub Pages
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (hash === 'signup' || hash === 'register') {
        setAuthMode('signup');
        setCurrentTab('login');
      } else if (hash === 'login' || hash === 'signin') {
        setAuthMode('login');
        setCurrentTab('login');
      } else if (['home', 'dashboard', 'crop-recommendation', 'disease-detection', 'weather', 'farm-insights', 'insights', 'profile'].includes(hash)) {
        setCurrentTab(hash === 'insights' ? 'farm-insights' : hash);
      }
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const handleUserChange = (newUser: FarmerProfile | null) => {
    setUser(newUser);
    try {
      if (newUser) {
        localStorage.setItem('farmease_user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('farmease_user');
      }
    } catch (e) {
      console.error('Failed to sync user with localStorage', e);
    }
  };

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setCurrentTab('login');
    window.location.hash = mode;
  };

  const handleSaveRecommendation = (rec: CropRecommendation) => {
    setSavedRecommendations(prev => [rec, ...prev.filter(r => r.id !== rec.id)]);
  };

  const handleSaveScan = (scan: DiseaseScan) => {
    setDiseaseScans(prev => [scan, ...prev.filter(s => s.id !== scan.id)]);
  };

  return (
    <div
      style={{ fontFamily: activeFont.fontFamily }}
      className={`min-h-screen bg-stone-100 text-stone-900 font-sans antialiased ${activeFont.cssClass} ${
        isLargeText ? 'text-lg sm:text-xl' : 'text-base'
      }`}
    >
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          window.location.hash = tab;
        }}
        language={language}
        setLanguage={setLanguage}
        isLargeText={isLargeText}
        setIsLargeText={setIsLargeText}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={() => {
          handleUserChange(null);
          setCurrentTab('login');
          setAuthMode('login');
          window.location.hash = 'login';
        }}
        alerts={alerts}
      />

      {/* Main Body View Switching */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        {currentTab === 'home' && (
          <div className="space-y-12">
            <HeroSection
              onGetStarted={() => {
                setCurrentTab('dashboard');
                window.location.hash = 'dashboard';
              }}
              onExploreFeatures={() => {
                const el = document.getElementById('features-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else {
                  setCurrentTab('dashboard');
                  window.location.hash = 'dashboard';
                }
              }}
              onOpenAuth={handleOpenAuth}
              language={language}
            />
            <div id="features-section">
              <FeatureCards
                onSelectFeature={(tabId) => setCurrentTab(tabId)}
                language={language}
              />
            </div>
            <HowItWorks
              onStartProcess={() => setCurrentTab('crop-recommendation')}
              language={language}
            />
          </div>
        )}

        {currentTab === 'dashboard' && (
          <Dashboard
            user={user}
            weather={weather}
            savedRecommendations={savedRecommendations}
            diseaseScans={diseaseScans}
            onNavigate={(tabId) => setCurrentTab(tabId)}
            language={language}
          />
        )}

        {currentTab === 'crop-recommendation' && (
          <CropRecommendationView
            onSaveRecommendation={handleSaveRecommendation}
            language={language}
            defaultLocation={user?.location}
            defaultFarmSize={user?.farmSize}
          />
        )}

        {currentTab === 'disease-detection' && (
          <DiseaseDetectionView
            onSaveScan={handleSaveScan}
            language={language}
          />
        )}

        {currentTab === 'weather' && (
          <WeatherView
            initialWeather={weather}
            language={language}
          />
        )}

        {currentTab === 'farm-insights' && (
          <FarmInsightsView
            language={language}
          />
        )}

        {currentTab === 'profile' && user && (
          <ProfileView
            user={user}
            onUpdateUser={(updated) => handleUserChange(updated)}
            onLogout={() => {
              handleUserChange(null);
              setCurrentTab('login');
              setAuthMode('login');
              window.location.hash = 'login';
            }}
            language={language}
            setLanguage={setLanguage}
          />
        )}

        {currentTab === 'profile' && !user && (
          <LoginPage
            currentUser={null}
            onLoginSuccess={(newUser) => {
              handleUserChange(newUser);
              setCurrentTab('dashboard');
              window.location.hash = 'dashboard';
            }}
            onNavigate={(tabId) => {
              setCurrentTab(tabId);
              window.location.hash = tabId;
            }}
            language={language}
            setLanguage={setLanguage}
            initialMode="otp"
          />
        )}

        {currentTab === 'login' && (
          <LoginPage
            currentUser={user}
            onLoginSuccess={(newUser) => {
              handleUserChange(newUser);
              setCurrentTab('dashboard');
              window.location.hash = 'dashboard';
            }}
            onNavigate={(tabId) => {
              setCurrentTab(tabId);
              window.location.hash = tabId;
            }}
            language={language}
            setLanguage={setLanguage}
            initialMode={authMode === 'signup' ? 'signup' : 'otp'}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-emerald-950 text-emerald-200 border-t border-emerald-800/80 py-10 mt-12 mb-12 lg:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3 font-extrabold text-white text-sm">
            <span>🌱 {t.footerTitle}</span>
            <span className="text-emerald-500">•</span>
            <button
              onClick={() => {
                setCurrentTab('login');
                window.location.hash = 'login';
              }}
              className="text-emerald-300 hover:text-white underline font-bold transition-colors cursor-pointer"
            >
              🔐 {t.footerPortal}
            </button>
          </div>
          <p className="text-emerald-300/80 text-center sm:text-right">
            {t.footerTagline}
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(newUser) => {
          setUser(newUser);
          setCurrentTab('dashboard');
        }}
        language={language}
      />
    </div>
  );
}
