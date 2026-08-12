import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Google GenAI client if API key exists
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Google GenAI SDK:', err);
  }
}

// 1. AI Crop Recommendation Endpoint
app.post('/api/crop-recommendation', async (req, res) => {
  const { location, soilType, soilPh, waterAvailability, temperature, season, farmSize, previousCrop } = req.body;

  if (aiClient) {
    try {
      const prompt = `You are an expert agronomist providing a precision agricultural crop recommendation.
Farmer parameters:
- Location: ${location || 'Punjab, India'}
- Soil Type: ${soilType || 'Loamy'}
- Soil pH: ${soilPh || 6.5}
- Water Availability: ${waterAvailability || 'Medium'}
- Avg Temperature: ${temperature || 28}°C
- Season: ${season || 'Kharif'}
- Farm Size: ${farmSize || 2} acres/hectares
- Previous Crop: ${previousCrop || 'Wheat'}

Return a JSON object with:
- cropName (string)
- suitabilityScore (number 70-98)
- expectedYield (string, e.g. "4.5 tons/hectare")
- growingDuration (string, e.g. "120-140 days")
- waterRequirement ("Low" | "Medium" | "High" | "Very High")
- estimatedProfitability (string, e.g. "High ($1,800/hectare)")
- recommendedPlantingPeriod (string, e.g. "June - July")
- soilCompatibility (string explanation)
- aiExplanation (detailed 2-3 sentence reason for choosing this crop for these specific soil/climate conditions)
- keyCareTips (array of 3 practical tips)
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cropName: { type: Type.STRING },
              suitabilityScore: { type: Type.NUMBER },
              expectedYield: { type: Type.STRING },
              growingDuration: { type: Type.STRING },
              waterRequirement: { type: Type.STRING },
              estimatedProfitability: { type: Type.STRING },
              recommendedPlantingPeriod: { type: Type.STRING },
              soilCompatibility: { type: Type.STRING },
              aiExplanation: { type: Type.STRING },
              keyCareTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['cropName', 'suitabilityScore', 'expectedYield', 'growingDuration', 'waterRequirement', 'estimatedProfitability', 'aiExplanation']
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({
          success: true,
          isLiveAi: true,
          data: {
            id: 'rec_' + Date.now(),
            ...parsed,
            createdAt: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Gemini crop recommendation error:', error);
    }
  }

  // Fallback smart algorithmic response when AI client is unconfigured/fails
  const mockCropsBySoil: Record<string, any> = {
    alluvial: { cropName: 'Rice (Paddy) / Basmati', suitabilityScore: 94, expectedYield: '4.8 tons/hectare', growingDuration: '120–140 days', waterReq: 'High', profit: '$2,100 / hectare', period: 'June – July' },
    black: { cropName: 'Cotton & Soybean', suitabilityScore: 91, expectedYield: '2.5 tons/hectare', growingDuration: '150–180 days', waterReq: 'Medium', profit: '$1,950 / hectare', period: 'June – August' },
    red: { cropName: 'Groundnut & Pulses', suitabilityScore: 89, expectedYield: '2.2 tons/hectare', growingDuration: '105–120 days', waterReq: 'Medium', profit: '$1,600 / hectare', period: 'May – July' },
    clay: { cropName: 'Wheat / Paddy', suitabilityScore: 92, expectedYield: '4.2 tons/hectare', growingDuration: '130–150 days', waterReq: 'Medium', profit: '$1,750 / hectare', period: 'October – November' },
    sandy: { cropName: 'Millets (Bajra) & Sesame', suitabilityScore: 88, expectedYield: '1.8 tons/hectare', growingDuration: '80–90 days', waterReq: 'Low', profit: '$1,200 / hectare', period: 'July – August' },
    loamy: { cropName: 'Maize (Corn) & Sugarcane', suitabilityScore: 95, expectedYield: '6.5 tons/hectare', growingDuration: '100–110 days', waterReq: 'Medium', profit: '$2,300 / hectare', period: 'June – July' }
  };

  const soilKey = (soilType || 'loamy').toLowerCase();
  const selected = Object.keys(mockCropsBySoil).find(k => soilKey.includes(k))
    ? mockCropsBySoil[Object.keys(mockCropsBySoil).find(k => soilKey.includes(k))!]
    : mockCropsBySoil['loamy'];

  return res.json({
    success: true,
    isLiveAi: false,
    data: {
      id: 'rec_' + Date.now(),
      cropName: selected.cropName,
      suitabilityScore: selected.suitabilityScore,
      expectedYield: selected.expectedYield,
      growingDuration: selected.growingDuration,
      waterRequirement: selected.waterReq,
      estimatedProfitability: selected.profit,
      recommendedPlantingPeriod: selected.period,
      soilCompatibility: `Selected crop thrives in ${soilType || 'Loamy'} soil with pH ${soilPh || 6.5}. Excellent nutrient retention.`,
      aiExplanation: `Based on your location (${location || 'Regional Zone'}), ${soilType || 'Loamy'} soil (pH ${soilPh || 6.5}) and ${waterAvailability || 'medium'} water supply, ${selected.cropName} provides optimal nitrogen balance following ${previousCrop || 'the previous crop cycle'}.`,
      keyCareTips: [
        `Maintain optimal field moisture during early tillering stage.`,
        `Apply balanced N-P-K (120:60:40) based on target yield.`,
        `Monitor regularly for stem borer and rust symptoms.`
      ],
      createdAt: new Date().toISOString()
    }
  });
});

// 2. AI Plant Disease Detection Endpoint
app.post('/api/detect-disease', async (req, res) => {
  const { imageBase64, cropHint } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image base64 string is required' });
  }

  // Extract pure base64
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: `Act as a senior plant pathologist. Analyze this leaf or plant image for diseases.
Possible Crop context: ${cropHint || 'Unknown crop'}.

Return a JSON object:
{
  "diseaseName": "Name of disease or 'Healthy Plant'",
  "confidence": number between 80 and 99,
  "isHealthy": boolean,
  "visibleSymptoms": ["symptom 1", "symptom 2", "symptom 3"],
  "possibleCauses": ["cause 1", "cause 2"],
  "recommendedTreatment": ["actionable treatment 1", "actionable treatment 2", "actionable treatment 3"],
  "preventionTips": ["tip 1", "tip 2"]
}`
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diseaseName: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              isHealthy: { type: Type.BOOLEAN },
              visibleSymptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
              possibleCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedTreatment: { type: Type.ARRAY, items: { type: Type.STRING } },
              preventionTips: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['diseaseName', 'confidence', 'isHealthy', 'visibleSymptoms', 'recommendedTreatment']
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({
          success: true,
          isLiveAi: true,
          data: {
            id: 'scan_' + Date.now(),
            imageUrl: imageBase64,
            cropName: cropHint || 'Crop',
            ...parsed,
            disclaimer: 'Disclaimer: AI diagnostic results are provided for guidance. Consult a qualified agricultural extension worker for severe crop issues.',
            scannedAt: new Date().toISOString()
          }
        });
      }
    } catch (err) {
      console.error('Gemini disease detection error:', err);
    }
  }

  // Fallback demo result
  const demoDiseases = [
    {
      diseaseName: 'Tomato Early Blight (Alternaria solani)',
      confidence: 94,
      isHealthy: false,
      visibleSymptoms: ['Concentric dark brown circular spots on lower leaves', 'Yellow halo surrounding leaf lesions', 'Premature leaf drop'],
      possibleCauses: ['High fungal spore presence in soil residues', 'Extended leaf wetness & warmth (24-29°C)', 'Poor crop air circulation'],
      recommendedTreatment: ['Remove and destroy severely affected leaves immediately', 'Apply Copper-based or Mancozeb fungicide according to package instructions', 'Avoid overhead sprinkler watering to keep foliage dry'],
      preventionTips: ['Practice 3-year crop rotation with non-solanaceous crops', 'Mulch soil around plant base to prevent soil splash', 'Ensure adequate plant spacing']
    },
    {
      diseaseName: 'Wheat Yellow Rust (Puccinia striiformis)',
      confidence: 91,
      isHealthy: false,
      visibleSymptoms: ['Linear yellow pustules along leaf veins', 'Powdery orange-yellow spores on upper leaf surface', 'Stunted plant growth'],
      possibleCauses: ['Cool humid weather conditions (10-15°C)', 'Airborne spore dispersal from neighboring fields', 'Susceptible crop variety'],
      recommendedTreatment: ['Apply systemic triazole fungicide (e.g. Propiconazole or Tebuconazole)', 'Ensure balanced nitrogen fertilization without over-dosing', 'Monitor surrounding crops daily'],
      preventionTips: ['Sow disease-resistant wheat varieties', 'Avoid excessive late-season nitrogen applications', 'Destroy volunteer wheat plants before sowing']
    }
  ];

  const selectedDemo = demoDiseases[Math.floor(Math.random() * demoDiseases.length)];

  return res.json({
    success: true,
    isLiveAi: false,
    data: {
      id: 'scan_' + Date.now(),
      imageUrl: imageBase64,
      cropName: cropHint || 'Crop',
      ...selectedDemo,
      disclaimer: 'Disclaimer: AI diagnostic results are provided for guidance. Consult a qualified agricultural extension worker for severe crop issues.',
      scannedAt: new Date().toISOString()
    }
  });
});

// 3. Weather Intelligence Endpoint
app.get('/api/weather', (req, res) => {
  const location = (req.query.location as string) || 'Punjab, India';

  const weatherData = {
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
      irrigation: 'Slight delay recommended. 35% rain chance in afternoon. Monitor soil moisture before watering.',
      spraying: 'Favorable morning conditions. Wind speed <15 km/h. Suitable for foliar spray before 11 AM.',
      diseaseRisk: 'Moderate fungal risk due to 68% humidity. Keep an eye on lower leaves for spot pathogens.',
      harvesting: 'Good conditions for field work. Clear dry window expected over the next 48 hours.'
    },
    forecast: [
      { day: 'Today', date: 'Aug 12', tempMax: 31, tempMin: 22, condition: 'Partly Cloudy', icon: 'sun-cloud', rainfallProbability: 35, humidity: 68, windSpeed: 12, agriculturalAdvice: 'Ideal for light weeding and soil testing.' },
      { day: 'Wed', date: 'Aug 13', tempMax: 33, tempMin: 23, condition: 'Sunny', icon: 'sun', rainfallProbability: 10, humidity: 55, windSpeed: 10, agriculturalAdvice: 'Great day for field irrigation and fertilizer application.' },
      { day: 'Thu', date: 'Aug 14', tempMax: 30, tempMin: 21, condition: 'Light Rain', icon: 'cloud-rain', rainfallProbability: 75, humidity: 82, windSpeed: 18, agriculturalAdvice: 'Delay spraying chemicals. Ensure field drainage channels are clear.' },
      { day: 'Fri', date: 'Aug 15', tempMax: 28, tempMin: 20, condition: 'Thunderstorm', icon: 'cloud-lightning', rainfallProbability: 85, humidity: 88, windSpeed: 22, agriculturalAdvice: 'High wind & heavy rain risk. Secure nursery shades and livestock.' },
      { day: 'Sat', date: 'Aug 16', tempMax: 29, tempMin: 21, condition: 'Clearing', icon: 'cloud-sun', rainfallProbability: 20, humidity: 70, windSpeed: 14, agriculturalAdvice: 'Inspect fields post-rain for waterlogging and leaf blight.' },
      { day: 'Sun', date: 'Aug 17', tempMax: 32, tempMin: 23, condition: 'Sunny', icon: 'sun', rainfallProbability: 5, humidity: 60, windSpeed: 11, agriculturalAdvice: 'Optimal conditions for solar drying and harvesting.' },
      { day: 'Mon', date: 'Aug 18', tempMax: 33, tempMin: 24, condition: 'Partly Cloudy', icon: 'sun-cloud', rainfallProbability: 15, humidity: 58, windSpeed: 9, agriculturalAdvice: 'Favorable for planting new seedlings.' }
    ]
  };

  res.json({ success: true, data: weatherData });
});

// 4. Farm Analytics Endpoint
app.get('/api/farm-analytics', (req, res) => {
  res.json({
    success: true,
    data: {
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
    }
  });
});

// Start Express Server with Vite integration
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FarmEase server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
