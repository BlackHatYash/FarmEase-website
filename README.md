# 🌱 FarmEase - AI Digital Farming Assistant

An enterprise-grade, full-stack digital agricultural advisory platform powered by **React 19**, **TypeScript**, **Tailwind CSS v4**, **Express.js**, and **Google Gemini AI**. FarmEase empowers farmers with precision agronomic recommendations, instant multimodal plant disease diagnostics, micro-climate weather intelligence, and farm performance analytics.

---

## 🔐 Demo Login Credentials (GitHub Quick Access)

To test the application or evaluate the farmer experience, use the pre-configured accounts below or log in via mobile OTP:

### 1. Pre-Seeded Farmer Accounts

| Farmer Name | Mobile Number | Email Address | Password | Location | Farm Size | Soil Type |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Yash Shidruk** *(Default)* | `+91 98765 43210` | `yash.shidruk@farmease.app` | `farmease2026` | Mumbai, Maharashtra | 5.0 Acres | Loamy Alluvial |
| **Ramesh Kumar** | `+91 98220 11223` | `ramesh.kumar@farmease.app` | `farmease2026` | Nashik, Maharashtra | 12.5 Acres | Black Cotton (Regur) |
| **Sunita Patil** | `+91 94230 99887` | `sunita.patil@farmease.app` | `farmease2026` | Kolhapur, Maharashtra | 3.5 Acres | Red & Laterite |

> 💡 **Quick 1-Click Access**: On the **Farmer Login Portal**, you can click any of the **Quick Demo Profiles** at the bottom of the form to sign in instantly without typing.

---

### 2. Mobile OTP Sign-In (Kisan Fast Access)

- **Mobile Number**: Enter any valid 10-digit phone number (e.g. `9876543210`)
- **Universal Test OTP**: `8241`
- Or simply click the **"Auto-fill OTP (8241)"** button in the interface.

---

### 3. New Farmer Registration (Sign Up)

New farmers can register directly via the **"New Registration"** tab in the Login Portal:
- **Required fields**: Full Name, Mobile Number, Location/District, Plot Size (Acres), Soil Type, and Primary Crops.
- After submitting, the account is created and stored with custom regional soil metrics.
- **Client Persistence**: Newly registered accounts are persisted locally so they remain accessible across page refreshes and browser sessions.

---

### 4. Direct URLs & Deep Linking on GitHub Pages

When deployed to GitHub Pages or static hosting, you can jump directly to any view using URL hashes:
- **Sign Up Page**: `https://<username>.github.io/<repo>/#signup`
- **Login Portal**: `https://<username>.github.io/<repo>/#login`
- **Farm Dashboard**: `https://<username>.github.io/<repo>/#dashboard`
- **Crop Recommendations**: `https://<username>.github.io/<repo>/#crop-recommendation`
- **Disease Detection Doctor**: `https://<username>.github.io/<repo>/#disease-detection`
- **Weather Advisory**: `https://<username>.github.io/<repo>/#weather`

---

## 🌟 Core Features

- **🌾 AI Crop Recommendation Engine**: High-accuracy crop suggestions grounded in Nitrogen (N), Phosphorus (P), Potassium (K), Soil pH, annual rainfall, and regional climate.
- **🔬 AI Plant Pathology Doctor**: Upload leaf photographs or use your camera to get instant plant disease diagnosis, confidence score, pathogen classification, organic treatment recommendations, and chemical pesticide formulations.
- **🌤️ 7-Day Micro-Weather & Spray Advisories**: Hyper-local weather forecasting with rain probability, humidity metrics, wind speeds, and smart agricultural spray suitability flags.
- **📊 Farm Analytics & Crop Insights**: Visual yield distributions, soil nutrient balance charts, and historical diagnostic logs.
- **🗣️ Voice Agronomic Assistant**: Hands-free voice query support designed for outdoor field operation.
- **🌐 Multilingual Support**: Fully localized interface available in 6 regional languages:
  - English (`en`)
  - Hindi (`hi`)
  - Marathi (`mr`)
  - Tamil (`ta`)
  - Telugu (`te`)
  - Kannada (`kn`)

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Lucide Icons, Recharts
- **Backend**: Node.js, Express.js (`server.ts`), tsx, esbuild
- **AI / Vision**: Google Gemini API (`@google/genai`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or bun

### 1. Clone & Install
```bash
git clone https://github.com/shidrukyashh/farmease.git
cd farmease
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Provide your Gemini API key:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 3. Run in Development Mode
```bash
npm run dev
```
The application will start at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📄 License
MIT License. Built for farmers and agricultural innovation.
