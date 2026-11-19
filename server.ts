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
      const prompt = `You are a helpful farming advisor speaking directly to a farmer in simple, everyday language (no complex technical jargon).
Farm details:
- Location: ${location || 'Punjab, India'}
- Soil Type: ${soilType || 'Loamy'}
- Soil pH: ${soilPh || 6.5}
- Water Availability: ${waterAvailability || 'Medium'}
- Avg Temperature: ${temperature || 28}°C
- Season: ${season || 'Kharif'}
- Farm Size: ${farmSize || 2} acres
- Previous Crop: ${previousCrop || 'Wheat'}

Return a JSON object with:
- cropName (string, clear common crop name)
- suitabilityScore (number 70-98)
- expectedYield (string, e.g. "4.5 tons / hectare")
- growingDuration (string, e.g. "120-140 days")
- waterRequirement ("Low" | "Medium" | "High" | "Very High")
- estimatedProfitability (string, e.g. "High ($1,800 / hectare)")
- recommendedPlantingPeriod (string, e.g. "June - July")
- soilCompatibility (1 short plain sentence explaining why this soil works well)
- aiExplanation (2 short, friendly sentences explaining in simple words why this crop is a good choice for this land, water, and season)
- keyCareTips (array of 3 simple, step-by-step practical tips a farmer can follow right away)
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
    alluvial: { cropName: 'Basmati Rice (Paddy)', suitabilityScore: 94, expectedYield: '4.8 tons / hectare', growingDuration: '120–140 days', waterReq: 'High', profit: '$2,100 / hectare', period: 'June – July' },
    black: { cropName: 'Cotton & Soybean', suitabilityScore: 91, expectedYield: '2.5 tons / hectare', growingDuration: '150–180 days', waterReq: 'Medium', profit: '$1,950 / hectare', period: 'June – August' },
    red: { cropName: 'Groundnut & Pulses (Tur Dal)', suitabilityScore: 89, expectedYield: '2.2 tons / hectare', growingDuration: '105–120 days', waterReq: 'Medium', profit: '$1,600 / hectare', period: 'May – July' },
    clay: { cropName: 'Wheat & Mustard', suitabilityScore: 92, expectedYield: '4.2 tons / hectare', growingDuration: '130–150 days', waterReq: 'Medium', profit: '$1,750 / hectare', period: 'October – November' },
    sandy: { cropName: 'Pearl Millet (Bajra) & Sesame', suitabilityScore: 88, expectedYield: '1.8 tons / hectare', growingDuration: '80–90 days', waterReq: 'Low', profit: '$1,200 / hectare', period: 'July – August' },
    loamy: { cropName: 'Maize (Corn) & Green Gram', suitabilityScore: 95, expectedYield: '6.5 tons / hectare', growingDuration: '100–110 days', waterReq: 'Medium', profit: '$2,300 / hectare', period: 'June – July' }
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
      soilCompatibility: `Your ${soilType || 'Loamy'} soil holds nutrients well and matches this crop naturally.`,
      aiExplanation: `For ${location || 'your area'}, ${selected.cropName} is a strong match for ${soilType || 'Loamy'} soil and ${waterAvailability || 'medium'} water. Growing this after ${previousCrop || 'your last crop'} also helps keep your soil fertile.`,
      keyCareTips: [
        `Prepare the field well and sow seeds during ${selected.period} for strong early growth.`,
        `Water gently during flowering and grain filling, and avoid waterlogging the roots.`,
        `Check leaves once a week for early signs of pests or yellowing so you can treat them early.`
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
            text: `You are a helpful crop doctor speaking directly to a farmer in plain, simple everyday words (avoid dense scientific jargon). Look closely at this leaf or plant photo.
Crop type hint: ${cropHint || 'Unknown crop'}.

Return a JSON object:
{
  "diseaseName": "Simple disease name (e.g. 'Tomato Early Blight' or 'Healthy Plant')",
  "confidence": number between 80 and 99,
  "isHealthy": boolean,
  "visibleSymptoms": ["plain visual sign 1", "plain visual sign 2", "plain visual sign 3"],
  "possibleCauses": ["simple reason why it happened 1", "simple reason 2"],
  "recommendedTreatment": ["clear step 1 to treat right now", "clear step 2", "clear step 3"],
  "preventionTips": ["easy habit to prevent next season 1", "easy habit 2"]
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
            disclaimer: 'Note: This check is for guidance. If the problem spreads quickly across your field, show a leaf to your local Krishi Kendra or agriculture officer.',
            scannedAt: new Date().toISOString()
          }
        });
      }
    } catch (err) {
      console.error('Gemini disease detection error:', err);
    }
  }

  // Crop-aware plain-language fallback result when AI client is unconfigured/fails
  const hint = (cropHint || 'tomato').toLowerCase();
  const cropFallbackMap = {
    healthyRice: {
      diseaseName: 'Healthy Rice / Paddy Leaf',
      confidence: 96,
      isHealthy: true,
      visibleSymptoms: [
        'Rich green leaf color with no brown or yellow spots',
        'Firm, upright leaf blade with clean edges',
        'No powdery dust or sticky pest marks visible'
      ],
      possibleCauses: [
        'Good balanced water and sunlight in your field',
        'Healthy root growth and clean crop spacing'
      ],
      recommendedTreatment: [
        'No chemical spray is needed right now — your crop looks healthy',
        'Keep normal watering schedule and clear out nearby weeds',
        'Check lower leaves once a week after rain just to stay safe'
      ],
      preventionTips: [
        'Keep proper spacing between plants so fresh air moves through',
        'Avoid adding too much urea fertilizer at once'
      ]
    },
    corn: {
      diseaseName: 'Corn Common Rust',
      confidence: 91,
      isHealthy: false,
      visibleSymptoms: [
        'Small reddish-brown raised spots on both sides of the leaf',
        'Powdery rust dust rubs off when you touch the spots',
        'Leaves slowly turn yellow around the brown patches'
      ],
      possibleCauses: [
        'Cool, damp mornings and heavy dew sitting on leaves',
        'Wind blowing rust spores from nearby infected fields'
      ],
      recommendedTreatment: [
        'Remove heavily spotted bottom leaves if only a few plants are affected',
        'Ask your farm shop for a safe maize fungicide (Mancozeb or Azoxystrobin) and spray in dry morning weather',
        'Do not spray if rain is expected within the next 6 hours'
      ],
      preventionTips: [
        'Choose rust-resistant hybrid corn seeds for the next sowing',
        'Clear away old corn stalks after harvest before planting again'
      ]
    },
    wheat: {
      diseaseName: 'Wheat Yellow Rust',
      confidence: 91,
      isHealthy: false,
      visibleSymptoms: [
        'Bright yellow stripes running along the leaf length',
        'Yellow powder comes off on your fingers when touched',
        'Plants look weak and grains stay smaller than normal'
      ],
      possibleCauses: [
        'Cool humid mornings (10–15°C) and morning fog',
        'Fungus spores carried by wind from nearby fields'
      ],
      recommendedTreatment: [
        'Spray a recommended triazole fungicide (such as Propiconazole) early morning or evening',
        'Avoid giving extra nitrogen/urea while rust is active',
        'Check neighboring wheat plots every 3 days for new yellow patches'
      ],
      preventionTips: [
        'Sow rust-resistant wheat varieties next season',
        'Remove self-grown wheat plants before main sowing'
      ]
    },
    tomato: {
      diseaseName: 'Tomato Early Blight',
      confidence: 94,
      isHealthy: false,
      visibleSymptoms: [
        'Dark brown round spots with rings on older bottom leaves',
        'Yellow ring around each brown spot',
        'Bottom leaves dry up and fall off early'
      ],
      possibleCauses: [
        'Rainwater or sprinkler drops splashing soil germs onto lower leaves',
        'Warm humid weather keeping leaves wet for many hours'
      ],
      recommendedTreatment: [
        'Pluck off badly spotted bottom leaves and throw them away outside the field (do not put in compost)',
        'Water at the soil base using drip or furrow instead of wetting the leaves',
        'Spray Copper Oxychloride or Mancozeb as advised on the pack in calm morning weather'
      ],
      preventionTips: [
        'Cover soil around tomato roots with dry straw mulch to stop mud splash',
        'Do not plant tomatoes or potatoes in the same spot every year'
      ]
    }
  };

  let selectedDemo = cropFallbackMap.tomato;
  if (hint.includes('rice') || hint.includes('paddy')) {
    selectedDemo = cropFallbackMap.healthyRice;
  } else if (hint.includes('corn') || hint.includes('maize')) {
    selectedDemo = cropFallbackMap.corn;
  } else if (hint.includes('wheat')) {
    selectedDemo = cropFallbackMap.wheat;
  }

  return res.json({
    success: true,
    isLiveAi: false,
    data: {
      id: 'scan_' + Date.now(),
      imageUrl: imageBase64,
      cropName: cropHint || 'Crop',
      ...selectedDemo,
      disclaimer: 'Note: This check is for guidance. If the problem spreads quickly across your field, show a leaf to your local Krishi Kendra or agriculture officer.',
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
