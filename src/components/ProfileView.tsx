import React, { useState } from 'react';
import { User, MapPin, Ruler, Sprout, Globe, Check, LogOut, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';
import { FarmerProfile, Language } from '../types';
import { translations, languageNames } from '../lib/translations';

interface ProfileViewProps {
  user: FarmerProfile;
  onUpdateUser: (updated: FarmerProfile) => void;
  onLogout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  onLogout,
  language,
  setLanguage
}) => {
  const t = translations[language] || translations.en;

  const [name, setName] = useState(user.name);
  const [location, setLocation] = useState(user.location);
  const [farmSize, setFarmSize] = useState(user.farmSize.toString());
  const [mainCrops, setMainCrops] = useState(user.mainCrops.join(', '));
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: FarmerProfile = {
      ...user,
      name,
      location,
      farmSize: parseFloat(farmSize) || 1,
      mainCrops: mainCrops.split(',').map(s => s.trim())
    };
    onUpdateUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-green-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-emerald-950 font-black text-2xl flex items-center justify-center border-2 border-emerald-300 shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{user.name}</h1>
            <p className="text-xs text-emerald-200 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{user.location} • {user.farmSize} {user.farmSizeUnit}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-xl bg-red-900/60 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.logout}</span>
        </button>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        {/* Form Details */}
        <div className="md:col-span-8 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 space-y-6">
          <h2 className="text-lg font-extrabold text-stone-900">
            Edit Farmer & Farm Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Farmer Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Location / Region
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Farm Size (Acres)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Main Crops Grown
              </label>
              <input
                type="text"
                value={mainCrops}
                onChange={(e) => setMainCrops(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Profile Saved!</span>
                  </>
                ) : (
                  <span>Update Farm Profile</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Profile Card Summary */}
        <div className="md:col-span-4 space-y-4">
          <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200 space-y-4">
            <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">
              Registration Meta
            </h3>

            <div className="space-y-3 text-xs text-stone-700">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>{user.phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Member since {new Date(user.joinedDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-200 text-xs text-emerald-950 space-y-2">
            <div className="font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>AI Data Privacy Guaranteed</span>
            </div>
            <p className="leading-relaxed">
              Your farm details, soil pH records, and leaf images are kept secure for tailored local crop recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
