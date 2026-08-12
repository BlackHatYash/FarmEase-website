import React, { useState } from 'react';
import { Sprout, Sparkles, CheckCircle, AlertCircle, Save, Loader2, Thermometer, Droplet, Layers, MapPin, Calendar, Ruler, History, Info } from 'lucide-react';
import { CropInput, CropRecommendation, Language } from '../types';
import { translations } from '../lib/translations';
import { fetchCropRecommendation } from '../services/api';
import { VoiceAssistant } from './VoiceAssistant';

interface CropRecommendationViewProps {
  onSaveRecommendation: (rec: CropRecommendation) => void;
  language: Language;
  defaultLocation?: string;
  defaultFarmSize?: number;
}

export const CropRecommendationView: React.FC<CropRecommendationViewProps> = ({
  onSaveRecommendation,
  language,
  defaultLocation = 'Mumbai, Maharashtra',
  defaultFarmSize = 2.5
}) => {
  const t = translations[language] || translations.en;

  const [formData, setFormData] = useState<CropInput>({
    location: defaultLocation,
    soilType: 'Loamy',
    soilPh: 6.5,
    waterAvailability: 'medium',
    temperature: 28,
    season: 'kharif',
    farmSize: defaultFarmSize,
    previousCrop: 'Wheat'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ isLiveAi: boolean; data: CropRecommendation } | null>(null);
  const [saved, setSaved] = useState(false);

  const handleVoiceInput = (field: keyof CropInput) => (transcript: string) => {
    setFormData(prev => ({ ...prev, [field]: transcript }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const rec = await fetchCropRecommendation(formData);
      setResult(rec);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (result) {
      onSaveRecommendation(result.data);
      setSaved(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-green-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-emerald-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> AI Agronomy Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {t.cropRecommendation}
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
              Enter your soil composition, climate, water availability, and field location to generate optimal AI crop matches.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Input Form Column */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200 space-y-6">
          <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-700" />
            <span>Farm & Soil Conditions</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Location & Farm Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Location / Region
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Punjab, Maharashtra"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5 text-emerald-600" /> Farm Size (acres)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  required
                  value={formData.farmSize}
                  onChange={(e) => setFormData({ ...formData, farmSize: parseFloat(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Soil Type & pH */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Soil Type
                </label>
                <select
                  value={formData.soilType}
                  onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="Loamy">Loamy Soil</option>
                  <option value="Alluvial">Alluvial Soil</option>
                  <option value="Black">Black Cotton Soil</option>
                  <option value="Red">Red Soil</option>
                  <option value="Clay">Clay Soil</option>
                  <option value="Sandy">Sandy Soil</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700">
                    Soil pH Level: <span className="text-emerald-700 font-extrabold">{formData.soilPh}</span>
                  </label>
                  <span className="text-[10px] text-stone-500">
                    {formData.soilPh < 6 ? 'Acidic' : formData.soilPh > 7.5 ? 'Alkaline' : 'Neutral'}
                  </span>
                </div>
                <input
                  type="range"
                  min="4.5"
                  max="9.0"
                  step="0.1"
                  value={formData.soilPh}
                  onChange={(e) => setFormData({ ...formData, soilPh: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Water & Temperature */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5 text-sky-600" /> Water Availability
                </label>
                <select
                  value={formData.waterAvailability}
                  onChange={(e) => setFormData({ ...formData, waterAvailability: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="low">Low (Rainfed / Arid)</option>
                  <option value="medium">Medium (Canal / Rainfed)</option>
                  <option value="high">High (Abundant Rainfall)</option>
                  <option value="irrigated">Irrigated (Borewell / Drip)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-600" /> Temperature (°C)
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  required
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseInt(e.target.value) || 28 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Season & Previous Crop */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Sowing Season
                </label>
                <select
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="kharif">Kharif (Monsoon June-Oct)</option>
                  <option value="rabi">Rabi (Winter Oct-March)</option>
                  <option value="zaid">Zaid (Summer March-June)</option>
                  <option value="year-round">Year-round Sowing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-stone-600" /> Previous Crop
                </label>
                <input
                  type="text"
                  value={formData.previousCrop}
                  onChange={(e) => setFormData({ ...formData, previousCrop: e.target.value })}
                  placeholder="e.g. Wheat, Pulses"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Voice Dictation Helper */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-stone-500">Need hands-free speech input?</span>
              <VoiceAssistant
                onVoiceInput={handleVoiceInput('location')}
                language={language}
                size="sm"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-extrabold text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Calculating Crop Suitability...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>{t.getAiRecommendation}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Recommendation Card Column */}
        <div className="lg:col-span-6 space-y-6">
          {!result && !loading && (
            <div className="bg-stone-50 rounded-3xl p-10 text-center border border-dashed border-stone-300 space-y-3">
              <div className="text-4xl">🌾</div>
              <h3 className="text-lg font-bold text-stone-800">
                Ready to Analyze Your Farm
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                Click <strong>"{t.getAiRecommendation}"</strong> to view exact crop suitability, yield forecasts, and profit estimates based on your parameters.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-3xl p-10 text-center border border-emerald-200 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
                <Sprout className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-emerald-950">
                Evaluating Soil Nutrients & Climate Data...
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                FarmEase AI is analyzing nitrogen balance, pH tolerance, and expected rainfall patterns.
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-emerald-300 space-y-6 animate-in fade-in slide-in-from-bottom-3">
              {/* Card Title & AI Indicator */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Top AI Match
                  </span>
                  <h3 className="text-2xl font-black text-stone-900 mt-1">
                    Recommended Crop: <span className="text-emerald-700">{result.data.cropName}</span>
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black text-emerald-600">
                    {result.data.suitabilityScore}%
                  </div>
                  <div className="text-[10px] font-bold text-stone-500">Suitability Index</div>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50/80 rounded-2xl p-3.5 border border-emerald-200/80">
                  <div className="text-[11px] text-emerald-800 font-bold uppercase">Expected Yield</div>
                  <div className="text-base font-black text-emerald-950 mt-0.5">{result.data.expectedYield}</div>
                </div>

                <div className="bg-emerald-50/80 rounded-2xl p-3.5 border border-emerald-200/80">
                  <div className="text-[11px] text-emerald-800 font-bold uppercase">Growing Duration</div>
                  <div className="text-base font-black text-emerald-950 mt-0.5">{result.data.growingDuration}</div>
                </div>

                <div className="bg-emerald-50/80 rounded-2xl p-3.5 border border-emerald-200/80">
                  <div className="text-[11px] text-emerald-800 font-bold uppercase">Water Requirement</div>
                  <div className="text-base font-black text-emerald-950 mt-0.5">{result.data.waterRequirement}</div>
                </div>

                <div className="bg-emerald-50/80 rounded-2xl p-3.5 border border-emerald-200/80">
                  <div className="text-[11px] text-emerald-800 font-bold uppercase">Est. Profitability</div>
                  <div className="text-base font-black text-emerald-950 mt-0.5">{result.data.estimatedProfitability}</div>
                </div>
              </div>

              {/* Recommended Planting Period */}
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <span className="font-bold">Recommended Planting Window:</span>
                <span className="font-extrabold bg-amber-200 px-2.5 py-1 rounded-lg">{result.data.recommendedPlantingPeriod}</span>
              </div>

              {/* AI Explanation Box */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" /> AI Agronomist Reasoning
                </h4>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-200 italic">
                  "{result.data.aiExplanation}"
                </p>
              </div>

              {/* Practical Care Tips */}
              {result.data.keyCareTips && result.data.keyCareTips.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-700">
                    Practical Care Instructions
                  </h4>
                  <ul className="space-y-1.5">
                    {result.data.keyCareTips.map((tip, idx) => (
                      <li key={idx} className="text-xs text-stone-700 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                <VoiceAssistant
                  textToRead={`Recommended Crop: ${result.data.cropName}. Suitability index: ${result.data.suitabilityScore} percent. Expected yield: ${result.data.expectedYield}. Growing duration: ${result.data.growingDuration}. ${result.data.aiExplanation}`}
                  language={language}
                />

                <button
                  onClick={handleSave}
                  disabled={saved}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    saved
                      ? 'bg-stone-200 text-stone-600'
                      : 'bg-emerald-800 hover:bg-emerald-700 text-white shadow-md'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{saved ? 'Saved to Profile ✓' : 'Save Recommendation'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
