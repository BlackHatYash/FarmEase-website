import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Droplet, ShieldAlert, CheckCircle2, Calendar, Sparkles } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, Legend } from 'recharts';
import { FarmAnalyticsData, Language } from '../types';
import { fetchFarmAnalytics } from '../services/api';
import { VoiceAssistant } from './VoiceAssistant';

interface FarmInsightsViewProps {
  language: Language;
}

export const FarmInsightsView: React.FC<FarmInsightsViewProps> = ({ language }) => {
  const [data, setData] = useState<FarmAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchFarmAnalytics()
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500 font-semibold">Loading farm insights & analytics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900 text-emerald-300 text-xs font-bold border border-emerald-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Precision Farm Analytics
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Smart Farm Insights & Performance
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm max-w-xl">
              Track soil moisture trends, crop yield estimations vs targets, disease risk distributions, and automated irrigation schedules.
            </p>
          </div>

          <VoiceAssistant
            textToRead={`Farm health score is ${data.farmHealthScore} percent. Soil health index is ${data.soilHealthIndex} percent. Yield targets are on track for paddy, wheat, and maize.`}
            language={language}
          />
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="text-xs font-extrabold text-stone-500 uppercase">Farm Health Score</div>
          <div className="text-3xl font-black text-emerald-600">{data.farmHealthScore}%</div>
          <div className="w-full bg-stone-100 rounded-full h-2">
            <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${data.farmHealthScore}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="text-xs font-extrabold text-stone-500 uppercase">Soil Health Index</div>
          <div className="text-3xl font-black text-emerald-700">{data.soilHealthIndex}%</div>
          <div className="w-full bg-stone-100 rounded-full h-2">
            <div className="bg-emerald-700 h-2 rounded-full" style={{ width: `${data.soilHealthIndex}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="text-xs font-extrabold text-stone-500 uppercase">Est. Overall Yield</div>
          <div className="text-3xl font-black text-amber-600">15.3 Tons</div>
          <div className="text-[11px] font-bold text-emerald-700">+4% above target</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="text-xs font-extrabold text-stone-500 uppercase">Irrigation Efficiency</div>
          <div className="text-3xl font-black text-sky-600">94%</div>
          <div className="text-[11px] text-stone-500 font-semibold">Smart Drip Timer Active</div>
        </div>
      </div>

      {/* Chart 1: Soil Moisture & Rainfall Trend */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-stone-900">
              Weekly Soil Moisture & Humidity Trends
            </h3>
            <p className="text-xs text-stone-500">
              Monitored via IoT sensors & satellite rainfall data
            </p>
          </div>
          <span className="text-xs font-bold text-sky-800 bg-sky-100 px-3 py-1 rounded-full">
            Live Stream
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.humidityMoistureTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="moistureGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="humidityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="soilMoisture" name="Soil Moisture (%)" stroke="#10b981" fillOpacity={1} fill="url(#moistureGrad)" />
              <Area type="monotone" dataKey="humidity" name="Air Humidity (%)" stroke="#0284c7" fillOpacity={1} fill="url(#humidityGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Yield Projections vs Targets */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200 space-y-4">
          <h3 className="text-lg font-black text-stone-900">
            Estimated Yield vs Target Projections
          </h3>
          <p className="text-xs text-stone-500">
            Comparison in tons / hectare across active crops
          </p>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.yieldProjections} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="crop" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="target" name="Target Yield" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="estimated" name="AI Est. Yield" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disease Risk Map */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200 space-y-4">
          <h3 className="text-lg font-black text-stone-900">
            Crop Disease Risk Index
          </h3>
          <p className="text-xs text-stone-500">
            Current pathogen threat matrix
          </p>

          <div className="space-y-3 pt-2">
            {data.diseaseRiskMap.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-stone-900">{item.crop}</div>
                  <div className="text-[11px] text-stone-500">Primary threat: {item.primaryRisk}</div>
                </div>

                <span className={`text-xs font-black px-3 py-1 rounded-full ${
                  item.riskLevel === 'High'
                    ? 'bg-red-100 text-red-800'
                    : item.riskLevel === 'Moderate'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {item.riskLevel} Risk
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scheduled Farm Activity Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200 space-y-4">
        <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-700" />
          <span>Automated Farm Activity Log</span>
        </h3>

        <div className="space-y-3">
          {data.recentActivities.map((act) => (
            <div key={act.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  act.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
                }`} />
                <div>
                  <div className="text-xs font-extrabold text-stone-900">{act.title}</div>
                  <div className="text-[10px] text-stone-500">{act.date}</div>
                </div>
              </div>

              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                act.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
              }`}>
                {act.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
