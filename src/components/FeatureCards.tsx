import React from 'react';
import { Sprout, Stethoscope, CloudSun, BarChart3, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../lib/translations';

interface FeatureCardsProps {
  onSelectFeature: (tabId: string) => void;
  language: Language;
}

export const FeatureCards: React.FC<FeatureCardsProps> = ({ onSelectFeature, language }) => {
  const t = translations[language] || translations.en;

  const features = [
    {
      id: 'crop-recommendation',
      title: '🌱 AI Crop Recommendation',
      subtitle: 'Soil & Climate Matched Selection',
      description: 'Enter your soil type, pH, location, and irrigation to receive personalized crop matches complete with yield projections, duration, and care tips.',
      tag: 'Smart Selection',
      color: 'from-emerald-600 to-green-700',
      badgeBg: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'disease-detection',
      title: '📷 Plant Disease Detection',
      subtitle: 'Instant Leaf Image Diagnostics',
      description: 'Upload a leaf photo or capture with your smartphone camera. Our AI identifies diseases, symptoms, causes, and recommended treatments in seconds.',
      tag: '94% Accuracy',
      color: 'from-amber-600 to-orange-700',
      badgeBg: 'bg-amber-100 text-amber-900'
    },
    {
      id: 'weather',
      title: '🌦️ Real-Time Weather Intelligence',
      subtitle: 'Farming-Specific Microclimate Advice',
      description: 'Get precise temperature, humidity, rainfall probability, and 7-day forecasts along with actionable advice for irrigation, spraying, and disease risk.',
      tag: 'Live Forecast',
      color: 'from-sky-600 to-blue-700',
      badgeBg: 'bg-sky-100 text-sky-900'
    },
    {
      id: 'farm-insights',
      title: '📊 Smart Farm Insights',
      subtitle: 'Data-Driven Yield & Moisture Analytics',
      description: 'Monitor your farm health score, track soil moisture trends over time, review disease scan history, and optimize your irrigation schedules.',
      tag: 'Analytics',
      color: 'from-teal-600 to-emerald-800',
      badgeBg: 'bg-teal-100 text-teal-900'
    }
  ];

  return (
    <section className="py-16 sm:py-24 bg-stone-50 border-y border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Key Modules
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Complete AI Suite Built for Farmers
          </h2>
          <p className="text-stone-600 text-base sm:text-lg">
            Empower your farm with intelligent tools designed for practical, daily decision-making in the field.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectFeature(item.id)}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border border-stone-200/80 hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between transform hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.badgeBg}`}>
                    {item.tag}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-stone-100 group-hover:bg-emerald-600 group-hover:text-white text-stone-600 flex items-center justify-center transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-stone-900 group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>

                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-stone-100 flex items-center text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                <span>Explore Module</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
