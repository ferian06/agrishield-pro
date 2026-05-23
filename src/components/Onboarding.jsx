import React, { useState } from 'react';

const SLIDES = [
  {
    emoji: '🌿',
    title: 'Welcome to GreenGuild AI',
    subtitle: 'AI-powered crop health for every farmer',
    body: 'Scan your crops, detect diseases early, and connect with farmers worldwide — all from your phone.',
    bg: 'from-forest-mid to-green-800',
  },
  {
    emoji: '📷',
    title: 'Scan Any Crop Instantly',
    subtitle: 'CropSense AI Disease Detection',
    body: 'Point your camera at a leaf and get a real AI diagnosis in seconds. Works with tomatoes, corn, rice, cassava and 14 more crops.',
    bg: 'from-emerald-700 to-forest-mid',
  },
  {
    emoji: '🌍',
    title: 'Learn from Fellow Farmers',
    subtitle: 'Guild Feed Community',
    body: 'Share your findings, post photos of disease outbreaks, and help other farmers in your region stay one step ahead.',
    bg: 'from-green-800 to-teal-700',
  },
  {
    emoji: '⛅',
    title: 'Weather & Treatment Guide',
    subtitle: 'Resource Hub',
    body: 'Live weather data tells you when disease risk is high. Treatment protocols give you exact dosages for chemical and organic options.',
    bg: 'from-teal-700 to-forest-mid',
  },
];

export default function Onboarding({ onDone }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const next = () => {
    if (isLast) { onDone(); return; }
    setIndex(i => i + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md mx-4">
        <div className={`bg-gradient-to-br ${slide.bg} rounded-[32px] p-8 text-white text-center shadow-2xl`}>

          {/* Emoji */}
          <div className="text-6xl mb-6">{slide.emoji}</div>

          {/* Text */}
          <p className="text-[10px] font-bold text-green-300 uppercase tracking-widest mb-2">{slide.subtitle}</p>
          <h2 className="font-syne font-extrabold text-2xl leading-tight mb-4">{slide.title}</h2>
          <p className="text-sm text-green-100 leading-relaxed mb-8">{slide.body}</p>

          {/* Dots */}
          <div className="flex justify-center gap-2 mb-8">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`rounded-full transition-all ${
                  i === index ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {!isLast && (
              <button
                onClick={onDone}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white/60 border border-white/20"
              >
                Skip
              </button>
            )}
            <button
              onClick={next}
              className="flex-1 bg-white text-forest-mid py-3 rounded-2xl text-sm font-extrabold shadow-lg active:scale-[0.97] transition-transform"
            >
              {isLast ? 'Get Started' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
