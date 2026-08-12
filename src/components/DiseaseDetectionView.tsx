import React, { useState, useRef } from 'react';
import { Stethoscope, UploadCloud, Camera, CheckCircle, AlertTriangle, RefreshCw, Sparkles, Loader2, Info, ShieldAlert, Volume2 } from 'lucide-react';
import { DiseaseScan, Language } from '../types';
import { translations } from '../lib/translations';
import { detectPlantDisease } from '../services/api';
import { VoiceAssistant } from './VoiceAssistant';

interface DiseaseDetectionViewProps {
  onSaveScan: (scan: DiseaseScan) => void;
  language: Language;
}

export const DiseaseDetectionView: React.FC<DiseaseDetectionViewProps> = ({
  onSaveScan,
  language
}) => {
  const t = translations[language] || translations.en;

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cropHint, setCropHint] = useState<string>('Tomato');
  const [loading, setLoading] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<DiseaseScan | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid leaf or plant image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      triggerAnalysis(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerAnalysis = async (base64Img: string) => {
    setLoading(true);
    setScanResult(null);

    try {
      const result = await detectPlantDisease(base64Img, cropHint);
      setScanResult(result.data);
      onSaveScan(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mobile/Web Camera Capture Simulator / Real Stream
  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.warn('Camera access error or restricted iframe permissions, fallback enabled:', e);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImagePreview(dataUrl);
        stopCamera();
        triggerAnalysis(dataUrl);
        return;
      }
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
    }
    setCameraActive(false);
  };

  // Preset Leaf Samples for fast farmer testing
  const presetSamples = [
    {
      name: 'Tomato Blight Sample',
      crop: 'Tomato',
      url: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?w=500&auto=format&fit=crop&q=80'
    },
    {
      name: 'Corn Rust Sample',
      crop: 'Corn/Maize',
      url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=500&auto=format&fit=crop&q=80'
    },
    {
      name: 'Healthy Leaf Sample',
      crop: 'Rice/Paddy',
      url: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=500&auto=format&fit=crop&q=80'
    }
  ];

  const handleSampleClick = (url: string, cropName: string) => {
    setCropHint(cropName);
    setImagePreview(url);
    triggerAnalysis(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-950 to-amber-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-700">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-800 text-amber-200 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> AI Vision Diagnostics
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {t.detectDiseaseTitle}
          </h1>
          <p className="text-amber-100 text-xs sm:text-sm max-w-xl">
            Upload or snap a leaf photo to identify diseases, visible symptoms, organic treatments, and prevention tips.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Upload & Controls Column */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-5">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Select Crop Type (Optional Context)
            </label>
            <select
              value={cropHint}
              onChange={(e) => setCropHint(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white cursor-pointer"
            >
              <option value="Tomato">Tomato</option>
              <option value="Wheat">Wheat</option>
              <option value="Rice (Paddy)">Rice (Paddy)</option>
              <option value="Cotton">Cotton</option>
              <option value="Maize (Corn)">Maize (Corn)</option>
              <option value="Sugarcane">Sugarcane</option>
              <option value="Potato">Potato</option>
              <option value="Other / General Plant">Other Plant</option>
            </select>
          </div>

          {/* Camera View */}
          {cameraActive ? (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square flex flex-col justify-end p-4">
              <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
              <div className="relative z-10 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-amber-950 text-xs font-extrabold shadow-lg"
                >
                  Snap Photo
                </button>
              </div>
            </div>
          ) : (
            /* Drag & Drop Box */
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-2xl p-8 border-2 border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                dragActive
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-stone-300 hover:border-amber-400 hover:bg-stone-50/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-44 rounded-xl mx-auto border border-stone-300 shadow-sm object-cover"
                  />
                  <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-3 py-1 rounded-full inline-block">
                    Click to change photo
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-800">{t.dragDropText}</p>
                    <p className="text-[11px] text-stone-500 mt-1">PNG, JPG, JPEG up to 10MB</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Camera Button */}
          {!cameraActive && (
            <button
              type="button"
              onClick={startCamera}
              className="w-full py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-extrabold flex items-center justify-center gap-2 border border-stone-300 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4 text-amber-700" />
              <span>{t.takePhoto}</span>
            </button>
          )}

          {/* Sample Preset Leaf Images for Fast Demo */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Or test with sample images:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {presetSamples.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSampleClick(sample.url, sample.crop)}
                  className="group rounded-xl overflow-hidden border border-stone-200 hover:border-amber-500 p-1 bg-stone-50 text-left transition-all cursor-pointer"
                >
                  <img src={sample.url} alt={sample.name} className="w-full h-12 object-cover rounded-lg" />
                  <div className="text-[10px] font-extrabold text-stone-800 truncate mt-1">
                    {sample.crop}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Diagnostic Output Column */}
        <div className="lg:col-span-7 space-y-6">
          {!scanResult && !loading && (
            <div className="bg-stone-50 rounded-3xl p-10 text-center border border-dashed border-stone-300 space-y-3">
              <div className="text-4xl">🍃</div>
              <h3 className="text-lg font-bold text-stone-800">
                Awaiting Leaf Image Scan
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                {t.uploadPlantPhoto} to begin AI plant disease diagnosis.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-3xl p-10 text-center border border-amber-200 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center animate-spin">
                <Loader2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-amber-950">
                {t.analyzingImage}
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Comparing leaf lesions, spots, and discoloration with agricultural plant pathology databases.
              </p>
            </div>
          )}

          {scanResult && !loading && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-amber-300 space-y-6 animate-in fade-in slide-in-from-bottom-3">
              {/* Disease Name & Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      scanResult.isHealthy
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {scanResult.isHealthy ? 'Healthy Plant' : 'Diseased Plant'}
                    </span>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      {scanResult.confidence}% Confidence
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-stone-900 mt-2">
                    {scanResult.diseaseName}
                  </h3>
                </div>

                <VoiceAssistant
                  textToRead={`Disease Detected: ${scanResult.diseaseName}. Confidence ${scanResult.confidence} percent. Symptoms include ${scanResult.visibleSymptoms.join(', ')}. Recommended treatment: ${scanResult.recommendedTreatment.join(', ')}.`}
                  language={language}
                />
              </div>

              {/* Visible Symptoms */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  {t.symptoms}
                </h4>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {scanResult.visibleSymptoms.map((sym, i) => (
                    <li key={i} className="text-xs text-stone-700 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{sym}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Treatment */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  {t.recommendedTreatment}
                </h4>
                <div className="space-y-2">
                  {scanResult.recommendedTreatment.map((treat, i) => (
                    <div key={i} className="text-xs text-emerald-950 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-medium flex items-start gap-2.5">
                      <span className="font-extrabold text-emerald-700">{i + 1}.</span>
                      <span>{treat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prevention Tips */}
              {scanResult.preventionTips && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-sky-600" />
                    {t.preventionTips}
                  </h4>
                  <ul className="space-y-1">
                    {scanResult.preventionTips.map((tip, i) => (
                      <li key={i} className="text-xs text-stone-600 flex items-start gap-2">
                        <span className="text-sky-600 font-bold">✓</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Agricultural Disclaimer Box */}
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-[11px] text-amber-900 leading-relaxed flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <span>{scanResult.disclaimer}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
