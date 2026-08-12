import React from 'react';
import { FileEdit, UploadCloud, CheckCircle2, ArrowRight } from 'lucide-react';
import { Language } from '../types';

interface HowItWorksProps {
  onStartProcess: () => void;
  language: Language;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartProcess }) => {
  const steps = [
    {
      number: '1',
      title: 'Enter Farm Details',
      description: 'Fill in basic info like your location, soil type, pH level, water source, and farm size.',
      icon: FileEdit,
      color: 'bg-emerald-600 text-white'
    },
    {
      number: '2',
      title: 'Upload Leaf Image or Weather Check',
      description: 'Snap a leaf photo to diagnose diseases or review live rainfall & temperature forecasts.',
      icon: UploadCloud,
      color: 'bg-amber-500 text-amber-950'
    },
    {
      number: '3',
      title: 'Receive AI Recommendations',
      description: 'Get instant suitability scores, treatment guidelines, yield forecasts, and voice audio guidance.',
      icon: CheckCircle2,
      color: 'bg-green-700 text-white'
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Simple 3-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight mt-3">
            How FarmEase Works
          </h2>
          <p className="text-stone-600 text-base mt-2">
            Designed for quick, effortless operation right from your smartphone or tablet in the field.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative bg-stone-50 rounded-2xl p-6 sm:p-8 border border-stone-200 flex flex-col items-center text-center hover:bg-emerald-50/50 hover:border-emerald-300 transition-all group"
              >
                {/* Step Number Badge */}
                <div className="absolute -top-4 left-6 px-3 py-1 rounded-lg bg-emerald-900 text-amber-300 font-extrabold text-xs shadow-md">
                  Step 0{step.number}
                </div>

                <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center shadow-lg my-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-extrabold text-stone-900 mb-2">
                  {step.title}
                </h3>

                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                  {step.description}
                </p>

                {idx < 2 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-stone-300">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={onStartProcess}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg transition-all cursor-pointer"
          >
            <span>Try FarmEase Assistant Now</span>
            <ArrowRight className="w-5 h-5 text-amber-300" />
          </button>
        </div>
      </div>
    </section>
  );
};
