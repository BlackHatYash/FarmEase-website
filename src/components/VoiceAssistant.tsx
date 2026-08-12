import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { Language } from '../types';

interface VoiceAssistantProps {
  textToRead?: string;
  onVoiceInput?: (text: string) => void;
  language: Language;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const langCodes: Record<Language, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN'
};

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  textToRead,
  onVoiceInput,
  language,
  size = 'md',
  className = ''
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSupported(false);
    }
  }, []);

  const handleSpeak = () => {
    if (!textToRead || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel(); // Stop ongoing
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = langCodes[language] || 'en-US';
    utterance.rate = 0.9; // slightly slower for better farmer comprehension

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleListen = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is supported in Chrome, Edge, and modern browsers.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = langCodes[language] || 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (onVoiceInput && transcript) {
          onVoiceInput(transcript);
        }
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  if (!supported && !onVoiceInput) return null;

  const btnPadding = size === 'sm' ? 'px-2.5 py-1 text-xs' : size === 'lg' ? 'px-4 py-2.5 text-base' : 'px-3 py-1.5 text-sm';

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {textToRead && (
        <button
          type="button"
          onClick={handleSpeak}
          title={isSpeaking ? 'Stop reading' : 'Read aloud in your language'}
          className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-all shadow-xs ${
            isSpeaking
              ? 'bg-amber-600 text-white animate-pulse'
              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
          } ${btnPadding}`}
        >
          {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-700" />}
          <span>{isSpeaking ? 'Stop Audio' : 'Listen Aloud'}</span>
        </button>
      )}

      {onVoiceInput && (
        <button
          type="button"
          onClick={handleListen}
          title={isListening ? 'Listening...' : 'Speak your input'}
          className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-all shadow-xs ${
            isListening
              ? 'bg-red-600 text-white animate-bounce ring-2 ring-red-400 ring-offset-1'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300'
          } ${btnPadding}`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-600" />}
          <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
        </button>
      )}
    </div>
  );
};
