import React, { useState } from 'react';
import {
  Sprout,
  CheckCircle,
  Save,
  Loader2,
  Thermometer,
  Droplet,
  MapPin,
  Calendar,
  Minus,
  Plus,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
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

interface SoilOption {
  value: string;
  title: string;
  feel: string;
  swatchClass: string;
}

const SOIL_OPTIONS: SoilOption[] = [
  {
    value: 'Loamy',
    title: 'Loamy Soil',
    feel: 'Soft, dark & crumbly',
    swatchClass: 'bg-amber-900'
  },
  {
    value: 'Black',
    title: 'Black Cotton',
    feel: 'Deep black, holds water well',
    swatchClass: 'bg-stone-800'
  },
  {
    value: 'Alluvial',
    title: 'Alluvial / River',
    feel: 'Fine river silt, very fertile',
    swatchClass: 'bg-amber-700'
  },
  {
    value: 'Red',
    title: 'Red Soil',
    feel: 'Reddish, drains quickly',
    swatchClass: 'bg-red-700'
  },
  {
    value: 'Clay',
    title: 'Clay / Heavy',
    feel: 'Sticky when wet, heavy',
    swatchClass: 'bg-stone-600'
  },
  {
    value: 'Sandy',
    title: 'Sandy / Loose',
    feel: 'Gritty, dries out fast',
    swatchClass: 'bg-amber-400'
  }
];

const WATER_OPTIONS: { value: CropInput['waterAvailability']; title: string; detail: string }[] = [
  { value: 'low', title: 'Rain Only', detail: 'Depends on monsoon rain' },
  { value: 'medium', title: 'Rain + Canal', detail: 'Moderate water supply' },
  { value: 'irrigated', title: 'Well / Drip', detail: 'Borewell or drip pipes' },
  { value: 'high', title: 'Plenty of Water', detail: 'River or heavy rainfall' }
];

const SEASON_OPTIONS: { value: CropInput['season']; title: string; months: string }[] = [
  { value: 'kharif', title: 'Monsoon (Kharif)', months: 'Jun – Oct' },
  { value: 'rabi', title: 'Winter (Rabi)', months: 'Oct – Mar' },
  { value: 'zaid', title: 'Summer (Zaid)', months: 'Mar – Jun' },
  { value: 'year-round', title: 'Any Time', months: 'Year-round' }
];

const PH_PRESETS: { label: string; hint: string; value: number }[] = [
  { label: 'Sour / Acidic', hint: 'Moss grows · pH 5.5', value: 5.5 },
  { label: 'Normal / Healthy', hint: 'Best for most crops · pH 6.5', value: 6.5 },
  { label: 'Salty / Chalky', hint: 'White salt crust · pH 8.0', value: 8.0 }
];

const PREVIOUS_CROPS = ['Wheat', 'Rice (Paddy)', 'Cotton', 'Pulses / Dal', 'Sugarcane', 'Fallow / Empty'];
const QUICK_REGIONS = ['Mumbai, Maharashtra', 'Nashik, Maharashtra', 'Pune, Maharashtra', 'Ludhiana, Punjab'];

const FARM_PRESETS: { label: string; input: CropInput }[] = [
  {
    label: 'Monsoon Farm (Maharashtra)',
    input: {
      location: 'Nashik, Maharashtra',
      soilType: 'Black',
      soilPh: 6.8,
      waterAvailability: 'medium',
      temperature: 28,
      season: 'kharif',
      farmSize: 3,
      previousCrop: 'Pulses / Dal'
    }
  },
  {
    label: 'Irrigated Farm (Punjab)',
    input: {
      location: 'Ludhiana, Punjab',
      soilType: 'Alluvial',
      soilPh: 6.6,
      waterAvailability: 'irrigated',
      temperature: 29,
      season: 'kharif',
      farmSize: 5,
      previousCrop: 'Wheat'
    }
  },
  {
    label: 'Low-Water Dry Farm',
    input: {
      location: 'Solapur, Maharashtra',
      soilType: 'Sandy',
      soilPh: 7.0,
      waterAvailability: 'low',
      temperature: 34,
      season: 'kharif',
      farmSize: 2,
      previousCrop: 'Fallow / Empty'
    }
  }
];

function getWaterPlainHint(waterReq: CropRecommendation['waterRequirement']): string {
  switch (waterReq) {
    case 'Low':
      return 'Needs very little water · good for rainfed farms';
    case 'Medium':
      return 'Needs moderate watering once or twice a week';
    case 'High':
      return 'Needs regular irrigation or good monsoon rain';
    case 'Very High':
      return 'Needs steady standing water or frequent irrigation';
    default:
      return 'Regular field moisture needed';
  }
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

  const [showExactPh, setShowExactPh] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<{ isLiveAi: boolean; data: CropRecommendation } | null>(null);
  const [saved, setSaved] = useState(false);

  const handleVoiceInput = (field: keyof CropInput) => (transcript: string) => {
    setFormData(prev => ({ ...prev, [field]: transcript }));
  };

  const applyPreset = (presetInput: CropInput) => {
    setFormData(presetInput);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setErrorMsg(null);

    try {
      const rec = await fetchCropRecommendation(formData);
      setResult(rec);
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not check crops right now. Please try again.');
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

  const handleResetResult = () => {
    setResult(null);
    setSaved(false);
    setErrorMsg(null);
  };

  const selectedSeasonObj = SEASON_OPTIONS.find(s => s.value === formData.season) || SEASON_OPTIONS[0];
  const selectedWaterObj = WATER_OPTIONS.find(w => w.value === formData.waterAvailability) || WATER_OPTIONS[1];
  const selectedSoilObj = SOIL_OPTIONS.find(s => s.value === formData.soilType) || SOIL_OPTIONS[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Clean Page Header */}
      <div className="bg-emerald-900 text-white rounded-2xl p-6 sm:p-8 border border-emerald-800">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold text-emerald-300">
              Simple 4-Step Crop Guide · Local Soil & Weather Match
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {t.cropRecommendation}
            </h1>
            <p className="text-emerald-100 text-sm leading-relaxed">
              {t.cropRecSubtitle ||
                'Answer 4 quick questions about your land and water to see the best crop to grow, sowing dates, and easy care steps.'}
            </p>
          </div>

          {/* 1-Tap Farm Examples */}
          <div className="space-y-1.5 shrink-0">
            <div className="text-xs font-medium text-emerald-200">Quick fill examples:</div>
            <div className="flex flex-wrap gap-2">
              {FARM_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.input)}
                  className="px-3 py-2 min-h-[40px] rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-50 text-xs font-semibold border border-emerald-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left: Guided 4-Step Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 space-y-7"
        >
          {/* Step 1: Location & Land Size */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                1. Where is your field & how big is it?
              </h2>
              <VoiceAssistant
                onVoiceInput={handleVoiceInput('location')}
                language={language}
                size="sm"
              />
            </div>

            <div className="grid sm:grid-cols-12 gap-4">
              <div className="sm:col-span-7 space-y-2">
                <label className="block text-sm font-semibold text-stone-800">
                  Village, District, or State
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Type your city or district"
                    className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-xl border border-stone-300 text-stone-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {QUICK_REGIONS.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => setFormData({ ...formData, location: region })}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                        formData.location === region
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-semibold'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {region.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-5 space-y-2">
                <label className="block text-sm font-semibold text-stone-800">
                  Land Size (Acres)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease acres"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        farmSize: Math.max(0.5, Number((formData.farmSize - 0.5).toFixed(1)))
                      })
                    }
                    className="w-11 h-11 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-800 cursor-pointer shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={formData.farmSize}
                    onChange={(e) =>
                      setFormData({ ...formData, farmSize: parseFloat(e.target.value) || 1 })
                    }
                    className="w-full text-center font-bold tabular-nums px-2 py-2.5 min-h-[44px] rounded-xl border border-stone-300 text-stone-900 text-base focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Increase acres"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        farmSize: Number((formData.farmSize + 0.5).toFixed(1))
                      })
                    }
                    className="w-11 h-11 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-800 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-stone-500">Tap + or - to adjust acres</p>
              </div>
            </div>
          </section>

          <hr className="border-stone-200" />

          {/* Step 2: Soil Look & Feel */}
          <section className="space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                2. What does your soil look and feel like?
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Pick the soil that looks closest to your field.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SOIL_OPTIONS.map((soil) => {
                const active = formData.soilType === soil.value;
                return (
                  <button
                    key={soil.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, soilType: soil.value })}
                    className={`p-3 min-h-[68px] rounded-xl border text-left transition-colors cursor-pointer flex items-start gap-2.5 ${
                      active
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600'
                        : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full shrink-0 mt-0.5 border border-black/15 ${soil.swatchClass}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold leading-snug">{soil.title}</div>
                      <div className="text-[11px] text-stone-600 leading-snug mt-0.5">{soil.feel}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Plain-Language Soil pH / Condition */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-semibold text-stone-800">
                  Soil Nature (Acidic, Normal, or Salty)
                </label>
                <button
                  type="button"
                  onClick={() => setShowExactPh(!showExactPh)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Have a Soil Health Card?</span>
                  {showExactPh ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PH_PRESETS.map((preset) => {
                  const isSelected =
                    (preset.value < 6 && formData.soilPh < 6) ||
                    (preset.value >= 6 && preset.value <= 7.4 && formData.soilPh >= 6 && formData.soilPh <= 7.4) ||
                    (preset.value > 7.4 && formData.soilPh > 7.4);

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, soilPh: preset.value })}
                      className={`px-3 py-2.5 min-h-[44px] rounded-xl border text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600'
                          : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-bold">{preset.label}</div>
                      <div className="text-[11px] text-stone-600 tabular-nums">{preset.hint}</div>
                    </button>
                  );
                })}
              </div>

              {showExactPh && (
                <div className="pt-2 px-3 py-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                    <span>Exact Soil pH from Soil Test Card</span>
                    <span className="text-emerald-800 font-bold tabular-nums">pH {formData.soilPh}</span>
                  </div>
                  <input
                    type="range"
                    min="4.5"
                    max="9.0"
                    step="0.1"
                    value={formData.soilPh}
                    onChange={(e) => setFormData({ ...formData, soilPh: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </section>

          <hr className="border-stone-200" />

          {/* Step 3: Water, Season & Weather */}
          <section className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              3. Water source & planting season
            </h2>

            {/* Water Options */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-stone-800 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-sky-600" />
                <span>How do you water your crops?</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {WATER_OPTIONS.map((opt) => {
                  const active = formData.waterAvailability === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, waterAvailability: opt.value })}
                      className={`p-3 min-h-[56px] rounded-xl border text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600'
                          : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-bold">{opt.title}</div>
                      <div className="text-[11px] text-stone-600 mt-0.5">{opt.detail}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Season & Temperature */}
            <div className="grid sm:grid-cols-12 gap-4 pt-1">
              <div className="sm:col-span-7 space-y-2">
                <label className="block text-sm font-semibold text-stone-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>When will you plant?</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SEASON_OPTIONS.map((opt) => {
                    const active = formData.season === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, season: opt.value })}
                        className={`px-3 py-2.5 min-h-[48px] rounded-xl border text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600'
                            : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-800'
                        }`}
                      >
                        <div className="text-xs font-bold">{opt.title}</div>
                        <div className="text-[11px] text-stone-600 tabular-nums">{opt.months}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="sm:col-span-5 space-y-2">
                <label className="block text-sm font-semibold text-stone-800 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-amber-600" />
                  <span>Usual Weather</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Cool', temp: 18 },
                    { label: 'Warm', temp: 28 },
                    { label: 'Hot', temp: 36 }
                  ].map((w) => {
                    const active = Math.abs(formData.temperature - w.temp) <= 3;
                    return (
                      <button
                        key={w.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, temperature: w.temp })}
                        className={`py-2 px-1 min-h-[48px] rounded-xl border text-center transition-colors cursor-pointer ${
                          active
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600'
                            : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-800'
                        }`}
                      >
                        <div className="text-xs font-bold">{w.label}</div>
                        <div className="text-[11px] text-stone-600 tabular-nums">{w.temp}°C</div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-stone-600 pt-1">
                  <span>Exact temp:</span>
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Decrease temperature"
                      onClick={() =>
                        setFormData({ ...formData, temperature: Math.max(5, formData.temperature - 1) })
                      }
                      className="w-7 h-7 rounded-md border border-stone-300 bg-stone-50 hover:bg-stone-100 flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-stone-900 tabular-nums w-10 text-center">
                      {formData.temperature}°C
                    </span>
                    <button
                      type="button"
                      aria-label="Increase temperature"
                      onClick={() =>
                        setFormData({ ...formData, temperature: Math.min(50, formData.temperature + 1) })
                      }
                      className="w-7 h-7 rounded-md border border-stone-300 bg-stone-50 hover:bg-stone-100 flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-stone-200" />

          {/* Step 4: Last Crop Grown */}
          <section className="space-y-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                4. What did you grow on this land last time?
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Changing crops each season keeps your soil rich and reduces pests.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {PREVIOUS_CROPS.map((crop) => {
                const active = formData.previousCrop.toLowerCase() === crop.toLowerCase();
                return (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => setFormData({ ...formData, previousCrop: crop })}
                    className={`px-3.5 py-2 min-h-[40px] rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-emerald-700 border-emerald-700 text-white'
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-800'
                    }`}
                  >
                    {crop}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={formData.previousCrop}
              onChange={(e) => setFormData({ ...formData, previousCrop: e.target.value })}
              placeholder="Or type another crop name (e.g. Tomato, Onion, Maize)"
              className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-stone-300 text-stone-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </section>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 min-h-[52px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Finding the best crop for your farm...</span>
              </>
            ) : (
              <>
                <Sprout className="w-5 h-5" />
                <span>{t.getAiRecommendation}</span>
              </>
            )}
          </button>
        </form>

        {/* Right: Simple Farmer-Friendly Result Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{errorMsg}</div>
            </div>
          )}

          {!result && !loading && (
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200 space-y-5">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-emerald-700">Your Farm Summary</p>
                <h3 className="text-xl font-bold text-stone-900">Ready to check the best crop</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Review your choices below, then tap <strong>"{t.getAiRecommendation}"</strong> to see your crop plan.
                </p>
              </div>

              <dl className="divide-y divide-stone-200 border-y border-stone-200 text-sm">
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-stone-500">Location</dt>
                  <dd className="font-semibold text-stone-900 text-right">{formData.location || 'Not set'}</dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-stone-500">Land Size</dt>
                  <dd className="font-semibold text-stone-900 tabular-nums">{formData.farmSize} acres</dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-stone-500">Soil Type</dt>
                  <dd className="font-semibold text-stone-900">{selectedSoilObj.title}</dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-stone-500">Water Supply</dt>
                  <dd className="font-semibold text-stone-900">{selectedWaterObj.title}</dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-stone-500">Planting Season</dt>
                  <dd className="font-semibold text-stone-900">
                    {selectedSeasonObj.title} ({selectedSeasonObj.months})
                  </dd>
                </div>
              </dl>

              <div className="space-y-2 text-xs text-stone-600">
                <div className="font-semibold text-stone-800">What you will get:</div>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Best matching crop & sowing dates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Days to harvest, water needs & expected yield</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>3 easy care steps + audio read-aloud</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-stone-900">
                  Checking crops for your land...
                </h3>
                <p className="text-sm text-stone-600 max-w-xs mx-auto leading-relaxed">
                  Matching {selectedSoilObj.title.toLowerCase()}, {selectedWaterObj.title.toLowerCase()}, and {selectedSeasonObj.title.toLowerCase()} weather.
                </p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-emerald-300 space-y-6">
              {/* Top Result Header */}
              <div className="space-y-3 pb-5 border-b border-stone-200">
                <div className="flex items-center justify-between gap-3 text-xs text-stone-600">
                  <span className="font-semibold text-emerald-800">
                    Best Crop Match · <span className="tabular-nums">{result.data.suitabilityScore}%</span> Fit for Your Land
                  </span>
                  <button
                    type="button"
                    onClick={handleResetResult}
                    className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                  {result.data.cropName}
                </h3>

                {/* Prominent Audio Read-Aloud */}
                <div>
                  <VoiceAssistant
                    textToRead={`Best crop for your farm: ${result.data.cropName}. Suitability is ${result.data.suitabilityScore} percent. Best time to sow: ${result.data.recommendedPlantingPeriod}. Ready to harvest in ${result.data.growingDuration}. Expected harvest: ${result.data.expectedYield}. ${result.data.aiExplanation} Steps to follow: ${(result.data.keyCareTips || []).join('. ')}`}
                    language={language}
                  />
                </div>
              </div>

              {/* 4 Plain-Language Key Facts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-xs font-medium text-stone-600">Best Time to Sow</div>
                  <div className="text-sm sm:text-base font-bold text-stone-900 mt-1 tabular-nums">
                    {result.data.recommendedPlantingPeriod}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-xs font-medium text-stone-600">Ready to Harvest</div>
                  <div className="text-sm sm:text-base font-bold text-stone-900 mt-1 tabular-nums">
                    {result.data.growingDuration}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-xs font-medium text-stone-600">Water Needed</div>
                  <div className="text-sm sm:text-base font-bold text-stone-900 mt-1">
                    {result.data.waterRequirement}
                  </div>
                  <div className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                    {getWaterPlainHint(result.data.waterRequirement)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-xs font-medium text-stone-600">Expected Harvest</div>
                  <div className="text-sm sm:text-base font-bold text-stone-900 mt-1 tabular-nums">
                    {result.data.expectedYield}
                  </div>
                  <div className="text-[11px] text-emerald-800 font-semibold mt-0.5 tabular-nums">
                    Est. Return: {result.data.estimatedProfitability}
                  </div>
                </div>
              </div>

              {/* Plain-English Why It Fits */}
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-stone-900">Why this fits your farm</h4>
                <p className="text-sm text-stone-700 leading-relaxed">
                  {result.data.aiExplanation}
                </p>
                {result.data.soilCompatibility && (
                  <p className="text-xs text-stone-600 leading-relaxed pt-1">
                    {result.data.soilCompatibility}
                  </p>
                )}
              </div>

              {/* Step-by-Step Care Checklist */}
              {result.data.keyCareTips && result.data.keyCareTips.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-stone-200">
                  <h4 className="text-sm font-bold text-stone-900">What to do step by step</h4>
                  <ol className="space-y-2.5">
                    {result.data.keyCareTips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-stone-800 flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Save Action */}
              <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saved}
                  className={`w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    saved
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{saved ? (t.savedToFarm || 'Saved to My Farm ✓') : (t.saveToFarm || 'Save to My Farm')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
