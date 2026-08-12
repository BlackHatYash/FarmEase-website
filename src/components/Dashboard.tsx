import React from 'react';
import { Sprout, Stethoscope, CloudSun, BarChart3, AlertTriangle, ArrowRight, ShieldCheck, Thermometer, Droplets, Wind, CloudRain, Clock, Plus, Activity } from 'lucide-react';
import { FarmerProfile, WeatherData, CropRecommendation, DiseaseScan, Language } from '../types';
import { translations } from '../lib/translations';
import { VoiceAssistant } from './VoiceAssistant';

interface DashboardProps {
  user: FarmerProfile | null;
  weather: WeatherData | null;
  savedRecommendations: CropRecommendation[];
  diseaseScans: DiseaseScan[];
  onNavigate: (tabId: string) => void;
  language: Language;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  weather,
  savedRecommendations,
  diseaseScans,
  onNavigate,
  language
}) => {
  const t = translations[language] || translations.en;

  // Time based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.goodMorning : hour < 18 ? t.goodAfternoon : t.goodEvening;
  const farmerName = user ? user.name : 'Farmer';

  const overviewSpeech = `${greeting}, ${farmerName}! Your farm health score is 88 percent - Excellent. Current weather in ${weather?.location || 'your area'} is ${weather?.currentTemp || 29} degrees Celsius with ${weather?.condition || 'Partly Cloudy'}. ${weather?.farmingAdvice?.irrigation || ''}`;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/80 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <Sprout className="w-64 h-64 text-emerald-300" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-bold border border-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Location: {user?.location || weather?.location || 'Punjab, India'} ({user?.farmSize || 5} {user?.farmSizeUnit || 'acres'})
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{greeting}, {farmerName}!</span>
              <span className="text-2xl sm:text-3xl">🌾</span>
            </h1>

            <p className="text-emerald-100 text-xs sm:text-sm max-w-xl leading-relaxed">
              Here is your daily agricultural briefing. AI model active & monitoring soil moisture, crop disease risks, and local weather patterns.
            </p>

            <div className="pt-2">
              <VoiceAssistant textToRead={overviewSpeech} language={language} size="sm" />
            </div>
          </div>

          {/* Farm Health Gauge Widget */}
          <div className="bg-emerald-950/80 border border-emerald-700/80 rounded-2xl p-4 sm:p-5 flex items-center gap-5 shrink-0 shadow-inner">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-emerald-900"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400"
                  strokeDasharray="88, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-white leading-none">88%</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                {t.farmHealthScore}
              </div>
              <div className="text-lg font-black text-white flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>{t.excellent}</span>
              </div>
              <div className="text-[11px] text-emerald-200">Optimal Soil Nitrogen & Moisture</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="space-y-3">
        <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-700" />
          <span>{t.quickActions}</span>
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => onNavigate('crop-recommendation')}
            className="group bg-gradient-to-br from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all text-left flex flex-col justify-between h-32 border border-emerald-500 cursor-pointer transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-extrabold leading-tight">
                {t.recommendCropBtn}
              </div>
              <div className="text-[11px] text-emerald-100 mt-0.5">Match soil & pH</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('disease-detection')}
            className="group bg-gradient-to-br from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all text-left flex flex-col justify-between h-32 border border-amber-500 cursor-pointer transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-amber-200 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-extrabold leading-tight">
                {t.detectDiseaseBtn}
              </div>
              <div className="text-[11px] text-amber-100 mt-0.5">Scan leaf photo</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('weather')}
            className="group bg-gradient-to-br from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all text-left flex flex-col justify-between h-32 border border-sky-500 cursor-pointer transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <CloudSun className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-sky-200 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-extrabold leading-tight">
                {t.checkWeatherBtn}
              </div>
              <div className="text-[11px] text-sky-100 mt-0.5">Rain & spray advice</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('farm-insights')}
            className="group bg-gradient-to-br from-stone-800 to-stone-900 hover:from-stone-900 hover:to-black text-white p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all text-left flex flex-col justify-between h-32 border border-stone-700 cursor-pointer transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-emerald-400" />
              </div>
              <ArrowRight className="w-4 h-4 text-stone-300 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-extrabold leading-tight">
                {t.viewInsightsBtn}
              </div>
              <div className="text-[11px] text-stone-300 mt-0.5">Yield & soil trends</div>
            </div>
          </button>
        </div>
      </div>

      {/* Weather Overview & 7-Day Forecast Card */}
      {weather && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-sky-100 text-sky-700">
                <CloudSun className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-stone-900">
                  Current Weather & Agricultural Advisory
                </h3>
                <p className="text-xs font-semibold text-stone-500">
                  Location: {weather.location}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('weather')}
              className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              <span>Full Weather Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Current Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80">
              <div className="text-xs text-stone-500 font-semibold flex items-center gap-1.5 mb-1">
                <Thermometer className="w-4 h-4 text-amber-600" /> Temperature
              </div>
              <div className="text-2xl font-black text-stone-900">{weather.currentTemp}°C</div>
              <div className="text-[11px] text-stone-500">Feels like {weather.feelsLike}°C</div>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80">
              <div className="text-xs text-stone-500 font-semibold flex items-center gap-1.5 mb-1">
                <Droplets className="w-4 h-4 text-sky-600" /> Humidity
              </div>
              <div className="text-2xl font-black text-stone-900">{weather.humidity}%</div>
              <div className="text-[11px] text-stone-500">Soil moisture: {weather.soilMoisture}%</div>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80">
              <div className="text-xs text-stone-500 font-semibold flex items-center gap-1.5 mb-1">
                <CloudRain className="w-4 h-4 text-blue-600" /> Rain Chance
              </div>
              <div className="text-2xl font-black text-stone-900">{weather.rainfallProbability}%</div>
              <div className="text-[11px] text-stone-500">Afternoon scattered showers</div>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80">
              <div className="text-xs text-stone-500 font-semibold flex items-center gap-1.5 mb-1">
                <Wind className="w-4 h-4 text-teal-600" /> Wind Speed
              </div>
              <div className="text-2xl font-black text-stone-900">{weather.windSpeed} km/h</div>
              <div className="text-[11px] text-emerald-700 font-semibold">Suitable for spraying</div>
            </div>
          </div>

          {/* Quick Advisory Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-start gap-3">
            <span className="text-base">💡</span>
            <div className="space-y-1">
              <span className="font-bold">Farming Advisory: </span>
              <span>{weather.farmingAdvice.irrigation} {weather.farmingAdvice.spraying}</span>
            </div>
          </div>

          {/* 7-Day Forecast Mini Cards */}
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-stone-500 mb-2">
              7-Day Forecast
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {weather.forecast.map((day, i) => (
                <div key={i} className="bg-stone-50 rounded-xl p-2.5 text-center border border-stone-200/80">
                  <div className="text-xs font-bold text-stone-800">{day.day}</div>
                  <div className="text-[10px] text-stone-500">{day.date}</div>
                  <div className="my-1 text-base">🌤️</div>
                  <div className="text-xs font-black text-stone-900">{day.tempMax}° / {day.tempMin}°</div>
                  <div className="text-[10px] font-semibold text-sky-700 mt-0.5">🌧️ {day.rainfallProbability}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid: Recent Disease Scans & Saved Crop Recommendations */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Disease Scans */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-amber-600" />
              <span>{t.recentScans}</span>
            </h3>
            <button
              onClick={() => onNavigate('disease-detection')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
            >
              Scan New Image
            </button>
          </div>

          {diseaseScans.length === 0 ? (
            <div className="bg-stone-50 rounded-2xl p-6 text-center border border-dashed border-stone-300 space-y-2">
              <div className="text-2xl">🍃</div>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t.noScansYet}
              </p>

              <button
                onClick={() => onNavigate('disease-detection')}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Leaf Image</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {diseaseScans.map((scan) => (
                <div key={scan.id} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-4">
                  <img
                    src={scan.imageUrl}
                    alt={scan.diseaseName}
                    className="w-14 h-14 rounded-xl object-cover border border-stone-300 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 truncate">
                        {scan.diseaseName}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 shrink-0">
                        {scan.confidence}% Confidence
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 truncate mt-0.5">
                      Symptoms: {scan.visibleSymptoms?.[0]}
                    </p>
                    <div className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Scanned on {new Date(scan.scannedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Crop Recommendations */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-600" />
              <span>{t.recommendedCrops}</span>
            </h3>
            <button
              onClick={() => onNavigate('crop-recommendation')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              Get New Match
            </button>
          </div>

          {savedRecommendations.length === 0 ? (
            <div className="bg-stone-50 rounded-2xl p-6 text-center border border-dashed border-stone-300 space-y-2">
              <div className="text-2xl">🌱</div>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t.noCropsYet}
              </p>

              <button
                onClick={() => onNavigate('crop-recommendation')}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Calculate Crop Match</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {savedRecommendations.map((crop) => (
                <div key={crop.id} className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-emerald-950 text-sm">
                        {crop.cropName}
                      </h4>
                      <div className="text-xs text-emerald-700 font-medium">
                        Expected Yield: {crop.expectedYield} • Duration: {crop.growingDuration}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-700 text-white font-black text-xs shadow-xs">
                      {crop.suitabilityScore}% Match
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 italic">
                    "{crop.aiExplanation}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
