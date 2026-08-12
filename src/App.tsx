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
import { AuthModal } from './components/AuthModal';
import { fetchWeatherData } from './services/api';

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

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [isLargeText, setIsLargeText] = useState<boolean>(false);
  const [user, setUser] = useState<FarmerProfile | null>(initialUser);
  const [weather, setWeather] = useState<WeatherData | null>(null);

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
      imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?w=500&auto=format&fit=crop&q=80',
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
    fetchWeatherData(user?.location || 'Punjab, India')
      .then(w => setWeather(w))
      .catch(err => console.error(err));
  }, [user?.location]);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleSaveRecommendation = (rec: CropRecommendation) => {
    setSavedRecommendations(prev => [rec, ...prev.filter(r => r.id !== rec.id)]);
  };

  const handleSaveScan = (scan: DiseaseScan) => {
    setDiseaseScans(prev => [scan, ...prev.filter(s => s.id !== scan.id)]);
  };

  return (
    <div className={`min-h-screen bg-stone-100 text-stone-900 font-sans antialiased ${
      isLargeText ? 'text-lg sm:text-xl' : 'text-base'
    }`}>
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        language={language}
        setLanguage={setLanguage}
        isLargeText={isLargeText}
        setIsLargeText={setIsLargeText}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={() => setUser(null)}
        alerts={alerts}
      />

      {/* Main Body View Switching */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        {currentTab === 'home' && (
          <div className="space-y-12">
            <HeroSection
              onGetStarted={() => setCurrentTab('dashboard')}
              onExploreFeatures={() => {
                const el = document.getElementById('features-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else setCurrentTab('dashboard');
              }}
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
            onUpdateUser={(updated) => setUser(updated)}
            onLogout={() => { setUser(null); setCurrentTab('home'); }}
            language={language}
            setLanguage={setLanguage}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-emerald-950 text-emerald-200 border-t border-emerald-800/80 py-10 mt-12 mb-12 lg:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 font-extrabold text-white text-sm">
            <span>🌱 FarmEase Digital Assistant</span>
          </div>
          <p className="text-emerald-300/80 text-center sm:text-right">
            Empowering farmers with AI crop recommendations, plant pathology diagnostics, and weather intelligence.
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
