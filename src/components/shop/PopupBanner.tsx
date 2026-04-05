"use client";

import { useState, useEffect } from "react";
import { useShopConfig } from "@/context/ShopConfigContext";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Link from "next/link";

export function PopupBanner() {
  const { config, loading } = useShopConfig();
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    if (loading || !config?.popupBanner?.show) return;

    const bannerConfig = config.popupBanner;
    const sessionKey = `popup-shown-${config.brand.name}`;
    const wasShownThisSession = sessionStorage.getItem(sessionKey);

    // Check if should show (respect showOncePerSession setting)
    if (bannerConfig.showOncePerSession && wasShownThisSession) {
      return;
    }

    // Show after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
      setHasBeenShown(true);
      if (bannerConfig.showOncePerSession) {
        sessionStorage.setItem(sessionKey, "true");
      }
    }, bannerConfig.autoShowDelay || 0);

    return () => clearTimeout(timer);
  }, [config, loading]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (loading || !config?.popupBanner?.show || !isVisible) return null;

  const { popupBanner, brand } = config;
  const positionClass = popupBanner.position === 'center' 
    ? 'fixed inset-0 flex items-center justify-center z-50 bg-black/50'
    : `fixed bottom-4 ${popupBanner.position === 'bottom-left' ? 'left-4' : 'right-4'} z-50`;

  const bannerStyle = popupBanner.position === 'center'
    ? { backgroundColor: popupBanner.backgroundColor, color: popupBanner.textColor }
    : { backgroundColor: popupBanner.backgroundColor, color: popupBanner.textColor };

  return (
    <div className={positionClass}>
      <div 
        className={`relative p-6 rounded-2xl shadow-2xl max-w-md ${
          popupBanner.position === 'center' ? 'mx-4' : ''
        }`}
        style={bannerStyle}
      >
        {/* Close Button */}
        {popupBanner.canClose && (
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Content */}
        <div className="pr-8">
          <h3 className="text-xl font-semibold mb-2">{popupBanner.title}</h3>
          <p className="mb-4 opacity-90">{popupBanner.message}</p>
          
          <div className="flex gap-3">
            <Link href={popupBanner.buttonLink}>
              <Button 
                className="hover:opacity-90"
                style={{ 
                  backgroundColor: 'white', 
                  color: popupBanner.backgroundColor 
                }}
              >
                {popupBanner.buttonText}
              </Button>
            </Link>
            {popupBanner.canClose && (
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="border-white text-white hover:bg-white/20"
              >
                Maybe Later
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
