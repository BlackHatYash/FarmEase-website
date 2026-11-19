import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Camera,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Info,
  ShieldCheck,
  RotateCcw,
  Leaf,
  AlertCircle
} from 'lucide-react';
import { DiseaseScan, Language } from '../types';
import { translations } from '../lib/translations';
import { detectPlantDisease } from '../services/api';
import { VoiceAssistant } from './VoiceAssistant';
import tomatoBlightImg from '../assets/images/tomato_blight_leaf_1795064405537.jpg';

interface DiseaseDetectionViewProps {
  onSaveScan: (scan: DiseaseScan) => void;
  language: Language;
}

const CROP_OPTIONS = [
  'Tomato',
  'Wheat',
  'Rice (Paddy)',
  'Cotton',
  'Maize (Corn)',
  'Potato',
  'Sugarcane',
  'Other Plant'
];

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [brokenSamples, setBrokenSamples] = useState<Record<number, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please choose a photo file (JPG or PNG) of your leaf or plant.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      triggerAnalysis(base64, cropHint);
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

  const triggerAnalysis = async (base64Img: string, selectedCrop: string = cropHint) => {
    setLoading(true);
    setScanResult(null);
    setErrorMsg(null);

    try {
      const result = await detectPlantDisease(base64Img, selectedCrop);
      setScanResult(result.data);
      onSaveScan(result.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not check this photo right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    setErrorMsg(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.warn('Camera access error or restricted iframe permissions:', e);
      setCameraActive(false);
      setErrorMsg('Camera could not open here. Please tap the upload box above to choose a leaf photo from your phone or computer.');
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
        triggerAnalysis(dataUrl, cropHint);
        return;
      }
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const handleReset = () => {
    setScanResult(null);
    setImagePreview(null);
    setErrorMsg(null);
  };

  // Preset Leaf Samples for fast farmer testing
  const presetSamples = [
    {
      name: 'Tomato Blight',
      crop: 'Tomato',
      hint: 'Spots on leaf',
      url: tomatoBlightImg
    },
    {
      name: 'Corn Leaf Spot',
      crop: 'Maize (Corn)',
      hint: 'Rust example',
      url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=500&auto=format&fit=crop&q=80'
    },
    {
      name: 'Healthy Leaf',
      crop: 'Rice (Paddy)',
      hint: 'Healthy crop',
      url: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=500&auto=format&fit=crop&q=80'
    }
  ];

  const handleSampleClick = async (url: string, cropName: string) => {
    setCropHint(cropName);
    setImagePreview(url);
    setErrorMsg(null);

    try {
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        await triggerAnalysis(dataUrl, cropName);
        return;
      }
    } catch {
      // Fall back to direct URL if fetch/blob conversion fails
    }

    triggerAnalysis(url, cropName);
  };

  const speechText = scanResult
    ? `${scanResult.isHealthy ? 'Good news. Plant looks healthy.' : 'Problem found:'} ${scanResult.diseaseName}. What to look for: ${scanResult.visibleSymptoms.join('. ')}. ${
        scanResult.possibleCauses?.length ? `Why this happens: ${scanResult.possibleCauses.join('. ')}. ` : ''
      }Steps to treat: ${scanResult.recommendedTreatment.join('. ')}`
    : '';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Clean Farmer-Friendly Header */}
      <div className="bg-amber-900 text-white rounded-2xl p-6 sm:p-8 border border-amber-800">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold text-amber-200">
            {t.diseaseHeaderKicker}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {t.detectDiseaseTitle}
          </h1>
          <p className="text-amber-100 text-sm leading-relaxed">
            {t.diseaseDetectSubtitle}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left: 2-Step Upload & Crop Picker */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-stone-200 space-y-6">
          {/* Step 1: Pick Crop */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-stone-900">
              {t.diseaseStep1}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {CROP_OPTIONS.map((crop) => {
                const active = cropHint === crop;
                return (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => setCropHint(crop)}
                    className={`px-3 py-2.5 min-h-[42px] rounded-xl border text-xs sm:text-sm font-semibold text-left transition-colors cursor-pointer truncate ${
                      active
                        ? 'bg-amber-50 border-amber-600 text-amber-950 ring-1 ring-amber-600'
                        : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    {crop}
                  </button>
                );
              })}
            </div>
          </section>

          <hr className="border-stone-200" />

          {/* Step 2: Upload or Snap Leaf Photo */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-stone-900">
              {t.diseaseStep2}
            </h2>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {cameraActive ? (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] flex flex-col justify-end p-4">
                <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2.5 min-h-[44px] rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
                  >
                    {t.clearBtn}
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-6 py-2.5 min-h-[44px] rounded-xl bg-amber-400 text-stone-950 text-sm font-bold cursor-pointer"
                  >
                    {t.snapLeafPhoto}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-xl p-6 border-2 border-dashed text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[200px] ${
                  dragActive
                    ? 'border-amber-600 bg-amber-50'
                    : 'border-stone-300 hover:border-amber-500 hover:bg-stone-50'
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
                  <div className="space-y-2.5">
                    <img
                      src={imagePreview}
                      alt="Selected leaf preview"
                      referrerPolicy="no-referrer"
                      className="max-h-44 rounded-lg mx-auto border border-stone-300 object-cover"
                    />
                    <span className="text-xs font-semibold text-amber-800 block">
                      {t.changePhotoHint}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 mx-auto flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-900">{t.dragDropText}</p>
                      <p className="text-xs text-stone-600 mt-1">
                        {t.galleryPhotoHint}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!cameraActive && (
              <button
                type="button"
                onClick={startCamera}
                className="w-full py-3 px-4 min-h-[48px] rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>{t.takePhoto}</span>
              </button>
            )}
          </section>

          <hr className="border-stone-200" />

          {/* Sample Preset Leaf Images for Fast Testing */}
          <section className="space-y-2.5">
            <div>
              <div className="text-xs font-bold text-stone-800">
                {t.tryExampleTitle}
              </div>
              <p className="text-[11px] text-stone-500">
                {t.tryExampleSub}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {presetSamples.map((sample, idx) => (
                <button
                  key={sample.name}
                  type="button"
                  onClick={() => handleSampleClick(sample.url, sample.crop)}
                  className="rounded-xl overflow-hidden border border-stone-200 hover:border-amber-600 p-1.5 bg-stone-50 text-left transition-colors cursor-pointer"
                >
                  {brokenSamples[idx] ? (
                    <div className="w-full h-14 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                      <Leaf className="w-5 h-5" />
                    </div>
                  ) : (
                    <img
                      src={sample.url}
                      alt={sample.name}
                      referrerPolicy="no-referrer"
                      onError={() => setBrokenSamples(prev => ({ ...prev, [idx]: true }))}
                      className="w-full h-14 object-cover rounded-lg"
                    />
                  )}
                  <div className="text-[11px] font-bold text-stone-900 truncate mt-1.5">
                    {sample.crop}
                  </div>
                  <div className="text-[10px] text-stone-600 truncate">
                    {sample.hint}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Simple Farmer-Friendly Diagnostic Report */}
        <div className="lg:col-span-7 space-y-6">
          {!scanResult && !loading && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 space-y-6">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-amber-800">{t.photoTipsKicker}</p>
                <h3 className="text-xl font-bold text-stone-900">
                  {t.photoTipsHeading}
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {t.uploadPlantPhoto}
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="text-xs font-bold text-stone-900">{t.tip1Title}</div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {t.tip1Desc}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="text-xs font-bold text-stone-900">{t.tip2Title}</div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {t.tip2Desc}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="text-xs font-bold text-stone-900">{t.tip3Title}</div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {t.tip3Desc}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200 space-y-2 text-xs text-stone-700">
                <div className="font-bold text-stone-900">{t.reportIncludes}</div>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{t.healthyPlantLabel} / {t.needsCareLabel}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{t.whatToLookFor} · {t.whyThisHappens}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{t.howToTreat} · {t.howToPrevent}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-2xl p-10 text-center border border-stone-200 space-y-4">
              <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 mx-auto flex items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-stone-900">
                  {t.analyzingImage}
                </h3>
                <p className="text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
                  {cropHint}
                </p>
              </div>
            </div>
          )}

          {scanResult && !loading && (
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200 space-y-6">
              {/* Top Diagnostic Summary */}
              <div className="space-y-3 pb-5 border-b border-stone-200">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold">
                    {scanResult.isHealthy ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-800">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span>{t.healthyPlantLabel}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-red-800">
                        <AlertTriangle className="w-4 h-4 text-red-700" />
                        <span>{t.needsCareLabel}</span>
                      </span>
                    )}
                    <span className="text-stone-400" aria-hidden="true">·</span>
                    <span className="text-stone-700 tabular-nums">
                      {scanResult.confidence}% {t.confidenceLabel} ({scanResult.cropName || cropHint})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.scanAnotherLeaf}</span>
                  </button>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                  {scanResult.diseaseName}
                </h3>

                {/* Prominent Audio Read-Aloud */}
                <div>
                  <VoiceAssistant textToRead={speechText} language={language} />
                </div>
              </div>

              {/* 1. What to Look For (Visible Symptoms) */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>{t.whatToLookFor}</span>
                </h4>
                <ul className="space-y-2">
                  {scanResult.visibleSymptoms.map((sym, i) => (
                    <li key={i} className="text-sm text-stone-800 flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-2" aria-hidden="true" />
                      <span className="leading-relaxed">{sym}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 2. Why This Happens (Possible Causes) */}
              {scanResult.possibleCauses && scanResult.possibleCauses.length > 0 && (
                <div className="space-y-2.5 pt-4 border-t border-stone-200">
                  <h4 className="text-sm font-bold text-stone-900">
                    {t.whyThisHappens}
                  </h4>
                  <ul className="space-y-1.5">
                    {scanResult.possibleCauses.map((cause, i) => (
                      <li key={i} className="text-sm text-stone-700 flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0 mt-2" aria-hidden="true" />
                        <span className="leading-relaxed">{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 3. How to Treat It Step by Step */}
              <div className="space-y-3 pt-4 border-t border-stone-200">
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span>{t.howToTreat}</span>
                </h4>
                <ol className="space-y-2.5">
                  {scanResult.recommendedTreatment.map((treat, i) => (
                    <li key={i} className="text-sm text-stone-900 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{treat}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 4. How to Stop It Next Season */}
              {scanResult.preventionTips && scanResult.preventionTips.length > 0 && (
                <div className="space-y-2.5 pt-4 border-t border-stone-200">
                  <h4 className="text-sm font-bold text-stone-900">
                    {t.howToPrevent}
                  </h4>
                  <ul className="space-y-2">
                    {scanResult.preventionTips.map((tip, i) => (
                      <li key={i} className="text-sm text-stone-700 flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Simple Farmer Advisory Note */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 leading-relaxed flex items-start gap-3">
                <Info className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                <span>{scanResult.disclaimer || t.disclaimer}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
