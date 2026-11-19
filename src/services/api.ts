import { CropInput, CropRecommendation, DiseaseScan, WeatherData, FarmAnalyticsData } from '../types';

export async function fetchCropRecommendation(input: CropInput): Promise<{ isLiveAi: boolean; data: CropRecommendation }> {
  try {
    const res = await fetch('/api/crop-recommendation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error('Failed to fetch recommendation');
    const json = await res.json();
    return { isLiveAi: json.isLiveAi ?? false, data: json.data };
  } catch (error) {
    console.warn('API error, using local fallback recommendation:', error);
    const soilKey = (input.soilType || 'loamy').toLowerCase();
    const fallbackBySoil: Record<string, { cropName: string; score: number; yield: string; duration: string; water: 'Low' | 'Medium' | 'High'; profit: string; period: string }> = {
      alluvial: { cropName: 'Basmati Rice (Paddy)', score: 94, yield: '4.8 tons / hectare', duration: '120–140 days', water: 'High', profit: '$2,100 / hectare', period: 'June – July' },
      black: { cropName: 'Cotton & Soybean', score: 91, yield: '2.5 tons / hectare', duration: '150–180 days', water: 'Medium', profit: '$1,950 / hectare', period: 'June – August' },
      red: { cropName: 'Groundnut & Pulses (Tur Dal)', score: 89, yield: '2.2 tons / hectare', duration: '105–120 days', water: 'Medium', profit: '$1,600 / hectare', period: 'May – July' },
      clay: { cropName: 'Wheat & Mustard', score: 92, yield: '4.2 tons / hectare', duration: '130–150 days', water: 'Medium', profit: '$1,750 / hectare', period: 'October – November' },
      sandy: { cropName: 'Pearl Millet (Bajra) & Sesame', score: 88, yield: '1.8 tons / hectare', duration: '80–90 days', water: 'Low', profit: '$1,200 / hectare', period: 'July – August' },
      loamy: { cropName: 'Maize (Corn) & Green Gram', score: 95, yield: '6.5 tons / hectare', duration: '100–110 days', water: 'Medium', profit: '$2,300 / hectare', period: 'June – July' }
    };
    const matchedKey = Object.keys(fallbackBySoil).find(k => soilKey.includes(k)) || 'loamy';
    const picked = fallbackBySoil[matchedKey];

    return {
      isLiveAi: false,
      data: {
        id: 'rec_fallback_' + Date.now(),
        cropName: picked.cropName,
        suitabilityScore: picked.score,
        expectedYield: picked.yield,
        growingDuration: picked.duration,
        waterRequirement: picked.water,
        estimatedProfitability: picked.profit,
        recommendedPlantingPeriod: picked.period,
        soilCompatibility: `Your ${input.soilType || 'Loamy'} soil works very well for ${picked.cropName}.`,
        aiExplanation: `For ${input.location || 'your farm'}, ${picked.cropName} grows reliably in ${input.soilType || 'Loamy'} soil with ${input.waterAvailability || 'medium'} water. Sowing this after ${input.previousCrop || 'your last crop'} also helps keep the soil healthy.`,
        keyCareTips: [
          `Prepare the soil smoothly and sow seeds during ${picked.period} for strong sprouting.`,
          `Water evenly during flowering and grain growth, and drain extra rainwater quickly.`,
          `Walk your field once a week to spot pests or leaf spots early.`
        ],
        createdAt: new Date().toISOString()
      }
    };
  }
}

export async function detectPlantDisease(imageBase64: string, cropHint?: string): Promise<{ isLiveAi: boolean; data: DiseaseScan }> {
  try {
    const res = await fetch('/api/detect-disease', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, cropHint })
    });
    if (!res.ok) throw new Error('Disease scan failed');
    const json = await res.json();
    return { isLiveAi: json.isLiveAi ?? false, data: json.data };
  } catch (error) {
    console.warn('Disease scan API fallback used:', error);
    return {
      isLiveAi: false,
      data: {
        id: 'scan_fallback_' + Date.now(),
        imageUrl: imageBase64,
        cropName: cropHint || 'Tomato',
        diseaseName: 'Tomato Early Blight (Alternaria solani)',
        confidence: 94,
        isHealthy: false,
        visibleSymptoms: [
          'Concentric brown rings on lower foliage',
          'Yellow halo around leaf necrotic lesions',
          'Accelerated leaf yellowing and dropping'
        ],
        possibleCauses: [
          'Fungal spore survival in crop debris from previous season',
          'High relative humidity (>80%) combined with temperatures of 24–28°C',
          'Splash transmission from irrigation or rainwater'
        ],
        recommendedTreatment: [
          'Prune affected bottom leaves and dispose of away from compost',
          'Apply Copper Hydroxide or Mancozeb fungicide spray early morning',
          'Switch to root-level drip irrigation rather than overhead sprinklers'
        ],
        preventionTips: [
          'Rotate crops with non-solanaceous varieties every 2-3 seasons',
          'Apply organic straw mulch around plant base',
          'Space plants at least 45 cm apart to ensure airflow'
        ],
        disclaimer: 'Disclaimer: AI results are informational. Please consult a agricultural specialist for severe crop issues.',
        scannedAt: new Date().toISOString()
      }
    };
  }
}

export async function fetchWeatherData(location: string = 'Mumbai, Maharashtra'): Promise<WeatherData> {
  try {
    const res = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
    if (!res.ok) throw new Error('Weather fetch failed');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('Weather API fallback used:', err);
    return {
      location,
      currentTemp: 29,
      feelsLike: 31,
      condition: 'Partly Cloudy',
      humidity: 68,
      rainfallProbability: 35,
      windSpeed: 12,
      uvIndex: 6,
      soilTemperature: 24,
      soilMoisture: 72,
      farmingAdvice: {
        irrigation: 'Slight delay recommended. 35% rain chance in afternoon.',
        spraying: 'Favorable morning conditions with wind speed <15 km/h.',
        diseaseRisk: 'Moderate fungal risk due to high air humidity (68%).',
        harvesting: 'Good field conditions expected over next 48 hours.'
      },
      forecast: [
        { day: 'Today', date: 'Aug 12', tempMax: 31, tempMin: 22, condition: 'Partly Cloudy', icon: 'sun-cloud', rainfallProbability: 35, humidity: 68, windSpeed: 12, agriculturalAdvice: 'Ideal for weeding and soil testing.' },
        { day: 'Wed', date: 'Aug 13', tempMax: 33, tempMin: 23, condition: 'Sunny', icon: 'sun', rainfallProbability: 10, humidity: 55, windSpeed: 10, agriculturalAdvice: 'Great day for field irrigation.' },
        { day: 'Thu', date: 'Aug 14', tempMax: 30, tempMin: 21, condition: 'Light Rain', icon: 'cloud-rain', rainfallProbability: 75, humidity: 82, windSpeed: 18, agriculturalAdvice: 'Delay spraying chemicals.' },
        { day: 'Fri', date: 'Aug 15', tempMax: 28, tempMin: 20, condition: 'Thunderstorm', icon: 'cloud-lightning', rainfallProbability: 85, humidity: 88, windSpeed: 22, agriculturalAdvice: 'High wind & rain risk.' },
        { day: 'Sat', date: 'Aug 16', tempMax: 29, tempMin: 21, condition: 'Clearing', icon: 'cloud-sun', rainfallProbability: 20, humidity: 70, windSpeed: 14, agriculturalAdvice: 'Inspect fields post-rain.' },
        { day: 'Sun', date: 'Aug 17', tempMax: 32, tempMin: 23, condition: 'Sunny', icon: 'sun', rainfallProbability: 5, humidity: 60, windSpeed: 11, agriculturalAdvice: 'Optimal for solar drying.' },
        { day: 'Mon', date: 'Aug 18', tempMax: 33, tempMin: 24, condition: 'Partly Cloudy', icon: 'sun-cloud', rainfallProbability: 15, humidity: 58, windSpeed: 9, agriculturalAdvice: 'Favorable for planting.' }
      ]
    };
  }
}

export async function fetchFarmAnalytics(): Promise<FarmAnalyticsData> {
  try {
    const res = await fetch('/api/farm-analytics');
    if (!res.ok) throw new Error('Analytics fetch failed');
    const json = await res.json();
    return json.data;
  } catch (err) {
    return {
      farmHealthScore: 88,
      soilHealthIndex: 82,
      yieldProjections: [
        { crop: 'Rice (Paddy)', target: 5.0, estimated: 4.8, unit: 'tons/ha' },
        { crop: 'Wheat', target: 4.2, estimated: 4.3, unit: 'tons/ha' },
        { crop: 'Maize', target: 6.0, estimated: 6.2, unit: 'tons/ha' }
      ],
      humidityMoistureTrend: [
        { day: 'Mon', soilMoisture: 65, humidity: 62, rainfall: 0 },
        { day: 'Tue', soilMoisture: 72, humidity: 68, rainfall: 4 },
        { day: 'Wed', soilMoisture: 70, humidity: 55, rainfall: 0 },
        { day: 'Thu', soilMoisture: 85, humidity: 82, rainfall: 22 },
        { day: 'Fri', soilMoisture: 90, humidity: 88, rainfall: 35 },
        { day: 'Sat', soilMoisture: 80, humidity: 70, rainfall: 2 },
        { day: 'Sun', soilMoisture: 75, humidity: 60, rainfall: 0 }
      ],
      diseaseRiskMap: [
        { crop: 'Tomato', riskLevel: 'Moderate', primaryRisk: 'Early Blight' },
        { crop: 'Rice', riskLevel: 'Low', primaryRisk: 'Blast' },
        { crop: 'Wheat', riskLevel: 'Low', primaryRisk: 'Yellow Rust' }
      ],
      recentActivities: [
        { id: 'act_1', title: 'Soil Moisture & pH Scan', date: '2 hours ago', category: 'scout', status: 'completed' },
        { id: 'act_2', title: 'Drip Irrigation Cycle (20 mins)', date: 'Yesterday', category: 'irrigation', status: 'completed' },
        { id: 'act_3', title: 'Organic Neem Oil Foliar Spray', date: 'Tomorrow at 07:00 AM', category: 'pesticide', status: 'scheduled' }
      ]
    };
  }
}
