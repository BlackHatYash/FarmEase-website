export type Language = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'kn';

export interface FarmerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  farmSize: number; // in acres/hectares
  farmSizeUnit: 'acres' | 'hectares';
  soilType: string;
  mainCrops: string[];
  language: Language;
  joinedDate: string;
}

export interface CropInput {
  location: string;
  soilType: string;
  soilPh: number;
  waterAvailability: 'low' | 'medium' | 'high' | 'irrigated';
  temperature: number; // in °C
  season: 'kharif' | 'rabi' | 'zaid' | 'monsoon' | 'winter' | 'summer' | 'year-round';
  farmSize: number;
  previousCrop: string;
  organicPreferred?: boolean;
}

export interface CropRecommendation {
  id: string;
  cropName: string;
  suitabilityScore: number; // 0 - 100%
  expectedYield: string; // e.g., "4.5 tons/hectare"
  growingDuration: string; // e.g., "120–150 days"
  waterRequirement: 'Low' | 'Medium' | 'High' | 'Very High';
  estimatedProfitability: string; // e.g., "High ($1,800 / hectare)"
  recommendedPlantingPeriod: string; // e.g., "June - July"
  soilCompatibility: string;
  aiExplanation: string;
  keyCareTips: string[];
  createdAt: string;
}

export interface DiseaseScan {
  id: string;
  imageUrl: string;
  cropName?: string;
  diseaseName: string;
  confidence: number; // 0 - 100%
  isHealthy: boolean;
  visibleSymptoms: string[];
  possibleCauses: string[];
  recommendedTreatment: string[];
  preventionTips: string[];
  disclaimer: string;
  scannedAt: string;
}

export interface WeatherDayForecast {
  day: string;
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  icon: string;
  rainfallProbability: number;
  humidity: number;
  windSpeed: number;
  agriculturalAdvice: string;
}

export interface WeatherData {
  location: string;
  currentTemp: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  rainfallProbability: number;
  windSpeed: number;
  uvIndex: number;
  soilTemperature: number;
  soilMoisture: number; // percentage
  farmingAdvice: {
    irrigation: string;
    spraying: string;
    diseaseRisk: string;
    harvesting: string;
  };
  forecast: WeatherDayForecast[];
}

export interface FarmActivity {
  id: string;
  title: string;
  date: string;
  category: 'irrigation' | 'fertilizer' | 'pesticide' | 'harvest' | 'scout';
  status: 'completed' | 'scheduled' | 'urgent';
  notes?: string;
}

export interface FarmAnalyticsData {
  farmHealthScore: number;
  soilHealthIndex: number;
  yieldProjections: {
    crop: string;
    target: number;
    estimated: number;
    unit: string;
  }[];
  humidityMoistureTrend: {
    day: string;
    soilMoisture: number;
    humidity: number;
    rainfall: number;
  }[];
  diseaseRiskMap: {
    crop: string;
    riskLevel: 'Low' | 'Moderate' | 'High';
    primaryRisk: string;
  }[];
  recentActivities: FarmActivity[];
}

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'warning' | 'info' | 'urgent';
  date: string;
}
