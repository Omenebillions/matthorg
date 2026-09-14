import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
  forceShow?: boolean;
}

export function SplashScreen({ onFinish, durationMs = 1500, forceShow = false }: SplashScreenProps) {
  const [isAnimating, setIsAnimating] = useState(() => {
    if (forceShow) return true;
    try {
      return !sessionStorage.getItem('matthorg_splash_shown');
    } catch {
      return true;
    }
  });
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!isAnimating) {
      if (onFinish) onFinish();
      return;
    }

    try {
      sessionStorage.setItem('matthorg_splash_shown', 'true');
    } catch {
      // ignore in restricted iframe
    }

    // Zoom-out phase finishes and screen fades into app
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, durationMs - 400);

    const finishTimer = setTimeout(() => {
      setIsAnimating(false);
      if (onFinish) onFinish();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onFinish, isAnimating]);

  if (!isAnimating) return null;

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsAnimating(false);
      if (onFinish) onFinish();
    }, 150);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#F4F7FB] transition-opacity duration-400 cursor-pointer select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      title="Tap anywhere to skip"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial from-blue-100/40 via-transparent to-transparent pointer-events-none" />

      <div className="relative flex flex-col items-center justify-center p-6 text-center z-10">
        {/* Prominent Logo Container with dynamic Zoom-Out animation */}
        <div
          className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-[38px] bg-white border border-[#E5E9F0] shadow-2xl p-3.5 flex items-center justify-center"
          style={{
            animation: 'matthorgLogoZoomOut 1.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            willChange: 'transform, opacity, filter',
          }}
        >
          <img
            src="/logo.png"
            alt="Matthorg"
            className="w-full h-full object-contain rounded-[28px]"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Subtle pulse ring around logo */}
          <div className="absolute inset-0 rounded-[38px] border-2 border-[#3D74D9]/30 animate-ping pointer-events-none" />
        </div>

        {/* Brand Reveal */}
        <div
          className="mt-7 flex flex-col items-center"
          style={{
            animation: 'matthorgTextFadeIn 1.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B192C]">
            Matthorg
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold tracking-wide text-[#5B6D85]">
            Quotations. Invoices. Follow Ups.
          </p>
        </div>

        {/* PWA / TWA Active Indicator */}
        <div
          className="mt-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E9F0] shadow-xs text-[11px] font-semibold text-[#0B192C]"
          style={{
            animation: 'matthorgTextFadeIn 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>PWA & TWA Ready • Offline Enabled</span>
        </div>
      </div>

      <style>{`
        @keyframes matthorgLogoZoomOut {
          0% {
            transform: scale(2.2);
            opacity: 0.15;
            filter: blur(10px);
          }
          35% {
            opacity: 1;
            filter: blur(0px);
          }
          75% {
            transform: scale(0.96);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes matthorgTextFadeIn {
          0% {
            opacity: 0;
            transform: translateY(16px);
          }
          40% {
            opacity: 0;
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
