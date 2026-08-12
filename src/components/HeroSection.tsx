import React from 'react';
import { Sprout, ArrowRight, ShieldCheck, Cpu, CloudSun, Leaf, Sparkles, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../lib/translations';

interface HeroSectionProps {
  onGetStarted: () => void;
  onExploreFeatures: () => void;
  language: Language;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onGetStarted,
  onExploreFeatures,
  language
}) => {
  const t = translations[language] || translations.en;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-850 to-emerald-950 text-white pt-12 pb-20 lg:pt-20 lg:pb-28">
      {/* Background Subtle Leaf Patterns & Glows */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Text & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top AI Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-600/80 text-emerald-300 text-xs sm:text-sm font-semibold shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
              <span>Next-Gen Agricultural Intelligence Engine</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              {t.heroHeading || 'Smart Farming. Better Yields.'}
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-emerald-100/90 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {t.heroSubheading || 'FarmEase uses AI, weather intelligence, and image analysis to help you grow healthier crops and make smarter farming decisions.'}
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-emerald-950 font-extrabold text-lg shadow-xl hover:shadow-emerald-500/25 transform hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span>{t.getStarted}</span>
                <ArrowRight className="w-5 h-5 text-emerald-950" />
              </button>

              <button
                onClick={onExploreFeatures}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 font-semibold text-base border border-emerald-600/60 shadow-md transition-all cursor-pointer"
              >
                <span>{t.exploreFeatures}</span>
              </button>
            </div>

            {/* Trust Highlights */}
            <div className="pt-6 border-t border-emerald-800/60 grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-amber-300">95%+</div>
                <div className="text-xs sm:text-sm text-emerald-200">AI Diagnostic Accuracy</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-300">6 Languages</div>
                <div className="text-xs sm:text-sm text-emerald-200">Regional Voice Ready</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">24/7</div>
                <div className="text-xs sm:text-sm text-emerald-200">Weather & Pest Monitor</div>
              </div>
            </div>
          </div>

          {/* Right Visual Card Component */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none bg-gradient-to-b from-emerald-800/90 to-emerald-900/90 rounded-3xl p-6 border border-emerald-700/80 shadow-2xl backdrop-blur-md">
              {/* Illustrated Smart Farmer Header */}
              <div className="relative rounded-2xl overflow-hidden bg-emerald-950/80 border border-emerald-700 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-lg">
                      👨‍🌾
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">FarmEase Assistant</div>
                      <div className="text-xs text-emerald-300 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live Field Diagnostics
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-800 text-emerald-200">
                    AI Active
                  </span>
                </div>

                {/* Simulated Disease & Crop Card */}
                <div className="bg-emerald-900/90 rounded-xl p-3.5 border border-emerald-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-200 flex items-center gap-1">
                      <Leaf className="w-3.5 h-3.5 text-emerald-400" /> Plant Scan Analysis
                    </span>
                    <span className="text-amber-300 font-bold">94% Confidence</span>
                  </div>
                  <div className="text-sm font-bold text-white">Tomato Early Blight Detected</div>
                  <div className="text-xs text-emerald-200 leading-snug">
                    Action: Apply copper fungicide spray before 10 AM. Delay irrigation due to afternoon rain.
                  </div>
                </div>

                {/* Simulated Weather Widget */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-emerald-900/60 rounded-xl p-3 border border-emerald-800 flex items-center gap-3">
                    <CloudSun className="w-7 h-7 text-amber-300" />
                    <div>
                      <div className="text-xs text-emerald-300">Temp & Rain</div>
                      <div className="text-sm font-bold text-white">29°C • 35% Rain</div>
                    </div>
                  </div>
                  <div className="bg-emerald-900/60 rounded-xl p-3 border border-emerald-800 flex items-center gap-3">
                    <Cpu className="w-7 h-7 text-emerald-300" />
                    <div>
                      <div className="text-xs text-emerald-300">Best Crop</div>
                      <div className="text-sm font-bold text-white">Basmati Rice</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 sm:-left-6 bg-amber-400 text-amber-950 rounded-2xl p-3 shadow-xl border border-amber-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-amber-950" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">Farmer Friendly</div>
                  <div className="text-xs font-semibold">Voice & Regional Text Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
