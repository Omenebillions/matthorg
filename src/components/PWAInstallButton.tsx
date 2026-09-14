import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className={`inline-flex items-center gap-2 rounded-xl bg-[#0B192C] hover:bg-[#152744] font-bold text-white shadow-md shadow-[#0B192C]/20 active:scale-95 transition ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
        }`}
        title="Install Mathorg App on your device"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-ios-install-btn"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 rounded-xl border border-[#E5E9F0] bg-[#F4F7FB] text-[#0B192C] hover:bg-[#E8EEF5] active:scale-95 transition ${
            compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs font-semibold'
          }`}
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#5B6D85]" />
          <span>Add to Home</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white border border-[#E5E9F0] p-6 shadow-2xl text-[#0B192C]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0B192C]/10 text-[#0B192C] flex items-center justify-center font-bold text-sm">
                    M
                  </div>
                  <h3 className="text-base font-bold text-[#0B192C]">Install Mathorg</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-[#5B6D85] hover:text-[#0B192C] p-1 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-[#5B6D85] leading-relaxed mb-4">
                Install Mathorg on your iPhone or iPad for instant 1-tap quote and invoice generation:
              </p>
              <ol className="text-xs text-[#5B6D85] space-y-2.5 mb-6 list-decimal pl-4">
                <li>Tap the <strong>Share</strong> button in the Safari bottom toolbar.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top right corner.</li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-[#0B192C] hover:bg-[#152744] py-2.5 text-sm font-bold text-white transition shadow-md shadow-[#0B192C]/20"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      id="offline-banner"
      className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/95 backdrop-blur-md px-4 py-2.5 text-xs font-medium text-slate-950 shadow-xl border border-amber-400/50"
    >
      <span className="h-2.5 w-2.5 rounded-full bg-slate-950 animate-pulse" />
      <span><strong>Offline Mode</strong> — Working locally. Quotes & documents will sync once reconnected.</span>
    </div>
  );
};
