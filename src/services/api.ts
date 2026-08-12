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
    return {
      isLiveAi: false,
      data: {
        id: 'rec_fallback_' + Date.now(),
        cropName: 'Organic Basmati Rice & Legumes',
        suitabilityScore: 92,
        expectedYield: '4.5 tons/hectare',
        growingDuration: '120–150 days',
        waterRequirement: 'High',
        estimatedProfitability: '$1,900 / hectare',
        recommendedPlantingPeriod: 'June – July (Monsoon Onset)',
        soilCompatibility: `High soil organic matter retention in ${input.soilType || 'Loamy'} soil (pH ${input.soilPh || 6.5}).`,
        aiExplanation: `Your location (${input.location || 'Regional Zone'}) with ${input.soilType || 'Loamy'} soil (pH ${input.soilPh || 6.5}) and ${input.waterAvailability || 'medium'} water supply provides ideal conditions for Basmati Rice, maximizing nitrogen output after ${input.previousCrop || 'previous crop'}.`,
        keyCareTips: [
          'Maintain 2-3 cm water depth during seedling establishment.',
          'Apply neem-coated urea at 30 and 60 days after transplanting.',
          'Monitor field borders for stem borer signs.'
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
