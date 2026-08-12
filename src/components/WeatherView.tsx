import React, { useState } from 'react';
import { CloudSun, Search, MapPin, Thermometer, Droplet, Wind, CloudRain, Sun, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { WeatherData, Language } from '../types';
import { fetchWeatherData } from '../services/api';
import { VoiceAssistant } from './VoiceAssistant';

interface WeatherViewProps {
  initialWeather: WeatherData | null;
  language: Language;
}

export const WeatherView: React.FC<WeatherViewProps> = ({ initialWeather, language }) => {
  const [weather, setWeather] = useState<WeatherData | null>(initialWeather);
  const [searchQuery, setSearchQuery] = useState<string>(initialWeather?.location || 'Mumbai, Maharashtra');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await fetchWeatherData(searchQuery);
      setWeather(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!weather) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header with Location Search */}
      <div className="bg-gradient-to-r from-sky-900 via-blue-900 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-sky-700 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-800 text-sky-200 text-xs font-bold">
              <CloudSun className="w-3.5 h-3.5 text-amber-300" /> Real-Time Microclimate Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Weather Intelligence & Advisory
            </h1>
            <p className="text-sky-100 text-xs sm:text-sm">
              Actionable field guidance based on humidity, soil temperature, and 7-day precipitation forecasts.
            </p>
          </div>

          <VoiceAssistant
            textToRead={`Weather in ${weather.location}: Temperature is ${weather.currentTemp} degrees. Humidity ${weather.humidity} percent. Rain chance ${weather.rainfallProbability} percent. Irrigation advice: ${weather.farmingAdvice.irrigation}`}
            language={language}
          />
        </div>

        {/* Location Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md bg-white/10 p-1.5 rounded-2xl border border-white/20 backdrop-blur-md">
          <MapPin className="w-5 h-5 text-sky-300 ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter city or district name..."
            className="w-full bg-transparent text-white text-xs sm:text-sm placeholder-sky-200 focus:outline-none px-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-sky-950 font-bold text-xs shadow-md cursor-pointer shrink-0"
          >
            {loading ? 'Searching...' : 'Search Location'}
          </button>
        </form>
      </div>

      {/* Main Weather Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-amber-600" /> Temperature
          </div>
          <div className="text-3xl font-black text-stone-900">{weather.currentTemp}°C</div>
          <div className="text-xs text-stone-500 font-medium">Feels like {weather.feelsLike}°C</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
            <Droplet className="w-4 h-4 text-sky-600" /> Humidity & Soil
          </div>
          <div className="text-3xl font-black text-stone-900">{weather.humidity}%</div>
          <div className="text-xs text-emerald-700 font-bold">Soil Moisture: {weather.soilMoisture}%</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
            <CloudRain className="w-4 h-4 text-blue-600" /> Rain Probability
          </div>
          <div className="text-3xl font-black text-stone-900">{weather.rainfallProbability}%</div>
          <div className="text-xs text-blue-700 font-bold">Scattered Afternoon Rain</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
            <Wind className="w-4 h-4 text-teal-600" /> Wind Speed & UV
          </div>
          <div className="text-3xl font-black text-stone-900">{weather.windSpeed} km/h</div>
          <div className="text-xs text-amber-700 font-bold">UV Index: {weather.uvIndex} (Moderate)</div>
        </div>
      </div>

      {/* Clearly Separated AI Farming-Specific Recommendations */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-emerald-300 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
          <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
              AI Actionable Agricultural Guidance
            </div>
            <h3 className="text-xl font-black text-stone-900">
              Field Recommendations Derived from Weather Metrics
            </h3>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-emerald-50/90 rounded-2xl p-4 border border-emerald-200 space-y-1">
            <div className="text-xs font-extrabold text-emerald-950 flex items-center gap-2">
              <span>💧 Irrigation Advisory</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              "{weather.farmingAdvice.irrigation}"
            </p>
          </div>

          <div className="bg-emerald-50/90 rounded-2xl p-4 border border-emerald-200 space-y-1">
            <div className="text-xs font-extrabold text-emerald-950 flex items-center gap-2">
              <span>🌿 Spraying & Chemical Conditions</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              "{weather.farmingAdvice.spraying}"
            </p>
          </div>

          <div className="bg-amber-50/90 rounded-2xl p-4 border border-amber-200 space-y-1">
            <div className="text-xs font-extrabold text-amber-950 flex items-center gap-2">
              <span>🦠 Disease & Pest Risk Level</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              "{weather.farmingAdvice.diseaseRisk}"
            </p>
          </div>

          <div className="bg-emerald-50/90 rounded-2xl p-4 border border-emerald-200 space-y-1">
            <div className="text-xs font-extrabold text-emerald-950 flex items-center gap-2">
              <span>🌾 Harvesting & Field Work</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              "{weather.farmingAdvice.harvesting}"
            </p>
          </div>
        </div>
      </div>

      {/* Detailed 7-Day Forecast */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200 space-y-5">
        <h3 className="text-lg font-black text-stone-900">
          7-Day Detailed Forecast & Activity Guidance
        </h3>

        <div className="space-y-3">
          {weather.forecast.map((day, idx) => (
            <div
              key={idx}
              className="bg-stone-50 hover:bg-emerald-50/50 transition-colors p-4 rounded-2xl border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">🌤️</div>
                <div>
                  <div className="text-sm font-black text-stone-900">
                    {day.day} <span className="text-xs font-normal text-stone-500">({day.date})</span>
                  </div>
                  <div className="text-xs text-stone-600 font-medium">
                    {day.condition} • Rain chance: {day.rainfallProbability}% • Humidity: {day.humidity}%
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:border-l sm:border-stone-200 sm:pl-4">
                <div className="text-right">
                  <div className="text-sm font-black text-stone-900">
                    {day.tempMax}°C / {day.tempMin}°C
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold">
                    Wind: {day.windSpeed} km/h
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-auto text-xs font-medium text-emerald-900 bg-emerald-100/80 px-3 py-1.5 rounded-xl">
                💡 {day.agriculturalAdvice}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
